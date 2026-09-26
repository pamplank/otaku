// Generic human figures for the ballroom builds, in the main stage's style
// (flat colour + dark hull outline). Instanced, so hundreds cost little.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { palette as P } from '../../stage.config.js';
import { toon, hullMaterial } from '../sticker.js';
import { figureGeometry, mulberry32 } from '../build/people.js';

export { mulberry32 };

const standing = figureGeometry();

// Seated figure on a 0.45 m seat, facing +z; origin at the seat's floor point.
function seatedGeometry() {
  const torso = new THREE.CapsuleGeometry(0.18, 0.5, 6, 12);
  torso.translate(0, 0.45 + 0.43, -0.06);
  const thighs = new THREE.CapsuleGeometry(0.13, 0.32, 4, 8);
  thighs.rotateX(Math.PI / 2);
  thighs.translate(0, 0.5, 0.16);
  const shins = new THREE.CapsuleGeometry(0.1, 0.34, 4, 8);
  shins.translate(0, 0.24, 0.36);
  const head = new THREE.SphereGeometry(0.13, 16, 12);
  head.translate(0, 1.33, -0.04);
  return mergeGeometries([torso, thighs, shins, head]);
}
const seated = seatedGeometry();

export const CROWD_COLORS = ['#3a373a', '#46434b', '#2e2c30', '#57535a', '#f2efe9', '#e4dfd8', P.pink, P.cyan, P.yellow];
const CROWD_WEIGHTS = [18, 14, 14, 10, 12, 8, 3, 3, 2];

export function colorPicker(rand, colors = CROWD_COLORS, weights = CROWD_WEIGHTS) {
  const sum = weights.reduce((a, b) => a + b, 0);
  return () => {
    let r = rand() * sum;
    for (let i = 0; i < colors.length; i++) if ((r -= weights[i]) < 0) return colors[i];
    return colors[0];
  };
}

// spots: [{ x, y?, z, rot, color, scale? }]; seated: seated pose instead of standing.
export function crowd(spots, { seatedPose = false } = {}) {
  const g = new THREE.Group();
  if (!spots.length) return g;
  const geo = seatedPose ? seated : standing;
  const body = new THREE.InstancedMesh(geo, toon('#ffffff'), spots.length);
  const hull = new THREE.InstancedMesh(geo, hullMaterial(0.028), spots.length);
  body.castShadow = true;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
  spots.forEach((o, i) => {
    const k = o.scale ?? 1;
    m.compose(p.set(o.x, o.y ?? 0, o.z), q.setFromAxisAngle(up, o.rot ?? 0), s.set(k, k, k));
    body.setMatrixAt(i, m);
    hull.setMatrixAt(i, m);
    body.setColorAt(i, c.set(o.color));
  });
  g.add(body, hull);
  g.userData.count = spots.length;
  return g;
}

// A single named figure (staff, MC…) with its own material.
export function figure(color, { seatedPose = false } = {}) {
  const geo = seatedPose ? seated : standing;
  const m = new THREE.Mesh(geo, toon(color));
  m.castShadow = true;
  m.add(new THREE.Mesh(geo, hullMaterial(0.028)));
  return m;
}

// Random standing spots inside a rectangle, at least `gap` apart.
export function scatter(rand, { x0, x1, z0, z1, count, gap = 0.6, avoid = () => false }) {
  const out = [];
  for (let tries = 0; out.length < count && tries < count * 80; tries++) {
    const x = x0 + rand() * (x1 - x0), z = z0 + rand() * (z1 - z0);
    if (avoid(x, z) || out.some((o) => (o.x - x) ** 2 + (o.z - z) ** 2 < gap * gap)) continue;
    out.push({ x, z });
  }
  return out;
}
