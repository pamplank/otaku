// IP BOOTH · PLAN B · Exhibition + photo (config: config/booths.config.js → planB)
import { planB } from '../../config/booths.config.js';
import { buildPlanB, BOOTH_B_ARTWORK } from '../booths/planB.js';
import { boothBuild } from './booth.js';

export default boothBuild({
  id: 'booth-b',
  cfg: planB,
  plan: { height: planB.shell.height },
  build: buildPlanB,
  artwork: BOOTH_B_ARTWORK,
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · IP booths · CyberE / Japan',
    title: 'Plan B',
    sub: 'Exhibition + photo · 6 × 3 × 3 m · all sizes TBC',
    ariaLabel: '3D model of IP booth plan B, an exhibition with a photo spot',
    caption: 'IP BOOTH PLAN B · EXHIBITION + PHOTO',
    fileTag: 'BoothB',
  },
});
