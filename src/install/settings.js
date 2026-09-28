// Generic settings for the installations (no brands, no storefront names):
// hotel lobby with a porte-cochère hint, mall atrium, mall walkway, concourse.
// Each returns { group, glows (emissive materials that rise at night), ceiling }.
import * as THREE from 'three';
import { stoneFloor, asphalt, wallMat, glassPane, metal, darkMetal, glowPanel, paint } from './materials.js';

const shadowed = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
const boxM = (w, h, d, material) => shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material));
const cyl = (r, h, material, seg = 24) => shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material));

function floor(g, size, material, y = 0) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  f.rotation.x = -Math.PI / 2;
  f.position.y = y;
  f.receiveShadow = true;
  g.add(f);
  return f;
}

// Potted plant (generic): pot + clustered foliage
export function planter(x, z, s = 1) {
  const g = new THREE.Group();
  const pot = cyl(0.32 * s, 0.6 * s, paint('dark', { roughness: 0.6 }));
  pot.position.y = 0.3 * s;
  g.add(pot);
  const leaf = new THREE.MeshStandardMaterial({ color: '#3f6b3a', roughness: 0.75 });
  for (let i = 0; i < 7; i++) {
    const b = shadowed(new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 * s, 1), leaf));
    const a = i * 0.9;
    b.position.set(Math.cos(a) * 0.18 * s, (0.85 + (i % 3) * 0.22) * s, Math.sin(a) * 0.18 * s);
    g.add(b);
  }
  g.position.set(x, 0, z);
  return g;
}

function bench(x, z, rot = 0) {
  const g = new THREE.Group();
  const seat = boxM(1.8, 0.08, 0.5, new THREE.MeshStandardMaterial({ color: '#a77b52', roughness: 0.55 }));
  seat.position.y = 0.45;
  g.add(seat);
  for (const sx of [-0.75, 0.75]) {
    const leg = boxM(0.06, 0.45, 0.45, metal());
    leg.position.set(sx, 0.225, 0);
    g.add(leg);
  }
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  return g;
}

// Ceiling slab with light panels (hidden in the top-down view)
function ceilingWithPanels(w, d, y, cx, cz, glows, { every = 3, panel = [1.2, 0.5] } = {}) {
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), wallMat('#f3efe8'));
  slab.position.set(cx, y + 0.1, cz);
  slab.receiveShadow = true;
  g.add(slab);
  const pm = glowPanel('#fff6e6', 1.3, 2.0);
  glows.push(pm);
  for (let x = -w / 2 + every / 2; x < w / 2; x += every) for (let z = -d / 2 + every / 2; z < d / 2; z += every) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(...panel), pm);
    p.rotation.x = Math.PI / 2;
    p.position.set(cx + x, y - 0.005, cz + z);
    g.add(p);
  }
  return g;
}

// ─── Hotel lobby at the entrance, porte-cochère beyond the glass ─────────────
export function lobby() {
  const g = new THREE.Group();
  const glows = [];
  floor(g, 60, stoneFloor(60, 1.2, { tone: '#d9d0c2', grout: '#bdb2a1', rough: 0.14 }));
  // Glass entrance front at z = -7 with metal mullions and a door bay
  const fz = -7;
  const glass = glassPane();
  for (let x = -14; x < 14; x += 2) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(2, 6), glass);
    pane.position.set(x + 1, 3, fz);
    g.add(pane);
    const mull = boxM(0.08, 6, 0.12, darkMetal());
    mull.position.set(x, 3, fz);
    g.add(mull);
  }
  const transom = boxM(28, 0.14, 0.14, darkMetal());
  transom.position.set(0, 2.7, fz);
  g.add(transom);
  // Exterior: driveway + porte-cochère canopy on columns
  const drive = new THREE.Mesh(new THREE.PlaneGeometry(40, 8), asphalt());
  drive.rotation.x = -Math.PI / 2;
  drive.position.set(0, 0.005, fz - 6.5);
  drive.receiveShadow = true;
  g.add(drive);
  const kerb = boxM(40, 0.15, 0.3, wallMat('#d8d2c8'));
  kerb.position.set(0, 0.075, fz - 2.4);
  g.add(kerb);
  const canopy = boxM(26, 0.6, 12, wallMat('#f1ece4'));
  canopy.position.set(0, 6.8, fz - 6);
  g.add(canopy);
  const under = glowPanel('#fff1dc', 1.0, 2.2);
  glows.push(under);
  for (let x = -10; x <= 10; x += 5) {
    const l = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), under);
    l.rotation.x = Math.PI / 2;
    l.position.set(x, 6.49, fz - 6);
    g.add(l);
  }
  for (const x of [-11, 11]) for (const z of [fz - 2.8, fz - 10]) {
    const c = cyl(0.4, 6.5, wallMat('#e9e3d9'), 32);
    c.position.set(x, 3.25, z);
    g.add(c);
  }
  // Interior side wall + planters
  const wall = boxM(0.3, 7, 24, wallMat('#e6ddcf'));
  wall.position.set(-14, 3.5, 5);
  g.add(wall);
  g.add(planter(-4.5, -5.6), planter(4.5, -5.6), planter(-12.6, 2), planter(-12.6, 8));
  const ceiling = ceilingWithPanels(28, 17, 7, 0, 1.5, glows, { every: 3.5 });
  g.add(ceiling);
  return { group: g, glows, ceiling };
}

