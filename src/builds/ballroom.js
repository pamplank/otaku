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
import { buildArchZone, ARCH_ARTWORK } from '../ballroom/archZone.js';
import { buildMiniZone, MINI_ARTWORK } from '../ballroom/miniZone.js';
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
  alsoShow: [{ id: 'panel', keys: Object.keys(PANEL_ARTWORK) }, { id: 'mini', keys: Object.keys(MINI_ARTWORK) }, { id: 'arch', keys: Object.keys(ARCH_ARTWORK) }],
  create() {
    const room = buildRoom();
    const { rects, areas } = room;
    const g = new THREE.Group();
    const rand = mulberry32(1649);
    const pick = colorPicker(rand);

    // Panel zone: the full Panel Stage build (stage, 480 seats, riser, FOH, people)
    const panel = buildPanelZone({ origin: new THREE.Vector3(PL.panel.x, 0, PL.panel.z), seed: 1650 });
    const lastRow = panel.lastRow;

    // Right third: the full Mini Stage build (stage, chairs, standing, networking, pause pocket)
    const mini = buildMiniZone({ origin: new THREE.Vector3(PL.mini.x, 0, PL.mini.z), rects, seed: 61 });

    // Arch in the foyer
    const arch = buildArchZone({ origin: new THREE.Vector3(PL.arch.x, 0, PL.arch.z), seed: 43 });


    // Sparkles on the far wall, above each stage zone
    for (const [x, y, s, c] of [[PL.panel.x - 7.5, 7.6, 1.3, 'yellow'], [PL.panel.x + 7.8, 8.2, 0.7, 'cyan'], [PL.mini.x + 4.6, 5.8, 0.8, 'pink']]) {
      const st = starSticker(s, P[c]);
      st.position.set(x, y, zB + 0.12);
      g.add(st);
    }

    // ─── People ───
    const people = new THREE.Group();
    people.add(panel.people, mini.people, arch.people);

    const standing = [];
    const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
    // standing at the back of the panel zone
    // foyer
    const [fx0, fz0, fx1, fz1] = rects.foyer;
    for (const s of scatter(rand, { x0: fx0 + 2, x1: fx1 - 2, z0: fz0 + 1.2, z1: fz1 - 0.8, count: 22, gap: 1.4,
      avoid: (x, z) => (Math.abs(x - PL.arch.x) < 16 && z > PL.arch.z - AR.depth / 2 - 1.2) || Math.abs(x - PL.arch.x) < AR.width / 2 + 1 })) {
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
    const seatedCount = panel.counts.seated + panel.counts.panelists, standingCount = standing.length + D.list.length * 2;

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
        lines: [`Far end of the right third · ${m2(areas.mini)}`, `Deck ${MS.deck.width} × ${MS.deck.depth} m`, `${mini.counts.seats} seats + ~${MSTAND.capacity} standing`, 'Full build: Mini Stage'] },
      { id: 'net', pos: [xSplit + 3, 1.8, (rects.networking[1] + rects.pause[1]) / 2], title: 'Networking / community',
        lines: [`Middle of the right third · ${m2(areas.networking)}`, 'High tables · bench cluster · noticeboard'] },
      { id: 'pause', pos: [rects.pause[0] + 0.6, 1.6, rects.pause[1] + 0.8], title: 'Proposed pause pocket',
        lines: [`By the doors · ${m2(areas.pause)}`, 'Soft seating · water point · REST sign'] },
      { id: 'foyer', pos: [xL + 6, F.ceiling, zD + F.depth / 2], title: 'Foyer',
        lines: [`${R.width} × ${F.depth} m (depth est.) · ${m2(areas.foyer)}`, `Foyer ceiling ${m(F.ceiling)}`, `${D.list.length} double doors in the long wall`] },
      { id: 'arch', pos: [PL.arch.x + AR.width / 2, AR.height + 0.3, PL.arch.z], title: 'Entrance arch',
        lines: [`${AR.width} × ${AR.height} × ${AR.depth} m`, `Clear opening ${AR.opening.width} × ${AR.opening.height} m`, 'VIP + General queue lanes', 'Full build: Ballroom Arch'] },
      { id: 'divider', pos: [xSplit, DV.height + 0.3, zB + 3], title: 'Optional divider',
        lines: [`Pipe & drape, ${m(DV.height)} high (est.)`, 'Default open · toggle: Divider'] },
      { id: 'flow', pos: [PL.arch.x - 2.2, 0.4, zD + F.depth - 1], title: 'Guest flow',
        lines: ['Foyer → arch → doors → each zone', 'Pink: panel stage · cyan: mini stage · yellow: networking'] },
    ]);

    return {
      groups: [room.group, g, panel.group, mini.group, mini.around, arch.group],
      decalRoots: [room.group, arch.group],
      people,
      labels,
      lighting: {
        fixtures: [...panel.fixtures, ...mini.fixtures], glows: [...panel.glows, ...mini.glows],
        sun: { pos: [-30, 48, 44], target: [0, 0, 3], extent: 40, far: 160 },
        spill: null,
        onNight: room.setNight,
      },
      slotsReady: [...panel.slotsReady, ...mini.slotsReady, ...arch.slotsReady],
      otherLogos: { panel: panel.logoSign, mini: mini.logoSign },   // logos where each stage's admin moved them
      counts: { seats: panel.counts.seats + mini.counts.seats, seated: seatedCount, standing: standingCount },
      visibility(state, { plan }) {
        room.ceiling.visible = state.ceiling && !plan;
        room.foyerCeiling.visible = state.foyerCeiling && !plan;
        room.divider.visible = state.divider;
        room.arrows.visible = state.flows;
        panel.setLounge(false);
        mini.setSigning(false);
      },
    };
  },
};
