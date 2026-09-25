// POST /api/upload { slot, name, type } → { path, url, method }
// Admin only. The browser then sends the file straight to storage at `url`
// (no size limit from this function), and saves `path` via PUT /api/state.
import { json, getStore, isAdmin, SLOT_KEYS } from './_lib.js';

const ALLOWED = /^(image\/(png|jpeg|webp|gif|svg\+xml)|video\/(mp4|webm|quicktime))$/;

export async function POST(request) {
  if (!(await isAdmin(request))) return json({ error: 'Admin only' }, 401);
  const store = getStore();
  if (!store) return json({ error: 'Shared storage is not set up' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad JSON' }, 400); }
  const { slot, name = 'file', type = '' } = body;
  if (!SLOT_KEYS.includes(slot)) return json({ error: 'Unknown slot' }, 400);
  if (!ALLOWED.test(type)) return json({ error: 'Images or MP4/WebM video only' }, 400);

  const safe = String(name).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-80) || 'file';
  const path = `uploads/${slot}/${Date.now()}-${safe}`;
  try {
    return json({ path, ...(await store.uploadTarget(path, type)) });
  } catch (e) {
    return json({ error: 'Could not prepare the upload', detail: String(e.message ?? e) }, 502);
  }
}
