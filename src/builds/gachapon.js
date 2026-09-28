// INSTALLATION · GIANT GACHAPON (config: config/gachapon.config.js)
import { installationBuild } from '../install/build.js';
import { gachaponScene, gachaponPresets } from '../install/gachapon.js';

export default installationBuild({
  id: 'gachapon',
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · Installations · Mall concourse / Okada',
    title: 'Gachapon',
    sub: 'Interactive capsule machine · ≈ 3.7 m · all sizes TBC',
    ariaLabel: 'Rendered 3D model of the giant gachapon installation',
    caption: 'GIANT GACHAPON',
    fileTag: 'Gachapon',
  },
  presets: gachaponPresets,
  create: gachaponScene,
});
