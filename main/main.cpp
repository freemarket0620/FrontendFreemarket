#include "ethernet_web.hpp"
#include "perf_test.hpp"
#include "udp_server.hpp"
#include "plc_filesystem.hpp"

#include "esp_log.h"
#include "esp_system.h"
#include "esp_heap_caps.h"
#include "nvs_flash.h"

static const char* TAG = "APP_MAIN";



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

    ESP_ERROR_CHECK(plc_filesystem_init());

    ESP_LOGI(TAG, "Heap free 8-bit=%u internal=%u psram=%u",
             (unsigned)heap_caps_get_free_size(MALLOC_CAP_8BIT),
             (unsigned)heap_caps_get_free_size(MALLOC_CAP_INTERNAL | MALLOC_CAP_8BIT),
             (unsigned)heap_caps_get_free_size(MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT));

    ethernet_web_start();
    udp_server_start();
    perf_test_start();

    ESP_LOGI(TAG, "Runtime started. Upload AngelScript to POST /api/upload_script");
}
