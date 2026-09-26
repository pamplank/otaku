// The main stage's look, reusable by the ballroom stages: printed header box on
// the top truss, the die-cut OPF logo sign on its front, die-cut sparkles hanging
// from the side beams, a comic speech bubble, PA wraps and night neon. Each stage
// passes its own theme (colours + pattern), so it feels like the main stage
// without copying it. Local coordinates; callers place the group.
import * as THREE from 'three';
import { palette as P, assets as MAIN_ASSETS } from '../../stage.config.js';
import { toon, box, canvasTexture, drawSparkle, FONT_DISPLAY } from '../sticker.js';
import { makeCutoutSlot, dieCutBoard, placeholders } from '../slots.js';

const PPM = 150;   // print resolution, pixels per metre
const col = (c) => P[c] ?? c;

function display(ctx, px) {
  ctx.font = `900 ${px}px ${FONT_DISPLAY}`;
  ctx.fontStretch = 'expanded';
}

// Header print in world metres (x −xMax…xMax, y yb…yt, y up).
// theme: { base, accent, pattern: 'checker' | 'stripes' | 'dots', wedge, swoosh, stars: [colours] }
function drawHeader(ctx, T, xMax, yb, yt) {
  const h = yt - yb;
  ctx.fillStyle = col(T.base);
  ctx.fillRect(-xMax, yb, 2 * xMax, h);
  // Pattern patches at both ends (and a band through the middle for dots)
  const endW = Math.min(2.4, xMax * 0.36);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-xMax, yb, endW, h);
  ctx.rect(xMax - endW, yb, endW, h);
  ctx.clip();
  ctx.fillStyle = col(T.accent);
  if (T.pattern === 'checker') {
    const sq = 0.22;
    for (let y = yb; y < yt; y += sq) for (let x = -xMax; x < xMax; x += sq) {
      if ((Math.round(x / sq) + Math.round(y / sq)) % 2) ctx.fillRect(x, y, sq, sq);
    }
  } else if (T.pattern === 'stripes') {
    ctx.lineWidth = 0.13;
    ctx.strokeStyle = col(T.accent);
    for (let x = -xMax - h; x < xMax + h; x += 0.36) {
      ctx.beginPath(); ctx.moveTo(x, yb); ctx.lineTo(x + h, yt); ctx.stroke();
    }
  } else {
    for (let y = yb + 0.08, r = 0; y < yt; y += 0.16, r++) for (let x = -xMax + (r % 2) * 0.08; x < xMax; x += 0.16) {
      ctx.beginPath(); ctx.arc(x, y, 0.045, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
  // Swooshes: two sweeps along the header
  ctx.strokeStyle = col(T.swoosh);
  ctx.lineCap = 'round';
  for (const [dy, lw] of [[0.28, 0.06], [0.14, 0.035]]) {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(0, yb - 6 + h * 0.2, xMax * 1.05, 6 + h * 0.2 + dy, 0, 0.18 * Math.PI, 0.82 * Math.PI);
    ctx.stroke();
  }
  // Dark wedges in the top corners
  for (const side of [-1, 1]) {
    ctx.fillStyle = col(T.wedge);
    ctx.beginPath();
    ctx.moveTo(side * xMax, yt);
    ctx.lineTo(side * (xMax - Math.min(1.7, xMax * 0.28)), yt);
    ctx.lineTo(side * xMax, yt - h * 0.95);
    ctx.closePath();
    ctx.fill();
  }
  // 4-point stars
  const c = T.stars;
  const stars = [
    [-xMax + 0.45, yt - 0.22, 0.1, c[0]], [-xMax + 0.95, yt - 0.34, 0.07, c[1]], [xMax - 0.5, yt - 0.22, 0.1, c[0]],
    [xMax - 1.0, yt - 0.38, 0.07, c[1]], [xMax - 0.35, yb + 0.3, 0.06, c[2]], [-xMax + 0.3, yb + 0.28, 0.06, c[2]],
    [-xMax * 0.45, yt - 0.3, 0.07, c[2]], [xMax * 0.48, yt - 0.28, 0.07, c[2]], [-xMax * 0.2, yb + 0.22, 0.05, c[1]], [xMax * 0.25, yb + 0.22, 0.05, c[0]],
  ];
  for (const [x, y, r, cc] of stars) drawSparkle(ctx, x, y, r, col(cc), P.dark, 0.012);
}

function faceTexture(T, x0, y0, w, h, xMax, yb, yt) {
  return canvasTexture(Math.round(w * PPM), Math.round(h * PPM), (ctx) => {
    ctx.setTransform(PPM, 0, 0, -PPM, -x0 * PPM, (y0 + h) * PPM);
    drawHeader(ctx, T, xMax, yb, yt);
  });
}

// Printed header box on the four top beams of a boxTruss({ top, size, span, zs: [front, back] }).
export function headerBox({ top, size, span, zs, height, depth, theme }) {
  const g = new THREE.Group();
  const lx = span / 2 - size / 2;                 // truss leg x
  const xMax = lx + depth / 2;
  const yb = top - height, yc = yb + height / 2;
  const [zf, zb] = zs;
  const plain = toon(col(theme.base));
  const printed = (x0, w, half) => toon(P.white, { map: faceTexture(theme, x0, yb, w, height, half, yb, top) });
  const front = printed(-xMax, 2 * xMax, xMax);
  // BoxGeometry faces: +x, -x, +y, -y, +z (front), -z (back)
  const fb = box(2 * xMax, height, depth, [plain, plain, plain, plain, front, front]);
  fb.position.set(0, yc, zf);
  const bb = box(2 * xMax, height, depth, [plain, plain, plain, plain, front, front]);
  bb.position.set(0, yc, zb);
  g.add(fb, bb);
  const len = zf - zb - depth;
  const side = printed(-len / 2, len, len / 2);
  for (const s of [-1, 1]) {
    const beam = box(depth, height, len, [side, side, plain, plain, plain, plain]);
    beam.position.set(s * lx, yc, (zf + zb) / 2);
    g.add(beam);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  return { group: g, bottom: yb, xMax, frontZ: zf + depth / 2 };
}

// Die-cut OPF logo sign on the header's front (supplied logo file, shown whole).
// Its bottom edge hangs `drop` below the header top, like the main stage's.
export function logoSign(key, { width, maxHeight, headerTop, drop, z, thickness = 0.06, border = 0.08, board = 'white', ceiling = Infinity }) {
  const boardColor = col(board);
  return makeCutoutSlot(key, {
    width, maxHeight, thickness, border, boardColor,
    edgeColor: new THREE.Color(boardColor).multiplyScalar(0.82), placeholder: placeholders.logo,
    assets: MAIN_ASSETS.logo,
    onBuild: (sign, w, h) => {
      sign.position.set(0, Math.min(headerTop - drop + h / 2, ceiling - 0.15 - h / 2), z);
    },
  });
}

// Die-cut sparkles hanging on cables from the truss: [[x, y, z, size, colour], …]
export function hangingSparkles(stars, trussY) {
  const g = new THREE.Group();
  const cable = new THREE.LineBasicMaterial({ color: '#555555' });
  for (const [x, y, z, size, colour] of stars) {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    drawSparkle(c.getContext('2d'), 256, 256, 230, col(colour), P.dark, 14);
    const star = dieCutBoard(c, size, { thickness: 0.04, border: size * 0.06 });
    star.position.set(x, y, z);
    star.rotation.z = ((x * 7) % 0.4) - 0.2;
    g.add(star);
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y + size / 2 - 0.02, z), new THREE.Vector3(x, trussY, z)]), cable));
  }
  return g;
}

