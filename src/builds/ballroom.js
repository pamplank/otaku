// BALLROOM OVERVIEW · Grand Ballroom (config: config/ballroom.config.js).
// The whole room: panel zone, mini stage, networking, pause pocket, foyer, arch,
// flow arrows, and area labels with m² and seat counts.
import * as THREE from 'three';
import { room as R, foyer as F, doors as D, placement as PL, divider as DV } from '../../config/ballroom.config.js';
import { stage as PS, seating as SEAT, cameraRiser as CR } from '../../config/panel.config.js';
import { stage as MS, seating as MSEAT, standing as MSTAND } from '../../config/mini.config.js';
import { arch as AR } from '../../config/arch.config.js';
import { palette as P } from '../../stage.config.js';
import { toon, box, starSticker, canvasTexture, FONT_DISPLAY } from '../sticker.js';
import { buildLabels } from '../labels.js';
import { buildRoom, zones } from '../ballroom/room.js';
import { theatreSeating, chairRows } from '../ballroom/seating.js';
import { crowd, figure, scatter, colorPicker, mulberry32 } from '../ballroom/figures.js';
import { miniStageMassing, archMassing } from '../ballroom/massing.js';
import { buildPanelZone, PANEL_ARTWORK } from '../ballroom/panelZone.js';

const m = (v) => `${+v.toFixed(2)} m`;
const m2 = (a) => `≈ ${Math.round(a).toLocaleString('en-US')} m²`;
const xL = -R.width / 2, xR = R.width / 2, zB = -R.depth / 2, zD = R.depth / 2;

function presets() {
  const { xSplit } = zones();
  return {
    wide: { label: 'Wide room', pos: [-40, 36, 46], target: [0, 0, 3], fov: 42 },
    plan: { label: 'Top-down plan', pos: [0, 520, 4 + 0.01], target: [0, 0, 4], fov: 7.2, plan: true },
    foyer: { label: 'Foyer approach', pos: [PL.arch.x + 1.2, 1.6, zD + F.depth - 0.4], target: [PL.arch.x, 2.3, zD - 8], fov: 62 },
    panel: { label: 'Panel zone', pos: [PL.panel.x + 4, 5.5, zD - 2], target: [PL.panel.x, 2.5, PL.panel.z - 3], fov: 52 },
    right: { label: 'Right third', pos: [xSplit + 1.5, 5, zD - 1.5], target: [(xSplit + xR) / 2 + 1, 1.5, zB + 5], fov: 55 },
  };
}

// Networking / community props: high tables, a bench cluster, a noticeboard
function networking(g, rects) {
  const [x0, z0, x1, z1] = rects.networking;
  const [px0, pz0] = rects.pause;
  const tables = [];
  const top = toon(P.white), pole = toon('#3a373a');
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const x = x0 + 3 + i * 4.4, z = z0 + 3.2 + j * 4.2;
      if (x > px0 - 1.2 && z > pz0 - 1.2) continue;          // keep clear of the pause pocket
      const t = new THREE.Group();
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.08, 10), pole);
      p.position.y = 0.54;
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 28), top);
      d.position.y = 1.1;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 20), pole);
      t.add(p, d, base);
      t.position.set(x, 0, z);
      t.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      g.add(t);
      tables.push([x, z]);
    }
  }
  // bench cluster (yellow = networking lead colour)
  for (const [dx, dz, r] of [[0, 0, 0], [1.6, 1.0, Math.PI / 2], [-1.6, 1.0, Math.PI / 2]]) {
    const b = box(2.4, 0.45, 0.5, toon(P.yellow));
    b.position.set(x1 - 4 + dx, 0.225, z1 - 11 + dz);
    b.rotation.y = r;
    g.add(b);
  }
  // noticeboard (texture slot in the mini-stage build)
  const nb = box(2.4, 1.6, 0.08, toon(P.white));
  nb.position.set(x1 - 0.3, 1.5, z0 + 5.5);
  nb.rotation.y = -Math.PI / 2;
  g.add(nb);
  return tables;
}

