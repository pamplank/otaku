import { defineConfig, loadEnv } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Dev-only: lets the viewer save exported PNGs straight into ./renders
// (used to batch-produce the deck renders). Not part of the production build.
const saveRenders = {
  name: 'save-renders',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__save-render', (req, res) => {
      if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        try {
          const { name, dataUrl } = JSON.parse(body);
          const safe = String(name).replace(/[^\w/.-]/g, '_').replace(/\.\.+/g, '.');
          const file = path.resolve('renders', safe);
          if (!file.startsWith(path.resolve('renders'))) throw new Error('bad path');
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
          res.end(file);
        } catch (e) {
          res.statusCode = 400;
          res.end(String(e));
        }
      });
    });
  },
};

// Dev-only: runs the /api functions (same files Vercel deploys) inside the Vite
// dev server. Without SUPABASE_* in .env.local they use a local .dev-store/
// folder, and the admin passcode defaults to "opf-admin".
const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const devApi = {
  name: 'dev-api',
  apply: 'serve',
  configureServer(server) {
    Object.assign(process.env, loadEnv('development', process.cwd(), ''), { OPF_DEV_SERVER: '1' });
    const lib = () => server.ssrLoadModule('/api/_lib.js');

    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, 'http://localhost');
      try {
        // /api/<name> → api/<name>.js, exported GET/POST/PUT/DELETE handlers
        const m = url.pathname.match(/^\/api\/([\w-]+)$/);
        if (m && !m[1].startsWith('_') && fs.existsSync(`api/${m[1]}.js`)) {
          const mod = await server.ssrLoadModule(`/api/${m[1]}.js`);
          const handler = mod[req.method];
          if (!handler) { res.statusCode = 405; return res.end(); }
          const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req);
          const request = new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers: req.headers, body });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          return res.end(Buffer.from(await response.arrayBuffer()));
        }
        // Local stand-in for Supabase Storage
        if (url.pathname === '/__dev-store/upload' && req.method === 'PUT') {
          const { isAdmin } = await lib();
          if (!(await isAdmin(new Request('http://localhost/', { headers: req.headers })))) { res.statusCode = 401; return res.end(); }
          const rel = url.searchParams.get('path') || '';
          const file = path.resolve('.dev-store', rel);
          if (!rel.startsWith('uploads/') || !file.startsWith(path.resolve('.dev-store'))) { res.statusCode = 400; return res.end(); }
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, await readBody(req));
          return res.end('{}');
        }
        if (url.pathname.startsWith('/__dev-store/files/')) {
          const file = path.resolve('.dev-store', decodeURIComponent(url.pathname.slice('/__dev-store/files/'.length)));
          if (!file.startsWith(path.resolve('.dev-store')) || !fs.existsSync(file)) { res.statusCode = 404; return res.end(); }
          const ext = path.extname(file).toLowerCase();
          const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' };
          res.setHeader('content-type', types[ext] || 'application/octet-stream');
          return res.end(fs.readFileSync(file));
        }
      } catch (e) {
        res.statusCode = 500;
        return res.end(String(e));
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [saveRenders, devApi],
  server: { watch: { ignored: ['**/renders/**', '**/.vercel/**', '**/.dev-store/**'] } },
  build: { chunkSizeWarningLimit: 1200 },
});
