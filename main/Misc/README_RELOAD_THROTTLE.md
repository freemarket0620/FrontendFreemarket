# ESP32-P4 PLC AngelScript reload throttle patch

This patch adds strict single-flight reload protection around `/api/upload_script`.

## What changed

- Uploads are rejected before reading the HTTP body if:
  - the compiler is already busy,
  - the compile queue already has a job,
  - a compiled program is still pending activation,
  - the reload cooldown has not expired.
- Reload cooldown is currently `500 ms` after the last accepted upload or activation.
- Compiler stack remains `65536` bytes.
- `script_engine_can_accept_upload()` was added so the HTTP handler can reject spam early.
- `/api/script_status` now includes:
  - `rejected_busy`
  - `rejected_pending`
  - `rejected_cooldown`
  - `reload_cooldown_remaining_ms`

## Why

Rapid browser uploads were able to repeatedly create/destroy AngelScript engines and compile new programs with very little spacing. This patch prevents upload storms from piling up reload work and reduces AngelScript allocator/lifecycle pressure during stress testing.

The 1 ms PLC I/O task remains AngelScript-free.
