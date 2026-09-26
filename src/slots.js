// Artwork slots (LED, wings, logo). Official CyberE files dropped in /public/assets,
// or published from admin mode (shared with everyone, see shared.js), are shown
// whole ("contain"): never cropped, stretched, recoloured or redrawn. Until then
// each slot shows a clearly labelled placeholder.
import * as THREE from 'three';
import { assets as A, palette as P } from '../stage.config.js';
import { canvasTexture, outline, OUTLINE, FONT, FONT_BODY } from './sticker.js';
import { dieCut } from './cutout.js';

const base = import.meta.env.BASE_URL;
export const slotStatus = {}; // key -> 'placeholder' | file path
export const slotEvents = new EventTarget(); // 'change' whenever any slot's artwork changes

const isVideo = (f) => /\.(mp4|webm|mov)$/i.test(f);

function tryImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // published files come from the storage domain
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function tryVideo(src) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.crossOrigin = 'anonymous';
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.preload = 'auto';
    v.addEventListener('loadeddata', () => resolve(v), { once: true });
    v.addEventListener('error', reject, { once: true });
    v.src = src;
    v.load();
  });
}

async function loadSource(src, video) {
  if (video) {
    const v = await tryVideo(src);
    v.play().catch(() => {});
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { tex, aspect: v.videoWidth / v.videoHeight, video: v };
  }
  const img = await tryImage(src);
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return { tex, aspect: img.naturalWidth / img.naturalHeight };
}

async function loadFirst(files) {
  for (const f of files) {
    try {
      return { ...(await loadSource(base + f, isVideo(f))), file: f };
    } catch {
      /* not supplied yet: try the next name */
    }
  }
  return null;
}

// A published file: { url, name, type }
async function loadEntry(entry) {
  const video = entry.type ? entry.type.startsWith('video/') : isVideo(entry.name);
  return { ...(await loadSource(entry.url, video)), file: entry.name };
}

async function loadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  try {
    const video = blob.type ? blob.type.startsWith('video/') : isVideo(name);
    return { ...(await loadSource(url, video)), file: name, url };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

// ─── Placeholders ───────────────────────────────────────────────────────────
function stripes(ctx, w, h, colors, band) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 5);
  const R = Math.hypot(w, h);
  for (let i = -R / band, k = 0; i < R / band; i++, k++) {
    ctx.fillStyle = colors[k % colors.length];
    ctx.fillRect(i * band, -R, band * 0.5, 2 * R);
  }
  ctx.restore();
}

function dashedBorder(ctx, w, h, inset, lw, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.setLineDash([lw * 3, lw * 2]);
  ctx.strokeRect(inset, inset, w - 2 * inset, h - 2 * inset);
  ctx.restore();
}

function fitText(ctx, text, maxW, px, font) {
  ctx.font = `${px}px ${font}`;
  const m = ctx.measureText(text).width;
  if (m > maxW) ctx.font = `${(px * maxW) / m}px ${font}`;
}

