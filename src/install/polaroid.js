// GIANT POLAROID FRAME — walk-in instant-photo frame with the classic thick
// bottom strip, on a weighted base with lockable casters, on a mall walkway.
// Fully designed: KV on the border, OPF logo + date line on the strip, each its
// own slot.
import * as THREE from 'three';
import { frame as FR, base as BA, text as TX } from '../../config/polaroid.config.js';
import { assets as MAIN_ASSETS } from '../../stage.config.js';
import { splitCaps } from '../slots.js';
import { dimLine } from '../booths/common.js';
import { drawLabel, drawText } from './art.js';
import { vinyl, paint, metal, darkMetal, rubber, col } from './materials.js';
import { walkway } from './settings.js';
import { crowd } from './people.js';

const KV = ['assets/opf-kv.jpg'];
const m = (v) => `${+v.toFixed(2)} m`;

function caster(x, z) {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.12), darkMetal());
  plate.position.y = BA.caster - 0.006;
  const fork = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.05), darkMetal());
  fork.position.y = BA.caster - 0.045;
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.03, 20), rubber());
  wheel.rotation.x = Math.PI / 2;
  wheel.rotation.z = Math.PI / 2;
  wheel.position.y = 0.038;
  const brake = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.07), paint('pink'));
  brake.position.set(0, 0.07, 0.06);
  brake.rotation.x = -0.35;
  g.add(plate, fork, wheel, brake);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.position.set(x, 0, z);
  return g;
}

