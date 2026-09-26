// GET  /api/state → shared artwork + logo pose (everyone)
// PUT  /api/state → merge a change into it (admin only)
//      body: { slots?: { led?: {path,name,type} | null, … }, logoPose?: {x,y,z,scale} | null }
import { json, getStore, isAdmin, EMPTY_STATE, validSlot, cleanSlot, cleanPose, withUrls, buildOf } from './_lib.js';

export async function GET(request) {
  const build = buildOf(request);
  if (!build) return json({ error: 'Unknown build' }, 400);
  const store = getStore();
  if (!store) return json({ ...EMPTY_STATE, configured: false });
  try {
    return json({ ...withUrls(await store.readState(build), store), configured: true });
  } catch (e) {
    return json({ error: 'Could not read the shared state', detail: String(e.message ?? e) }, 502);
  }
}

export async function PUT(request) {
  if (!(await isAdmin(request))) return json({ error: 'Admin only' }, 401);
  const build = buildOf(request);
  if (!build) return json({ error: 'Unknown build' }, 400);
  const store = getStore();
  if (!store) return json({ error: 'Shared storage is not set up' }, 503);
  let patch;
  try { patch = await request.json(); } catch { return json({ error: 'Bad JSON' }, 400); }

  try {
    const state = { ...EMPTY_STATE, ...(await store.readState(build)) };
    state.slots = { ...state.slots };
    for (const [key, entry] of Object.entries(patch.slots ?? {})) {
      const clean = cleanSlot(entry);
      if (!validSlot(build, key) || clean === undefined) return json({ error: `Bad slot ${key}` }, 400);
      if (clean) state.slots[key] = clean;
      else delete state.slots[key];
    }
    if ('logoPose' in patch) {
      const pose = cleanPose(patch.logoPose);
      if (pose === undefined) return json({ error: 'Bad logo pose' }, 400);
      state.logoPose = pose;
    }
    state.updatedAt = new Date().toISOString();
    await store.writeState(state, build);
    return json({ ...withUrls(state, store), configured: true });
  } catch (e) {
    return json({ error: 'Could not save the shared state', detail: String(e.message ?? e) }, 502);
  }
}
