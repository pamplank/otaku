// IP BOOTH ZONE: the Crystal Pavilion as in the RFP venue layout — a curved
// glass arcade around the Fountain split into Artist Alley · Food · Sponsors ·
// Stage · MD + IP zone, with the Entrance at the IP end. The Stage segment is
// the main stage model; the IP zone holds Plan A / B / C units in two rows
// along the curve with a central aisle, visitors walking the aisles.
// World coordinates are the main stage's (origin = deck front centre, +z = Fountain).
import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { palette as P, site as X } from '../../stage.config.js';
import { pavilion as PV, zones as ZN, fountain as FT, mix as MIX, ip as IP, visitors as V, zoneSign as ZS } from '../../config/zone.config.js';
import { planA, planB, planC } from '../../config/booths.config.js';
import { L } from '../layout.js';
import { toon, box, floorDecal, floorArrow, polyline, lineMat, OUTLINE, OUTLINE_THIN } from '../sticker.js';
import { makeSlot, labelPlaceholder } from '../slots.js';
import { crowd, colorPicker, mulberry32 } from '../ballroom/figures.js';
import { buildPlanA } from './planA.js';
import { buildPlanB } from './planB.js';
import { buildPlanC } from './planC.js';
import { m, footprintTape, dimLine, shareSlots } from './common.js';

export const ZONE_ARTWORK = {
  zoneSign: { title: 'IP zone sign (OPF wayfinding)', accept: 'image/*', kind: 'Image' },
};

const PLANS = {
  A: { cfg: planA, build: buildPlanA },
  B: { cfg: planB, build: buildPlanB },
  C: { cfg: planC, build: buildPlanC },
};
const rad = (d) => (d * Math.PI) / 180;
const zone = (id) => ZN.find((z) => z.id === id);

// ─── Geometry (pure: also used by the camera presets) ───────────────────────
// Centreline at t = 0 sits mid-way across the arcade in front of the stage, so
// the arcade's fountain-side edge meets the main stage model's hall front.
const HW = PV.width / 2;
const cx = L.cx;
const midZ = L.hallFrontZ(L.cx) - HW;
const zc = midZ + PV.semiZ;
const stageOuter = -(midZ - X.hall.backZ) - 0.8;   // the Stage segment reaches back to the main stage's back edge

// Point on the arc at angle t (deg), d metres inwards (towards the Fountain) from the centreline.
export function at(t, d = 0) {
  const r = rad(t);
  let tx = PV.semiX * Math.cos(r), tz = PV.semiZ * Math.sin(r);
  const l = Math.hypot(tx, tz);
  tx /= l; tz /= l;
  const nx = -tz, nz = tx;               // inward normal
  return { x: cx + PV.semiX * Math.sin(r) + d * nx, z: zc - PV.semiZ * Math.cos(r) + d * nz, tx, tz, nx, nz };
}
const outerAt = (t) => (t >= zone('stage').from && t <= zone('stage').to ? stageOuter : -HW);
export const lakeCentre = () => ({ x: cx, z: zc + FT.offset });

// Arc-length table along the line d between t0 and t1
function track(d, t0, t1, step = 0.1) {
  const pts = [];
  let s = 0, prev = null;
  for (let t = t0; t <= t1 + 1e-9; t += step) {
    const p = at(t, d);
    if (prev) s += Math.hypot(p.x - prev.x, p.z - prev.z);
    pts.push({ t, s });
    prev = p;
  }
  const length = s;
  const tAt = (sq) => {
    let i = pts.findIndex((p) => p.s >= sq);
    if (i <= 0) return i === 0 ? t0 : t1;
    const a = pts[i - 1], b = pts[i];
    return a.t + ((b.t - a.t) * (sq - a.s)) / (b.s - a.s || 1);
  };
  return { length, tAt };
}

// Area of the arcade as drawn (m²) and the centreline length
export function pavilionStats() {
  let area = 0, len = 0;
  for (let t = PV.from; t < PV.to; t += 0.1) {
    const a = at(t), b = at(t + 0.1);
    const ds = Math.hypot(b.x - a.x, b.z - a.z);
    len += ds;
    area += ds * (HW - outerAt(t + 0.05));
  }
  return { area, length: len };
}

