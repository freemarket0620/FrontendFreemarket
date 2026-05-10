PiLab PLC command-center integration package

Replace/copy these files into your ESP-IDF project main/ folder:

  CMakeLists.txt
  ethernet_web.c
  ethernet_web.hpp
  plc_tags.cpp
  plc_tags.hpp
  indexPiLab_home.html
  indexPrism_p4_api.html
  index23_plc_data.html
  indexTags.html

Routes after this package:

  /                    PiLab PLC Command Center landing page
  /editor              AngelScript Logic Studio
  /hmi                 HMI Designer
  /tags                Tag Registry
  /api/system_overview Lightweight combined dashboard status
  /api/plc_data        Cached HMI/process data
  /api/tags            Tag definitions API
  /api/plc_write       Runtime tag write API

Notes:
- /api/plc_data remains cached and low-impact.
- HMI runtime tag writes remain RAM-only; tag definitions still save through /tags.
- The landing page polls at 200 ms and reads cached data plus lightweight overview/status endpoints.
