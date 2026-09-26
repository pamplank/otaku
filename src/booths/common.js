// Shared pieces for the licensed IP booths (Plan A / B / C and the booth zone):
// neutral "IP ARTWORK – SUPPLIED BY CYBERE" slots, plain standee silhouettes,
// staff role tags, dimension lines, guest-flow badges + arrows, and the hall
// floor drawn around a single booth. Never IP artwork or characters.
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { palette as P } from '../../stage.config.js';
import { neutral as N, context as CX } from '../../config/booths.config.js';
import { toon, box, polyline, lineMat, outline, canvasTexture, floorArrow, floorDecal, OUTLINE, OUTLINE_THIN, FONT, FONT_BODY } from '../sticker.js';
import { makeSlot } from '../slots.js';
import { figure } from '../ballroom/figures.js';

export const IP_TITLE = 'IP ARTWORK – SUPPLIED BY CYBERE';
export const m = (v) => `${+v.toFixed(2)} m`;
export const mm = (v) => `${Math.round(v * 1000)} mm`;

function fit(ctx, text, maxW, px, font = FONT, weight = '') {
  ctx.font = `${weight} ${px}px ${font}`;
  const w = ctx.measureText(text).width;
  if (w > maxW) ctx.font = `${weight} ${(px * maxW) / w}px ${font}`;
}

// Neutral placeholder: light grey hatch, dashed border, the supplier line, size, note.
export function ipPlaceholder(size, note, title = IP_TITLE) {
  return (ctx, w, h) => {
    ctx.fillStyle = '#eceae6';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d8d5d0';
    ctx.lineWidth = Math.max(w, h) / 90;
    const step = Math.max(w, h) / 16;
    for (let x = -h; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke(); }
    const s = Math.min(w, h), pad = s * 0.05;
    ctx.setLineDash([s * 0.05, s * 0.035]);
    ctx.lineWidth = s * 0.014;
    ctx.strokeStyle = '#6d6a6e';
    ctx.strokeRect(pad, pad, w - 2 * pad, h - 2 * pad);
    ctx.setLineDash([]);
    const bw = w * 0.84, bh = Math.min(h * 0.46, bw * 0.34);
    const bx = (w - bw) / 2, by = (h - bh) / 2 - h * 0.04;
    ctx.fillStyle = P.white;
    ctx.fillRect(bx, by, bw, bh);
    ctx.lineWidth = s * 0.01;
    ctx.strokeStyle = P.dark;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = P.dark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const words = title.split(' – ');
    fit(ctx, words[0], bw * 0.88, bh * 0.26);
    ctx.fillText(words[0], w / 2, by + bh * (words[1] ? 0.26 : 0.4));
    if (words[1]) { fit(ctx, `– ${words[1]}`, bw * 0.88, bh * 0.16); ctx.fillText(`– ${words[1]}`, w / 2, by + bh * 0.53); }
    ctx.fillStyle = '#5b585c';
    fit(ctx, size, bw * 0.88, bh * 0.13, FONT_BODY, 800);
    ctx.fillText(size, w / 2, by + bh * 0.8);
    if (note) {
      ctx.fillStyle = '#5b585c';
      fit(ctx, note, w * 0.84, Math.min(h * 0.055, s * 0.075), FONT_BODY, 700);
      ctx.fillText(note, w / 2, Math.min(h - pad * 2.2, by + bh + (h - by - bh) / 2));
    }
  };
}

// A w × h texture slot facing +z with the neutral placeholder until the file is uploaded.
export function ipSlot(key, w, h, note, title) {
  return makeSlot(key, {
    w, h, bg: '#eceae6', emissive: false,
    placeholder: ipPlaceholder(`${m(w)} × ${m(h)}`.toUpperCase(), note, title),
  });
}

// A slot on a board: the panel itself (neutral, dark outline) + the slot on its front face.
export function slotBoard(key, w, h, t, note, { color = N.shell, title } = {}) {
  const g = new THREE.Group();
  const board = box(w, h, t, toon(color));
  g.add(board);
  const s = ipSlot(key, w - 0.04, h - 0.04, note, title);
  s.group.position.z = t / 2 + 0.003;
  g.add(s.group);
  return { group: g, ready: s.ready };
}

