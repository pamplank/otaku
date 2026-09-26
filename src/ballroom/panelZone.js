// PANEL STAGE zone: stage, frame, LED, header, logo lightbox, IMAG towers, truss,
// furniture (panel table or lounge), access, theatre seating, Q&A mics, camera
// riser, FOH, and the people in it. Used by the Panel Stage build and the overview.
// Built in local coordinates (origin = deck front centre, facing +z) inside a
// group placed at `origin`.
import * as THREE from 'three';
import { stage as S, access as AC, furniture as FU, seating as SEAT, qaMics, cameraRiser as CR, foh as FOH } from '../../config/panel.config.js';
import { palette as P, assets as MAIN_ASSETS } from '../../stage.config.js';
import { toon, flat, box, stickerPanel, starSticker, canvasTexture, drawSparkle, polyline, OUTLINE, FONT_DISPLAY } from '../sticker.js';
import { makeSlot, labelPlaceholder } from '../slots.js';
import { theatreSeating } from './seating.js';
import { crowd, figure, colorPicker, mulberry32 } from './figures.js';
import { boxTruss, trussTower, fixtures as rigFixtures, stairs, stickerCard } from './rig.js';

const DARK_DECK = '#2b292d';
const frameZ = -S.deck.depth + S.frame.setback;           // frame centre plane
const frameFront = frameZ + S.frame.thickness / 2;
const ledZ = frameFront + 0.06;

// Artwork slots (admin "Edit artwork"): keys are unique across all builds
export const PANEL_ARTWORK = {
  panelLed:   { title: 'Panel LED wall',    accept: 'image/*,video/*', kind: 'Image or video' },
  panelImagL: { title: 'IMAG left',         accept: 'image/*,video/*', kind: 'Image or video' },
  panelImagR: { title: 'IMAG right',        accept: 'image/*,video/*', kind: 'Image or video' },
  panelSkirt: { title: 'Table skirt print', accept: 'image/*',         kind: 'Image' },
  panelLogo:  { title: 'OPF logo lightbox', accept: 'image/*',         kind: 'Image' },
};

const m = (v) => `${+v.toFixed(2)} m`;
export const lastRowZ = () => SEAT.firstRow + (SEAT.rows - 1) * SEAT.rowPitch + 0.3;

function checkerTexture(w, h, sq) {
  const ppm = 120;
  return canvasTexture(Math.round(w * ppm), Math.round(h * ppm), (ctx, W, H) => {
    const s = sq * ppm;
    for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) {
      ctx.fillStyle = (Math.round(x / s) + Math.round(y / s)) % 2 ? P.dark : P.cyan;
      ctx.fillRect(x, y, s + 1, s + 1);
    }
    ctx.lineWidth = 10;
    ctx.strokeStyle = P.dark;
    ctx.strokeRect(0, 0, W, H);
  });
}

// Chair facing +z (the audience), for the panel table
function panelChair() {
  const g = new THREE.Group();
  const mat = toon('#3a373a');
  const seat = box(0.48, 0.06, 0.46, mat);
  seat.position.y = 0.45;
  const back = box(0.48, 0.5, 0.06, mat);
  back.position.set(0, 0.73, -0.2);
  g.add(seat, back);
  for (const [x, z] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]) {
    const l = box(0.04, 0.45, 0.04, mat, { edges: false });
    l.position.set(x, 0.225, z);
    g.add(l);
  }
  return g;
}

function armchair(color) {
  const g = new THREE.Group();
  const mat = toon(color);
  const base = box(0.8, 0.42, 0.78, mat);
  base.position.y = 0.21;
  const back = box(0.8, 0.5, 0.18, mat);
  back.position.set(0, 0.67, -0.3);
  g.add(base, back);
  for (const sx of [-1, 1]) {
    const arm = box(0.14, 0.24, 0.7, mat);
    arm.position.set(sx * 0.33, 0.54, 0.02);
    g.add(arm);
  }
  return g;
}

function tableMic() {
  const g = new THREE.Group();
  const baseM = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 16), toon('#2a282c'));
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 6), toon('#2a282c'));
  neck.position.set(0, 0.18, 0.04);
  neck.rotation.x = 0.35;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), toon('#2a282c'));
  head.position.set(0, 0.34, 0.1);
  g.add(baseM, neck, head);
  return g;
}

