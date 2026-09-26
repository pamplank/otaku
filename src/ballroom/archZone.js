// BALLROOM ENTRANCE ARCH (foyer): die-cut sticker portal with a swappable face,
// timetable boards on the legs, corner sparkles, VIP / General queue lanes with
// ticket-check podiums and staff, and floor arrows through the arch.
// Built in local coordinates (origin = arch centre on the floor, +z = approach
// side) inside a group placed at `origin`.
import * as THREE from 'three';
import { arch as A, boards as BD, lanes as LN } from '../../config/arch.config.js';
import { palette as P } from '../../stage.config.js';
import { toon, box, canvasTexture, floorArrow, outline, drawSparkle, OUTLINE, FONT_DISPLAY } from '../sticker.js';
import { makeSlot, customSlot, labelPlaceholder, splitCaps } from '../slots.js';
import { crowd, figure, colorPicker, mulberry32 } from './figures.js';
import { logoSign } from './stageStyle.js';
import { foyer as FOYER } from '../../config/ballroom.config.js';
import { queueLane } from './rig.js';

const m = (v) => `${+v.toFixed(2)} m`;
const PPM = 160; // face print resolution, pixels per metre

export const ARCH_ARTWORK = {
  archFace:   { title: 'Arch face (whole design)', accept: 'image/*', kind: 'Image' },
  archLogo:   { title: 'OPF logo sign',            accept: 'image/*', kind: 'Image' },
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
  let faceImg = null;

  // Default face, after the OPF entrance arch: teal, light-teal checker patches on
  // the lower legs and header ends, white swooshes, navy corner wedges with stars,
  // and a navy strip with the room name under the logo sign.
  function drawPrint(ctx, withTitle) {
    const px = (v) => v * PPM;
    const cw = face.width, ch = face.height;
    const hb = H - O.height;                          // header band height
    ctx.fillStyle = P.teal;
    ctx.fillRect(0, 0, cw, ch);
    // checker patches
    const sq = 0.22;
    ctx.fillStyle = P.tealLight;
    for (let y = 0; y < H; y += sq) for (let x = 0; x < W; x += sq) {
      if ((Math.round(x / sq) + Math.round(y / sq)) % 2) continue;
      const up = H - y;                               // height above the floor
      const leg = (x < legW - 0.05 || x > W - legW) && up > 0.35 && up < 2.6;
      const headerEnd = y < hb && (x < 1.7 || x > W - 1.9);
      if (leg || headerEnd) ctx.fillRect(px(x), px(y), px(sq), px(sq));
    }
    // white swooshes: a double sweep over the whole arch, curls near the feet
    ctx.strokeStyle = P.white;
    ctx.lineCap = 'round';
    for (const [rx, ry, lw] of [[W / 2 + 0.6, H - 1.15, 0.06], [W / 2 + 0.85, H - 0.9, 0.035]]) {
      ctx.lineWidth = px(lw);
      ctx.beginPath();
      ctx.ellipse(px(W / 2), px(H - 0.9), px(rx), px(ry), 0, 1.12 * Math.PI, 1.88 * Math.PI);
      ctx.stroke();
    }
    ctx.lineWidth = px(0.04);
    for (const side of [-1, 1]) {
      const cx = side < 0 ? 0.25 : W - 0.25;
      ctx.beginPath();
      ctx.ellipse(px(cx), px(H - 1.1), px(0.5), px(0.7), 0, side < 0 ? -0.35 * Math.PI : 0.65 * Math.PI, side < 0 ? 0.6 * Math.PI : 1.6 * Math.PI, side > 0);
      ctx.stroke();
    }
    // navy wedges in the top corners, with small stars
    ctx.fillStyle = '#2d2b52';
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? 0 : cw;
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0 - side * px(1.7), 0);
      ctx.lineTo(x0, px(0.95));
      ctx.closePath();
      ctx.fill();
    }
    const stars = [
      [0.35, 0.22, 0.1, P.yellow], [0.85, 0.3, 0.07, P.pink], [W - 0.4, 0.22, 0.1, P.yellow], [W - 0.9, 0.36, 0.07, P.pink],
      [W - 0.3, 0.62, 0.06, P.white], [0.3, 1.5, 0.09, P.white], [0.6, 1.9, 0.07, P.pink], [0.25, 2.9, 0.06, P.yellow],
      [W - 0.3, 1.4, 0.09, P.white], [W - 0.6, 1.9, 0.07, P.yellow], [W - 0.35, 3.1, 0.06, P.pink],
      [1.9, 0.7, 0.07, P.white], [W - 2.0, 0.65, 0.07, P.white], [2.4, 1.05, 0.05, P.pink], [W - 2.4, 1.05, 0.05, P.yellow],
    ];
    for (const [x, y, r, c] of stars) drawSparkle(ctx, px(x), px(y), px(r), c, P.dark, px(0.012));
    if (!withTitle) return;
    // navy strip with the room name, just under the logo sign
    const text = `${A.title}  ·  ${A.subtitle}`;
    const sw = px(5.2), sh = px(0.34), sy = px(hb - 0.3);
    ctx.fillStyle = '#2d2b52';
    ctx.beginPath(); ctx.roundRect(px(W / 2) - sw / 2, sy - sh / 2, sw, sh, sh / 2); ctx.fill();
    ctx.lineWidth = px(0.02); ctx.strokeStyle = P.white; ctx.stroke();
    ctx.fillStyle = P.white;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitFont(ctx, text, sw - px(0.4), px(0.2), FONT_DISPLAY);
    ctx.fillText(text, px(W / 2), sy + px(0.01));
  }
  const drawDefault = (ctx) => drawPrint(ctx, true);

  function redraw() {
    const ctx = face.getContext('2d');
    if (faceImg) {                                     // uploaded whole-face design, shown whole
      ctx.fillStyle = P.white;
      ctx.fillRect(0, 0, face.width, face.height);
      drawContain(ctx, faceImg, 0, 0, face.width, face.height);
    } else drawDefault(ctx);
    faceTex.needsUpdate = true;
  }

  // Back face (door side): the same teal print, "BALLROOM" in the header, drawn
  // mirrored so it reads correctly
  const backTex = canvasTexture(face.width, face.height, (ctx, cw) => {
    drawPrint(ctx, false);
    ctx.fillStyle = P.white;
    ctx.strokeStyle = P.dark;
    ctx.lineWidth = (H - O.height) * PPM * 0.05;
    ctx.lineJoin = 'round';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitFont(ctx, A.title, cw * 0.5, (H - O.height) * PPM * 0.4, FONT_DISPLAY);
    ctx.strokeText(A.title, cw / 2, (H - O.height) * PPM * 0.5);
    ctx.fillText(A.title, cw / 2, (H - O.height) * PPM * 0.5);
  });
  backTex.wrapS = THREE.RepeatWrapping;
  backTex.repeat.x = -1;

  // ─── Portal body + pink offset layer ───
  const body = new THREE.Mesh(portalGeometry(W, H, D), [
    new THREE.MeshToonMaterial({ map: faceTex }), toon(P.teal), new THREE.MeshToonMaterial({ map: backTex }),
  ]);
  body.castShadow = body.receiveShadow = true;
  body.userData.slotKey = 'archFace';
  outline(body, OUTLINE, 40);
  g.add(body);
  if (A.offset) {
    const off = new THREE.Mesh(portalGeometry(W, H + A.offset.y, 0.06), toon(P[A.offset.color]));
    off.position.set(A.offset.x, 0, -D / 2 - 0.05);
    outline(off, OUTLINE, 40);
    g.add(off);
  }

  // ─── Swappable artwork: whole face, logo, two timetable boards ───
  const faceSlot = customSlot('archFace', {
    info: { width: W, height: H, aspect: W / H, spec: `${W} × ${H} m whole face (opening ${O.width} × ${O.height} m is cut out) · image` },
    placeholderThumb: () => { const c = face.cloneNode(); c.getContext('2d').drawImage(face, 0, 0); return c.toDataURL(); },
    apply(res) { faceImg = res ? res.tex.image : null; redraw(); },
  });
  faceSlot.slot.meshes = [body];
  slotsReady.push(faceSlot.ready);
  // OPF logo: die-cut sign standing on the header, as on the entrance arch on site.
  // Movable in admin mode (like the stage logos); kept under the 5 m foyer ceiling.
  const LG = A.logo;
  const logo = logoSign('archLogo', { width: LG.width, maxHeight: LG.maxHeight, headerTop: H, drop: LG.drop,
    z: D / 2 + LG.standoff + LG.thickness / 2, thickness: LG.thickness, border: LG.border, board: 'white',
    ceiling: FOYER.ceiling, labelId: 'header', limits: { xLimit: 6, zRange: [-1, 4] } });
  g.add(logo.group);
  slotsReady.push(logo.ready);

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
      lines: [`Freestanding portal ${W} × ${H} × ${D} m`, 'Die-cut portal · teal print as on the OPF entrance arch', 'Whole face swappable (admin: Arch face)'] },
    { id: 'opening', pos: w(0, O.height - 0.3, D / 2 + 0.1), title: 'Clear opening',
      lines: [`${O.width} × ${O.height} m`, 'VIP half (left) · General half (right)'] },
    { id: 'header', pos: w(LG.width / 2 + 0.3, H + 0.2, D / 2 + 0.1), title: 'OPF logo sign',
      lines: [`Die-cut board ≈ ${m(LG.width)} wide (est.), standing on the header`, 'As on the OPF entrance arch · supplied logo only', `"${A.title} · ${A.subtitle}" strip underneath`] },
    { id: 'boards', pos: w(O.width / 2 + legW / 2, BD.bottom + BD.height + 0.2, D / 2 + 0.1), title: 'Schedule boards',
      lines: [`2 × ${BD.width} × ${BD.height} m on the legs`, 'Texture slots (timetables)'] },
    { id: 'vip', pos: w(-(O.width / 4 + LN.length * 0.6), 1.3, LN.z), title: 'VIP lane',
      lines: [`Belt-stanchion lane ${m(LN.width)} wide (yellow)`, 'Ticket-check podium + staff at the arch'] },
    { id: 'general', pos: w(O.width / 4 + LN.length * 0.6, 1.3, LN.z), title: 'General lane',
      lines: [`Belt-stanchion lane ${m(LN.width)} wide (cyan)`, 'Ticket-check podium + staff at the arch'] },
  ];

  return {
    group: g, people, labels, slotsReady, lanesGroup, arrows, boardGroup, logoSign: logo.sign,
    setLanes(on) { lanesGroup.visible = on; people.visible = on; },
  };
}
