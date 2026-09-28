// GIANT POLAROID FRAME — a walk-in instant photo in the sticker style: white
// frame with thin top/sides and a deep chin, rounded corners, thick dark outline,
// hard pink offset panel, leaning a little; sparkle stars breaking out of the
// edges; a burst backdrop behind the opening; LED strip round the opening; floor
// decals; a white kick plate hiding the movable base (castors just showing).
import * as THREE from 'three';
import { frame as FR, base as BA, backdrop as BD, stars as STARS, decals as DC, text as TX } from '../../config/polaroid.config.js';
import { assets as MAIN_ASSETS, palette as P } from '../../stage.config.js';
import { dimLine } from '../booths/common.js';
import { FONT, FONT_BODY } from '../sticker.js';
import { drawLabel } from './art.js';
import { vinyl, paint, darkMetal, rubber, glowPanel, col } from './materials.js';
import { walkway } from './settings.js';
import { crowd, facing } from './people.js';
import { extrude, capSideUVs, starShapes, stickerSolid } from './sticker3d.js';

const m = (v) => `${+v.toFixed(2)} m`;
const FONT_HAND = '"Caveat", "Comic Sans MS", cursive';
const X = -1.8;                                   // frame position on the walkway

function roundRect(path, x0, y0, x1, y1, r) {
  path.moveTo(x0 + r, y0);
  path.lineTo(x1 - r, y0); path.quadraticCurveTo(x1, y0, x1, y0 + r);
  path.lineTo(x1, y1 - r); path.quadraticCurveTo(x1, y1, x1 - r, y1);
  path.lineTo(x0 + r, y1); path.quadraticCurveTo(x0, y1, x0, y1 - r);
  path.lineTo(x0, y0 + r); path.quadraticCurveTo(x0, y0, x0 + r, y0);
  return path;
}
// Frame outline (grown by g) with the photo opening (shrunk by g) cut out;
// shift moves the opening (the offset panel's lines up with the frame's)
function frameShape(W, H, g = 0, [sx, sy] = [0, 0]) {
  const s = roundRect(new THREE.Shape(), -W / 2 - g, -g, W / 2 + g, H + g, FR.corner + g);
  const b = FR.border;
  const hole = new THREE.Path();
  const [x0, y0, x1, y1, r] = [-W / 2 + b + g + sx, FR.strip + g + sy, W / 2 - b - g + sx, H - b - g + sy, 0.025];
  hole.moveTo(x0 + r, y0); hole.quadraticCurveTo(x0, y0, x0, y0 + r); hole.lineTo(x0, y1 - r); hole.quadraticCurveTo(x0, y1, x0 + r, y1);
  hole.lineTo(x1 - r, y1); hole.quadraticCurveTo(x1, y1, x1, y1 - r); hole.lineTo(x1, y0 + r); hole.quadraticCurveTo(x1, y0, x1 - r, y0);
  hole.lineTo(x0 + r, y0);
  s.holes.push(hole);
  return s;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function decal(size, draw) {
  const mat = new THREE.MeshStandardMaterial({ map: canvasTex(1024, 1024, draw), transparent: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}
function tag(ctx, text, cx, cy, h, fill) {
  ctx.font = `${h * 0.56}px ${FONT}`;
  const w = ctx.measureText(text).width + h * 0.9;
  ctx.fillStyle = P.dark;
  ctx.beginPath(); ctx.roundRect(cx - w / 2 + h * 0.08, cy - h / 2 + h * 0.08, w, h, h * 0.3); ctx.fill();
  ctx.fillStyle = fill;
  ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h * 0.3); ctx.fill();
  ctx.lineWidth = h * 0.08; ctx.strokeStyle = P.dark; ctx.stroke();
  ctx.fillStyle = P.dark; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + h * 0.03);
}
function footprint(ctx, x, y, s, flip) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(flip ? -1 : 1, 1); ctx.rotate(-0.08);
  const sole = () => { ctx.beginPath(); ctx.ellipse(0, -s * 0.28, s * 0.36, s * 0.62, 0.08, 0, Math.PI * 2); };
  const heel = () => { ctx.beginPath(); ctx.ellipse(-s * 0.04, s * 0.72, s * 0.27, s * 0.3, 0, 0, Math.PI * 2); };
  for (const f of [sole, heel]) { f(); ctx.fillStyle = P.pink; ctx.fill(); ctx.lineWidth = s * 0.09; ctx.strokeStyle = P.dark; ctx.stroke(); }
  ctx.restore();
}

