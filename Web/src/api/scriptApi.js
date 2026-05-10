export async function uploadScriptText(source) {
  const res = await fetch('/api/upload_script', {
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
