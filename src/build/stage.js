// The Sticker Stage: deck, LED, sticker-card frame, lightbox, wings, stars, truss, PA.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { stage as S, palette as P } from '../../stage.config.js';
import { L } from '../layout.js';
import { toon, flat, box, outline, stickerPanel, starSticker, canvasTexture, OUTLINE } from '../sticker.js';
import { makeSlot, placeholders } from '../slots.js';

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
  for (const x of [-lx, lx]) for (const z of [zf, zb]) {
    add(legGeo, x, legLen / 2, z);
    const plate = box(0.8, 0.03, 0.8, toon('#3a373a'), { line: OUTLINE });
    plate.position.set(x, 0.015, z);
    g.add(plate);
    const ballast = box(0.5, 0.25, 0.5, toon('#58545a'));
    ballast.position.set(x + Math.sign(x) * 0.55, 0.125, z);
    g.add(ballast);
  }
  const yTop = T.top - s / 2;
  add(spanGeo, 0, yTop, zf);
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
    f.position.set(x, T.top - T.size, L.trussFrontZ);
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

  // OPF logo lightbox (face is an image slot; logo shown exactly as supplied)
  const LG = S.logo;
  const lb = new THREE.Group();
  lb.position.set(0, LG.top - LG.height / 2, L.frameFront + LG.depth / 2 + 0.02);
  const lbBody = box(LG.width, LG.height, LG.depth, toon(P.white));
  lb.add(lbBody);
  const lbShadow = box(LG.width, LG.height, 0.05, toon(P.dark), { edges: false });
  lbShadow.position.set(0.1, -0.1, -LG.depth / 2 - 0.01);
  lb.add(lbShadow);
  const logoSlot = makeSlot('logo', {
    w: LG.width - 0.06, h: LG.height - 0.06, bg: P.white, padding: LG.padding,
    placeholder: placeholders.logo,
  });
  logoSlot.group.position.z = LG.depth / 2 + 0.002;
  lb.add(logoSlot.group);
  g.add(lb);

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

  // Night glow rims: HDR-bright halos behind the LED and lightbox. Only these (not the
  // artwork itself) exceed the bloom threshold, so KV and logo stay crisp and unaltered.
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
  halo(LG.width + 0.12, LG.height + 0.12, '#ffffff', 1.7, 0, LG.top - LG.height / 2, L.frameFront + 0.015);

  return {
    group: g,
    fixtures,
    glows,
    lightboxMat: logoSlot.bgMat,
    slots: [ledSlot, logoSlot],
  };
}
