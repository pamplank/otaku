// THE MAIN STAGE · Crystal Pavilion (config: stage.config.js). Unchanged build,
// wired into the shared viewer.
import { buildStage } from '../build/stage.js';
import { buildHall } from '../build/hall.js';
import { buildDressing } from '../build/dressing.js';
import { buildPeople } from '../build/people.js';
import { buildLabels } from '../labels.js';
import { presets } from '../cameras.js';
import { MAIN_ARTWORK } from '../artwork.js';

export default {
  id: 'main',
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · Okada Manila',
    title: 'The Main Stage',
    sub: 'Crystal Pavilion · 3D concept · all sizes TBC',
    ariaLabel: '3D model of the Main Stage in the Crystal Pavilion',
    caption: 'THE MAIN STAGE',
    fileTag: 'MainStage',
  },
  presets,
  toggles: [
    { key: 'ceiling', label: 'Ceiling 7.6 m', on: true },
    { key: 'roof', label: 'Hall roof', on: true },
  ],
  artwork: MAIN_ARTWORK,
  create() {
    const stage = buildStage();
    const hall = buildHall();
    const people = buildPeople();
    const labels = buildLabels();
    const dressing = buildDressing();
    return {
      groups: [stage.group, hall.group, dressing.group],
      decalRoots: [hall.group, dressing.group],
      people,
      labels,
      lighting: {
        fixtures: stage.fixtures, glows: [...stage.glows, ...dressing.glows],
        glassMats: hall.glassMats, shellLines: hall.shellLines,
      },
      slotsReady: stage.slots.map((s) => s.ready),
      logoSign: stage.logoSign,
      visibility(state, { plan }) {
        hall.ceiling.visible = state.ceiling && !plan;
        hall.roof.visible = state.roof && !plan;
      },
    };
  },
};
