// The Sticker Stage: deck, LED, sticker-card frame, logo sign, wings, stars, truss, PA.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { stage as S, palette as P } from '../../stage.config.js';
import { L } from '../layout.js';
import { toon, flat, box, outline, stickerPanel, starSticker, canvasTexture, OUTLINE } from '../sticker.js';
import { makeSlot, makeCutoutSlot, placeholders } from '../slots.js';

const TRUSS_COLOR = '#c9ced3';

// Box truss section along X, centred, length `len`, square section `s`.
function trussGeometry(len, s) {
  const parts = [];
  const r = 0.028;
  const h = s / 2 - r;
  const chord = new THREE.CylinderGeometry(r, r, len, 6);
  chord.rotateZ(Math.PI / 2);
  const corners = [[h, h], [h, -h], [-h, -h], [-h, h]];
  for (const [y, z] of corners) parts.push(chord.clone().translate(0, y, z));

  const up = new THREE.Vector3(0, 1, 0);
  const strut = (a, b) => {
    const d = b.clone().sub(a);
    const c = new THREE.CylinderGeometry(0.013, 0.013, d.length(), 4);
    c.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, d.normalize()));
    const m = a.clone().add(b).multiplyScalar(0.5);
    c.translate(m.x, m.y, m.z);
    parts.push(c);
  };
  const n = Math.max(1, Math.round(len / s));
  const step = len / n;
  for (let f = 0; f < 4; f++) {
    const A = corners[f], B = corners[(f + 1) % 4];
    for (let i = 0; i < n; i++) {
      const x0 = -len / 2 + i * step, x1 = x0 + step;
      const [p, q] = i % 2 ? [B, A] : [A, B];
      strut(new THREE.Vector3(x0, p[0], p[1]), new THREE.Vector3(x1, q[0], q[1]));
    }
  }
  return mergeGeometries(parts);
}

function buildTruss(g) {
  const T = S.truss;
  const s = T.size;
  const mat = toon(TRUSS_COLOR);
  const lx = L.trussLegX;
  const zf = L.trussFrontZ, zb = L.trussBackZ;
  const legLen = T.top - s;
  const add = (geo, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
    return m;
  };

  const legGeo = trussGeometry(legLen, s).rotateZ(Math.PI / 2);
  const spanGeo = trussGeometry(T.spanOuter, s);
  const sideGeo = trussGeometry(T.depth - s, s).rotateY(Math.PI / 2);
  const clad = S.arch.enabled; // the front goalpost is inside the arch cladding
  for (const x of [-lx, lx]) for (const z of clad ? [zb] : [zf, zb]) {
    add(legGeo, x, legLen / 2, z);
    const plate = box(0.8, 0.03, 0.8, toon('#3a373a'), { line: OUTLINE });
    plate.position.set(x, 0.015, z);
    g.add(plate);
    const ballast = box(0.5, 0.25, 0.5, toon('#58545a'));
    ballast.position.set(x + Math.sign(x) * 0.55, 0.125, z);
    g.add(ballast);
  }
  const yTop = T.top - s / 2;
  if (!clad) add(spanGeo, 0, yTop, zf);
  add(spanGeo, 0, yTop, zb);
  add(sideGeo, -lx, yTop, (zf + zb) / 2);
  add(sideGeo, lx, yTop, (zf + zb) / 2);
}

// Moving-head style fixtures hung under the front top truss.
function buildFixtures(g) {
  const T = S.truss;
  const n = T.fixtures;
  const span = 2 * (L.trussLegX - 0.8);
  const colors = [P.pink, P.cyan, P.yellow, P.cyan, P.pink];
  const fixtures = [];
  const bodyMat = toon('#2e2c2f');
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : -span / 2 + (span * i) / (n - 1);
    const f = new THREE.Group();
    f.position.set(x, S.arch.enabled ? L.archHeaderBottom : T.top - T.size, L.trussFrontZ);
    const clamp = box(0.34, 0.12, 0.28, bodyMat);
    clamp.position.y = -0.06;
    f.add(clamp);
    const yoke = box(0.3, 0.2, 0.08, bodyMat, { edges: false });
    yoke.position.y = -0.2;
    f.add(yoke);
    const head = new THREE.Group();
    head.position.y = -0.36;
    const shell = box(0.26, 0.26, 0.3, bodyMat);
    head.add(shell);
    const lensMat = new THREE.MeshBasicMaterial({ color: '#555' });
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), lensMat);
    lens.position.z = 0.152;
    head.add(lens);
    f.add(head);
    g.add(f);
    const i2 = i - (n - 1) / 2;
    const target = i % 2 === 0
      ? new THREE.Vector3(i2 * 3.2, 0, 8)      // over the crowd
      : new THREE.Vector3(i2 * 0.9, 1, -3);    // onto the deck
    head.lookAt(new THREE.Vector3(x, 0, 6));
    fixtures.push({ head, lensMat, color: colors[i % colors.length], target });
  }
  return fixtures;
}

