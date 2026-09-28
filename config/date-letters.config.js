// ============================================================================
//  OTAKU POP FES 2027 · INSTALLATION · 2027 DATE LETTERS
//  Walk-around selfie sculpture in a mall atrium. EVERY DIMENSION IS TBC.
//  Metres. Origin: floor, centre of the row; +z = front.
// ============================================================================
export const letters = {
  text: '2027',
  height: 2.3,                      // ≈ 2.3 m numerals
  aspect: 1.0 / 1.4,                // EST numeral width : height
  depth: 0.45,                      // EST extrusion
  gap: 0.9,                         // EST room to stand between the digits
  bevel: 0.025,                     // EST rounded front edge
  colors: ['yellow', 'pink', 'cyan', 'white'],   // side colours per digit (palette; editable)
  basePlate: 0.02,                  // EST steel base plates under each digit
};
export const lightbox = {
  width: 3.6, height: 1.0, depth: 0.22, bottom: 3.15,   // EST OPF logo lightbox above the letters
  frame: { post: 0.07, top: 4.35, z: -0.75, color: 'dark' },   // EST slim goalpost frame behind the letters
};
