// ============================================================================
//  OTAKU POP FES 2027 · INSTALLATION · STICKER CUBE TOWER
//  Signature photo-op at the Okada Manila entrance. EVERY DIMENSION IS TBC.
//  Metres. "EST" = assumed, see ASSUMED_DIMENSIONS.md. Origin: floor, tower centre;
//  +z = the approach (hero) side.
// ============================================================================
export const tower = {
  cube: 1.15,                       // 4 stacked cubes ≈ 4.6 m
  count: 4,
  turns: [0, 13, -8, 17],           // EST playful rotation of each cube, bottom → top (degrees)
  shifts: [[0, 0], [0.05, -0.03], [-0.05, 0.03], [0.03, 0.05]],   // EST small offsets (x, z)
  edge: 0.035,                      // EST painted edge trim on every cube edge
  colors: ['cyan', 'pink', 'yellow', 'white'],   // body colours bottom → top (palette; editable in admin)
  plinth: { width: 2.1, depth: 2.1, height: 0.1, color: 'dark' },   // EST low plinth
};
// Face slots. Hero-facing faces (front +z, right +x) carry the supplied OPF KV;
// the top cube's front is the LOGO slot, the third cube's front the DATE slot;
// every other face is an "IP ARTWORK – SUPPLIED BY CYBERE" slot.
export const faces = { logo: [3, 'front'], date: [2, 'front'] };
export const text = { date: 'JUNE 5–6\n2027' };
