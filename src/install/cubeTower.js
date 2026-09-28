// STICKER CUBE TOWER — 4 stacked 1.15 m cubes, each turned a little, on a low
// plinth, in a hotel lobby at the entrance (porte-cochère beyond the glass).
import * as THREE from 'three';
import { tower as T, faces as F, text as TX } from '../../config/cube-tower.config.js';
import { assets as MAIN_ASSETS } from '../../stage.config.js';
import { dimLine } from '../booths/common.js';
import { drawLabel, drawText } from './art.js';
import { vinyl, paint, metal, col } from './materials.js';
import { lobby } from './settings.js';
import { crowd, facing } from './people.js';

const KV = ['assets/opf-kv.jpg'];
const FACE_ORDER = ['right', 'left', 'top', 'bottom', 'front', 'back'];   // BoxGeometry material order
const NAME = { right: 'Right', left: 'Left', top: 'Top', front: 'Front', back: 'Back' };
const m = (v) => `${+v.toFixed(2)} m`;

export function cubeTowerScene({ art }) {
  const c = T.cube, P = T.plinth;
  const install = new THREE.Group();
  const date = art.option('text.date', 'text', 'Date (DATE face)', TX.date, 'Text');

  // Plinth
  const plinthColor = art.option('color.plinth', 'color', 'Plinth', P.color, 'Body colours');
  const plinthMat = paint(P.color, { roughness: 0.35 });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(P.width, P.height, P.depth), [plinthMat, plinthMat, plinthMat, plinthMat, plinthMat, plinthMat]);
  plinth.position.y = P.height / 2;
  plinth.castShadow = plinth.receiveShadow = true;
  install.add(plinth);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(P.width + 0.02, 0.02, P.depth + 0.02), metal());
  lip.position.y = P.height - 0.01;
  install.add(lip);
  art.onChange((get) => plinthMat.color.set(col(get('color.plinth') ?? plinthColor())));

  // Cubes
  for (let i = 0; i < T.count; i++) {
    const n = i + 1;
    const body = art.option(`color.cube${n}`, 'color', `Cube ${n}${i === 0 ? ' (bottom)' : i === T.count - 1 ? ' (top)' : ''}`, T.colors[i], 'Body colours');
    const bodyMat = paint(T.colors[i]);
    const mats = FACE_ORDER.map((face) => {
      if (face === 'bottom' || (face === 'top' && i < T.count - 1)) return bodyMat;
      const key = `cube${n}${NAME[face]}`;
      let kind = 'ip';
      if (F.logo[0] === i && F.logo[1] === face) kind = 'logo';
      else if (F.date[0] === i && F.date[1] === face) kind = 'date';
      else if (face === 'front' || face === 'right') kind = 'kv';
      const where = `Cube ${n} · ${NAME[face].toLowerCase()}`;
      const slot = art.slot(key, {
        title: { logo: `OPF logo · ${where}`, date: `Date · ${where}`, kv: `OPF KV · ${where}`, ip: `IP artwork · ${where}` }[kind],
        w: c, h: c, body,
        assets: kind === 'logo' ? MAIN_ASSETS.logo : kind === 'kv' ? KV : [],
        placeholder: (ctx, W, H) => {
          if (kind === 'date') return drawText(ctx, W, H, date(), body());
          const t = { logo: ['OPF LOGO', 'SUPPLIED FILE ONLY'], kv: ['KV PLACEHOLDER', 'SUPPLIED OPF KV'], ip: ['IP ARTWORK\n– SUPPLIED BY CYBERE', '1.15 × 1.15 M FACE'] }[kind];
          drawLabel(ctx, W, H, { title: t[0], sub: t[1], color: body() });
        },
      });
      return vinyl(slot.tex);
    });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(c, c, c), mats);
    cube.castShadow = cube.receiveShadow = true;
    const g = new THREE.Group();
    g.add(cube);
    // painted edge trims in the body colour
    const e = T.edge, half = c / 2;
    for (const [sx, sy, sz, px, py, pz] of [
      [c + e, e, e, 0, 1, 1], [c + e, e, e, 0, 1, -1], [c + e, e, e, 0, -1, 1], [c + e, e, e, 0, -1, -1],
      [e, c + e, e, 1, 0, 1], [e, c + e, e, -1, 0, 1], [e, c + e, e, 1, 0, -1], [e, c + e, e, -1, 0, -1],
      [e, e, c + e, 1, 1, 0], [e, e, c + e, -1, 1, 0], [e, e, c + e, 1, -1, 0], [e, e, c + e, -1, -1, 0],
    ]) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), bodyMat);
      t.position.set(px * half, py * half, pz * half);
      t.castShadow = true;
      g.add(t);
    }
    const [dx, dz] = T.shifts[i] ?? [0, 0];
    g.position.set(dx, P.height + i * c + c / 2, dz);
    g.rotation.y = THREE.MathUtils.degToRad(T.turns[i] ?? 0);
    install.add(g);
    art.onChange((get) => bodyMat.color.set(col(get(`color.cube${n}`) ?? T.colors[i])));
  }

  const setting = lobby();
  const top = P.height + T.count * c;

  // People: two posing in front, one taking the photo, passers-by
  const people = crowd([
    { x: -0.55, z: 1.55, rot: 0.15, pose: 'pose' }, { x: 0.35, z: 1.6, rot: -0.1, pose: 'stand' },
    { x: 0.4, z: 5.2, rot: Math.PI, pose: 'phone' },
    { x: 4.8, z: 2.8, rot: -1.9, pose: 'walk' }, { x: -4.5, z: 4.6, rot: 1.4, pose: 'walk' },
    { x: 3.2, z: -3.5, rot: facing(3.2, -3.5, 0, 0), pose: 'phone' },
  ], 11);

  // Dimensions (Labels toggle)
  const dims = new THREE.Group();
  dims.add(dimLine([-1.55, 0, 0.9], [-1.55, top, 0.9], `≈ ${m(top)}`, { tick: [1, 0, 0], tickLen: 0.2, textHeight: 0.26 }));
  dims.add(dimLine([-c / 2, P.height + c + 0.12, c / 2 + 0.2], [c / 2, P.height + c + 0.12, c / 2 + 0.2], `${m(c)} CUBE`, { tick: [0, 1, 0], textHeight: 0.22 }));

  const labels = [
    { id: 'tower', pos: [0.9, top + 0.3, 0.6], title: 'Sticker Cube Tower',
      lines: [`${T.count} × ${m(c)} cubes · ≈ ${m(T.count * c)} stack`, `On a ${m(P.height)} plinth · ≈ ${m(top)} overall`, 'Each cube turned a little (EST)'] },
    { id: 'faces', pos: [c / 2 + 0.4, P.height + c * 1.5, c / 2], title: 'Art faces',
      lines: ['Hero-facing faces: supplied OPF KV', 'Top cube front: OPF LOGO · third cube front: DATE', 'All other faces: IP artwork – supplied by CyberE'] },
    { id: 'plinth', pos: [-P.width / 2, P.height + 0.1, P.depth / 2], title: 'Plinth',
      lines: [`${m(P.width)} × ${m(P.depth)} × ${m(P.height)} (EST)`] },
    { id: 'setting', pos: [-6, 1.2, -7], title: 'Setting',
      lines: ['Okada Manila entrance lobby (generic)', 'Porte-cochère beyond the glass'] },
  ];

  // Night: warm downlights on the tower
  const nightLights = [];
  for (const [x, z] of [[3.2, 3.2], [-3, 2.6]]) {
    const s = new THREE.SpotLight('#ffcf94', 9, 18, 0.42, 0.6, 1.4);
    s.position.set(x, 6.8, z);
    s.target.position.set(0, 2.4, 0);
    s.visible = false;
    install.add(s, s.target);
    nightLights.push(s);
  }

  return {
    install, setting, people, dims, labels, nightLights,
    key: { pos: [-5, 13, -6], target: [0, 1.5, 0], extent: 9 },
  };
}

export function cubeTowerPresets() {
  return {
    hero: { label: 'Hero 3/4', pos: [5.4, 2.3, 6.6], target: [0, 2.35, 0], fov: 46 },
    eye: { label: 'Eye level', pos: [0.8, 1.6, 5.2], target: [0, 2.5, 0], fov: 62 },
    front: { label: 'Front', pos: [0, 2.4, 9.5], target: [0, 2.4, 0], fov: 38 },
    top: { label: 'Top-down', pos: [0, 60, 0.01], target: [0, 0, 0], fov: 12, plan: true },
    wide: { label: 'Wide context', pos: [12, 6.5, 14], target: [0, 2, -2], fov: 50 },
  };
}