// ─── Front arch ─────────────────────────────────────────────────────────────
// Printed cladding around the front truss goalpost, styled after the OPF entrance
// arch: teal with white swooshes, light checker patches, stars and dark corner
// wedges. The print is drawn in world metres across the whole arch face, so it
// runs on from the pillars into the header.
const ARCH_TEAL = '#1fc3cc';
const ARCH_CHECK = '#63dce3';
const PPM = 150; // print resolution, pixels per metre

function drawArchPrint(ctx, xMax, yTop) {
  ctx.fillStyle = ARCH_TEAL;
  ctx.fillRect(-xMax, 0, 2 * xMax, yTop);

  // Checker patches: lower pillars and the header ends
  const sq = 0.22;
  ctx.fillStyle = ARCH_CHECK;
  for (let y = 0; y < yTop; y += sq) {
    for (let x = -xMax; x < xMax; x += sq) {
      if ((Math.round(x / sq) + Math.round(y / sq)) % 2) continue;
      const pillar = y > 0.35 && y < 2.5;
      const headerEnd = y > yTop - 1.1 && Math.abs(x) > xMax - 2.2;
      if (pillar || headerEnd) ctx.fillRect(x, y, sq, sq);
    }
  }

  // White swooshes: a double sweep over the whole arch, curls near the feet
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  for (const [rx, ry, lw] of [[xMax + 0.7, yTop - 1.15, 0.06], [xMax + 0.95, yTop - 0.9, 0.035]]) {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(0, 0.9, rx, ry, 0, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();
  }
  ctx.lineWidth = 0.04;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * (xMax - 0.2), 1.1, 0.55, 0.75, 0, side < 0 ? -0.6 * Math.PI : -0.4 * Math.PI, side < 0 ? 0.35 * Math.PI : 0.65 * Math.PI, side > 0);
    ctx.stroke();
  }

  // Dark wedges in the header's top corners, with small stars
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#2d2b52';
    ctx.beginPath();
    ctx.moveTo(side * xMax, yTop);
    ctx.lineTo(side * (xMax - 1.7), yTop);
    ctx.lineTo(side * xMax, yTop - 0.95);
    ctx.closePath();
    ctx.fill();
  }

  // 4-point stars (x, y, size, colour)
  const stars = [
    [-xMax + 0.45, 5.95, 0.1, P.yellow], [-xMax + 0.95, 5.85, 0.07, P.pink], [xMax - 0.5, 5.95, 0.1, P.yellow],
    [xMax - 1.0, 5.8, 0.07, P.pink], [xMax - 0.35, 5.6, 0.06, P.white],
    [-xMax + 0.3, 3.3, 0.09, P.white], [-xMax + 0.62, 2.9, 0.07, P.pink], [-xMax + 0.25, 1.9, 0.06, P.yellow],
    [xMax - 0.3, 3.6, 0.09, P.white], [xMax - 0.6, 3.1, 0.07, P.yellow], [xMax - 0.35, 1.6, 0.06, P.pink],
    [-3.2, 5.45, 0.07, P.white], [3.4, 5.5, 0.07, P.white], [-1.6, 5.35, 0.05, P.pink], [1.9, 5.35, 0.05, P.yellow],
  ];
  ctx.lineWidth = 0.012;
  ctx.strokeStyle = P.dark;
  for (const [x, y, r, c] of stars) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.quadraticCurveTo(x + r * 0.12, y + r * 0.12, x + r, y);
    ctx.quadraticCurveTo(x + r * 0.12, y - r * 0.12, x, y - r);
    ctx.quadraticCurveTo(x - r * 0.12, y - r * 0.12, x - r, y);
    ctx.quadraticCurveTo(x - r * 0.12, y + r * 0.12, x, y + r);
    ctx.fill();
    ctx.stroke();
  }
}