const placeholders = {
  led: (ctx, w, h) => {
    ctx.fillStyle = '#1a181b';
    ctx.fillRect(0, 0, w, h);
    stripes(ctx, w, h, ['#FF66AD55', '#00CAD855', '#FFF33F44'], h / 5);
    const bw = w * 0.62, bh = h * 0.36;
    const bx = (w - bw) / 2, by = (h - bh) / 2 - h * 0.04;
    ctx.fillStyle = P.pink;
    ctx.fillRect(bx + h * 0.025, by + h * 0.025, bw, bh);
    ctx.fillStyle = P.white;
    ctx.fillRect(bx, by, bw, bh);
    ctx.lineWidth = h * 0.012;
    ctx.strokeStyle = P.dark;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = P.dark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitText(ctx, 'KV PLACEHOLDER', bw * 0.88, h * 0.12, FONT);
    ctx.fillText('KV PLACEHOLDER', w / 2, by + bh * 0.42);
    fitText(ctx, 'LED WALL · 5 × 3 M · 10 × 6 PANELS', bw * 0.88, h * 0.045, FONT);
    ctx.fillText('LED WALL · 5 × 3 M · 10 × 6 PANELS', w / 2, by + bh * 0.76);
    ctx.fillStyle = P.white;
    fitText(ctx, 'KV loops · Programme · Live camera — official CyberE content to be supplied', w * 0.8, h * 0.04, FONT_BODY);
    ctx.fillText('KV loops · Programme · Live camera — official CyberE content to be supplied', w / 2, h * 0.86);
  },
  wing: (label) => (ctx, w, h) => {
    ctx.fillStyle = label.bg;
    ctx.fillRect(0, 0, w, h);
    dashedBorder(ctx, w, h, w * 0.06, w * 0.02, P.dark);
    ctx.fillStyle = P.dark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = [['KV /', 0.2], ['SPONSOR', 0.2], ['PRINT', 0.2]];
    let y = h * 0.4;
    for (const [t, s] of lines) {
      fitText(ctx, t, w * 0.8, w * s, FONT);
      ctx.fillText(t, w / 2, y);
      y += w * 0.24;
    }
    fitText(ctx, 'PLACEHOLDER', w * 0.8, w * 0.1, FONT);
    ctx.fillText('PLACEHOLDER', w / 2, y + w * 0.1);
  },
  // Transparent around a rounded badge, so the die-cut sign shows its cut line.
  logo: (ctx, w, h) => {
    const x = w * 0.06, y = h * 0.14, bw = w * 0.88, bh = h * 0.72, r = bh * 0.3;
    const badge = () => { ctx.beginPath(); ctx.roundRect(x, y, bw, bh, r); };
    ctx.fillStyle = P.pink;
    ctx.save();
    ctx.translate(w * 0.02, h * 0.03);
    badge();
    ctx.fill();
    ctx.restore();
    badge();
    ctx.fillStyle = P.yellow;
    ctx.fill();
    ctx.lineWidth = h * 0.025;
    ctx.strokeStyle = P.dark;
    ctx.stroke();
    ctx.fillStyle = P.dark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitText(ctx, 'OPF LOGO', bw * 0.8, bh * 0.42, FONT);
    ctx.fillText('OPF LOGO', w / 2, y + bh * 0.42);
    fitText(ctx, 'PLACEHOLDER · official file from CyberE', bw * 0.8, bh * 0.1, FONT_BODY);
    ctx.fillText('PLACEHOLDER · official file from CyberE', w / 2, y + bh * 0.76);
  },
};

// ─── Slot controller ────────────────────────────────────────────────────────
// Artwork priority: published (shared) file > /public/assets file > placeholder.
// `apply(res)` puts loaded artwork (or null = placeholder) on the model.
export const slots = {}; // key -> slot controller

function disposeRes(res) {
  res.tex.dispose();
  if (res.video) { res.video.pause(); res.video.removeAttribute('src'); res.video.load(); }
  if (res.url) URL.revokeObjectURL(res.url);
}

function slotController(key, { apply, info, placeholderThumb, assets }) {
  let current = null; // loaded artwork ({ tex, video?, url? }) or null for the placeholder
  let assetRes = null; // the /public/assets file, shown when nothing is published
  let seq = 0; // ignores loads that finish after a newer one started
  let sharedUrl = null; // URL of the published file currently applied

  function show(res, source) {
    if (current && current !== assetRes) disposeRes(current);
    current = res;
    apply(res);
    if (res?.video) res.video.play().catch(() => {});
    if (assetRes && res !== assetRes) assetRes.video?.pause();
    slotStatus[key] = res ? res.file : 'placeholder';
    slot.source = res ? source : 'placeholder';
    slot.file = res ? res.file : null;
    slot.onChange?.(slot);
    slotEvents.dispatchEvent(new Event('change'));
  }

  const slot = {
    key, ...info, meshes: [],
    source: 'placeholder', file: null, onChange: null,
    pending: false, // true while admin mode publishes a new file here
    isVideo: () => !!current?.video,
    // Image/video URL of what the slot shows, for the panel's thumbnail.
    thumbSrc() {
      if (!current) return placeholderThumb();
      return current.thumb?.() ?? (current.video ? current.video.src : current.tex.image.src);
    },
    // Show a local file straight away (admin, while it publishes). Throws if the
    // browser cannot decode it.
    async showFile(file) {
      const id = ++seq;
      const res = await loadBlob(file, file.name);
      if (id !== seq) return disposeRes(res);
      show(res, 'shared');
    },
    // Record that the file now showing was published at `url` (no reload).
    published(url) { sharedUrl = url; },
    // Apply this slot's entry from the shared state ({ url, name, type } or null).
    async setShared(entry) {
      const url = entry?.url ?? null;
      if (slot.pending || url === sharedUrl) return;
      sharedUrl = url;
      const id = ++seq;
      if (!entry) return show(assetRes, 'asset');
      try {
        const res = await loadEntry(entry);
        if (id !== seq) return disposeRes(res);
        show(res, 'shared');
      } catch {
        if (id === seq) show(assetRes, 'asset'); // file missing or unreadable
      }
    },
  };
  slots[key] = slot;
  slotStatus[key] = 'placeholder';

  // The /public/assets probe (slow for video) shows only if nothing is published.
  const ready = loadFirst(assets ?? A[key] ?? []).then((asset) => {
    assetRes = asset;
    if (asset && sharedUrl === null && slot.source === 'placeholder') show(asset, 'asset');
  });

  return { slot, ready };
}

