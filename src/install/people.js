// Stylised people for scale in the rendered installation scenes: generic,
// mannequin-like figures (no faces, no characters) in a few poses.
import * as THREE from 'three';
import { mulberry32 } from '../build/people.js';

const CLOTHES = ['#2f2d33', '#4a4752', '#6b6f78', '#e9e4dc', '#c9c2b6', '#3d5a73', '#7a4b5a', '#FF66AD', '#00CAD8', '#FFF33F'];
const WEIGHTS = [16, 12, 10, 12, 8, 6, 5, 3, 3, 2];
const SKIN = ['#e8c9a8', '#c99a74', '#a06e4c', '#f1d6bd', '#8a5a3c'];
const HAIR = ['#1e1a18', '#3a2a20', '#5a4030', '#2a2626'];

const geo = {
  torso: new THREE.CapsuleGeometry(0.17, 0.46, 6, 14),
  hips: new THREE.CapsuleGeometry(0.16, 0.08, 4, 12),
  leg: new THREE.CapsuleGeometry(0.075, 0.74, 4, 10),
  arm: new THREE.CapsuleGeometry(0.052, 0.52, 4, 10),
  head: new THREE.SphereGeometry(0.115, 20, 16),
  hair: new THREE.SphereGeometry(0.122, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
  shoe: new THREE.BoxGeometry(0.11, 0.07, 0.26),
  phone: new THREE.BoxGeometry(0.075, 0.15, 0.01),
};

function pick(rand, list, weights) {
  if (!weights) return list[Math.floor(rand() * list.length)];
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) if ((r -= weights[i]) < 0) return list[i];
  return list[0];
}

const mat = (c, rough = 0.8) => new THREE.MeshStandardMaterial({ color: c, roughness: rough });

// pose: 'stand' | 'phone' (phone held up at eye level) | 'pose' (peace sign) | 'walk' | 'wave'
export function person({ pose = 'stand', seed = 1, height = 1.7 } = {}) {
  const rand = mulberry32(seed * 7919 + 13);
  const top = mat(pick(rand, CLOTHES, WEIGHTS));
  const bottom = mat(pick(rand, ['#26252a', '#3b3f4a', '#5b5f68', '#d8d2c6', '#2f3a4d']));
  const skin = mat(pick(rand, SKIN), 0.6);
  const hair = mat(pick(rand, HAIR), 0.7);
  const shoe = mat(pick(rand, ['#f2f2f2', '#1c1c1c', '#7a6a58']), 0.6);

  const g = new THREE.Group();
  const add = (geom, m, x, y, z, rx = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geom, m);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, 0, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };
  const stride = pose === 'walk' ? 0.28 : 0;
  // legs + shoes
  for (const s of [-1, 1]) {
    add(geo.leg, bottom, s * 0.09, 0.45, s * stride * 0.5, s * stride * 0.6);
    add(geo.shoe, shoe, s * 0.09, 0.035, 0.04 + s * stride * 0.62);
  }
  add(geo.hips, bottom, 0, 0.9, 0, 0, Math.PI / 2);
  add(geo.torso, top, 0, 1.2, 0);
  add(geo.head, skin, 0, 1.6, 0.01);
  add(geo.hair, hair, 0, 1.615, -0.01, -0.25);

  // arms: pivot at the shoulder
  const arm = (side, pitch, roll = 0.12) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.23, 1.4, 0);
    pivot.rotation.set(pitch, 0, side * roll);
    const a = new THREE.Mesh(geo.arm, top);
    a.position.y = -0.3;
    a.castShadow = true;
    pivot.add(a);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), skin);
    hand.position.y = -0.6;
    pivot.add(hand);
    g.add(pivot);
    return pivot;
  };
  if (pose === 'phone') {
    const r = arm(1, -1.68, -0.22);   // phone held up at eye level, in front
    arm(-1, -1.45, 0.3);
    const ph = new THREE.Mesh(geo.phone, mat('#141416', 0.3));
    ph.position.set(0, -0.62, 0.05);
    ph.rotation.x = Math.PI / 2 - 0.2;
    r.add(ph);
  } else if (pose === 'pose') {
    arm(1, -0.2, 2.6);          // hand up beside the head
    arm(-1, 0.1, 0.5);          // hand on hip-ish
  } else if (pose === 'wave') {
    arm(1, 0, 2.4);
    arm(-1, 0.05, 0.12);
  } else if (pose === 'walk') {
    arm(1, 0.35, 0.1);
    arm(-1, -0.35, 0.1);
  } else {
    arm(1, 0.04, 0.12);
    arm(-1, -0.04, 0.12);
  }
  g.scale.setScalar(height / 1.72);
  return g;
}

// Several people: [{ x, z, rot, pose, height, y? }] (y: standing on a plinth)
export function crowd(list, seed = 3) {
  const g = new THREE.Group();
  list.forEach((p, i) => {
    const f = person({ pose: p.pose, seed: seed * 31 + i, height: p.height ?? 1.58 + ((i * 37) % 23) / 100 });
    f.position.set(p.x, p.y ?? 0, p.z);
    f.rotation.y = p.rot ?? 0;
    g.add(f);
  });
  return g;
}

// Face a point on the floor from (x, z)
export const facing = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
