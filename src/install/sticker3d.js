// "Sticker" solids for the illustrated installations: chunky rounded shapes
// with a thick dark outline and a dark return, like the stage's sticker look
// but in the rendered (PBR) style. Outlines are grown from the shape itself by
// drawing it with a wider round pen and tracing the result, so the border is an
// even thickness all round (a scaled copy would not be).
import * as THREE from 'three';
import { traceLoops, simplify, smooth } from '../cutout.js';
import { splitCaps } from '../slots.js';

// Shapes (metres, y up) of whatever draw(ctx) paints in white. draw works in
// metres (1 unit = 1 m, y up); bounds = [x0, y0, x1, y1] must contain it all.
export function traceShapes(draw, [x0, y0, x1, y1], res = 160) {
  const M = 3;
  const W = Math.ceil((x1 - x0) * res) + 2 * M, H = Math.ceil((y1 - y0) * res) + 2 * M;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.setTransform(res, 0, 0, -res, M - x0 * res, H - M + y0 * res);
  ctx.fillStyle = ctx.strokeStyle = '#fff';
  ctx.lineCap = ctx.lineJoin = 'round';
  draw(ctx);
  const d = ctx.getImageData(0, 0, W, H).data;
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) mask[i] = d[i * 4 + 3] > 127 ? 1 : 0;
  const toM = ([x, y]) => new THREE.Vector2(x0 + (x - M) / res, y0 + (H - M - y) / res);
  const loops = traceLoops(mask, W, H)
    .filter((l) => l.length > 12)
    .map((l) => smooth(simplify(l, 0.6)).map(toM));
  const signed = (pts) => { let a = 0; pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; a += p.x * q.y - q.x * p.y; }); return a / 2; };
  const withArea = loops.map((pts) => ({ pts, a: signed(pts) })).filter((l) => Math.abs(l.a) > 1e-4);
  const outerSign = Math.sign(withArea.reduce((m, l) => (Math.abs(l.a) > Math.abs(m.a) ? l : m)).a);
  const outers = withArea.filter((l) => Math.sign(l.a) === outerSign).map((l) => {
    const pts = outerSign < 0 ? l.pts.slice().reverse() : l.pts;   // outer CCW
    return { shape: new THREE.Shape(pts), pts };
  });
  for (const h of withArea.filter((l) => Math.sign(l.a) !== outerSign)) {
    const p = h.pts[0];
    const owner = outers.find((o) => inside(p, o.pts)) ?? outers[0];
    owner.shape.holes.push(new THREE.Path(outerSign < 0 ? h.pts : h.pts.slice().reverse()));   // holes CW
  }
  return outers.map((o) => o.shape);
}

function inside(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

// ─── Chunky numerals ────────────────────────────────────────────────────────
// Skeletons in a unit box (height 1, y up), stroked with a round pen: bubbly
// "sticker" numerals. PEN is the stroke width as a fraction of the height.
const PEN = 0.26;
const arc = (cx, cy, r, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => {
  const a = THREE.MathUtils.degToRad(a0 + ((a1 - a0) * i) / n);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
});
const GLYPHS = {
  0: { closed: true, pts: [...arc(0.36, 0.64, 0.23, 0, 180), ...arc(0.36, 0.36, 0.23, 180, 360)] },
  2: { pts: [...arc(0.37, 0.64, 0.22, 165, -38), [0.14, 0.13], [0.62, 0.13]] },
  7: { pts: [[0.13, 0.87], [0.61, 0.87], [0.3, 0.13]] },
};

// Shapes for numeral `ch`, `height` m tall; `grow` widens the pen (the outline).
export function numeralShapes(ch, height, grow = 0) {
  const g = GLYPHS[ch];
  const pen = PEN * height + 2 * grow;
  return traceShapes((ctx) => {
    ctx.lineWidth = pen;
    ctx.beginPath();
    g.pts.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x * height, y * height));
    if (g.closed) ctx.closePath();
    ctx.stroke();
  }, [-grow - 0.05, -grow - 0.05, 0.8 * height + grow + 0.05, height + grow + 0.05]);
}

