#include "ethernet_web.hpp"
#include "perf_test.hpp"
#include "udp_server.hpp"

#include "esp_log.h"
#include "esp_system.h"
#include "esp_heap_caps.h"
#include "nvs_flash.h"
#include "esp_littlefs.h"

static const char* TAG = "APP_MAIN";


static void mount_littlefs(void)
{
    ESP_LOGI(TAG, "Mounting LittleFS at /littlefs");

    esp_vfs_littlefs_conf_t conf = {};
    conf.base_path = "/littlefs";
    conf.partition_label = "storage";
    conf.format_if_mount_failed = true;
    conf.dont_mount = false;

    esp_err_t ret = esp_vfs_littlefs_register(&conf);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "LittleFS mount failed: %s", esp_err_to_name(ret));
        return;
    }

    size_t total = 0;
    size_t used = 0;
    ret = esp_littlefs_info("storage", &total, &used);
    if (ret == ESP_OK) {
        ESP_LOGI(TAG, "LittleFS mounted: total=%u used=%u free=%u",
                 (unsigned)total,
                 (unsigned)used,
                 (unsigned)(total - used));
    } else {
        ESP_LOGW(TAG, "esp_littlefs_info failed: %s", esp_err_to_name(ret));
    }
}


extern "C" void app_main(void)
{
    ESP_LOGI(TAG, "ESP32-P4 AngelScript PLC starting");

    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ESP_ERROR_CHECK(nvs_flash_init());
    } else {
        ESP_ERROR_CHECK(ret);
    }

    mount_littlefs();

    ESP_LOGI(TAG, "Heap free 8-bit=%u internal=%u psram=%u",
             (unsigned)heap_caps_get_free_size(MALLOC_CAP_8BIT),
             (unsigned)heap_caps_get_free_size(MALLOC_CAP_INTERNAL | MALLOC_CAP_8BIT),
             (unsigned)heap_caps_get_free_size(MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT));

    ethernet_web_start();
    udp_server_start();
    perf_test_start();

    ESP_LOGI(TAG, "Runtime started. Upload AngelScript to POST /api/upload_script");
}
