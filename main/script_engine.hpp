#pragma once

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum ScriptCompileState {
    SCRIPT_STATE_IDLE = 0,
    SCRIPT_STATE_QUEUED = 1,
    SCRIPT_STATE_COMPILING = 2,
    SCRIPT_STATE_OK = 3,
    SCRIPT_STATE_FAILED = 4,
    SCRIPT_STATE_QUEUE_FULL = 5
} ScriptCompileState;

// Initialize the AngelScript runtime support and start the async compiler task.
bool script_engine_start(void);

// Synchronous compile kept for local tests/debug. Do not call this from httpd callbacks.
bool script_engine_compile_text(const char* script_text, size_t script_len,
                                char* err_buf, size_t err_buf_len);

// Async compile request used by HTTP upload. This function copies the script text
// into heap memory and returns quickly. The dedicated compiler task does the build.
bool script_engine_submit_compile_text(const char* script_text, size_t script_len,
                                       char* response_buf, size_t response_buf_len);

// Fast preflight check used by HTTP upload handler before reading the request body.
// Returns false when a compile is already queued/running or a compiled program is
// waiting to be activated by the scan task. The final submit call still rechecks.
bool script_engine_can_accept_upload(char* response_buf, size_t response_buf_len);

// Called by the deterministic scan task. Executes the currently active compiled scan().
bool script_engine_run_scan(void);

uint32_t script_engine_get_generation(void);
const char* script_engine_get_last_error(void);
ScriptCompileState script_engine_get_state(void);

// JSON status helper for /api/script_status.
void script_engine_get_status_json(char* out, size_t out_len);

#ifdef __cplusplus
}
#endif