// Units → two rows (outer: backs to the facade, facing in; inner: facing out),
// each ordered A B C B C … and grouped with cross aisles, packed towards the Entrance.
export function boothLayout() {
  const list = [];
  for (const type of ['A', 'B', 'C']) for (let i = 0; i < (MIX[type] ?? 0); i++) list.push({ type, n: i + 1, ...PLANS[type].cfg.footprint });
  const rows = [
    { key: 'outer', face: 1, front: -HW + IP.outerRowFront, gap: IP.gap.outer, units: [], frontage: 0 },
    { key: 'inner', face: -1, front: -HW + IP.outerRowFront + IP.aisle, gap: IP.gap.inner, units: [], frontage: 0 },
  ];
  for (const u of [...list].sort((a, b) => b.width * b.depth - a.width * a.depth)) {
    const row = rows[0].frontage <= rows[1].frontage ? rows[0] : rows[1];
    row.units.push(u);
    row.frontage += u.width;
  }
  const pattern = ['A', 'B', 'C', 'B', 'C'];
  for (const row of rows) {
    const q = { A: [], B: [], C: [] };
    for (const u of row.units.sort((a, b) => a.n - b.n)) q[u.type].push(u);
    const out = [];
    for (let i = 0; out.length < row.units.length; i++) {
      const t = pattern[i % pattern.length];
      if (q[t].length) out.push(q[t].shift());
    }
    row.units = out;
  }
  const t0 = zone('ip').from, t1 = zone('ip').to;
  const placed = [];
  for (const row of rows) {
    const tr = track(row.front, t0, t1);
    let s = tr.length - IP.margin.end;         // pack from the Entrance end backwards
    const minS = IP.margin.start;
    row.units.forEach((u, i) => {
      if (i > 0 && i % IP.groupSize === 0) s -= 4;   // cross aisle between groups (EST 4 m)
      const sMid = s - u.width / 2;
      s -= u.width + row.gap;
      const t = tr.tAt(sMid);
      const f = at(t, row.front);
      const fx = f.nx * row.face, fz = f.nz * row.face;   // front direction (towards the aisle)
      placed.push({ ...u, t, row: row.key, face: row.face, fx, fz,
        x: f.x - fx * (u.depth / 2), z: f.z - fz * (u.depth / 2), frontX: f.x, frontZ: f.z, rot: Math.atan2(fx, fz), fits: sMid - u.width / 2 >= minS });
    });
    row.firstS = s;
    row.firstT = tr.tAt(Math.max(0, s));
  }
  return { list, rows, placed, aisle: { from: rows[0].front, to: rows[1].front } };
}

// ─── Floor helpers ──────────────────────────────────────────────────────────
function floorPoly(pts, color, y) {
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, y, 0);
  const mesh = new THREE.Mesh(geo, toon(color));
  mesh.receiveShadow = true;
  return mesh;
}
const line = (pts, y, mat = OUTLINE, closed = false) => polyline(pts.map(([x, z]) => new THREE.Vector3(x, y, z)), mat, closed);
function segmentPoly(t0, t1, dOuter = null, dInner = HW) {
  const outer = [], inner = [];
  for (let t = t0; t <= t1 + 1e-6; t += 0.5) {
    const tt = Math.min(t, t1);
    const o = at(tt, dOuter ?? outerAt(Math.min(Math.max(tt, t0 + 0.01), t1 - 0.01)));
    const i = at(tt, dInner);
    outer.push([o.x, o.z]);
    inner.unshift([i.x, i.z]);
  }
  return [...outer, ...inner];
}
// Text lying on the floor, reading from the Fountain side, turned to follow the arc
function arcText(text, t, d, wM, hM, size = 0.62, color = P.dark) {
  const p = at(t, d);
  const dec = floorDecal([{ text, size, color }], wM, hM, { rotate: Math.atan2(p.nx, p.nz), pxPerM: 40 });
  dec.position.set(p.x, 0.06, p.z);
  return dec;
}

