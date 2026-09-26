// MINI STAGE zone (right third of the ballroom): mini stage, chairs, standing
// area, signing table + queue lane (toggle), networking / community area and the
// proposed pause pocket, with their people. Used by the Mini Stage build and the
// overview. The stage is built in local coordinates inside a group placed at
// `origin`; networking and the pause pocket use room coordinates (their zones).
import * as THREE from 'three';
import { stage as S, seating as SEAT, standing as STAND, signing as SIGN, networking as NET, pause as PZ } from '../../config/mini.config.js';
import { palette as P } from '../../stage.config.js';
import { toon, flat, box, stickerPanel, starSticker, canvasTexture, drawSparkle, FONT_DISPLAY } from '../sticker.js';
import { makeSlot, labelPlaceholder, dieCutBoard } from '../slots.js';
import { chairRows } from './seating.js';
import { crowd, figure, scatter, colorPicker, mulberry32 } from './figures.js';
import { boxTruss, fixtures as rigFixtures, stairs, queueLane } from './rig.js';

const m = (v) => `${+v.toFixed(2)} m`;
const m2 = (a) => `≈ ${Math.round(a).toLocaleString('en-US')} m²`;
const frameZ = -S.deck.depth + S.frame.setback;
const frameFront = frameZ + S.frame.thickness / 2;
const ledZ = frameFront + 0.03;

export const MINI_ARTWORK = {
  miniLed:    { title: 'Mini LED',          accept: 'image/*,video/*', kind: 'Image or video' },
  miniSideL:  { title: 'Side panel left',   accept: 'image/*',         kind: 'Image' },
  miniSideR:  { title: 'Side panel right',  accept: 'image/*',         kind: 'Image' },
  miniNotice: { title: 'Community noticeboard', accept: 'image/*',     kind: 'Image' },
};

function paStack() {
  const g = new THREE.Group();
  let y = 0;
  for (const h of S.pa.heights) {
    const b = box(S.pa.width, h, S.pa.depth, toon('#3a373a'));
    b.position.y = y + h / 2;
    const grille = new THREE.Mesh(new THREE.PlaneGeometry(S.pa.width * 0.84, h * 0.84), toon('#1c1a1d'));
    grille.position.set(0, y + h / 2, S.pa.depth / 2 + 0.003);
    g.add(b, grille);
    y += h;
  }
  return g;
}

