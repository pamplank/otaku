// Crystal Pavilion hall section: zones from the plan view + a simple glass/arched-roof shell.
import * as THREE from 'three';
import { stage as S, site as X, palette as P } from '../../stage.config.js';
import { L } from '../layout.js';
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

  // Section floor
  const xl = L.cutX(-1, H.backZ), xr = L.cutX(1, H.backZ);
  const front = L.arc(cx + H.frontHalfWidth, cx - H.frontHalfWidth, L.hallFrontZ, 48);
  const sectionPoly = [[xl, H.backZ], [xr, H.backZ], ...front];
  g.add(floorZone(sectionPoly, FLOOR.hall, Y.hall));
  g.add(floorLine(sectionPoly, Y.line, OUTLINE_THIN));

  // Booth areas beyond each side of the section
  const bw = H.boothAreaWidth;
  const booths = [];
  for (const side of [-1, 1]) {
    const xo = cx + side * (H.frontHalfWidth + bw);
    const corner = cx + side * H.frontHalfWidth;
    const poly = [
      [L.cutX(side, H.backZ), H.backZ],
      [L.cutX(side, H.backZ) + side * bw, H.backZ],
      ...L.arc(xo, corner, L.hallFrontZ, 12),
    ];
    g.add(floorZone(poly, FLOOR.booths, Y.hall));
    booths.push(poly);
    // Simple booth blocks
    const colors = [P.pink, P.cyan, P.yellow];
    for (let r = 0; r < 4; r++) {
      const z = H.backZ + 4 + r * 5.5;
      const x = L.cutX(side, z) + side * (bw * 0.55);
      const b = box(3, 2.5, 3, toon('#f4f1ec'));
      b.position.set(x, 1.25, z);
      const fascia = box(3.02, 0.4, 3.02, toon(colors[(r + (side > 0 ? 1 : 0)) % 3]), { edges: false });
      fascia.position.y = 1.05;
      b.add(fascia);
      g.add(b);
    }
    const lab = floorDecal([{ text: side < 0 ? 'LEFT AREA · BOOTHS' : 'RIGHT AREA · BOOTHS', size: 0.5 }], 12, 1.4,
      { rotate: side * Math.PI / 2 });
    lab.position.set(L.cutX(side, 14) + side * bw * 0.2, Y.decal, 13);
    g.add(lab);
  }

  // 250 kg/m² flooring strips down each side
  const sw = X.flooringStrips.width;
  const zEnd = H.frontCornerZ - X.aisle.width;
  for (const side of [-1, 1]) {
    const poly = [
      [L.cutX(side, H.backZ), H.backZ],
      [L.cutX(side, H.backZ) - side * sw, H.backZ],
      [L.cutX(side, zEnd) - side * sw, L.aisleInnerZ(L.cutX(side, zEnd) - side * sw)],
      [L.cutX(side, zEnd), L.aisleInnerZ(L.cutX(side, zEnd))],
    ];
    g.add(floorZone(poly, FLOOR.strips, Y.zone));
    g.add(floorLine(poly, Y.line, OUTLINE_THIN));
    const zMid = (H.backZ + zEnd) / 2;
    const d = floorDecal([{ text: '250 KG/M² FLOORING', size: 0.55, color: '#c0314f' }], 16, 1.3,
      { rotate: side * Math.PI / 2 });
    d.position.set(L.cutX(side, zMid) - side * sw / 2, Y.decal, zMid);
    g.add(d);
  }

  // Visitor aisle (curved, kept clear) with direction arrows
  const aw = X.aisle.width;
  const aL = L.cutX(-1, zEnd), aR = L.cutX(1, zEnd);
  const aislePoly = [
    ...L.arc(aL, aR, L.aisleInnerZ, 48),
    ...L.arc(cx + H.frontHalfWidth, cx - H.frontHalfWidth, L.hallFrontZ, 48),
  ];
  g.add(floorZone(aislePoly, FLOOR.aisle, Y.zone));
  g.add(floorLine(aislePoly, Y.line, OUTLINE_THIN));
  const aisleDecal = floorDecal([{ text: 'VISITOR AISLE · KEEP CLEAR', size: 0.6 }], 16, 1.6);
  aisleDecal.position.set(cx, Y.decal, L.hallFrontZ(cx) - aw / 2);
  g.add(aisleDecal);
  const lane = (x, frac) => L.hallFrontZ(x) - aw * frac;
  const arrowsAt = [[-24, 0.7, -1], [-13, 0.7, -1], [13, 0.3, 1], [24, 0.3, 1]];
  for (const [ox, frac, dir] of arrowsAt) {
    const x = cx + ox;
    const z = lane(x, frac);
    const dz = lane(x + dir * 0.5, frac) - z;
    g.add(floorArrow(x, z, dir * 0.5, dz, 5.5, 0.9, P.dark, Y.arrow));
  }

  // Viewing pocket
  g.add(floorZone(L.pocketPoly, FLOOR.pocket, Y.zone));
  g.add(floorLine(L.pocketPoly, Y.line, OUTLINE));
  const pz = (X.pocket.backZ + X.pocket.frontCornerZ) / 2 + 1;
  const pDecal = floorDecal([
    { text: 'VIEWING POCKET', size: 0.42 },
    { text: `≈ ${Math.round(L.pocketArea)} M² AS DRAWN · STANDING`, size: 0.2, font: FONT },
  ], 18, 2.8);
  pDecal.position.set(cx - 3, Y.decal, pz);
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
  const bx0 = BS.centreX - BS.width / 2, bx1 = BS.centreX + BS.width / 2;
  const bz0 = H.backZ, bz1 = H.backZ + BS.depth;
  const bsPoly = [[bx0, bz0], [bx1, bz0], [bx1, bz1], [bx0, bz1]];
  g.add(floorZone(bsPoly, FLOOR.backstage, Y.zone));
  g.add(floorLine(bsPoly, Y.line, OUTLINE));
  const drapeMat = toon('#6d6872');
  const drapeH = 2.4;
  const dFront = box(BS.width, drapeH, 0.05, drapeMat, { line: OUTLINE_THIN });
  dFront.position.set(BS.centreX, drapeH / 2, bz1);
  g.add(dFront);
  const dLeft = box(0.05, drapeH, BS.depth, drapeMat, { line: OUTLINE_THIN });
  dLeft.position.set(bx0, drapeH / 2, (bz0 + bz1) / 2);
  g.add(dLeft);
  const bsDecal = floorDecal([
    { text: 'BACKSTAGE', size: 0.3 }, { text: 'HOLDING 6 × 4 M', size: 0.22 },
  ], 5.4, 2.2);
  bsDecal.position.set(BS.centreX, Y.decal, (bz0 + bz1) / 2);
  g.add(bsDecal);
  // Route arrow: backstage → crossover
  const crossZ = -S.deck.depth - S.crossover.depth / 2;
  g.add(floorArrow((bx1 + (-S.crossover.width / 2)) / 2 - 0.2, crossZ, 1, 0,
    Math.max(1.5, -S.crossover.width / 2 - bx1 - 0.6), 0.7, P.dark, Y.arrow));

  // FOH position
  const FOH = X.foh;
  const riser = box(FOH.width, FOH.riser, FOH.depth, toon('#2f2d31'));
  riser.position.set(FOH.x, FOH.riser / 2, FOH.z);
  g.add(riser);
  const desk = box(FOH.width * 0.6, 0.85, 0.8, toon('#4a474b'));
  desk.position.set(FOH.x, FOH.riser + 0.425, FOH.z - FOH.depth / 2 + 0.6);
  g.add(desk);
  const fohDecal = floorDecal([{ text: 'FOH', size: 0.7, color: P.white }], 2, 0.8);
  fohDecal.position.set(FOH.x, FOH.riser + 0.012, FOH.z + FOH.depth / 2 - 0.6);
  g.add(fohDecal);

  // AC towers (positions indicative)
  const AC = X.acTower;
  for (const t of X.acTowers) {
    const tw = box(AC.width, AC.height, AC.depth, toon('#f2f0ec'));
    tw.position.set(t.x, AC.height / 2, t.z);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(AC.width * 0.35, AC.width * 0.35, 0.05, 24), toon('#e53935'));
    cap.position.y = AC.height / 2 + 0.025;
    tw.add(cap);
    g.add(tw);
  }

  // The Fountain (outside the venue), for orientation
  const fz = L.hallFrontZ(cx) + 16;
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
  fDecal.position.set(cx, Y.decal, L.hallFrontZ(cx) + 2.2);
  g.add(fDecal);

  // Scale bar 0–10 m (matches the plan's bar), outside the front-right of the hall
  const sbX = cx + H.frontHalfWidth - 14, sbZ = L.hallFrontZ(cx + H.frontHalfWidth - 9) + 4.5;
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
  const cx = L.cx;
  const eave = H.eaveHeight;
  const xMin = cx - H.frontHalfWidth - H.boothAreaWidth;
  const xMax = cx + H.frontHalfWidth + H.boothAreaWidth;

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
    // mullions + top/bottom rails
    pts.forEach(([x, z], i) => {
      if (i % 3 === 0) group.add(polyline([new THREE.Vector3(x, 0, z), new THREE.Vector3(x, eave, z)], mullionMat));
    });
    group.add(polyline(pts.map(([x, z]) => new THREE.Vector3(x, eave, z)), mullionMat));
  };

  const frontPts = L.arc(xMin, xMax, L.hallFrontZ, 60);
  wall(frontPts, glass);
  wall(Array.from({ length: 31 }, (_, k) => [xMin + ((xMax - xMin) * k) / 30, H.backZ]), glassBack);
  // End walls
  wall([[xMin, H.backZ], [xMin, L.hallFrontZ(xMin)]], glass);
  wall([[xMax, H.backZ], [xMax, L.hallFrontZ(xMax)]], glass);

  // Arched roof: vault from the back wall to the curved front wall
  const roof = new THREE.Group();
  const nu = 40, nv = 18;
  const rp = (u, v) => {
    const x = xMin + (xMax - xMin) * u;
    const z = H.backZ + (L.hallFrontZ(x) - H.backZ) * v;
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
