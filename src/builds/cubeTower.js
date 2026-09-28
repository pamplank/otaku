// INSTALLATION · STICKER CUBE TOWER (config: config/cube-tower.config.js)
import { installationBuild } from '../install/build.js';
import { cubeTowerScene, cubeTowerPresets } from '../install/cubeTower.js';

export default installationBuild({
  id: 'cube-tower',
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · Installations · Okada Manila entrance',
    title: 'Cube Tower',
    sub: 'Signature photo-op · 4 × 1.15 m cubes · all sizes TBC',
    ariaLabel: 'Rendered 3D model of the sticker cube tower installation',
    caption: 'STICKER CUBE TOWER',
    fileTag: 'CubeTower',
  },
  presets: cubeTowerPresets,
  create: cubeTowerScene,
});
