# AngelScript shared/exclusive lock test patch

This patch keeps the RTScript-style hot-swap model, but adds AngelScript's own
multithread synchronization API around every meaningful AngelScript API touch.

## Goal

Test whether the recurring `asPopActiveContext()` assert is caused by
AngelScript library-wide internal state being accessed concurrently by:

- Core 0 / `as_scan_5ms`: context creation, prepare, execute, release
- Core 1 / `script_compile`: engine creation, registration, module build,
  function lookup, and engine release

## Changes

### 1. Added AngelScript RAII locks

`script_engine.cpp` now includes:

```cpp
struct ASSharedLock
{
    ASSharedLock()  { asAcquireSharedLock(); }
    ~ASSharedLock() { asReleaseSharedLock(); }
};

struct ASExclusiveLock
{
    ASExclusiveLock()  { asAcquireExclusiveLock(); }
    ~ASExclusiveLock() { asReleaseExclusiveLock(); }
};
```

### 2. Wrapped runtime execution in shared lock

The 5 ms AngelScript scan task now runs context creation, `Prepare()`,
`Execute()`, `Unprepare()`, and `Release()` under `ASSharedLock`.

### 3. Wrapped compile/build/destruction in exclusive lock

Engine creation, global registration, module `Build()`, function lookup, and
`ShutDownAndRelease()` are now under `ASExclusiveLock`.

### 4. Logs AngelScript library options

Startup now logs:

```text
AngelScript library options: ...
```

Check this line carefully. If it contains `AS_NO_THREADS`, the library is not
built for this test.

### 5. Removed aggressive per-scan/per-compile `asThreadCleanup()`

The previous patch called `asThreadCleanup()` after every scan and compile job.
This patch removes that because the scan and compiler tasks are long-lived.
AngelScript's docs intend `asThreadCleanup()` for threads/tasks that are exiting.

## Expected behavior

- The 1 ms PLC I/O task remains independent.
- Script compile may briefly block a 5 ms script scan while the exclusive lock is held.
- Physical I/O timing should still remain stable.
- If the assert disappears, the issue was AngelScript internal concurrent access.

## What to post from monitor output

Please capture:

- `AngelScript library options: ...`
- compile/activate/destroy sequence
- whether `asPopActiveContext()` still appears
- performance report around reloads
