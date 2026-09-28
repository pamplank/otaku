// GIANT GACHAPON — ≈3.7 m capsule machine: branded body with crank and chute,
// clear dome with capsules in three tiers (common in palette colours, special
// silver, rare gold), a prize display panel beside it and a small queue.
import * as THREE from 'three';
import { machine as MC, capsules as CP, prizes as PZ, queue as QU, text as TX } from '../../config/gachapon.config.js';
import { assets as MAIN_ASSETS } from '../../stage.config.js';
import { mulberry32 } from '../build/people.js';
import { dimLine, textSprite } from '../booths/common.js';
import { drawLabel, drawText } from './art.js';
import { vinyl, paint, acrylic, metal, darkMetal, rubber, clearPlastic, col, PALETTE } from './materials.js';
import { concourse } from './settings.js';
import { crowd, facing } from './people.js';
import { FONT, FONT_BODY } from '../sticker.js';

const KV = ['assets/opf-kv.jpg'];
const m = (v) => `${+v.toFixed(2)} m`;

// Capsule: clear-ish top half + tier-coloured bottom half
const capGeo = { top: null, bottom: null };
function capsule(r, bottomMat, topMat) {
  capGeo.top ??= new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  capGeo.bottom ??= new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const g = new THREE.Group();
  const a = new THREE.Mesh(capGeo.top, topMat), b = new THREE.Mesh(capGeo.bottom, bottomMat);
  a.castShadow = b.castShadow = true;
  g.add(a, b);
  return g;
}

