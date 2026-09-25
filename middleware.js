// Vercel Routing Middleware: simple passcode gate for the whole viewer.
// The passcode lives in the VIEWER_PASSCODE environment variable on Vercel
// (never in this repo). If it is not set, the site is open.
import { next } from '@vercel/functions';

export const config = { matcher: '/((?!_vercel).*)' };

const COOKIE = 'opf_viewer';

async function tokenFor(code) {
  // Salt kept from the project's earlier name so existing unlock cookies stay valid.
  const data = new TextEncoder().encode(`opf27-sticker-stage:${code}`);
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

function page(error = false) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>OPF 2027 · The Main Stage</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,900&family=Montserrat:wght@500;700;800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1b191c;font-family:Montserrat,system-ui,sans-serif;color:#242224;padding:16px}
  form{background:#fff;border:2px solid #242224;border-radius:16px;box-shadow:8px 8px 0 #FF66AD;padding:24px 24px 20px;width:min(380px,100%)}
  p.e{margin:0;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5f5a60}
  h1{margin:6px 0 16px;font-family:Archivo,'Arial Black',sans-serif;font-weight:900;font-stretch:125%;font-size:25px;text-transform:uppercase;line-height:1}
  label{display:block;font-size:13px;font-weight:700;margin-bottom:6px}
  input{width:100%;font:inherit;font-size:16px;padding:10px 14px;border:2px solid #242224;border-radius:10px;outline:none}
  input:focus{box-shadow:0 0 0 3px #00CAD8}
  button{margin-top:14px;width:100%;font-family:Archivo,'Arial Black',sans-serif;font-weight:900;font-stretch:125%;font-size:14px;text-transform:uppercase;padding:12px;background:#FFF33F;border:2px solid #242224;border-radius:999px;box-shadow:4px 4px 0 #242224;cursor:pointer}
  button:active{transform:translate(3px,3px);box-shadow:1px 1px 0 #242224}
  .err{margin:10px 0 0;font-size:13px;font-weight:600;color:#c0314f}
  .foot{margin:14px 0 0;font-size:11.5px;color:#6b666c}
</style></head><body>
<form method="POST" action="/__unlock">
  <p class="e">Otaku Pop Fes 2027 · Okada Manila</p>
  <h1>The Main Stage</h1>
  <label for="code">Passcode</label>
  <input id="code" name="code" type="password" autocomplete="current-password" required autofocus>
  ${error ? '<p class="err" role="alert">That passcode didn’t match. Try again.</p>' : ''}
  <button type="submit">View the 3D concept</button>
  <p class="foot">Confidential concept for CyberE. Please don’t share this link.</p>
</form></body></html>`;
  return new Response(html, {
    status: 401,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
}

export default async function middleware(request) {
  const code = process.env.VIEWER_PASSCODE;
  if (!code) return next();

  const url = new URL(request.url);
  const expected = await tokenFor(code);

  if (url.pathname === '/__unlock' && request.method === 'POST') {
    const form = await request.formData();
    if (String(form.get('code') || '').trim() !== code) return page(true);
    return new Response(null, {
      status: 303,
      headers: {
        location: '/',
        'set-cookie': `${COOKIE}=${expected}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
        'cache-control': 'no-store',
      },
    });
  }

  if (readCookie(request, COOKIE) === expected) return next();
  return page(false);
}
