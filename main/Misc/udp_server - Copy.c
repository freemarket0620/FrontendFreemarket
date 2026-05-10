#include "udp_server.hpp"

#include <string.h>
#include <errno.h>
#include <stdint.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "esp_log.h"
#include "esp_timer.h"

#include "lwip/sockets.h"
#include "lwip/netdb.h"
#include "lwip/inet.h"

static const char *TAG = "UDP_SERVER";

#define UDP_PORT 5005
#define UDP_RX_BUFFER_SIZE 1500
#define UDP_TX_PAYLOAD_SIZE 1400

#define UDP_TASK_STACK_SIZE 4096
#define UDP_TASK_PRIORITY   14
#define UDP_TASK_CORE       1

#define UDP_MAGIC 0x50345544u  // "UDP4" little-endian-ish marker
#define UDP_VERSION 1

typedef struct __attribute__((packed)) {
    uint32_t magic;
    uint16_t version;
    uint16_t packet_size;

    uint32_t request_seq;
    uint32_t response_seq;

    uint32_t rx_len;
    uint32_t flags;

    uint64_t esp_rx_time_us;
    uint64_t esp_tx_time_us;

    uint8_t payload[UDP_TX_PAYLOAD_SIZE - 40];
} udp_response_packet_t;

static_assert(sizeof(udp_response_packet_t) == UDP_TX_PAYLOAD_SIZE,
              "UDP response packet must be exactly UDP_TX_PAYLOAD_SIZE bytes");

static void udp_server_task(void *arg)
{
    (void)arg;

    uint8_t rx_buffer[UDP_RX_BUFFER_SIZE];
    udp_response_packet_t tx_packet;

    int sock = socket(AF_INET, SOCK_DGRAM, IPPROTO_IP);
    if (sock < 0) {
        ESP_LOGE(TAG, "socket failed: errno=%d", errno);
        vTaskDelete(NULL);
        return;
    }

    struct sockaddr_in listen_addr = {0};
    listen_addr.sin_family = AF_INET;
    listen_addr.sin_port = htons(UDP_PORT);
    listen_addr.sin_addr.s_addr = htonl(INADDR_ANY);

    int err = bind(sock, (struct sockaddr *)&listen_addr, sizeof(listen_addr));
    if (err < 0) {
        ESP_LOGE(TAG, "bind failed: errno=%d", errno);
        close(sock);
        vTaskDelete(NULL);
        return;
    }

    ESP_LOGI(TAG, "UDP binary server listening on port %d", UDP_PORT);
    ESP_LOGI(TAG, "UDP task priority=%d core=%d", UDP_TASK_PRIORITY, UDP_TASK_CORE);
    ESP_LOGI(TAG, "UDP binary response size=%d bytes", UDP_TX_PAYLOAD_SIZE);

    uint32_t response_counter = 0;

    while (true) {
        struct sockaddr_in source_addr = {0};
        socklen_t socklen = sizeof(source_addr);

        int len = recvfrom(
            sock,
            rx_buffer,
            sizeof(rx_buffer),
            0,
            (struct sockaddr *)&source_addr,
            &socklen
        );

        if (len < 0) {
            ESP_LOGW(TAG, "recvfrom failed: errno=%d", errno);
            continue;
        }

        uint64_t rx_time_us = (uint64_t)esp_timer_get_time();

        uint32_t request_seq = 0;
        if (len >= 4) {
            memcpy(&request_seq, rx_buffer, sizeof(request_seq));
        }

        response_counter++;

        memset(&tx_packet, 0, sizeof(tx_packet));

        tx_packet.magic = UDP_MAGIC;
        tx_packet.version = UDP_VERSION;
        tx_packet.packet_size = UDP_TX_PAYLOAD_SIZE;

        tx_packet.request_seq = request_seq;
        tx_packet.response_seq = response_counter;

        tx_packet.rx_len = (uint32_t)len;
        tx_packet.flags = 0;

        tx_packet.esp_rx_time_us = rx_time_us;
        tx_packet.esp_tx_time_us = (uint64_t)esp_timer_get_time();

        for (int i = 0; i < (int)sizeof(tx_packet.payload); i++) {
            tx_packet.payload[i] = (uint8_t)(i & 0xFF);
        }

        int sent = sendto(
            sock,
            &tx_packet,
            sizeof(tx_packet),
            0,
            (struct sockaddr *)&source_addr,
            sizeof(source_addr)
        );

        if (sent < 0) {
            ESP_LOGW(TAG, "sendto failed: errno=%d", errno);
        }
    }
}

void udp_server_start(void)
{
    BaseType_t ok = xTaskCreatePinnedToCore(
        udp_server_task,
        "udp_server",
        UDP_TASK_STACK_SIZE,
        NULL,
        UDP_TASK_PRIORITY,
        NULL,
        UDP_TASK_CORE
    );

    if (ok != pdPASS) {
        ESP_LOGE(TAG, "Failed to create UDP server task");
    }
}