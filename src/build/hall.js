// Crystal Pavilion hall section: zones from the plan view + a simple glass/arched-roof shell.
import * as THREE from 'three';
import { stage as S, site as X, palette as P } from '../../stage.config.js';
import { L, V } from '../layout.js';
import {
  toon, box, floorZone, floorLine, floorDecal, floorArrow, polyline, lineMat,
  canvasTexture, OUTLINE, OUTLINE_THIN, FONT,
} from '../sticker.js';

const Y = { ground: -0.02, hall: 0, zone: 0.012, zone2: 0.02, line: 0.035, decal: 0.03, arrow: 0.04 };

export const FLOOR = {
  ground: '#d8d3cb', hall: '#dcf1f3', booths: '#e9e5df', strips: '#f6c4c9',
  pocket: '#93e0e6', aisle: '#fff59e', pit: '#ffffff', backstage: '#d3d0cc',
};

export function buildHall() {
  const g = new THREE.Group();
  g.name = 'hall';
  const H = X.hall;
  const cx = L.cx;

  // Ground outside the hall
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), toon(FLOOR.ground));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(cx, Y.ground, 10);
  ground.receiveShadow = true;
  g.add(ground);

  // Section floor: inner edge (Fountain side) and outer edge (behind the stage)
  // are concentric arcs around the Fountain; the side edges are radial.
  g.add(floorZone(V.sectionPoly, FLOOR.hall, Y.hall));
  g.add(floorLine(V.sectionPoly, Y.line, OUTLINE_THIN));
  const facing = (t) => -t;                                                   // rotation.y that turns +z towards the Fountain

  // Booth areas beyond each side of the section, on the same ring
  const booths = [];
  for (const side of [-1, 1]) {
    const [t0, t1] = side < 0 ? [-V.beta, -V.alpha] : [V.alpha, V.beta];
    const poly = V.band(V.Ri, V.Rb, t0, t1, 12);
    g.add(floorZone(poly, FLOOR.booths, Y.hall));
    booths.push(poly);
    // Simple booth blocks, facing the Fountain
    const colors = [P.pink, P.cyan, P.yellow];
    const tm = t0 + (t1 - t0) * (side < 0 ? 0.45 : 0.55);
    for (let r = 0; r < 4; r++) {
      const [x, z] = V.polar(tm, V.Rb - 4 - r * 5.5);
      const b = box(3, 2.5, 3, toon('#f4f1ec'));
      b.position.set(x, 1.25, z);
      b.rotation.y = facing(tm);
      const fascia = box(3.02, 0.4, 3.02, toon(colors[(r + (side > 0 ? 1 : 0)) % 3]), { edges: false });
      fascia.position.y = 1.05;
      b.add(fascia);
      g.add(b);
    }
    const tl = t0 + (t1 - t0) * (side < 0 ? 0.8 : 0.2);
    const [lx, lz] = V.polar(tl, V.Ri + 10);
    const lab = floorDecal([{ text: side < 0 ? 'LEFT AREA · BOOTHS' : 'RIGHT AREA · BOOTHS', size: 0.5 }], 12, 1.4,
      { rotate: side * Math.PI / 2 - tl });
    lab.position.set(lx, Y.decal, lz);
    g.add(lab);
  }

  // 250 kg/m² flooring strips down each side, bounded by radial lines
  const sw = X.flooringStrips.width;
  for (const side of [-1, 1]) {
    const [t0, t1] = side < 0 ? [-V.alpha, -V.alpha + V.strip] : [V.alpha - V.strip, V.alpha];
    const poly = V.band(V.Ra, V.Rb, t0, t1, 4);
    g.add(floorZone(poly, FLOOR.strips, Y.zone));
    g.add(floorLine(poly, Y.line, OUTLINE_THIN));
    const tm = (t0 + t1) / 2, rm = (V.Ra + V.Rb) / 2;
    const [dx, dz] = V.polar(tm, rm);
    const d = floorDecal([{ text: '250 KG/M² FLOORING', size: 0.55, color: '#c0314f' }], 16, 1.3,
      { rotate: side * Math.PI / 2 - tm });
    d.position.set(dx, Y.decal, dz);
    g.add(d);
  }

  // Visitor aisle along the inner concave arc, kept clear; arrows follow the arc
  const aw = X.aisle.width;
  const aislePoly = V.band(V.Ri, V.Ra, -V.alpha, V.alpha, 64);
  g.add(floorZone(aislePoly, FLOOR.aisle, Y.zone));
  g.add(floorLine(aislePoly, Y.line, OUTLINE_THIN));
  const [ax, az] = V.polar(0, V.Ri + aw / 2);
  const aisleDecal = floorDecal([{ text: 'VISITOR AISLE · KEEP CLEAR', size: 0.6 }], 16, 1.6);
  aisleDecal.position.set(ax, Y.decal, az);
  g.add(aisleDecal);
  // [fraction of the half-angle, lane (0 = Fountain edge … 1 = stage edge), direction]
  for (const [k, lane, dir] of [[-0.75, 0.3, -1], [-0.4, 0.3, -1], [0.4, 0.7, 1], [0.75, 0.7, 1]]) {
    const t = k * V.alpha;
    const [x, z] = V.polar(t, V.Ri + aw * lane);
    g.add(floorArrow(x, z, dir * Math.cos(t), dir * Math.sin(t), 5.5, 0.9, P.dark, Y.arrow));
  }

  // Viewing pocket
  // Viewing pocket: straight back behind the pit, radial sides, front on the concave arc
  g.add(floorZone(V.pocketPoly, FLOOR.pocket, Y.zone));
  g.add(floorLine(V.pocketPoly, Y.line, OUTLINE));
  const pDecal = floorDecal([
    { text: 'VIEWING POCKET', size: 0.42 },
    { text: `≈ ${Math.round(V.pocketArea)} M² AS DRAWN · STANDING`, size: 0.2, font: FONT },
  ], 14, 2.2);
  pDecal.position.set(cx - 3, Y.decal + 0.004, V.C.z - V.pocketFrontR - 1.25);
  g.add(pDecal);

  // Pit + barricade
  const PIT = X.pit;
  const pitPoly = [[-PIT.width / 2, 0], [PIT.width / 2, 0], [PIT.width / 2, PIT.depth], [-PIT.width / 2, PIT.depth]];
  g.add(floorZone(pitPoly, FLOOR.pit, Y.zone2));
  g.add(floorLine(pitPoly, Y.line, OUTLINE_THIN));
  const pitDecal = floorDecal([{ text: `PIT ${PIT.depth} M`, size: 0.5 }], 5, 1.1);
  pitDecal.position.set(-7.5, Y.decal + 0.01, PIT.depth / 2);
  g.add(pitDecal);
  const B = X.barricade;
  const bar = box(PIT.width, B.height, 0.08, toon('#4a474b'));
  bar.position.set(0, B.height / 2, PIT.depth + 0.04);
  g.add(bar);
  const foot = box(PIT.width, 0.05, B.foot, toon('#4a474b'), { line: OUTLINE_THIN });
  foot.position.set(0, 0.025, PIT.depth + B.foot / 2);
  g.add(foot);

  // Backstage holding (rear left) with pipe & drape
  const BS = X.backstage;
  // Radial: back edge on the outer arc, centreline pointing at the Fountain side
  const bt = Math.asin((BS.centreX - V.C.x) / (V.Rb - BS.depth / 2));
  const bsG = new THREE.Group();
  const [bcx, bcz] = V.polar(bt, V.Rb - BS.depth / 2);
  bsG.position.set(bcx, 0, bcz);
  bsG.rotation.y = facing(bt);
  const loc = [[-BS.width / 2, -BS.depth / 2], [BS.width / 2, -BS.depth / 2], [BS.width / 2, BS.depth / 2], [-BS.width / 2, BS.depth / 2]];
  const bsPoly = loc.map(([x, z]) => [bcx + x * Math.cos(bt) - z * Math.sin(bt), bcz + x * Math.sin(bt) + z * Math.cos(bt)]);
  g.add(floorZone(bsPoly, FLOOR.backstage, Y.zone));
  g.add(floorLine(bsPoly, Y.line, OUTLINE));
  const drapeMat = toon('#6d6872');
  const drapeH = 2.4;
  const dFront = box(BS.width, drapeH, 0.05, drapeMat, { line: OUTLINE_THIN });
  dFront.position.set(0, drapeH / 2, BS.depth / 2);
  const dLeft = box(0.05, drapeH, BS.depth, drapeMat, { line: OUTLINE_THIN });
  dLeft.position.set(-BS.width / 2, drapeH / 2, 0);
  const bsDecal = floorDecal([
    { text: 'BACKSTAGE', size: 0.3 }, { text: 'HOLDING 6 × 4 M', size: 0.22 },
  ], 5.4, 2.2);
  bsDecal.position.set(0, Y.decal, 0);
  bsG.add(dFront, dLeft, bsDecal);
  g.add(bsG);
  const bx1 = bsPoly[1][0] + (bsPoly[2][0] - bsPoly[1][0]) / 2;   // right edge, mid depth
  // Route arrow: backstage → crossover
  const crossZ = -S.deck.depth - S.crossover.depth / 2;
  g.add(floorArrow((bx1 + (-S.crossover.width / 2)) / 2 - 0.2, crossZ, 1, 0,
    Math.max(1.5, -S.crossover.width / 2 - bx1 - 0.6), 0.7, P.dark, Y.arrow));

  // FOH position
  // FOH position: front-right inside the pocket, square to the radial line
  const FOH = V.foh;
  const fohG = new THREE.Group();
  fohG.position.set(FOH.x, 0, FOH.z);
  fohG.rotation.y = FOH.rot;
  const riser = box(FOH.width, FOH.riser, FOH.depth, toon('#2f2d31'));
  riser.position.set(0, FOH.riser / 2, 0);
  const desk = box(FOH.width * 0.6, 0.85, 0.8, toon('#4a474b'));
  desk.position.set(0, FOH.riser + 0.425, -FOH.depth / 2 + 0.6);
  const fohDecal = floorDecal([{ text: 'FOH', size: 0.7, color: P.white }], 2, 0.8);
  fohDecal.position.set(0, FOH.riser + 0.012, FOH.depth / 2 - 0.6);
  fohG.add(riser, desk, fohDecal);
  g.add(fohG);

  // AC towers on the pocket's two front corners (positions indicative)
  const AC = X.acTower;
  for (const t of V.acTowers) {
    const tw = box(AC.width, AC.height, AC.depth, toon('#f2f0ec'));
    tw.position.set(t.x, AC.height / 2, t.z);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(AC.width * 0.35, AC.width * 0.35, 0.05, 24), toon('#e53935'));
    cap.position.y = AC.height / 2 + 0.025;
    tw.add(cap);
    g.add(tw);
  }

  // The Fountain (outside the venue), for orientation
  const fz = V.frontZ(cx) + 16;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 64), toon('#9fd9e4'));
  pool.rotation.x = -Math.PI / 2;
  pool.scale.set(14, 6, 1);
  pool.position.set(cx, Y.zone, fz);
  pool.receiveShadow = true;
  g.add(pool);
  const ring = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    ring.push(new THREE.Vector3(cx + Math.cos(a) * 14, Y.line, fz + Math.sin(a) * 6));
  }
  g.add(polyline(ring, OUTLINE_THIN));
  const fDecal = floorDecal([{ text: 'THE FOUNTAIN (OUTSIDE THE VENUE) ↓', size: 0.5 }], 18, 1.4);
  fDecal.position.set(cx, Y.decal, V.frontZ(cx) + 2.2);
  g.add(fDecal);

  // Scale bar 0–10 m (matches the plan's bar), outside the front-right of the hall
  const sbX = cx + H.frontHalfWidth - 14, sbZ = V.frontZ(cx + H.frontHalfWidth - 9) + 4.5;
  const segA = box(5, 0.04, 0.5, toon(P.dark), { line: OUTLINE_THIN });
  segA.position.set(sbX + 2.5, 0.02, sbZ);
  const segB = box(5, 0.04, 0.5, toon(P.white), { line: OUTLINE_THIN });
  segB.position.set(sbX + 7.5, 0.02, sbZ);
  g.add(segA, segB);
  for (const [t, dx] of [['0', 0], ['5', 5], ['10 M', 10]]) {
    const d = floorDecal([{ text: t, size: 0.7 }], 2.4, 0.9);
    d.position.set(sbX + dx, Y.decal, sbZ - 1);
    g.add(d);
  }

  const shell = buildShell(booths);
  g.add(shell.group);
  const ceiling = buildCeiling();
  g.add(ceiling);

  return { group: g, roof: shell.roof, glassMats: shell.glassMats, ceiling, shellLines: shell.lineMats };
}

