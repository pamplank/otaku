// IP BOOTH ZONE · Crystal Pavilion (config: config/zone.config.js; booths from
// config/booths.config.js; the main stage from stage.config.js, unchanged).
import * as THREE from 'three';
import { buildStage } from '../build/stage.js';
import { buildDressing } from '../build/dressing.js';
import { buildPeople } from '../build/people.js';
import { buildLabels } from '../labels.js';
import { MAIN_ARTWORK } from '../artwork.js';
import { grid as GR, arc as ARC } from '../../config/zone.config.js';
import { buildZone, gridLayout, ZONE_ARTWORK, fountainCentre, polar } from '../booths/zone.js';
import { BOOTH_A_ARTWORK } from '../booths/planA.js';
import { BOOTH_B_ARTWORK } from '../booths/planB.js';
import { BOOTH_C_ARTWORK } from '../booths/planC.js';

function presets() {
  const F = fountainCentre();
  const [gx, gz] = polar(GR.angle, GR.radius, F);
  const rot = -(GR.angle * Math.PI) / 180;
  // grid-local → world
  const w = (x, y, z) => {
    const v = new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
    return [v.x + gx, y, v.z + gz];
  };
  const G = gridLayout();
  const gw = G.width, gd = G.depth;
  const aisle = G.aisles[1];
  const az = (aisle[1] + aisle[3]) / 2;
  const [cx, cz] = [(polar(ARC.zones[0].from, ARC.outer, F)[0] + polar(ARC.zones.at(-1).to, ARC.outer, F)[0]) / 2, F.y - ARC.outer * 0.3];
  return {
    ipAerial: { label: 'IP zone aerial', pos: w(gw * 0.55, 30, gd * 0.5 + 30), target: w(0, 0, 1), fov: 42 },
    aisle: { label: 'Aisle eye level', pos: w(-gw / 2 + 1.6, 1.6, az), target: w(gw / 2, 1.3, az + 0.4), fov: 58 },
    overview: { label: 'Zoning arc', pos: [cx, 120, F.y + 78], target: [cx, 0, F.y - 22], fov: 46 },
    plan: { label: 'Top-down plan', pos: [cx, 600, cz + 0.01], target: [cx, 0, cz], fov: 12.6, plan: true },
    ipPlan: { label: 'IP zone plan', pos: [gx, 300, gz + 0.01], target: [gx, 0, gz], fov: (2 * Math.atan((Math.max(gw, gd) * 0.62) / 300) * 180) / Math.PI, plan: true },
  };
}

export default {
  id: 'zone',
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · Crystal Pavilion',
    title: 'IP Booth Zone',
    sub: 'Zoning arc around the Fountain · booth mix TBC · all sizes TBC',
    ariaLabel: '3D model of the IP booth zone and the zoning arc around the Fountain',
    caption: 'IP BOOTH ZONE',
    fileTag: 'IPBoothZone',
  },
  presets: () => presets(),
  toggles: [
    { key: 'flow', label: 'Guest flow', on: true },
    { key: 'staffTags', label: 'Staff tags', on: false },
    { key: 'clearance', label: 'Photo clearance', on: false },
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
    const F = zone.F;
    return {
      groups: [zone.group, stage.group, dressing.group, zone.dims],
      decalRoots: [zone.group, dressing.group],
      people,
      labels: buildLabels(zone.labels),
      lighting: {
        fixtures: stage.fixtures, glows: [...stage.glows, ...dressing.glows],
        sun: { pos: [F.x - 60, 120, F.y + 40], target: [F.x, 0, F.y - 25], extent: 95, far: 300 },
        onNight: (on) => { zone.wash.intensity = on ? 28 : 0; },
      },
      slotsReady: [...zone.slotsReady, ...stage.slots.map((s) => s.ready)],
      visibility(state) {
        zone.setFlow(state.flow);
        zone.tags.visible = state.staffTags;
        zone.dims.visible = state.labels;
        zone.setClearance(state.clearance);
      },
    };
  },
};
