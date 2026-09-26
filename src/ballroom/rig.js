// Stage hardware shared by the ballroom builds, in the main stage's style:
// ground-supported box truss, moving-head fixtures (lit at night by lighting.js),
// stairs with handrails. Local coordinates; callers place the group.
import * as THREE from 'three';
import { palette as P } from '../../stage.config.js';
import { toon, box, polyline, OUTLINE, OUTLINE_THIN } from '../sticker.js';
import { trussGeometry } from '../build/stage.js';

export const TRUSS_COLOR = '#c9ced3';

// Truss: goalposts at each z in `zs` (legs at ±span/2), joined on top by side
// beams when there are two. top = top of truss; size = square section.
export function boxTruss({ top, size, span, zs }) {
  const g = new THREE.Group();
  const mat = toon(TRUSS_COLOR);
  const lx = span / 2 - size / 2;
  const legLen = top - size;
  const add = (geo, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  };
  const leg = trussGeometry(legLen, size).rotateZ(Math.PI / 2);
  const beam = trussGeometry(span, size);
  for (const z of zs) {
    for (const x of [-lx, lx]) {
      add(leg, x, legLen / 2, z);
      const plate = box(0.8, 0.03, 0.8, toon('#3a373a'), { line: OUTLINE });
      plate.position.set(x, 0.015, z);
      g.add(plate);
    }
    add(beam, 0, top - size / 2, z);
  }
  if (zs.length === 2) {
    const d = Math.abs(zs[0] - zs[1]) - size;
    const side = trussGeometry(d, size).rotateY(Math.PI / 2);
    for (const x of [-lx, lx]) add(side, x, top - size / 2, (zs[0] + zs[1]) / 2);
  }
  return g;
}

// A single truss tower (for IMAG screens): legs of height h, square section.
export function trussTower(h, size) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(trussGeometry(h, size).rotateZ(Math.PI / 2), toon(TRUSS_COLOR));
  m.position.y = h / 2;
  m.castShadow = true;
  g.add(m);
  const plate = box(0.7, 0.03, 0.7, toon('#3a373a'), { line: OUTLINE });
  plate.position.y = 0.015;
  g.add(plate);
  return g;
}

// Moving heads hung under a beam. xs: positions; y: underside of the beam;
// targets: world-space aim points (Vector3). Returns lighting.js fixture records.
export function fixtures(g, { xs, y, z, colors = [P.pink, P.cyan, P.yellow], targets, origin = new THREE.Vector3() }) {
  const out = [];
  const bodyMat = toon('#2e2c2f');
  xs.forEach((x, i) => {
    const f = new THREE.Group();
    f.position.set(x, y, z);
    const clamp = box(0.34, 0.12, 0.28, bodyMat);
    clamp.position.y = -0.06;
    f.add(clamp);
    const yoke = box(0.3, 0.2, 0.08, bodyMat, { edges: false });
    yoke.position.y = -0.2;
    f.add(yoke);
    const head = new THREE.Group();
    head.position.y = -0.36;
    head.add(box(0.26, 0.26, 0.3, bodyMat));
    const lensMat = new THREE.MeshBasicMaterial({ color: '#555' });
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), lensMat);
    lens.position.z = 0.152;
    head.add(lens);
    f.add(head);
    g.add(f);
    const target = targets[i].clone().add(origin);
    head.lookAt(new THREE.Vector3(x, 0, z + 6).add(origin));
    out.push({ head, lensMat, color: colors[i % colors.length], target });
  });
  return out;
}

// Stairs rising towards −z onto a deck of height h, front of the top step at z = 0.
// Steps go out towards +z. Handrails on both sides.
export function stairs({ width, height, steps, run = 0.3, color = '#343135', riserColors }) {
  const g = new THREE.Group();
  const rise = height / steps;
  for (let i = 0; i < steps; i++) {
    const hgt = height - i * rise;
    const face = riserColors ? toon(riserColors[i % riserColors.length]) : toon(color);
    const side = toon(color);
    const s = box(width, hgt, run, [side, side, side, side, face, side]);
    s.position.set(0, hgt / 2, run / 2 + i * run);
    g.add(s);
  }
  // Handrails: posts at top and bottom, rail 0.9 m above the nosings
  const len = steps * run;
  for (const sx of [-1, 1]) {
    const x = sx * (width / 2 + 0.04);
    const pts = [
      new THREE.Vector3(x, height + 0.9, -0.1),
      new THREE.Vector3(x, height + 0.9, 0.05),
      new THREE.Vector3(x, rise + 0.9, len - run / 2),
      new THREE.Vector3(x, 0.9, len + 0.25),
    ];
    const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 24, 0.025, 8), toon('#bfc3c7'));
    rail.castShadow = true;
    g.add(rail);
    for (const [z, y0] of [[0, height], [len + 0.25, 0]]) {
      const post = box(0.05, 0.9, 0.05, toon('#bfc3c7'), { edges: false });
      post.position.set(x, y0 + 0.45, z);
      g.add(post);
    }
  }
  return g;
}

