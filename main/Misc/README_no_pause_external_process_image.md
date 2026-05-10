# ESP32-P4 PLC AngelScript no-pause hot-reload experiment

This patch is meant to test the theory that the previous `g_as_api_mutex` was only needed because AngelScript had been compiled with `AS_NO_THREADS`.

## Main change

The patch removes the global AngelScript compile/execute mutex from the scan path.

Old behavior:

```text
Compiler holds g_as_api_mutex during Build()
5 ms scan task tries the same mutex with zero timeout
Scan() is skipped while compile is active
Q outputs hold their last state
```

New behavior:

```text
Active script keeps executing every 5 ms
Compiler builds the next script on Core 1 using a separate engine
Scan task swaps pending script only after a completed scan
Retired script destruction still happens only on the scan task
```

## External process image mirror

The script-visible globals are now external to `ScriptProgram`:

```text
I0..I15
Q0..Q7
AI0..AI3
AO0..AO3
```

Every new AngelScript engine registers its global properties to the same external addresses. This means I/Q/AI/AO memory is no longer zeroed simply because a new `ScriptProgram` was created.

Physical GPIO process image remains in `plc_io.cpp`. The scan task copies:

```text
plc_io inputs -> script globals -> run script -> script globals -> plc_io outputs
```

## Important limitation

This preserves I/O globals only. Script module variables still reset on reload, for example:

```angelscript
float t = 0.0;
int step = 0;
```

If those must be retentive, they should be moved to an external state object or explicit retentive registers.

## What to test

1. Confirm `AngelScript library options` still does NOT show `AS_NO_THREADS`.
2. Upload the same script repeatedly while watching Q0 on the oscilloscope.
3. Watch `/api/script_status` for:
   - `no_pause_experiment: true`
   - `compile_execute_overlap_scans` increasing during uploads
   - `run_scan_us_max`
   - `retired_destroy_us_max`
4. Confirm the previous >5 ms Q0 freeze disappears.

If this crashes again with `asPopActiveContext`, then compile/execute overlap is still unsafe even with `AS_POSIX_THREADS`. If it survives, the old locks were leftover damage from the `AS_NO_THREADS` phase.
