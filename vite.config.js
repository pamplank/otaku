import { defineConfig } from 'vite';
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

export default defineConfig({
  plugins: [saveRenders],
  server: { watch: { ignored: ['**/renders/**', '**/.vercel/**'] } },
  build: { chunkSizeWarningLimit: 1200 },
});
