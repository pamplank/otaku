// ============================================================================
//  OTAKU POP FES 2027 · INSTALLATION · GIANT POLAROID FRAME
//  Movable UGC photo frame on a mall walkway. EVERY DIMENSION IS TBC.
//  Metres. Origin: floor, frame centre; +z = the photographer's side.
// ============================================================================
export const frame = {
  top: 3.1,                         // ≈ 3.1 m overall from the floor
  width: 2.4,                       // EST (classic instant-photo proportions)
  border: 0.19,                     // EST side + top border
  strip: 0.64,                      // EST the thick bottom strip
  depth: 0.12,                      // EST
  color: 'white',                   // frame body (palette; editable)
  stripColor: 'white',              // bottom strip ground (palette; editable)
};
export const base = {
  width: 2.8, depth: 1.0, plate: 0.08,   // EST weighted steel base
  caster: 0.1,                            // EST lockable caster height
  ballast: { width: 0.9, depth: 0.3, height: 0.14 },   // EST ballast blocks at the back
};
export const text = { date: 'JUNE 5–6, 2027 · OKADA MANILA' };
