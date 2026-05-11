#!/usr/bin/env python3
"""
PiLab API smoke test utility.

Runs from either the repo root or the tools/ folder. It probes the ESP32-P4
browser/API server, prints a terminal summary, and writes reports under:

    Private/api_test_reports/PiLabApiSmoke_<timestamp>/

Default mode is read-only. Add --write-tests to exercise LittleFS mkdir/upload/view/download/delete.
"""

from __future__ import annotations

import argparse
import csv
import datetime as _dt
import hashlib
import json
import os
import pathlib
import sys
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple

DEFAULT_HOST = "192.168.5.210"
DEFAULT_TIMEOUT = 5.0


@dataclass
class HttpResult:
    method: str
    url: str
    status: Optional[int]
    elapsed_ms: float
    headers: Dict[str, str]
    body: bytes
    error: str = ""

    @property
    def text(self) -> str:
        try:
            return self.body.decode("utf-8", errors="replace")
        except Exception:
            return ""

    @property
    def content_type(self) -> str:
        return self.headers.get("content-type", self.headers.get("Content-Type", ""))


@dataclass
class CheckResult:
    name: str
    method: str
    path: str
    status: str
    http_status: Optional[int]
    elapsed_ms: float
    message: str
    content_type: str = ""
    body_len: int = 0
    details: Dict[str, Any] = field(default_factory=dict)


def find_project_root() -> pathlib.Path:
    here = pathlib.Path(__file__).resolve().parent
    candidates = [pathlib.Path.cwd().resolve(), here, here.parent]
    for base in candidates:
        p = base
        for _ in range(5):
            if (p / ".git").exists() or ((p / "main").exists() and (p / "tools").exists()):
                return p
            if p.parent == p:
                break
            p = p.parent
    return pathlib.Path.cwd().resolve()


def report_dir(project_root: pathlib.Path) -> pathlib.Path:
    stamp = _dt.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    out = project_root / "Private" / "api_test_reports" / f"PiLabApiSmoke_{stamp}"
    out.mkdir(parents=True, exist_ok=True)
    return out


def base_url(host: str) -> str:
    h = host.strip()
    if not h.startswith("http://") and not h.startswith("https://"):
        h = "http://" + h
    return h.rstrip("/")


def http_request(base: str, method: str, path: str, body: Optional[bytes] = None,
                 headers: Optional[Dict[str, str]] = None, timeout: float = DEFAULT_TIMEOUT) -> HttpResult:
    url = base + path
    req = urllib.request.Request(url, data=body, method=method.upper())
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    start = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
            elapsed = (time.perf_counter() - start) * 1000.0
            return HttpResult(method, url, int(resp.status), elapsed, dict(resp.headers), data)
    except urllib.error.HTTPError as e:
        data = e.read() if e.fp else b""
        elapsed = (time.perf_counter() - start) * 1000.0
        return HttpResult(method, url, int(e.code), elapsed, dict(e.headers), data, error=str(e))
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000.0
        return HttpResult(method, url, None, elapsed, {}, b"", error=f"{type(e).__name__}: {e}")


def parse_json(text: str) -> Tuple[Optional[Any], str]:
    try:
        return json.loads(text or "null"), ""
    except Exception as e:
        return None, str(e)


def keys_present(obj: Any, keys: Iterable[str]) -> Tuple[bool, str]:
    if not isinstance(obj, dict):
        return False, "response is not a JSON object"
    missing = [k for k in keys if k not in obj]
    if missing:
        return False, "missing keys: " + ", ".join(missing)
    return True, ""


def classify(ok: bool, warn: bool = False) -> str:
    if ok:
        return "WARN" if warn else "PASS"
    return "FAIL"


def validate_json_endpoint(result: HttpResult, required_keys: Iterable[str] = (), allow_503: bool = False) -> Tuple[str, str, Dict[str, Any]]:
    if result.status is None:
        return "FAIL", result.error or "connection failed", {}
    if result.status == 503 and allow_503:
        return "WARN", "HTTP 503 accepted for transient/cache-warmup endpoint", {"body_preview": result.text[:200]}
    if result.status != 200:
        return "FAIL", f"expected HTTP 200, got {result.status}: {result.text[:160]}", {}
    obj, err = parse_json(result.text)
    if err:
        return "FAIL", f"invalid JSON: {err}", {"body_preview": result.text[:200]}
    ok, msg = keys_present(obj, required_keys)
    if not ok:
        return "FAIL", msg, {"json_type": type(obj).__name__}
    summary: Dict[str, Any] = {"json_type": type(obj).__name__}
    if isinstance(obj, dict):
        summary["keys"] = sorted(list(obj.keys()))[:40]
    return "PASS", "valid JSON", summary