export function polaroidScene({ art }) {
  const install = new THREE.Group();
  const y0 = BA.caster + BA.plate;                      // frame stands on the base
  const H = FR.top - y0, W = FR.width, b = FR.border, S = FR.strip;
  const date = art.option('text.date', 'text', 'Strip text', TX.date, 'Text');
  const frameColor = art.option('color.frame', 'color', 'Frame', FR.color, 'Body colours');
  const stripColor = art.option('color.strip', 'color', 'Bottom strip', FR.stripColor, 'Body colours');
  art.option('color.base', 'color', 'Base', 'dark', 'Body colours');

  // Frame: outline with the photo opening cut out; the front carries the border art
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, 0); shape.lineTo(W / 2, 0); shape.lineTo(W / 2, H); shape.lineTo(-W / 2, H); shape.lineTo(-W / 2, 0);
  const hole = new THREE.Path();
  hole.moveTo(-W / 2 + b, S); hole.lineTo(-W / 2 + b, H - b); hole.lineTo(W / 2 - b, H - b); hole.lineTo(W / 2 - b, S); hole.lineTo(-W / 2 + b, S);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: FR.depth, bevelEnabled: false, curveSegments: 4 });
  splitCaps(geo);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + W / 2) / W, pos.getY(i) / H);
  geo.translate(0, 0, -FR.depth / 2);
  const border = art.slot('polaroidBorder', {
    title: 'Frame border (KV)', w: W, h: H, body: frameColor, assets: KV, fit: 'cover', px: 1536,
    placeholder: (ctx, Wp, Hp) => drawLabel(ctx, Wp, Hp, { title: 'KV PLACEHOLDER', sub: `BORDER · ${m(W)} × ${m(H)} (OPENING CUT OUT)`, color: frameColor() }),
  });
  const edgeMat = paint(FR.color, { roughness: 0.4 });
  const frame = new THREE.Mesh(geo, [vinyl(border.tex, { roughness: 0.4 }), edgeMat, edgeMat]);
  frame.castShadow = frame.receiveShadow = true;
  frame.position.y = y0;
  install.add(frame);

  // Bottom strip ground + logo + date line (each its own slot)
  const stripMat = paint(FR.stripColor, { roughness: 0.4 });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(W, S, 0.012), stripMat);
  strip.position.set(0, y0 + S / 2, FR.depth / 2 + 0.006);
  strip.receiveShadow = true;
  install.add(strip);
  const logoW = 1.0, logoH = 0.4, dateW = 1.12, dateH = 0.26;
  const logo = art.slot('polaroidLogo', {
    title: 'OPF logo (strip)', w: logoW, h: logoH, body: stripColor, assets: MAIN_ASSETS.logo,
    placeholder: (ctx, Wp, Hp) => drawLabel(ctx, Wp, Hp, { title: 'OPF LOGO', sub: 'SUPPLIED FILE ONLY', color: stripColor() }),
  });
  const dateSlot = art.slot('polaroidDate', {
    title: 'Date line (strip)', w: dateW, h: dateH, body: stripColor,
    placeholder: (ctx, Wp, Hp) => drawText(ctx, Wp, Hp, date(), stripColor(), { ink: '#242224' }),
  });
  const zStrip = FR.depth / 2 + 0.013;
  const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(logoW, logoH), vinyl(logo.tex, { roughness: 0.4 }));
  logoMesh.position.set(-W / 2 + 0.12 + logoW / 2, y0 + S / 2 + 0.02, zStrip);
  const dateMesh = new THREE.Mesh(new THREE.PlaneGeometry(dateW, dateH), vinyl(dateSlot.tex, { roughness: 0.4 }));
  dateMesh.position.set(W / 2 - 0.1 - dateW / 2, y0 + S / 2 - 0.02, zStrip);
  install.add(logoMesh, dateMesh);

  // Back: plain frame colour; weighted base on lockable casters; rear struts
  const baseMat = darkMetal();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(BA.width, BA.plate, BA.depth), baseMat);
  plate.position.y = BA.caster + BA.plate / 2;
  plate.castShadow = plate.receiveShadow = true;
  install.add(plate);
  const bl = BA.ballast;
  for (const sx of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(bl.width, bl.height, bl.depth), paint('dark', { roughness: 0.6 }));
    w.position.set(sx * (BA.width / 2 - bl.width / 2 - 0.08), y0 + bl.height / 2, -BA.depth / 2 + bl.depth / 2 + 0.04);
    w.castShadow = true;
    install.add(w);
    const len = 1.9;
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 10), metal());
    const top = new THREE.Vector3(sx * (W / 2 - 0.3), y0 + 1.55, -FR.depth / 2 - 0.02);
    const bottom = new THREE.Vector3(sx * (W / 2 - 0.3), y0 + 0.02, -BA.depth / 2 + 0.05);
    strut.position.copy(top).add(bottom).multiplyScalar(0.5);
    strut.scale.y = top.distanceTo(bottom) / len;
    strut.lookAt(top);
    strut.rotateX(Math.PI / 2);
    strut.castShadow = true;
    install.add(strut);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) install.add(caster(sx * (BA.width / 2 - 0.12), sz * (BA.depth / 2 - 0.12)));
  art.onChange((get) => {
    edgeMat.color.set(col(get('color.frame') ?? FR.color));
    stripMat.color.set(col(get('color.strip') ?? FR.stripColor));
    baseMat.color.set(col(get('color.base') ?? 'dark'));
  });

  const setting = walkway();
  setting.group.rotation.y = Math.PI / 2;               // walkway runs along z
  install.position.x = -1.8;

  const X = -1.8;
  const people = crowd([
    { x: X - 0.35, z: -0.85, rot: 0.1, pose: 'pose' }, { x: X + 0.4, z: -0.8, rot: -0.1, pose: 'wave' },
    { x: X + 0.3, z: 3.2, rot: Math.PI, pose: 'phone' },
    { x: 2.2, z: 5.5, rot: Math.PI, pose: 'walk' }, { x: 1.4, z: -6, rot: 0.1, pose: 'walk' }, { x: 3.0, z: 1.5, rot: -2.4, pose: 'stand' },
  ], 31);

  const dims = new THREE.Group();
  dims.add(dimLine([X + W / 2 + 0.35, 0, 0.1], [X + W / 2 + 0.35, FR.top, 0.1], `≈ ${m(FR.top)}`, { tick: [1, 0, 0], textHeight: 0.22 }));
  dims.add(dimLine([X - W / 2, FR.top + 0.18, 0.1], [X + W / 2, FR.top + 0.18, 0.1], m(W), { tick: [0, 1, 0], textHeight: 0.2 }));
  dims.add(dimLine([X - W / 2 - 0.25, y0, 0.1], [X - W / 2 - 0.25, y0 + S, 0.1], `STRIP ${m(S)}`, { tick: [1, 0, 0], textHeight: 0.18, textOffset: [-0.35, 0, 0] }));

  const labels = [
    { id: 'frame', pos: [X - W / 2, FR.top + 0.2, 0], title: 'Giant polaroid frame',
      lines: [`≈ ${m(FR.top)} tall · ${m(W)} wide (EST)`, `Border ${m(b)} · bottom strip ${m(S)} (EST)`, 'Walk-in: pose behind the opening'] },
    { id: 'strip', pos: [X, y0 + S + 0.1, 0.2], title: 'Bottom strip',
      lines: ['OPF logo slot + date line slot', `"${TX.date}" (editable)`, 'Border: KV slot'] },
    { id: 'base', pos: [X + BA.width / 2, y0 + 0.2, BA.depth / 2], title: 'Movable base',
      lines: [`Weighted steel base ${m(BA.width)} × ${m(BA.depth)} (EST)`, '4 lockable casters · ballast at the back', 'Two rear struts'] },
    { id: 'setting', pos: [5, 4.2, -8], title: 'Setting', lines: ['Mall walkway (generic shopfronts)'] },
  ];

  const nightLights = [];
  const s = new THREE.SpotLight('#ffd3a1', 6, 14, 0.5, 0.6, 1.4);
  s.position.set(X + 1.5, 4.5, 3.5);
  s.target.position.set(X, 1.6, 0);
  s.visible = false;
  nightLights.push(s);
  const extras = new THREE.Group();
  extras.add(s, s.target);

  const group = new THREE.Group();
  group.add(install, extras);
  return {
    install: group, setting, people, dims, labels, nightLights,
    key: { pos: [-7, 13, -6], target: [X, 1, 0], extent: 9 },
  };
}

export function polaroidPresets() {
  const X = -1.8;
  return {
    hero: { label: 'Hero 3/4', pos: [X + 4.2, 1.9, 5.2], target: [X, 1.65, 0], fov: 46 },
    eye: { label: 'Eye level', pos: [X + 0.3, 1.6, 4.4], target: [X, 1.8, 0], fov: 58 },
    front: { label: 'Front', pos: [X, 1.7, 7.2], target: [X, 1.65, 0], fov: 38 },
    top: { label: 'Top-down', pos: [X + 1.5, 50, 0.01], target: [X + 1.5, 0, 0], fov: 16, plan: true },
    wide: { label: 'Wide context', pos: [X + 9, 5.2, 12], target: [X + 1.5, 1.5, -2], fov: 52 },
  };
}
