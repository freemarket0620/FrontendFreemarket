import { apiJson, apiText } from './http';

const enc = (p) => encodeURIComponent(p);

export function filesDownloadUrl(path) {
  return '/api/files/download?path=' + enc(path);
}

export async function listFiles(path) {
  return apiJson('/api/files/list?path=' + enc(path));
}

export async function mkdir(path) {
  return apiText('/api/files/mkdir?path=' + enc(path), { method: 'POST' });
}

export async function uploadFile(path, arrayBuffer) {
  return apiText('/api/files/upload?path=' + enc(path), { method: 'POST', body: arrayBuffer });
}

export async function viewFile(path) {
  return apiText('/api/files/view?path=' + enc(path));
}

export async function deletePath(path) {
  return apiText('/api/files/delete?path=' + enc(path), { method: 'POST' });
}