// Texture for the face of the arch covering x0..x0+w, y0..y0+h (world metres).
function archFace(x0, y0, w, h, xMax, yTop) {
  return canvasTexture(Math.round(w * PPM), Math.round(h * PPM), (ctx, pw, ph) => {
    ctx.setTransform(PPM, 0, 0, -PPM, -x0 * PPM, (y0 + h) * PPM); // world metres, y up
    drawArchPrint(ctx, xMax, yTop);
  });
}

function buildArch(g) {
  const A = S.arch;
  const T = S.truss;
  const xMax = L.archHalfWidth;
  const yTop = T.top;
  const plain = toon(ARCH_TEAL);
  const printed = (x0, y0, w, h) => toon(P.white, { map: archFace(x0, y0, w, h, xMax, yTop) });
  // BoxGeometry faces: +x, -x, +y, -y, +z (front), -z (back)
  const pillarH = L.archHeaderBottom;
  for (const side of [-1, 1]) {
    const x = side * L.trussLegX;
    const front = printed(x - A.pillarWidth / 2, 0, A.pillarWidth, pillarH);
    const pillar = box(A.pillarWidth, pillarH, A.pillarDepth, [plain, plain, plain, plain, front, plain]);
    pillar.position.set(x, pillarH / 2, L.trussFrontZ);
    g.add(pillar);
  }
  const hw = 2 * xMax;
  const front = printed(-xMax, L.archHeaderBottom, hw, A.headerHeight);
  const header = box(hw, A.headerHeight, A.headerDepth, [plain, plain, plain, plain, front, plain]);
  header.position.set(0, L.archHeaderBottom + A.headerHeight / 2, L.trussFrontZ);
  g.add(header);
}