// ─── Flat slot ──────────────────────────────────────────────────────────────
// w × h plane facing +z. Content is contain-fitted inside (1 - 2·padding).
// assets: default files to try in /public (the main stage's come from stage.config.js).
export function makeSlot(key, { w, h, bg, padding = 0, placeholder, emissive = true, assets }) {
  const group = new THREE.Group();
  const MatClass = emissive ? THREE.MeshBasicMaterial : THREE.MeshToonMaterial;

  const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new MatClass({ color: bg }));
  bgMesh.userData.slotKey = key;
  group.add(bgMesh);

  const aw = w * (1 - 2 * padding);
  const ah = h * (1 - 2 * padding);
  const pxW = 1024;
  const pxH = Math.round((pxW * ah) / aw);
  const phTex = canvasTexture(pxW, Math.min(4096, pxH), placeholder);

  const contentMat = new MatClass({ map: phTex, transparent: true });
  const content = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), contentMat);
  content.position.z = 0.004;
  content.scale.set(aw, ah, 1);
  content.userData.slotKey = key;
  group.add(content);

  let phThumb = null;
  const { slot, ready } = slotController(key, {
    assets,
    info: { width: aw, height: ah, aspect: aw / ah },
    placeholderThumb: () => (phThumb ??= phTex.image.toDataURL()),
    apply(res) {
      contentMat.map = res ? res.tex : phTex;
      if (!res) content.scale.set(aw, ah, 1);
      else if (res.aspect > aw / ah) content.scale.set(aw, aw / res.aspect, 1);
      else content.scale.set(ah * res.aspect, ah, 1);
      contentMat.needsUpdate = true;
    },
  });
  slot.meshes = [bgMesh, content];

  return { group, ready, bgMat: bgMesh.material, contentMat };
}

