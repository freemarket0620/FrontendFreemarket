// ESP32-P4 PLC test script using process-image GLOBAL VARIABLES.
// No I/O functions are needed in the script.
//
// Digital inputs from C++ debounce/process image:
//   I0..I15
// Digital outputs copied back to C++ and written to GPIO:
//   Q0..Q7
// Synthetic analogs for now:
//   AI0..AI3, AO0..AO3
// Utility still available:
//   logInt(uint v)
//
// Pin map from the uploaded 40-pin header image:
//   I0  GPIO23    I1  GPIO21    I2  GPIO20    I3  GPIO6
//   I4  GPIO3     I5  GPIO2     I6  GPIO24    I7  GPIO33
//   I8  GPIO26    I9  GPIO48    I10 GPIO53    I11 GPIO47
//   I12 GPIO22    I13 GPIO5     I14 GPIO4     I15 GPIO1
//
//   Q0  GPIO36    Q1  GPIO32    Q2  GPIO25    Q3  GPIO54
//   Q4  GPIO46    Q5  GPIO27    Q6  GPIO45    Q7  GPIO7
//
// Inputs are active-low in C++ for easy testing: jumper input GPIO to GND = true.

bool run_latch = false;
bool fault_latch = false;
bool last_start = false;
bool last_stop = false;
bool last_reset = false;
float heartbeat_acc = 0.0f;
bool heartbeat = false;
uint scan_count = 0;

bool rising(bool now, bool last)
{
    return now && !last;
}

void Scan(float dt)
{
    // Example control assignment:
    //   I0 = start
    //   I1 = stop
    //   I2 = estop/fault input
    //   I3 = reset
    bool start = I0;
    bool stop  = I1;
    bool estop = I2;
    bool reset = I3;

    bool start_edge = rising(start, last_start);
    bool stop_edge  = rising(stop,  last_stop);
    bool reset_edge = rising(reset, last_reset);

    last_start = start;
    last_stop = stop;
    last_reset = reset;

    if (estop) {
        fault_latch = true;
        run_latch = false;
    }

    if (reset_edge && !estop) {
        fault_latch = false;
    }

    if (stop_edge) {
        run_latch = false;
    }

    if (start_edge && !fault_latch && !estop) {
        run_latch = true;
    }

    heartbeat_acc += dt;
    if (heartbeat_acc >= 0.5f) {
        heartbeat_acc = 0.0f;
        heartbeat = !heartbeat;
    }

    // Outputs are plain globals. C++ copies these back to the output process
    // image after Scan() and then writes the physical GPIO pins.
    Q0 = run_latch;
    Q1 = heartbeat;
    Q2 = fault_latch;
    Q3 = I0;       // direct mirror of debounced input 0 for quick testing
    Q4 = I4 && I5; // simple logic test
    Q5 = I6 || I7;
    Q6 = !I8;
    Q7 = I9;

    AO0 = AI0;
    AO1 = AI1;

    scan_count++;
    if ((scan_count % 200u) == 0u) { // about once per second at 5 ms scan
        logInt(scan_count);
    }
}
