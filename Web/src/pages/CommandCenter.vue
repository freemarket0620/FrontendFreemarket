<template>

  <main class="app-page grid grid-cols-12 gap-5">
    <section class="col-span-12 lg:col-span-4 space-y-5">
      <div class="panel rounded-md p-5">
        <div class="flex justify-between items-start border-b border-slate-800 pb-4">
          <div>
            <div class="text-[10px] text-slate-500 font-black tracking-widest uppercase">Controller State</div>
            <div class="mt-2 flex items-center gap-3">
              <span class="led" :class="scriptRunning ? 'led-on' : 'led-warn'"></span>
              <span class="lcd text-2xl font-black" :class="scriptRunning ? 'text-emerald-300' : 'text-amber-300'">{{ controllerMode }}</span>
            </div>
            <div class="mt-2 text-[10px] text-slate-500 font-black tracking-widest uppercase">Active Script</div>
            <div class="lcd mt-1 text-sm text-sky-200 truncate max-w-[260px]" :title="activeScriptPath || activeScriptName || 'No active script'">{{ activeScriptName || '—' }}</div>
          </div>
          <div class="text-right lcd text-xs text-slate-400">
            <div>UPTIME</div>
            <div class="text-white text-lg">{{ uptimeText }}</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mt-4 text-sm lcd">
          <div class="hard-panel rounded p-3"><div class="text-slate-500 text-[10px] uppercase">Script Gen</div><div class="text-white text-xl">{{ script.generation ?? overview.script_generation ?? 0 }}</div></div>
          <div class="hard-panel rounded p-3"><div class="text-slate-500 text-[10px] uppercase">State</div><div class="text-sky-300 text-xl">{{ scriptState }}</div></div>
          <div class="hard-panel rounded p-3"><div class="text-slate-500 text-[10px] uppercase">Ticks</div><div class="text-white text-xl">{{ plc.tick_count ?? plcData.tick_count ?? overview.tick_count ?? 0 }}</div></div>
          <div class="hard-panel rounded p-3"><div class="text-slate-500 text-[10px] uppercase">Points</div><div class="text-white text-xl">{{ plcData.point_count ?? overview.cache_points ?? 0 }}</div></div>
          <div class="hard-panel rounded p-3"><div class="text-slate-500 text-[10px] uppercase">ETH Link</div><div class="text-emerald-300 text-xl">{{ online ? 'UP' : 'DOWN' }}</div></div>
          <div class="hard-panel rounded p-3"><div class="text-slate-500 text-[10px] uppercase">Cache Age</div><div class="text-white text-xl">{{ overview.cache_age_ms ?? '--' }}<span class="text-xs text-slate-500">ms</span></div></div>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <button @click="setPlcRun(true)" :disabled="plcRunning" class="px-4 py-3 rounded border text-xs font-black" :class="plcRunning ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-900 border-emerald-700 text-emerald-200 hover:bg-emerald-800'">RUN PLC</button>
          <button @click="setPlcRun(false)" :disabled="!plcRunning" class="px-4 py-3 rounded border text-xs font-black" :class="!plcRunning ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed' : 'bg-amber-900 border-amber-700 text-amber-200 hover:bg-amber-800'">STOP PLC</button>
        </div>
        <div v-if="!flashWritesAllowed" class="mt-3 rounded border border-amber-800 bg-amber-950/35 text-amber-200 px-3 py-2 text-xs font-bold">PLC RUN mode active — LittleFS uploads, deletes, folder creation, and tag saves are locked to protect scan latency.</div>
        <div v-else class="mt-3 rounded border border-emerald-800 bg-emerald-950/30 text-emerald-200 px-3 py-2 text-xs font-bold">PLC STOP mode active — filesystem writes are enabled.</div>
      </div>

      <div class="faceplate rounded-md p-5 relative overflow-hidden">
        <div class="rail absolute left-0 right-0 top-0 h-6 opacity-40"></div>
        <div class="flex justify-between relative z-10 mb-5">
          <div class="screw"></div><div class="screw"></div>
        </div>
        <div class="relative z-10 border border-slate-700 bg-slate-950/70 rounded p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="text-2xl font-black text-white tracking-tight"><span class="text-sky-400 italic">Pi</span>Lab <span class="text-slate-400">PLC-P4</span></div>
            <div class="lcd text-[10px] text-slate-500">REV A</div>
          </div>
          <div class="grid grid-cols-4 gap-3 text-center mb-4">
            <div><div class="led led-on mx-auto"></div><div class="lcd text-[10px] text-slate-500 mt-2">PWR</div></div>
            <div><div class="led mx-auto" :class="scriptRunning ? 'led-on' : ''"></div><div class="lcd text-[10px] text-slate-500 mt-2">RUN</div></div>
            <div><div class="led mx-auto" :class="online ? 'led-on' : ''"></div><div class="lcd text-[10px] text-slate-500 mt-2">ETH</div></div>
            <div><div class="led mx-auto" :class="faultActive ? 'led-bad' : ''"></div><div class="lcd text-[10px] text-slate-500 mt-2">FLT</div></div>
          </div>
          <div class="lcd text-[11px] text-slate-500 leading-5 border-t border-slate-800 pt-3">
            <div>CPU ESP32-P4 // 360 MHz</div>
            <div>ETH {{ overview.ip || '192.168.5.210' }} // STATIC</div>
            <div>TAGS {{ overview.tag_count ?? '--' }} // CACHE {{ overview.cache_period_ms ?? 100 }}ms</div>
            <div>DASHBOARD POLL {{ pollCadenceLabel }}</div>
          </div>
        </div>
      </div>

    </section>

    <section class="col-span-12 lg:col-span-8 space-y-5">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="panel rounded-md p-4">
          <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest">PLC Work Avg</div>
          <div class="lcd text-2xl font-black mt-1 text-sky-300">{{ metricDisplay(overview.plc_work_avg_us) }}<span class="text-xs ml-1 text-slate-500">µs</span></div>
        </div>
        <div class="panel rounded-md p-4">
          <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest">Cache Build</div>
          <div class="lcd text-2xl font-black mt-1 text-emerald-300">{{ metricDisplay(overview.cache_build_us) }}<span class="text-xs ml-1 text-slate-500">µs</span></div>
        </div>
        <div class="panel rounded-md p-4">
          <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest">Script Avg</div>
          <div class="lcd text-2xl font-black mt-1 text-sky-300">{{ scriptAvgDisplay }}</div>
        </div>
        <div class="panel rounded-md p-4">
          <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest">Internal Free</div>
          <div class="lcd text-2xl font-black mt-1 text-white">{{ metricDisplay(overview.heap_internal_free, 'B') }}<span class="text-xs ml-1 text-slate-500">B</span></div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="panel rounded-md p-4">
          <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest">Script Scans</div>
          <div class="lcd text-2xl font-black mt-1 text-white">{{ metricDisplay(script.script_scans_completed ?? overview.script_scan_count) }}</div>
        </div>
        <div class="panel rounded-md p-4">
          <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest">Script 1s Max</div>
          <div class="lcd text-2xl font-black mt-1" :class="scriptPeakTone === 'amber' ? 'text-amber-300' : 'text-sky-300'">{{ scriptPeakDisplay }}</div>
        </div>
        <div class="panel rounded-md p-4">
          <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest">Last Compile</div>
          <div class="lcd text-2xl font-black mt-1 text-sky-300">{{ metricDisplay(compileMs) }}<span class="text-xs ml-1 text-slate-500">ms</span></div>
        </div>
        <div class="panel rounded-md p-4">
          <div class="text-[10px] text-slate-500 uppercase font-black tracking-widest">PSRAM Free</div>
          <div class="lcd text-2xl font-black mt-1 text-white">{{ metricDisplay(overview.heap_psram_free, 'B') }}<span class="text-xs ml-1 text-slate-500">B</span></div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div class="panel rounded-md p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="text-[10px] text-slate-500 font-black tracking-widest uppercase">Digital Inputs</div>
            <div class="lcd text-xs text-slate-500">MASK {{ hex(plcData.di_mask ?? plc.di_mask ?? 0) }}</div>
          </div>
          <div class="grid grid-cols-8 gap-2">
            <div v-for="i in 16" class="hard-panel rounded p-2 text-center">
              <div class="text-[10px] text-slate-500 lcd">I{{ i-1 }}</div>
              <div class="led mx-auto mt-2" :class="pointValue('I'+(i-1)) ? 'led-on' : ''"></div>
            </div>
          </div>
        </div>
        <div class="panel rounded-md p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="text-[10px] text-slate-500 font-black tracking-widest uppercase">Digital Outputs</div>
            <div class="lcd text-xs text-slate-500">MASK {{ hex(plcData.do_mask ?? plc.do_mask ?? 0) }}</div>
          </div>
          <div class="grid grid-cols-8 gap-2">
            <div v-for="i in 8" class="hard-panel rounded p-2 text-center">
              <div class="text-[10px] text-slate-500 lcd">Q{{ i-1 }}</div>
              <div class="led mx-auto mt-2" :class="pointValue('Q'+(i-1)) ? 'led-on' : ''"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel rounded-md p-5">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="text-[10px] text-slate-500 font-black tracking-widest uppercase flex items-center gap-2"><span class="led led-on"></span> System Pulse</div>
          <div class="flex items-center gap-2 text-[10px] font-black">
            <button v-for="m in trendModes" @click="trendMode=m.key" class="px-2 py-1 border rounded" :class="trendMode===m.key?'border-sky-600 text-sky-300 bg-sky-950/40':'border-slate-700 text-slate-500 bg-slate-950/50'">{{ m.label }}</button>
            <span class="lcd text-slate-500 ml-2">DASHBOARD 1000ms // CACHE 100ms</span>
          </div>
        </div>
        <div class="h-36 scan-grid bg-black/50 border border-slate-800 rounded relative overflow-hidden">
          <svg class="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <polyline :points="trendPoints" fill="none" stroke="currentColor" stroke-width="1.8" class="text-sky-400"></polyline>
          </svg>
          <div class="absolute left-3 top-3 lcd text-xs text-slate-400">{{ trendLabel }}</div>
          <div class="absolute right-3 bottom-3 lcd text-xs text-slate-500">latest {{ latestTrend }} {{ trendUnit }}</div>
        </div>
      </div>

      <div class="panel rounded-md p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="text-[10px] text-slate-500 font-black tracking-widest uppercase">System Event Log</div>
          <button @click="events=[]" class="text-[10px] text-slate-500 hover:text-slate-200">CLEAR</button>
        </div>
        <div class="hard-panel rounded p-3 h-40 overflow-y-auto lcd text-xs space-y-1">
          <div v-for="e in events" :key="e.id" class="flex gap-3"><span class="text-slate-600">[{{ e.t }}]</span><span :class="e.warn?'text-amber-300':'text-slate-300'">{{ e.msg }}</span></div>
        </div>
      </div>
    </section>
  </main>