def validate_text_endpoint(result: HttpResult, expected_status: int = 200, contains: Optional[str] = None) -> Tuple[str, str, Dict[str, Any]]:
    if result.status is None:
        return "FAIL", result.error or "connection failed", {}
    if result.status != expected_status:
        return "FAIL", f"expected HTTP {expected_status}, got {result.status}: {result.text[:160]}", {}
    if contains and contains not in result.text:
        return "FAIL", f"response did not contain expected text: {contains!r}", {"body_preview": result.text[:200]}
    return "PASS", "valid response", {"body_preview": result.text[:120]}


def run_check(base: str, name: str, method: str, path: str,
              validator: Callable[[HttpResult], Tuple[str, str, Dict[str, Any]]],
              body: Optional[bytes] = None, headers: Optional[Dict[str, str]] = None,
              timeout: float = DEFAULT_TIMEOUT) -> CheckResult:
    result = http_request(base, method, path, body=body, headers=headers, timeout=timeout)
    status, message, details = validator(result)
    return CheckResult(
        name=name,
        method=method.upper(),
        path=path,
        status=status,
        http_status=result.status,
        elapsed_ms=result.elapsed_ms,
        message=message,
        content_type=result.content_type,
        body_len=len(result.body),
        details=details,
    )


def standard_checks() -> List[Tuple[str, str, str, Callable[[HttpResult], Tuple[str, str, Dict[str, Any]]]]]:
    return [
        ("SPA index", "GET", "/", lambda r: validate_text_endpoint(r, contains="<")),
        ("SPA /script route", "GET", "/script", lambda r: validate_text_endpoint(r, contains="<")),
        ("SPA /hmi route", "GET", "/hmi", lambda r: validate_text_endpoint(r, contains="<")),
        ("SPA /tags route", "GET", "/tags", lambda r: validate_text_endpoint(r, contains="<")),
        ("SPA /files route", "GET", "/files", lambda r: validate_text_endpoint(r, contains="<")),
        ("Asset app.js", "GET", "/assets/app.js", lambda r: validate_text_endpoint(r)),
        ("Asset index.css", "GET", "/assets/index.css", lambda r: validate_text_endpoint(r)),
        ("API status", "GET", "/api/status", lambda r: validate_json_endpoint(r, ["device", "status", "ip"])),
        ("API PLC mode", "GET", "/api/plc_mode", lambda r: validate_json_endpoint(r, ["ok", "running", "mode", "flash_writes_allowed"])),
        ("API system overview", "GET", "/api/system_overview", lambda r: validate_json_endpoint(r, ["device", "project", "plc_mode", "uptime_ms", "heap_free"])),
        ("API command center", "GET", "/api/command_center", lambda r: validate_json_endpoint(r, ["overview", "plc", "script"])),
        ("API script status", "GET", "/api/script_status", lambda r: validate_json_endpoint(r)),
        ("API PLC IO", "GET", "/api/plc_io", lambda r: validate_json_endpoint(r)),
        ("API PLC data", "GET", "/api/plc_data", lambda r: validate_json_endpoint(r, allow_503=True)),
        ("API tags", "GET", "/api/tags", lambda r: validate_json_endpoint(r)),
        ("API files list root", "GET", "/api/files/list?path=%2F", lambda r: validate_json_endpoint(r, ["path", "entries"])),
        ("API large status", "GET", "/api/large_status", lambda r: validate_json_endpoint(r)),
    ]


def get_plc_mode(base: str, timeout: float) -> Tuple[Optional[dict], Optional[CheckResult]]:
    c = run_check(base, "API PLC mode precheck", "GET", "/api/plc_mode",
                  lambda r: validate_json_endpoint(r, ["ok", "running", "mode", "flash_writes_allowed"]), timeout=timeout)
    if c.status != "PASS":
        return None, c
    raw = http_request(base, "GET", "/api/plc_mode", timeout=timeout)
    obj, _ = parse_json(raw.text)
    return obj if isinstance(obj, dict) else None, c