// ─── 4-point sparkle star ───────────────────────────────────────────────────
export function starShapes(r, grow = 0) {
  return traceShapes((ctx) => {
    const k = 0.22 * r;
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.quadraticCurveTo(k, k, r, 0);
    ctx.quadraticCurveTo(k, -k, 0, -r);
    ctx.quadraticCurveTo(-k, -k, -r, 0);
    ctx.quadraticCurveTo(-k, k, 0, r);
    ctx.closePath();
    ctx.fill();
    if (grow > 0) { ctx.lineWidth = 2 * grow; ctx.stroke(); }
  }, [-r - grow - 0.03, -r - grow - 0.03, r + grow + 0.03, r + grow + 0.03], 300);
}

// ─── UVs ────────────────────────────────────────────────────────────────────
// ExtrudeGeometry after splitCaps: material 0 = front, 1 = sides, 2 = back.
// Caps span the shapes' bounding box (0..1); sides run round the outline
// (u = distance along the contour / perimeter, v = depth).
export function capSideUVs(geo, shapes) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y, d = bb.max.z - bb.min.z || 1;
  const pts = [];
  let L = 0;
  for (const s of shapes) {
    for (const loop of [s.getPoints(), ...s.holes.map((hl) => hl.getPoints())]) {
      loop.forEach((p, i) => { if (i > 0) L += p.distanceTo(loop[i - 1]); pts.push({ x: p.x, y: p.y, s: L }); });
      L += 0.001;
    }
  }
  // spatial hash for the nearest contour point
  const cell = 0.05, grid = new Map();
  const keyOf = (x, y) => `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
  for (const p of pts) { const k = keyOf(p.x, p.y); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(p); }
  const nearest = (x, y) => {
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
    let best = pts[0], bd = Infinity;
    for (let r = 1; r <= 4 && bd === Infinity; r++) {
      for (let i = cx - r; i <= cx + r; i++) for (let j = cy - r; j <= cy + r; j++) {
        for (const p of grid.get(`${i},${j}`) ?? []) { const dd = (p.x - x) ** 2 + (p.y - y) ** 2; if (dd < bd) { bd = dd; best = p; } }
      }
    }
    return best;
  };
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (const g of geo.groups) {
    for (let i = g.start; i < g.start + g.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      if (g.materialIndex === 1) uv.setXY(i, nearest(x, y).s / L, (z - bb.min.z) / d);
      else uv.setXY(i, (x - bb.min.x) / w, (y - bb.min.y) / h);
    }
  }
  uv.needsUpdate = true;
  return { w, h, perimeter: L };
}

// ─── Solids ─────────────────────────────────────────────────────────────────
export function extrude(shapes, depth, bevel = 0.012) {
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: depth - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 6,
  });
  geo.translate(0, 0, bevel);        // spans z 0 … depth
  splitCaps(geo);
  return geo;
}

// A sticker solid: coloured face (material `faceMat`, thickness `face`) on a dark
// body grown by `outline` (returns in `sideMat`), front at z = 0.
export function stickerSolid(faceShapes, outlineShapes, { depth, face, faceMat, sideMat, darkMat }) {
  const g = new THREE.Group();
  const bodyGeo = extrude(outlineShapes, depth);
  const faceGeo = extrude(faceShapes, face, 0.008);
  const uv = { face: capSideUVs(faceGeo, faceShapes), body: capSideUVs(bodyGeo, outlineShapes) };
  bodyGeo.translate(0, 0, -depth);
  const body = new THREE.Mesh(bodyGeo, [darkMat, sideMat, darkMat]);
  const front = new THREE.Mesh(faceGeo, [faceMat, darkMat, darkMat]);
  body.castShadow = body.receiveShadow = front.castShadow = front.receiveShadow = true;
  g.add(body, front);
  return { group: g, uv };
}

