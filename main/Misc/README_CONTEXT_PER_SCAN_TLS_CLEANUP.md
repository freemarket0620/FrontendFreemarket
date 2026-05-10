# ESP32-P4 PLC AngelScript context-per-scan TLS cleanup patch

This patch keeps the current concurrent compile/execute architecture, but changes the AngelScript runtime context lifecycle to be more conservative under FreeRTOS stress testing.

## What changed

- `ScriptProgram` no longer owns a persistent `asIScriptContext`.
- The 5 ms AngelScript scan task now creates a fresh context for each scan.
- The context is prepared, executed, unprepared, released, and then `asThreadCleanup()` is called on the same FreeRTOS task.
- The compiler task calls `asThreadCleanup()` after each compile job.
- The synchronous compile helper also calls `asThreadCleanup()` after compilation.
- Old `ScriptProgram` destruction remains owned by the scan task, between scans.
- The 1 ms PLC I/O task remains AngelScript-free.

## Why

The remaining crash was `asPopActiveContext()` while one core was executing `asCContext::Execute()` and the other was in `asCBuilder`. This patch targets stale/corrupted AngelScript task-local active-context state without reverting to a global compile/execute lock.

## Expected test result

- Active script should continue running while a new script compiles.
- No persistent context survives across reload generations.
- Reload stress should either stabilize or move the failure to a different, more specific point.