// Burst + halftone backdrop (the placeholder until artwork is uploaded)
function burst(ctx, w, h) {
  ctx.fillStyle = P.yellow;
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.46, R = Math.hypot(w, h);
  const n = 28;
  ctx.fillStyle = P.pink;
  for (let i = 0; i < n; i += 2) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a0), cy + R * Math.sin(a0)); ctx.lineTo(cx + R * Math.cos(a1), cy + R * Math.sin(a1)); ctx.fill();
  }
  // halftone: cyan dots growing towards the edges
  const step = w / 34;
  ctx.fillStyle = P.cyan;
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2 + ((y / step) % 2 ? step / 2 : 0); x < w; x += step) {
      const d = Math.hypot(x - cx, y - cy) / (R * 0.5);
      const r = step * 0.5 * Math.max(0, Math.min(1, (d - 0.45) * 1.3));
      if (r > 0.5) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  ctx.fillStyle = P.white;
  ctx.beginPath(); ctx.arc(cx, cy, w * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = w * 0.012; ctx.strokeStyle = P.dark; ctx.stroke();
  // small label: this is placeholder art
  ctx.font = `800 ${w * 0.022}px ${FONT_BODY}`;
  const t = `BACKDROP ARTWORK · ${BD.width} × ${BD.height} M · PLACEHOLDER`;
  const tw = ctx.measureText(t).width + w * 0.04;
  ctx.fillStyle = P.white;
  ctx.beginPath(); ctx.roundRect(w * 0.03, h - w * 0.075, tw, w * 0.045, w * 0.012); ctx.fill();
  ctx.fillStyle = P.dark; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(t, w * 0.05, h - w * 0.0525);
}

export function polaroidScene({ art }) {
  const install = new THREE.Group();
  const W = FR.width, Hf = FR.top - FR.bottom, b = FR.border, S = FR.strip, o = FR.outline, D = FR.depth;
  const lean = THREE.MathUtils.degToRad(FR.lean);
  const dateText = art.option('text.dateTag', 'text', 'Date tag', TX.date, 'Text');
  const hashText = art.option('text.hashtag', 'text', 'Hashtag', TX.hashtag, 'Text');
  const frameColor = art.option('color.frame', 'color', 'Frame', FR.color, 'Body colours');
  const stripColor = art.option('color.strip', 'color', 'Chin (bottom strip)', FR.stripColor, 'Body colours');
  const kickColor = art.option('color.base', 'color', 'Kick plate', 'white', 'Body colours');
  const darkMat = paint('dark', { roughness: 0.45 });

  // ─── The frame (leaning group, pivot at its bottom centre) ───
  const fg = new THREE.Group();
  fg.position.set(0, FR.bottom, 0);
  fg.rotation.z = lean;
  install.add(fg);

  const faceShapes = [frameShape(W, Hf)];
  const faceGeo = extrude(faceShapes, D, 0.006);
  capSideUVs(faceGeo, faceShapes);
  faceGeo.translate(0, 0, -D / 2);
  const border = art.slot('polaroidBorder', {
    title: 'Frame face (border + chin)', w: W, h: Hf, body: frameColor, assets: ['assets/opf-kv.jpg'], fit: 'cover', px: 1536, defaultMode: 'colour',
    placeholder: (ctx, Wp, Hp) => drawLabel(ctx, Wp, Hp, { title: 'KV PLACEHOLDER', sub: `FRAME FACE · ${m(W)} × ${m(Hf)} (OPENING CUT OUT)`, color: frameColor() }),
  });
  const edgeMat = paint(FR.color, { roughness: 0.4 });
  const face = new THREE.Mesh(faceGeo, [vinyl(border.tex, { roughness: 0.38 }), edgeMat, edgeMat]);
  face.castShadow = face.receiveShadow = true;
  fg.add(face);

  // Thick dark outline: the frame grown outwards, opening shrunk inwards, just behind the face
  const outlineGeo = extrude([frameShape(W, Hf, o)], D + 0.02, 0.006);
  outlineGeo.translate(0, 0, -D / 2 - 0.03);
  const outline = new THREE.Mesh(outlineGeo, darkMat);
  outline.castShadow = outline.receiveShadow = true;
  fg.add(outline);

  // Hard pink offset back panel; its back is a labelled artwork slot
  // (its opening is cut wider, so the offset shows outside the frame only)
  const backShapes = [frameShape(W, Hf, o, [-FR.shadow.x, -FR.shadow.y])];
  const backGeo = extrude(backShapes, 0.04, 0.004);
  capSideUVs(backGeo, backShapes);
  const uv = backGeo.attributes.uv;                    // the back cap reads the right way round from behind
  for (const g of backGeo.groups) if (g.materialIndex === 2) for (let i = g.start; i < g.start + g.count; i++) uv.setX(i, 1 - uv.getX(i));
  backGeo.translate(FR.shadow.x, FR.shadow.y, -D / 2 - 0.09);
  const back = art.slot('polaroidBack', {
    title: 'Back of the frame', w: W + 2 * o, h: Hf + 2 * o, body: () => FR.shadow.color, px: 1536,
    placeholder: (ctx, Wp, Hp) => drawLabel(ctx, Wp, Hp, { title: 'IP ARTWORK\n– SUPPLIED BY CYBERE', sub: `FRAME BACK · ${m(W + 2 * o)} × ${m(Hf + 2 * o)}`, color: FR.shadow.color }),
  });
  const pinkMat = paint(FR.shadow.color, { roughness: 0.45 });
  const pink = new THREE.Mesh(backGeo, [pinkMat, pinkMat, vinyl(back.tex, { roughness: 0.5 })]);
  pink.castShadow = true;
  fg.add(pink);

  // LED strip round the inside of the opening (subtle white by day, glowing at night)
  const ledMat = glowPanel('#fff6ea', 0.3, 2.6);
  const lw = 0.024, zf = D / 2 + 0.002;
  const [ox0, oy0, ox1, oy1] = [-W / 2 + b + o / 2, S + o / 2, W / 2 - b - o / 2, Hf - b - o / 2];
  for (const [cx, cy, sw, sh] of [[ox0, (oy0 + oy1) / 2, lw, oy1 - oy0], [ox1, (oy0 + oy1) / 2, lw, oy1 - oy0],
    [(ox0 + ox1) / 2, oy0, ox1 - ox0, lw], [(ox0 + ox1) / 2, oy1, ox1 - ox0, lw]]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, 0.012), ledMat);
    strip.position.set(cx, cy, zf - 0.01);
    fg.add(strip);
  }

  // Chin: OPF logo (left), handwritten date tag + hashtag (right), each a slot
  const zc = D / 2 + 0.004;
  const logo = art.slot('polaroidLogo', {
    title: 'OPF logo (chin)', w: 0.95, h: 0.36, body: stripColor, assets: MAIN_ASSETS.logo, fit: 'contain', fixedFit: true,
    placeholder: (ctx, Wp, Hp) => drawLabel(ctx, Wp, Hp, { title: 'OPF LOGO', sub: 'SUPPLIED FILE ONLY · CONTAIN', color: stripColor() }),
  });
  const dateSlot = art.slot('polaroidDate', {
    title: 'Date tag (handwritten)', w: 0.95, h: 0.24, body: stripColor,
    placeholder: (ctx, Wp, Hp) => {
      ctx.fillStyle = col(stripColor()); ctx.fillRect(0, 0, Wp, Hp);
      ctx.fillStyle = P.dark; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Hp * 0.8}px ${FONT_HAND}`;
      const t = dateText(), tw = ctx.measureText(t).width;
      if (tw > Wp * 0.94) ctx.font = `700 ${(Hp * 0.8 * Wp * 0.94) / tw}px ${FONT_HAND}`;
      ctx.fillText(t, Wp / 2, Hp * 0.54);
    },
  });
  document.fonts?.load(`700 64px ${FONT_HAND}`).then(() => dateSlot.redraw()).catch(() => {});
  const hashSlot = art.slot('polaroidHashtag', {
    title: 'Hashtag (chin)', w: 0.62, h: 0.13, body: stripColor,
    placeholder: (ctx, Wp, Hp) => {
      ctx.fillStyle = col(stripColor()); ctx.fillRect(0, 0, Wp, Hp);
      ctx.setLineDash([Hp * 0.12, Hp * 0.08]); ctx.lineWidth = Hp * 0.05; ctx.strokeStyle = '#8a878b';
      ctx.beginPath(); ctx.roundRect(Hp * 0.06, Hp * 0.06, Wp - Hp * 0.12, Hp * 0.88, Hp * 0.3); ctx.stroke();
      ctx.fillStyle = '#6d6a6e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `800 ${Hp * 0.46}px ${FONT_BODY}`;
      ctx.fillText(hashText(), Wp / 2, Hp * 0.53);
    },
  });
  const chinItem = (slot, w, h, x, y, rz = 0) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), vinyl(slot.tex, { roughness: 0.4 }));
    mesh.position.set(x, y, zc);
    mesh.rotation.z = rz;
    fg.add(mesh);
  };
  chinItem(logo, 0.95, 0.36, -W / 2 + 0.16 + 0.475, S / 2 + 0.01);
  chinItem(dateSlot, 0.95, 0.24, W / 2 - 0.16 - 0.475, S / 2 + 0.09, 0.035);
  chinItem(hashSlot, 0.62, 0.13, W / 2 - 0.16 - 0.475, S / 2 - 0.15);

  // Sparkle stars breaking out of the frame edges
  for (const [sx, sy, r, c] of STARS) {
    const star = stickerSolid(starShapes(r), starShapes(r, 0.035), { depth: 0.06, face: 0.035, darkMat, faceMat: paint(c, { roughness: 0.35 }), sideMat: darkMat });
    star.group.position.set(sx, sy, D / 2 + 0.02);
    star.group.rotation.z = sx < 0 ? 0.2 : -0.15;
    fg.add(star.group);
  }
  art.onChange((get) => {
    edgeMat.color.set(col(get('color.frame') ?? FR.color));
  });

  // ─── Movable base hidden by a white kick plate that follows the frame ───
  const L = (x, y) => new THREE.Vector2(x * Math.cos(lean) - y * Math.sin(lean), FR.bottom + x * Math.sin(lean) + y * Math.cos(lean));
  const tl = L(-W / 2 - o, -o), tr = L(W / 2 + o, -o);
  const kickShape = new THREE.Shape([new THREE.Vector2(tl.x, BA.clearance), new THREE.Vector2(tr.x, BA.clearance), tr, tl]);
  const zFront = D / 2 + 0.06, zBack = zFront - BA.depth;
  const kickGeo = extrude([kickShape], BA.depth, 0.012);
  kickGeo.translate(0, 0, zBack);
  const kickMat = paint('white', { roughness: 0.4 });
  const kick = new THREE.Mesh(kickGeo, kickMat);
  kick.castShadow = kick.receiveShadow = true;
  install.add(kick);
  art.onChange((get) => kickMat.color.set(col(get('color.base') ?? kickColor())));
  const plate = new THREE.Mesh(new THREE.BoxGeometry(W - 0.1, BA.plate, BA.depth - 0.1), darkMetal());
  plate.position.set(0, BA.caster + BA.plate / 2, (zFront + zBack) / 2);
  install.add(plate);
  for (const sx of [-1, 1]) for (const sz of [zFront - 0.14, zBack + 0.14]) {
    const g = new THREE.Group();
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.03, 20), rubber());
    wheel.rotation.z = Math.PI / 2;
    wheel.position.y = 0.038;
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.05), darkMetal());
    fork.position.y = 0.07;
    const brake = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.01, 0.06), paint('pink'));
    brake.position.set(0, 0.06, 0.055);
    brake.rotation.x = -0.35;
    g.add(wheel, fork, brake);
    g.traverse((c) => { if (c.isMesh) c.castShadow = true; });
    g.position.set(sx * (W / 2 - 0.2), 0, sz);
    install.add(g);
  }
  // Two rear struts from the frame's back down to the base
  for (const sx of [-1, 1]) {
    const top = new THREE.Vector3(sx * (W / 2 - 0.35), FR.bottom + 1.5, -D / 2 - 0.12);
    const bot = new THREE.Vector3(sx * (W / 2 - 0.35), FR.bottom - 0.04, zBack + 0.08);
    const len = top.distanceTo(bot);
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 10), darkMetal());
    strut.position.copy(top).add(bot).multiplyScalar(0.5);
    strut.lookAt(top);
    strut.rotateX(Math.PI / 2);
    strut.castShadow = true;
    install.add(strut);
  }

  // ─── Freestanding backdrop behind the opening (burst / halftone; editable) ───
  const bdSlot = art.slot('polaroidBackdrop', {
    title: 'Backdrop behind the opening', w: BD.width, h: BD.height, body: () => 'yellow', px: 2048,
    placeholder: burst,
  });
  const bdGroup = new THREE.Group();
  const bdMat = vinyl(bdSlot.tex, { roughness: 0.55 });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(BD.width, BD.height, BD.depth), [darkMat, darkMat, darkMat, darkMat, bdMat, darkMat]);
  panel.position.set(0, BD.bottom + BD.height / 2, 0);
  panel.castShadow = panel.receiveShadow = true;
  bdGroup.add(panel);
  for (const sx of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.7), darkMat);
    foot.position.set(sx * (BD.width / 2 - 0.25), 0.025, -0.3);
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 0.05), darkMat);
    brace.position.set(sx * (BD.width / 2 - 0.25), 0.48, -0.25);
    brace.rotation.x = 0.55;
    foot.castShadow = brace.castShadow = true;
    bdGroup.add(foot, brace);
  }
  bdGroup.position.set(0, 0, -BD.distance);
  install.add(bdGroup);

  // ─── Floor decals: STAND HERE footprints, SHOOT FROM HERE spot ───
  const stand = decal(0.95, (ctx, w) => {
    footprint(ctx, w * 0.36, w * 0.4, w * 0.2, false);
    footprint(ctx, w * 0.64, w * 0.4, w * 0.2, true);
    tag(ctx, 'STAND HERE', w / 2, w * 0.86, w * 0.12, P.yellow);
  });
  stand.position.set(0, 0.004, DC.standZ);
  const shoot = decal(1.05, (ctx, w) => {
    ctx.fillStyle = P.cyan;
    ctx.beginPath(); ctx.arc(w / 2, w * 0.42, w * 0.34, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = w * 0.02; ctx.strokeStyle = P.dark; ctx.stroke();
    // camera icon
    ctx.fillStyle = P.white;
    ctx.beginPath(); ctx.roundRect(w * 0.33, w * 0.32, w * 0.34, w * 0.22, w * 0.03); ctx.fill(); ctx.lineWidth = w * 0.014; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(w * 0.43, w * 0.28, w * 0.12, w * 0.05, w * 0.012); ctx.fill(); ctx.stroke();
    ctx.fillStyle = P.pink;
    ctx.beginPath(); ctx.arc(w / 2, w * 0.43, w * 0.07, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    tag(ctx, 'SHOOT FROM HERE', w / 2, w * 0.86, w * 0.11, P.white);
  });
  shoot.position.set(0, 0.004, DC.shootZ);
  install.add(stand, shoot);

  const setting = walkway();
  setting.group.rotation.y = Math.PI / 2;               // walkway runs along z
  install.position.x = X;

  // People: two posing inside the frame, one shooting from the spot, passers-by
  const people = crowd([
    { x: X - 0.33, z: DC.standZ, rot: 0.1, pose: 'pose' }, { x: X + 0.36, z: DC.standZ - 0.02, rot: -0.1, pose: 'wave' },
    { x: X - 1.75, z: DC.shootZ + 0.9, rot: facing(X - 1.75, DC.shootZ + 0.9, X, 0), pose: 'phone' },
    { x: 2.2, z: 5.5, rot: Math.PI, pose: 'walk' }, { x: 1.4, z: -6, rot: 0.1, pose: 'walk' }, { x: 3.0, z: 1.5, rot: -2.4, pose: 'stand' },
  ], 31);

  // Dimensions (own layer, clear of the frame)
  const dims = new THREE.Group();
  const xr = X + W / 2 + 0.75;
  dims.add(dimLine([xr, 0, 0.15], [xr, FR.top, 0.15], `≈ ${m(FR.top)}`, { tick: [1, 0, 0], textHeight: 0.22 }));
  dims.add(dimLine([X - W / 2, FR.top + 0.55, 0.1], [X + W / 2, FR.top + 0.55, 0.1], m(W), { tick: [0, 1, 0], textHeight: 0.2 }));
  const xl = X - W / 2 - 0.45;
  dims.add(dimLine([xl, FR.bottom, 0.1], [xl, FR.bottom + S, 0.1], `CHIN ${m(S)}`, { tick: [1, 0, 0], textHeight: 0.18, textOffset: [-0.35, 0, 0] }));
  dims.add(dimLine([X - 0.75, 0.02, zFront], [X - 0.75, 0.02, DC.shootZ], `≈ ${m(DC.shootZ)}`, { tick: [1, 0, 0], textHeight: 0.18, textOffset: [0, 0.2, 0] }));
  dims.add(dimLine([X + W / 2 + 0.25, 0.02, 0], [X + W / 2 + 0.25, 0.02, -BD.distance], `BACKDROP ${m(BD.distance)} BEHIND`, { tick: [1, 0, 0], textHeight: 0.16, textOffset: [0.5, 0.2, 0] }));

  const labels = [
    { id: 'frame', pos: [X - W / 2, FR.top + 0.2, 0], title: 'Giant polaroid frame',
      lines: [`≈ ${m(FR.top)} tall · ${m(W)} wide · leaning ${FR.lean}° (EST)`, `Border ${m(b)} · chin ${m(S)} (EST)`, 'Dark outline · pink offset panel'] },
    { id: 'chin', pos: [X, FR.bottom + S + 0.1, 0.2], title: 'Chin',
      lines: ['OPF logo slot (contain)', `"${TX.date}" handwritten date tag`, `"${TX.hashtag}" placeholder`] },
    { id: 'backdrop', pos: [X, BD.bottom + BD.height, -BD.distance], title: 'Backdrop',
      lines: [`${m(BD.width)} × ${m(BD.height)} · ${m(BD.distance)} behind (EST)`, 'Burst / halftone placeholder', 'Edit artwork: placeholder / colour / image'] },
    { id: 'base', pos: [X + W / 2, FR.bottom, zFront], title: 'Movable base',
      lines: ['White kick plate hides the trolley', '4 lockable castors · ballast inside', `Footprint ${m(W)} × ${m(BA.depth)} (EST)`] },
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
    install: group, setting, people, dims, labels, nightLights, glows: [ledMat],
    key: { pos: [-7, 13, -6], target: [X, 1, 0], extent: 9 },
  };
}

export function polaroidPresets() {
  return {
    hero: { label: 'Hero 3/4', pos: [X + 4.2, 1.9, 5.4], target: [X, 1.6, -0.2], fov: 46 },
    eye: { label: 'Eye level', pos: [X + 0.3, 1.6, 4.4], target: [X, 1.7, 0], fov: 58 },
    front: { label: 'Front', pos: [X, 1.7, 7.4], target: [X, 1.65, 0], fov: 38 },
    crowd: { label: 'Crowd eye level', pos: [X + 2.3, 1.6, 5.6], target: [X - 0.1, 1.45, -0.4], fov: 50 },
    top: { label: 'Top-down', pos: [X + 1.5, 50, 0.01], target: [X + 1.5, 0, 0], fov: 16, plan: true },
    wide: { label: 'Wide context', pos: [X + 9, 5.2, 12], target: [X + 1.5, 1.5, -2], fov: 52 },
  };
}
