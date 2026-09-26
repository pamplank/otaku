// MINI STAGE · Grand Ballroom, right third (config: config/mini.config.js, placed
// by config/ballroom.config.js). Fan sessions, signings, community tie-ups, plus the
// networking / community area and the proposed pause pocket.
import * as THREE from 'three';
import { room as R, placement as PL, divider as DV, doors as D } from '../../config/ballroom.config.js';
import { stage as S, seating as SEAT } from '../../config/mini.config.js';
import { palette as P } from '../../stage.config.js';
import { buildLabels } from '../labels.js';
import { buildRoom } from '../ballroom/room.js';
import { buildMiniZone, MINI_ARTWORK } from '../ballroom/miniZone.js';
import { buildPanelZone, PANEL_ARTWORK } from '../ballroom/panelZone.js';
import { buildArchZone, ARCH_ARTWORK } from '../ballroom/archZone.js';
import { figure } from '../ballroom/figures.js';

const O = new THREE.Vector3(PL.mini.x, 0, PL.mini.z);
const w = (x, y, z) => [x + O.x, y, z + O.z];

function presets() {
  return {
    front: { label: 'Front', pos: w(0.6, 2.6, 12.5), target: w(0, 2.5, -2.5), fov: 42 },
    fan: { label: 'Fan eye level', pos: w(-1.2, 1.6, 7), target: w(0, 2.6, -2.2), fov: 55 },
    side: { label: 'Side', pos: w(-11.5, 3.6, 3.5), target: w(0.5, 2, -1.2), fov: 42 },
    plan: { label: 'Top-down plan', pos: [PL.mini.x - 0.1, 470, 0.01], target: [PL.mini.x - 0.1, 0, 0], fov: 4.3, plan: true },
    wide: { label: 'Wide zone', pos: [7, 22, 30], target: [17, 1, -3], fov: 46 },
  };
}

export default {
  id: 'mini',
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · Grand Ballroom',
    title: 'Mini Stage',
    sub: 'Fan sessions · signings · community · all sizes TBC',
    ariaLabel: '3D model of the Mini Stage, networking area and pause pocket in the Grand Ballroom',
    caption: 'MINI STAGE · GRAND BALLROOM',
    fileTag: 'MiniStage',
  },
  presets,
  toggles: [
    { key: 'signing', label: 'Signing table', on: false },
    { key: 'ceiling', label: `LED ceiling ${R.ceiling} m`, on: true },
    { key: 'divider', label: 'Divider', on: !DV.open },
  ],
  artwork: MINI_ARTWORK,
  alsoShow: [{ id: 'panel', keys: Object.keys(PANEL_ARTWORK) }, { id: 'arch', keys: Object.keys(ARCH_ARTWORK) }],
  create() {
    const room = buildRoom();
    const zone = buildMiniZone({ origin: O, rects: room.rects });
    const panel = buildPanelZone({ origin: new THREE.Vector3(PL.panel.x, 0, PL.panel.z) });
    const arch = buildArchZone({ origin: new THREE.Vector3(PL.arch.x, 0, PL.arch.z) });

    const people = new THREE.Group();
    people.add(zone.people, panel.people, arch.people);
    for (const d of D.list) {
      for (const side of [-1, 1]) {
        const s = figure(P.yellow);
        s.position.set(d.x + side * (D.width / 2 + 0.5), 0, R.depth / 2 - 0.7);
        s.rotation.y = Math.PI;
        people.add(s);
      }
    }
    const labels = buildLabels(zone.labels);
    return {
      groups: [room.group, zone.group, zone.around, panel.group, arch.group],
      decalRoots: [room.group, arch.group],
      people,
      labels,
      lighting: {
        fixtures: zone.fixtures, glows: [...zone.glows, ...panel.glows],
        sun: { pos: [O.x - 14, 28, O.z + 24], target: [O.x - 1, 0, O.z + 8], extent: 24, far: 90 },
        spill: { pos: [zone.ledCentre.x, 2.2, zone.ledCentre.z + 3], intensity: 2.5 },
        onNight: room.setNight,
      },
      slotsReady: [...zone.slotsReady, ...panel.slotsReady, ...arch.slotsReady],
      logoSign: zone.logoSign,                  // movable in admin mode, like the main stage's
      otherLogos: { panel: panel.logoSign },     // follows where the panel stage's logo was moved
      visibility(state, { plan }) {
        room.ceiling.visible = state.ceiling && !plan;
        room.foyerCeiling.visible = !plan;
        room.divider.visible = state.divider;
        room.arrows.visible = false;
        zone.setSigning(state.signing);
        panel.setLounge(false);
      },
    };
  },
};
