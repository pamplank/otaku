// PLAN A · HOSTED EXHIBITION (6 × 6 m). Timber base platform, KV back wall,
// centre MAIN EXPERIENCE placeholder volume, display counter, belt queue inside
// the footprint, guest-flow badges + arrows, 5 staff with role tags.
// Local coordinates: origin = footprint centre on the hall floor, +z = aisle.
import * as THREE from 'three';
import { palette as P } from '../../stage.config.js';
import { planA as A, neutral as N } from '../../config/booths.config.js';
import { toon, box, canvasTexture, OUTLINE_THIN, FONT, FONT_BODY } from '../sticker.js';
import { crowd, colorPicker, mulberry32 } from '../ballroom/figures.js';
import { queueLane } from '../ballroom/rig.js';
import { m, mm, memo, slotBoard, ipSlot, staffMember, flowBadge, flowArrows, dimLine, footprintDims } from './common.js';

export const BOOTH_A_ARTWORK = {
  boothAKv:      { title: 'Plan A · KV back wall (CyberE)', accept: 'image/*', kind: 'Image' },
  boothACounter: { title: 'Plan A · counter front (CyberE)', accept: 'image/*', kind: 'Image' },
};

// Plank texture for the timber platform top
function planks(w, d) {
  return memo(`planks|${w}|${d}`, () => canvasTexture(1024, Math.round((1024 * d) / w), (ctx, cw, ch) => {
    ctx.fillStyle = '#d8b88a';
    ctx.fillRect(0, 0, cw, ch);
    const n = Math.round(w / 0.2);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 3 === 0 ? '#d2b083' : i % 3 === 1 ? '#dcbd92' : '#d5b487';
      ctx.fillRect((i * cw) / n, 0, cw / n, ch);
      ctx.fillStyle = '#b8966a';
      ctx.fillRect((i * cw) / n, 0, 2, ch);
    }
  }));
}

// "MAIN EXPERIENCE – BUILD PER SUPPLIED DRAWINGS" face
function experienceFace(wM, hM) {
  return memo(`exp|${wM}|${hM}`, () => canvasTexture(Math.round(wM * 220), Math.round(hM * 220), (ctx, w, h) => {
    ctx.fillStyle = N.volume;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c4c0bb';
    ctx.lineWidth = w / 120;
    for (let x = -h; x < w; x += w / 10) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke(); }
    ctx.fillStyle = N.shell;
    const bw = w * 0.86, bh = h * 0.34, bx = (w - bw) / 2, by = h * 0.12;
    ctx.fillRect(bx, by, bw, bh);
    ctx.lineWidth = w / 110;
    ctx.strokeStyle = P.dark;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = P.dark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const line = (t, y, px, font) => {
      ctx.font = `${px}px ${font}`;
      const tw = ctx.measureText(t).width;
      if (tw > bw * 0.9) ctx.font = `${(px * bw * 0.9) / tw}px ${font}`;
      ctx.fillText(t, w / 2, y);
    };
    line('MAIN EXPERIENCE', by + bh * 0.32, bh * 0.3, FONT);
    line('– BUILD PER SUPPLIED DRAWINGS', by + bh * 0.7, bh * 0.17, FONT);
    ctx.font = `700 ${h * 0.045}px ${FONT_BODY}`;
    ctx.fillStyle = '#5b585c';
    ctx.fillText(`PLACEHOLDER VOLUME · ${m(wM)} × ${m(hM)} FACE · CYBERE / JAPAN`, w / 2, by + bh + h * 0.06, w * 0.9);
  }));
}

