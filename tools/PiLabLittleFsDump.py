#!/usr/bin/env python3
r"""
PiLabLittleFsDump.py
====================

Read-only LittleFS dump/backup tool for the PiLab ESP32-P4 PLC.

What it does:
  - Connects to the PiLab HTTP API.
  - Recursively walks LittleFS using /api/files/list?path=...
  - Downloads files using /api/files/download?path=...
  - Recreates the folder tree locally under Private/littlefs_dumps/.
  - Writes a manifest, JSON summary, CSV file list, and text report.

Usage:
  python .\PiLabLittleFsDump.py --host 192.168.5.210
  python .\tools\PiLabLittleFsDump.py --host http://192.168.5.210
  python .\PiLabLittleFsDump.py --host 192.168.5.210 --remote-path /scripts
  python .\PiLabLittleFsDump.py --host 192.168.5.210 --zip

Default behavior is read-only. It does not upload, delete, or modify files.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import os
import pathlib
import re
import sys
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from dataclasses import dataclass, asdict
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

DEFAULT_HOST = "192.168.5.210"
DEFAULT_TIMEOUT = 8.0
USER_AGENT = "PiLabLittleFsDump/1.0"


@dataclass
class RemoteEntry:
    name: str
    path: str
    is_dir: bool
    size: int = 0


@dataclass
class DumpedFile:
    remote_path: str
    local_path: str
    size_expected: Optional[int]
    size_actual: int
    sha256: str
    elapsed_ms: float
    status: str
    message: str = ""


@dataclass
class SkippedEntry:
    remote_path: str
    reason: str


def find_project_root() -> pathlib.Path:
    here = pathlib.Path(__file__).resolve().parent
    candidates = [pathlib.Path.cwd().resolve(), here, here.parent]
    for base in candidates:
        cur = base
        for _ in range(8):
            if (cur / ".git").exists() or ((cur / "main").exists() and (cur / "tools").exists()):
                return cur
            if cur.parent == cur:
                break
            cur = cur.parent
    return pathlib.Path.cwd().resolve()


def normalize_base_url(host: str) -> str:
    h = (host or "").strip()
    if not h:
        raise ValueError("host cannot be empty")
    if not h.startswith(("http://", "https://")):
        h = "http://" + h
    return h.rstrip("/")


def normalize_remote_path(path: str) -> str:
    p = (path or "/").strip()
    if not p.startswith("/"):
        p = "/" + p
    # Collapse repeated slashes except root.
    p = re.sub(r"/+", "/", p)
    if len(p) > 1:
        p = p.rstrip("/")
    return p


def safe_relative_path(remote_path: str) -> pathlib.Path:
    """Convert a LittleFS absolute path to a safe local relative path."""
    p = normalize_remote_path(remote_path).lstrip("/")
    if not p:
        return pathlib.Path(".")
    parts: List[str] = []
    for raw in p.split("/"):
        # Keep names readable, but prevent traversal and Windows-invalid characters.
        part = raw.strip().replace("\x00", "")
        part = part.replace("..", "__")
        part = re.sub(r'[<>:"|?*]', "_", part)
        part = part.rstrip(". ") or "_"
        parts.append(part)
    return pathlib.Path(*parts)


def http_get_bytes(base_url: str, path: str, timeout: float) -> Tuple[int, Dict[str, str], bytes, float]:
    url = base_url + path
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read()
            elapsed = (time.perf_counter() - start) * 1000.0
            return int(resp.getcode()), dict(resp.headers), body, elapsed
    except urllib.error.HTTPError as e:
        body = e.read() if e.fp else b""
        elapsed = (time.perf_counter() - start) * 1000.0
        return int(e.code), dict(e.headers), body, elapsed


def get_json(base_url: str, api_path: str, timeout: float) -> Any:
    status, headers, body, _ = http_get_bytes(base_url, api_path, timeout)
    if status != 200:
        preview = body[:200].decode("utf-8", errors="replace")
        raise RuntimeError(f"GET {api_path} returned HTTP {status}: {preview}")
    try:
        return json.loads(body.decode("utf-8", errors="replace"))
    except Exception as e:
        preview = body[:240].decode("utf-8", errors="replace")
        raise RuntimeError(f"GET {api_path} did not return valid JSON: {e}; body={preview!r}")


def list_dir(base_url: str, remote_path: str, timeout: float) -> List[RemoteEntry]:
    encoded = urllib.parse.quote(normalize_remote_path(remote_path), safe="")
    data = get_json(base_url, f"/api/files/list?path={encoded}", timeout)
    if not isinstance(data, dict):
        raise RuntimeError(f"files list for {remote_path} was not a JSON object")
    entries = data.get("entries")
    if not isinstance(entries, list):
        raise RuntimeError(f"files list for {remote_path} missing entries[]")

    out: List[RemoteEntry] = []
    for ent in entries:
        if not isinstance(ent, dict):
            continue
        name = str(ent.get("name", ""))
        path = str(ent.get("path", "")) or (normalize_remote_path(remote_path).rstrip("/") + "/" + name)
        is_dir = bool(ent.get("dir", False))
        size_raw = ent.get("size", 0)
        size = int(size_raw) if isinstance(size_raw, (int, float)) and not isinstance(size_raw, bool) else 0
        if name in (".", ".."):
            continue
        out.append(RemoteEntry(name=name, path=normalize_remote_path(path), is_dir=is_dir, size=size))
    return out


def should_skip(remote_path: str, skip_patterns: Sequence[str]) -> Optional[str]:
    rp = normalize_remote_path(remote_path)
    for pattern in skip_patterns:
        if not pattern:
            continue
        # Treat pattern as simple case-insensitive substring/glob-ish text.
        pat = pattern.lower().replace("*", "")
        if pat and pat in rp.lower():
            return f"matched skip pattern {pattern!r}"
    return None


def walk_littlefs(base_url: str, start_path: str, timeout: float, skip_patterns: Sequence[str], max_files: Optional[int]) -> Tuple[List[RemoteEntry], List[SkippedEntry]]:
    files: List[RemoteEntry] = []
    skipped: List[SkippedEntry] = []
    seen_dirs = set()

    def walk_dir(path: str) -> None:
        nonlocal files, skipped
        path = normalize_remote_path(path)
        if path in seen_dirs:
            return
        seen_dirs.add(path)

        reason = should_skip(path, skip_patterns)
        if reason and path != normalize_remote_path(start_path):
            skipped.append(SkippedEntry(path, reason))
            return

        entries = list_dir(base_url, path, timeout)
        for ent in entries:
            reason = should_skip(ent.path, skip_patterns)
            if reason:
                skipped.append(SkippedEntry(ent.path, reason))
                continue
            if ent.is_dir:
                walk_dir(ent.path)
            else:
                files.append(ent)
                if max_files is not None and len(files) >= max_files:
                    raise StopIteration

    try:
        walk_dir(start_path)
    except StopIteration:
        skipped.append(SkippedEntry("<walk stopped>", f"max file limit reached: {max_files}"))
    return files, skipped


def download_file(base_url: str, entry: RemoteEntry, files_root: pathlib.Path, timeout: float, dry_run: bool = False) -> DumpedFile:
    rel = safe_relative_path(entry.path)
    local_path = files_root / rel

    if dry_run:
        return DumpedFile(entry.path, str(local_path), entry.size, 0, "", 0.0, "DRYRUN", "not downloaded")

    local_path.parent.mkdir(parents=True, exist_ok=True)
    encoded = urllib.parse.quote(normalize_remote_path(entry.path), safe="")
    start = time.perf_counter()
    try:
        status, headers, body, elapsed = http_get_bytes(base_url, f"/api/files/download?path={encoded}", timeout)
        if status != 200:
            preview = body[:160].decode("utf-8", errors="replace")
            return DumpedFile(entry.path, str(local_path), entry.size, 0, "", elapsed, "FAIL", f"HTTP {status}: {preview}")
        local_path.write_bytes(body)
        sha = hashlib.sha256(body).hexdigest()
        msg = "ok"
        status_text = "PASS"
        if entry.size is not None and entry.size >= 0 and len(body) != entry.size:
            status_text = "WARN"
            msg = f"downloaded size {len(body)} does not match listed size {entry.size}"
        return DumpedFile(entry.path, str(local_path), entry.size, len(body), sha, elapsed, status_text, msg)
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000.0
        return DumpedFile(entry.path, str(local_path), entry.size, 0, "", elapsed, "FAIL", f"{type(e).__name__}: {e}")


def write_reports(report_dir: pathlib.Path, base_url: str, remote_root: str, files: List[RemoteEntry], dumped: List[DumpedFile], skipped: List[SkippedEntry], args: argparse.Namespace, started: dt.datetime) -> None:
    report_dir.mkdir(parents=True, exist_ok=True)
    total_bytes = sum(d.size_actual for d in dumped if d.status in ("PASS", "WARN"))
    pass_count = sum(1 for d in dumped if d.status == "PASS")
    warn_count = sum(1 for d in dumped if d.status == "WARN")
    fail_count = sum(1 for d in dumped if d.status == "FAIL")

    summary = {
        "tool": "PiLabLittleFsDump.py",
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "started_at": started.isoformat(timespec="seconds"),
        "base_url": base_url,
        "remote_root": remote_root,
        "report_dir": str(report_dir),
        "files_dir": str(report_dir / "files"),
        "dry_run": bool(args.dry_run),
        "timeout_seconds": args.timeout,
        "counts": {
            "discovered_files": len(files),
            "download_pass": pass_count,
            "download_warn": warn_count,
            "download_fail": fail_count,
            "skipped": len(skipped),
            "downloaded_bytes": total_bytes,
        },
        "dumped_files": [asdict(d) for d in dumped],
        "skipped_entries": [asdict(s) for s in skipped],
    }
    (report_dir / "littlefs_dump_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    with (report_dir / "littlefs_manifest.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["status", "remote_path", "local_path", "size_expected", "size_actual", "sha256", "elapsed_ms", "message"])
        for d in dumped:
            w.writerow([d.status, d.remote_path, d.local_path, d.size_expected, d.size_actual, d.sha256, f"{d.elapsed_ms:.3f}", d.message])

    with (report_dir / "littlefs_skipped.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["remote_path", "reason"])
        for s in skipped:
            w.writerow([s.remote_path, s.reason])

    lines: List[str] = []
    lines.append("PiLab LittleFS Dump Report")
    lines.append("==========================")
    lines.append("")
    lines.append(f"Generated:     {summary['generated_at']}")
    lines.append(f"Base URL:      {base_url}")
    lines.append(f"Remote root:   {remote_root}")
    lines.append(f"Report dir:    {report_dir}")
    lines.append(f"Files dir:     {report_dir / 'files'}")
    lines.append(f"Dry run:       {args.dry_run}")
    lines.append("")
    lines.append("Summary")
    lines.append("-------")
    lines.append(f"Discovered files: {len(files)}")
    lines.append(f"Downloaded PASS:  {pass_count}")
    lines.append(f"Downloaded WARN:  {warn_count}")
    lines.append(f"Downloaded FAIL:  {fail_count}")
    lines.append(f"Skipped entries:  {len(skipped)}")
    lines.append(f"Downloaded bytes: {total_bytes}")
    lines.append("")
    lines.append("Downloaded Files")
    lines.append("----------------")
    for d in dumped:
        lines.append(f"[{d.status}] {d.remote_path}")
        lines.append(f"  Local: {d.local_path}")
        lines.append(f"  Size:  {d.size_actual} bytes  Expected: {d.size_expected}")
        if d.sha256:
            lines.append(f"  SHA256: {d.sha256}")
        if d.message:
            lines.append(f"  Message: {d.message}")
        lines.append("")
    if skipped:
        lines.append("Skipped Entries")
        lines.append("---------------")
        for s in skipped:
            lines.append(f"{s.remote_path}: {s.reason}")
        lines.append("")
    (report_dir / "littlefs_dump_report.txt").write_text("\n".join(lines), encoding="utf-8")


def make_zip(report_dir: pathlib.Path) -> pathlib.Path:
    zip_path = report_dir.with_suffix(".zip")
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in report_dir.rglob("*"):
            if path.is_file():
                zf.write(path, path.relative_to(report_dir.parent))
    return zip_path


def print_help_examples() -> None:
    print("Examples:")
    print("  python .\\PiLabLittleFsDump.py --host 192.168.5.210")
    print("  python .\\PiLabLittleFsDump.py --host 192.168.5.210 --remote-path /scripts")
    print("  python .\\PiLabLittleFsDump.py --host 192.168.5.210 --zip")
    print("  python .\\PiLabLittleFsDump.py --host 192.168.5.210 --dry-run")


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Dump/backup files from PiLab LittleFS via the HTTP API. Read-only.",
        epilog="Output goes to Private/littlefs_dumps/PiLabLittleFS_<timestamp>/ by default.",
    )
    parser.add_argument("--host", default=DEFAULT_HOST, help=f"Device host/IP or URL. Default: {DEFAULT_HOST}")
    parser.add_argument("--remote-path", default="/", help="Remote LittleFS folder to dump. Default: /")
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT, help=f"HTTP timeout per request in seconds. Default: {DEFAULT_TIMEOUT}")
    parser.add_argument("--project-root", help="Optional project root override. Normally auto-detected.")
    parser.add_argument("--output-dir", help="Optional output folder. Default: Private/littlefs_dumps/PiLabLittleFS_<timestamp>")
    parser.add_argument("--skip", action="append", default=[], help="Skip remote paths containing this text. Can be repeated.")
    parser.add_argument("--max-files", type=int, default=None, help="Maximum number of files to dump. Useful for testing.")
    parser.add_argument("--dry-run", action="store_true", help="Walk/list files but do not download them.")
    parser.add_argument("--zip", action="store_true", help="Also create a zip archive of the dump/report folder.")
    parser.add_argument("--open-report", action="store_true", help="Open the text report after completion on Windows.")
    args = parser.parse_args(argv)

    started = dt.datetime.now()
    project_root = pathlib.Path(args.project_root).resolve() if args.project_root else find_project_root()
    if args.output_dir:
        report_dir = pathlib.Path(args.output_dir).resolve()
    else:
        stamp = started.strftime("%Y-%m-%d_%H-%M-%S")
        report_dir = project_root / "Private" / "littlefs_dumps" / f"PiLabLittleFS_{stamp}"
    files_root = report_dir / "files"
    files_root.mkdir(parents=True, exist_ok=True)

    base = normalize_base_url(args.host)
    remote_root = normalize_remote_path(args.remote_path)

    print("PiLab LittleFS Dump")
    print("===================")
    print(f"Project root: {project_root}")
    print(f"Base URL:     {base}")
    print(f"Remote root:  {remote_root}")
    print(f"Report dir:   {report_dir}")
    print(f"Read-only:    True")
    print(f"Dry run:      {args.dry_run}")
    if args.skip:
        print(f"Skip rules:   {', '.join(args.skip)}")
    print("")

    try:
        print("==> Walking LittleFS tree")
        remote_files, skipped = walk_littlefs(base, remote_root, args.timeout, args.skip, args.max_files)
        print(f"    Found {len(remote_files)} file(s); skipped {len(skipped)} entrie(s)")

        dumped: List[DumpedFile] = []
        if not remote_files:
            print("    No files found.")
        else:
            print("==> Downloading files" if not args.dry_run else "==> Dry-run file listing")
            for idx, entry in enumerate(remote_files, start=1):
                d = download_file(base, entry, files_root, args.timeout, dry_run=args.dry_run)
                dumped.append(d)
                size_text = f"{d.size_actual} B" if not args.dry_run else f"listed {entry.size} B"
                print(f"[{d.status:6}] {idx:4}/{len(remote_files):4} {size_text:>12}  {entry.path}")
                if d.status == "FAIL":
                    print(f"        {d.message}")

        write_reports(report_dir, base, remote_root, remote_files, dumped, skipped, args, started)

        zip_path: Optional[pathlib.Path] = None
        if args.zip:
            print("==> Creating zip archive")
            zip_path = make_zip(report_dir)
            print(f"    {zip_path}")

        pass_count = sum(1 for d in dumped if d.status == "PASS")
        warn_count = sum(1 for d in dumped if d.status == "WARN")
        fail_count = sum(1 for d in dumped if d.status == "FAIL")
        total_bytes = sum(d.size_actual for d in dumped if d.status in ("PASS", "WARN"))

        print("")
        print("Summary")
        print("-------")
        print(f"Files discovered: {len(remote_files)}")
        print(f"PASS: {pass_count}  WARN: {warn_count}  FAIL: {fail_count}  SKIPPED: {len(skipped)}")
        print(f"Downloaded bytes: {total_bytes}")
        print(f"Files folder:     {files_root}")
        print(f"Report:           {report_dir / 'littlefs_dump_report.txt'}")
        print(f"Manifest CSV:     {report_dir / 'littlefs_manifest.csv'}")
        print(f"Summary JSON:     {report_dir / 'littlefs_dump_summary.json'}")
        if zip_path:
            print(f"Zip archive:      {zip_path}")

        if args.open_report and os.name == "nt":
            os.startfile(str(report_dir / "littlefs_dump_report.txt"))  # type: ignore[attr-defined]

        return 2 if fail_count else 0
    except Exception as e:
        print("")
        print(f"ERROR: {type(e).__name__}: {e}")
        print("")
        print_help_examples()
        return 99


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nInterrupted.")
        raise SystemExit(130)
    except Exception:
        traceback.print_exc()
        raise SystemExit(99)
