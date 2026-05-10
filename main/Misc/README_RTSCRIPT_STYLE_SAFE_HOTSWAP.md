# ESP32-P4 PLC RTScript-style safe hot-swap patch

This version keeps the same basic model as the older working RTScript code:

1. The compiler task builds a complete new `ScriptProgram` off to the side.
2. The scan task owns and executes the active `ScriptProgram`.
3. The active pointer is swapped only between scans.
4. The old program is retired and destroyed later, after a grace period.

## Important fixes in this patch

- The 1 ms PLC I/O task remains completely AngelScript-free.
- The 5 ms AngelScript task runs the active script first, then activates pending scripts after the completed scan.
- Retired scripts are not destroyed immediately after a pointer swap.
- Retired scripts are only eligible for cleanup after at least two more script scan opportunities.
- Cleanup is serialized against active `Execute()` using a small runtime mutex so engine/context destruction cannot overlap with script execution.
- Compile/build does not take the runtime execution mutex, so compiling a new script does not pause the active script.
- `asPrepareMultithread()` is called before creating any engines.
- `as_scan_5ms` stack increased from 8192 to 16384 bytes.

## Tradeoff

Cleanup can briefly delay a script scan if it happens to destroy a retired engine exactly when the scan task wants to run. This does not affect the 1 ms I/O task. It is safer than allowing AngelScript engine destruction to overlap with context execution, which caused `asPopActiveContext()` assertions during rapid hot-swaps.

