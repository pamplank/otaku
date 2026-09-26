// Simple massing of the ballroom builds for the overview (step 1). The detailed
// builds (panel stage, mini stage, arch) replace these as they are made.
// Local coordinates: origin = deck front centre (arch: arch centre), facing +z.
import * as THREE from 'three';
import { palette as P } from '../../stage.config.js';
import { stage as MS } from '../../config/mini.config.js';
import { arch as AR } from '../../config/arch.config.js';
import { toon, flat, box, stickerPanel, canvasTexture, FONT_DISPLAY } from '../sticker.js';
import { trussGeometry } from '../build/stage.js';

const TRUSS = '#c9ced3';

function goalpost(g, { top, size, span }, z) {
  const mat = toon(TRUSS);
  const lx = span / 2 - size / 2;
  const leg = trussGeometry(top - size, size).rotateZ(Math.PI / 2);
  for (const x of [-lx, lx]) {
    const m = new THREE.Mesh(leg, mat);
    m.position.set(x, (top - size) / 2, z);
    m.castShadow = true;
    g.add(m);
  }
  const beam = new THREE.Mesh(trussGeometry(span, size), mat);
  beam.position.set(0, top - size / 2, z);
  beam.castShadow = true;
  g.add(beam);
}

function screen(w, h, label) {
  const tex = canvasTexture(640, Math.round(640 * h / w), (ctx, W, H) => {
    ctx.fillStyle = '#16151a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${H * 0.14}px ${FONT_DISPLAY}`;
    ctx.fillText(label, W / 2, H / 2, W * 0.9);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
}


export function miniStageMassing() {
  const g = new THREE.Group();
  const D = MS.deck;
  const deck = box(D.width, D.height, D.depth, toon('#2b292d'));
  deck.position.set(0, D.height / 2, -D.depth / 2);
  g.add(deck);
  const F = MS.frame;
  const frame = stickerPanel({ w: F.width, h: F.height, t: 0.12, color: P.cyan, border: 0.08, offset: 0.2, offsetColor: P.yellow });
  frame.position.set(0, D.height + F.height / 2, -D.depth + 0.3);
  g.add(frame);
  const led = screen(MS.led.width, MS.led.height, 'LED 4 × 2.25 M');
  led.position.set(0, MS.led.bottom + MS.led.height / 2, -D.depth + 0.3 + 0.07);
  g.add(led);
  goalpost(g, MS.truss, -D.depth + 0.8);
  return g;
}

export function archMassing() {
  const g = new THREE.Group();
  const A = AR, O = A.opening;
  const legW = (A.width - O.width) / 2;
  const white = toon(P.white), pink = toon(P.pink);
  const parts = [
    [legW, A.height, -(O.width / 2 + legW / 2), A.height / 2],
    [legW, A.height, O.width / 2 + legW / 2, A.height / 2],
    [O.width, A.height - O.height, 0, O.height + (A.height - O.height) / 2],
  ];
  for (const [w, h, x, y] of parts) {
    const b = box(w, h, A.depth, white);
    b.position.set(x, y, 0);
    g.add(b);
  }
  const off = new THREE.Group();
  for (const [w, h, x, y] of parts) {
    const b = box(w, h, 0.1, pink, { edges: false });
    b.position.set(x + 0.22, y - 0.22, -A.depth / 2 - 0.06);
    off.add(b);
  }
  g.add(off);
  return g;
}
