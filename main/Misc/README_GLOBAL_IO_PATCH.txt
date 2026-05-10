ESP32-P4 AngelScript PLC global-I/O patch

This version removes the user-facing getDI/setDO/getAI/setAO script API.
AngelScript uses global process-image variables instead:

  bool  I0..I15   // debounced digital inputs, copied from C++ before Scan()
  bool  Q0..Q7    // digital output commands, copied back to C++ after Scan()
  float AI0..AI3  // analog input image
  float AO0..AO3  // analog output command image

C++ owns the physical GPIO process image in plc_io.cpp.
script_engine.cpp owns a per-program copy of the script globals and registers each
I/Q/AI/AO element using RegisterGlobalProperty().

Scan flow:
  1 ms:  plc_io_tick_1ms() reads GPIO and performs 3 ms debounce.
  5 ms:  script_engine_run_scan() copies C++ I/AI into script globals, executes Scan(float),
         copies script Q/AO back to C++, then plc_io_apply_outputs() writes GPIO.

GPIO map from uploaded 40-pin header:
  I0 GPIO23, I1 GPIO21, I2 GPIO20, I3 GPIO6,  I4 GPIO3,  I5 GPIO2,
  I6 GPIO24, I7 GPIO33, I8 GPIO26, I9 GPIO48, I10 GPIO53, I11 GPIO47,
  I12 GPIO22, I13 GPIO5, I14 GPIO4, I15 GPIO1

  Q0 GPIO36, Q1 GPIO32, Q2 GPIO25, Q3 GPIO54, Q4 GPIO46, Q5 GPIO27,
  Q6 GPIO45, Q7 GPIO7

Inputs are active-low with pullups for easy bench testing: jumper input GPIO to GND = true.
