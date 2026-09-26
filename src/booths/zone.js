// IP BOOTH ZONE: the zoning arc around the Fountain as flat coloured floor
// zones, the main stage in its zone, and the IP booth area — Plan A / B / C
// units in balanced rows with clear aisles, visitors walking the aisles.
// World coordinates are the main stage's (origin = deck front centre).
import * as THREE from 'three';
import { palette as P, site as X } from '../../stage.config.js';
import { fountain as FT, arc as ARC, mix as MIX, grid as GR, visitors as V, zoneSign as ZS } from '../../config/zone.config.js';
import { planA, planB, planC } from '../../config/booths.config.js';
import { L } from '../layout.js';
import { toon, box, floorLine, floorDecal, polyline, OUTLINE, OUTLINE_THIN } from '../sticker.js';
import { makeSlot, labelPlaceholder } from '../slots.js';
import { crowd, colorPicker, scatter, mulberry32 } from '../ballroom/figures.js';
import { buildPlanA } from './planA.js';
import { buildPlanB } from './planB.js';
import { buildPlanC } from './planC.js';
import { m, footprintTape, dimLine, shareSlots } from './common.js';

export const ZONE_ARTWORK = {
  zoneSign: { title: 'IP Booth Zone sign (OPF wayfinding)', accept: 'image/*', kind: 'Image' },
};

const PLANS = {
  A: { cfg: planA, build: buildPlanA },
  B: { cfg: planB, build: buildPlanB },
  C: { cfg: planC, build: buildPlanC },
};
const rad = (d) => (d * Math.PI) / 180;
const LIFT = 0.03;   // booths stand on the booth-area floor layer

export function fountainCentre() {
  return new THREE.Vector2(L.cx, L.hallFrontZ(L.cx) + FT.beyondHallFront);
}
// Point at sector angle θ (deg) and radius r from the Fountain → [x, z]
export function polar(theta, r, F = fountainCentre()) {
  return [F.x + r * Math.sin(rad(theta)), F.y - r * Math.cos(rad(theta))];
}

// A flat floor polygon at height y (layers are a few cm apart: this scene is seen from afar).
function floorPoly(pts, color, y) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, y, 0);
  const mesh = new THREE.Mesh(geo, toon(color));
  mesh.receiveShadow = true;
  return mesh;
}

// ─── Booth units → balanced rows ────────────────────────────────────────────
function units() {
  const list = [];
  for (const type of ['A', 'B', 'C']) for (let i = 0; i < (MIX[type] ?? 0); i++) list.push({ type, n: i + 1, ...PLANS[type].cfg.footprint });
  const rows = Array.from({ length: Math.max(1, GR.rows) }, () => ({ units: [], front: 0 }));
  for (const u of [...list].sort((a, b) => b.width * b.depth - a.width * a.depth)) {
    const row = rows.reduce((best, r) => (r.front < best.front ? r : best), rows[0]);
    row.units.push(u);
    row.front += u.width + GR.unitGap;
  }
  for (const r of rows) {
    r.units.sort((a, b) => a.type.localeCompare(b.type) || a.n - b.n);
    r.depth = Math.max(0, ...r.units.map((u) => u.depth));
    // cross aisle where the running frontage is closest to half
    let run = 0, best = 0, bestD = Infinity;
    r.units.forEach((u, i) => {
      run += u.width + GR.unitGap;
      const d = Math.abs(run - r.front / 2);
      if (i < r.units.length - 1 && d < bestD) { bestD = d; best = i; }
    });
    r.split = r.units.length > 1 ? best : -1;
    r.width = r.front - GR.unitGap + (r.split >= 0 ? GR.crossAisle : 0);
  }
  return { list, rows: rows.filter((r) => r.units.length) };
}

// Lay the rows out as back-to-back pairs (the first of each pair faces −z,
// the second +z = the Fountain), aisles around and between the pairs.
function layout(rows) {
  const a = GR.aisle;
  const pairs = [];
  for (let i = 0; i < rows.length; i += 2) pairs.push(rows.slice(i, i + 2));
  const depth = a + pairs.reduce((s, p) => s + p.reduce((t, r) => t + r.depth, 0) + a, 0);
  const width = Math.max(...rows.map((r) => r.width)) + 2 * a;
  const placed = [], aisles = [], crosses = [];
  let z = -depth / 2;
  aisles.push([-width / 2, z, width / 2, z + a]);
  z += a;
  for (const pair of pairs) {
    const faces = pair.length === 2 ? [-1, 1] : [1];
    const zBack = pair.length === 2 ? z + pair[0].depth : z;
    pair.forEach((row, k) => {
      const face = faces[k];
      const front = face < 0 ? z : zBack + row.depth;
      let x = -row.width / 2;
      row.units.forEach((u, i) => {
        const cx = x + u.width / 2;
        placed.push({ ...u, x: face < 0 ? cx : cx, z: front - face * (u.depth / 2), face, frontZ: front });
        x += u.width + GR.unitGap;
        if (i === row.split) {
          const z0 = face < 0 ? front : zBack, z1 = face < 0 ? zBack : front;
          crosses.push([x - GR.unitGap, z0, x - GR.unitGap + GR.crossAisle, z1]);
          x += GR.crossAisle - GR.unitGap;
        }
      });
    });
    z += pair.reduce((t, r) => t + r.depth, 0);
    aisles.push([-width / 2, z, width / 2, z + a]);
    z += a;
  }
  // side aisles along both ends of the rows
  aisles.push([-width / 2, -depth / 2, -width / 2 + a, depth / 2], [width / 2 - a, -depth / 2, width / 2, depth / 2]);
  return { width, depth, placed, aisles, crosses };
}

