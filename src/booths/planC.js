// PLAN C · PHOTO SPOT + STANDEES (backdrop W3.0 × H2.0 m, no op staff).
// Backdrop texture slot on its own supports, two neutral standee silhouettes,
// and a dashed "PHOTO CLEARANCE – TBC" annotation (toggle; not a floor graphic).
// Local coordinates: origin = footprint centre on the hall floor, +z = aisle.
import * as THREE from 'three';
import { palette as P } from '../../stage.config.js';
import { planC as C } from '../../config/booths.config.js';
import { toon, box } from '../sticker.js';
import { crowd, colorPicker, mulberry32 } from '../ballroom/figures.js';
import { m, slotBoard, standee, dashedBox, textSprite, flowArrows, dimLine, footprintDims } from './common.js';

export const BOOTH_C_ARTWORK = {
  boothCBackdrop: { title: 'Plan C · photo backdrop (CyberE)', accept: 'image/*', kind: 'Image' },
};

export function buildPlanC({ seed = 13 } = {}) {
  const g = new THREE.Group();
  const lead = P[C.lead];
  const W = C.footprint.width, D = C.footprint.depth;
  const slotsReady = [];

  // ─── Backdrop on its own supports ───
  const BD = C.backdrop;
  const bd = slotBoard('boothCBackdrop', BD.width, BD.height, 0.05, 'PHOTO BACKDROP');
  bd.group.position.set(0, BD.bottom + BD.height / 2, BD.z);
  g.add(bd.group);
  slotsReady.push(bd.ready);
  const frame = toon('#b9b6b2');
  for (const sx of [-1, 1]) {
    const post = box(0.06, BD.bottom + BD.height, 0.06, frame);
    post.position.set(sx * (BD.width / 2 - 0.2), (BD.bottom + BD.height) / 2, BD.z - 0.06);
    const foot = box(0.08, 0.04, 0.8, frame);
    foot.position.set(sx * (BD.width / 2 - 0.2), 0.02, BD.z - 0.06);
    g.add(post, foot);
  }

  // ─── Standees: plain neutral silhouettes either side ───
  const ST = C.standees;
  for (const sx of [-1, 1]) {
    const s = standee(ST.height, ST.width);
    s.position.set(sx * ST.x, 0, ST.z);
    s.rotation.y = -sx * 0.3;
    g.add(s);
  }

  // ─── Photo clearance annotation (toggle) ───
  const CL = C.clearance;
  const clearance = new THREE.Group();
  const cb = dashedBox(CL.width, CL.depth, CL.height, P.dark);
  cb.position.z = CL.z + CL.depth / 2;
  const tag = textSprite(CL.label, { height: 0.24, bg: lead });
  tag.position.set(-CL.width / 2 + 0.2, CL.height + 0.2, CL.z + CL.depth);
  clearance.add(cb, tag);
  g.add(clearance);

  // ─── Guest flow (toggle): in from the aisle, pose, out ───
  const flow = new THREE.Group();
  const arrow = { len: 0.5, w: 0.3 };
  flow.add(flowArrows([[-2.2, 1.85], [-0.75, -0.3]], P.dark, arrow));
  flow.add(flowArrows([[0.75, -0.3], [2.2, 1.85]], P.dark, arrow));
  const mark = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.38, 36), toon(lead));
  mark.rotation.x = -Math.PI / 2;
  mark.position.set(0, 0.011, BD.z + 0.6);
  flow.add(mark);
  g.add(flow);

  // ─── People: guests only (no op staff) ───
  const people = new THREE.Group();
  const rand = mulberry32(seed);
  const pick = colorPicker(rand);
  const guests = [
    { x: -0.28, z: BD.z + 0.6, rot: 0.05 }, { x: 0.28, z: BD.z + 0.62, rot: -0.05 },   // posing
    { x: 0.75, z: 1.15, rot: -2.78 },                                                  // taking the photo
    { x: -2.25, z: 1.7, rot: 2.6 },                                                    // next in line
  ];
  people.add(crowd(guests.map((s) => ({ ...s, color: pick(), scale: (1.52 + rand() * 0.34) / 1.7 }))));

  // ─── Dimensions (shown with Labels) ───
  const dims = footprintDims(W, D);
  const top = BD.bottom + BD.height;
  dims.add(dimLine([-BD.width / 2, top + 0.2, BD.z + 0.05], [BD.width / 2, top + 0.2, BD.z + 0.05], `W ${m(BD.width)}`, { tick: [0, 1, 0] }));
  dims.add(dimLine([BD.width / 2 + 0.12, BD.bottom, BD.z + 0.05], [BD.width / 2 + 0.12, top, BD.z + 0.05], `H ${m(BD.height)}`, { tick: [1, 0, 0], textOffset: [-0.5, 0, 0] }));
  dims.add(dimLine([ST.x + 0.55, 0, ST.z], [ST.x + 0.55, ST.height, ST.z], m(ST.height), { tick: [1, 0, 0] }));

  const labels = [
    { id: 'boothC', pos: [W / 2 - 0.3, 2.9, -D / 2], title: 'Plan C · Photo spot + standees',
      lines: [`Area ≈ ${m(W)} × ${m(D)} (EST)`, 'No operating staff', 'Graphics + build: CyberE / Japan'] },
    { id: 'backdrop', pos: [0, top + 0.5, BD.z], title: 'Backdrop',
      lines: [`W ${m(BD.width)} × H ${m(BD.height)}`, 'On its own supports', 'IP artwork – supplied by CyberE'] },
    { id: 'standees', pos: [ST.x, ST.height + 0.3, ST.z], title: 'Standees',
      lines: [`2 × ≈ ${m(ST.height)} high (EST)`, 'Plain neutral silhouettes', 'Supplied by CyberE'] },
    { id: 'clearance', pos: [-CL.width / 2, CL.height, CL.z + CL.depth], title: 'Photo clearance',
      lines: [`${m(CL.width)} × ${m(CL.depth)} × ${m(CL.height)} – TBC`, 'Annotation only (toggle)', 'Not a floor graphic'] },
  ];

  return { group: g, people, tags: new THREE.Group(), flow, clearance, dims, labels, slotsReady, height: top };
}
