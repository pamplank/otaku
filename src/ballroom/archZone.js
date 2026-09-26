// BALLROOM ENTRANCE ARCH (foyer): die-cut sticker portal with a swappable face,
// timetable boards on the legs, corner sparkles, VIP / General queue lanes with
// ticket-check podiums and staff, and floor arrows through the arch.
// Built in local coordinates (origin = arch centre on the floor, +z = approach
// side) inside a group placed at `origin`.
import * as THREE from 'three';
import { arch as A, boards as BD, lanes as LN } from '../../config/arch.config.js';
import { palette as P, assets as MAIN_ASSETS } from '../../stage.config.js';
import { toon, box, starSticker, canvasTexture, floorArrow, outline, OUTLINE, FONT_DISPLAY, FONT_BODY } from '../sticker.js';
import { makeSlot, customSlot, labelPlaceholder, splitCaps } from '../slots.js';
import { crowd, figure, colorPicker, mulberry32 } from './figures.js';
import { queueLane } from './rig.js';

const m = (v) => `${+v.toFixed(2)} m`;
const PPM = 160; // face print resolution, pixels per metre

export const ARCH_ARTWORK = {
  archFace:   { title: 'Arch face (whole design)', accept: 'image/*', kind: 'Image' },
  archLogo:   { title: 'OPF logo on the arch',     accept: 'image/*', kind: 'Image' },
  archBoardL: { title: 'Timetable left',           accept: 'image/*', kind: 'Image' },
  archBoardR: { title: 'Timetable right',          accept: 'image/*', kind: 'Image' },
};

// Die-cut portal outline (metres, x 0..W, y 0..H): legs + header, rounded corners
function portalShape(W, H, ow, oh, r, ri) {
  const lx = (W - ow) / 2, rx = (W + ow) / 2;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(lx, 0);
  s.lineTo(lx, oh - ri);
  s.quadraticCurveTo(lx, oh, lx + ri, oh);
  s.lineTo(rx - ri, oh);
  s.quadraticCurveTo(rx, oh, rx, oh - ri);
  s.lineTo(rx, 0);
  s.lineTo(W, 0);
  s.lineTo(W, H - r);
  s.quadraticCurveTo(W, H, W - r, H);
  s.lineTo(r, H);
  s.quadraticCurveTo(0, H, 0, H - r);
  s.closePath();
  return s;
}

// Extrude the outline with UVs spanning 0..1 over the W × H bounding box, so
// one canvas covers the whole face.
function portalGeometry(W, H, depth) {
  const shape = portalShape(W, H, A.opening.width, A.opening.height, A.cornerRadius, A.openingRadius);
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10 });
  splitCaps(geo);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / W, pos.getY(i) / H);
  geo.translate(-W / 2, 0, -depth / 2);
  return geo;
}

function fitFont(ctx, text, maxW, px, font) {
  ctx.font = `900 ${px}px ${font}`;
  ctx.fontStretch = 'expanded';
  const w = ctx.measureText(text).width;
  if (w > maxW) ctx.font = `900 ${(px * maxW) / w}px ${font}`;
}

// Contain-fit an image into a box (never cropped or stretched)
function drawContain(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.videoWidth || img.width, ih = img.naturalHeight || img.videoHeight || img.height;
  const k = Math.min(w / iw, h / ih);
  ctx.drawImage(img, x + (w - iw * k) / 2, y + (h - ih * k) / 2, iw * k, ih * k);
}