// Round speech-bubble sign (die-cut board), text in the display face
function speechBubble(text, width) {
  const c = document.createElement('canvas');
  c.width = 1000;
  c.height = 520;
  const ctx = c.getContext('2d');
  ctx.beginPath();
  ctx.ellipse(500, 225, 440, 190, 0, 0, Math.PI * 2);
  ctx.moveTo(430, 400);
  ctx.lineTo(380, 510);
  ctx.lineTo(540, 408);
  ctx.fillStyle = P.white;
  ctx.fill();
  ctx.lineWidth = 20;
  ctx.strokeStyle = P.dark;
  ctx.stroke();
  ctx.fillStyle = P.dark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 118px ${FONT_DISPLAY}`;
  ctx.fontStretch = 'expanded';
  ctx.fillText(text, 500, 228, 760);
  drawSparkle(ctx, 905, 70, 58, P.yellow, P.dark, 9);
  drawSparkle(ctx, 88, 330, 40, P.pink, P.dark, 7);
  return dieCutBoard(c, width, { thickness: 0.05, border: 0.06, board: P.cyan, edge: '#00a3ae' });
}

function highTable() {
  const t = new THREE.Group();
  const pole = toon('#3a373a');
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, NET.highTables.height - 0.02, 10), pole);
  p.position.y = (NET.highTables.height - 0.02) / 2;
  const d = new THREE.Mesh(new THREE.CylinderGeometry(NET.highTables.diameter / 2, NET.highTables.diameter / 2, 0.04, 28), toon(P.white));
  d.position.y = NET.highTables.height;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 20), pole);
  t.add(p, d, base);
  t.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return t;
}

// ─── Build ──────────────────────────────────────────────────────────────────
// rects: the ballroom's zone rectangles (room.js → zones().rects)
export function buildMiniZone({ origin = new THREE.Vector3(), rects, seed = 60 } = {}) {
  const g = new THREE.Group();          // stage + seating (local, placed at origin)
  g.position.copy(origin);
  const around = new THREE.Group();     // networking + pause pocket (room coordinates)
  const slotsReady = [];
  const glows = [];
  const D = S.deck, F = S.frame, L = S.led;

  // Deck + front steps
  const deck = box(D.width, D.height, D.depth, toon('#2b292d'));
  deck.position.set(0, D.height / 2, -D.depth / 2);
  deck.castShadow = deck.receiveShadow = true;
  g.add(deck);
  const st = stairs({ width: S.steps.width, height: D.height, steps: S.steps.steps, run: S.steps.run, riserColors: [P.cyan, P.yellow, P.white] });
  st.position.set(S.steps.x, 0, 0);
  g.add(st);

  // Cyan sticker-card frame with a yellow offset layer, LED inside
  const frame = stickerPanel({ w: F.width, h: F.height, t: F.thickness, color: P.cyan, border: F.outline, offset: F.offset, offsetColor: P.yellow });
  frame.position.set(0, D.height + F.height / 2, frameZ);
  frame.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  g.add(frame);
  const housing = box(L.width + 0.08, L.height + 0.08, 0.06, flat('#111012'));
  housing.position.set(0, L.bottom + L.height / 2, ledZ - 0.02);
  g.add(housing);
  const led = makeSlot('miniLed', {
    w: L.width, h: L.height, bg: '#0b0a0c',
    placeholder: labelPlaceholder('KV PLACEHOLDER', `MINI LED · ${L.width} × ${L.height} M · 16:9`, 'Fan sessions · signings · community — official content to be supplied'),
  });
  led.group.position.set(0, L.bottom + L.height / 2, ledZ + 0.012);
  g.add(led.group);
  slotsReady.push(led.ready);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(L.width + 0.16, L.height + 0.16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#c8f6ff').multiplyScalar(2.0), toneMapped: false }));
  halo.position.set(0, L.bottom + L.height / 2, ledZ - 0.03);
  halo.visible = false;
  g.add(halo);
  glows.push(halo);

  // Round speech-bubble "MINI STAGE" sign above the frame, top at sign.top
  const bubble = speechBubble(S.sign.text, S.sign.width);
  const bh = bubble.scale.y;
  bubble.position.set(0, S.sign.top - bh / 2, frameFront + 0.12);
  g.add(bubble);

  // Truss: goalpost at the deck front + one behind the frame, 3 lights
  const T = S.truss;
  g.add(boxTruss({ top: T.top, size: T.size, span: T.span, zs: [T.frontZ, frameZ - 0.45] }));
  const xs = [-2.4, 0, 2.4];
  const targets = [new THREE.Vector3(-1, D.height, -1.5), new THREE.Vector3(0, 0, 5), new THREE.Vector3(1, D.height, -1.5)];
  const fx = rigFixtures(g, { xs, y: T.top - T.size, z: T.frontZ, targets, origin, colors: [P.cyan, P.yellow, P.pink] });

  // Small PA stacks and the two side panels (texture slots) either side of the deck
  const P2 = S.pa, SP = S.sidePanels;
  for (const [side, key, label] of [[-1, 'miniSideL', 'SIDE PANEL LEFT'], [1, 'miniSideR', 'SIDE PANEL RIGHT']]) {
    const pa = paStack();
    pa.position.set(side * P2.x, 0, P2.z);
    g.add(pa);
    const panel = stickerPanel({ w: SP.width, h: SP.height, t: 0.08, color: P.white, border: 0.06, offset: 0.12, offsetColor: P.cyan });
    panel.position.set(side * SP.x, SP.height / 2, SP.z);
    g.add(panel);
    const s = makeSlot(key, {
      w: SP.width, h: SP.height, bg: P.white, emissive: false,
      placeholder: labelPlaceholder(label, `${SP.width} × ${SP.height} M`, null, { bg: P.white, offset: P.cyan }),
    });
    s.group.position.set(side * SP.x, SP.height / 2, SP.z + 0.045);
    g.add(s.group);
    slotsReady.push(s.ready);
  }

  // Sparkles (cyan lead)
  for (const [x, y, z, size, c] of [
    [-F.width / 2 + 0.1, D.height + F.height, frameFront + 0.25, 0.8, P.yellow],
    [F.width / 2 - 0.05, D.height + 0.25, frameFront + 0.25, 0.55, P.pink],
    [S.sign.width / 2 + 0.2, S.sign.top - 0.1, frameFront + 0.3, 0.35, P.white],
  ]) {
    const sp = starSticker(size, c);
    sp.position.set(x, y, z);
    g.add(sp);
  }

  // Chairs: 3 rows × 20
  const chairs = chairRows(SEAT);
  g.add(chairs.group);

  // Signing (toggle): 3 m table on the deck + queue lane along the side of the zone
  const signing = new THREE.Group();
  const TB = SIGN.table;
  const tTop = box(TB.length, 0.05, TB.depth, toon(P.white));
  tTop.position.set(-0.6, D.height + TB.height - 0.025, TB.z);
  const tFront = box(TB.length, TB.height - 0.05, 0.03, toon(P.cyan));
  tFront.position.set(-0.6, D.height + (TB.height - 0.05) / 2, TB.z + TB.depth / 2 - 0.015);
  signing.add(tTop, tFront);
  const LN = SIGN.lane;
  const lanePath = [[LN.x, LN.zFrom], [LN.x, LN.zTo], [S.steps.x + 0.2, LN.zTo], [S.steps.x, S.steps.steps * S.steps.run + 0.3]];
  const lane = queueLane(lanePath, { width: LN.width, post: LN.post, beltColor: P.cyan, capColor: P.cyan });
  signing.add(lane.group);
  signing.visible = false;
  g.add(signing);

  // ─── Networking / community area (room coordinates) ───
  const [nx0, nz0, nx1, nz1] = rects.networking;
  const [px0, pz0, px1, pz1] = rects.pause;
  const HT = NET.highTables;
  const tables = [];
  for (let i = 0; i < HT.cols; i++) {
    for (let j = 0; j < HT.rows; j++) {
      const x = nx0 + 3 + i * HT.pitchX, z = nz0 + 3.2 + j * HT.pitchZ;
      if (x > px0 - 1.2 && z > pz0 - 1.2) continue;          // keep clear of the pause pocket
      const t = highTable();
      t.position.set(x, 0, z);
      around.add(t);
      tables.push([x, z]);
    }
  }
  const B = NET.benches;
  const benchC = [nx1 - 4, nz1 - 11];
  for (const [dx, dz, r, c] of [[0, 0, 0, P.yellow], [1.6, 1.0, Math.PI / 2, P.yellow], [-1.6, 1.0, Math.PI / 2, P.white]]) {
    const b = box(B.length, B.height, B.depth, toon(c));
    b.position.set(benchC[0] + dx, B.height / 2, benchC[1] + dz);
    b.rotation.y = r;
    around.add(b);
  }
  // Noticeboard on the end wall (texture slot)
  const NB = NET.noticeboard;
  const nbZ = nz0 + 5.5;
  const board = new THREE.Group();
  board.position.set(nx1 - 0.08, NB.bottom + NB.height / 2, nbZ);
  board.rotation.y = -Math.PI / 2;
  board.add(stickerPanel({ w: NB.width, h: NB.height, t: 0.06, color: P.white, border: 0.06, offset: 0.1, offsetColor: P.yellow }));
  const notice = makeSlot('miniNotice', {
    w: NB.width, h: NB.height, bg: P.white, emissive: false,
    placeholder: labelPlaceholder('NOTICEBOARD', `COMMUNITY · ${NB.width} × ${NB.height} M`, null, { bg: P.white, offset: P.yellow }),
  });
  notice.group.position.z = 0.035;
  board.add(notice.group);
  around.add(board);
  slotsReady.push(notice.ready);

  // ─── Proposed pause pocket: soft seating, water point, REST sign ───
  const softCols = [P.cyan, P.pink, P.yellow, P.white];
  const soft = [];
  for (let i = 0; i < PZ.softSeats; i++) {
    const s = box(PZ.seat.width, PZ.seat.height, PZ.seat.depth, toon(softCols[i % softCols.length]));
    const x = px0 + 1.4 + (i % 2) * 2.4, z = pz0 + 2.6 + Math.floor(i / 2) * 1.8;
    s.position.set(x, PZ.seat.height / 2, z);
    around.add(s);
    soft.push([x, z]);
  }
  const water = box(0.5, 1.1, 0.5, toon('#9fd6f0'));
  water.position.set(px1 - 0.6, 0.55, pz0 + 0.6);
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.45, 16), new THREE.MeshToonMaterial({ color: '#cfefff' }));
  bottle.position.set(px1 - 0.6, 1.33, pz0 + 0.6);
  around.add(water, bottle);
  const restTex = canvasTexture(512, 256, (ctx, W, H) => {
    ctx.fillStyle = P.white; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = P.dark; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${H * 0.5}px ${FONT_DISPLAY}`; ctx.fontStretch = 'expanded';
    ctx.fillText(PZ.sign.text, W / 2, H * 0.52);
    ctx.lineWidth = 16; ctx.strokeStyle = P.dark; ctx.strokeRect(0, 0, W, H);
  });
  const post = box(0.06, 1.8, 0.06, toon('#3a373a'));
  post.position.set(px1 - 1.6, 0.9, pz0 + 0.4);
  const rest = new THREE.Mesh(new THREE.PlaneGeometry(PZ.sign.width, PZ.sign.height), toon(P.white, { map: restTex }));
  rest.position.set(px1 - 1.6, 2.0, pz0 + 0.44);
  around.add(post, rest);

  // ─── People ───
  const rand = mulberry32(seed);
  const pick = colorPicker(rand);
  const face = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
  const ox = origin.x, oz = origin.z;
  const people = new THREE.Group();
  const seated = [];
  for (const s of chairs.seats) if (rand() < 0.75) seated.push({ x: ox + s.x, z: oz + s.z, rot: Math.PI, color: pick() });
  for (const [x, z] of soft.slice(0, 3)) seated.push({ x, y: -0.03, z, rot: (rand() > 0.5 ? 1 : -1) * Math.PI / 2, color: pick() });
  people.add(crowd(seated, { seatedPose: true }));

  const standing = [];
  const back = SEAT.firstRow + SEAT.rows * SEAT.rowPitch + 0.6;
  const eye = [-1.2, 7];     // keep space around the "Fan eye level" camera (local)
  for (const s of scatter(rand, { x0: -6, x1: 5.8, z0: back, z1: back + STAND.depth, count: 70, gap: 0.55,
    avoid: (x, z) => (x - eye[0]) ** 2 + (z - eye[1]) ** 2 < 1.2 ** 2 || (Math.abs(x - eye[0]) < 1 && z < eye[1] && z > eye[1] - 3) })) {
    standing.push({ x: ox + s.x, z: oz + s.z, rot: face(s.x, s.z, 0, -2) + (rand() - 0.5) * 0.5, color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 });
  }
  for (const [tx, tz] of tables) {                      // small groups at the high tables
    const n = 2 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + rand();
      const x = tx + Math.sin(a) * 0.75, z = tz + Math.cos(a) * 0.75;
      standing.push({ x, z, rot: face(x, z, tx, tz), color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 });
    }
  }
  standing.push({ x: nx1 - 1.3, z: nbZ + 0.4, rot: Math.PI / 2, color: pick() }, { x: nx1 - 1.2, z: nbZ - 0.5, rot: Math.PI / 2, color: pick() });
  people.add(crowd(standing));
  // on stage: host (cyan) — or two guests at the signing table
  const host = figure(P.cyan);
  host.position.set(ox - 2.35, D.height, oz - 1.0);
  host.rotation.y = 0.35;
  people.add(host);
  const guests = crowd([-1.3, 0.1].map((x) => ({ x: ox + x, y: D.height, z: oz + TB.z - TB.depth / 2 - 0.35, rot: 0, color: x < 0 ? P.pink : P.yellow })), { seatedPose: true });
  const queue = crowd(lane.spots.slice(0, SIGN.queue).map((s) => ({ x: ox + s.x, z: oz + s.z, rot: s.rot, color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 })));
  const signingPeople = new THREE.Group();
  signingPeople.add(guests, queue);
  signingPeople.visible = false;
  people.add(signingPeople);

  const setSigning = (on) => {
    signing.visible = on;
    signingPeople.visible = on;
    host.visible = !on;
  };

  const counts = { seats: chairs.group.userData.count, standing: STAND.capacity };
  const w = (x, y, z) => [x + ox, y, z + oz];
  const labels = [
    { id: 'mdeck', pos: w(D.width / 2 - 0.4, D.height + 0.1, -0.3), title: 'Mini stage deck',
      lines: [`${D.width} × ${D.depth} m · ${m(D.height)} high`, 'Front steps (stage left)'] },
    { id: 'mframe', pos: w(-F.width / 2 + 0.2, D.height + F.height - 0.4, frameFront + 0.05), title: 'Cyan sticker-card frame',
      lines: [`${F.width} × ${F.height} m · bold outline · yellow offset`, `LED ${L.width} × ${L.height} m inside, bottom ${m(L.bottom)}`] },
    { id: 'msign', pos: w(S.sign.width / 2 + 0.5, S.sign.top - 0.3, frameFront + 0.2), title: 'Speech-bubble sign',
      lines: [`"${S.sign.text}" · top ${m(S.sign.top)}`, `≈ ${S.sign.width} m wide (est.)`] },
    { id: 'mtruss', pos: w(-T.span / 2 + 0.2, T.top, T.frontZ), title: 'Box truss',
      lines: [`Top ${m(T.top)} · ground-supported`, `≈ ${m(T.span)} wide (est.) · ${T.lights} lights`] },
    { id: 'mside', pos: w(-SP.x, SP.height + 0.3, SP.z), title: 'Side panels',
      lines: [`2 × ${SP.width} × ${SP.height} m · texture slots`, 'Small PA stacks alongside'] },
    { id: 'mseats', pos: w(-SEAT.seatsPerRow * SEAT.seatWidth / 2, 1.2, SEAT.firstRow + 0.3), title: 'Seating + standing',
      lines: [`${counts.seats} chairs · ${SEAT.rows} rows × ${SEAT.seatsPerRow}`, `Standing behind for ~${STAND.capacity} (≈ ${m(STAND.depth)} deep, est.)`] },
    { id: 'msign2', pos: w(LN.x, 1.4, (LN.zFrom + LN.zTo) / 2), title: 'Signing queue',
      lines: [`${TB.length} m signing table on the deck (toggle)`, `Belt-stanchion lane ${m(LN.width)} wide along the zone side`] },
    { id: 'net', pos: [nx0 + 3, 1.8, nz0 + 2], title: 'Networking / community',
      lines: [`${m2((nx1 - nx0) * (nz1 - nz0) - (px1 - px0) * (pz1 - pz0))}`, `${tables.length} high tables Ø${HT.diameter} m · bench cluster`, `Noticeboard ${NB.width} × ${NB.height} m (texture slot)`] },
    { id: 'pause', pos: [px0 + 0.6, 1.6, pz0 + 0.8], title: 'Proposed pause pocket',
      lines: [`${m2((px1 - px0) * (pz1 - pz0))} by the doors`, 'Soft seating · water point · REST sign'] },
  ];

  return {
    group: g, around, people, labels, fixtures: fx, glows, slotsReady, counts, setSigning,
    ledCentre: new THREE.Vector3(0, L.bottom + L.height / 2, ledZ).add(origin),
  };
}
