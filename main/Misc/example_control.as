// Minimal AngelScript control script for the first ESP32-P4 test.
// The C++ engine will call scan() once per PLC scan.

uint counter = 0;

void scan()
{
    counter++;

    // Toggle output word 0 every 100 scans.
    if ((counter % 100) < 50)
        setDO(0, 1);
    else
        setDO(0, 0);
}
