export async function uploadScriptText(source, name = 'main.as') {
  const safeName = String(name || 'main.as').trim() || 'main.as';
  const res = await fetch('/api/upload_script?name=' + encodeURIComponent(safeName), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Accept': 'application/json, text/plain, */*',
    },
    body: source || '',
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text || 'null'); } catch {}
  return { ok: res.ok, status: res.status, text, json };
}

export async function getScriptStatus() {
  const res = await fetch('/api/script_status', {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Accept': 'application/json, text/plain, */*' },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  try { return JSON.parse(text || '{}'); }
  catch { return { state: 'unknown', last_result: text }; }
}


const enc = (p) => encodeURIComponent(p);

export async function listSavedScripts() {
  const res = await fetch('/api/files/list?path=' + enc('/scripts'), {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Accept': 'application/json, text/plain, */*' },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  try { return JSON.parse(text || '{}'); }
  catch { throw new Error(text || 'Invalid script list response'); }
}

export async function loadSavedScript(path) {
  const safePath = String(path || '').trim();
  if (!safePath) throw new Error('No script path selected');
  const res = await fetch('/api/files/view?path=' + enc(safePath), {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Accept': 'text/plain, */*' },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  return text;
}
