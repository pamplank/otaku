// PLAN B · EXHIBITION + PHOTO (6 m frontage × 3 m depth × 3 m high). Three-sided
// shell open to the aisle, exhibition panels + photo spot panel on the back wall
// (texture slots), and our "RR ADDS": title intro panel, 1-2-3 read-order
// markers, a "stand here" photo cue. 2 staff. No games, hands-on stations,
// merch counters, monitors or game machines.
// Local coordinates: origin = footprint centre on the hall floor, +z = aisle.
import * as THREE from 'three';
import { palette as P } from '../../stage.config.js';
import { planB as B, neutral as N } from '../../config/booths.config.js';
import { toon, box, canvasTexture, FONT } from '../sticker.js';
import { crowd, colorPicker, mulberry32 } from '../ballroom/figures.js';
import { m, slotBoard, staffMember, flowArrows, dimLine, footprintDims } from './common.js';

export const BOOTH_B_ARTWORK = {
  boothBPanel1: { title: 'Plan B · exhibition panel 1 (CyberE)', accept: 'image/*', kind: 'Image' },
  boothBPanel2: { title: 'Plan B · exhibition panel 2 (CyberE)', accept: 'image/*', kind: 'Image' },
  boothBPanel3: { title: 'Plan B · exhibition panel 3 (CyberE)', accept: 'image/*', kind: 'Image' },
  boothBPhoto:  { title: 'Plan B · photo spot panel (CyberE)', accept: 'image/*', kind: 'Image' },
  boothBIntro:  { title: 'Plan B · RR title intro panel', accept: 'image/*', kind: 'Image' },
};