// The grid's size and aisles without building anything (for the camera presets)
export function gridLayout() {
  return layout(units().rows);
}

export function buildZone() {
  const g = new THREE.Group();
  const F = fountainCentre();
  const slotsReady = [];
  const labels = [];
  const dims = new THREE.Group();

  // Ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), toon('#d8d3cb'));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(F.x, -0.06, F.y - 20);
  ground.receiveShadow = true;
  g.add(ground);

  // ─── Zoning arc: flat coloured floor zones ───
  for (const zn of ARC.zones) {
    const n = Math.max(8, Math.round((zn.to - zn.from) / 2));
    const outer = [], inner = [];
    for (let i = 0; i <= n; i++) {
      const t = zn.from + ((zn.to - zn.from) * i) / n;
      outer.push(polar(t, ARC.outer, F));
      inner.unshift(polar(t, ARC.inner, F));
    }
    const pts = [...outer, ...inner];
    g.add(floorPoly(pts, zn.color, 0));
    g.add(floorLine(pts, 0.05, OUTLINE));
    const mid = (zn.from + zn.to) / 2;
    const span = rad(zn.to - zn.from) * (ARC.inner + 5);
    const [lx, lz] = polar(mid, ARC.inner + 3.2, F);
    const d = floorDecal([{ text: zn.name, size: 0.62 }], Math.min(24, span * 0.9), 3.4, { rotate: -rad(mid), pxPerM: 40 });
    d.position.set(lx, 0.05, lz);
    g.add(d);
  }

  // ─── The Fountain ───
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 64), toon('#9fd9e4'));
  pool.rotation.x = -Math.PI / 2;
  pool.scale.set(FT.rx, FT.rz, 1);
  pool.position.set(F.x, 0.02, F.y);
  pool.receiveShadow = true;
  g.add(pool);
  const ring = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    ring.push(new THREE.Vector3(F.x + Math.cos(a) * FT.rx, 0.05, F.y + Math.sin(a) * FT.rz));
  }
  g.add(polyline(ring, OUTLINE));
  const fd = floorDecal([{ text: 'THE FOUNTAIN', size: 0.5, color: '#2b7f8c' }], 16, 2.2, { pxPerM: 50 });
  fd.position.set(F.x, 0.05, F.y);
  g.add(fd);

  // ─── Stage zone: pocket + pit + barricade (the stage itself is the main build's) ───
  g.add(floorPoly(L.pocketPoly, '#93e0e6', 0.02));
  g.add(floorLine(L.pocketPoly, 0.05, OUTLINE));
  const PIT = X.pit, B = X.barricade;
  const pitPoly = [[-PIT.width / 2, 0], [PIT.width / 2, 0], [PIT.width / 2, PIT.depth], [-PIT.width / 2, PIT.depth]];
  g.add(floorPoly(pitPoly, '#ffffff', 0.035));
  g.add(floorLine(pitPoly, 0.05, OUTLINE_THIN));
  const bar = box(PIT.width, B.height, 0.08, toon('#4a474b'));
  bar.position.set(0, B.height / 2, PIT.depth + 0.04);
  const foot = box(PIT.width, 0.05, B.foot, toon('#4a474b'), { line: OUTLINE_THIN });
  foot.position.set(0, 0.025, PIT.depth + B.foot / 2);
  g.add(bar, foot);

  // ─── IP booth area ───
  shareSlots(true);
  const { list, rows } = units();
  const LY = layout(rows);
  const [gx, gz] = polar(GR.angle, GR.radius, F);
  const gridRot = -rad(GR.angle);
  const grid = new THREE.Group();
  grid.position.set(gx, 0, gz);
  grid.rotation.y = gridRot;
  g.add(grid);
  const people = new THREE.Group();
  const gridPeople = new THREE.Group();
  gridPeople.position.copy(grid.position);
  gridPeople.rotation.y = gridRot;
  people.add(gridPeople);
  const tags = new THREE.Group(), flows = [], clearances = [];
  gridPeople.add(tags);

  const area = [[-LY.width / 2, -LY.depth / 2], [LY.width / 2, -LY.depth / 2], [LY.width / 2, LY.depth / 2], [-LY.width / 2, LY.depth / 2]];
  grid.add(floorPoly(area, '#f4f2f5', 0.02));
  grid.add(floorLine(area, 0.05, OUTLINE));

  let seed = 900;
  for (const u of LY.placed) {
    const plan = PLANS[u.type];
    const booth = plan.build({ seed: seed++ });
    const rot = u.face < 0 ? Math.PI : 0;
    const wrap = new THREE.Group();
    wrap.position.set(u.x, LIFT, u.z);
    wrap.rotation.y = rot;
    wrap.add(booth.group, footprintTape(u.width, u.depth, P[plan.cfg.lead], { y: 0.012 }));
    grid.add(wrap);
    const pw = new THREE.Group();
    pw.position.copy(wrap.position);
    pw.rotation.y = rot;
    pw.add(booth.people);
    gridPeople.add(pw);
    const tw = pw.clone(false);
    tw.add(booth.tags);
    tags.add(tw);
    flows.push(booth.flow);
    if (booth.clearance) clearances.push(booth.clearance);
    // unit tag on the aisle floor in front of the booth
    const tag = floorDecal([{ text: `${u.type}${u.n}`, size: 0.62, color: P.dark }], 1.6, 0.8, { rotate: rot, pxPerM: 120 });
    tag.position.set(u.x - u.width / 2 + 0.7, 0.06, u.frontZ + u.face * 0.55);
    grid.add(tag);
  }

  // Zone sign (OPF wayfinding, texture slot) over the front aisle, and the mix note
  const sign = makeSlot('zoneSign', {
    w: ZS.width, h: ZS.height, bg: P.white, emissive: false,
    placeholder: labelPlaceholder('IP BOOTH ZONE', `${ZS.width} × ${ZS.height} M`, 'OPF wayfinding sign · placeholder', { bg: P.dark, offset: P.yellow }),
  });
  const signZ = LY.depth / 2 - GR.aisle / 2;
  sign.group.position.set(0, ZS.bottom + ZS.height / 2, signZ + 0.03);
  const signBack = box(ZS.width + 0.12, ZS.height + 0.12, 0.05, toon(P.dark), { edges: false });
  signBack.position.set(0, ZS.bottom + ZS.height / 2, signZ);
  grid.add(sign.group, signBack);
  for (const sx of [-1, 1]) {
    const post = box(0.1, ZS.bottom + ZS.height, 0.1, toon('#3a373a'));
    post.position.set(sx * (ZS.width / 2 + 0.1), (ZS.bottom + ZS.height) / 2, signZ);
    grid.add(post);
  }
  slotsReady.push(sign.ready);
  const counts = `${MIX.A} × A · ${MIX.B} × B · ${MIX.C} × C`;
  const mixNote = floorDecal([{ text: `IP BOOTHS · ${list.length} UNITS · ${counts} · ${MIX.label}`, size: 0.5, color: P.dark }],
    Math.min(LY.width - 2, 30), 1.6, { pxPerM: 60 });
  mixNote.position.set(0, 0.06, LY.depth / 2 - GR.aisle * 0.5 + 1.1);
  grid.add(mixNote);

  // ─── Visitors walking the aisles (+ a few in the other zones) ───
  const rand = mulberry32(V.seed);
  const pick = colorPicker(rand);
  const rects = [...LY.aisles, ...LY.crosses];
  const areaSum = rects.reduce((s, [x0, z0, x1, z1]) => s + (x1 - x0) * (z1 - z0), 0);
  const walkers = [];
  for (const [x0, z0, x1, z1] of rects) {
    const count = Math.round((V.aisles * (x1 - x0) * (z1 - z0)) / areaSum);
    const along = x1 - x0 > z1 - z0 ? Math.PI / 2 : 0;
    const pts = scatter(rand, { x0: x0 + 0.4, x1: x1 - 0.4, z0: z0 + 0.4, z1: z1 - 0.4, count, gap: 1.1,
      avoid: (x, z) => Math.abs(x) < ZS.width / 2 + 0.4 && Math.abs(z - signZ) < 0.5 });
    for (const p of pts) walkers.push({ ...p, rot: along + (rand() > 0.5 ? Math.PI : 0) + (rand() - 0.5) * 0.5, color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 });
  }
  gridPeople.add(crowd(walkers));
  const others = [];
  const zonesElsewhere = ARC.zones.filter((z) => z.id !== 'stage' && z.id !== 'ip');
  for (let i = 0, tries = 0; others.length < V.otherZones && tries < 4000; tries++) {
    const zn = zonesElsewhere[Math.floor(rand() * zonesElsewhere.length)];
    const t = zn.from + 2 + rand() * (zn.to - zn.from - 4), r = ARC.inner + 3 + rand() * (ARC.outer - ARC.inner - 6);
    const [x, z] = polar(t, r, F);
    if (others.some((o) => (o.x - x) ** 2 + (o.z - z) ** 2 < 1.4)) continue;
    others.push({ x, z, rot: rand() * Math.PI * 2, color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 });
    i++;
  }
  people.add(crowd(others));

  // ─── Dimensions (shown with Labels) ───
  const dimGroup = new THREE.Group();
  dimGroup.position.copy(grid.position);
  dimGroup.rotation.y = gridRot;
  dimGroup.add(dimLine([-LY.width / 2, 0.05, LY.depth / 2 + 2], [LY.width / 2, 0.05, LY.depth / 2 + 2], `${m(LY.width)} WIDE`, { tick: [0, 0, 1], tickLen: 0.8, textHeight: 0.9, textOffset: [0, 0.7, 0] }));
  dimGroup.add(dimLine([LY.width / 2 + 2, 0.05, -LY.depth / 2], [LY.width / 2 + 2, 0.05, LY.depth / 2], `${m(LY.depth)} DEEP`, { tick: [1, 0, 0], tickLen: 0.8, textHeight: 0.9, textOffset: [0, 0.7, 0] }));
  const aisleZ = LY.aisles[1][1];
  dimGroup.add(dimLine([0, 0.05, aisleZ], [0, 0.05, aisleZ + GR.aisle], `AISLE ${m(GR.aisle)}`, { tick: [1, 0, 0], tickLen: 0.6, textHeight: 0.5, textOffset: [0, 0.45, 0] }));
  // at this scale the dimension cards sit in the scene (hidden behind booths), not on top
  dimGroup.traverse((o) => { if (o.isSprite) { o.material.depthTest = true; o.renderOrder = 0; } });
  dims.add(dimGroup);

  // ─── Labels ───
  const toWorld = (x, y, z) => {
    const v = new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), gridRot);
    return [v.x + gx, y, v.z + gz];
  };
  const first = (t) => LY.placed.find((u) => u.type === t);
  labels.push(
    { id: 'ipZone', pos: toWorld(-LY.width / 2 + 2, 3.5, LY.depth / 2 - 1), title: 'IP booth zone',
      lines: [`${list.length} units · ${counts}`, `Placeholder mix · ${MIX.label}`, `Area ≈ ${m(LY.width)} × ${m(LY.depth)} (EST)`,
        `Aisles ${m(GR.aisle)} · cross aisles ${m(GR.crossAisle)} (EST)`, 'Every queue stays inside its booth'] },
    { id: 'fountain', pos: [F.x, 1.5, F.y], title: 'The Fountain',
      lines: ['Zoning arc centred on the Fountain', `Arc ${ARC.inner}–${ARC.outer} m out (EST)`, 'Outside the venue'] },
    { id: 'mainStage', pos: [0, 9, -2], title: 'Main stage',
      lines: ['In the Stage zone', 'Same model as /main', 'Viewing pocket + pit shown'] },
  );
  for (const t of ['A', 'B', 'C']) {
    const u = first(t);
    if (!u) continue;
    const cfg = PLANS[t].cfg;
    labels.push({ id: `plan${t}`, pos: toWorld(u.x, 3.4, u.z), title: `Plan ${t}`,
      lines: [`${m(cfg.footprint.width)} × ${m(cfg.footprint.depth)} unit${t === 'C' ? ' (area EST)' : ''}`, `${MIX[t]} in the mix (TBC)`, `See /booths/${t.toLowerCase()}`] });
  }
  for (const zn of ARC.zones.filter((z) => !['stage', 'ip'].includes(z.id))) {
    const [x, z] = polar((zn.from + zn.to) / 2, (ARC.inner + ARC.outer) / 2, F);
    labels.push({ id: zn.id, pos: [x, 1.2, z], title: zn.name.charAt(0) + zn.name.slice(1).toLowerCase(),
      lines: ['Flat floor zone (layout TBC)', `${zn.to - zn.from}° of the arc (EST)`] });
  }

  // Night: a wash over the booth area (no stage lighting there)
  const wash = new THREE.PointLight('#fff4e8', 0, 70, 1);
  wash.position.set(gx, 16, gz);
  g.add(wash);

  return {
    group: g, people, tags, setFlow: (on) => flows.forEach((f) => { f.visible = on; }),
    setClearance: (on) => clearances.forEach((c) => { c.visible = on; }), dims, labels, slotsReady, wash,
    grid: { x: gx, z: gz, rot: gridRot, width: LY.width, depth: LY.depth, aisles: LY.aisles, toWorld },
    F,
  };
}
