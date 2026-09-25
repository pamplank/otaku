// The "sticker" look: flat toon colours, bold dark outlines, hard offset layers.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { palette as P } from '../stage.config.js';

export const FONT = '"Archivo Black", "Arial Black", sans-serif';
export const FONT_BODY = '"Montserrat", Arial, sans-serif';
// Wide heavy display face (use with fontStretch = 'expanded'), as in the OPF deck
export const FONT_DISPLAY = '"Archivo", "Archivo Black", "Arial Black", sans-serif';

// ─── Lines ──────────────────────────────────────────────────────────────────
// Widths are authored for a 1080 px-tall frame and rescaled to the viewport,
// so screen and exported renders have the same outline weight.
const lineMats = [];

export function lineMat(color = P.dark, width = 3, { opacity = 1, depthTest = true } = {}) {
  const m = new LineMaterial({ color, linewidth: width, transparent: opacity < 1, opacity, depthTest });
  m.userData.base = width;
  lineMats.push(m);
  return m;
}

export function updateLineResolution(w, h) {
  for (const m of lineMats) {
    m.resolution.set(w, h);
    m.linewidth = Math.max(1, (m.userData.base * h) / 1080);
  }
}

export const OUTLINE = lineMat(P.dark, 3.4);
export const OUTLINE_THIN = lineMat(P.dark, 2.2);

export function outline(mesh, material = OUTLINE, threshold = 25) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, threshold);
  const line = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(edges), material);
  line.raycast = () => {};
  mesh.add(line);
  return mesh;
}

export function polyline(points, material = OUTLINE, closed = false) {
  const arr = [];
  for (const p of points) arr.push(p.x, p.y, p.z);
  if (closed) arr.push(points[0].x, points[0].y, points[0].z);
  const line = new Line2(new LineGeometry().setPositions(arr), material);
  line.computeLineDistances();
  line.raycast = () => {};
  return line;
}

// Plan-view polyline on the floor from [[x, z], ...].
export function floorLine(pts, y, material = OUTLINE_THIN, closed = true) {
  return polyline(pts.map(([x, z]) => new THREE.Vector3(x, y, z)), material, closed);
}

// ─── Materials ──────────────────────────────────────────────────────────────
export const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, ...extra });
export const flat = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });

export function box(w, h, d, mat, { edges = true, cast = true, receive = true, line = OUTLINE } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  if (edges) outline(m, line);
  return m;
}

// A flat card with a bold dark border and a hard offset layer behind it (like the slides).
export function stickerPanel({ w, h, t = 0.1, color, faceMat, border = 0.08, offset = 0.2, offsetColor = P.dark }) {
  const g = new THREE.Group();
  const face = box(w, h, t, faceMat || toon(color), { edges: false });
  g.add(face);
  const rim = box(w + 2 * border, h + 2 * border, t * 0.8, flat(P.dark), { edges: false });
  rim.position.z = -t * 0.2;
  g.add(rim);
  if (offset > 0) {
    const off = box(w + 2 * border, h + 2 * border, t * 0.5, toon(offsetColor), { edges: false });
    off.position.set(offset, -offset, -t * 0.6);
    g.add(off);
  }
  g.userData.face = face;
  return g;
}

// Inverted-hull outline for rounded shapes (people). Works with InstancedMesh.
export function hullMaterial(thickness = 0.03, color = P.dark) {
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  m.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n transformed += normalize(normal) * ${thickness.toFixed(4)};`,
    );
  };
  return m;
}

// ─── Sparkle stars ──────────────────────────────────────────────────────────
export function starShape(r, pinch = 0.2) {
  const s = new THREE.Shape();
  const at = (a, rad) => [Math.cos(a) * rad, Math.sin(a) * rad];
  s.moveTo(...at(Math.PI / 2, r));
  for (let i = 1; i <= 4; i++) {
    const a0 = Math.PI / 2 - (i - 1) * (Math.PI / 2);
    const a1 = a0 - Math.PI / 2;
    s.quadraticCurveTo(...at(a0 - Math.PI / 4, r * pinch), ...at(a1, r));
  }
  return s;
}

const STAR_LINE = lineMat(P.dark, 3.4);

export function starSticker(size, color, { depth = 0.05, offset = 0.07 } = {}) {
  const shape = starShape(size / 2);
  const g = new THREE.Group();
  const face = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 14 }),
    toon(color),
  );
  face.castShadow = true;
  g.add(face);
  const pts = shape.getPoints(14).map((p) => new THREE.Vector3(p.x, p.y, depth + 0.003));
  g.add(polyline(pts, STAR_LINE, true));
  const off = new THREE.Mesh(new THREE.ShapeGeometry(shape, 14), toon(P.dark));
  off.position.set(size * offset, -size * offset, -0.01);
  g.add(off);
  return g;
}

// ─── Canvas textures ────────────────────────────────────────────────────────
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Floor lettering. lines: [{ text, size (fraction of canvas height), color, font }]
export function floorDecal(lines, wM, hM, { rotate = 0, pxPerM = 90 } = {}) {
  const w = Math.min(4096, Math.round(wM * pxPerM));
  const h = Math.min(4096, Math.round(hM * pxPerM));
  const tex = canvasTexture(w, h, (ctx) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const total = lines.reduce((s, l) => s + l.size * 1.25, 0);
    let y = h / 2 - (total * h) / 2;
    for (const l of lines) {
      const px = l.size * h;
      ctx.font = `${l.weight || ''} ${px}px ${l.font || FONT}`;
      ctx.fillStyle = l.color || P.dark;
      y += px * 0.625;
      ctx.fillText(l.text, w / 2, y, w * 0.96);
      y += px * 0.625;
    }
  });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(wM, hM),
    new THREE.MeshToonMaterial({ map: tex, transparent: true, depthWrite: false }),
  );
  mesh.rotation.set(-Math.PI / 2, 0, rotate);
  mesh.receiveShadow = true;
  mesh.renderOrder = 2;
  mesh.userData.decal = true;
  return mesh;
}

// Flat floor zone from [[x, z], ...].
export function floorZone(pts, color, y) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  const m = new THREE.Mesh(g, toon(color));
  m.receiveShadow = true;
  return m;
}

export function arrowShape(len, w) {
  const s = new THREE.Shape();
  const hl = Math.min(len * 0.35, w * 1.6);
  s.moveTo(-len / 2, -w * 0.22);
  s.lineTo(len / 2 - hl, -w * 0.22);
  s.lineTo(len / 2 - hl, -w / 2);
  s.lineTo(len / 2, 0);
  s.lineTo(len / 2 - hl, w / 2);
  s.lineTo(len / 2 - hl, w * 0.22);
  s.lineTo(-len / 2, w * 0.22);
  s.closePath();
  return s;
}

// Flat arrow on the floor at (x, z), pointing along direction (dx, dz).
export function floorArrow(x, z, dx, dz, len, w, color = P.dark, y = 0.05) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.ShapeGeometry(arrowShape(len, w)), toon(color));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  g.add(m);
  g.position.set(x, y, z);
  g.rotation.y = Math.atan2(-dz, dx);
  return g;
}