// ─── Die-cut sign ───────────────────────────────────────────────────────────
// A board cut to the artwork's outline plus a border (see cutout.js), facing +z
// and centred on the group. Fits inside width × maxHeight; the art is never cropped.
export function makeCutoutSlot(key, { width, maxHeight, thickness, border, boardColor, edgeColor, placeholder, onBuild }) {
  const group = new THREE.Group();
  const phCanvas = document.createElement('canvas');
  phCanvas.width = 1024;
  phCanvas.height = 640;
  placeholder(phCanvas.getContext('2d'), phCanvas.width, phCanvas.height);

  const faceMat = new THREE.MeshBasicMaterial();
  const edgeMat = new THREE.MeshToonMaterial({ color: edgeColor });
  const backMat = new THREE.MeshToonMaterial({ color: boardColor });
  let mesh = null;
  let phCut = null;

  function build(cut) {
    if (mesh) {
      group.remove(mesh);
      mesh.geometry.dispose();
      mesh.children.forEach((c) => c.geometry.dispose());
      faceMat.map?.dispose();
    }
    // Shapes are in 0..1 texture space: scale x/y to metres, extrude depth in metres.
    const geo = new THREE.ExtrudeGeometry(cut.shapes, { depth: thickness, bevelEnabled: false });
    splitCaps(geo);
    let w = width, h = width / cut.aspect;
    if (h > maxHeight) { h = maxHeight; w = h * cut.aspect; }
    geo.translate(-0.5, -0.5, -thickness / 2);
    const tex = new THREE.CanvasTexture(cut.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    faceMat.map = tex;
    faceMat.needsUpdate = true;
    mesh = new THREE.Mesh(geo, [faceMat, edgeMat, backMat]);
    mesh.scale.set(w, h, 1);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData.slotKey = key;
    outline(mesh, OUTLINE, 40);
    group.add(mesh);
    slot.meshes = [mesh];
    Object.assign(slot, { width: w, height: h, aspect: w / h });
    onBuild?.(group, w, h);
  }

  const opts = { border: border / width, board: boardColor };
  const { slot, ready } = slotController(key, {
    info: { width, height: maxHeight, aspect: width / maxHeight, spec: `≈ ${width} m wide · die-cut to the logo outline · image` },
    placeholderThumb: () => (phCut ??= dieCut(phCanvas, opts)).canvas.toDataURL(),
    apply(res) {
      if (!res) return build((phCut ??= dieCut(phCanvas, opts)));
      const cut = dieCut(res.tex.image, opts);
      res.thumb = () => (res.thumbUrl ??= cut.canvas.toDataURL());
      build(cut);
    },
  });
  build((phCut ??= dieCut(phCanvas, opts)));

  return { group, ready };
}

// A standalone die-cut board (no artwork slot): the outline of `source` plus a
// border, `width` metres wide, facing +z and centred on its origin.
export function dieCutBoard(source, width, { thickness = 0.05, border = 0.05, board = P.white, edge = '#e3e1de' } = {}) {
  const cut = dieCut(source, { border: border / width, board });
  const geo = new THREE.ExtrudeGeometry(cut.shapes, { depth: thickness, bevelEnabled: false });
  splitCaps(geo);
  geo.translate(-0.5, -0.5, -thickness / 2);
  const tex = new THREE.CanvasTexture(cut.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mesh = new THREE.Mesh(geo, [new THREE.MeshBasicMaterial({ map: tex }), new THREE.MeshToonMaterial({ color: edge }),
    new THREE.MeshToonMaterial({ color: board })]);
  mesh.scale.set(width, width / cut.aspect, 1);
  mesh.castShadow = true;
  outline(mesh, OUTLINE, 40);
  return mesh;
}

// ExtrudeGeometry gives each shape a caps group (back cap first, then front)
// and a sides group. Split the caps so the front shows the artwork and the back
// is plain board: material 0 = front, 1 = sides, 2 = back.
function splitCaps(geo) {
  const groups = geo.groups.slice();
  geo.clearGroups();
  for (const g of groups) {
    if (g.materialIndex === 1) { geo.addGroup(g.start, g.count, 1); continue; }
    const half = g.count / 2;
    geo.addGroup(g.start, half, 2);
    geo.addGroup(g.start + half, half, 0);
  }
}

// Generic labelled placeholder: title, size line and a note, on a striped ground.
export function labelPlaceholder(title, size, note, { bg = '#1a181b', fg = P.white, card = P.white, offset = P.pink } = {}) {
  return (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    stripes(ctx, w, h, ['#FF66AD33', '#00CAD833', '#FFF33F2e'], Math.max(w, h) / 6);
    const s = Math.min(w, h);
    const bw = w * 0.84, bh = Math.min(h * 0.5, bw * 0.42);
    const bx = (w - bw) / 2, by = (h - bh) / 2 - h * 0.05;
    ctx.fillStyle = offset;
    ctx.fillRect(bx + s * 0.025, by + s * 0.025, bw, bh);
    ctx.fillStyle = card;
    ctx.fillRect(bx, by, bw, bh);
    ctx.lineWidth = s * 0.012;
    ctx.strokeStyle = P.dark;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = P.dark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitText(ctx, title, bw * 0.88, bh * 0.32, FONT);
    ctx.fillText(title, w / 2, by + bh * 0.4);
    fitText(ctx, size, bw * 0.88, bh * 0.14, FONT);
    ctx.fillText(size, w / 2, by + bh * 0.74);
    if (note) {
      ctx.fillStyle = fg;
      fitText(ctx, note, w * 0.86, Math.min(h * 0.05, s * 0.07), FONT_BODY);
      ctx.fillText(note, w / 2, Math.min(h * 0.9, by + bh + (h - by - bh) / 2));
    }
  };
}

export { placeholders };
