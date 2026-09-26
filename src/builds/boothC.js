// IP BOOTH · PLAN C · Photo spot + standees (config: config/booths.config.js → planC)
import { planC } from '../../config/booths.config.js';
import { buildPlanC, BOOTH_C_ARTWORK } from '../booths/planC.js';
import { boothBuild } from './booth.js';

export default boothBuild({
  id: 'booth-c',
  cfg: planC,
  plan: { height: planC.backdrop.bottom + planC.backdrop.height },
  build: buildPlanC,
  artwork: BOOTH_C_ARTWORK,
  staff: false,
  extraToggles: [{ key: 'clearance', label: 'Photo clearance', on: true }],
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · IP booths · CyberE / Japan',
    title: 'Plan C',
    sub: 'Photo spot + standees · backdrop 3 × 2 m · all sizes TBC',
    ariaLabel: '3D model of IP booth plan C, a photo spot with standees',
    caption: 'IP BOOTH PLAN C · PHOTO SPOT + STANDEES',
    fileTag: 'BoothC',
  },
});
