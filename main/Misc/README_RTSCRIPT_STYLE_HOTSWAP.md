# ESP32-P4 AngelScript RTScript-style hot swap patch

This version follows the same pattern as the older RTScript reload code:

1. The compiler task builds a complete replacement `ScriptProgram` off to the side.
2. The active 5 ms script task continues running the current program while the new one compiles.
3. Activation is a short, non-blocking pointer swap protected by `g_program_mutex`.
4. The 1 ms PLC I/O task never calls AngelScript and never waits on any AngelScript lock.

Important safety choices:

- `asPrepareMultithread()` is called once before any engine is created.
- `AS_NO_THREADS` must not be defined in the AngelScript component build.
- Each `ScriptProgram` owns its own AngelScript engine and runtime globals.
- The runtime context is created lazily in the 5 ms script task, not the compiler task.
- Retired programs are destroyed by a low-priority cleanup task, not by the 1 ms I/O task.
- Compile/build and retired-engine destruction are serialized by `g_lifecycle_mutex`, but active script execution is not blocked by that mutex.

Expected behavior:

- Browser uploads compile without stopping the currently active script.
- `/api/script_status` should show `scan_skipped_as_busy` staying at 0.
- 1 ms I/O timing should remain stable.
- `retired_queued` and `retired_cleaned` should track old program cleanup.
