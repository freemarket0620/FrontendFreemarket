export async function apiText(url, options = {}) {
  const r = await fetch(url, { cache: 'no-store', ...options });
  const text = await r.text();
  if (!r.ok) throw new Error(text || `HTTP ${r.status}`);
  return text;
}

export async function apiJson(url, options = {}) {
  const text = await apiText(url, options);
  try { return JSON.parse(text || 'null'); }
  catch { throw new Error(`Invalid JSON from ${url}`); }
}

export async function apiPostJson(url, payload, options = {}) {
  return apiJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify(payload),
    ...options,
  });
}

export async function apiPostText(url, body = '', options = {}) {
  return apiText(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain; charset=utf-8', ...(options.headers || {}) },
    body,
    ...options,
  });
}
