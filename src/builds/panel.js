// PANEL STAGE · Grand Ballroom (config: config/panel.config.js, placed by
// config/ballroom.config.js). Talks, voice-actor and creator panels, Q&A.
import * as THREE from 'three';
import { room as R, placement as PL, divider as DV } from '../../config/ballroom.config.js';
import { seating as SEAT } from '../../config/panel.config.js';
import { palette as P } from '../../stage.config.js';
import { buildLabels } from '../labels.js';
import { buildRoom } from '../ballroom/room.js';
import { buildPanelZone, PANEL_ARTWORK } from '../ballroom/panelZone.js';
import { buildArchZone, ARCH_ARTWORK } from '../ballroom/archZone.js';
import { buildMiniZone, MINI_ARTWORK } from '../ballroom/miniZone.js';
import { crowd, figure } from '../ballroom/figures.js';
import { doors as D } from '../../config/ballroom.config.js';

const O = new THREE.Vector3(PL.panel.x, 0, PL.panel.z);
const w = (x, y, z) => [x + O.x, y, z + O.z];

function presets() {
  const row6 = SEAT.firstRow + 5 * SEAT.rowPitch + 0.3;
  return {
    foh: { label: 'Front of house', pos: w(1.4, 3.4, 18.5), target: w(0, 3.4, -3), fov: 40 },
    seated: { label: 'Seated eye level', pos: w(0, 1.2, row6), target: w(0, 3.3, -4), fov: 55 },
    side: { label: 'Side', pos: w(19, 4.6, 4.5), target: w(0, 2.8, -1.2), fov: 40 },
    plan: { label: 'Top-down plan', pos: w(0, 460, 8 + 0.01), target: w(0, 0, 8), fov: 4.6, plan: true },
    wide: { label: 'Wide room', pos: [-44, 30, 40], target: [-6, 1.5, 0], fov: 42 },
  };
}

export default {
  id: 'panel',
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · Grand Ballroom',
    title: 'Panel Stage',
    sub: 'Talks · VA & creator panels · Q&A · all sizes TBC',
    ariaLabel: '3D model of the Panel Stage in the Grand Ballroom',
    caption: 'PANEL STAGE · GRAND BALLROOM',
    fileTag: 'PanelStage',
  },
  presets,
  toggles: [
    { key: 'lounge', label: 'Lounge layout', on: false },
    { key: 'ceiling', label: `LED ceiling ${R.ceiling} m`, on: true },
    { key: 'divider', label: 'Divider', on: !DV.open },
  ],
  artwork: PANEL_ARTWORK,
  alsoShow: [{ id: 'mini', keys: Object.keys(MINI_ARTWORK) }, { id: 'arch', keys: Object.keys(ARCH_ARTWORK) }],
  create() {
    const room = buildRoom();
    const zone = buildPanelZone({ origin: O });
    const mini = buildMiniZone({ origin: new THREE.Vector3(PL.mini.x, 0, PL.mini.z), rects: room.rects });
    const arch = buildArchZone({ origin: new THREE.Vector3(PL.arch.x, 0, PL.arch.z) });

    const people = new THREE.Group();
    people.add(zone.people, mini.people, arch.people);
    for (const d of D.list) {           // staff at the doors
      for (const side of [-1, 1]) {
        const s = figure(P.yellow);
        s.position.set(d.x + side * (D.width / 2 + 0.5), 0, R.depth / 2 - 0.7);
        s.rotation.y = Math.PI;
        people.add(s);
      }
    }

    const labels = buildLabels([
      ...zone.labels.map((d) => ({ ...d, pos: w(...d.pos) })),
      { id: 'ceiling', pos: [PL.panel.x - 14, R.ceiling, -R.depth / 2 + 2], title: 'LED ceiling',
        lines: [`Flat, ${R.ceiling} m (31.6 ft) · pixel-mapped (venue)`, 'All truss ground-supported: no ceiling rigging'] },
    ]);

    return {
      groups: [room.group, zone.group, mini.group, mini.around, arch.group],
      decalRoots: [room.group, arch.group],
      people,
      labels,
      lighting: {
        fixtures: zone.fixtures, glows: [...zone.glows, ...mini.glows],
        sun: { pos: [O.x - 16, 30, O.z + 26], target: [O.x, 0, O.z + 5], extent: 26, far: 90 },
        spill: { pos: [zone.ledCentre.x, 3, zone.ledCentre.z + 1.5] },
        onNight: room.setNight,
      },
      slotsReady: [...zone.slotsReady, ...mini.slotsReady, ...arch.slotsReady],
      logoSign: zone.logoSign,                  // movable in admin mode, like the main stage's
      otherLogos: { mini: mini.logoSign },       // follows where the mini stage's logo was moved
      visibility(state, { plan }) {
        room.ceiling.visible = state.ceiling && !plan;
        room.foyerCeiling.visible = !plan;
        room.divider.visible = state.divider;
        room.arrows.visible = false;
        zone.setLounge(state.lounge);
        mini.setSigning(false);
      },
    };
  },
};
