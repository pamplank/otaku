// Client for the shared state (/api): the artwork in each slot and the logo pose,
// the same for everyone who opens the site. Only admin mode can change it.

async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* no JSON body */ }
  // A host without the API answers with the page itself (not JSON): treat as an error
  if (!res.ok || data === null) throw new Error(data?.error || `${method} ${path} failed (${res.status})`);
  return data;
}

// { slots: { led: {url, name, type, path}, … }, logoPose, updatedAt, configured } or null
export async function fetchState() {
  try { return await call('/api/state'); } catch { return null; }
}

export const saveState = (patch) => call('/api/state', { method: 'PUT', body: patch });

// { admin, enabled, storage }; a site without the API reads as "no admin mode"
export async function adminStatus() {
  try { return await call('/api/admin'); } catch { return { admin: false, enabled: false, storage: null }; }
}
export const login = (passcode) => call('/api/admin', { method: 'POST', body: { passcode } });
export const logout = () => call('/api/admin', { method: 'DELETE' });

// Upload a file straight to storage; returns the slot entry to save in the state.
export async function uploadFile(slot, file) {
  const target = await call('/api/upload', { method: 'POST', body: { slot, name: file.name, type: file.type } });
  let body = file;
  const headers = {};
  if (target.form) {
    // Supabase signed upload URLs take the file as multipart form data
    body = new FormData();
    body.append('cacheControl', '31536000');
    body.append('', file);
  } else {
    headers['content-type'] = file.type;
  }
  const res = await fetch(target.url, { method: target.method, headers, body, credentials: 'same-origin' });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return { path: target.path, name: file.name, type: file.type };
}
