// GET    /api/admin → { admin, enabled, storage } for this browser
// POST   /api/admin → log in with { passcode } (sets an HttpOnly cookie)
// DELETE /api/admin → log out
import { json, getStore, isAdmin, adminEnabled, checkPasscode, adminCookie, clearAdminCookie } from './_lib.js';

export async function GET(request) {
  return json({ admin: await isAdmin(request), enabled: adminEnabled(), storage: getStore()?.kind ?? null });
}

export async function POST(request) {
  if (!adminEnabled()) return json({ error: 'Admin mode is not set up (ADMIN_PASSCODE)' }, 503);
  let body = {};
  try { body = await request.json(); } catch { /* treated as a wrong passcode */ }
  if (!(await checkPasscode(body.passcode))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return json({ error: 'Wrong passcode' }, 401);
  }
  return json({ admin: true }, 200, { 'set-cookie': await adminCookie(request) });
}

export async function DELETE() {
  return json({ admin: false }, 200, { 'set-cookie': clearAdminCookie() });
}