// ─── Text on a card that always faces the camera ────────────────────────────
export function textSprite(text, { height = 0.26, bg = P.white, fg = P.dark, border = P.dark, font = FONT, weight = '' } = {}) {
  const pxH = 96;
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `${weight} ${pxH * 0.52}px ${font}`;
  const tw = ctx.measureText(text).width;
  c.width = Math.ceil(tw + pxH * 0.7);
  c.height = pxH;
  ctx.fillStyle = border;
  ctx.beginPath(); ctx.roundRect(0, 0, c.width, c.height, pxH * 0.24); ctx.fill();
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(5, 5, c.width - 10, c.height - 10, pxH * 0.2); ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = `${weight} ${pxH * 0.52}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height * 0.54);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set((height * c.width) / c.height, height, 1);
  sp.renderOrder = 40;
  return sp;
}

// ─── Staff: a figure in the lead colour + its role tag (tags are a toggle) ──
export function staffMember({ role, x, z, rot = 0 }, color, { y = 0, tags }) {
  const f = figure(color);
  f.position.set(x, y, z);
  f.rotation.y = rot;
  const tag = textSprite(role, { height: 0.24, bg: color });
  tag.position.set(x, y + 2.05, z);
  tags.add(tag);
  return f;
}

// ─── Dimension lines ────────────────────────────────────────────────────────
const DIM_LINE = lineMat(P.dark, 1.8);
// From a to b (Vector3 or [x, y, z]) with end ticks along `tick`, text card at the middle.
export function dimLine(a, b, text, { tick = [0, 0, 1], tickLen = 0.18, textOffset = [0, 0, 0] } = {}) {
  const A = new THREE.Vector3(...(a.isVector3 ? a.toArray() : a)), B = new THREE.Vector3(...(b.isVector3 ? b.toArray() : b));
  const T = new THREE.Vector3(...tick).normalize().multiplyScalar(tickLen / 2);
  const g = new THREE.Group();
  const seg = (p, q) => [p.x, p.y, p.z, q.x, q.y, q.z];
  const pos = [
    ...seg(A, B),
    ...seg(A.clone().sub(T), A.clone().add(T)),
    ...seg(B.clone().sub(T), B.clone().add(T)),
  ];
  const line = new LineSegments2(new LineSegmentsGeometry().setPositions(pos), DIM_LINE);
  line.raycast = () => {};
  g.add(line);
  const label = textSprite(text, { height: 0.22, font: FONT_BODY, weight: 800 });
  label.position.copy(A).add(B).multiplyScalar(0.5).add(new THREE.Vector3(...textOffset));
  g.add(label);
  return g;
}

// ─── Guest flow ─────────────────────────────────────────────────────────────
// Round numbered floor badge with a caption, lying flat (reads from +z).
export function flowBadge(n, text, color, { size = 0.9, x = 0, z = 0, y = 0.012, rot = 0 } = {}) {
  const wM = size * 2.6, hM = size * 1.25;
  const tex = canvasTexture(Math.round(wM * 200), Math.round(hM * 200), (ctx, w, h) => {
    const r = h * 0.3;
    ctx.fillStyle = P.dark;
    ctx.beginPath(); ctx.arc(w / 2 + r * 0.12, r + h * 0.03 + r * 0.12, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(w / 2, r + h * 0.03, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = h * 0.025; ctx.strokeStyle = P.dark; ctx.stroke();
    ctx.fillStyle = P.dark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (n !== null && n !== undefined) {
      ctx.font = `${r * 1.15}px ${FONT}`;
      ctx.fillText(String(n), w / 2, r + h * 0.06);
    }
    // caption on a white strip
    fit(ctx, text, w * 0.92, h * 0.2);
    const tw = Math.min(w, ctx.measureText(text).width + h * 0.18);
    ctx.fillStyle = P.white;
    ctx.fillRect((w - tw) / 2, h * 0.7, tw, h * 0.27);
    ctx.lineWidth = h * 0.018; ctx.strokeRect((w - tw) / 2, h * 0.7, tw, h * 0.27);
    ctx.fillStyle = P.dark;
    ctx.fillText(text, w / 2, h * 0.84);
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wM, hM), new THREE.MeshToonMaterial({ map: tex, transparent: true, depthWrite: false }));
  mesh.rotation.set(-Math.PI / 2, 0, rot);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.renderOrder = 3;
  mesh.userData.decal = true;
  return mesh;
}

// Floor arrows along [[x, z], …]: one per segment (two on long ones).
export function flowArrows(path, color, { y = 0.012, len = 0.62, w = 0.36 } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i], [bx, bz] = path[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const n = L > 2.4 ? 2 : 1;
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      const a = floorArrow(ax + (bx - ax) * t, az + (bz - az) * t, bx - ax, bz - az, len, w, color, y);
      const mesh = a.children[0];
      mesh.material.depthWrite = false;
      mesh.renderOrder = 3;
      mesh.userData.decal = true;
      mesh.add(polyline(arrowOutline(len, w), OUTLINE_THIN, true));
      g.add(a);
    }
  }
  return g;
}

function arrowOutline(len, w) {
  const hl = Math.min(len * 0.35, w * 1.6);
  return [[-len / 2, -w * 0.22], [len / 2 - hl, -w * 0.22], [len / 2 - hl, -w / 2], [len / 2, 0],
    [len / 2 - hl, w / 2], [len / 2 - hl, w * 0.22], [-len / 2, w * 0.22]].map(([x, y]) => new THREE.Vector3(x, y, 0.002));
}

// ─── Standee: plain neutral human silhouette on a base + back strut ─────────
function silhouetteShape(h, w) {
  const s = new THREE.Shape();
  const hw = w / 2, head = h * 0.075;
  s.moveTo(-hw * 0.52, 0);
  s.lineTo(-hw * 0.5, h * 0.45);
  s.lineTo(-hw, h * 0.47);
  s.quadraticCurveTo(-hw, h * 0.78, -hw * 0.62, h * 0.8);
  s.lineTo(-hw * 0.2, h * 0.81);
  s.lineTo(-hw * 0.2, h - head * 2.05);
  s.absarc(0, h - head, head, -Math.PI / 2 - 0.9, Math.PI * 1.5 + 0.9, true);
  s.lineTo(hw * 0.2, h * 0.81);
  s.lineTo(hw * 0.62, h * 0.8);
  s.quadraticCurveTo(hw, h * 0.78, hw, h * 0.47);
  s.lineTo(hw * 0.5, h * 0.45);
  s.lineTo(hw * 0.52, 0);
  s.closePath();
  return s;
}

export function standee(h, w, { color = N.standee } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(silhouetteShape(h, w), { depth: 0.02, bevelEnabled: false, curveSegments: 16 });
  geo.translate(0, 0.03, -0.01);
  const board = new THREE.Mesh(geo, toon(color));
  board.castShadow = board.receiveShadow = true;
  outline(board, OUTLINE, 30);
  g.add(board);
  const base = box(w * 0.7, 0.03, 0.35, toon('#b9b6b2'));
  base.position.set(0, 0.015, 0.02);
  const strut = box(0.04, h * 0.5, 0.02, toon('#b9b6b2'), { edges: false });
  strut.position.set(0, h * 0.27, -0.13);
  strut.rotation.x = -0.35;
  g.add(base, strut);
  return g;
}

// ─── Dashed annotation box (outline only, not a floor graphic) ───────────────
export function dashedBox(w, d, h, color = P.dark, { dash = 0.18, gap = 0.12 } = {}) {
  const mat = lineMat(color, 2.4);
  mat.dashed = true;
  mat.dashSize = dash;
  mat.gapSize = gap;
  mat.worldUnits = false;
  const x = w / 2, z = d / 2;
  const c = [[-x, -z], [x, -z], [x, z], [-x, z]];
  const pos = [];
  for (const y of [0.03, h]) for (let i = 0; i < 4; i++) { const [a, b] = [c[i], c[(i + 1) % 4]]; pos.push(a[0], y, a[1], b[0], y, b[1]); }
  for (const [px, pz] of c) pos.push(px, 0.03, pz, px, h, pz);
  const line = new LineSegments2(new LineSegmentsGeometry().setPositions(pos), mat);
  line.computeLineDistances();
  line.raycast = () => {};
  return line;
}

// ─── Hall floor around a single booth: neutral floor, visitor aisle in front,
// dashed neighbour plots, footprint tape in the lead colour ─────────────────
export function hallContext({ width, depth, lead, neighbours = true }) {
  const g = new THREE.Group();
  const S = CX.floor;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(S, S), toon(N.floor));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);
  // subtle 1 m grid
  const gridMat = lineMat('#d2cec8', 1);
  const pos = [];
  for (let v = -S / 2; v <= S / 2; v += 1) pos.push(v, 0.002, -S / 2, v, 0.002, S / 2, -S / 2, 0.002, v, S / 2, 0.002, v);
  const grid = new LineSegments2(new LineSegmentsGeometry().setPositions(pos), gridMat);
  grid.raycast = () => {};
  g.add(grid);
  // visitor aisle in front
  const z0 = depth / 2, z1 = depth / 2 + CX.aisle;
  const aisle = new THREE.Mesh(new THREE.PlaneGeometry(S, CX.aisle), toon('#f3f1ed'));
  aisle.rotation.x = -Math.PI / 2;
  aisle.position.set(0, 0.004, (z0 + z1) / 2);
  aisle.receiveShadow = true;
  g.add(aisle);
  for (const z of [z0, z1]) g.add(polyline([new THREE.Vector3(-S / 2, 0.006, z), new THREE.Vector3(S / 2, 0.006, z)], OUTLINE_THIN));
  const txt = floorDecal([{ text: `VISITOR AISLE · ≈ ${m(CX.aisle)} (EST)`, size: 0.34, color: '#8d898d' }], 9, 1.2, { pxPerM: 110 });
  txt.position.set(-width / 2 - 5.5, 0.008, (z0 + z1) / 2);
  g.add(txt);
  // neighbour plots (dashed, same size)
  if (neighbours) {
    for (const sx of [-1, 1]) {
      const nb = dashedBox(width, depth, 0.0, '#9d999d');
      nb.position.set(sx * (width + 0.02), 0, 0);
      g.add(nb);
      const t = floorDecal([{ text: 'NEIGHBOUR PLOT', size: 0.3, color: '#a39fa3' }], 4, 1, { pxPerM: 110 });
      t.position.set(sx * (width + 0.02), 0.008, 0);
      g.add(t);
    }
  }
  // footprint tape
  const tapeMat = toon(lead);
  const tw = 0.08, x = width / 2, z = depth / 2;
  for (const [cx, cz, w, d] of [[0, -z, width + tw, tw], [0, z, width + tw, tw], [-x, 0, tw, depth], [x, 0, tw, depth]]) {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(w, d), tapeMat);
    t.rotation.x = -Math.PI / 2;
    t.position.set(cx, 0.007, cz);
    g.add(t);
  }
  return g;
}

// Footprint dimension lines (front + side) just outside the booth, on the floor.
export function footprintDims(width, depth, { y = 0.03, gap = 0.45 } = {}) {
  const g = new THREE.Group();
  g.add(dimLine([-width / 2, y, depth / 2 + gap], [width / 2, y, depth / 2 + gap], `${m(width)} FRONTAGE`, { tick: [0, 0, 1] }));
  g.add(dimLine([width / 2 + gap, y, -depth / 2], [width / 2 + gap, y, depth / 2], `${m(depth)} DEPTH`, { tick: [1, 0, 0] }));
  return g;
}

// A soft night wash over a booth (no stage lighting in the hall).
export function nightWash(x, y, z, distance = 14) {
  const l = new THREE.PointLight('#fff4e8', 0, distance, 1.2);
  l.position.set(x, y, z);
  return l;
}
