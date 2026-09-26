// BALLROOM ENTRANCE ARCH · foyer (config: config/arch.config.js, placed by
// config/ballroom.config.js).
import * as THREE from 'three';
import { room as R, foyer as F, placement as PL, doors as D } from '../../config/ballroom.config.js';
import { arch as A } from '../../config/arch.config.js';
import { palette as P } from '../../stage.config.js';
import { buildLabels } from '../labels.js';
import { buildRoom } from '../ballroom/room.js';
import { buildArchZone, ARCH_ARTWORK } from '../ballroom/archZone.js';
import { buildPanelZone, PANEL_ARTWORK } from '../ballroom/panelZone.js';
import { buildMiniZone, MINI_ARTWORK } from '../ballroom/miniZone.js';
import { crowd, figure, scatter, colorPicker, mulberry32 } from '../ballroom/figures.js';

const AX = PL.arch.x, AZ = PL.arch.z;
const zD = R.depth / 2;

function presets() {
  return {
    approach: { label: 'Approach', pos: [AX + 0.3, 1.6, AZ + 11.5], target: [AX, 2.25, AZ - 2], fov: 42 },
    wide: { label: 'Wide foyer', pos: [AX + 15, 10, zD + F.depth + 12], target: [AX + 1, 1.2, AZ + 0.5], fov: 44 },
    side: { label: 'Side', pos: [AX - 14, 3.2, AZ + 3.5], target: [AX, 2.1, AZ], fov: 45 },
    plan: { label: 'Top-down plan', pos: [AX, 300, AZ + 1 + 0.01], target: [AX, 0, AZ + 1], fov: 5.4, plan: true },
  };
}

export default {
  id: 'arch',
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · Grand Ballroom foyer',
    title: 'Ballroom Arch',
    sub: 'Entrance portal · queue lanes · all sizes TBC',
    ariaLabel: '3D model of the ballroom entrance arch in the foyer',
    caption: 'BALLROOM ENTRANCE ARCH',
    fileTag: 'BallroomArch',
  },
  presets,
  toggles: [
    { key: 'foyerCeiling', label: `Foyer ceiling ${F.ceiling} m`, on: true },
    { key: 'boards', label: 'Timetables', on: true },
    { key: 'lanes', label: 'Queue lanes', on: true },
    { key: 'arrows', label: 'Floor arrows', on: true },
  ],
  artwork: ARCH_ARTWORK,
  alsoShow: [{ id: 'panel', keys: Object.keys(PANEL_ARTWORK) }, { id: 'mini', keys: Object.keys(MINI_ARTWORK) }],
  create() {
    const room = buildRoom();
    const zone = buildArchZone({ origin: new THREE.Vector3(AX, 0, AZ) });
    const panel = buildPanelZone({ origin: new THREE.Vector3(PL.panel.x, 0, PL.panel.z) });
    const mini = buildMiniZone({ origin: new THREE.Vector3(PL.mini.x, 0, PL.mini.z), rects: room.rects });

    // Foyer visitors walking (clear of the arch and the lanes) + door staff
    const rand = mulberry32(84);
    const pick = colorPicker(rand);
    const [fx0, fz0, fx1, fz1] = room.rects.foyer;
    const walkers = scatter(rand, { x0: fx0 + 2, x1: fx1 - 2, z0: fz0 + 0.8, z1: fz1 - 0.5, count: 18, gap: 1.5,
      avoid: (x, z) => (Math.abs(x - AX) < 16 && z > AZ - A.depth / 2 - 1.5) || Math.abs(x - AX) < A.width / 2 + 1 })
      .map((s) => ({ ...s, rot: rand() > 0.5 ? Math.PI / 2 : -Math.PI / 2, color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 }));
    const people = new THREE.Group();
    people.add(zone.people, panel.people, mini.people, crowd(walkers));
    for (const d of D.list) {
      for (const side of [-1, 1]) {
        const s = figure(P.yellow);
        s.position.set(d.x + side * (D.width / 2 + 0.5), 0, zD - 0.7);
        s.rotation.y = Math.PI;
        people.add(s);
      }
    }
    // Night: a soft wash on the arch face (the foyer has no stage lighting)
    const wash = new THREE.PointLight('#fff0f7', 0, 16, 1.2);
    wash.position.set(AX, 3.6, AZ + 4.5);
    const labels = buildLabels([
      ...zone.labels,
      { id: 'foyer', pos: [AX - 12, F.ceiling, zD + F.depth / 2], title: 'Foyer',
        lines: [`Ceiling ${F.ceiling} m (toggle)`, `≈ ${F.depth} m deep (est.)`, 'Main doors behind the arch'] },
    ]);
    return {
      groups: [room.group, zone.group, panel.group, mini.group, mini.around, wash],
      decalRoots: [room.group, zone.group],
      people,
      labels,
      lighting: {
        fixtures: [], glows: [...panel.glows, ...mini.glows],
        sun: { pos: [AX - 12, 26, AZ + 22], target: [AX, 0, AZ], extent: 22, far: 80 },
        spill: null,
        onNight: (on) => { room.setNight(on); wash.intensity = on ? 4 : 0; },
      },
      slotsReady: [...zone.slotsReady, ...panel.slotsReady, ...mini.slotsReady],
      logoSign: zone.logoSign,                  // movable in admin mode, like the stage logos
      otherLogos: { panel: panel.logoSign, mini: mini.logoSign },
      visibility(state, { plan }) {
        room.ceiling.visible = !plan;
        room.foyerCeiling.visible = state.foyerCeiling && !plan;
        room.divider.visible = false;
        room.arrows.visible = false;
        zone.boardGroup.visible = state.boards;
        zone.setLanes(state.lanes);
        zone.arrows.visible = state.arrows;
        panel.setLounge(false);
        mini.setSigning(false);
      },
    };
  },
};
