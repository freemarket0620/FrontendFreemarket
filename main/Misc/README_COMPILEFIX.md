# Compile fix for no-pause external process-image patch

Fixes the build error in `ethernet_web.c`:

```text
implicit declaration of function script_engine_can_accept_upload
```

The HTTP upload handler from the prior reload-throttle patch still calls this
preflight function before receiving the request body. The no-pause patch removed
the declaration/implementation by mistake.

This fix adds:

- `script_engine_can_accept_upload(...)` declaration in `script_engine.hpp`
- matching implementation in `script_engine.cpp`

It only performs a fast preflight check. The real `script_engine_submit_compile_text()`
still performs the final single-flight/pending-program checks after the request
body is read.
