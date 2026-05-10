<template>
  <div class="header-status" :class="{ 'is-offline': !online }" aria-label="PLC runtime status">
    <span class="hs-item" :class="online ? 'ok' : 'bad'">
      <span class="hs-dot"></span>{{ online ? 'Online' : 'Offline' }}
    </span>
    <span class="hs-sep">/</span>
    <span class="hs-item" :class="plcRunning ? 'run' : 'stop'">{{ plcMode }}</span>
    <span class="hs-sep">/</span>
    <span class="hs-item" :class="flashWritesAllowed ? 'ok' : 'warn'">{{ flashWritesAllowed ? 'Writes enabled' : 'Writes locked' }}</span>
    <span class="hs-sep hide-xs">/</span>
    <span class="hs-item hide-xs">PLC {{ plcWorkAvg }}</span>
    <span class="hs-sep hide-sm">/</span>
    <span class="hs-item hide-sm">Script <b :class="scriptTone">{{ scriptState }}</b></span>
    <span class="hs-sep hide-md">/</span>
    <span class="hs-item hide-md">Script avg {{ scriptAvg }}</span>
    <span class="hs-sep hide-lg">/</span>
    <span class="hs-item hide-lg">Cache {{ cacheAge }}</span>
    <span class="hs-sep hide-md">/</span>
    <span class="hs-item hide-md">Tags {{ pointCount }}</span>
    <span v-if="isStale" class="hs-sep">/</span>
    <span v-if="isStale" class="hs-item warn">Stale {{ commandAgeLabel }}</span>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { usePlcStore } from '../stores/plcStore';

const store = usePlcStore();
const overview = store.overview;
const script = store.script;
const online = store.online;
const plcMode = store.plcMode;
const plcRunning = store.plcRunning;
const flashWritesAllowed = store.flashWritesAllowed;
const scriptState = store.scriptState;
const pointCount = store.pointCount;
const commandLastUpdated = store.commandLastUpdated;

const nowMs = ref(Date.now());
let ageTimer = null;

onMounted(() => {
  ageTimer = setInterval(() => { nowMs.value = Date.now(); }, 1000);
});

onBeforeUnmount(() => {
  if (ageTimer) clearInterval(ageTimer);
});

function fmtUs(value) {
  const v = Number(value || 0);
  if (!v) return '--';
  if (v >= 1000) return `${(v / 1000).toFixed(2)}ms`;
  return `${Math.round(v)}µs`;
}

function fmtMs(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return '--';
  if (v >= 1000) return `${(v / 1000).toFixed(1)}s`;
  return `${Math.round(v)}ms`;
}

const plcWorkAvg = computed(() => fmtUs(overview.value.plc_work_avg_us));
const scriptAvg = computed(() => fmtUs(script.value.run_scan_us_window_avg || script.value.run_scan_us_ema));
const cacheAge = computed(() => fmtMs(overview.value.cache_age_ms));

const commandAgeMs = computed(() => {
  const last = Number(commandLastUpdated.value || 0);
  return last ? Math.max(0, nowMs.value - last) : 0;
});
const commandAgeLabel = computed(() => commandAgeMs.value >= 1000 ? `${Math.round(commandAgeMs.value / 1000)}s` : `${Math.round(commandAgeMs.value)}ms`);
const isStale = computed(() => online.value && commandAgeMs.value > 5000);

const scriptTone = computed(() => {
  const s = String(scriptState.value || '').toUpperCase();
  if (s === 'FAILED' || s === 'QUEUE_FULL') return 'bad-text';
  if (s === 'QUEUED' || s === 'COMPILING') return 'warn-text';
  if (s === 'OK') return 'ok-text';
  return '';
});
</script>