// Prize display placeholder: the three tiers with capsule icons (our graphic)
function drawPrizes(ctx, W, H, color) {
  drawLabel(ctx, W, H, { title: 'PRIZE DISPLAY\nIP ARTWORK – SUPPLIED BY CYBERE', sub: 'TIERS: COMMON · SPECIAL · RARE', color });
  const tiers = [['COMMON', [PALETTE.pink, PALETTE.cyan, PALETTE.yellow]], ['SPECIAL', ['#cfd3d8']], ['RARE', ['#d8ae45']]];
  const y0 = H * 0.08;
  tiers.forEach(([name, cols], i) => {
    const y = y0 + i * H * 0.075;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.roundRect(W * 0.1, y, W * 0.8, H * 0.06, H * 0.03); ctx.fill();
    ctx.fillStyle = PALETTE.dark;
    ctx.font = `${H * 0.03}px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(name, W * 0.16, y + H * 0.031);
    cols.forEach((c, k) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(W * (0.66 + k * 0.08), y + H * 0.03, H * 0.022, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.dark; ctx.stroke();
    });
  });
  ctx.fillStyle = PALETTE.dark;
  ctx.textAlign = 'center';
  ctx.font = `800 ${H * 0.026}px ${FONT_BODY}`;
  ctx.fillText(`GIVEAWAY · ${TX.giveaway}`, W / 2, H * 0.93, W * 0.9);
}

export function gachaponScene({ art }) {
  const install = new THREE.Group();
  const B = MC.body, PL = MC.plinth;
  const date = art.option('text.date', 'text', 'Date band', TX.date, 'Text');
  const bodyColor = art.option('color.body', 'color', 'Body', MC.color, 'Body colours');
  art.option('color.collar', 'color', 'Dome collar', MC.collarColor, 'Body colours');
  art.option('color.cap', 'color', 'Top knob', MC.capColor, 'Body colours');
  art.option('color.crank', 'color', 'Crank', MC.crankColor, 'Body colours');

  // Plinth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(PL.width, PL.height, PL.depth), paint('dark', { roughness: 0.35 }));
  plinth.position.y = PL.height / 2;
  plinth.castShadow = plinth.receiveShadow = true;
  install.add(plinth);

  // Body: front (KV), sides (IP art), back (sponsor) are slots
  const yb = PL.height, yc = yb + B.height / 2;
  const slotFace = (key, title, w, h, kind, assets = []) => art.slot(key, {
    title, w, h, body: bodyColor, assets,
    placeholder: (ctx, W, H) => drawLabel(ctx, W, H, {
      title: { kv: 'KV PLACEHOLDER', ip: 'IP ARTWORK\n– SUPPLIED BY CYBERE', sponsor: 'SPONSOR SLOT' }[kind],
      sub: `${m(w)} × ${m(h)}`, color: bodyColor(),
    }),
  });
  const front = slotFace('gachaFront', 'Body front (KV)', B.width, B.height, 'kv', KV);
  const left = slotFace('gachaLeft', 'Body left side', B.depth, B.height, 'ip');
  const right = slotFace('gachaRight', 'Body right side', B.depth, B.height, 'ip');
  const back = slotFace('gachaBack', 'Body back', B.width, B.height, 'sponsor');
  const topMat = paint(MC.color, { roughness: 0.35 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(B.width, B.height, B.depth),
    [vinyl(right.tex), vinyl(left.tex), topMat, topMat, vinyl(front.tex), vinyl(back.tex)]);
  body.position.y = yc;
  body.castShadow = body.receiveShadow = true;
  install.add(body);
  // body corner trims (palette colour)
  const trimMat = paint(MC.color, { roughness: 0.3 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.05, B.height + 0.02, 0.05), trimMat);
    t.position.set(sx * B.width / 2, yc, sz * B.depth / 2);
    install.add(t);
  }
  const zf = B.depth / 2;

  // Logo panel (top of the front) + date band (bottom of the front)
  const logo = art.slot('gachaLogo', {
    title: 'OPF logo panel', w: 1.3, h: 0.36, body: () => 'white', assets: MAIN_ASSETS.logo,
    placeholder: (ctx, W, H) => drawLabel(ctx, W, H, { title: 'OPF LOGO', sub: 'SUPPLIED FILE ONLY', color: 'white' }),
  });
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.44, 0.04), acrylic('white'));
  board.position.set(0, yb + B.height - 0.3, zf + 0.02);
  const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.36), vinyl(logo.tex, { roughness: 0.3 }));
  logoMesh.position.set(0, yb + B.height - 0.3, zf + 0.041);
  install.add(board, logoMesh);
  const dateSlot = art.slot('gachaDate', {
    title: 'Date band', w: 1.4, h: 0.18, body: () => 'dark',
    placeholder: (ctx, W, H) => drawText(ctx, W, H, date(), 'dark'),
  });
  const dateMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.18), vinyl(dateSlot.tex, { roughness: 0.35 }));
  dateMesh.position.set(0, yb + 0.14, zf + 0.004);
  install.add(dateMesh);

  // Crank
  const C = MC.crank;
  const crankMat = paint(MC.crankColor, { roughness: 0.3 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(C.radius, C.radius, 0.08, 40), crankMat);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(C.x, yb + C.y, zf + 0.04);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 24), metal());
  hub.rotation.x = Math.PI / 2;
  hub.position.set(C.x, yb + C.y, zf + 0.12);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.05), metal());
  arm.position.set(C.x + 0.13, yb + C.y + 0.08, zf + 0.16);
  arm.rotation.z = 0.35;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 14), acrylic('white'));
  knob.position.set(C.x + 0.32, yb + C.y + 0.16, zf + 0.2);
  for (const o of [disc, hub, arm, knob]) o.castShadow = true;
  install.add(disc, hub, arm, knob);

  // Chute: dark recess, clear flap, metal tray lip
  const CH = MC.chute;
  const recess = new THREE.Mesh(new THREE.BoxGeometry(CH.width, CH.height, 0.02), new THREE.MeshStandardMaterial({ color: '#141315', roughness: 0.8 }));
  recess.position.set(CH.x, yb + CH.y, zf + 0.012);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(CH.width + 0.08, CH.height + 0.08, 0.02), metal());
  rim.position.set(CH.x, yb + CH.y, zf + 0.006);
  const flap = new THREE.Mesh(new THREE.BoxGeometry(CH.width - 0.04, CH.height - 0.06, 0.01), acrylic('#d9eef5', { transparent: true, opacity: 0.45 }));
  flap.position.set(CH.x, yb + CH.y + 0.01, zf + 0.04);
  flap.rotation.x = -0.25;
  const tray = new THREE.Mesh(new THREE.BoxGeometry(CH.width + 0.1, 0.05, 0.16), metal());
  tray.position.set(CH.x, yb + CH.y - CH.height / 2 - 0.02, zf + 0.08);
  install.add(rim, recess, flap, tray);

  // Collar, dome, top knob
  const CO = MC.collar, D = MC.dome, CA = MC.cap;
  const collarMat = paint(MC.collarColor, { roughness: 0.3 });
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(CO.radius, CO.radius * 1.03, CO.height, 64), collarMat);
  const yCollar = yb + B.height;
  collar.position.y = yCollar + CO.height / 2;
  collar.castShadow = true;
  install.add(collar);
  const yDome = yCollar + CO.height + D.radius * 0.78;
  const cut = Math.acos((yCollar + CO.height - yDome) / D.radius);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(D.radius, 64, 40, 0, Math.PI * 2, 0, cut), clearPlastic());
  dome.position.y = yDome;
  dome.renderOrder = 2;
  install.add(dome);
  const capMat = paint(MC.capColor, { roughness: 0.3 });
  const yTop = yDome + D.radius;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(CA.radius * 0.8, CA.radius, CA.height * 0.6, 40), capMat);
  cap.position.y = yTop - 0.02 + CA.height * 0.3;
  const capDome = new THREE.Mesh(new THREE.SphereGeometry(CA.radius * 0.8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
  capDome.scale.y = 0.55;
  capDome.position.y = yTop - 0.02 + CA.height * 0.6;
  cap.castShadow = capDome.castShadow = true;
  install.add(cap, capDome);
  const overall = capDome.position.y + CA.radius * 0.8 * 0.55;

  // Capsules in three tiers, packed in the lower part of the dome
  const rand = mulberry32(CP.seed);
  const clearTop = acrylic('#ffffff', { transparent: true, opacity: 0.72, roughness: 0.12 });
  const tierMats = {
    common: ['pink', 'cyan', 'yellow', 'white'].map((c) => acrylic(c, { roughness: 0.18 })),
    special: [new THREE.MeshStandardMaterial({ color: '#cfd3d8', metalness: 1, roughness: 0.22 })],
    rare: [new THREE.MeshStandardMaterial({ color: '#d8ae45', metalness: 1, roughness: 0.2 })],
  };
  const list = [...Array(CP.common).fill('common'), ...Array(CP.special).fill('special'), ...Array(CP.rare).fill('rare')]
    .map((t) => ({ t, k: rand() })).sort((a, b) => a.k - b.k).map((o) => o.t);
  const placed = [];
  const r = CP.radius, inner = D.radius - r - 0.03;
  const floorY = yCollar + CO.height + r;
  for (const tier of list) {
    for (let tries = 0; tries < 400; tries++) {
      const x = (rand() * 2 - 1) * inner, z = (rand() * 2 - 1) * inner;
      // settle low: try the lowest free height at (x, z)
      let y = floorY + rand() * 0.02;
      for (const p of placed) {
        const dxz = Math.hypot(p.x - x, p.z - z);
        if (dxz < 2 * r) y = Math.max(y, p.y + Math.sqrt(4 * r * r - dxz * dxz));
      }
      if ((x ** 2 + (y - yDome) ** 2 + z ** 2) > inner * inner) continue;
      if (y > yDome + 0.1) continue;
      placed.push({ x, y, z, tier });
      break;
    }
  }
  const capsGroup = new THREE.Group();
  placed.forEach((p, i) => {
    const mats = tierMats[p.tier];
    const c = capsule(r, mats[i % mats.length], clearTop);
    c.position.set(p.x, p.y, p.z);
    c.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    capsGroup.add(c);
  });
  install.add(capsGroup);

  art.onChange((get) => {
    const c = col(get('color.body') ?? MC.color);
    topMat.color.set(c);
    trimMat.color.set(c);
    collarMat.color.set(col(get('color.collar') ?? MC.collarColor));
    capMat.color.set(col(get('color.cap') ?? MC.capColor));
    crankMat.color.set(col(get('color.crank') ?? MC.crankColor));
  });

  // Prize display panel beside the machine
  const prizes = art.slot('gachaPrizes', {
    title: 'Prize display panel', w: PZ.width, h: PZ.height, body: () => 'white', px: 1400,
    placeholder: (ctx, W, H) => drawPrizes(ctx, W, H, 'white'),
  });
  const pg = new THREE.Group();
  const pboard = new THREE.Mesh(new THREE.BoxGeometry(PZ.width + 0.06, PZ.height + 0.06, 0.04), paint(MC.color, { roughness: 0.35 }));
  pboard.position.y = PZ.bottom + PZ.height / 2;
  pboard.castShadow = true;
  const pface = new THREE.Mesh(new THREE.PlaneGeometry(PZ.width, PZ.height), vinyl(prizes.tex, { roughness: 0.4 }));
  pface.position.set(0, PZ.bottom + PZ.height / 2, 0.021);
  const pfoot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.5), darkMetal());
  pfoot.position.y = 0.015;
  const ppost = new THREE.Mesh(new THREE.BoxGeometry(0.06, PZ.bottom + 0.2, 0.06), metal());
  ppost.position.set(0, (PZ.bottom + 0.2) / 2, -0.05);
  pg.add(pboard, pface, pfoot, ppost);
  pg.position.set(PZ.x, 0, PZ.z);
  pg.rotation.y = THREE.MathUtils.degToRad(PZ.turn);
  install.add(pg);
  art.onChange((get) => pboard.material.color.set(col(get('color.body') ?? MC.color)));

  // Queue: belt stanchions + people; one at the crank
  const post = (x, z) => {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 12), metal());
    p.position.y = 0.475;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 20), darkMetal());
    b.position.y = 0.015;
    g.add(p, b);
    g.position.set(x, 0, z);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return g;
  };
  const beltMat = new THREE.MeshStandardMaterial({ color: '#242224', roughness: 0.6 });
  for (const lx of [QU.x - 0.5, QU.x + 0.5]) {
    const zs = [1.4, 2.6, 3.8];
    zs.forEach((z) => install.add(post(lx, z)));
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.05, zs[2] - zs[0]), beltMat);
    belt.position.set(lx, 0.89, (zs[0] + zs[2]) / 2);
    install.add(belt);
  }
  const people = crowd([
    { x: C.x + 0.15, z: zf + 0.6, rot: Math.PI, pose: 'stand' },
    { x: QU.x, z: 1.8, rot: facing(QU.x, 1.8, 0, 0), pose: 'stand' },
    { x: QU.x, z: 2.6, rot: Math.PI, pose: 'phone' },
    { x: QU.x, z: 3.4, rot: Math.PI, pose: 'stand' },
    { x: 1.2, z: 4.4, rot: facing(1.2, 4.4, 0, 0.8), pose: 'phone' },
    { x: -5, z: 4.5, rot: 1.6, pose: 'walk' }, { x: 5.5, z: -1.5, rot: -1.2, pose: 'walk' },
  ], 41);

  // Dimensions + the giveaway annotation (Labels toggle)
  const dims = new THREE.Group();
  dims.add(dimLine([-B.width / 2 - 0.25, 0, -B.depth / 2 - 0.3], [-B.width / 2 - 0.25, overall, -B.depth / 2 - 0.3], `≈ ${m(overall)}`, { tick: [1, 0, 0], textHeight: 0.24, textOffset: [0, 0.6, 0] }));
  dims.add(dimLine([-B.width / 2, yb + B.height + 0.35, zf + 0.25], [B.width / 2, yb + B.height + 0.35, zf + 0.25], `BODY ${m(B.width)}`, { tick: [0, 1, 0], textHeight: 0.2 }));
  const give = textSprite(`GIVEAWAY · ${TX.giveaway}`, { height: 0.14, bg: PALETTE.yellow });
  give.position.set(PZ.x, PZ.bottom + PZ.height + 0.3, PZ.z);
  dims.add(give);

  const labels = [
    { id: 'machine', pos: [B.width / 2 + 0.2, overall, 0], title: 'Giant gachapon',
      lines: [`≈ ${m(overall)} overall`, `Body ${m(B.width)} × ${m(B.depth)} × ${m(B.height)} (EST)`, `Clear dome Ø${m(2 * D.radius)}`] },
    { id: 'capsules', pos: [0, yDome + 0.2, D.radius], title: 'Capsules · 3 tiers',
      lines: [`Common ×${CP.common} (palette colours)`, `Special ×${CP.special} (silver) · Rare ×${CP.rare} (gold)`, `Ø${m(2 * r)} capsules (EST)`] },
    { id: 'giveaway', pos: [CH.x, yb + CH.y + 0.3, zf + 0.2], title: 'Giveaway',
      lines: [TX.giveaway, 'Crank it, get a capsule', 'Prize panel beside the machine (slot)'] },
    { id: 'queue', pos: [QU.x, 1.3, 3.8], title: 'Queue', lines: ['Short belt-stanchion lane', `${QU.people} people shown`] },
  ];

  const nightLights = [];
  for (const [x, z] of [[3, 3.5], [-3, 3]]) {
    const s = new THREE.SpotLight('#ffd3a1', 7, 16, 0.5, 0.6, 1.4);
    s.position.set(x, 5.8, z);
    s.target.position.set(0, 1.6, 0);
    s.visible = false;
    install.add(s, s.target);
    nightLights.push(s);
  }

  return {
    install, setting: concourse(), people, dims, labels, nightLights,
    key: { pos: [-6, 14, -6], target: [0.5, 1.5, 0], extent: 9 },
  };
}

export function gachaponPresets() {
  return {
    hero: { label: 'Hero 3/4', pos: [5.2, 2.6, 6.2], target: [0.5, 1.85, 0], fov: 46 },
    eye: { label: 'Eye level', pos: [0.5, 1.6, 4.8], target: [0.3, 2.0, 0], fov: 60 },
    front: { label: 'Front', pos: [0.6, 1.9, 8.5], target: [0.6, 1.85, 0], fov: 38 },
    top: { label: 'Top-down', pos: [0.6, 50, 1.01], target: [0.6, 0, 1], fov: 13, plan: true },
    wide: { label: 'Wide context', pos: [10.5, 6, 12], target: [0.6, 1.5, 0], fov: 50 },
  };
}
