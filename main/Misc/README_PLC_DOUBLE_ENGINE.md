# ESP32-P4 PLC double-engine no-pause patch

This patch keeps the 1 ms I/O path deterministic and allows the currently active AngelScript program to keep running while a new script is compiled.

## Task model

- `plc_io_1ms`, priority 24, core 0
  - Woken by GPTimer every 1 ms.
  - Calls only `plc_io_tick_1ms()` and `plc_io_apply_outputs()`.
  - Every fifth hardware tick, it notifies `as_scan_5ms`.
  - It never calls AngelScript and never waits on AngelScript objects.

- `as_scan_5ms`, priority 12, core 0
  - Woken by direct notification from the 1 ms task every fifth tick.
  - Does **not** use `vTaskDelayUntil()`, because on ESP-IDF builds with a 100 Hz FreeRTOS tick, `pdMS_TO_TICKS(5)` becomes zero and trips the FreeRTOS assert.
  - Runs the active AngelScript program.
  - Performs only a short non-blocking pending-program swap at a scan boundary.

- `script_compile`, priority 4, core 1
  - Builds a new script using a separate AngelScript engine/program.
  - Does not touch the active running program.

- `script_cleanup`, priority 3, core 1
  - Destroys retired script programs outside the scan path.

## Why this avoids upload pauses

The active script engine/context is owned by the scan task. The compiler builds a separate program and only publishes it as pending after successful compile. The scan task then swaps it in at a scan boundary. Compiling a new script should not pause the currently active script logic.

## Expected test result

During rapid browser uploads/compiles:

- 1 ms period max should remain close to 1000 us.
- Missed/coalesced notifications should remain 0 or near 0.
- Current script output should continue toggling while the new script compiles.
- `scan_skipped_as_busy` should stay at 0 in the double-engine version.
