// Theatre seats and chair rows (instanced). Local coordinates: the stage front is
// at z = 0 and seats face it (towards −z). Every size comes from the build config.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { palette as P } from '../../stage.config.js';
import { toon, hullMaterial, starShape } from '../sticker.js';

const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);

// Theatre seat facing −z (the stage), origin at floor centre of the seat.
function theatreSeatGeometry(w) {
  const sw = w * 0.9;
  return mergeGeometries([
    bx(sw, 0.12, 0.46, 0, 0.44, -0.02),           // cushion
    bx(sw, 0.56, 0.08, 0, 0.72, 0.22),            // back
    bx(0.06, 0.62, 0.5, -w / 2 + 0.03, 0.31, 0),  // arm / side
    bx(0.1, 0.38, 0.3, 0, 0.19, 0.05),            // pedestal
  ]);
}

// Stacking chair facing −z.
function chairGeometry(w) {
  const sw = w * 0.8, l = 0.035;
  return mergeGeometries([
    bx(sw, 0.05, 0.42, 0, 0.45, 0),
    bx(sw, 0.36, 0.035, 0, 0.72, 0.2),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => bx(l, 0.45, l, sx * (sw / 2 - l), 0.225, sz * 0.18)),
  ]);
}

function instanced(geo, list, colorOf) {
  const body = new THREE.InstancedMesh(geo, toon('#ffffff'), list.length);
  const hull = new THREE.InstancedMesh(geo, hullMaterial(0.018), list.length);
  body.castShadow = true;
  body.receiveShadow = true;
  const m = new THREE.Matrix4(), c = new THREE.Color();
  list.forEach((s, i) => {
    m.makeTranslation(s.x, 0, s.z);
    body.setMatrixAt(i, m);
    hull.setMatrixAt(i, m);
    body.setColorAt(i, c.set(colorOf(s, i)));
  });
  return [body, hull];
}

// Seat centres for `blocks` blocks either side of a centre aisle.
export function seatGrid({ blocks = 2, rows, seatsPerRow, firstRow, rowPitch, seatWidth, centreAisle = 0 }) {
  const bw = seatsPerRow * seatWidth;
  const seats = [];
  for (let b = 0; b < blocks; b++) {
    // blocks = 2: left and right of the aisle; blocks = 1: centred
    const x0 = blocks === 1 ? -bw / 2 : b === 0 ? -centreAisle / 2 - bw : centreAisle / 2;
    for (let r = 0; r < rows; r++) {
      for (let i = 0; i < seatsPerRow; i++) {
        seats.push({ x: x0 + (i + 0.5) * seatWidth, z: firstRow + r * rowPitch + 0.3, row: r, block: b, i });
      }
    }
  }
  return seats;
}

// Theatre seating: VIP rows in yellow covers, the rest dark with alternating
// pink / cyan sparkle stickers on the seat backs.
export function theatreSeating(cfg) {
  const g = new THREE.Group();
  const seats = seatGrid(cfg);
  const dark = '#2f2c32';
  g.add(...instanced(theatreSeatGeometry(cfg.seatWidth), seats, (s) => (s.row < cfg.vipRows ? P.yellow : dark)));

  const back = seats.filter((s) => s.row >= cfg.vipRows);
  const sticker = new THREE.ShapeGeometry(starShape(0.085), 6);
  const st = new THREE.InstancedMesh(sticker, new THREE.MeshToonMaterial({ color: '#ffffff' }), back.length);
  const m = new THREE.Matrix4(), c = new THREE.Color();
  back.forEach((s, i) => {
    m.makeTranslation(s.x, 0.76, s.z + 0.262);
    st.setMatrixAt(i, m);
    st.setColorAt(i, c.set((s.i + s.row) % 2 ? P.pink : P.cyan));
  });
  g.add(st);
  g.userData.count = seats.length;
  return { group: g, seats };
}

// Plain chair rows (mini stage)
export function chairRows(cfg, color = '#f0ece6') {
  const g = new THREE.Group();
  const seats = seatGrid({ blocks: 1, ...cfg });
  g.add(...instanced(chairGeometry(cfg.seatWidth), seats, () => color));
  g.userData.count = seats.length;
  return { group: g, seats };
}