</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { usePlcStore } from '../stores/plcStore';

const store = usePlcStore();
const overview = store.overview;
const plc = store.plc;
const script = store.script;
const plcData = store.plcData;
const online = store.online;
const scriptState = store.scriptState;
const plcRunning = store.plcRunning;
const flashWritesAllowed = store.flashWritesAllowed;
const activeScriptName = store.activeScriptName;
const activeScriptPath = store.activeScriptPath;

const events=ref([]); let eid=0;
const trendMode=ref('script'); const trends=ref({cache:[],script:[],scriptPeak:[],heap:[],poll:[]});
const lastGen=ref(null); const lastState=ref(null); const lastTicks=ref(null); const lastPollMs=ref(null); const observedJitterUs=ref(null);
const trendModes=[{key:'cache',label:'CACHE'},{key:'script',label:'SCRIPT AVG'},{key:'scriptPeak',label:'PEAK'},{key:'heap',label:'HEAP'},{key:'poll',label:'UI'}];
const now=()=>new Date().toLocaleTimeString();
const log=(msg,warn=false)=>{events.value.unshift({id:++eid,t:now(),msg,warn}); events.value=events.value.slice(0,50)};

const controllerMode=computed(()=>{
  if(!online.value) return 'OFFLINE';
  if(overview.value.plc_mode) return overview.value.plc_mode;
  const st=scriptState.value;
  if(st==='COMPILING'||st==='QUEUED') return 'PROGRAM';
  if(st==='FAILED'||st==='QUEUE_FULL') return 'FAULT';
  if(st==='OK') return 'RUN';
  return 'IDLE';
});
const scriptRunning=computed(()=>plcRunning.value || controllerMode.value==='RUN');
const faultActive=computed(()=> controllerMode.value==='FAULT' || !online.value);
const uptimeText=computed(()=>{let s=Math.floor((overview.value.uptime_ms||0)/1000); const h=Math.floor(s/3600); s%=3600; const m=Math.floor(s/60); const sec=s%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`});
const compileMs=computed(()=> script.value.last_compile_us ? Math.round(script.value.last_compile_us/1000) : null);
const pollDriftDisplay=computed(()=> observedJitterUs.value===null ? '--' : `${observedJitterUs.value}µs`);
const pollCadenceLabel=computed(()=> `${overview.value.cache_period_ms||100}ms cache / ${overview.value.dashboard_period_ms||1000}ms ui`);

const metricDisplay = (value, suffix = '') => {
  if (value === undefined || value === null || value === '') return '--';
  if (suffix === 'B') return Number(value).toLocaleString();
  return value;
};

const fmtUs=(v)=>{ v=Number(v||0); if(!v) return '--'; if(v>=1000) return (v/1000).toFixed(2)+'ms'; return Math.round(v)+'µs'; };
const scriptAvgDisplay=computed(()=>fmtUs(script.value.run_scan_us_window_avg || script.value.run_scan_us_ema || 0));
const scriptPeakDisplay=computed(()=>fmtUs(script.value.run_scan_us_window_max || 0));
const scriptPeakTone=computed(()=> Number(script.value.run_scan_us_window_max||0) > 5000 ? 'amber' : 'sky');
const pointValue=(name)=>{ const m=/^([IQ])(\d+)$/.exec(name); if(m){ const bit=Number(m[2]); const mask=m[1]==='I' ? Number(plc.value.di_mask ?? overview.value.di_mask ?? 0) : Number(plc.value.do_mask ?? overview.value.do_mask ?? 0); return !!(mask & (1<<bit)); } const p=(plcData.value.points||[]).find(x=>x.name===name); return !!(p&&p.value)};
const hex=(v)=>'0x'+Number(v||0).toString(16).toUpperCase();
const pushTrend=(key,val)=>{ if(val===undefined||val===null||Number.isNaN(Number(val))) return; const a=trends.value[key]; a.push(Number(val)); if(a.length>80) a.shift(); };
const trendLabel=computed(()=> trendMode.value==='cache'?'cache build µs':trendMode.value==='script'?'script avg µs, 1s window':trendMode.value==='scriptPeak'?'script max µs, 1s window':trendMode.value==='heap'?'internal free bytes':'web dashboard poll drift µs');
const trendUnit=computed(()=> trendMode.value==='heap'?'B':'µs');
const latestTrend=computed(()=>{const a=trends.value[trendMode.value]||[]; if(!a.length) return '--'; return Math.round(a[a.length-1]).toLocaleString();});
const trendMax=computed(()=>{ if(trendMode.value==='script') return 2500; if(trendMode.value==='scriptPeak') return 6000; if(trendMode.value==='cache') return 2000; if(trendMode.value==='poll') return 20000; return null; });
const trendPoints=computed(()=>{const arr=(trends.value[trendMode.value]||[]); if(!arr.length) return ''; let min=0, max=trendMax.value; if(!max){ min=Math.min(...arr); max=Math.max(...arr); } const span=Math.max(1,max-min); return arr.map((v,i)=>{ const vv=Math.max(min,Math.min(max,Number(v))); return `${(i/Math.max(1,arr.length-1))*100},${94-((vv-min)/span)*82}`; }).join(' ')});

async function setPlcRun(run){
  try{ await store.setPlcRun(run); log(run ? 'PLC set to RUN mode' : 'PLC set to STOP mode', !run); }
  catch(e){ log('PLC mode command failed: ' + (e.message||e), true); }
}
function sampleStoreTrends(){
  const gen=script.value.generation ?? overview.value.script_generation; if(lastGen.value!==null && gen!==lastGen.value) log(`Script generation changed: ${lastGen.value} -> ${gen}`); lastGen.value=gen;
  const st=scriptState.value; if(lastState.value!==null && st!==lastState.value) log(`Script state changed: ${lastState.value} -> ${st}`, st==='FAILED'); lastState.value=st;
  const ticks=Number(plc.value.tick_count ?? overview.value.tick_count ?? 0); const nowMs=performance.now();
  if(lastTicks.value!==null && lastPollMs.value!==null){ const dtTicks=ticks-lastTicks.value; const dtMs=nowMs-lastPollMs.value; const driftUs=Math.max(0,Math.round(Math.abs(dtTicks-dtMs)*1000)); observedJitterUs.value=driftUs; pushTrend('poll',driftUs); }
  lastTicks.value=ticks; lastPollMs.value=nowMs;
  pushTrend('cache',overview.value.cache_build_us||0); pushTrend('script',script.value.run_scan_us_window_avg || script.value.run_scan_us_ema || 0); pushTrend('scriptPeak',script.value.run_scan_us_window_max || 0); pushTrend('heap',overview.value.heap_internal_free||0);
}
watch(online, v => log(v ? 'PLC connection online' : 'PLC connection offline', !v));
onMounted(()=>{ log('PiLab command center online'); store.refreshCommandCenter().catch(()=>{}); sampleStoreTrends(); setInterval(sampleStoreTrends,1000); });
</script>
