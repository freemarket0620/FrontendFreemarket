#!/usr/bin/env python3
r"""
PiLab API Deep Check

Read-only validation tool for the PiLab ESP32-P4 PLC web/API surface.

What it does:
  - Finds the PiLab project root even when run from tools/.
  - Probes SPA routes, static assets, and read-only API endpoints.
  - Validates JSON shape, required keys, and basic value types.
  - Performs cross-endpoint consistency checks.
  - Writes a timestamped report folder under Private/api_deep_reports/.

Example:
  python .\tools\PiLabApiDeepCheck.py --host 192.168.5.210
  python .\PiLabApiDeepCheck.py --host http://192.168.5.210 --timeout 5

Default behavior is read-only. It does not upload scripts, toggle outputs, create files,
or change PLC mode.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import json
import os
import re
import socket
import sys
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Tuple


JsonObj = Dict[str, Any]
Validator = Callable[["ResponseRecord", Optional[Any]], List[str]]


@dataclass
class CheckSpec:
    name: str
    method: str
    path: str
    expected_status: int = 200
    expected_content_type: Optional[str] = None
    body_contains: Sequence[str] = field(default_factory=tuple)
    json_expected: bool = False
    required_keys: Sequence[str] = field(default_factory=tuple)
    optional_keys: Sequence[str] = field(default_factory=tuple)
    validators: Sequence[Validator] = field(default_factory=tuple)
    max_warn_ms: Optional[float] = None
    max_fail_ms: Optional[float] = None


@dataclass
class ResponseRecord:
    name: str
    method: str
    path: str
    url: str
    status_code: Optional[int]
    elapsed_ms: float
    ok: bool
    severity: str
    content_type: str = ""
    bytes_received: int = 0
    sha256_16: str = ""
    error: str = ""
    warnings: List[str] = field(default_factory=list)
    failures: List[str] = field(default_factory=list)
    json_data: Optional[Any] = None
    body_preview: str = ""


# -----------------------------
# Project/report helpers
# -----------------------------


def find_project_root(start: Optional[Path] = None) -> Path:
    """Find repo/project root by walking up from this script/current directory."""
    candidates: List[Path] = []
    if start is not None:
        candidates.append(start.resolve())
    candidates.append(Path(__file__).resolve().parent)
    candidates.append(Path.cwd().resolve())

    markers = [".git", "main", "Web", "CMakeLists.txt"]

    for base in candidates:
        cur = base
        while True:
            if (cur / ".git").exists() or ((cur / "main").exists() and (cur / "CMakeLists.txt").exists()):
                return cur
            if cur.parent == cur:
                break
            cur = cur.parent

    return Path.cwd().resolve()


def ensure_report_dir(project_root: Path) -> Path:
    stamp = dt.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    report_dir = project_root / "Private" / "api_deep_reports" / f"PiLabApiDeep_{stamp}"
    report_dir.mkdir(parents=True, exist_ok=True)
    return report_dir


def normalize_base_url(host: str) -> str:
    host = host.strip()
    if not host:
        raise ValueError("Host cannot be empty")
    if not host.startswith(("http://", "https://")):
        host = "http://" + host
    return host.rstrip("/")


def safe_json_dump(data: Any) -> str:
    return json.dumps(data, indent=2, sort_keys=True, ensure_ascii=False)


def type_name(value: Any) -> str:
    if isinstance(value, bool):
        return "bool"
    if isinstance(value, int) and not isinstance(value, bool):
        return "int"
    if isinstance(value, float):
        return "float"
    if isinstance(value, str):
        return "str"
    if isinstance(value, list):
        return "list"
    if isinstance(value, dict):
        return "dict"
    if value is None:
        return "null"
    return type(value).__name__


def require_type(obj: JsonObj, key: str, expected: Tuple[type, ...]) -> List[str]:
    if key not in obj:
        return [f"missing key: {key}"]
    val = obj[key]
    if not isinstance(val, expected):
        names = ", ".join(t.__name__ for t in expected)
        return [f"key {key!r} expected {names}, got {type_name(val)}"]
    return []


def require_number(obj: JsonObj, key: str, minimum: Optional[float] = None) -> List[str]:
    errs: List[str] = []
    if key not in obj:
        return [f"missing key: {key}"]
    val = obj[key]
    if not isinstance(val, (int, float)) or isinstance(val, bool):
        return [f"key {key!r} expected number, got {type_name(val)}"]
    if minimum is not None and val < minimum:
        errs.append(f"key {key!r} expected >= {minimum}, got {val}")
    return errs


# -----------------------------
# Endpoint validators
# -----------------------------


def validate_status(record: ResponseRecord, data: Optional[Any]) -> List[str]:
    if not isinstance(data, dict):
        return ["status response is not a JSON object"]
    errors: List[str] = []
    for key in ("device", "status", "ethernet", "ip"):
        errors += require_type(data, key, (str,))
    if data.get("device") != "ESP32-P4":
        errors.append(f"device expected ESP32-P4, got {data.get('device')!r}")
    if data.get("status") != "running":
        errors.append(f"status expected running, got {data.get('status')!r}")
    return errors


def validate_plc_mode(record: ResponseRecord, data: Optional[Any]) -> List[str]:
    if not isinstance(data, dict):
        return ["PLC mode response is not a JSON object"]
    errors: List[str] = []
    errors += require_type(data, "ok", (bool,))
    errors += require_type(data, "running", (bool,))
    errors += require_type(data, "mode", (str,))
    errors += require_type(data, "flash_writes_allowed", (bool,))
    if data.get("mode") not in ("RUN", "STOP"):
        errors.append(f"mode expected RUN or STOP, got {data.get('mode')!r}")
    if isinstance(data.get("running"), bool) and isinstance(data.get("flash_writes_allowed"), bool):
        if data["flash_writes_allowed"] == data["running"]:
            errors.append("flash_writes_allowed should normally be the inverse of running")
    return errors


def validate_overview_like(data: Any, label: str = "overview") -> List[str]:
    if not isinstance(data, dict):
        return [f"{label} is not a JSON object"]
    errors: List[str] = []
    for key in ("device", "project", "status", "plc_mode", "ip", "active_script_name", "active_script_path"):
        errors += require_type(data, key, (str,))
    for key in ("plc_running", "flash_writes_allowed"):
        errors += require_type(data, key, (bool,))
    for key in (
        "uptime_ms", "script_generation", "script_state", "tag_count", "tick_count",
        "script_scan_count", "output_write_count", "raw_di_mask", "di_mask", "do_mask",
        "cache_period_ms", "cache_version", "cache_points", "cache_bytes",
        "cache_build_us", "heap_free", "heap_internal_free", "heap_psram_free",
        "plc_work_avg_us",
    ):
        errors += require_number(data, key, 0)
    if data.get("device") != "ESP32-P4":
        errors.append(f"{label}.device expected ESP32-P4")
    if data.get("project") != "PiLab PLC":
        errors.append(f"{label}.project expected PiLab PLC")
    if data.get("plc_mode") not in ("RUN", "STOP"):
        errors.append(f"{label}.plc_mode expected RUN or STOP, got {data.get('plc_mode')!r}")
    return errors


def validate_system_overview(record: ResponseRecord, data: Optional[Any]) -> List[str]:
    return validate_overview_like(data, "system_overview")


def validate_command_center(record: ResponseRecord, data: Optional[Any]) -> List[str]:
    if not isinstance(data, dict):
        return ["command_center response is not a JSON object"]
    errors: List[str] = []
    for key in ("overview", "plc", "script"):
        if key not in data:
            errors.append(f"missing key: {key}")
    if "overview" in data:
        errors += validate_overview_like(data["overview"], "command_center.overview")
    plc = data.get("plc")
    if isinstance(plc, dict):
        for key in ("tick_count", "script_scan_count", "output_write_count", "raw_di_mask", "di_mask", "do_mask"):
            errors += require_number(plc, key, 0)
    elif plc is not None:
        errors.append("command_center.plc is not a JSON object")
    script = data.get("script")
    if script is not None and not isinstance(script, dict):
        errors.append("command_center.script is not a JSON object")
    return errors


def validate_script_status(record: ResponseRecord, data: Optional[Any]) -> List[str]:
    if not isinstance(data, dict):
        return ["script_status response is not a JSON object"]

    # Script engine status has changed across PiLab revisions, so validate conservatively.
    # Current firmware returns state as a string such as "ok", while system_overview
    # exposes script_state as a numeric enum. Both shapes are valid.
    errors: List[str] = []
    if len(data) == 0:
        errors.append("script_status object is empty")

    numeric_keys = (
        "activations", "compile_execute_overlap_scans", "compiler_stack_hwm_words",
        "failed", "generation", "heap_after", "heap_before", "heap_min",
        "heap_now", "internal_after", "internal_before", "internal_min",
        "internal_now", "last_compile_us", "last_pause_us", "ok",
        "pause_windows", "paused_scan_skips", "psram_after", "psram_before",
        "psram_min", "psram_now", "rejected", "requests",
        "retired_destroy_us_max", "run_scan_us_ema", "run_scan_us_last",
        "run_scan_us_max", "run_scan_us_window_avg", "run_scan_us_window_count",
        "run_scan_us_window_max", "run_scan_us_window_min",
        "run_scan_us_window_over_2500", "run_scan_us_window_over_5000",
        "script_scans_completed",
    )
    for key in numeric_keys:
        if key in data:
            errors += require_number(data, key, 0)

    string_keys = ("active_script_name", "active_script_path", "last_result", "pending_script_name")
    for key in string_keys:
        if key in data:
            errors += require_type(data, key, (str,))

    bool_keys = ("compile_busy", "pause_during_compile_experiment", "pending", "script_scan_paused")
    for key in bool_keys:
        if key in data:
            errors += require_type(data, key, (bool,))

    if "state" in data:
        state = data["state"]
        if isinstance(state, str):
            if not state:
                errors.append("state string is empty")
        elif isinstance(state, (int, float)) and not isinstance(state, bool):
            if state < 0:
                errors.append(f"state numeric value expected >= 0, got {state}")
        else:
            errors.append(f"state expected string or number, got {type_name(state)}")

    statusish = any(k in data for k in (
        "state", "ok", "active_script_name", "active_script_path",
        "last_result", "generation", "script_scans_completed", "compile_busy"
    ))
    if not statusish:
        errors.append("script_status did not contain recognized status-like keys")

    return errors

def validate_plc_io(record: ResponseRecord, data: Optional[Any]) -> List[str]:
    if not isinstance(data, dict):
        return ["plc_io response is not a JSON object"]
    errors: List[str] = []
    for key in ("tick_count", "script_scan_count", "output_write_count", "raw_di_mask", "di_mask", "do_mask"):
        if key in data:
            errors += require_number(data, key, 0)
    # Accept either array-style or mask-style variants.
    expected_any = ["digital_inputs", "digital_outputs", "analog_inputs", "analog_outputs", "di", "do", "ai", "ao", "raw_di_mask", "do_mask"]
    if not any(k in data for k in expected_any):
        errors.append("plc_io did not contain recognizable I/O keys")
    return errors


def validate_plc_data(record: ResponseRecord, data: Optional[Any]) -> List[str]:
    if not isinstance(data, dict):
        return ["plc_data response is not a JSON object"]
    errors: List[str] = []
    for key in ("endpoint", "cached", "cache_period_ms", "snapshot_us", "tick_count", "points"):
        if key not in data:
            errors.append(f"missing key: {key}")
    if data.get("endpoint") != "/api/plc_data":
        errors.append(f"endpoint expected /api/plc_data, got {data.get('endpoint')!r}")
    errors += require_type(data, "cached", (bool,)) if "cached" in data else []
    for key in ("cache_period_ms", "snapshot_us", "tick_count", "script_scan_count", "output_write_count", "raw_di_mask", "di_mask", "do_mask"):
        if key in data:
            errors += require_number(data, key, 0)
    points = data.get("points")
    if not isinstance(points, list):
        errors.append("points expected list")
    else:
        if len(points) == 0:
            errors.append("points list is empty")
        names = set()
        for idx, point in enumerate(points[:32]):
            if not isinstance(point, dict):
                errors.append(f"points[{idx}] is not an object")
                continue
            for key in ("name", "kind", "source", "value"):
                if key not in point:
                    errors.append(f"points[{idx}] missing key: {key}")
            if "name" in point and isinstance(point["name"], str):
                names.add(point["name"])
            if point.get("kind") not in ("bool", "int", "float"):
                errors.append(f"points[{idx}].kind invalid: {point.get('kind')!r}")
            if point.get("source") not in ("physical", "user", "sim"):
                errors.append(f"points[{idx}].source invalid: {point.get('source')!r}")
        # Expected built-in PLC points from current firmware.
        for expected in ("I0", "Q0", "AI0", "AO0"):
            if points and expected not in {p.get("name") for p in points if isinstance(p, dict)}:
                errors.append(f"expected built-in point {expected!r} not found")
    return errors


def validate_tags(record: ResponseRecord, data: Optional[Any]) -> List[str]:
    errors: List[str] = []
    if isinstance(data, list):
        tags = data
    elif isinstance(data, dict):
        # Support either {tags:[...]} or registry metadata shape.
        if "tags" in data and isinstance(data["tags"], list):
            tags = data["tags"]
        elif "entries" in data and isinstance(data["entries"], list):
            tags = data["entries"]
        else:
            # Valid JSON object, but unknown shape.
            if not any(k in data for k in ("count", "tag_count", "tags", "entries")):
                errors.append("tags response has unknown object shape")
            return errors
    else:
        return ["tags response expected list or object"]

    for idx, tag in enumerate(tags[:50]):
        if not isinstance(tag, dict):
            errors.append(f"tags[{idx}] is not an object")
            continue
        if "name" not in tag:
            errors.append(f"tags[{idx}] missing name")
        if "type" in tag and not isinstance(tag["type"], str):
            errors.append(f"tags[{idx}].type expected string")
    return errors


def validate_files_list(record: ResponseRecord, data: Optional[Any]) -> List[str]:
    if not isinstance(data, dict):
        return ["files list response is not a JSON object"]
    errors: List[str] = []
    errors += require_type(data, "path", (str,))
    if "entries" not in data:
        errors.append("missing key: entries")
    elif not isinstance(data["entries"], list):
        errors.append("entries expected list")
    else:
        for idx, ent in enumerate(data["entries"][:40]):
            if not isinstance(ent, dict):
                errors.append(f"entries[{idx}] is not an object")
                continue
            for key in ("name", "path", "dir", "size"):
                if key not in ent:
                    errors.append(f"entries[{idx}] missing key: {key}")
            if "dir" in ent and not isinstance(ent["dir"], bool):
                errors.append(f"entries[{idx}].dir expected bool")
            if "size" in ent and (not isinstance(ent["size"], int) or isinstance(ent["size"], bool) or ent["size"] < 0):
                errors.append(f"entries[{idx}].size expected non-negative int")
    return errors


def validate_large_status(record: ResponseRecord, data: Optional[Any]) -> List[str]:
    if not isinstance(data, dict):
        return ["large_status response is not a JSON object"]
    errors: List[str] = []
    for key in ("device", "test", "description", "variables"):
        if key not in data:
            errors.append(f"missing key: {key}")
    if data.get("test") != "large_status":
        errors.append(f"test expected large_status, got {data.get('test')!r}")
    variables = data.get("variables")
    if not isinstance(variables, list):
        errors.append("variables expected list")
    else:
        if len(variables) < 100:
            errors.append(f"variables expected a large payload, got only {len(variables)} items")
        for idx, item in enumerate(variables[:10]):
            if not isinstance(item, dict):
                errors.append(f"variables[{idx}] is not object")
                continue
            for key in ("id", "name", "value", "quality", "timestamp_us"):
                if key not in item:
                    errors.append(f"variables[{idx}] missing key: {key}")
            if item.get("quality") != "GOOD":
                errors.append(f"variables[{idx}].quality expected GOOD")
    return errors


# -----------------------------
# HTTP/check execution
# -----------------------------


def fetch(base_url: str, spec: CheckSpec, timeout: float, user_agent: str) -> ResponseRecord:
    url = base_url + spec.path
    headers = {"User-Agent": user_agent, "Accept": "*/*"}
    req = urllib.request.Request(url, method=spec.method.upper(), headers=headers)

    start = time.perf_counter()
    body = b""
    status_code: Optional[int] = None
    content_type = ""
    error = ""

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status_code = int(resp.getcode())
            content_type = resp.headers.get("Content-Type", "")
            body = resp.read()
    except urllib.error.HTTPError as e:
        status_code = int(e.code)
        content_type = e.headers.get("Content-Type", "") if e.headers else ""
        try:
            body = e.read()
        except Exception:
            body = b""
        error = f"HTTPError: {e.code} {e.reason}"
    except Exception as e:
        error = f"{type(e).__name__}: {e}"

    elapsed_ms = (time.perf_counter() - start) * 1000.0
    sha = hashlib.sha256(body).hexdigest()[:16] if body else ""
    preview = body[:240].decode("utf-8", errors="replace").replace("\r", "\\r").replace("\n", "\\n")

    record = ResponseRecord(
        name=spec.name,
        method=spec.method.upper(),
        path=spec.path,
        url=url,
        status_code=status_code,
        elapsed_ms=elapsed_ms,
        ok=False,
        severity="FAIL",
        content_type=content_type,
        bytes_received=len(body),
        sha256_16=sha,
        error=error,
        body_preview=preview,
    )

    # Base status/content checks.
    if status_code != spec.expected_status:
        record.failures.append(f"expected HTTP {spec.expected_status}, got {status_code}")
    if error and status_code is None:
        record.failures.append(error)

    if spec.expected_content_type:
        expected = spec.expected_content_type.lower()
        if expected not in content_type.lower():
            record.failures.append(f"expected content-type containing {expected!r}, got {content_type!r}")

    text = body.decode("utf-8", errors="replace") if body else ""
    for needle in spec.body_contains:
        if needle not in text:
            record.failures.append(f"body did not contain required text: {needle!r}")

    json_data: Optional[Any] = None
    if spec.json_expected:
        try:
            json_data = json.loads(text)
            record.json_data = json_data
        except Exception as e:
            record.failures.append(f"invalid JSON: {e}")

        if isinstance(json_data, dict):
            for key in spec.required_keys:
                if key not in json_data:
                    record.failures.append(f"missing required key: {key}")
        elif spec.required_keys:
            record.failures.append("required keys specified but JSON root is not object")

        if json_data is not None:
            for validator in spec.validators:
                try:
                    record.failures.extend(validator(record, json_data))
                except Exception as e:
                    record.failures.append(f"validator {getattr(validator, '__name__', '<validator>')} crashed: {e}")

    if spec.max_fail_ms is not None and elapsed_ms > spec.max_fail_ms:
        record.failures.append(f"response time {elapsed_ms:.1f} ms exceeded fail threshold {spec.max_fail_ms:.1f} ms")
    elif spec.max_warn_ms is not None and elapsed_ms > spec.max_warn_ms:
        record.warnings.append(f"response time {elapsed_ms:.1f} ms exceeded warn threshold {spec.max_warn_ms:.1f} ms")

    if record.failures:
        record.severity = "FAIL"
        record.ok = False
    elif record.warnings:
        record.severity = "WARN"
        record.ok = True
    else:
        record.severity = "PASS"
        record.ok = True

    return record


def build_specs(include_large: bool = True) -> List[CheckSpec]:
    specs: List[CheckSpec] = [
        CheckSpec("SPA index", "GET", "/", 200, "text/html", ("<div id=\"app\"></div>",), False, max_warn_ms=250),
        CheckSpec("SPA /editor route", "GET", "/editor", 200, "text/html", ("<div id=\"app\"></div>",), False, max_warn_ms=250),
        CheckSpec("SPA /script route", "GET", "/script", 200, "text/html", ("<div id=\"app\"></div>",), False, max_warn_ms=250),
        CheckSpec("SPA /hmi route", "GET", "/hmi", 200, "text/html", ("<div id=\"app\"></div>",), False, max_warn_ms=250),
        CheckSpec("SPA /tags route", "GET", "/tags", 200, "text/html", ("<div id=\"app\"></div>",), False, max_warn_ms=250),
        CheckSpec("SPA /files route", "GET", "/files", 200, "text/html", ("<div id=\"app\"></div>",), False, max_warn_ms=250),
        CheckSpec("Asset app.js", "GET", "/assets/app.js", 200, "javascript", (), False, max_warn_ms=1800),
        CheckSpec("Asset index.css", "GET", "/assets/index.css", 200, "css", (), False, max_warn_ms=500),
        CheckSpec("API status", "GET", "/api/status", 200, "application/json", (), True, validators=(validate_status,), max_warn_ms=250),
        CheckSpec("API PLC mode", "GET", "/api/plc_mode", 200, "application/json", (), True, validators=(validate_plc_mode,), max_warn_ms=250),
        CheckSpec("API system overview", "GET", "/api/system_overview", 200, "application/json", (), True, validators=(validate_system_overview,), max_warn_ms=350),
        CheckSpec("API command center", "GET", "/api/command_center", 200, "application/json", (), True, validators=(validate_command_center,), max_warn_ms=500),
        CheckSpec("API script status", "GET", "/api/script_status", 200, "application/json", (), True, validators=(validate_script_status,), max_warn_ms=350),
        CheckSpec("API PLC IO", "GET", "/api/plc_io", 200, "application/json", (), True, validators=(validate_plc_io,), max_warn_ms=350),
        CheckSpec("API PLC data", "GET", "/api/plc_data", 200, "application/json", (), True, validators=(validate_plc_data,), max_warn_ms=250),
        CheckSpec("API tags", "GET", "/api/tags", 200, "application/json", (), True, validators=(validate_tags,), max_warn_ms=250),
        CheckSpec("API files list root", "GET", "/api/files/list?path=%2F", 200, "application/json", (), True, validators=(validate_files_list,), max_warn_ms=350),
    ]
    if include_large:
        specs.append(CheckSpec("API large status", "GET", "/api/large_status", 200, "application/json", (), True, validators=(validate_large_status,), max_warn_ms=900, max_fail_ms=5000))
    return specs


# -----------------------------
# Cross-endpoint consistency
# -----------------------------


def get_json_result(results: Sequence[ResponseRecord], path: str) -> Optional[Any]:
    for r in results:
        if r.path == path:
            return r.json_data
    return None


def run_consistency_checks(results: Sequence[ResponseRecord]) -> List[Tuple[str, str, str]]:
    """Return list of (severity, name, message)."""
    checks: List[Tuple[str, str, str]] = []
    status = get_json_result(results, "/api/status")
    mode = get_json_result(results, "/api/plc_mode")
    overview = get_json_result(results, "/api/system_overview")
    command = get_json_result(results, "/api/command_center")
    plc_data = get_json_result(results, "/api/plc_data")

    def add(sev: str, name: str, msg: str) -> None:
        checks.append((sev, name, msg))

    if isinstance(status, dict) and isinstance(overview, dict):
        if status.get("device") != overview.get("device"):
            add("FAIL", "device consistency", f"/api/status device {status.get('device')!r} != overview device {overview.get('device')!r}")
        else:
            add("PASS", "device consistency", "device values match")
        if status.get("ip") != overview.get("ip"):
            add("WARN", "IP consistency", f"/api/status ip {status.get('ip')!r} != overview ip {overview.get('ip')!r}")
        else:
            add("PASS", "IP consistency", "IP values match")

    if isinstance(mode, dict) and isinstance(overview, dict):
        if mode.get("mode") != overview.get("plc_mode"):
            add("FAIL", "PLC mode consistency", f"/api/plc_mode mode {mode.get('mode')!r} != overview plc_mode {overview.get('plc_mode')!r}")
        else:
            add("PASS", "PLC mode consistency", "mode values match")
        if mode.get("running") != overview.get("plc_running"):
            add("FAIL", "PLC running consistency", f"running {mode.get('running')!r} != plc_running {overview.get('plc_running')!r}")
        else:
            add("PASS", "PLC running consistency", "running values match")

    if isinstance(command, dict) and isinstance(overview, dict) and isinstance(command.get("overview"), dict):
        co = command["overview"]
        for key in ("plc_mode", "plc_running", "script_generation", "tag_count"):
            if key in overview and key in co and overview[key] != co[key]:
                add("WARN", f"command_center overview {key}", f"system_overview {key}={overview[key]!r}, command_center.overview {key}={co[key]!r}")
        add("PASS", "command_center shape", "overview/plc/script sections are present")

    if isinstance(plc_data, dict):
        points = plc_data.get("points")
        if isinstance(points, list):
            named = {p.get("name") for p in points if isinstance(p, dict)}
            missing = [n for n in ("I0", "I1", "Q0", "Q1", "AI0", "AO0") if n not in named]
            if missing:
                add("WARN", "built-in point coverage", "missing expected built-in point(s): " + ", ".join(missing))
            else:
                add("PASS", "built-in point coverage", "expected built-in points are present")

    if not checks:
        add("WARN", "consistency checks", "not enough JSON data to run cross-endpoint checks")
    return checks


# -----------------------------
# Reporting
# -----------------------------


def write_reports(report_dir: Path, base_url: str, project_root: Path, results: Sequence[ResponseRecord], consistency: Sequence[Tuple[str, str, str]], args: argparse.Namespace) -> None:
    pass_count = sum(1 for r in results if r.severity == "PASS")
    warn_count = sum(1 for r in results if r.severity == "WARN")
    fail_count = sum(1 for r in results if r.severity == "FAIL")
    cons_pass = sum(1 for c in consistency if c[0] == "PASS")
    cons_warn = sum(1 for c in consistency if c[0] == "WARN")
    cons_fail = sum(1 for c in consistency if c[0] == "FAIL")

    summary = {
        "tool": "PiLabApiDeepCheck.py",
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "project_root": str(project_root),
        "base_url": base_url,
        "read_only": True,
        "timeout_seconds": args.timeout,
        "endpoint_summary": {
            "pass": pass_count,
            "warn": warn_count,
            "fail": fail_count,
            "total": len(results),
        },
        "consistency_summary": {
            "pass": cons_pass,
            "warn": cons_warn,
            "fail": cons_fail,
            "total": len(consistency),
        },
        "results": [
            {
                "severity": r.severity,
                "name": r.name,
                "method": r.method,
                "path": r.path,
                "status_code": r.status_code,
                "elapsed_ms": round(r.elapsed_ms, 3),
                "content_type": r.content_type,
                "bytes_received": r.bytes_received,
                "sha256_16": r.sha256_16,
                "warnings": r.warnings,
                "failures": r.failures,
                "error": r.error,
            }
            for r in results
        ],
        "consistency_checks": [
            {"severity": s, "name": n, "message": m} for s, n, m in consistency
        ],
    }

    (report_dir / "api_deep_summary.json").write_text(safe_json_dump(summary) + "\n", encoding="utf-8")

    with (report_dir / "api_deep_results.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["severity", "name", "method", "path", "status", "elapsed_ms", "content_type", "bytes", "sha256_16", "warnings", "failures"])
        for r in results:
            writer.writerow([
                r.severity, r.name, r.method, r.path, r.status_code, f"{r.elapsed_ms:.3f}", r.content_type,
                r.bytes_received, r.sha256_16, " | ".join(r.warnings), " | ".join(r.failures),
            ])

    with (report_dir / "api_deep_consistency.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["severity", "name", "message"])
        writer.writerows(consistency)

    lines: List[str] = []
    lines.append("PiLab API Deep Check Report")
    lines.append("===========================")
    lines.append("")
    lines.append(f"Generated:    {dt.datetime.now().isoformat(timespec='seconds')}")
    lines.append(f"Project root: {project_root}")
    lines.append(f"Base URL:     {base_url}")
    lines.append(f"Read-only:    True")
    lines.append(f"Timeout:      {args.timeout} seconds")
    lines.append("")
    lines.append("Endpoint Summary")
    lines.append("----------------")
    lines.append(f"PASS: {pass_count}  WARN: {warn_count}  FAIL: {fail_count}  TOTAL: {len(results)}")
    lines.append("")
    lines.append("Consistency Summary")
    lines.append("-------------------")
    lines.append(f"PASS: {cons_pass}  WARN: {cons_warn}  FAIL: {cons_fail}  TOTAL: {len(consistency)}")
    lines.append("")

    lines.append("Endpoint Details")
    lines.append("----------------")
    for r in results:
        lines.append(f"[{r.severity}] {r.name}")
        lines.append(f"  {r.method} {r.path}")
        lines.append(f"  Status: {r.status_code}   Time: {r.elapsed_ms:.1f} ms   Bytes: {r.bytes_received}   Type: {r.content_type}")
        if r.sha256_16:
            lines.append(f"  SHA256-16: {r.sha256_16}")
        for w in r.warnings:
            lines.append(f"  WARN: {w}")
        for e in r.failures:
            lines.append(f"  FAIL: {e}")
        if r.error and not r.failures:
            lines.append(f"  Error: {r.error}")
        if r.body_preview:
            lines.append(f"  Preview: {r.body_preview}")
        lines.append("")

    lines.append("Consistency Details")
    lines.append("-------------------")
    for sev, name, msg in consistency:
        lines.append(f"[{sev}] {name}: {msg}")
    lines.append("")

    (report_dir / "api_deep_report.txt").write_text("\n".join(lines), encoding="utf-8")

    # Save compact JSON payload samples for successful JSON endpoints.
    samples_dir = report_dir / "json_samples"
    samples_dir.mkdir(exist_ok=True)
    for r in results:
        if r.json_data is not None:
            safe_name = re.sub(r"[^A-Za-z0-9_.-]+", "_", r.path.strip("/") or "root")
            if not safe_name:
                safe_name = "root"
            (samples_dir / f"{safe_name}.json").write_text(safe_json_dump(r.json_data) + "\n", encoding="utf-8")


def print_result(r: ResponseRecord) -> None:
    status = r.status_code if r.status_code is not None else "ERR"
    print(f"[{r.severity:4}] {r.name:32} {r.method:4} {str(status):>4} {r.elapsed_ms:8.1f} ms {r.bytes_received:8d} B  {r.path}")
    for msg in r.failures[:3]:
        print(f"       FAIL: {msg}")
    for msg in r.warnings[:2]:
        print(f"       WARN: {msg}")


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Deep read-only API/schema validator for PiLab ESP32-P4 PLC.")
    parser.add_argument("--host", required=True, help="Device host/IP, e.g. 192.168.5.210 or http://192.168.5.210")
    parser.add_argument("--timeout", type=float, default=5.0, help="Per-request timeout in seconds. Default: 5")
    parser.add_argument("--skip-large", action="store_true", help="Skip /api/large_status check.")
    parser.add_argument("--project-root", help="Optional project root override. Normally auto-detected.")
    parser.add_argument("--fail-on-warn", action="store_true", help="Return non-zero if any warnings are found.")
    args = parser.parse_args(argv)

    base_url = normalize_base_url(args.host)
    project_root = Path(args.project_root).resolve() if args.project_root else find_project_root()
    report_dir = ensure_report_dir(project_root)

    print("PiLab API Deep Check")
    print("====================")
    print(f"Project root: {project_root}")
    print(f"Base URL:     {base_url}")
    print(f"Report dir:   {report_dir}")
    print("Read-only:    True")
    print("")

    specs = build_specs(include_large=not args.skip_large)
    results: List[ResponseRecord] = []
    user_agent = "PiLabApiDeepCheck/1.0"

    for spec in specs:
        r = fetch(base_url, spec, args.timeout, user_agent)
        results.append(r)
        print_result(r)

    consistency = run_consistency_checks(results)
    print("")
    print("Cross-endpoint consistency")
    print("--------------------------")
    for sev, name, msg in consistency:
        print(f"[{sev:4}] {name:30} {msg}")

    write_reports(report_dir, base_url, project_root, results, consistency, args)

    pass_count = sum(1 for r in results if r.severity == "PASS")
    warn_count = sum(1 for r in results if r.severity == "WARN")
    fail_count = sum(1 for r in results if r.severity == "FAIL")
    cons_warn = sum(1 for c in consistency if c[0] == "WARN")
    cons_fail = sum(1 for c in consistency if c[0] == "FAIL")

    print("")
    print("Summary")
    print("-------")
    print(f"Endpoint PASS: {pass_count}  WARN: {warn_count}  FAIL: {fail_count}  TOTAL: {len(results)}")
    print(f"Consistency WARN: {cons_warn}  FAIL: {cons_fail}  TOTAL: {len(consistency)}")
    print(f"Report: {report_dir / 'api_deep_report.txt'}")
    print(f"JSON:   {report_dir / 'api_deep_summary.json'}")
    print(f"CSV:    {report_dir / 'api_deep_results.csv'}")

    if fail_count or cons_fail:
        return 2
    if args.fail_on_warn and (warn_count or cons_warn):
        return 1
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nInterrupted.")
        raise SystemExit(130)
    except Exception:
        traceback.print_exc()
        raise SystemExit(99)
