// 2027 DATE LETTERS — free-standing extruded numerals, walk-around, with room
// to stand between the digits, and an OPF logo lightbox above on a slim frame.
import * as THREE from 'three';
import { letters as LT, lightbox as LB } from '../../config/date-letters.config.js';
import { assets as MAIN_ASSETS } from '../../stage.config.js';
import { splitCaps } from '../slots.js';
import { dimLine } from '../booths/common.js';
import { drawLabel } from './art.js';
import { vinyl, paint, metal, darkMetal, lightbox, col } from './materials.js';
import { atrium } from './settings.js';
import { crowd } from './people.js';
import { digitShape } from './digits.js';
import { FONT_BODY } from '../sticker.js';

const m = (v) => `${+v.toFixed(2)} m`;

// Extruded digit with UVs: caps span the digit's bounding box (0..1), sides run
// along the outline (u = distance round the contour, v = depth).
function digitGeometry(ch) {
  const shape = digitShape(ch, LT.height);
  const b = LT.bevel;
  const geo = new THREE.ExtrudeGeometry(shape, { depth: LT.depth - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 10 });
  splitCaps(geo);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y, d = bb.max.z - bb.min.z;
  // contour table for the side UVs
  const loops = [shape.getPoints(24), ...shape.holes.map((hl) => hl.getPoints(24))];
  const pts = [];
  let L = 0;
  for (const loop of loops) {
    loop.forEach((p, i) => {
      if (i > 0) L += p.distanceTo(loop[i - 1]);
      pts.push({ x: p.x, y: p.y, s: L });
    });
    L += 0.001;
  }
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (const g of geo.groups) {
    for (let i = g.start; i < g.start + g.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      if (g.materialIndex === 1) {
        let best = pts[0], bd = Infinity;
        for (const p of pts) { const dd = (p.x - x) ** 2 + (p.y - y) ** 2; if (dd < bd) { bd = dd; best = p; } }
        uv.setXY(i, best.s / L, (z - bb.min.z) / d);
      } else {
        uv.setXY(i, (x - bb.min.x) / w, (y - bb.min.y) / h);
      }
    }
  }
  geo.translate(-(bb.min.x + w / 2), -bb.min.y, -(bb.min.z + d / 2));
  return { geo, w, h, d, perimeter: L };
}

