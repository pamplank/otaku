// INSTALLATION · GIANT POLAROID FRAME (config: config/polaroid.config.js)
import { installationBuild } from '../install/build.js';
import { polaroidScene, polaroidPresets } from '../install/polaroid.js';

export default installationBuild({
  id: 'polaroid',
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · Installations · Mall walkway',
    title: 'Polaroid Frame',
    sub: 'UGC photo frame · ≈ 3.1 m · movable · all sizes TBC',
    ariaLabel: 'Rendered 3D model of the giant polaroid frame installation',
    caption: 'GIANT POLAROID FRAME',
    fileTag: 'PolaroidFrame',
  },
  presets: polaroidPresets,
  create: polaroidScene,
});