// Proposed pause pocket: soft seating, water point, REST sign
function pausePocket(g, rects) {
  const [x0, z0, x1, z1] = rects.pause;
  const soft = [P.cyan, P.pink, P.yellow, '#ffffff'];
  const seats = [];
  soft.forEach((c, i) => {
    const s = box(1.4, 0.42, 0.8, toon(c));
    const x = x0 + 1.4 + (i % 2) * 2.4, z = z0 + 2.6 + Math.floor(i / 2) * 1.8;
    s.position.set(x, 0.21, z);
    g.add(s);
    seats.push([x, z]);
  });
  const water = box(0.5, 1.1, 0.5, toon('#9fd6f0'));
  water.position.set(x1 - 0.6, 0.55, z0 + 0.6);
  g.add(water);
  const sign = canvasTexture(512, 256, (ctx, W, H) => {
    ctx.fillStyle = P.white; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = P.dark; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${H * 0.5}px ${FONT_DISPLAY}`; ctx.fontStretch = 'expanded';
    ctx.fillText('REST', W / 2, H * 0.52);
    ctx.lineWidth = 16; ctx.strokeStyle = P.dark; ctx.strokeRect(0, 0, W, H);
  });
  const post = box(0.06, 1.8, 0.06, toon('#3a373a'));
  post.position.set(x1 - 1.6, 0.9, z0 + 0.4);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), toon(P.white, { map: sign }));
  board.position.set(x1 - 1.6, 2.0, z0 + 0.44);
  g.add(post, board);
  return seats;
}

export default {
  id: 'ballroom',
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · Okada Manila',
    title: 'Ballroom Overview',
    sub: 'Grand Ballroom · 3D concept · all sizes TBC',
    ariaLabel: '3D overview of the Grand Ballroom: panel stage, mini stage, networking, pause pocket and foyer',
    caption: 'GRAND BALLROOM OVERVIEW',
    fileTag: 'BallroomOverview',
  },
  presets,
  toggles: [
    { key: 'ceiling', label: `LED ceiling ${R.ceiling} m`, on: true },
    { key: 'foyerCeiling', label: `Foyer ceiling ${F.ceiling} m`, on: true },
    { key: 'divider', label: 'Divider', on: !DV.open },
    { key: 'flows', label: 'Flow arrows', on: true },
  ],
  artwork: null, // artwork is set in each stage's own build, and shown here too:
  alsoShow: [{ id: 'panel', keys: Object.keys(PANEL_ARTWORK) }],
  create() {
    const room = buildRoom();
    const { rects, areas } = room;
    const g = new THREE.Group();
    const rand = mulberry32(1649);
    const pick = colorPicker(rand);

    // Panel zone: the full Panel Stage build (stage, 480 seats, riser, FOH, people)
    const panel = buildPanelZone({ origin: new THREE.Vector3(PL.panel.x, 0, PL.panel.z), seed: 1650 });
    const lastRow = panel.lastRow;

    // Mini stage zone
    const mini = new THREE.Group();
    mini.position.set(PL.mini.x, 0, PL.mini.z);
    mini.add(miniStageMassing());
    const chairs = chairRows(MSEAT);
    mini.add(chairs.group);
    g.add(mini);

    // Arch in the foyer
    const arch = archMassing();
    arch.position.set(PL.arch.x, 0, PL.arch.z);
    g.add(arch);

    const tables = networking(g, rects);
    const softSeats = pausePocket(g, rects);

    // Sparkles on the far wall, above each stage zone
    for (const [x, y, s, c] of [[PL.panel.x - 7.5, 7.6, 1.3, 'yellow'], [PL.panel.x + 7.8, 8.2, 0.7, 'cyan'], [PL.mini.x + 4.6, 5.8, 0.8, 'pink']]) {
      const st = starSticker(s, P[c]);
      st.position.set(x, y, zB + 0.12);
      g.add(st);
    }

    // ─── People ───
    const people = new THREE.Group();
    const seated = [];
    for (const s of chairs.seats) if (rand() < 0.65) seated.push({ x: PL.mini.x + s.x, z: PL.mini.z + s.z, rot: Math.PI, color: pick() });
    for (const [x, z] of softSeats.slice(0, 3)) seated.push({ x, y: -0.03, z, rot: Math.PI / 2 * (rand() > 0.5 ? 1 : -1), color: pick() });
    people.add(crowd(seated, { seatedPose: true }), panel.people);

    const standing = [];
    const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
    // mini-stage standing area behind the chairs
    const mBack = PL.mini.z + MSEAT.firstRow + MSEAT.rows * MSEAT.rowPitch + 0.8;
    for (const s of scatter(rand, { x0: PL.mini.x - 6, x1: PL.mini.x + 6, z0: mBack, z1: mBack + MSTAND.depth, count: 55, gap: 0.55 })) {
      standing.push({ ...s, rot: face(s.x, s.z, PL.mini.x, PL.mini.z - 2) + (rand() - 0.5) * 0.5, color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 });
    }
    // networking: small groups around the high tables
    for (const [tx, tz] of tables) {
      const n = 2 + Math.floor(rand() * 3);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + rand();
        const x = tx + Math.sin(a) * 0.75, z = tz + Math.cos(a) * 0.75;
        standing.push({ x, z, rot: face(x, z, tx, tz), color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 });
      }
    }
    // standing at the back of the panel zone
    // foyer
    const [fx0, fz0, fx1, fz1] = rects.foyer;
    for (const s of scatter(rand, { x0: fx0 + 2, x1: fx1 - 2, z0: fz0 + 1.2, z1: fz1 - 0.8, count: 22, gap: 1.4,
      avoid: (x, z) => Math.abs(x - PL.arch.x) < AR.width / 2 + 0.6 && Math.abs(z - PL.arch.z) < AR.depth / 2 + 0.8 })) {
      standing.push({ ...s, rot: face(s.x, s.z, s.x + (rand() - 0.5) * 6, zD) , color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 });
    }
    people.add(crowd(standing));
    // staff at the doors (yellow)
    for (const d of D.list) {
      for (const side of [-1, 1]) {
        const s = figure(P.yellow);
        s.position.set(d.x + side * (D.width / 2 + 0.5), 0, zD - 0.7);
        s.rotation.y = Math.PI;
        people.add(s);
      }
    }
    const seatedCount = seated.length + panel.counts.seated + panel.counts.panelists, standingCount = standing.length + D.list.length * 2;

    // ─── Labels ───
    const { xSplit } = zones();
    const lastRowWorld = PL.panel.z + lastRow;
    const labels = buildLabels([
      { id: 'room', pos: [xL + 1.5, R.ceiling, zB + 1.5], title: 'Grand Ballroom',
        lines: [`${R.width} × ${R.depth} m · ${m2(areas.room)} (venue: 1,649 m²)`, `Flat ceiling ${m(R.ceiling)} (31.6 ft)`, 'All truss ground-supported · no ceiling rigging'] },
      { id: 'ceiling', pos: [xL + 14, R.ceiling, 0], title: 'LED ceiling',
        lines: ['Pixel-mapped LED ceiling (venue)', `${m(R.ceiling)} above the floor`, 'Toggle: LED ceiling'] },
      { id: 'panel', pos: [PL.panel.x - PS.deck.width / 2, PS.truss.top + 0.4, PL.panel.z - PS.deck.depth], title: 'Panel stage zone',
        lines: [`Left ~2/3 · ${m2(areas.panel)}`, `Stage ${PS.deck.width} × ${PS.deck.depth} m · deck ${m(PS.deck.height)}`,
          `${panel.counts.seats} seats · ${SEAT.blocks} blocks × ${SEAT.rows} rows × ${SEAT.seatsPerRow}`, 'Full build: Panel Stage'] },
      { id: 'seats', pos: [PL.panel.x + 12, 1.6, (PL.panel.z + SEAT.firstRow + lastRowWorld) / 2], title: 'Theatre seating',
        lines: [`First row ${m(SEAT.firstRow)} from the stage`, `Centre aisle ${m(SEAT.centreAisle)} · side aisles ${m(SEAT.sideAisle)}`, `Front ${SEAT.vipRows} rows VIP (yellow covers)`] },
      { id: 'mini', pos: [PL.mini.x - MS.deck.width / 2, MS.truss.top + 0.4, PL.mini.z - MS.deck.depth], title: 'Mini stage zone',
        lines: [`Far end of the right third · ${m2(areas.mini)}`, `Deck ${MS.deck.width} × ${MS.deck.depth} m`, `${chairs.group.userData.count} seats + ~${MSTAND.capacity} standing`, 'Detailed build: step 3'] },
      { id: 'net', pos: [xSplit + 3, 1.8, (rects.networking[1] + rects.pause[1]) / 2], title: 'Networking / community',
        lines: [`Middle of the right third · ${m2(areas.networking)}`, 'High tables · bench cluster · noticeboard'] },
      { id: 'pause', pos: [rects.pause[0] + 0.6, 1.6, rects.pause[1] + 0.8], title: 'Proposed pause pocket',
        lines: [`By the doors · ${m2(areas.pause)}`, 'Soft seating · water point · REST sign'] },
      { id: 'foyer', pos: [xL + 6, F.ceiling, zD + F.depth / 2], title: 'Foyer',
        lines: [`${R.width} × ${F.depth} m (depth est.) · ${m2(areas.foyer)}`, `Foyer ceiling ${m(F.ceiling)}`, `${D.list.length} double doors in the long wall`] },
      { id: 'arch', pos: [PL.arch.x + AR.width / 2, AR.height + 0.3, PL.arch.z], title: 'Entrance arch',
        lines: [`${AR.width} × ${AR.height} × ${AR.depth} m`, `Clear opening ${AR.opening.width} × ${AR.opening.height} m`, 'Detailed build: step 4'] },
      { id: 'divider', pos: [xSplit, DV.height + 0.3, zB + 3], title: 'Optional divider',
        lines: [`Pipe & drape, ${m(DV.height)} high (est.)`, 'Default open · toggle: Divider'] },
      { id: 'flow', pos: [PL.arch.x - 2.2, 0.4, zD + F.depth - 1], title: 'Guest flow',
        lines: ['Foyer → arch → doors → each zone', 'Pink: panel stage · cyan: mini stage · yellow: networking'] },
    ]);

    return {
      groups: [room.group, g, panel.group],
      decalRoots: [room.group],
      people,
      labels,
      lighting: {
        fixtures: panel.fixtures, glows: panel.glows,
        sun: { pos: [-30, 48, 44], target: [0, 0, 3], extent: 40, far: 160 },
        spill: null,
        onNight: room.setNight,
      },
      slotsReady: panel.slotsReady,
      counts: { seats: panel.counts.seats + chairs.group.userData.count, seated: seatedCount, standing: standingCount },
      visibility(state, { plan }) {
        room.ceiling.visible = state.ceiling && !plan;
        room.foyerCeiling.visible = state.foyerCeiling && !plan;
        room.divider.visible = state.divider;
        room.arrows.visible = state.flows;
        panel.setLounge(false);
      },
    };
  },
};
