// 2027 DATE LETTERS — the illustrated version: a chunky, bouncy sticker-style
// "2027" that reads as one word. Tight numerals staggered front/back, each with
// its own tilt and height, a thick dark outline and dark return, on one shared
// plinth; sparkle stars on thin rods; the OPF logo lightbox (sized to the logo
// file) on a single central post behind.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { letters as LT, lightbox as LB, stars as STARS } from '../../config/date-letters.config.js';
import { assets as MAIN_ASSETS } from '../../stage.config.js';
import { dimLine } from '../booths/common.js';
import { drawLabel } from './art.js';
import { vinyl, paint, metal, lightbox, col } from './materials.js';
import { atrium } from './settings.js';
import { crowd, facing } from './people.js';
import { numeralShapes, starShapes, stickerSolid } from './sticker3d.js';

const m = (v) => `${+v.toFixed(2)} m`;
const LOGO_ASPECT = 2052 / 420;     // the supplied logo file, until it loads

export function dateLettersScene({ art }) {
  const install = new THREE.Group();
  const chars = LT.text.split('');
  const PL = LT.plinth;
  const darkMat = paint('dark', { roughness: 0.5 });

  // Numeral outlines first, to lay the word out
  const glyphs = chars.map((ch, i) => {
    const H = LT.heights[i];
    const faceShapes = numeralShapes(ch, H);
    const outlineShapes = numeralShapes(ch, H, LT.outline);
    const bb = new THREE.Box2();
    for (const s of outlineShapes) for (const p of s.getPoints()) bb.expandByPoint(p);
    return { ch, H, faceShapes, outlineShapes, bb, w: bb.max.x - bb.min.x };
  });
  let x = 0;
  const xs = glyphs.map((g, i) => { if (i) x += glyphs[i - 1].w / 2 + LT.gap + g.w / 2; return x; });
  const shift = (xs[0] - glyphs[0].w / 2 + xs.at(-1) + glyphs.at(-1).w / 2) / 2;
  const X = xs.map((v) => v - shift);
  const xL = X[0] - glyphs[0].w / 2, xR = X.at(-1) + glyphs.at(-1).w / 2;
  const wordW = xR - xL;

  glyphs.forEach((gl, i) => {
    const n = i + 1;
    const body = art.option(`color.digit${n}`, 'color', `Numeral ${n} "${gl.ch}"`, LT.colors[i], 'Body colours');
    const fw = gl.bb.max.x - gl.bb.min.x - 2 * LT.outline, fh = gl.bb.max.y - gl.bb.min.y - 2 * LT.outline;
    const front = art.slot(`digit${n}Front`, {
      title: `Numeral ${n} "${gl.ch}" · face`, w: fw, h: fh, body, defaultMode: 'colour',
      placeholder: (ctx, W, H) => drawLabel(ctx, W, H, { title: 'KV / IP ART', sub: `NUMERAL "${gl.ch}" FACE · ${m(fw)} × ${m(fh)}`, color: body() }),
    });
    const perimeter = gl.outlineShapes.reduce((a, s) => a + s.getLength() + s.holes.reduce((b, h) => b + h.getLength(), 0), 0);
    const side = art.slot(`digit${n}Side`, {
      title: `Numeral ${n} "${gl.ch}" · returns`, w: perimeter, h: LT.depth, body: () => 'dark', defaultMode: 'colour', px: 2048,
      placeholder: (ctx, W, H) => drawLabel(ctx, W, H, { title: 'IP ARTWORK – SUPPLIED BY CYBERE', sub: `RETURNS · ${m(perimeter)} × ${m(LT.depth)}`, color: 'dark' }),
    });
    const solid = stickerSolid(gl.faceShapes, gl.outlineShapes, {
      depth: LT.depth, face: LT.face, darkMat,
      faceMat: vinyl(front.tex, { roughness: 0.42 }), sideMat: vinyl(side.tex, { roughness: 0.5 }),
    });
    // bottom-centre of the outline at the origin, then tilt about it
    const cx = (gl.bb.min.x + gl.bb.max.x) / 2;
    solid.group.children.forEach((c) => c.geometry.translate(-cx, -gl.bb.min.y, 0));
    const tilt = THREE.MathUtils.degToRad(LT.tilts[i]);
    const lift = (gl.w / 2) * Math.sin(Math.abs(tilt)) * 0.75;   // rounded bottom corner rests on the plinth
    const g = solid.group;
    g.rotation.z = tilt;
    g.position.set(X[i], PL.height + lift, LT.stagger[i] + LT.depth / 2);
    install.add(g);
  });

  // One shared plinth under the whole word
  const plW = wordW + 2 * PL.margin;
  const plinthColor = art.option('color.plinth', 'color', 'Plinth', PL.color, 'Body colours');
  const plinthMat = paint(PL.color, { roughness: 0.5 });
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(plW, PL.height, PL.depth, 3, 0.03), plinthMat);
  plinth.position.set(0, PL.height / 2, PL.z);
  plinth.castShadow = plinth.receiveShadow = true;
  install.add(plinth);
  art.onChange((get) => plinthMat.color.set(col(get('color.plinth') ?? plinthColor())));

  // Sparkle stars on thin rods
  const onPlinth = (sx, sz) => Math.abs(sx) < plW / 2 && Math.abs(sz - PL.z) < PL.depth / 2;
  for (const [sx, sy, sz, r, c] of STARS) {
    const star = stickerSolid(starShapes(r), starShapes(r, 0.035), { depth: 0.06, face: 0.035, darkMat, faceMat: paint(c, { roughness: 0.35 }), sideMat: darkMat });
    star.group.position.set(sx, sy, sz + 0.03);
    star.group.rotation.z = (sx > 0 ? -1 : 1) * 0.18;
    install.add(star.group);
    const y0 = onPlinth(sx, sz) ? PL.height : 0;
    const len = sy - r * 0.2 - y0;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 10), metal());
    rod.position.set(sx, y0 + len / 2, sz - 0.02);
    rod.castShadow = true;
    install.add(rod);
    if (!y0) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.02, 24), darkMat);
      foot.position.set(sx, 0.01, sz - 0.02);
      install.add(foot);
    }
  }

  // OPF logo lightbox: sized to the logo file (+10% of its width on every side),
  // white face, dark outline, hard offset panel, on one central post
  const lb = new THREE.Group();
  const outlineMat = paint('dark', { roughness: 0.4 });
  const shadowMat = paint(LB.shadow.color, { roughness: 0.45 });
  const faceBox = new THREE.Mesh(new THREE.BufferGeometry(), []);
  const rim = new THREE.Mesh(new THREE.BufferGeometry(), outlineMat);
  const offset = new THREE.Mesh(new THREE.BufferGeometry(), shadowMat);
  const post = new THREE.Mesh(new THREE.BufferGeometry(), outlineMat);
  for (const o of [faceBox, rim, offset, post]) o.castShadow = true;
  lb.add(faceBox, rim, offset);
  install.add(lb, post);
  let box = null, faceMat = null, aspectNow = 0;
  function fitBox(aspect) {
    if (Math.abs(aspect - aspectNow) < 1e-3) return;
    aspectNow = aspect;
    let cw = LB.logoWidth, ch = cw / aspect;
    if (ch > LB.logoMaxHeight) { ch = LB.logoMaxHeight; cw = ch * aspect; }
    const p = LB.padding * Math.max(cw, ch);
    const bw = cw + 2 * p, bh = ch + 2 * p, o = LB.outline;
    box = { bw, bh, cw, ch, p };
    for (const mesh of [faceBox, rim, offset, post]) mesh.geometry.dispose();
    faceBox.geometry = new THREE.BoxGeometry(bw, bh, LB.depth);
    rim.geometry = new THREE.BoxGeometry(bw + 2 * o, bh + 2 * o, LB.depth * 0.8);
    rim.position.z = -LB.depth * 0.15;
    offset.geometry = new THREE.BoxGeometry(bw + 2 * o, bh + 2 * o, 0.05);
    offset.position.set(LB.shadow.x, LB.shadow.y, -LB.depth / 2 - 0.05);
    const cy = LB.top - bh / 2 - o;
    lb.position.set(0, cy, LB.post.z + LB.depth / 2 + 0.08);
    const len = cy - PL.height;
    post.geometry = new THREE.CylinderGeometry(LB.post.radius, LB.post.radius, len, 20);
    post.position.set(0, PL.height + len / 2, LB.post.z);
    if (logo) {
      logo.pad = [p / bw, p / bh];
      logo.resize(bw, bh);
    }
  }
  let logo = null;
  fitBox(LOGO_ASPECT);
  logo = art.slot('lightboxLogo', {
    title: 'OPF logo lightbox (face)', w: box.bw, h: box.bh, body: () => 'white', fit: 'contain', fixedFit: true,
    pad: [box.p / box.bw, box.p / box.bh], assets: MAIN_ASSETS.logo, onAspect: fitBox,
    placeholder: (ctx, W, H) => drawLabel(ctx, W, H, { title: 'OPF LOGO', sub: 'LIGHTBOX · SUPPLIED FILE ONLY · CONTAIN', color: 'white' }),
  });
  faceMat = logo.use(lightbox(logo.tex));
  faceBox.material = [outlineMat, outlineMat, outlineMat, outlineMat, faceMat, outlineMat];

  const setting = atrium();
  const topY = PL.height + Math.max(...LT.heights);

  // People: posing on the plinth in front of the set-back numerals, friends
  // taking the photo, passers-by
  const people = crowd([
    { x: X[1] + 0.05, y: PL.height, z: 0.36, rot: 0.1, pose: 'pose' },
    { x: X[3] - 0.1, y: PL.height, z: 0.36, rot: -0.15, pose: 'wave' },
    { x: X[0] + 0.35, z: 1.0, rot: 0.2, pose: 'pose' },
    { x: -4.3, z: 3.9, rot: facing(-4.3, 3.9, -1.5, 0.5), pose: 'phone' }, { x: 5.8, z: 3.2, rot: facing(5.8, 3.2, 1.5, 0.5), pose: 'phone' },
    { x: X[2] + 0.45, z: 1.05, rot: -0.25, pose: 'stand' },
    { x: 6.8, z: 2.6, rot: -1.6, pose: 'walk' }, { x: -7.2, z: 3.8, rot: 1.5, pose: 'walk' }, { x: 3.5, z: -3.6, rot: 2.6, pose: 'stand' },
  ], 21);

  // Dimensions: their own layer, set clear of the numerals
  const dims = new THREE.Group();
  const zF = PL.z + PL.depth / 2;
  const xD = xL - PL.margin - 0.75;
  dims.add(dimLine([xD, 0, 0.2], [xD, topY, 0.2], `≈ ${Math.min(...LT.heights)}–${m(Math.max(...LT.heights))}`, { tick: [1, 0, 0], textHeight: 0.22 }));
  dims.add(dimLine([xL, 0.02, zF + 0.45], [xR, 0.02, zF + 0.45], `WORD ≈ ${m(wordW)}`, { tick: [0, 0, 1], textHeight: 0.22, textOffset: [0, 0.22, 0] }));
  const lbZ = LB.post.z + LB.depth + 0.2;
  dims.add(dimLine([-box.bw / 2, LB.top + 0.18, lbZ], [box.bw / 2, LB.top + 0.18, lbZ], `LIGHTBOX ${m(box.bw)}`, { tick: [0, 1, 0], textHeight: 0.2, textOffset: [0, 0.2, 0] }));
  const xT = xR + PL.margin + 0.75;
  dims.add(dimLine([xT, 0, 0.2], [xT, LB.top, 0.2], `TOP ≈ ${m(LB.top)}`, { tick: [1, 0, 0], textHeight: 0.22 }));

  const labels = [
    { id: 'letters', pos: [xL, topY + 0.1, 0.3], title: '2027 date letters',
      lines: [`Numerals ≈ ${Math.min(...LT.heights)}–${m(Math.max(...LT.heights))} tall · tilted ±6–9° (EST)`, `Staggered front / back by ≈ ${m(LT.stagger[0] - LT.stagger[1])}`, `One word ≈ ${m(wordW)} wide on a ${m(PL.height)} plinth`] },
    { id: 'art', pos: [X[2], PL.height + LT.heights[2] * 0.7, 0.4], title: 'Faces & returns',
      lines: ['Faces: flat palette colour, or KV / IP art', 'Returns: dark sticker edge (or art)', 'Edit artwork: placeholder / colour / image'] },
    { id: 'lightbox', pos: [box.bw / 2 + 0.2, LB.top - box.bh / 2, LB.post.z], title: 'OPF logo lightbox',
      lines: ['Sized to the logo file + 10% padding', 'Supplied logo, contain, lit at night', `Top ≈ ${m(LB.top)} · single post behind`] },
    { id: 'setting', pos: [-9, 6.4, -9], title: 'Setting', lines: ['Mall atrium (generic)', 'Balcony ring above'] },
  ];

  const nightLights = [];
  for (const [sx, sz] of [[4, 5], [-4, 5]]) {
    const s = new THREE.SpotLight('#ffd3a1', 7, 20, 0.5, 0.6, 1.4);
    s.position.set(sx, 5.1, sz);
    s.target.position.set(0, 1.2, 0);
    s.visible = false;
    install.add(s, s.target);
    nightLights.push(s);
  }

  return {
    install, setting, people, dims, labels, nightLights, glows: [faceMat],
    key: { pos: [-6, 14, -7], target: [0, 1.2, 0], extent: 10 },
  };
}

export function dateLettersPresets() {
  return {
    hero: { label: 'Hero 3/4', pos: [6.4, 2.2, 8.4], target: [0, 1.75, 0], fov: 46 },
    eye: { label: 'Eye level', pos: [1.0, 1.6, 6.2], target: [0, 1.8, 0], fov: 62 },
    front: { label: 'Front', pos: [0, 2.0, 11.5], target: [0, 1.95, 0], fov: 38 },
    crowd: { label: 'Crowd eye level', pos: [1.6, 1.6, 7.2], target: [0.2, 1.55, 0], fov: 55 },
    top: { label: 'Top-down', pos: [0, 70, 0.01], target: [0, 0, 0], fov: 12, plan: true },
    wide: { label: 'Wide context', pos: [15, 9, 18], target: [0, 2.2, -1], fov: 50 },
  };
}