// ─── Glass walls + arched roof (illustrative) ───────────────────────────────
function buildShell() {
  const group = new THREE.Group();
  const H = X.hall;
  const eave = H.eaveHeight;

  const glass = new THREE.MeshBasicMaterial({
    color: '#bfe8ef', transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false,
  });
  const glassBack = glass.clone();
  glassBack.opacity = 0.3;
  const mullionMat = lineMat('#8fa9b2', 1.4, { opacity: 0.9 });
  const ribMat = lineMat('#8fa9b2', 1.4, { opacity: 0.7 });

  // Strip wall along a list of [x, z] points
  const wall = (pts, mat) => {
    const pos = [];
    const idx = [];
    pts.forEach(([x, z], i) => {
      pos.push(x, 0, z, x, eave, z);
      if (i > 0) {
        const a = (i - 1) * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    const m = new THREE.Mesh(geo, mat);
    m.renderOrder = 5;
    group.add(m);
    // mullions + top rail
    pts.forEach(([x, z], i) => {
      if (i % 3 === 0) group.add(polyline([new THREE.Vector3(x, 0, z), new THREE.Vector3(x, eave, z)], mullionMat));
    });
    group.add(polyline(pts.map(([x, z]) => new THREE.Vector3(x, eave, z)), mullionMat));
  };

  // Concentric walls: glass front on the inner arc, back wall on the outer arc,
  // radial end walls
  const t0 = -V.beta, t1 = V.beta;
  wall(V.arcR(V.Ri, t0, t1, 60), glass);
  wall(V.arcR(V.Rb, t0, t1, 30), glassBack);
  for (const t of [t0, t1]) wall([V.polar(t, V.Rb), V.polar(t, V.Ri)], glass);

  // Arched roof: vault from the back wall to the front wall, around the same centre
  const roof = new THREE.Group();
  const nu = 40, nv = 18;
  const rp = (u, v) => {
    const [x, z] = V.polar(t0 + (t1 - t0) * u, V.Rb + (V.Ri - V.Rb) * v);
    return new THREE.Vector3(x, eave + H.roofRise * Math.sin(Math.PI * v), z);
  };
  const pos = [];
  const idx = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const p = rp(i / nu, j / nv);
    pos.push(p.x, p.y, p.z);
    if (i > 0 && j > 0) {
      const a = (i - 1) * (nv + 1) + (j - 1), b = i * (nv + 1) + (j - 1);
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const rgeo = new THREE.BufferGeometry();
  rgeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  rgeo.setIndex(idx);
  const roofMat = glass.clone();
  roofMat.opacity = 0.1;
  const roofMesh = new THREE.Mesh(rgeo, roofMat);
  roofMesh.renderOrder = 6;
  roof.add(roofMesh);
  for (let i = 0; i <= nu; i += 2) {
    const pts = [];
    for (let j = 0; j <= nv; j++) pts.push(rp(i / nu, j / nv));
    roof.add(polyline(pts, ribMat));
  }
  for (const v of [0.25, 0.5, 0.75]) {
    const pts = [];
    for (let i = 0; i <= nu; i++) pts.push(rp(i / nu, v));
    roof.add(polyline(pts, ribMat));
  }
  group.add(roof);

  return { group, roof, glassMats: [glass, glassBack, roofMat], lineMats: [mullionMat, ribMat] };
}


// ─── Low-ceiling zone: 7.6 m (25 ft) plane + clearance marker ───────────────
function buildCeiling() {
  const C = S.ceiling;
  const g = new THREE.Group();
  g.name = 'ceiling';
  const { x0, x1, z0, z1 } = C.zone;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0),
    new THREE.MeshBasicMaterial({ color: P.pink, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
  plane.rotation.x = -Math.PI / 2;
  plane.position.set((x0 + x1) / 2, C.height, (z0 + z1) / 2);
  plane.renderOrder = 4;
  g.add(plane);
  const pinkLine = lineMat(P.pink, 2.6);
  const y = C.height;
  g.add(polyline([
    new THREE.Vector3(x0, y, z0), new THREE.Vector3(x1, y, z0),
    new THREE.Vector3(x1, y, z1), new THREE.Vector3(x0, y, z1),
  ], pinkLine, true));

  // Vertical clearance marker between truss top and ceiling
  const mx = L.trussLegX + 0.9, mz = L.trussFrontZ;
  const t0 = S.truss.top;
  const tick = (yy) => [new THREE.Vector3(mx - 0.25, yy, mz), new THREE.Vector3(mx + 0.25, yy, mz)];
  g.add(polyline([new THREE.Vector3(mx, t0, mz), new THREE.Vector3(mx, y, mz)], pinkLine));
  g.add(polyline(tick(t0), pinkLine));
  g.add(polyline(tick(y), pinkLine));

  // Front-edge lettering, like the slide
  const tex = canvasTexture(2048, 160, (ctx, w, h) => {
    ctx.fillStyle = P.pink;
    ctx.font = `${h * 0.55}px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`CEILING 25 FT / ${C.height} M  ·  ~${L.ceilingClear.toFixed(1)} M CLEAR ABOVE TRUSS`, w - 10, h / 2, w - 20);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.47),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  sign.position.set(mx + 0.4 - 3, y - 0.32, z1);
  g.add(sign);
  return g;
}