def write_tests(base: str, timeout: float, stop_plc: bool = False) -> List[CheckResult]:
    results: List[CheckResult] = []
    mode, mode_check = get_plc_mode(base, timeout)
    if mode_check:
        results.append(mode_check)
    if not mode:
        return results

    was_running = bool(mode.get("running"))
    flash_ok = bool(mode.get("flash_writes_allowed"))
    if was_running and stop_plc:
        results.append(run_check(base, "Set PLC STOP for write tests", "POST", "/api/plc_mode?run=0",
                                 lambda r: validate_json_endpoint(r, ["ok", "running", "mode", "flash_writes_allowed"]), timeout=timeout))
        flash_ok = True
    elif not flash_ok:
        results.append(CheckResult(
            name="Write tests skipped",
            method="POST",
            path="/api/files/*",
            status="WARN",
            http_status=None,
            elapsed_ms=0,
            message="PLC is RUNNING; flash write tests skipped. Use --stop-plc to stop PLC temporarily.",
        ))
        return results

    folder = "/diagnostics"
    fname = f"{folder}/pilab_api_smoke_test.txt"
    payload = f"PiLab API smoke test { _dt.datetime.now().isoformat() }\n".encode("utf-8")
    enc_folder = urllib.parse.quote(folder, safe="")
    enc_file = urllib.parse.quote(fname, safe="")

    results.append(run_check(base, "LittleFS mkdir diagnostics", "POST", f"/api/files/mkdir?path={enc_folder}",
                             lambda r: validate_json_endpoint(r, ["ok"]), timeout=timeout))
    results.append(run_check(base, "LittleFS upload test file", "POST", f"/api/files/upload?path={enc_file}",
                             lambda r: validate_json_endpoint(r, ["ok", "bytes"]),
                             body=payload, headers={"Content-Type": "text/plain"}, timeout=timeout))
    results.append(run_check(base, "LittleFS view test file", "GET", f"/api/files/view?path={enc_file}",
                             lambda r: validate_text_endpoint(r, contains="PiLab API smoke test"), timeout=timeout))
    results.append(run_check(base, "LittleFS download test file", "GET", f"/api/files/download?path={enc_file}",
                             lambda r: validate_text_endpoint(r, contains="PiLab API smoke test"), timeout=timeout))
    results.append(run_check(base, "LittleFS delete test file", "POST", f"/api/files/delete?path={enc_file}",
                             lambda r: validate_json_endpoint(r, ["ok"]), timeout=timeout))
    # Delete folder too. This should succeed once file is gone, but warn on failure rather than failing the whole test.
    folder_delete = run_check(base, "LittleFS delete diagnostics folder", "POST", f"/api/files/delete?path={enc_folder}",
                              lambda r: validate_json_endpoint(r, ["ok"]), timeout=timeout)
    if folder_delete.status == "FAIL":
        folder_delete.status = "WARN"
        folder_delete.message = "folder cleanup warning: " + folder_delete.message
    results.append(folder_delete)

    if was_running and stop_plc:
        results.append(run_check(base, "Restore PLC RUN after write tests", "POST", "/api/plc_mode?run=1",
                                 lambda r: validate_json_endpoint(r, ["ok", "running", "mode", "flash_writes_allowed"]), timeout=timeout))
    return results


def print_result(c: CheckResult) -> None:
    marker = {"PASS": "[PASS]", "WARN": "[WARN]", "FAIL": "[FAIL]"}.get(c.status, "[????]")
    http = "----" if c.http_status is None else str(c.http_status)
    print(f"{marker} {c.name:<32} {c.method:<4} {http:>4} {c.elapsed_ms:7.1f} ms  {c.path}")
    if c.status != "PASS":
        print(f"       {c.message}")


