// Shared server code for the /api functions (files starting with "_" are not routes).
//
// Shared state (which artwork is in each slot + the logo pose) lives as one JSON
// file in a public Supabase Storage bucket, next to the uploaded files. Only these
// server functions hold the Supabase secret key, and they only write for an admin.
//
// Vercel environment variables:
//   SUPABASE_URL               https://<project>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  secret key (never sent to the browser)
//   ADMIN_PASSCODE             passcode for admin mode
//
// Running the Vite dev server without the Supabase variables uses a local folder
// store instead (.dev-store/), so the viewer works offline on localhost.
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';

const BUCKET = 'stage';

// One shared state per build. The main stage keeps its original file name.
export const BUILDS = ['main', 'ballroom', 'panel', 'mini', 'arch', 'booth-a', 'booth-b', 'booth-c', 'zone'];
const isPreview = () => process.env.VERCEL_ENV === 'preview';
const stateFile = (build) => (build === 'main' ? 'state.json' : `state-${build}.json`);
// Preview deployments save to their own files (and read production's until they
// have one), so trying things on a preview never changes the live site.
const writePath = (build) => (isPreview() ? `preview/${stateFile(build)}` : stateFile(build));
const readPaths = (build) => (isPreview() ? [`preview/${stateFile(build)}`, stateFile(build)] : [stateFile(build)]);

// ?build=… on the request (main by default); null if it isn't a known build.
export function buildOf(request) {
  const b = new URL(request.url).searchParams.get('build') || 'main';
  return BUILDS.includes(b) ? b : null;
}

// Where an uploaded file goes (main keeps its original layout).
export function uploadDir(build, slot) {
  return ['uploads', isPreview() && 'preview', build !== 'main' && build, slot].filter(Boolean).join('/');
}
const ADMIN_COOKIE = 'opf_admin';
const DEV_PASSCODE = 'opf-admin';
export const EMPTY_STATE = { version: 1, slots: {}, logoPose: null, updatedAt: null };

const isDevServer = () => process.env.OPF_DEV_SERVER === '1';
const adminPasscode = () => process.env.ADMIN_PASSCODE || (isDevServer() ? DEV_PASSCODE : '');

// ─── Responses ──────────────────────────────────────────────────────────────
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });

// ─── Admin auth ─────────────────────────────────────────────────────────────
async function tokenFor(code) {
  const data = new TextEncoder().encode(`opf27-admin:${code}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}

// Compare without an early exit, so timing doesn't leak how much matched.
function sameString(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const adminEnabled = () => Boolean(adminPasscode());

export async function isAdmin(request) {
  const code = adminPasscode();
  const got = readCookie(request, ADMIN_COOKIE);
  return Boolean(code && got && sameString(got, await tokenFor(code)));
}

export async function checkPasscode(passcode) {
  const code = adminPasscode();
  return Boolean(code && typeof passcode === 'string' && sameString(passcode, code));
}

export async function adminCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${ADMIN_COOKIE}=${await tokenFor(adminPasscode())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
}
export const clearAdminCookie = () => `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

// ─── Storage ────────────────────────────────────────────────────────────────
// Each store: readState(), writeState(state), uploadTarget(path, type) → where the
// browser sends the file, and publicUrl(path).

function supabaseStore() {
  // Accept the project URL with or without a copied API path (…/rest/v1/).
  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/(rest|storage|auth)\/v1\/?.*$/, '').replace(/\/+$/, '');
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return null;
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const bucket = () => sb.storage.from(BUCKET);
  let bucketReady = null;
  // The public bucket is created on first use, so setup is only the two keys.
  const ensureBucket = () => (bucketReady ??= (async () => {
    const { error } = await sb.storage.createBucket(BUCKET, { public: true });
    if (error && !/already exists|duplicate/i.test(error.message)) throw error;
  })().catch((e) => { bucketReady = null; throw e; }));

  return {
    kind: 'supabase',
    async readState(build = 'main') {
      for (const file of readPaths(build)) {
        const { data, error } = await bucket().download(file);
        if (!error) return JSON.parse(await data.text());
        if (!/not.?found|does not exist|404|400/i.test(`${error.message} ${error.statusCode ?? ''}`)) throw error;
      }
      return { ...EMPTY_STATE };
    },
    async writeState(state, build = 'main') {
      await ensureBucket();
      const body = new Blob([JSON.stringify(state)], { type: 'application/json' });
      const { error } = await bucket().upload(writePath(build), body, { upsert: true, contentType: 'application/json', cacheControl: '0' });
      if (error) throw error;
    },
    async uploadTarget(filePath) {
      await ensureBucket();
      const { data, error } = await bucket().createSignedUploadUrl(filePath);
      if (error) throw error;
      return { url: data.signedUrl, method: 'PUT', form: true };
    },
    publicUrl: (filePath) => bucket().getPublicUrl(filePath).data.publicUrl,
  };
}

// Local folder store for the Vite dev server (see vite.config.js).
function devStore() {
  const root = path.resolve('.dev-store');
  return {
    kind: 'local',
    async readState(build = 'main') {
      try { return JSON.parse(await fs.readFile(path.join(root, stateFile(build)), 'utf8')); } catch { return { ...EMPTY_STATE }; }
    },
    async writeState(state, build = 'main') {
      await fs.mkdir(root, { recursive: true });
      await fs.writeFile(path.join(root, stateFile(build)), JSON.stringify(state, null, 2));
    },
    async uploadTarget(filePath) {
      return { url: `/__dev-store/upload?path=${encodeURIComponent(filePath)}`, method: 'PUT' };
    },
    publicUrl: (filePath) => `/__dev-store/files/${filePath}`,
  };
}

let store;
export function getStore() {
  if (store === undefined) store = supabaseStore() ?? (isDevServer() ? devStore() : null);
  return store;
}

// ─── State validation ───────────────────────────────────────────────────────
export const SLOT_KEYS = ['led', 'wingLeft', 'wingRight', 'logo'];
// Main stage: its four slots. Other builds: any short camelCase slot name.
export const validSlot = (build, key) => (build === 'main' ? SLOT_KEYS.includes(key) : /^[a-zA-Z][a-zA-Z0-9]{0,31}$/.test(key));
const num = (v) => typeof v === 'number' && Number.isFinite(v);

export function cleanSlot(entry) {
  if (entry === null) return null;
  if (!entry || typeof entry.path !== 'string' || !entry.path.startsWith('uploads/')) return undefined;
  return {
    path: entry.path,
    name: String(entry.name ?? '').slice(0, 200),
    type: String(entry.type ?? '').slice(0, 100),
  };
}

export function cleanPose(p) {
  if (p === null) return null;
  if (!p || ![p.x, p.y, p.z, p.scale].every(num)) return undefined;
  return { x: p.x, y: p.y, z: p.z, scale: p.scale };
}

// Stored paths → public URLs for the browser.
export function withUrls(state, s) {
  const slots = {};
  for (const [k, v] of Object.entries(state.slots || {})) if (v) slots[k] = { ...v, url: s.publicUrl(v.path) };
  return { ...EMPTY_STATE, ...state, slots };
}