export function dateLettersScene({ art }) {
  const install = new THREE.Group();
  const chars = LT.text.split('');
  const built = chars.map((ch) => digitGeometry(ch));
  const pitch = Math.max(...built.map((b) => b.w)) + LT.gap;

  chars.forEach((ch, i) => {
    const n = i + 1;
    const { geo, w, h, d, perimeter } = built[i];
    const body = art.option(`color.digit${n}`, 'color', `Digit ${n} "${ch}"`, LT.colors[i], 'Body colours');
    const front = art.slot(`digit${n}Front`, {
      title: `Digit ${n} "${ch}" · front`, w, h, body,
      placeholder: (ctx, W, H) => drawLabel(ctx, W, H, { title: 'KV PLACEHOLDER', sub: `DIGIT "${ch}" FRONT · ${m(w)} × ${m(h)}`, color: body() }),
    });
    const side = art.slot(`digit${n}Side`, {
      title: `Digit ${n} "${ch}" · sides`, w: perimeter, h: d, body, px: 2048,
      placeholder: (ctx, W, H) => {
        ctx.fillStyle = col(body());
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = body() === 'dark' ? '#ffffff88' : '#24222466';
        ctx.font = `800 ${H * 0.34}px ${FONT_BODY}`;
        ctx.textBaseline = 'middle';
        const t = 'IP ARTWORK – SUPPLIED BY CYBERE  ·  ';
        const tw = ctx.measureText(t).width;
        for (let x = 0; x < W; x += tw) ctx.fillText(t, x, H / 2);
      },
    });
    const backMat = paint(LT.colors[i]);
    const mesh = new THREE.Mesh(geo, [vinyl(front.tex, { roughness: 0.5 }), vinyl(side.tex, { roughness: 0.5 }), backMat]);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.position.set((i - (chars.length - 1) / 2) * pitch, LT.basePlate, 0);
    install.add(mesh);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, LT.basePlate, d + 0.1), darkMetal());
    plate.position.set(mesh.position.x, LT.basePlate / 2, 0);
    plate.receiveShadow = true;
    install.add(plate);
    art.onChange((get) => backMat.color.set(col(get(`color.digit${n}`) ?? LT.colors[i])));
  });

  // Slim frame + OPF logo lightbox above
  const F = LB.frame;
  const px = pitch;                       // posts stand behind the outer gaps
  const frameColor = art.option('color.frame', 'color', 'Lightbox frame', F.color, 'Body colours');
  const caseMat = paint(F.color, { roughness: 0.35, metalness: 0.2 });
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(F.post / 2, F.post / 2, F.top, 16), metal());
    post.position.set(sx * px, F.top / 2, F.z);
    post.castShadow = true;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.45), darkMetal());
    foot.position.set(sx * px, 0.01, F.z);
    install.add(post, foot);
  }
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(F.post / 2, F.post / 2, 2 * px, 16), metal());
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, F.top, F.z);
  bar.castShadow = true;
  install.add(bar);
  const logo = art.slot('lightboxLogo', {
    title: 'OPF logo lightbox (face)', w: LB.width, h: LB.height, body: () => 'white',
    assets: MAIN_ASSETS.logo,
    placeholder: (ctx, W, H) => drawLabel(ctx, W, H, { title: 'OPF LOGO', sub: 'LIGHTBOX · SUPPLIED FILE ONLY', color: 'white' }),
  });
  const face = lightbox(logo.tex);
  const box = new THREE.Mesh(new THREE.BoxGeometry(LB.width, LB.height, LB.depth), [caseMat, caseMat, caseMat, caseMat, face, caseMat]);
  box.position.set(0, LB.bottom + LB.height / 2, F.z);
  box.castShadow = true;
  install.add(box);
  for (const sx of [-1, 1]) {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, F.top - LB.bottom - LB.height, 8), metal());
    rod.position.set(sx * LB.width * 0.35, (F.top + LB.bottom + LB.height) / 2, F.z);
    install.add(rod);
  }
  art.onChange((get) => caseMat.color.set(col(get('color.frame') ?? frameColor())));

  const setting = atrium();
  const total = chars.length * (pitch - LT.gap) + (chars.length - 1) * LT.gap;

  // People: posing between the digits, friends with phones up, passers-by
  const people = crowd([
    { x: 0.05, z: 0.15, rot: 0.1, pose: 'pose' }, { x: -pitch, z: 0.2, rot: 0.2, pose: 'wave' },
    { x: -0.4, z: 4.8, rot: Math.PI, pose: 'phone' }, { x: 1.1, z: 5.2, rot: Math.PI - 0.2, pose: 'phone' },
    { x: 6.5, z: 2.5, rot: -1.6, pose: 'walk' }, { x: -7, z: 3.8, rot: 1.5, pose: 'walk' }, { x: 3.5, z: -3.5, rot: 2.6, pose: 'stand' },
  ], 21);

  const dims = new THREE.Group();
  const x0 = -1.5 * pitch - (pitch - LT.gap) / 2;
  dims.add(dimLine([x0 - 0.35, 0, 0.35], [x0 - 0.35, LT.height + LT.basePlate, 0.35], `≈ ${m(LT.height)}`, { tick: [1, 0, 0], textHeight: 0.24 }));
  dims.add(dimLine([-pitch - LT.gap / 2 + 0.02, 0.05, 0.6], [-pitch + LT.gap / 2 - 0.02, 0.05, 0.6], `GAP ${m(LT.gap)}`, { tick: [0, 0, 1], textHeight: 0.2, textOffset: [0, 0.3, 0] }));
  dims.add(dimLine([-LB.width / 2, LB.bottom + LB.height + 0.15, F.z + 0.2], [LB.width / 2, LB.bottom + LB.height + 0.15, F.z + 0.2], `LIGHTBOX ${m(LB.width)}`, { tick: [0, 1, 0], textHeight: 0.22 }));

  const labels = [
    { id: 'letters', pos: [x0, LT.height + 0.3, 0], title: '2027 date letters',
      lines: [`Numerals ≈ ${m(LT.height)} tall · ${m(LT.depth)} deep (EST)`, `${m(LT.gap)} between digits to stand in`, `Row ≈ ${m(total)} wide`] },
    { id: 'art', pos: [pitch * 0.5, LT.height * 0.6, 0.3], title: 'Art slots',
      lines: ['Each digit: front (KV / IP art) + sides', 'Fit: contain / cover / fill with colour', 'Side colours: palette (admin)'] },
    { id: 'lightbox', pos: [LB.width / 2 + 0.3, LB.bottom + LB.height, F.z], title: 'OPF logo lightbox',
      lines: [`${m(LB.width)} × ${m(LB.height)} × ${m(LB.depth)} (EST)`, `Bottom ${m(LB.bottom)} · on a slim frame`, 'Supplied logo file, lit at night'] },
    { id: 'setting', pos: [-9, 6.4, -9], title: 'Setting', lines: ['Mall atrium (generic)', 'Balcony ring above'] },
  ];

  const nightLights = [];
  for (const [x, z] of [[4, 5], [-4, 5]]) {
    const s = new THREE.SpotLight('#ffd3a1', 7, 20, 0.5, 0.6, 1.4);
    s.position.set(x, 5.1, z);
    s.target.position.set(0, 1.2, 0);
    s.visible = false;
    install.add(s, s.target);
    nightLights.push(s);
  }
  const glowLight = new THREE.PointLight('#fff4e0', 1.2, 6, 2);
  glowLight.position.set(0, LB.bottom + LB.height / 2, F.z + 0.6);
  glowLight.visible = false;
  install.add(glowLight);
  nightLights.push(glowLight);

  return {
    install, setting, people, dims, labels, nightLights, glows: [face],
    key: { pos: [-6, 14, -7], target: [0, 1.2, 0], extent: 10 },
  };
}

export function dateLettersPresets() {
  return {
    hero: { label: 'Hero 3/4', pos: [6.8, 2.3, 8.6], target: [0, 1.8, 0], fov: 46 },
    eye: { label: 'Eye level', pos: [1.0, 1.6, 6.2], target: [0, 1.9, 0], fov: 62 },
    front: { label: 'Front', pos: [0, 2.3, 12.5], target: [0, 2.2, 0], fov: 38 },
    top: { label: 'Top-down', pos: [0, 70, 0.01], target: [0, 0, 0], fov: 12, plan: true },
    wide: { label: 'Wide context', pos: [15, 9, 18], target: [0, 2.2, -1], fov: 50 },
  };
}
