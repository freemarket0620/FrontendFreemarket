<template>

  <main class="app-page space-y-4">
    <section class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
      <div><div class="text-sky-400 font-black tracking-widest text-sm uppercase">PLC Tag Registry</div><div class="text-slate-500 text-xs">User tags become AngelScript globals on the next script upload</div></div>
      <div class="flex gap-2"><button @click="load" class="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-xs font-bold hover:bg-slate-700">REFRESH</button><button @click="save" class="px-4 py-2 rounded bg-sky-700 border border-sky-500 text-xs font-black hover:bg-sky-600">SAVE TAGS</button></div>
    </section>
    <section class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="text-[10px] text-slate-500 uppercase font-black">Tags</div>
        <div class="text-3xl font-black text-sky-300">{{ tags.length }}</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="text-[10px] text-slate-500 uppercase font-black">Globals</div>
        <div class="text-3xl font-black text-emerald-300">{{ scriptVisibleCount }}</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="text-[10px] text-slate-500 uppercase font-black">Writable</div>
        <div class="text-3xl font-black text-amber-300">{{ writableCount }}</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="text-[10px] text-slate-500 uppercase font-black">Status</div>
        <div class="text-sm font-bold" :class="statusClass">{{ status }}</div>
      </div>
    </section>

    <section class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div class="p-3 border-b border-slate-800 flex items-center justify-between gap-3">
        <div class="flex gap-2 flex-1">
          <input v-model="filter" class="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono" placeholder="Filter tags...">
          <button @click="addTag" class="px-3 py-2 rounded bg-emerald-800 border border-emerald-600 text-xs font-black hover:bg-emerald-700 whitespace-nowrap">+ ADD TAG</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-black/40 text-slate-500 uppercase text-[10px] tracking-widest">
            <tr>
              <th class="text-left p-3">Name / Global</th>
              <th class="text-left p-3">Type</th>
              <th class="text-left p-3">Value</th>
              <th class="text-left p-3">Units</th>
              <th class="text-left p-3">Min</th>
              <th class="text-left p-3">Max</th>
              <th class="text-left p-3">Flags</th>
              <th class="text-left p-3">Description</th>
              <th class="text-right p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(t, idx) in filteredTags" :key="t.uid" class="border-t border-slate-800 hover:bg-slate-800/40">
              <td class="p-2 min-w-48"><input v-model.trim="t.name" @input="validate" class="w-full bg-slate-950 border rounded px-2 py-1.5 font-mono" :class="nameOk(t.name) ? 'border-slate-700' : 'border-red-600 text-red-300'"></td>
              <td class="p-2"><select v-model="t.type" class="bg-slate-950 border border-slate-700 rounded px-2 py-1.5"><option>bool</option><option>int</option><option>float</option></select></td>
              <td class="p-2 min-w-32">
                <select v-if="t.type==='bool'" v-model="t.value" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5"><option :value="true">true</option><option :value="false">false</option></select>
                <input v-else-if="t.type==='int'" type="number" step="1" v-model.number="t.value" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5">
                <input v-else type="number" step="0.001" v-model.number="t.value" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5">
              </td>
              <td class="p-2"><input v-model="t.units" class="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1.5"></td>
              <td class="p-2"><input type="number" v-model.number="t.min" class="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1.5"></td>
              <td class="p-2"><input type="number" v-model.number="t.max" class="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1.5"></td>
              <td class="p-2 min-w-40 space-y-1">
                <label class="flex items-center gap-2"><input type="checkbox" v-model="t.writable"> Writable</label>
                <label class="flex items-center gap-2"><input type="checkbox" v-model="t.retentive"> Retentive</label>
                <label class="flex items-center gap-2"><input type="checkbox" v-model="t.hmi_visible"> HMI</label>
                <label class="flex items-center gap-2"><input type="checkbox" v-model="t.script_visible"> Script global</label>
              </td>
              <td class="p-2 min-w-64"><input v-model="t.description" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5"></td>
              <td class="p-2 text-right"><button @click="removeTag(t)" class="px-2 py-1 rounded bg-red-950 border border-red-800 text-red-300 font-bold hover:bg-red-800">DELETE</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 leading-relaxed">
      <div class="font-black text-sky-400 uppercase tracking-widest mb-2">Script usage</div>
      <pre class="bg-black/50 border border-slate-800 rounded p-3 overflow-auto text-slate-300"><code>void scan()
{
  if (AutoMode && PumpStart) {
    Q0 = true;
  }

  if (AI0 &gt; TankSetpoint) {
    Q1 = false;
  }
}</code></pre>
      <div class="mt-3">After saving tag definitions, upload/compile the script again. The new tag names are registered as AngelScript globals before the script is built.</div>
    </section>
  </main>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePlcStore } from '../stores/plcStore';
import { loadTags, saveTags } from '../api/tagApi';


    const store = usePlcStore();
    const tags = ref([]), filter = ref(''), status = ref('Loading...');
    const reserved = /^(scan|Scan|true|false|bool|int|float|void|uint|if|else|for|while|return|I\d+|Q\d+|AI\d+|AO\d+)$/;
    const nameOk = n => /^[A-Za-z_][A-Za-z0-9_]{0,31}$/.test(n||'') && !reserved.test(n||'');
    const validate = () => {};
    const normalize = t => ({ uid: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()), name:t.name||'', type:t.type||'bool', value:t.value ?? (t.type==='float'?0.0:(t.type==='int'?0:false)), units:t.units||'', min:t.min ?? 0, max:t.max ?? 100, writable:t.writable ?? true, retentive:t.retentive ?? true, hmi_visible:t.hmi_visible ?? true, script_visible:t.script_visible ?? true, description:t.description||'' });
    const filteredTags = computed(()=>{ const q=filter.value.toLowerCase(); return q ? tags.value.filter(t => (t.name+t.description+t.type).toLowerCase().includes(q)) : tags.value; });
    const scriptVisibleCount = computed(()=>tags.value.filter(t=>t.script_visible).length);
    const writableCount = computed(()=>tags.value.filter(t=>t.writable).length);
    const statusClass = computed(()=> status.value.startsWith('Saved') || status.value.startsWith('Loaded') ? 'text-emerald-300' : status.value.startsWith('Error') ? 'text-red-300' : 'text-slate-300');
    async function load(){
      try { const j = await loadTags(); tags.value = (j.tags||[]).map(normalize); status.value = `Loaded ${tags.value.length} tags`; }
      catch(e){ status.value = 'Error loading tags: ' + (e.message||e); }
    }
    function addTag(){ tags.value.push(normalize({name:'NewTag'+(tags.value.length+1), type:'bool', value:false, description:'User tag'})); }
    function removeTag(t){ tags.value = tags.value.filter(x=>x.uid!==t.uid); }
    async function save(){
      const seen = new Set();
      for (const t of tags.value) { if(!nameOk(t.name)){ status.value='Error: invalid/reserved tag name: '+t.name; return; } if(seen.has(t.name)){ status.value='Error: duplicate tag name: '+t.name; return; } seen.add(t.name); }
      const payload = { tags: tags.value.map(({uid,...t})=>t) };
      try { await saveTags(payload); status.value='Saved. Upload the script again to use new globals.'; await store.refreshPlcData().catch(()=>{}); }
      catch(e){ status.value = 'Error saving tags: ' + (e.message||e); }
    }
    onMounted(load);
</script>