def write_reports(out: pathlib.Path, args: argparse.Namespace, base: str, results: List[CheckResult]) -> None:
    summary = {
        "generated_at": _dt.datetime.now().isoformat(),
        "base_url": base,
        "timeout_seconds": args.timeout,
        "write_tests": bool(args.write_tests),
        "stop_plc": bool(args.stop_plc),
        "counts": {
            "PASS": sum(1 for r in results if r.status == "PASS"),
            "WARN": sum(1 for r in results if r.status == "WARN"),
            "FAIL": sum(1 for r in results if r.status == "FAIL"),
            "TOTAL": len(results),
        },
        "results": [r.__dict__ for r in results],
    }
    (out / "api_smoke_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")

    with (out / "api_smoke_results.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["status", "name", "method", "path", "http_status", "elapsed_ms", "body_len", "content_type", "message"])
        for r in results:
            w.writerow([r.status, r.name, r.method, r.path, r.http_status, f"{r.elapsed_ms:.1f}", r.body_len, r.content_type, r.message])

    lines: List[str] = []
    lines.append("PiLab API Smoke Test Report")
    lines.append("===========================")
    lines.append("")
    lines.append(f"Generated:    {summary['generated_at']}")
    lines.append(f"Base URL:     {base}")
    lines.append(f"Write tests:  {args.write_tests}")
    lines.append(f"Stop PLC:     {args.stop_plc}")
    lines.append("")
    counts = summary["counts"]
    lines.append(f"PASS: {counts['PASS']}  WARN: {counts['WARN']}  FAIL: {counts['FAIL']}  TOTAL: {counts['TOTAL']}")
    lines.append("")
    for r in results:
        lines.append(f"[{r.status}] {r.name}")
        lines.append(f"  {r.method} {r.path}")
        lines.append(f"  HTTP: {r.http_status}  Time: {r.elapsed_ms:.1f} ms  Bytes: {r.body_len}")
        lines.append(f"  Content-Type: {r.content_type}")
        lines.append(f"  Message: {r.message}")
        if r.details:
            lines.append(f"  Details: {json.dumps(r.details, ensure_ascii=False)[:800]}")
        lines.append("")
    (out / "api_smoke_report.txt").write_text("\n".join(lines), encoding="utf-8")


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="PiLab ESP32-P4 API smoke test utility")
    parser.add_argument("--host", default=DEFAULT_HOST, help=f"Device host/IP or URL. Default: {DEFAULT_HOST}")
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT, help="HTTP timeout per request in seconds")
    parser.add_argument("--write-tests", action="store_true", help="Run LittleFS write/read/delete tests. Default is read-only.")
    parser.add_argument("--stop-plc", action="store_true", help="If PLC is RUNNING, temporarily STOP it for write tests and restore RUN after.")
    parser.add_argument("--no-large", action="store_true", help="Skip /api/large_status")
    args = parser.parse_args(argv)

    project_root = find_project_root()
    out = report_dir(project_root)
    base = base_url(args.host)

    print("PiLab API Smoke Test")
    print("====================")
    print(f"Project root: {project_root}")
    print(f"Base URL:     {base}")
    print(f"Report dir:   {out}")
    print("")

    results: List[CheckResult] = []
    checks = standard_checks()
    if args.no_large:
        checks = [c for c in checks if c[2] != "/api/large_status"]

    for name, method, path, validator in checks:
        c = run_check(base, name, method, path, validator, timeout=args.timeout)
        results.append(c)
        print_result(c)

    if args.write_tests:
        print("")
        print("==> Running optional LittleFS write tests")
        for c in write_tests(base, args.timeout, stop_plc=args.stop_plc):
            results.append(c)
            print_result(c)

    write_reports(out, args, base, results)

    pass_count = sum(1 for r in results if r.status == "PASS")
    warn_count = sum(1 for r in results if r.status == "WARN")
    fail_count = sum(1 for r in results if r.status == "FAIL")

    print("")
    print("Summary")
    print("-------")
    print(f"PASS: {pass_count}  WARN: {warn_count}  FAIL: {fail_count}  TOTAL: {len(results)}")
    print(f"Report: {out / 'api_smoke_report.txt'}")
    print(f"JSON:   {out / 'api_smoke_summary.json'}")
    print(f"CSV:    {out / 'api_smoke_results.csv'}")

    return 1 if fail_count else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nInterrupted.")
        raise SystemExit(130)
    except Exception:
        traceback.print_exc()
        raise SystemExit(2)