// ─── Mall atrium: round void above with a balcony ring and glass balustrade ──
export function atrium() {
  const g = new THREE.Group();
  const glows = [];
  floor(g, 70, stoneFloor(70, 1.0, { tone: '#e2dbd1', grout: '#c4baad', rough: 0.12 }));
  // inlay ring on the floor
  const inlay = new THREE.Mesh(new THREE.RingGeometry(9.6, 10, 96), new THREE.MeshStandardMaterial({ color: '#c9bfae', roughness: 0.25 }));
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = 0.003;
  inlay.receiveShadow = true;
  g.add(inlay);
  const ring = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.RingGeometry(12, 20, 96), wallMat('#f4f0ea'));
  slab.rotation.x = -Math.PI / 2;
  slab.position.y = 5.8;
  ring.add(slab);
  const edge = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.6, 96, 1, true), wallMat('#f4f0ea')));
  edge.material.side = THREE.DoubleSide;
  edge.position.y = 5.5;
  ring.add(edge);
  const bal = new THREE.Mesh(new THREE.CylinderGeometry(12.05, 12.05, 1.1, 96, 1, true), glassPane());
  bal.material.side = THREE.DoubleSide;
  bal.position.y = 6.35;
  ring.add(bal);
  const rail = shadowed(new THREE.Mesh(new THREE.TorusGeometry(12.05, 0.04, 8, 128), metal()));
  rail.rotation.x = Math.PI / 2;
  rail.position.y = 6.9;
  ring.add(rail);
  const soffitGlow = glowPanel('#fff2dd', 0.9, 2.4);
  glows.push(soffitGlow);
  const soffit = new THREE.Mesh(new THREE.RingGeometry(12.1, 12.6, 96), soffitGlow);
  soffit.rotation.x = Math.PI / 2;
  soffit.position.y = 5.19;
  ring.add(soffit);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const c = cyl(0.45, 5.2, wallMat('#ece6dc'), 32);
    c.position.set(Math.cos(a) * 13.2, 2.6, Math.sin(a) * 13.2);
    g.add(c);
  }
  // generic shopfront glow behind the columns (no names)
  const shopGlow = glowPanel('#ffe7c6', 0.6, 0.85);
  glows.push(shopGlow);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.6), shopGlow);
    p.position.set(Math.cos(a) * 19, 2.2, Math.sin(a) * 19);
    p.lookAt(0, 2.2, 0);
    g.add(p);
  }
  g.add(ring);
  g.add(planter(-6, 5), planter(6.5, 5.5), planter(-7, -6), planter(7, -6.5));
  return { group: g, glows, ceiling: ring };
}

// ─── Mall walkway: storefront glazing both sides (generic), ceiling light strips
export function walkway() {
  const g = new THREE.Group();
  const glows = [];
  floor(g, 80, stoneFloor(80, 0.9, { tone: '#d6d0c7', grout: '#b9b0a3', rough: 0.14 }));
  const shopColors = ['#ffe6c7', '#fbe0ea', '#dff4f6', '#fff6cf'];
  for (const side of [-1, 1]) {
    for (let i = -4; i <= 4; i++) {
      const x = i * 7;
      const z = side * 5;
      const back = glowPanel(shopColors[(i + 4 + (side > 0 ? 2 : 0)) % 4], 0.5, 0.85);
      glows.push(back);
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.4), back);
      panel.position.set(x, 1.9, z + side * 2.6);
      panel.rotation.y = side > 0 ? Math.PI : 0;
      g.add(panel);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.4), glassPane());
      gl.position.set(x, 1.9, z);
      g.add(gl);
      const fascia = boxM(6.9, 0.8, 0.25, wallMat('#2f2c33'));
      fascia.position.set(x, 4.0, z);
      g.add(fascia);
      const pier = boxM(0.6, 4.4, 0.6, wallMat('#e9e2d6'));
      pier.position.set(x + 3.5, 2.2, z);
      g.add(pier);
    }
  }
  const ceiling = ceilingWithPanels(60, 10, 4.6, 0, 0, glows, { every: 2.5, panel: [1.8, 0.18] });
  g.add(ceiling);
  g.add(bench(-7, 2.8), bench(7, -2.8, Math.PI), planter(-3.2, 3.2, 0.9), planter(11, 3.2, 0.9));
  return { group: g, glows, ceiling };
}

// ─── Concourse: wide floor, square columns, skylight strip, benches ─────────
export function concourse() {
  const g = new THREE.Group();
  const glows = [];
  floor(g, 80, stoneFloor(80, 1.2, { tone: '#dcd6cc', grout: '#c0b7a9', rough: 0.16 }));
  for (const x of [-9, 9]) for (const z of [-8, 0, 8]) {
    const c = boxM(0.8, 6, 0.8, wallMat('#ebe5db'));
    c.position.set(x, 3, z - 2);
    g.add(c);
  }
  const back = boxM(40, 6, 0.3, wallMat('#e3dbcf'));
  back.position.set(0, 3, -11);
  g.add(back);
  const shopGlow = glowPanel('#ffe9cc', 0.6, 0.85);
  glows.push(shopGlow);
  for (let x = -15; x <= 15; x += 7.5) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.2), shopGlow);
    p.position.set(x, 1.9, -10.84);
    g.add(p);
  }
  const ceiling = ceilingWithPanels(40, 24, 6, 0, 0, glows, { every: 4, panel: [2.4, 0.3] });
  g.add(ceiling);
  g.add(bench(-5.5, 5.2), bench(6.5, 5.5), planter(-9, 3), planter(9, 3.4));
  return { group: g, glows, ceiling };
}