export function buildArchZone({ origin = new THREE.Vector3(), seed = 42 } = {}) {
  const g = new THREE.Group();
  g.position.copy(origin);
  const W = A.width, H = A.height, D = A.depth, O = A.opening;
  const legW = (W - O.width) / 2;
  const slotsReady = [];

  // ─── Face print (default composition, or the uploaded whole-face artwork) ───
  const face = document.createElement('canvas');
  face.width = Math.round(W * PPM);
  face.height = Math.round(H * PPM);
  const faceTex = new THREE.CanvasTexture(face);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.anisotropy = 8;
  let logoImg = null, faceImg = null;

  function drawDefault(ctx) {
    const px = (v) => v * PPM;
    ctx.fillStyle = P.white;
    ctx.fillRect(0, 0, face.width, face.height);
    const hb = H - O.height;                          // header band height
    // Header: logo (supplied file, contain-fit) left, title + subtitle right
    const lb = { x: px(0.4), y: px(0.12), w: px(3.3), h: px(hb - 0.24) };
    if (logoImg) drawContain(ctx, logoImg, lb.x, lb.y, lb.w, lb.h);
    else {
      ctx.setLineDash([px(0.08), px(0.06)]);
      ctx.lineWidth = px(0.025);
      ctx.strokeStyle = P.dark;
      ctx.strokeRect(lb.x, lb.y, lb.w, lb.h);
      ctx.setLineDash([]);
      ctx.fillStyle = P.dark;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fitFont(ctx, 'OPF LOGO · SUPPLIED FILE', lb.w * 0.9, px(0.22), FONT_DISPLAY);
      ctx.fillText('OPF LOGO · SUPPLIED FILE', lb.x + lb.w / 2, lb.y + lb.h / 2);
    }
    ctx.fillStyle = P.dark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tx = px(4.0 + (W - 4.0 - 0.35) / 2), tw = px(W - 4.0 - 0.5);
    fitFont(ctx, A.title, tw, px(0.56), FONT_DISPLAY);
    ctx.fillText(A.title, tx, px(0.46));
    ctx.font = `800 ${px(0.18)}px ${FONT_BODY}`;
    ctx.fontStretch = 'normal';
    const sub = A.subtitle.split('').join(String.fromCharCode(8202));   // a little tracking
    ctx.fillText(sub, tx, px(0.9), tw);
    // Pink band under the header, dark kick strip on the legs
    ctx.fillStyle = P.pink;
    ctx.fillRect(0, px(hb - 0.1), face.width, px(0.1));
    ctx.fillStyle = P.dark;
    ctx.fillRect(0, px(H - 0.22), face.width, px(0.22));
    // Cyan / yellow dots on the upper legs (visible around the boards)
    for (const [cx, c] of [[legW / 2, P.cyan], [W - legW / 2, P.yellow]]) {
      ctx.fillStyle = c;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(px(cx + i * 0.3), px(hb + 0.2), px(0.06), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function redraw() {
    const ctx = face.getContext('2d');
    if (faceImg) {                                     // uploaded whole-face design, shown whole
      ctx.fillStyle = P.white;
      ctx.fillRect(0, 0, face.width, face.height);
      drawContain(ctx, faceImg, 0, 0, face.width, face.height);
    } else drawDefault(ctx);
    faceTex.needsUpdate = true;
  }

  // Back face (door side): white with the title, drawn mirrored so it reads correctly
  const backTex = canvasTexture(face.width, face.height, (ctx, cw, ch) => {
    ctx.fillStyle = P.white;
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = P.dark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitFont(ctx, A.title, cw * 0.5, (H - O.height) * PPM * 0.4, FONT_DISPLAY);
    ctx.fillText(A.title, cw / 2, (H - O.height) * PPM * 0.5);
    ctx.fillStyle = P.pink;
    ctx.fillRect(0, (H - O.height - 0.1) * PPM, cw, 0.1 * PPM);
    ctx.fillStyle = P.dark;
    ctx.fillRect(0, ch - 0.22 * PPM, cw, 0.22 * PPM);
  });
  backTex.wrapS = THREE.RepeatWrapping;
  backTex.repeat.x = -1;

  // ─── Portal body + pink offset layer ───
  const body = new THREE.Mesh(portalGeometry(W, H, D), [
    new THREE.MeshToonMaterial({ map: faceTex }), toon('#f1eee9'), new THREE.MeshToonMaterial({ map: backTex }),
  ]);
  body.castShadow = body.receiveShadow = true;
  body.userData.slotKey = 'archFace';
  outline(body, OUTLINE, 40);
  g.add(body);
  const off = new THREE.Mesh(portalGeometry(W, H + A.offset.y, 0.06), toon(P[A.offset.color]));
  off.position.set(A.offset.x, 0, -D / 2 - 0.05);
  outline(off, OUTLINE, 40);
  g.add(off);

  // ─── Swappable artwork: whole face, logo, two timetable boards ───
  const faceSlot = customSlot('archFace', {
    info: { width: W, height: H, aspect: W / H, spec: `${W} × ${H} m whole face (opening ${O.width} × ${O.height} m is cut out) · image` },
    placeholderThumb: () => { const c = face.cloneNode(); c.getContext('2d').drawImage(face, 0, 0); return c.toDataURL(); },
    apply(res) { faceImg = res ? res.tex.image : null; redraw(); },
  });
  faceSlot.slot.meshes = [body];
  slotsReady.push(faceSlot.ready);
  const logoSlot = customSlot('archLogo', {
    info: { width: 3.3, height: H - O.height - 0.24, aspect: 3.3 / (H - O.height - 0.24), spec: 'Logo area 3.3 × 0.96 m in the header · supplied file only' },
    assets: MAIN_ASSETS.logo,
    placeholderThumb: () => canvasTexture(320, 96, labelPlaceholder('OPF LOGO', 'SUPPLIED FILE', null, { bg: P.white })).image.toDataURL(),
    apply(res) { logoImg = res ? res.tex.image : null; redraw(); },
  });
  slotsReady.push(logoSlot.ready);

  const boardGroup = new THREE.Group();
  for (const [side, key, label] of [[-1, 'archBoardL', 'TIMETABLE LEFT'], [1, 'archBoardR', 'TIMETABLE RIGHT']]) {
    const x = side * (O.width / 2 + legW / 2);
    const back = box(BD.width + 0.12, BD.height + 0.12, 0.04, toon(P.dark), { edges: false });
    back.position.set(x, BD.bottom + BD.height / 2, D / 2 + 0.02);
    const offB = box(BD.width + 0.12, BD.height + 0.12, 0.02, toon(side < 0 ? P.yellow : P.cyan), { edges: false });
    offB.position.set(x + 0.08, BD.bottom + BD.height / 2 - 0.08, D / 2 + 0.005);
    boardGroup.add(offB, back);
    const s = makeSlot(key, {
      w: BD.width, h: BD.height, bg: P.white, emissive: false,
      placeholder: labelPlaceholder('TIMETABLE PLACEHOLDER', `${BD.width} × ${BD.height} M`, 'Panel stage · Mini stage schedule', { bg: P.white, fg: P.dark, offset: side < 0 ? P.yellow : P.cyan }),
    });
    s.group.position.set(x, BD.bottom + BD.height / 2, D / 2 + 0.045);
    boardGroup.add(s.group);
    slotsReady.push(s.ready);
  }
  g.add(boardGroup);

  // ─── Sparkles on the corners ───
  for (const [x, y, size, c] of [[-W / 2 + 0.05, H - 0.05, 1.0, P.yellow], [W / 2 - 0.05, H - 0.1, 0.7, P.pink],
    [-W / 2 + 0.1, 0.55, 0.5, P.cyan], [W / 2 - 0.1, 0.6, 0.55, P.yellow]]) {
    const st = starSticker(size, c);
    st.position.set(x, y, D / 2 + 0.12);
    g.add(st);
  }

  // ─── Queue lanes, podiums, floor arrows ───
  const lanesGroup = new THREE.Group();
  const laneSpots = {};
  for (const key of ['vip', 'general']) {
    const L = LN[key];
    const xIn = L.side * (O.width / 4);                           // centre of its half of the opening
    const path = [[L.side * (O.width / 4 + LN.length), LN.z], [xIn, LN.z], [xIn, LN.podium.z + 0.5]];
    const lane = queueLane(path, { width: LN.width, post: LN.post, beltColor: P[L.color], capColor: P[L.color] });
    lanesGroup.add(lane.group);
    laneSpots[key] = lane.spots;
    // lane sign at the entry
    const sign = canvasTexture(420, 200, (ctx, cw, ch) => {
      ctx.fillStyle = P[L.color]; ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = P.dark; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      fitFont(ctx, L.label, cw * 0.86, ch * 0.5, FONT_DISPLAY);
      ctx.fillText(L.label, cw / 2, ch * 0.54);
      ctx.lineWidth = 14; ctx.strokeStyle = P.dark; ctx.strokeRect(0, 0, cw, ch);
    });
    const sx = L.side * (O.width / 4 + LN.length) - L.side * 0.3;
    const post = box(0.05, 1.5, 0.05, toon('#3a373a'), { edges: false });
    post.position.set(sx, 0.75, LN.z + LN.width / 2 + 0.25);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.4), toon(P.white, { map: sign }));
    panel.position.set(sx, 1.7, LN.z + LN.width / 2 + 0.28);
    lanesGroup.add(post, panel);
    // ticket-check podium with a sticker front
    const PD = LN.podium;
    const pod = box(PD.width, PD.height, PD.depth, toon(P.white));
    pod.position.set(xIn + L.side * (LN.width / 2 + 0.45), PD.height / 2, PD.z);
    const front = canvasTexture(240, 420, (ctx, cw, ch) => {
      ctx.fillStyle = P[L.color]; ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = P.dark; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.save(); ctx.translate(cw / 2, ch / 2); ctx.rotate(-Math.PI / 2);
      fitFont(ctx, `${L.label} · TICKETS`, ch * 0.86, cw * 0.28, FONT_DISPLAY);
      ctx.fillText(`${L.label} · TICKETS`, 0, 0);
      ctx.restore();
      ctx.lineWidth = 12; ctx.strokeStyle = P.dark; ctx.strokeRect(0, 0, cw, ch);
    });
    const fr = new THREE.Mesh(new THREE.PlaneGeometry(PD.width * 0.86, PD.height * 0.8), toon(P.white, { map: front }));
    fr.position.set(pod.position.x, PD.height * 0.48, PD.z + PD.depth / 2 + 0.005);
    lanesGroup.add(pod, fr);
    laneSpots[key].podium = [pod.position.x, PD.z];
  }
  g.add(lanesGroup);

  const arrows = new THREE.Group();
  for (const side of [-1, 1]) {
    for (const z of [0.9, -0.3, -1.6, -2.9]) {
      const a = floorArrow(side * (O.width / 4), z, 0, -1, 1.1, 0.6, P.dark, 0.06);
      a.children[0].material.depthWrite = false;
      a.children[0].renderOrder = 3;
      a.children[0].userData.decal = true;
      arrows.add(a);
    }
  }
  g.add(arrows);

  // ─── People: queues, staff at the podiums ───
  const rand = mulberry32(seed);
  const pick = colorPicker(rand);
  const people = new THREE.Group();
  people.position.copy(origin);
  const guests = [];
  for (const key of ['vip', 'general']) {
    // spots run from the lane entry towards the podium; the queue fills from the podium end
    const spots = laneSpots[key].slice().reverse().slice(1, 1 + LN[key].queue);
    for (const s of spots) guests.push({ x: s.x + (rand() - 0.5) * 0.15, z: s.z, rot: s.rot, color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 });
  }
  people.add(crowd(guests));
  for (const key of ['vip', 'general']) {
    const [px, pz] = laneSpots[key].podium;
    const staff = figure(P[LN[key].color]);
    staff.position.set(px + LN[key].side * 0.1, 0, pz - 0.55);
    staff.rotation.y = LN[key].side * 0.9;
    people.add(staff);
  }

  const w = (x, y, z) => [x + origin.x, y, z + origin.z];
  const labels = [
    { id: 'arch', pos: w(-W / 2 + 0.2, H + 0.4, D / 2), title: 'Entrance arch',
      lines: [`Freestanding portal ${W} × ${H} × ${D} m`, 'Die-cut sticker shape · white face · pink offset', 'Whole face swappable (admin: Arch face)'] },
    { id: 'opening', pos: w(0, O.height - 0.3, D / 2 + 0.1), title: 'Clear opening',
      lines: [`${O.width} × ${O.height} m`, 'VIP half (left) · General half (right)'] },
    { id: 'header', pos: w(W / 2 - 1.2, H - 0.2, D / 2 + 0.1), title: 'Header',
      lines: ['OPF logo (supplied file only)', `"${A.title}" · "${A.subtitle}"`] },
    { id: 'boards', pos: w(O.width / 2 + legW / 2, BD.bottom + BD.height + 0.2, D / 2 + 0.1), title: 'Schedule boards',
      lines: [`2 × ${BD.width} × ${BD.height} m on the legs`, 'Texture slots (timetables)'] },
    { id: 'vip', pos: w(-(O.width / 4 + LN.length * 0.6), 1.3, LN.z), title: 'VIP lane',
      lines: [`Belt-stanchion lane ${m(LN.width)} wide (yellow)`, 'Ticket-check podium + staff at the arch'] },
    { id: 'general', pos: w(O.width / 4 + LN.length * 0.6, 1.3, LN.z), title: 'General lane',
      lines: [`Belt-stanchion lane ${m(LN.width)} wide (cyan)`, 'Ticket-check podium + staff at the arch'] },
  ];

  return {
    group: g, people, labels, slotsReady, lanesGroup, arrows, boardGroup,
    setLanes(on) { lanesGroup.visible = on; people.visible = on; },
  };
}
