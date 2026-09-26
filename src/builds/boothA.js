// IP BOOTH · PLAN A · Hosted exhibition (config: config/booths.config.js → planA)
import { planA } from '../../config/booths.config.js';
import { buildPlanA, BOOTH_A_ARTWORK } from '../booths/planA.js';
import { boothBuild } from './booth.js';

export default boothBuild({
  id: 'booth-a',
  cfg: planA,
  plan: { height: planA.platform.height + planA.kvPanel.height },
  build: buildPlanA,
  artwork: BOOTH_A_ARTWORK,
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · IP booths · CyberE / Japan',
    title: 'Plan A',
    sub: 'Hosted exhibition · 6 × 6 m · all sizes TBC',
    ariaLabel: '3D model of IP booth plan A, a hosted exhibition',
    caption: 'IP BOOTH PLAN A · HOSTED EXHIBITION',
    fileTag: 'BoothA',
  },
});
