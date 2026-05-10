# RTScript-style hot-swap with scan-owned cleanup

This patch keeps the proven RTScript-style model:

- Compiler task builds a complete new `ScriptProgram` off to the side.
- The 5 ms AngelScript scan task owns the active runtime program.
- The active program is swapped only between scans.
- Retired programs are deleted only by the 5 ms AngelScript scan task, between scans.
- The core 1 compiler task never deletes retired active programs.
- The 1 ms PLC I/O task remains AngelScript-free.

## Why this patch exists

The previous safe-hotswap version still had a core 1 cleanup task that destroyed retired AngelScript engines/contexts. During aggressive reload testing, that could overlap with core 0 context creation/execution and trigger AngelScript `asPopActiveContext()` assertions.

This patch removes cross-core retired-program destruction. Cleanup is now owned by the same task that executes AngelScript.

## Important tradeoff

Retired cleanup can take a few milliseconds, but it only affects the 5 ms script task. It does not run in the 1 ms I/O task, so physical I/O sampling/output application remains deterministic.

If reloads are spammed faster than cleanup can keep up, retired programs are intentionally leaked rather than deleted from the wrong task. Watch `retired_queue_full` in `/api/script_status`.