export function buildZone() {
  const g = new THREE.Group();
  const slotsReady = [];
  const dims = new THREE.Group();
  const stats = pavilionStats();

  // Ground (promenade) and the Fountain lake
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), toon('#d8d3cb'));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(cx, -0.06, zc);
  ground.receiveShadow = true;
  g.add(ground);
  const LC = lakeCentre();
  const lake = new THREE.Mesh(new THREE.CircleGeometry(1, 96), toon('#9fd9e4'));
  lake.rotation.x = -Math.PI / 2;
  lake.scale.set(FT.rx, FT.rz, 1);
  lake.position.set(LC.x, 0.02, LC.z);
  lake.receiveShadow = true;
  g.add(lake);
  const ring = [];
  for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2; ring.push([LC.x + Math.cos(a) * FT.rx, LC.z + Math.sin(a) * FT.rz]); }
  g.add(line(ring, 0.05));
  const fd = floorDecal([{ text: 'THE FOUNTAIN', size: 0.5, color: '#2b7f8c' }], 60, 9, { pxPerM: 14 });
  fd.position.set(LC.x, 0.06, LC.z);
  g.add(fd);

  // ─── The arcade: coloured zone segments + outline ───
  for (const zn of ZN) {
    g.add(floorPoly(segmentPoly(zn.from, zn.to), zn.color, 0));
    const mid = (zn.from + zn.to) / 2;
    const len = track(0, zn.from, zn.to).length;
    if (zn.id === 'stage') g.add(arcText(zn.name, mid, HW - 1.6, 16, 2.2, 0.6));
    else if (zn.id !== 'ip') g.add(arcText(zn.name, mid, zn.id === 'md' ? -HW + 3 : 0, Math.min(26, len * 0.85), 3.2, 0.6));
  }
  g.add(arcText('IP ZONE', zone('ip').from + 3.5, -HW + 3, 16, 3, 0.6));
  const outline = [...segmentPoly(PV.from, PV.to)];
  g.add(line(outline, 0.05, OUTLINE, true));
  // zone boundaries across the arcade
  for (const zn of ZN.slice(1)) {
    const a = at(zn.from, zn.from > zone('stage').from - 0.01 && zn.from < zone('stage').to + 0.01 ? stageOuter : -HW), b = at(zn.from, HW);
    g.add(line([[a.x, a.z], [b.x, b.z]], 0.05, OUTLINE_THIN));
  }
  // MD: dashed outline (as the dotted box in the RFP)
  const dash = lineMat(P.dark, 2.6);
  dash.dashed = true; dash.dashSize = 1.4; dash.gapSize = 0.9;
  const mdPoly = segmentPoly(zone('md').from + 0.4, zone('md').to - 0.4, -HW + 1, HW - 1);
  g.add(line(mdPoly, 0.07, dash, true));

  // ─── Outer facade (cream wall, toggle) ───
  const wall = new THREE.Group();
  const wallMat = toon(PV.wall.color, { side: THREE.DoubleSide });
  const edge = [];
  for (let t = PV.from; t <= PV.to + 1e-6; t += 0.5) {
    const d = outerAt(t);
    const p = at(t, d);
    const prev = edge.at(-1);
    if (prev && Math.abs(prev.d - d) > 0.1) { const q = at(t, prev.d); edge.push({ x: q.x, z: q.z, d: prev.d }); }
    edge.push({ x: p.x, z: p.z, d });
  }
  const pos = [], idx = [];
  edge.forEach((p, i) => {
    pos.push(p.x, 0, p.z, p.x, PV.wall.height, p.z);
    if (i > 0) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  wg.setIndex(idx);
  wg.computeVertexNormals();
  const wallMesh = new THREE.Mesh(wg, wallMat);
  wallMesh.castShadow = wallMesh.receiveShadow = true;
  wall.add(wallMesh, line(edge.map((p) => [p.x, p.z]), PV.wall.height, OUTLINE));
  // end cap at Artist Alley
  const e0 = at(PV.from, -HW), e1 = at(PV.from, HW);
  const cap = box(Math.hypot(e1.x - e0.x, e1.z - e0.z), PV.wall.height, 0.3, wallMat);
  cap.position.set((e0.x + e1.x) / 2, PV.wall.height / 2, (e0.z + e1.z) / 2);
  cap.rotation.y = Math.atan2(-(e1.z - e0.z), e1.x - e0.x);
  wall.add(cap);
  // glass line on the fountain side: slim mullions every ~6 m
  const mull = [];
  for (let t = PV.from; t <= PV.to; t += 2.2) { const p = at(t, HW); mull.push(p.x, 0, p.z, p.x, 3, p.z); }
  const ml = new LineSegments2(new LineSegmentsGeometry().setPositions(mull), lineMat('#8fa9b2', 1.4, { opacity: 0.9 }));
  wall.add(ml, line(segmentPoly(PV.from, PV.to).slice(-Math.round((PV.to - PV.from) / 0.5) - 1), 3, lineMat('#8fa9b2', 1.4)));
  g.add(wall);

  // ─── Stage segment: pocket + pit + barricade (the stage itself is the main build's) ───
  g.add(floorPoly(L.pocketPoly, '#93e0e6', 0.02));
  g.add(line(L.pocketPoly, 0.06, OUTLINE, true));
  const PIT = X.pit, B = X.barricade;
  const pitPoly = [[-PIT.width / 2, 0], [PIT.width / 2, 0], [PIT.width / 2, PIT.depth], [-PIT.width / 2, PIT.depth]];
  g.add(floorPoly(pitPoly, '#ffffff', 0.035));
  g.add(line(pitPoly, 0.06, OUTLINE_THIN, true));
  const bar = box(PIT.width, B.height, 0.08, toon('#4a474b'));
  bar.position.set(0, B.height / 2, PIT.depth + 0.04);
  const foot = box(PIT.width, 0.05, B.foot, toon('#4a474b'), { line: OUTLINE_THIN });
  foot.position.set(0, 0.025, PIT.depth + B.foot / 2);
  g.add(bar, foot);

  // ─── IP zone booths ───
  shareSlots(true);
  const LY = boothLayout();
  const people = new THREE.Group();
  const tags = new THREE.Group(), flows = [], clearances = [];
  people.add(tags);
  let seed = 900;
  const LIFT = 0.03;
  for (const u of LY.placed) {
    const plan = PLANS[u.type];
    const booth = plan.build({ seed: seed++ });
    const wrap = new THREE.Group();
    wrap.position.set(u.x, LIFT, u.z);
    wrap.rotation.y = u.rot;
    wrap.add(booth.group, footprintTape(u.width, u.depth, P[plan.cfg.lead], { y: 0.012 }));
    g.add(wrap);
    const pw = new THREE.Group();
    pw.position.copy(wrap.position);
    pw.rotation.y = u.rot;
    pw.add(booth.people);
    people.add(pw);
    const tw = pw.clone(false);
    tw.add(booth.tags);
    tags.add(tw);
    flows.push(booth.flow);
    if (booth.clearance) clearances.push(booth.clearance);
    const tag = floorDecal([{ text: `${u.type}${u.n}`, size: 0.62, color: P.dark }], 1.6, 0.8, { rotate: u.rot, pxPerM: 120 });
    tag.position.set(u.frontX + u.fx * 0.6, 0.08, u.frontZ + u.fz * 0.6);
    g.add(tag);
  }
  // mix note in the aisle where the rows begin
  const aisleMid = (LY.aisle.from + LY.aisle.to) / 2;
  const tNote = Math.max(zone('ip').from + 2, Math.min(LY.rows[0].firstT, LY.rows[1].firstT) - 3.5);
  g.add(arcText(`IP BOOTHS · ${LY.list.length} UNITS · ${MIX.A} × A · ${MIX.B} × B · ${MIX.C} × C · ${MIX.label}`, tNote, aisleMid, 26, 1.8, 0.42));

  // Entrance: floor arrow into the arcade + label, and the zone sign over the aisle
  const tEnd = PV.to;
  const en = at(tEnd + 4.5, aisleMid);
  const arrowIn = floorArrow(en.x, en.z, -en.tx, -en.tz, 7, 2.2, P.dark, 0.06);
  g.add(arrowIn);
  const enText = at(tEnd + 10.5, aisleMid);
  const et = floorDecal([{ text: 'ENTRANCE', size: 0.6 }], 12, 2.4, { rotate: Math.atan2(-en.tx, -en.tz) + Math.PI, pxPerM: 40 });
  et.position.set(enText.x, 0.06, enText.z);
  g.add(et);
  const sp = at(tEnd - 1.5, aisleMid);
  const signRot = Math.atan2(sp.tx, sp.tz);          // faces people coming in from the Entrance
  const signG = new THREE.Group();
  signG.position.set(sp.x, 0, sp.z);
  signG.rotation.y = signRot;
  const sign = makeSlot('zoneSign', {
    w: ZS.width, h: ZS.height, bg: P.white, emissive: false,
    placeholder: labelPlaceholder('IP ZONE', `${ZS.width} × ${ZS.height} M`, 'OPF wayfinding sign · placeholder', { bg: P.dark, offset: P.yellow }),
  });
  sign.group.position.set(0, ZS.bottom + ZS.height / 2, 0.03);
  const signBack = box(ZS.width + 0.12, ZS.height + 0.12, 0.05, toon(P.dark), { edges: false });
  signBack.position.set(0, ZS.bottom + ZS.height / 2, 0);
  signG.add(sign.group, signBack);
  for (const sx of [-1, 1]) {
    const post = box(0.1, ZS.bottom + ZS.height, 0.1, toon('#3a373a'));
    post.position.set(sx * (ZS.width / 2 + 0.1), (ZS.bottom + ZS.height) / 2, 0);
    signG.add(post);
  }
  g.add(signG);
  slotsReady.push(sign.ready);

  // ─── Visitors: the IP aisles + walkway, and along the other zones ───
  const rand = mulberry32(V.seed);
  const pick = colorPicker(rand);
  const spots = [];
  const put = (t, d, headingAlong) => {
    const p = at(t, d);
    if (spots.some((o) => (o.x - p.x) ** 2 + (o.z - p.z) ** 2 < 1.2)) return false;
    const h = Math.atan2(p.tx, p.tz) + (rand() > 0.5 ? Math.PI : 0) + (rand() - 0.5) * 0.6;
    spots.push({ x: p.x, z: p.z, y: 0, rot: headingAlong ? h : rand() * Math.PI * 2, color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 });
    return true;
  };
  const ipZ = zone('ip'), md = zone('md');
  for (let n = 0, tries = 0; n < V.ip && tries < 6000; tries++) {
    const inWalk = rand() < 0.3;
    const d = inWalk ? HW - IP.walkway + 0.4 + rand() * (IP.walkway - 0.8) : LY.aisle.from + 0.4 + rand() * (IP.aisle - 0.8);
    if (put(md.from + 1 + rand() * (ipZ.to - md.from - 5), d, true)) n++;   // entrance end kept clear
  }
  for (let n = 0, tries = 0; n < V.otherZones && tries < 6000; tries++) {
    const zn = ZN.filter((z) => ['artist', 'food', 'sponsors'].includes(z.id))[Math.floor(rand() * 3)];
    if (put(zn.from + 1 + rand() * (zn.to - zn.from - 2), -HW + 1.5 + rand() * (PV.width - 3), false)) n++;
  }
  people.add(crowd(spots));

  // ─── Dimensions (shown with Labels) ───
  const tw = at(52, -HW), ti = at(52, HW);
  dims.add(dimLine([tw.x, 0.08, tw.z], [ti.x, 0.08, ti.z], `ARCADE ≈ ${m(PV.width)} (EST)`, { tick: [tw.tx, 0, tw.tz], tickLen: 1.2, textHeight: 1.1, textOffset: [0, 1.2, 0] }));
  const a0 = at(60, LY.aisle.from), a1 = at(60, LY.aisle.to);
  dims.add(dimLine([a0.x, 0.1, a0.z], [a1.x, 0.1, a1.z], `AISLE ${m(IP.aisle)}`, { tick: [a0.tx, 0, a0.tz], tickLen: 0.8, textHeight: 0.6, textOffset: [0, 0.8, 0] }));
  dims.traverse((o) => { if (o.isSprite) { o.material.depthTest = true; o.renderOrder = 0; } });

  // ─── Labels ───
  const lp = (t, d, y) => { const p = at(t, d); return [p.x, y, p.z]; };
  const first = (t) => LY.placed.find((u) => u.type === t);
  const counts = `${MIX.A} × A · ${MIX.B} × B · ${MIX.C} × C`;
  const labels = [
    { id: 'pavilion', pos: lp(-60, -HW, PV.wall.height + 1), title: 'Crystal Pavilion',
      lines: [`Curved arcade ≈ ${Math.round(stats.length)} m long × ${m(PV.width)} wide (EST)`, `≈ ${Math.round(stats.area / 100) * 100} m² as drawn (RFP: ≈ 5,700 m²)`, 'Zones as RFP pp. 34 / 36 · layout provisional'] },
    { id: 'ipZone', pos: lp(ipZ.from + (ipZ.to - ipZ.from) * 0.55, -HW, PV.wall.height + 1), title: 'IP zone',
      lines: [`${LY.list.length} units · ${counts}`, `Placeholder mix · ${MIX.label}`, `Two rows along the arc · aisle ${m(IP.aisle)} (EST)`, 'Every queue stays inside its booth'] },
    { id: 'md', pos: lp((md.from + md.to) / 2, 0, 2), title: 'MD · Merchandise',
      lines: ['At the start of the IP zone (RFP p. 36)', 'Placement under consideration · TBC'] },
    { id: 'entrance', pos: lp(tEnd + 2, aisleMid, 2.5), title: 'Entrance',
      lines: ['IP zone end of the arcade', 'Zone sign over the aisle (slot)'] },
    { id: 'mainStage', pos: [0, 9, -2], title: 'Main stage',
      lines: ['Stage segment · same model as /main', 'One stage, switched by timetable (RFP p. 37)'] },
    { id: 'fountain', pos: [LC.x, 1.5, LC.z], title: 'The Fountain',
      lines: ['Outside the venue', `Drawn ≈ ${FT.rx * 2} × ${FT.rz * 2} m (EST from the RFP plan)`] },
  ];
  for (const zn of ZN.filter((z) => ['artist', 'food', 'sponsors'].includes(z.id))) {
    labels.push({ id: zn.id, pos: lp((zn.from + zn.to) / 2, 0, 1.5), title: zn.name.charAt(0) + zn.name.slice(1).toLowerCase(),
      lines: [`≈ ${Math.round(track(0, zn.from, zn.to).length)} m of arcade (EST)`, 'Flat floor zone · layout TBC'] });
  }
  for (const t of ['A', 'B', 'C']) {
    const u = first(t);
    if (!u) continue;
    const cfg = PLANS[t].cfg;
    labels.push({ id: `plan${t}`, pos: [u.x, 3.6, u.z], title: `Plan ${t}`,
      lines: [`${m(cfg.footprint.width)} × ${m(cfg.footprint.depth)} unit${t === 'C' ? ' (area EST)' : ''}`, `${MIX[t]} in the mix (TBC)`, `See /booths/${t.toLowerCase()}`] });
  }

  // Night: soft washes over the IP zone (no stage lighting there)
  const washes = [0.35, 0.75].map((k) => {
    const p = at(ipZ.from + (ipZ.to - ipZ.from) * k, 0);
    const l = new THREE.PointLight('#fff4e8', 0, 50, 1);
    l.position.set(p.x, 14, p.z);
    g.add(l);
    return l;
  });

  return {
    group: g, people, tags, dims, labels, slotsReady, wall,
    setFlow: (on) => flows.forEach((f) => { f.visible = on; }),
    setClearance: (on) => clearances.forEach((c) => { c.visible = on; }),
    setNight: (on) => washes.forEach((l) => { l.intensity = on ? 22 : 0; }),
    layout: LY,
  };
}
