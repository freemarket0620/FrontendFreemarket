import { computed, ref } from 'vue';
import { getCommandCenter, getPlcData, setPlcMode, writePlcTag } from '../api/plcApi';

// Lightweight singleton store. No Pinia dependency, no duplicate pollers.
const overview = ref({});
const plc = ref({});
const script = ref({});
const plcData = ref({ points: [] });
const pointsByName = ref({});
const tagNames = ref([]);
const online = ref(false);
const plcDataOnline = ref(false);
const lastError = ref('');
const commandPollMs = ref(1000);
const dataPollMs = ref(100);
const commandLastUpdated = ref(0);
const dataLastUpdated = ref(0);

let commandTimer = null;
let dataTimer = null;
let commandInflight = null;
let dataInflight = null;
let dataUsers = 0;
let started = false;

const stateName = (s) => typeof s === 'string' ? s : (['IDLE','QUEUED','COMPILING','OK','FAILED','QUEUE_FULL'][s] || s || 'UNKNOWN');

const scriptState = computed(() => stateName(script.value.state ?? overview.value.script_state));
const plcRunning = computed(() => overview.value.plc_running !== undefined ? !!overview.value.plc_running : overview.value.plc_mode === 'RUN');
const flashWritesAllowed = computed(() => overview.value.flash_writes_allowed !== undefined ? !!overview.value.flash_writes_allowed : !plcRunning.value);
const plcMode = computed(() => overview.value.plc_mode || (plcRunning.value ? 'RUN' : 'STOP'));
const pointCount = computed(() => Number(plcData.value.point_count ?? tagNames.value.length ?? overview.value.cache_points ?? 0));

function currentCommandInterval() {
  return document.hidden ? Math.max(3000, commandPollMs.value) : commandPollMs.value;
}
function currentDataInterval() {
  return document.hidden ? Math.max(2000, dataPollMs.value) : dataPollMs.value;
}
function resetCommandTimer() {
  if (commandTimer) clearInterval(commandTimer);
  commandTimer = setInterval(refreshCommandCenter, currentCommandInterval());
}
function resetDataTimer() {
  if (dataTimer) clearInterval(dataTimer);
  dataTimer = null;
  if (dataUsers > 0) dataTimer = setInterval(refreshPlcData, currentDataInterval());
}

async function refreshCommandCenter() {
  if (commandInflight) return commandInflight;
  commandInflight = (async () => {
    try {
      const cc = await getCommandCenter();
      overview.value = cc.overview || {};
      script.value = cc.script || {};
      plc.value = cc.plc || {};
      online.value = true;
      lastError.value = '';
      commandLastUpdated.value = Date.now();
      // command_center carries masks/ticks. Keep a light plcData fallback for pages
      // that only need I/Q masks and tick_count.
      plcData.value = {
        ...plcData.value,
        tick_count: plc.value.tick_count,
        di_mask: plc.value.di_mask,
        do_mask: plc.value.do_mask,
      };
      return cc;
    } catch (e) {
      online.value = false;
      lastError.value = e?.message || String(e);
      throw e;
    } finally {
      commandInflight = null;
    }
  })();
  return commandInflight;
}

async function refreshPlcData() {
  if (dataInflight) return dataInflight;
  dataInflight = (async () => {
    try {
      const data = await getPlcData();
      const map = {};
      const names = [];
      for (const p of data.points || []) {
        map[p.name] = p;
        names.push(p.name);
      }
      plcData.value = data;
      pointsByName.value = map;
      tagNames.value = names.sort();
      plcDataOnline.value = true;
      dataLastUpdated.value = Date.now();
      return data;
    } catch (e) {
      plcDataOnline.value = false;
      throw e;
    } finally {
      dataInflight = null;
    }
  })();
  return dataInflight;
}

function start() {
  if (started) return;
  started = true;
  refreshCommandCenter().catch(() => {});
  resetCommandTimer();
  document.addEventListener('visibilitychange', () => {
    resetCommandTimer();
    resetDataTimer();
    if (!document.hidden) {
      refreshCommandCenter().catch(() => {});
      if (dataUsers > 0) refreshPlcData().catch(() => {});
    }
  });
}

function usePlcData() {
  dataUsers++;
  if (dataUsers === 1) {
    refreshPlcData().catch(() => {});
    resetDataTimer();
  }
  return () => {
    dataUsers = Math.max(0, dataUsers - 1);
    if (dataUsers === 0) resetDataTimer();
  };
}

async function setPlcRun(run) {
  await setPlcMode(run);
  await refreshCommandCenter().catch(() => {});
}

async function plcWrite(tag, value) {
  await writePlcTag(tag, value);
  refreshPlcData().catch(() => {});
}

export function usePlcStore() {
  return {
    overview, plc, script, plcData, pointsByName, tagNames,
    online, plcDataOnline, lastError, commandLastUpdated, dataLastUpdated,
    commandPollMs, dataPollMs,
    scriptState, plcRunning, flashWritesAllowed, plcMode, pointCount,
    start, usePlcData, refreshCommandCenter, refreshPlcData, setPlcRun, plcWrite,
  };
}
