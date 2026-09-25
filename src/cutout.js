// Die-cut sign from a logo image: the board follows the artwork's outline plus a
// border, like a printed foam-board cut-out. The supplied file is never changed;
// only the viewer's copy is processed:
//  · transparent PNG/WebP: the outline comes from the alpha channel;
//  · opaque file on a flat background (all four corners the same colour): that
//    background colour is cut away first;
//  · anything else: the board is a plain rectangle around the artwork.
import * as THREE from 'three';

const GRID = 256;          // outline tracing resolution (cells across)
const MAX_TEX = 2048;      // face texture size cap
const KEY_NEAR = 50;       // RGB distance from the background: fully cut away …
const KEY_FAR = 110;       // … to fully kept (soft edge in between)

// source: HTMLImageElement or canvas. border: board margin as a fraction of the sign width.
export function dieCut(source, { border = 0.03, board = '#ffffff' } = {}) {
  const sw = source.naturalWidth || source.width;
  const sh = source.naturalHeight || source.height;
  const k = Math.min(1, MAX_TEX / ((1 + 2 * border) * Math.max(sw, sh)));
  const aw = Math.round(sw * k), ah = Math.round(sh * k);
  const pad = Math.ceil(aw * border) + 2;
  const cw = aw + 2 * pad, ch = ah + 2 * pad;

  // Artwork with its background removed
  const art = document.createElement('canvas');
  art.width = cw;
  art.height = ch;
  const actx = art.getContext('2d', { willReadFrequently: true });
  actx.drawImage(source, pad, pad, aw, ah);
  const img = actx.getImageData(pad, pad, aw, ah);
  if (!hasTransparency(img.data)) {
    const bg = flatBackground(img);
    if (bg) {
      keyOut(img.data, bg);
      actx.putImageData(img, pad, pad);
    }
    // otherwise alpha stays opaque everywhere: the board is a rectangle around the art
  }
  const alpha = new Uint8Array(aw * ah);
  for (let i = 0; i < aw * ah; i++) alpha[i] = img.data[i * 4 + 3];

  // Board outline on a coarse grid: art mask, grown by the border, holes filled
  const gw = GRID, gh = Math.max(8, Math.round((GRID * ch) / cw));
  let mask = new Uint8Array(gw * gh);
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const px = Math.floor(((x + 0.5) * cw) / gw) - pad;
      const py = Math.floor(((y + 0.5) * ch) / gh) - pad;
      if (px >= 0 && py >= 0 && px < aw && py < ah && alpha[py * aw + px] > 110) mask[y * gw + x] = 1;
    }
  }
  mask = dilate(mask, gw, gh, ((pad - 2) * gw) / cw);
  fillHoles(mask, gw, gh);
  const loops = traceLoops(mask, gw, gh)
    .filter((l) => area(l) > gw * gh * 0.0015)
    .map((l) => smooth(simplify(l, 0.7)));

  // Crop to the board: the sign's size is the board's size, not the file's.
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const l of loops) for (const [x, y] of l) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  const sx = cw / gw, sy = ch / gh;
  const ox = Math.floor(x0 * sx), oy = Math.floor(y0 * sy);
  const tw = Math.ceil(x1 * sx) - ox, th = Math.ceil(y1 * sy) - oy;

  // Face texture: board colour in the traced shape, artwork on top
  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  ctx.translate(-ox, -oy);
  ctx.fillStyle = board;
  ctx.beginPath();
  for (const l of loops) {
    l.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x * sx, y * sy));
    ctx.closePath();
  }
  ctx.fill();
  ctx.drawImage(art, 0, 0);

  // Shapes in 0..1 texture space (y up), counter-clockwise
  const shapes = loops.map((l) => {
    const pts = l.map(([x, y]) => new THREE.Vector2((x * sx - ox) / tw, 1 - (y * sy - oy) / th));
    if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
    return new THREE.Shape(pts);
  });
  return { canvas, shapes, aspect: tw / th };
}

function hasTransparency(d) {
  let n = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) n++;
  return n > d.length / 4 / 200;
}

// Average corner colour, if all four corners agree (a flat background).
function flatBackground({ data, width: w, height: h }) {
  const s = Math.max(2, Math.round(Math.min(w, h) * 0.02));
  const corners = [[0, 0], [w - s, 0], [0, h - s], [w - s, h - s]].map(([x0, y0]) => {
    const c = [0, 0, 0];
    for (let y = y0; y < y0 + s; y++) for (let x = x0; x < x0 + s; x++) {
      const i = (y * w + x) * 4;
      c[0] += data[i]; c[1] += data[i + 1]; c[2] += data[i + 2];
    }
    return c.map((v) => v / (s * s));
  });
  const avg = [0, 1, 2].map((j) => corners.reduce((a, c) => a + c[j], 0) / 4);
  return corners.every((c) => dist(c, avg) < 24) ? avg : null;
}

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

