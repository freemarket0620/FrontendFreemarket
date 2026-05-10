#pragma once

#ifdef __cplusplus
extern "C" {
#endif

#include <stdbool.h>

void perf_test_start(void);
bool perf_test_is_plc_running(void);
void perf_test_set_plc_running(bool running);
const char *perf_test_get_plc_mode_string(void);

#ifdef __cplusplus
}
#endif