function micStand() {
  const g = new THREE.Group();
  const mat = toon('#2a282c');
  const baseM = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 20), mat);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 8), mat);
  pole.position.y = 0.75;
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.018, 0.18, 10), mat);
  mic.position.set(0, 1.52, 0.06);
  mic.rotation.x = -1.1;
  g.add(baseM, pole, mic);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// MC podium with a sticker-style front: white face, dark outline, pink offset, yellow sparkle
function podium() {
  const { width: w, depth: d, height: h } = FU.podium;
  const g = new THREE.Group();
  const body = box(w, h, d, toon(P.white));
  body.position.y = h / 2;
  g.add(body);
  const top = box(w + 0.1, 0.04, d + 0.1, toon(P.dark));
  top.position.y = h + 0.02;
  g.add(top);
  const tex = canvasTexture(280, 460, (ctx, W, H) => {
    ctx.fillStyle = P.white; ctx.fillRect(0, 0, W, H);
    drawSparkle(ctx, W / 2, H * 0.38, W * 0.32, P.yellow, P.dark, 7);
    ctx.fillStyle = P.dark; ctx.textAlign = 'center';
    ctx.font = `900 ${W * 0.2}px ${FONT_DISPLAY}`; ctx.fontStretch = 'expanded';
    ctx.fillText('OPF', W / 2, H * 0.78);
    ctx.lineWidth = 12; ctx.strokeStyle = P.dark; ctx.strokeRect(0, 0, W, H);
  });
  const card = stickerCard(w * 0.86, h * 0.8, tex, { offset: 0.05, offsetColor: P.pink, depth: 0.03 });
  card.position.set(0, h * 0.48, d / 2 + 0.04);
  g.add(card);
  const mic = tableMic();
  mic.position.set(0, h + 0.04, 0.05);
  g.add(mic);
  return g;
}