// Cut the background colour away with a soft edge, and remove its tint from
// the half-transparent edge pixels so no coloured fringe is left.
function keyOut(d, bg) {
  for (let i = 0; i < d.length; i += 4) {
    const px = [d[i], d[i + 1], d[i + 2]];
    const a = THREE.MathUtils.smoothstep(dist(px, bg), KEY_NEAR, KEY_FAR);
    if (a < 1 && a > 0) for (let j = 0; j < 3; j++) d[i + j] = THREE.MathUtils.clamp((px[j] - (1 - a) * bg[j]) / a, 0, 255);
    d[i + 3] = Math.round(a * 255);
  }
}

function dilate(mask, w, h, r) {
  const out = mask.slice();
  const ri = Math.ceil(r);
  const disc = [];
  for (let dy = -ri; dy <= ri; dy++) for (let dx = -ri; dx <= ri; dx++) if (dx * dx + dy * dy <= r * r) disc.push([dx, dy]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
        !mask[y * w + x - 1] || !mask[y * w + x + 1] || !mask[(y - 1) * w + x] || !mask[(y + 1) * w + x];
      if (!edge) continue;
      for (const [dx, dy] of disc) {
        const X = x + dx, Y = y + dy;
        if (X >= 0 && Y >= 0 && X < w && Y < h) out[Y * w + X] = 1;
      }
    }
  }
  return out;
}

// Anything not reachable from the border is inside the board: fill it.
function fillHoles(mask, w, h) {
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (seen[i] || mask[i]) continue;
    seen[i] = 1;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  for (let i = 0; i < w * h; i++) if (!seen[i]) mask[i] = 1;
}

// Boundary loops along cell edges (grid-corner coordinates, y down).
// Each directed edge keeps the filled cell on its left; at a corner shared by
// two diagonal cells, turn left so loops stay simple.
function traceLoops(mask, w, h) {
  const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
  const out = new Map(); // "x,y" -> [[x2, y2], ...]
  const add = (x1, y1, x2, y2) => {
    const key = `${x1},${y1}`;
    if (!out.has(key)) out.set(key, []);
    out.get(key).push([x2, y2]);
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!on(x, y)) continue;
      if (!on(x, y - 1)) add(x + 1, y, x, y);         // top edge, right → left
      if (!on(x - 1, y)) add(x, y, x, y + 1);         // left edge, down
      if (!on(x, y + 1)) add(x, y + 1, x + 1, y + 1); // bottom edge, left → right
      if (!on(x + 1, y)) add(x + 1, y + 1, x + 1, y); // right edge, up
    }
  }
  const loops = [];
  for (const [startKey, list] of out) {
    while (list.length) {
      const [sx, sy] = startKey.split(',').map(Number);
      const loop = [[sx, sy]];
      let [px, py] = [sx, sy];
      let [nx, ny] = list.pop();
      while (!(nx === sx && ny === sy)) {
        loop.push([nx, ny]);
        const cands = out.get(`${nx},${ny}`);
        if (!cands?.length) break;
        let pick = 0;
        if (cands.length > 1) {
          const dx = nx - px, dy = ny - py;
          pick = cands.findIndex(([cx, cy]) => (dx * (cy - ny) - dy * (cx - nx)) > 0);
          if (pick < 0) pick = 0;
        }
        const [cx, cy] = cands.splice(pick, 1)[0];
        [px, py, nx, ny] = [nx, ny, cx, cy];
      }
      if (loop.length > 3) loops.push(loop);
    }
  }
  return loops;
}

function area(l) {
  let a = 0;
  for (let i = 0; i < l.length; i++) {
    const [x1, y1] = l[i], [x2, y2] = l[(i + 1) % l.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
}

// Ramer–Douglas–Peucker on a closed loop.
function simplify(pts, tol) {
  const rdp = (a, b) => {
    const [x1, y1] = pts[a], [x2, y2] = pts[b % pts.length];
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    let best = -1, bi = -1;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = pts[i];
      const d = Math.abs((x2 - x1) * (y1 - y) - (x1 - x) * (y2 - y1)) / len;
      if (d > best) { best = d; bi = i; }
    }
    return best > tol ? [...rdp(a, bi), ...rdp(bi, b)] : [a];
  };
  const mid = Math.floor(pts.length / 2);
  return [...rdp(0, mid), ...rdp(mid, pts.length)].map((i) => pts[i]);
}

// Two rounds of Chaikin corner cutting: rounds the staircase into a cut line.
function smooth(pts, rounds = 2) {
  for (let r = 0; r < rounds; r++) {
    const next = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      next.push([0.75 * x1 + 0.25 * x2, 0.75 * y1 + 0.25 * y2], [0.25 * x1 + 0.75 * x2, 0.25 * y1 + 0.75 * y2]);
    }
    pts = next;
  }
  return pts;
}