// Round numbered read-order marker (RR ADDS), a sticker disc facing +z
function marker(n, size, color) {
  const g = new THREE.Group();
  const tex = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = w * 0.05; ctx.strokeStyle = P.dark; ctx.stroke();
    ctx.fillStyle = P.dark; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${w * 0.52}px ${FONT}`;
    ctx.fillText(String(n), w / 2, h * 0.54);
  });
  const face = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 32), toon('#ffffff', { map: tex, transparent: true }));
  const off = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 32), toon(P.dark));
  off.position.set(size * 0.08, -size * 0.08, -0.004);
  g.add(off, face);
  return g;
}

// "STAND HERE" floor cue (RR ADDS): two footprints in a ring
function standHere(size, color) {
  const tex = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.47, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = w * 0.03; ctx.strokeStyle = P.dark; ctx.stroke();
    ctx.fillStyle = P.white;
    for (const sx of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(w / 2 + sx * w * 0.09, h * 0.42, w * 0.06, h * 0.12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = P.dark; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${w * 0.1}px ${FONT}`;
    ctx.fillText('STAND HERE', w / 2, h * 0.72);
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshToonMaterial({ map: tex, transparent: true, depthWrite: false }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 3;
  mesh.userData.decal = true;
  return mesh;
}

export function buildPlanB({ seed = 12 } = {}) {
  const g = new THREE.Group();
  const lead = P[B.lead];
  const W = B.footprint.width, D = B.footprint.depth, H = B.shell.height, t = B.shell.thickness;
  const slotsReady = [];

  // ─── Three-sided shell, open on the 6 m visitor side ───
  const wallMat = toon(N.shell);
  const back = box(W, H, t, wallMat);
  back.position.set(0, H / 2, -D / 2 + t / 2);
  g.add(back);
  for (const sx of [-1, 1]) {
    const side = box(t, H, D - t, wallMat);
    side.position.set(sx * (W / 2 - t / 2), H / 2, t / 2);
    g.add(side);
  }
  const wallZ = -D / 2 + t;

  // ─── Exhibition panels (back wall) + photo spot panel at the right end ───
  const PN = B.panels;
  PN.xs.forEach((x, i) => {
    const b = slotBoard(`boothBPanel${i + 1}`, PN.width, PN.height, 0.03, `EXHIBITION PANEL ${i + 1}`);
    b.group.position.set(x, PN.bottom + PN.height / 2, wallZ + 0.015);
    g.add(b.group);
    slotsReady.push(b.ready);
    // RR ADDS: 1-2-3 read-order marker above the panel
    const mk = marker(i + 1, B.markers.size, lead);
    mk.position.set(x - PN.width / 2 + B.markers.size / 2, B.markers.y, wallZ + 0.01);
    g.add(mk);
  });
  const PH = B.photo;
  const photo = slotBoard('boothBPhoto', PH.width, PH.height, 0.04, 'PHOTO SPOT PANEL');
  photo.group.position.set(PH.x, PH.bottom + PH.height / 2, wallZ + 0.02);
  g.add(photo.group);
  slotsReady.push(photo.ready);

  // ─── RR ADDS: title intro panel at the entrance edge (pink offset = ours) ───
  const IN = B.intro;
  const intro = slotBoard('boothBIntro', IN.width, IN.height, 0.04, 'IP TITLE / LOGO FROM CYBERE', { title: 'RR ADDS – TITLE INTRO PANEL' });
  intro.group.position.set(IN.x, IN.bottom + IN.height / 2, IN.z);
  const introOff = box(IN.width, IN.height, 0.02, toon(lead), { edges: false });
  introOff.position.set(IN.x + 0.06, IN.bottom + IN.height / 2 - 0.06, IN.z - 0.04);
  const feet = box(IN.width * 0.9, 0.04, 0.45, toon('#b9b6b2'));
  feet.position.set(IN.x, 0.02, IN.z);
  for (const sx of [-1, 1]) {
    const leg = box(0.04, IN.bottom + 0.05, 0.04, toon('#b9b6b2'), { edges: false });
    leg.position.set(IN.x + sx * IN.width * 0.35, (IN.bottom + 0.05) / 2, IN.z);
    g.add(leg);
  }
  g.add(intro.group, introOff, feet);
  slotsReady.push(intro.ready);

  // ─── RR ADDS: "stand here" photo cue ───
  const SH = B.standHere;
  const cue = standHere(SH.size, lead);
  cue.position.set(SH.x, 0.012, SH.z);
  g.add(cue);

  // ─── Guest flow (toggle): along the panels 1 → 2 → 3, photo, exit ───
  const flow = new THREE.Group();
  const arrow = { len: 0.5, w: 0.3 };
  flow.add(flowArrows([[-1.75, 1.35], [-1.75, 0.05], [1.25, 0.05]], P.dark, arrow));
  flow.add(flowArrows([[SH.x, SH.z + 0.55], [SH.x, 1.45]], P.dark, arrow));
  g.add(flow);

  // ─── People: 2 staff + visitors ───
  const tags = new THREE.Group();
  const people = new THREE.Group();
  for (const s of B.staff) people.add(staffMember(s, lead, { tags }));
  const rand = mulberry32(seed);
  const pick = colorPicker(rand);
  const guests = [
    { x: PN.xs[0] + 0.1, z: -0.55, rot: Math.PI }, { x: PN.xs[1] - 0.2, z: -0.5, rot: Math.PI + 0.2 },
    { x: PN.xs[1] + 0.3, z: -0.62, rot: Math.PI - 0.1 }, { x: PN.xs[2], z: -0.45, rot: Math.PI },
    { x: SH.x, z: SH.z, rot: 0 },                               // posing at the photo panel
    { x: SH.x - 0.35, z: 1.25, rot: Math.PI - 0.25 },           // friend taking the photo
    { x: IN.x + 0.55, z: 0.75, rot: -0.3 + Math.PI },           // reading the intro panel
  ];
  people.add(crowd(guests.map((s) => ({ ...s, color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 }))));

  // ─── Dimensions (shown with Labels) ───
  const dims = footprintDims(W, D);
  dims.add(dimLine([W / 2 + 0.3, 0, D / 2], [W / 2 + 0.3, H, D / 2], `${m(H)} HIGH`, { tick: [1, 0, 0] }));
  dims.add(dimLine([PH.x - PH.width / 2, PH.bottom + PH.height + 0.2, wallZ + 0.1], [PH.x + PH.width / 2, PH.bottom + PH.height + 0.2, wallZ + 0.1], m(PH.width), { tick: [0, 1, 0] }));
  dims.add(dimLine([PN.xs[1] - PN.width / 2, PN.bottom - 0.2, wallZ + 0.1], [PN.xs[1] + PN.width / 2, PN.bottom - 0.2, wallZ + 0.1], m(PN.width), { tick: [0, 1, 0] }));

  const labels = [
    { id: 'boothB', pos: [-W / 2 + 0.2, H + 0.4, -D / 2], title: 'Plan B · Exhibition + photo',
      lines: [`${m(W)} frontage × ${m(D)} depth × ${m(H)} high`, 'Three-sided shell, open to the aisle', '1 director + 1 staff', 'Graphics + build: CyberE / Japan'] },
    { id: 'panels', pos: [PN.xs[1], PN.bottom + PN.height + 0.15, wallZ], title: 'Exhibition panels',
      lines: [`3 × ${m(PN.width)} × ${m(PN.height)} (EST) on the back wall`, 'IP artwork – supplied by CyberE'] },
    { id: 'photo', pos: [PH.x, PH.bottom + PH.height + 0.15, wallZ], title: 'Photo spot panel',
      lines: [`${m(PH.width)} × ${m(PH.height)} (EST), right end`, 'IP artwork – supplied by CyberE'] },
    { id: 'rr', pos: [IN.x, IN.bottom + IN.height + 0.25, IN.z], title: 'RR ADDS',
      lines: [`Title intro panel ${m(IN.width)} × ${m(IN.height)} at the entrance`, '1-2-3 read-order markers above the panels', '"Stand here" photo cue on the floor'] },
    { id: 'notIncluded', pos: [0.4, 0.4, 1.2], title: 'Not included',
      lines: ['No games or hands-on stations', 'No merch counters', 'No monitors or game machines'] },
  ];

  return { group: g, people, tags, flow, dims, labels, slotsReady, height: H };
}
