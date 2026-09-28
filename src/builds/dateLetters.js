// INSTALLATION · 2027 DATE LETTERS (config: config/date-letters.config.js)
import { installationBuild } from '../install/build.js';
import { dateLettersScene, dateLettersPresets } from '../install/dateLetters.js';

export default installationBuild({
  id: 'date-letters',
  meta: {
    eyebrow: 'Otaku Pop Fes 2027 · Installations · Mall atrium',
    title: 'Date Letters',
    sub: 'Selfie sculpture · sticker numerals ≈ 2.1–2.4 m · all sizes TBC',
    ariaLabel: 'Rendered 3D model of the 2027 date letters selfie sculpture installation',
    caption: '2027 DATE LETTERS',
    fileTag: 'DateLetters',
  },
  presets: dateLettersPresets,
  create: dateLettersScene,
});