// Flat sticker sign: canvas `draw(ctx, W, H)` on a white card with a dark
// outline and a coloured offset layer. Faces +z. Size in metres.
export function stickerCard(w, h, tex, { offset = 0.08, offsetColor = P.pink, depth = 0.04 } = {}) {
  const g = new THREE.Group();
  const face = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth),
    [toon(P.white), toon(P.white), toon(P.white), toon(P.white), toon(P.white, { map: tex }), toon(P.white)]);
  face.castShadow = true;
  g.add(face);
  g.add(polyline([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => new THREE.Vector3(x, y, depth / 2 + 0.002)), OUTLINE, true));
  if (offset > 0) {
    const off = box(w, h, depth * 0.6, toon(offsetColor), { edges: false });
    off.position.set(offset, -offset, -depth);
    g.add(off);
  }
  return g;
}

export { OUTLINE_THIN };

// Belt-stanchion line through [[x, z], …]: posts every ~`post` m, belt between.
export function beltLine(points, { post = 2, color = P.dark, beltColor = P.dark, height = 0.95 } = {}) {
  const g = new THREE.Group();
  const postMat = toon('#b9bcc0'), baseMat = toon('#2a282c'), belt = toon(beltColor);
  const posts = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i], [bx, bz] = points[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / post));
    for (let k = i === 0 ? 0 : 1; k <= n; k++) posts.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  for (const [x, z] of posts) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, height, 8), postMat);
    p.position.set(x, height / 2, z);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 16), baseMat);
    b.position.set(x, 0.015, z);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), toon(color));
    cap.position.set(x, height + 0.02, z);
    g.add(p, b, cap);
  }
  for (let i = 0; i < posts.length - 1; i++) {
    const [ax, az] = posts[i], [bx, bz] = posts[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const s = new THREE.Mesh(new THREE.BoxGeometry(len, 0.05, 0.01), belt);
    s.position.set((ax + bx) / 2, height - 0.06, (az + bz) / 2);
    s.rotation.y = Math.atan2(-(bz - az), bx - ax);
    g.add(s);
  }
  return g;
}

// Queue lane between two belt lines along a centre path; returns { group, spots }
// where spots are standing positions along the lane (heading along the path).
export function queueLane(path, { width = 1.2, post = 2, beltColor = P.dark, capColor = P.dark, spacing = 0.75 } = {}) {
  const g = new THREE.Group();
  const offset = (sign) => path.map(([x, z], i) => {
    const [px, pz] = path[Math.max(0, i - 1)], [nx, nz] = path[Math.min(path.length - 1, i + 1)];
    let dx = nx - px, dz = nz - pz;
    const l = Math.hypot(dx, dz) || 1;
    dx /= l; dz /= l;
    // miter at corners
    let k = 1;
    if (i > 0 && i < path.length - 1) {
      const [ax, az] = [x - px, z - pz], [bx, bz] = [nx - x, nz - z];
      const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz);
      const cos = (ax * bx + az * bz) / (la * lb);
      k = 1 / Math.max(0.5, Math.sqrt((1 + cos) / 2));
    }
    return [x - dz * sign * (width / 2) * k, z + dx * sign * (width / 2) * k];
  });
  g.add(beltLine(offset(1), { post, beltColor, color: capColor }), beltLine(offset(-1), { post, beltColor, color: capColor }));
  const spots = [];
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i], [bx, bz] = path[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    for (let d = i === 0 ? 0.4 : spacing; d < len; d += spacing) {
      spots.push({ x: ax + ((bx - ax) * d) / len, z: az + ((bz - az) * d) / len, rot: Math.atan2(bx - ax, bz - az) });
    }
  }
  return { group: g, spots };
}