function wheelchairLift() {
  const { width: w, depth: d } = AC.lift;
  const g = new THREE.Group();
  const base = box(w + 0.2, 0.12, d + 0.2, toon('#4a474b'));
  base.position.y = 0.06;
  const platform = box(w, 0.05, d, toon('#8c8a90'));
  platform.position.y = 0.2;
  const mast = box(0.2, S.deck.height + 1.1, 0.25, toon('#8c8a90'));
  mast.position.set(w / 2 + 0.1, (S.deck.height + 1.1) / 2, -d / 2 + 0.12);
  g.add(base, platform, mast);
  // guard rails + gate (cyan = accessibility highlight)
  const railMat = toon(P.cyan);
  for (const [x, z, rw, rd] of [[-w / 2, 0, 0.04, d], [0, d / 2, w, 0.04]]) {
    const r = box(rw, 0.04, rd, railMat, { edges: false });
    r.position.set(x, 1.1, z);
    g.add(r);
    for (const t of [-0.5, 0.5]) {
      const p = box(0.04, 0.9, 0.04, railMat, { edges: false });
      p.position.set(x + (rw > 0.1 ? t * rw : 0), 0.65, z + (rd > 0.1 ? t * rd : 0));
      g.add(p);
    }
  }
  const sign = canvasTexture(160, 160, (ctx, W, H) => {
    ctx.fillStyle = '#1f5fbf'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${W * 0.5}px ${FONT_DISPLAY}`; ctx.fillText('♿', W / 2, H / 2 + 6);
  });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), toon('#fff', { map: sign }));
  s.position.set(w / 2 + 0.1, 1.3, -d / 2 + 0.25 + 0.001);
  g.add(s);
  return g;
}

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

// ─── Build ──────────────────────────────────────────────────────────────────
export function buildPanelZone({ origin = new THREE.Vector3(), seed = 480 } = {}) {
  const g = new THREE.Group();
  g.position.copy(origin);
  const D = S.deck;
  const slotsReady = [];
  const glows = [];

  // Deck
  const deck = box(D.width, D.height, D.depth, toon(DARK_DECK));
  deck.position.set(0, D.height / 2, -D.depth / 2);
  deck.castShadow = deck.receiveShadow = true;
  g.add(deck);
  const skirt = new THREE.Mesh(new THREE.PlaneGeometry(D.width, D.height), toon('#232124'));
  skirt.position.set(0, D.height / 2, 0.003);
  g.add(skirt);

  // Frame: white sticker card, full stage width, pink offset
  const F = S.frame;
  const fh = F.top - D.height;
  const frame = stickerPanel({ w: D.width, h: fh, t: F.thickness, color: P.white, border: F.outline, offset: F.offset, offsetColor: P.pink });
  frame.position.set(0, D.height + fh / 2, frameZ);
  frame.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  g.add(frame);

  // Header box: cyan / dark checkerboard across the top of the frame
  const H = S.header;
  const hw = D.width + 2 * F.outline;
  const checker = checkerTexture(hw, H.height, H.square);
  const plain = toon(P.dark);
  const header = box(hw, H.height, H.depth, [plain, plain, plain, plain, toon(P.white, { map: checker }), plain]);
  header.position.set(0, F.top - H.height / 2, frameFront + H.depth / 2);
  g.add(header);

  // Centre LED (emissive slot)
  const L = S.led;
  const ledHousing = box(L.width + 0.1, L.height + 0.1, 0.1, flat('#111012'));
  ledHousing.position.set(0, L.bottom + L.height / 2, ledZ - 0.05);
  g.add(ledHousing);
  const led = makeSlot('panelLed', {
    w: L.width, h: L.height, bg: '#0b0a0c',
    placeholder: labelPlaceholder('KV PLACEHOLDER', `PANEL LED · ${L.width} × ${L.height} M · 16:9`, 'Titles · live camera · panelist cards — official content to be supplied'),
  });
  led.group.position.set(0, L.bottom + L.height / 2, ledZ + 0.002);
  g.add(led.group);
  slotsReady.push(led.ready);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(L.width + 0.2, L.height + 0.2),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd6ec').multiplyScalar(2.2), toneMapped: false }));
  halo.position.set(0, L.bottom + L.height / 2, ledZ - 0.055);
  halo.visible = false;
  g.add(halo);
  glows.push(halo);

  // OPF logo lightbox on top of the header (supplied logo only, shown whole)
  const LG = S.logo;
  const lb = new THREE.Group();
  lb.position.set(0, LG.top - LG.height / 2, frameFront + LG.depth / 2 + 0.02);
  lb.add(box(LG.width, LG.height, LG.depth, toon(P.white)));
  const lbShadow = box(LG.width, LG.height, 0.05, toon(P.dark), { edges: false });
  lbShadow.position.set(0.1, -0.1, -LG.depth / 2 - 0.01);
  lb.add(lbShadow);
  const logo = makeSlot('panelLogo', {
    w: LG.width - 0.06, h: LG.height - 0.06, bg: P.white, padding: 0.08,
    assets: MAIN_ASSETS.logo,
    placeholder: labelPlaceholder('OPF LOGO', 'LIGHTBOX · SUPPLIED FILE ONLY', null, { bg: P.white, card: P.white }),
  });
  logo.group.position.z = LG.depth / 2 + 0.002;
  lb.add(logo.group);
  g.add(lb);
  slotsReady.push(logo.ready);

  // Truss: goalpost at the deck front + one behind the frame, 6 lights on the front beam
  const T = S.truss;
  const backZ = frameZ - 0.5;
  g.add(boxTruss({ top: T.top, size: T.size, span: T.span, zs: [T.frontZ, backZ] }));
  const n = T.lights, span = T.span - 2.4;
  const xs = Array.from({ length: n }, (_, i) => -span / 2 + (span * i) / (n - 1));
  // odd heads wash the panel table across its length, even heads sweep the audience
  const targets = xs.map((x, i) => (i % 2 ? new THREE.Vector3(x * 0.62, D.height, FU.table.z + 0.8) : new THREE.Vector3(x * 1.3, 0, 7)));
  const fx = rigFixtures(g, { xs, y: T.top - T.size, z: T.frontZ, targets, origin, colors: [P.pink, P.cyan, P.yellow] });

  // IMAG screens on truss towers either side
  const I = S.imag;
  const imagSlots = [];
  for (const [side, key, label] of [[-1, 'panelImagL', 'IMAG LEFT'], [1, 'panelImagR', 'IMAG RIGHT']]) {
    const x = side * I.x;
    for (const dx of [-I.width / 2 + 0.15, I.width / 2 - 0.15]) {
      const tw = trussTower(I.towerTop, 0.3);
      tw.position.set(x + dx, 0, I.z - 0.25);
      g.add(tw);
    }
    const housing = box(I.width + 0.1, I.height + 0.1, 0.1, flat('#111012'));
    housing.position.set(x, I.bottom + I.height / 2, I.z - 0.05);
    g.add(housing);
    const s = makeSlot(key, {
      w: I.width, h: I.height, bg: '#0b0a0c',
      placeholder: labelPlaceholder(label, `${I.width} × ${I.height} M · 16:9`, 'Live camera feed — placeholder'),
    });
    s.group.position.set(x, I.bottom + I.height / 2, I.z + 0.002);
    g.add(s.group);
    imagSlots.push(s);
    slotsReady.push(s.ready);
  }

  // PA stacks outside the IMAG towers' feet, ground-stacked
  for (const side of [-1, 1]) {
    const pa = paStack();
    pa.position.set(side * S.pa.x, 0, S.pa.z);
    g.add(pa);
  }

  // Access: stairs both sides of the front, portable wheelchair lift at stage right
  const A = AC.stairs;
  for (const side of [-1, 1]) {
    const st = stairs({ width: A.width, height: D.height, steps: A.steps, run: A.run, riserColors: [P.yellow, P.pink, P.cyan, P.white] });
    st.position.set(side * A.x, 0, 0);
    g.add(st);
  }
  const lift = wheelchairLift();
  lift.position.set(AC.lift.x, 0, AC.lift.z);
  g.add(lift);

  // Sparkles: large yellow top-left of the frame, small cyan near the logo, pink bottom-right of the LED
  const frameSparkZ = frameFront + 0.3;
  for (const [x, y, z, size, c] of [
    [-D.width / 2 + 0.2, F.top - 0.1, frameSparkZ + 0.3, 1.2, P.yellow],
    [LG.width / 2 + 0.5, LG.top - 0.1, frameFront + LG.depth + 0.1, 0.45, P.cyan],
    [L.width / 2 + 0.05, L.bottom + 0.05, ledZ + 0.25, 0.7, P.pink],
  ]) {
    const st = starSticker(size, c);
    st.position.set(x, y, z);
    g.add(st);
  }

  // ─── Furniture: panel table layout ───
  const TB = FU.table;
  const deckY = D.height;
  const tableLayout = new THREE.Group();
  const top = box(TB.length, 0.05, TB.depth, toon(P.white));
  top.position.set(0, deckY + TB.height - 0.025, TB.z);
  tableLayout.add(top);
  const skirtSlot = makeSlot('panelSkirt', {
    w: TB.length, h: TB.height - 0.06, bg: P.white, emissive: false,
    placeholder: labelPlaceholder('TABLE SKIRT PRINT', `${TB.length} × ${+(TB.height - 0.06).toFixed(2)} M`, null, { bg: P.white }),
  });
  skirtSlot.group.position.set(0, deckY + (TB.height - 0.06) / 2, TB.z + TB.depth / 2 + 0.005);
  tableLayout.add(skirtSlot.group);
  slotsReady.push(skirtSlot.ready);
  const back = box(TB.length, TB.height - 0.06, 0.02, toon(P.white), { edges: false });
  back.position.set(0, deckY + (TB.height - 0.06) / 2, TB.z + TB.depth / 2 - 0.01);
  tableLayout.add(back);
  const seatXs = Array.from({ length: FU.chairs }, (_, i) => -TB.length / 2 + TB.length * (i + 0.5) / FU.chairs);
  for (const x of seatXs) {
    const c = panelChair();
    c.position.set(x, deckY, TB.z - TB.depth / 2 - 0.35);
    tableLayout.add(c);
    const mic = tableMic();
    mic.position.set(x, deckY + TB.height, TB.z + 0.12);
    tableLayout.add(mic);
  }
  g.add(tableLayout);

  // ─── Lounge layout (toggle): 6 armchairs + 2 low tables ───
  const lounge = new THREE.Group();
  const loungeXs = [-3.1, -1.9, -0.65, 0.65, 1.9, 3.1];
  const loungeZs = [-2.0, -2.35, -2.5, -2.5, -2.35, -2.0];
  const chairCols = [P.pink, P.white, P.cyan, P.yellow, P.white, P.pink];
  const loungeRot = loungeXs.map((x) => -x * 0.08);
  loungeXs.forEach((x, i) => {
    const a = armchair(chairCols[i]);
    a.position.set(x, deckY, loungeZs[i]);
    a.rotation.y = loungeRot[i];
    lounge.add(a);
  });
  for (const x of [-1.9, 1.9]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.42, 28), toon(P.white));
    t.position.set(x, deckY + 0.21, -1.35);
    t.castShadow = true;
    lounge.add(t);
  }
  lounge.visible = false;
  g.add(lounge);

  // MC podium, stage left (+x)
  const pd = podium();
  pd.position.set(FU.podium.x, deckY, FU.podium.z);
  pd.rotation.y = -0.35;
  g.add(pd);

  // ─── Audience ───
  const seating = theatreSeating(SEAT);
  g.add(seating.group);
  const lastRow = lastRowZ();
  const rowZ = (r) => SEAT.firstRow + r * SEAT.rowPitch + 0.3;
  for (const q of qaMics) {
    const ms = micStand();
    ms.position.set(q.x ?? 0, 0, rowZ(q.row));
    g.add(ms);
  }
  const riser = box(CR.width, CR.height, CR.depth, toon('#3a373a'));
  riser.position.set(0, CR.height / 2, CR.back);
  g.add(riser);
  const cam = box(0.3, 0.3, 0.5, toon('#2a282c'));
  cam.position.set(0.3, CR.height + 1.35, CR.back);
  const tripod = box(0.06, 1.2, 0.06, toon('#2a282c'), { edges: false });
  tripod.position.set(0.3, CR.height + 0.6, CR.back);
  g.add(cam, tripod);
  const fohZ = lastRow + 0.5 + FOH.gap + FOH.depth / 2;
  const fohDesk = box(FOH.width, 0.9, FOH.depth, toon('#2f2c32'));
  fohDesk.position.set(0, 0.45, fohZ);
  g.add(fohDesk);

  // ─── People ───
  const rand = mulberry32(seed);
  const pick = colorPicker(rand);
  const people = new THREE.Group();
  people.position.copy(origin);
  const audience = [];
  for (const s of seating.seats) if (rand() < 0.82) audience.push({ x: s.x, z: s.z, rot: Math.PI, color: pick() });
  people.add(crowd(audience, { seatedPose: true }));
  // panelists: at the table, or in the lounge armchairs
  const panelCols = [P.pink, P.cyan, P.yellow, P.white, P.pink, P.cyan];
  const atTable = crowd(seatXs.map((x, i) => ({ x, y: deckY, z: TB.z - TB.depth / 2 - 0.35, rot: 0, color: panelCols[i] })), { seatedPose: true });
  const inLounge = crowd(loungeXs.map((x, i) => ({ x, y: deckY - 0.03, z: loungeZs[i], rot: loungeRot[i], color: panelCols[i] })), { seatedPose: true });
  inLounge.visible = false;
  people.add(atTable, inLounge);
  // MC at the podium
  const mc = figure(P.yellow);
  mc.position.set(FU.podium.x + 0.1, deckY, FU.podium.z - 0.55);
  mc.rotation.y = -0.35;
  people.add(mc);
  // a few standing at the back, a camera operator, FOH crew
  const standing = [];
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (SEAT.centreAisle / 2 + 2 + rand() * 9);
    standing.push({ x, z: fohZ + 1.5 + rand() * 2.5, rot: Math.PI + (rand() - 0.5) * 0.5, color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 });
  }
  standing.push({ x: -0.3, y: CR.height, z: CR.back + 0.4, rot: Math.PI, color: '#46434b' });
  standing.push({ x: -0.6, z: fohZ + FOH.depth / 2 + 0.5, rot: Math.PI, color: '#3a373a' }, { x: 0.6, z: fohZ + FOH.depth / 2 + 0.5, rot: Math.PI, color: '#46434b' });
  people.add(crowd(standing));

  const counts = { seats: seating.group.userData.count, seated: audience.length, panelists: seatXs.length };
  const setLounge = (on) => {
    tableLayout.visible = !on;
    atTable.visible = !on;
    lounge.visible = on;
    inLounge.visible = on;
  };

  // Label definitions (local coordinates; the caller offsets them)
  const labels = [
    { id: 'deck', pos: [D.width / 2 - 0.6, D.height + 0.1, -0.4], title: 'Stage deck',
      lines: [`${D.width} × ${D.depth} m · ${m(D.height)} high`, 'Dark finish'] },
    { id: 'led', pos: [-L.width / 2 + 0.3, L.bottom + L.height - 0.3, ledZ + 0.05], title: 'Centre LED',
      lines: [`${L.width} × ${L.height} m · 16:9`, `Bottom ${m(L.bottom)} · clears seated panelists`, 'Emissive texture slot'] },
    { id: 'frame', pos: [-D.width / 2 + 0.3, F.top - H.height - 0.4, frameFront + 0.05], title: 'Sticker-card frame',
      lines: [`White, full stage width ${m(D.width)}`, `Top ${m(F.top)} · pink offset layer`, `Header box ${m(H.height)} · cyan/dark checkerboard`] },
    { id: 'logo', pos: [LG.width / 2 + 0.2, LG.top, frameFront + LG.depth], title: 'OPF logo lightbox',
      lines: [`Top edge ${m(LG.top)}`, `≈ ${LG.width} × ${LG.height} m (est.)`, 'Supplied logo only, shown whole'] },
    { id: 'truss', pos: [-T.span / 2 + 0.2, T.top, T.frontZ], title: 'Box truss',
      lines: [`Top ${m(T.top)} · ground-supported`, `≈ ${m(T.span)} wide (est.)`, `${T.lights} lights on the front beam`, 'No ceiling rigging'] },
    { id: 'imag', pos: [I.x - I.width / 2, I.bottom + I.height + 0.3, I.z], title: 'IMAG screens',
      lines: [`2 × ${I.width} × ${I.height} m on truss towers`, `Bottom ${m(I.bottom)}`, 'Texture slots'] },
    { id: 'table', pos: [-TB.length / 2, deckY + TB.height + 0.3, TB.z], title: 'Panel table',
      lines: [`${TB.length} m × ${TB.depth} m (est.) · printed front skirt`, `${FU.chairs} chairs with table mics`, 'Toggle: Lounge layout (6 armchairs + 2 low tables)'] },
    { id: 'podium', pos: [FU.podium.x + 0.4, deckY + FU.podium.height + 0.2, FU.podium.z], title: 'MC podium',
      lines: ['Stage left · sticker-style front', `${FU.podium.width} × ${FU.podium.depth} m · ${m(FU.podium.height)} (est.)`] },
    { id: 'access', pos: [AC.lift.x, 1.6, AC.lift.z], title: 'Access',
      lines: [`Stairs both sides: ${A.width} m wide, handrails both sides`, 'Portable wheelchair lift at stage right'] },
    { id: 'seats', pos: [-(SEAT.centreAisle / 2 + SEAT.seatsPerRow * SEAT.seatWidth), 1.4, SEAT.firstRow + 0.3], title: 'Theatre seating',
      lines: [`${counts.seats} seats · ${SEAT.blocks} blocks × ${SEAT.rows} rows × ${SEAT.seatsPerRow}`, `First row ${m(SEAT.firstRow)} from the stage`,
        `Centre aisle ${m(SEAT.centreAisle)} · side aisles ${m(SEAT.sideAisle)} (est.)`, `Front ${SEAT.vipRows} rows VIP (yellow covers)`] },
    { id: 'qa', pos: [qaMics[0].x ?? 0, 1.8, rowZ(qaMics[0].row)], title: 'Q&A mics',
      lines: ['2 mic stands in the centre aisle'] },
    { id: 'riser', pos: [CR.width / 2, CR.height + 1.8, CR.back], title: 'Camera riser',
      lines: [`${CR.width} × ${CR.depth} m · ${m(CR.height)} (est.)`, `${m(CR.back)} back on the centre aisle`] },
    { id: 'foh', pos: [FOH.width / 2, 1.3, fohZ], title: 'FOH',
      lines: [`Table ${FOH.width} × ${FOH.depth} m (est.)`, 'Back centre'] },
  ];

  return {
    group: g, people, labels, fixtures: fx, glows, slotsReady, counts, setLounge,
    world: (x, y, z) => [x + origin.x, y + origin.y, z + origin.z],
    ledCentre: new THREE.Vector3(0, L.bottom + L.height / 2, ledZ).add(origin),
    rowZ, fohZ, lastRow,
  };
}