// Comic speech bubble (die-cut board): text, width in metres, board colour, tail side
export function speechBubble(text, width, { board = 'pink', edge = '#d9558f', tail = 'left', spark = 'yellow' } = {}) {
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 560;
  const ctx = c.getContext('2d');
  ctx.beginPath();
  ctx.ellipse(450, 240, 400, 200, 0, 0, Math.PI * 2);
  if (tail === 'left') { ctx.moveTo(250, 400); ctx.lineTo(170, 540); ctx.lineTo(360, 420); }
  else { ctx.moveTo(650, 400); ctx.lineTo(730, 540); ctx.lineTo(540, 420); }
  ctx.fillStyle = P.white;
  ctx.fill();
  ctx.lineWidth = 18;
  ctx.strokeStyle = P.dark;
  ctx.stroke();
  display(ctx, 110);
  ctx.fillStyle = P.dark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 450, 235, 700);
  drawSparkle(ctx, tail === 'left' ? 820 : 80, 70, 55, col(spark), P.dark, 8);
  return dieCutBoard(c, width, { thickness: 0.04, border: 0.06, board: col(board), edge });
}

// Sticker wraps on the fronts of a PA stack: heights [bottom, top], colours + labels per box
export function paWraps({ width, depth, heights, colors, labels }) {
  const g = new THREE.Group();
  let y = 0;
  heights.forEach((bh, i) => {
    const tex = canvasTexture(300, Math.round((300 * bh) / width), (ctx, W, H) => {
      ctx.fillStyle = col(colors[i % colors.length]);
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let yy = 0; yy < H; yy += 30) for (let xx = (yy / 30) % 2 ? 0 : 30; xx < W; xx += 60) ctx.fillRect(xx, yy, 30, 30);
      drawSparkle(ctx, W / 2, H * 0.45, W * 0.3, P.white, P.dark, 6);
      display(ctx, W * 0.12);
      ctx.fillStyle = P.dark;
      ctx.textAlign = 'center';
      ctx.fillText(labels[i] ?? '', W / 2, H * 0.85, W * 0.9);
      ctx.lineWidth = 10;
      ctx.strokeStyle = P.dark;
      ctx.strokeRect(0, 0, W, H);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, bh), new THREE.MeshToonMaterial({ map: tex }));
    m.position.set(0, y + bh / 2, depth / 2 + 0.006);
    g.add(m);
    y += bh;
  });
  return g;
}

// Night-only neon strips (HDR, picked up by bloom): header top/bottom edges + deck edge.
export function neonStrips({ xMax, top, bottom, frontZ, deckWidth, deckHeight, colors }) {
  const glows = [];
  const g = new THREE.Group();
  const strip = (w, h, x, y, z, c, k = 3) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(col(c)).multiplyScalar(k), toneMapped: false }));
    m.position.set(x, y, z);
    m.visible = false;
    g.add(m);
    glows.push(m);
  };
  const t = 0.06;
  strip(2 * xMax, t, 0, top - t / 2, frontZ + 0.03, colors[0]);
  strip(2 * xMax, t, 0, bottom + t / 2, frontZ + 0.03, colors[1]);
  strip(deckWidth, 0.05, 0, deckHeight - 0.025, 0.03, colors[2], 2.5);
  return { group: g, glows };
}
