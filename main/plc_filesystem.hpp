#pragma once

#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

// LittleFS mount point used by the PLC project.
#define PLC_FS_MOUNT_POINT "/littlefs"

// Mounts the PLC LittleFS partition at PLC_FS_MOUNT_POINT.
esp_err_t plc_filesystem_mount(void);

// Creates the standard PLC directory layout if missing.
esp_err_t plc_filesystem_ensure_standard_dirs(void);

// Mounts LittleFS, reports usage, and ensures the standard directory layout.
esp_err_t plc_filesystem_init(void);

#ifdef __cplusplus
}
#endif