export function buildStage() {
  const g = new THREE.Group();
  g.name = 'stage';
  const D = S.deck;

  // Deck
  const deckTop = toon('#343135');
  const deckSide = toon(P.dark);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(D.width, D.height, D.depth),
    [deckSide, deckSide, deckTop, deckSide, deckSide, deckSide]);
  deck.position.set(0, D.height / 2, -D.depth / 2);
  deck.castShadow = deck.receiveShadow = true;
  outline(deck);
  g.add(deck);

  // Deck front skirt lettering (as on the elevation)
  const skirtTex = canvasTexture(1536, 256, (ctx, w, h) => {
    ctx.fillStyle = P.dark;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = P.white;
    ctx.font = `${h * 0.3}px "Archivo Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`STAGE DECK · ${D.width} × ${D.depth} M · H ${D.height.toFixed(1)} M`, w / 2, h / 2, w * 0.9);
  });
  const skirt = new THREE.Mesh(new THREE.PlaneGeometry(D.width * 0.8, D.width * 0.8 / 6),
    new THREE.MeshToonMaterial({ map: skirtTex }));
  skirt.position.set(0, D.height / 2, 0.003);
  g.add(skirt);

  // Crossover behind the LED
  const C = S.crossover;
  const cross = box(C.width, C.height, C.depth, toon('#2c2a2d'));
  cross.position.set(0, C.height / 2, -D.depth - C.depth / 2);
  g.add(cross);

  // Sticker-card frame (white, bold outline, pink offset)
  const F = S.frame;
  const fh = F.top - D.height;
  const frame = stickerPanel({
    w: F.width, h: fh, t: F.thickness, color: P.white,
    border: F.outline, offset: F.offset, offsetColor: P.pink,
  });
  frame.position.set(0, D.height + fh / 2, L.frameZ);
  frame.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  g.add(frame);

  // LED wall (emissive video/texture slot + subtle panel grid)
  const LED = S.led;
  const led = new THREE.Group();
  led.position.set(0, LED.bottom + LED.height / 2, L.ledZ);
  const housing = box(LED.width + 0.1, LED.height + 0.1, 0.1, flat('#111012'));
  housing.position.z = -0.05;
  led.add(housing);
  const ledSlot = makeSlot('led', { w: LED.width, h: LED.height, bg: '#0b0a0c', placeholder: placeholders.led });
  ledSlot.group.position.z = 0.002;
  led.add(ledSlot.group);
  const gridTex = canvasTexture(LED.cols * 100, LED.rows * 100, (ctx, w, h) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 3;
    for (let i = 1; i < LED.cols; i++) { ctx.beginPath(); ctx.moveTo(i * 100, 0); ctx.lineTo(i * 100, h); ctx.stroke(); }
    for (let j = 1; j < LED.rows; j++) { ctx.beginPath(); ctx.moveTo(0, j * 100); ctx.lineTo(w, j * 100); ctx.stroke(); }
  });
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(LED.width, LED.height),
    new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 0.45, depthWrite: false }));
  grid.position.z = 0.012;
  led.add(grid);
  g.add(led);

  if (S.arch.enabled) buildArch(g);

  // OPF logo: die-cut sign sitting on the front arch's header
  const LG = S.logo;
  const logoSlot = makeCutoutSlot('logo', {
    width: LG.width, maxHeight: LG.maxHeight, thickness: LG.thickness, border: LG.border,
    boardColor: P[LG.board], edgeColor: new THREE.Color(P[LG.board]).multiplyScalar(0.82), placeholder: placeholders.logo,
    // Bottom edge hangs `drop` below the header top; the top stays clear of the ceiling.
    onBuild: (sign, w, h) => { sign.position.y = Math.min(S.truss.top - LG.drop + h / 2, S.ceiling.height - 0.15 - h / 2); },
  });
  logoSlot.group.position.z = L.logoZ;
  g.add(logoSlot.group);

  // Wings (cyan left, yellow right) with KV/sponsor print slots
  const W = S.wings;
  for (const side of [-1, 1]) {
    const color = side < 0 ? P.cyan : P.yellow;
    const wing = stickerPanel({ w: W.width, h: W.height, t: W.thickness, color, border: 0.07, offset: 0.14 });
    wing.position.set(side * (D.width / 2 + W.width / 2 + 0.02), W.height / 2, L.frameZ);
    wing.rotation.y = (-side * W.angleDeg * Math.PI) / 180;
    wing.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
    const slot = makeSlot(side < 0 ? 'wingLeft' : 'wingRight', {
      w: W.width - 0.2, h: W.height - 0.5, bg: color, emissive: false,
      placeholder: placeholders.wing({ bg: color }),
    });
    slot.group.position.set(0, 0.05, W.thickness / 2 + 0.002);
    wing.add(slot.group);
    g.add(wing);
  }

  // Sparkle stickers
  for (const st of S.stars) {
    const star = starSticker(st.size, P[st.color]);
    star.position.set(st.x, st.y, L.frameFront + st.z);
    g.add(star);
  }

  // PA stacks (2 boxes each, ground-stacked)
  const PA = S.pa;
  const paMat = toon('#3a373a');
  const grilleMat = toon('#1c1a1d');
  for (const side of [-1, 1]) {
    let y = 0;
    for (const bh of PA.boxHeights) {
      const b = box(PA.width, bh, PA.depth, paMat);
      b.position.set(side * PA.centreX, y + bh / 2, PA.z);
      const grille = new THREE.Mesh(new THREE.PlaneGeometry(PA.width * 0.84, bh * 0.84), grilleMat);
      grille.position.z = PA.depth / 2 + 0.003;
      b.add(grille);
      g.add(b);
      y += bh;
    }
  }

  buildTruss(g);
  const fixtures = buildFixtures(g);

  // Night glow rim: HDR-bright halo behind the LED. Only this (not the artwork
  // itself) exceeds the bloom threshold, so the KV stays crisp and unaltered.
  const glows = [];
  const halo = (w, h, color, strength, x, y, z) => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(strength), toneMapped: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.visible = false;
    g.add(m);
    glows.push(m);
  };
  halo(LED.width + 0.22, LED.height + 0.22, '#ffd6ec', 2.2, 0, LED.bottom + LED.height / 2, L.ledZ - 0.055);

  return {
    group: g,
    fixtures,
    glows,
    slots: [ledSlot, logoSlot],
  };
}