function signPlane(text, w, h, bg = P.dark, fg = P.white) {
  const tex = memo(`sign|${text}|${w}|${h}|${bg}`, () => canvasTexture(Math.round(w * 400), Math.round(h * 400), (ctx, cw, ch) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${ch * 0.6}px ${FONT}`;
    ctx.fillText(text, cw / 2, ch * 0.55, cw * 0.9);
  }));
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon('#ffffff', { map: tex }));
}

export function buildPlanA({ seed = 11 } = {}) {
  const g = new THREE.Group();
  const lead = P[A.lead];
  const W = A.footprint.width, D = A.footprint.depth, ph = A.platform.height;
  const slotsReady = [];

  // ─── 100 mm timber base platform ───
  const top = toon('#ffffff', { map: planks(W, D) }), edge = toon('#b8966a');
  const platform = box(W, ph, D, [edge, edge, top, edge, edge, edge]);
  platform.position.y = ph / 2;
  g.add(platform);

  const deck = new THREE.Group();          // everything standing on the platform
  deck.position.y = ph;
  g.add(deck);

  // ─── KV panel (back wall, texture slot) + rear braces ───
  const K = A.kvPanel;
  const kvZ = -D / 2 + K.setback + K.thickness / 2;
  const kv = slotBoard('boothAKv', K.width, K.height, K.thickness, 'KEY VISUAL · BACK WALL');
  kv.group.position.set(0, K.height / 2, kvZ);
  deck.add(kv.group);
  slotsReady.push(kv.ready);
  for (const x of [-K.width / 2 + 0.3, 0, K.width / 2 - 0.3]) {
    const brace = box(0.05, K.height * 0.8, 0.05, toon('#b9b6b2'), { edges: false });
    brace.position.set(x, K.height * 0.38, kvZ - 0.3);
    brace.rotation.x = 0.2;
    deck.add(brace);
  }

  // ─── MAIN EXPERIENCE placeholder volume (centre) ───
  const E = A.experience;
  const faceX = experienceFace(E.depth, E.height), faceZ = experienceFace(E.width, E.height);
  const topFace = experienceFace(E.width, E.depth);
  const vol = box(E.width, E.height, E.depth, [
    toon('#ffffff', { map: faceX }), toon('#ffffff', { map: faceX }), toon('#ffffff', { map: topFace }),
    toon(N.volume), toon('#ffffff', { map: faceZ }), toon('#ffffff', { map: faceZ }),
  ]);
  vol.position.set(E.x, E.height / 2, E.z);
  deck.add(vol);
  // doorways: IN on the queue side (left face), OUT at the back towards the photo spot
  const qEnd = A.queue.path[A.queue.path.length - 1];
  const doorIn = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.95), toon('#3a373a'));
  doorIn.rotation.y = -Math.PI / 2;
  doorIn.position.set(E.x - E.width / 2 - 0.004, 0.975, qEnd[1]);
  const signIn = signPlane('IN', 0.5, 0.22, lead, P.dark);
  signIn.rotation.y = -Math.PI / 2;
  signIn.position.set(E.x - E.width / 2 - 0.006, 2.08, qEnd[1]);
  const doorOut = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.95), toon('#3a373a'));
  doorOut.rotation.y = Math.PI;
  doorOut.position.set(E.x, 0.975, E.z - E.depth / 2 - 0.004);
  deck.add(doorIn, signIn, doorOut);

  // ─── Display counter (takeaway, right side, faces the guest path) ───
  const C = A.counter;
  const counter = box(C.depth, C.height, C.width, toon(N.shell));
  counter.position.set(C.x, C.height / 2, C.z);
  const cTop = box(C.depth + 0.06, 0.04, C.width + 0.06, toon('#3a373a'), { edges: false });
  cTop.position.set(C.x, C.height + 0.02, C.z);
  deck.add(counter, cTop);
  const cs = ipSlot('boothACounter', C.width - 0.1, C.height - 0.2, 'COUNTER FRONT');
  cs.group.rotation.y = -Math.PI / 2;
  cs.group.position.set(C.x - C.depth / 2 - 0.004, C.height / 2 - 0.02, C.z);
  deck.add(cs.group);
  slotsReady.push(cs.ready);
  // takeaway items on the counter (plain boxes, no branding)
  for (let i = 0; i < 5; i++) {
    const it = box(0.22, 0.12, 0.28, toon(i % 2 ? '#e6e3de' : '#cfccc8'), { line: OUTLINE_THIN });
    it.position.set(C.x, C.height + 0.1, C.z - C.width / 2 + 0.25 + i * 0.38);
    deck.add(it);
  }

  // ─── Belt-stanchion queue (stays inside the booth) ───
  const Q = A.queue;
  const lane = queueLane(Q.path, { width: Q.width, post: Q.post, beltColor: P.dark, capColor: lead, spacing: 0.7 });
  deck.add(lane.group);

  // ─── INFO / RESET point ───
  const I = A.info;
  const pod = box(I.width, I.height, I.depth, toon(N.shell));
  pod.position.set(I.x, I.height / 2, I.z);
  const podSign = signPlane('INFO / RESET', I.width * 0.9, 0.2);
  podSign.position.set(I.x, I.height - 0.2, I.z + I.depth / 2 + 0.004);
  deck.add(pod, podSign);

  // ─── Guest flow (toggle): numbered badges + arrows ───
  const flow = new THREE.Group();
  flow.position.y = ph;
  const photo = A.photo;
  flow.add(
    flowBadge(1, 'QUEUE', lead, { x: Q.path[0][0] + 0.02, z: 2.3, size: 0.42 }),
    flowBadge(2, 'MAIN EXPERIENCE', lead, { x: -1.15, z: 2.3, size: 0.42 }),
    flowBadge(3, 'PHOTO', lead, { x: photo.x - 1.2, z: photo.z + 0.2, size: 0.45 }),
    flowBadge(4, 'TAKEAWAY / EXIT', lead, { x: 1.4, z: 0.95, size: 0.42 }),
    flowBadge(null, 'INFO / RESET', P.white, { x: 0.05, z: 1.8, size: 0.4 }),
  );
  const arrow = { len: 0.5, w: 0.3 };
  flow.add(flowArrows([[-2.45, 2.95], ...Q.path.slice(1)], P.dark, arrow));
  flow.add(flowArrows([[E.x, E.z - E.depth / 2 - 0.25], [photo.x, photo.z + 0.45]], P.dark, arrow));
  flow.add(flowArrows([[photo.x + 0.6, photo.z], [1.45, photo.z], [1.45, 0.4]], P.dark, arrow));
  flow.add(flowArrows([[1.6, 1.5], [1.95, 2.95]], P.dark, arrow));
  // "stand here" mark at the KV
  const mark = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.3, 32), toon(lead));
  mark.rotation.x = -Math.PI / 2;
  mark.position.set(photo.x, 0.011, photo.z);
  flow.add(mark);
  g.add(flow);

  // ─── People: staff (role tags toggle) + guests on the path ───
  const tags = new THREE.Group();
  const people = new THREE.Group();
  for (const s of A.staff) people.add(staffMember(s, lead, { y: ph, tags }));
  const rand = mulberry32(seed);
  const pick = colorPicker(rand);
  const guests = lane.spots.slice().reverse().slice(0, Q.guests).map((s) => ({ ...s }));
  guests.push(
    { x: photo.x - 0.25, z: photo.z, rot: 0 }, { x: photo.x + 0.25, z: photo.z + 0.05, rot: 0.1 },   // posing at the KV
    { x: 1.55, z: -0.35, rot: Math.PI / 2 },                                                       // at the counter
    { x: 1.75, z: 2.2, rot: 0.3 },                                                                 // leaving
  );
  people.add(crowd(guests.map((s) => ({ ...s, y: ph, color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 }))));

  // ─── Dimensions (shown with Labels) ───
  const dims = footprintDims(W, D);
  dims.add(dimLine([-K.width / 2, ph + K.height + 0.25, kvZ + 0.1], [K.width / 2, ph + K.height + 0.25, kvZ + 0.1], `KV ${m(K.width)}`, { tick: [0, 1, 0] }));
  dims.add(dimLine([-K.width / 2 - 0.25, ph, kvZ + 0.1], [-K.width / 2 - 0.25, ph + K.height, kvZ + 0.1], m(K.height), { tick: [1, 0, 0] }));
  dims.add(dimLine([C.x - C.depth / 2 - 0.2, ph + C.height + 0.15, C.z - C.width / 2], [C.x - C.depth / 2 - 0.2, ph + C.height + 0.15, C.z + C.width / 2], `COUNTER ${m(C.width)}`, { tick: [0, 1, 0] }));
  dims.add(dimLine([-W / 2 - 0.45, 0, D / 2], [-W / 2 - 0.45, ph, D / 2], mm(ph), { tick: [0, 0, 1], textOffset: [-0.45, 0.1, 0] }));

  const labels = [
    { id: 'boothA', pos: [-W / 2 + 0.3, 3.6, -D / 2 + 0.4], title: 'Plan A · Hosted exhibition',
      lines: [`Footprint ${m(W)} × ${m(D)}`, `${mm(ph)} timber base platform`, '1 director + 4 staff', 'Graphics + build: CyberE / Japan'] },
    { id: 'kv', pos: [K.width / 2 - 0.3, ph + K.height + 0.2, kvZ], title: 'KV panel (back wall)',
      lines: [`${m(K.width)} wide × ${m(K.height)} high`, 'IP artwork – supplied by CyberE', 'Also the photo backdrop'] },
    { id: 'experience', pos: [E.x, ph + E.height + 0.2, E.z], title: 'Main experience',
      lines: ['Placeholder volume', 'Build per supplied drawings', `Drawn ${m(E.width)} × ${m(E.depth)} × ${m(E.height)} (EST)`] },
    { id: 'counter', pos: [C.x, ph + C.height + 0.3, C.z - 0.6], title: 'Display counter',
      lines: [`${m(C.width)} wide (EST depth ${m(C.depth)}, height ${m(C.height)})`, 'Takeaway / exit', 'Front: IP artwork slot'] },
    { id: 'queue', pos: [Q.path[0][0], ph + 1.3, 2.2], title: 'Queue',
      lines: [`Belt-stanchion lane ${m(Q.width)} wide`, 'Stays inside the footprint', 'Welcome staff at the entry'] },
    { id: 'flow', pos: [I.x, ph + I.height + 0.2, I.z], title: 'Guest path',
      lines: ['Queue → Main experience → Photo', '→ Takeaway / exit', 'Info / reset at the exit'] },
  ];

  return { group: g, people, tags, flow, dims, labels, slotsReady, height: ph + K.height };
}
