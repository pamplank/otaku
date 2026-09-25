// Human scale: stylised figures on the deck, at FOH, and a sample crowd in the pocket.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { stage as S, site as X, people as PPL, palette as P } from '../../stage.config.js';
import { L } from '../layout.js';
import { toon, hullMaterial } from '../sticker.js';
import { presets } from '../cameras.js';

// 1.70 m tall figure, feet at y = 0.
function figureGeometry() {
  const body = new THREE.CapsuleGeometry(0.19, 1.04, 6, 12);
  body.translate(0, 0.71, 0);
  const head = new THREE.SphereGeometry(0.13, 16, 12);
  head.translate(0, 1.57, 0);
  return mergeGeometries([body, head]);
}

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function buildPeople() {
  const g = new THREE.Group();
  g.name = 'people';
  const geo = figureGeometry();
  const hull = hullMaterial(0.028);
  const face = (x, z, tx = 0, tz = -3) => Math.atan2(tx - x, tz - z);

  // Performers on the deck
  for (const p of PPL.performers) {
    const m = new THREE.Mesh(geo, toon(P[p.color]));
    m.castShadow = true;
    m.add(new THREE.Mesh(geo, hull));
    m.position.set(p.x, S.deck.height, p.z);
    m.rotation.y = face(p.x, p.z, p.x * 0.3, 12);
    g.add(m);
  }

  // FOH operators
  const F = X.foh;
  for (const dx of [-0.6, 0.6]) {
    const m = new THREE.Mesh(geo, toon('#4b4850'));
    m.castShadow = true;
    m.add(new THREE.Mesh(geo, hull));
    m.position.set(F.x + dx, F.riser, F.z - F.depth / 2 + 1.35);
    m.rotation.y = face(m.position.x, m.position.z);
    g.add(m);
  }

  // Sample crowd (instanced), scattered inside the viewing pocket
  const rand = mulberry32(PPL.seed);
  const target = Math.round(L.pocketArea * PPL.crowdDensity);
  const xs = L.pocketPoly.map((p) => p[0]), zs = L.pocketPoly.map((p) => p[1]);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  const minGap = 0.55;
  const cell = new Map();
  const key = (x, z) => `${Math.floor(x / minGap)},${Math.floor(z / minGap)}`;
  const clash = (x, z) => {
    const cxI = Math.floor(x / minGap), czI = Math.floor(z / minGap);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      for (const [ox, oz] of cell.get(`${cxI + i},${czI + j}`) || []) {
        if ((ox - x) ** 2 + (oz - z) ** 2 < minGap ** 2) return true;
      }
    }
    return false;
  };
  // Keep a little space around the "Crowd eye level" camera (it stands in the crowd).
  const [ex, , ez] = presets().crowd.pos;
  const blocked = (x, z) => {
    if (Math.abs(x - F.x) < F.width / 2 + 0.7 && Math.abs(z - F.z) < F.depth / 2 + 0.7) return true;
    if ((x - ex) ** 2 + (z - ez) ** 2 < 1.1 ** 2 || (Math.abs(x - ex) < 0.9 && z < ez && z > ez - 2.2)) return true;
    for (const t of X.acTowers) if ((x - t.x) ** 2 + (z - t.z) ** 2 < 1.4 ** 2) return true;
    return !inPoly(x, z, L.pocketPoly) || z < X.pocket.backZ + 0.4;
  };
  const spots = [];
  for (let tries = 0; spots.length < target && tries < target * 60; tries++) {
    const x = x0 + rand() * (x1 - x0), z = z0 + rand() * (z1 - z0);
    if (blocked(x, z) || clash(x, z)) continue;
    spots.push([x, z]);
    const k = key(x, z);
    if (!cell.has(k)) cell.set(k, []);
    cell.get(k).push([x, z]);
  }

  const crowd = new THREE.InstancedMesh(geo, toon('#ffffff'), spots.length);
  const crowdHull = new THREE.InstancedMesh(geo, hull, spots.length);
  crowd.castShadow = true;
  const palette = ['#3a373a', '#46434b', '#2e2c30', '#57535a', '#f2efe9', '#e4dfd8', P.pink, P.cyan, P.yellow];
  const weights = [18, 14, 14, 10, 12, 8, 3, 3, 2];
  const wsum = weights.reduce((a, b) => a + b, 0);
  const pick = () => {
    let r = rand() * wsum;
    for (let i = 0; i < weights.length; i++) if ((r -= weights[i]) < 0) return palette[i];
    return palette[0];
  };
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const c = new THREE.Color();
  spots.forEach(([x, z], i) => {
    const h = (1.52 + rand() * 0.34) / 1.7;
    q.setFromAxisAngle(up, face(x, z) + (rand() - 0.5) * 0.6);
    m.compose(p.set(x, 0, z), q, s.set(h, h, h));
    crowd.setMatrixAt(i, m);
    crowdHull.setMatrixAt(i, m);
    crowd.setColorAt(i, c.set(pick()));
  });
  g.add(crowd, crowdHull);
  g.userData.crowdCount = spots.length;
  return g;
}
