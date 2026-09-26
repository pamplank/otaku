// IP BOOTH ZONE · Crystal Pavilion (config: config/zone.config.js; booths from
// config/booths.config.js; the main stage from stage.config.js, unchanged).
// Layout after the RFP venue plan (pp. 34 / 36).
import * as THREE from 'three';
import { buildStage } from '../build/stage.js';
import { buildDressing } from '../build/dressing.js';
import { buildPeople } from '../build/people.js';
import { buildLabels } from '../labels.js';
import { MAIN_ARTWORK } from '../artwork.js';
import { zones as ZN } from '../../config/zone.config.js';
import { buildZone, boothLayout, at, lakeCentre, ZONE_ARTWORK } from '../booths/zone.js';
import { BOOTH_A_ARTWORK } from '../booths/planA.js';
import { BOOTH_B_ARTWORK } from '../booths/planB.js';
import { BOOTH_C_ARTWORK } from '../booths/planC.js';

const ipZone = ZN.find((z) => z.id === 'ip');
const xyz = (p, y) => [p.x, y, p.z];

function presets() {
  const LY = boothLayout();
  const aisleD = (LY.aisle.from + LY.aisle.to) / 2;
  const tm = ipZone.from + (ipZone.to - ipZone.from) * 0.55;
  const mid = at(tm, 0);
  const above = at(tm - 6, 55);                         // over the promenade, looking back at the IP zone
  const eye0 = at(ipZone.to - 1, aisleD), eye1 = at(ipZone.to - 14, aisleD);
  const L = lakeCentre();
  const ipC = at((ipZone.from + ipZone.to) / 2 + 4, -2);
  return {
    ipAerial: { label: 'IP zone aerial', pos: xyz(above, 38), target: xyz(mid, 0), fov: 44 },
    aisle: { label: 'Aisle eye level', pos: xyz(eye0, 1.6), target: xyz(eye1, 1.4), fov: 58 },
    overview: { label: 'Zoning arc', pos: [L.x + 6, 140, L.z + 104], target: [L.x + 6, 0, L.z - 40], fov: 50 },
    plan: { label: 'Top-down plan', pos: [L.x, 600, L.z - 36 + 0.01], target: [L.x, 0, L.z - 36], fov: 16, plan: true },
    ipPlan: { label: 'IP zone plan', pos: [ipC.x, 300, ipC.z + 0.01], target: [ipC.x, 0, ipC.z], fov: 13, plan: true },
  };
}

export default {
  id: 'zone',
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · Crystal Pavilion',
    title: 'IP Booth Zone',
    sub: 'Crystal Pavilion zoning after the RFP plan · booth mix TBC · all sizes TBC',
    ariaLabel: '3D model of the Crystal Pavilion zoning around the Fountain and the IP booth zone',
    caption: 'IP BOOTH ZONE',
    fileTag: 'IPBoothZone',
  },
  presets,
  toggles: [
    { key: 'flow', label: 'Guest flow', on: true },
    { key: 'staffTags', label: 'Staff tags', on: false },
    { key: 'clearance', label: 'Photo clearance', on: false },
    { key: 'facade', label: 'Pavilion facade', on: true },
  ],
  artwork: ZONE_ARTWORK,
  alsoShow: [
    { id: 'main', keys: Object.keys(MAIN_ARTWORK) },
    { id: 'booth-a', keys: Object.keys(BOOTH_A_ARTWORK) },
    { id: 'booth-b', keys: Object.keys(BOOTH_B_ARTWORK) },
    { id: 'booth-c', keys: Object.keys(BOOTH_C_ARTWORK) },
  ],
  create() {
    const zone = buildZone();
    const stage = buildStage();
    const dressing = buildDressing();
    const people = new THREE.Group();
    people.add(zone.people, buildPeople());
    const L = lakeCentre();
    return {
      groups: [zone.group, stage.group, dressing.group, zone.dims],
      decalRoots: [zone.group, dressing.group],
      people,
      labels: buildLabels(zone.labels),
      lighting: {
        fixtures: stage.fixtures, glows: [...stage.glows, ...dressing.glows],
        sun: { pos: [L.x - 90, 170, L.z + 40], target: [L.x, 0, L.z - 45], extent: 150, far: 420 },
        onNight: (on) => zone.setNight(on),
      },
      slotsReady: [...zone.slotsReady, ...stage.slots.map((s) => s.ready)],
      visibility(state) {
        zone.setFlow(state.flow);
        zone.tags.visible = state.staffTags;
        zone.dims.visible = state.labels;
        zone.setClearance(state.clearance);
        zone.wall.visible = state.facade;
      },
    };
  },
};
