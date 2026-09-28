// ============================================================================
//  OTAKU POP FES 2027 · INSTALLATION · GIANT POLAROID FRAME
//  Movable walk-in instant-photo frame on a mall walkway, sticker style.
//  EVERY DIMENSION IS TBC. Metres. Origin: floor, frame centre; +z = the photographer's side.
// ============================================================================
export const frame = {
  top: 3.1,                         // ≈ 3.1 m overall from the floor (before the lean)
  bottom: 0.3,                      // EST frame sits on the white kick plate
  width: 2.4,                       // EST (instant-photo proportions)
  border: 0.16,                     // EST thin top + side border
  strip: 0.64,                      // the deep bottom "chin"
  depth: 0.1,                       // EST printed face panel
  corner: 0.07,                     // EST rounded outer corners
  outline: 0.05,                    // EST dark outline (outer edge and opening)
  lean: 3,                          // degrees, in the frame's own plane (playful tilt)
  shadow: { x: 0.12, y: -0.12, color: 'pink' },   // EST hard offset back panel
  color: 'white', stripColor: 'white',            // palette; editable
};
export const base = {
  depth: 0.7,                       // EST weighted base under the frame (width follows the frame)
  plate: 0.06, caster: 0.1,         // EST steel plate on lockable casters
  clearance: 0.05,                  // kick plate stops this far above the floor (castors just show)
  ballast: { width: 0.8, depth: 0.22, height: 0.12 },   // EST ballast at the back (inside the kick plate)
};
export const backdrop = {
  distance: 1.2,                    // behind the frame
  width: 2.6, height: 2.9, bottom: 0.08, depth: 0.05,   // EST freestanding panel, a little wider than the opening
};
// Sparkle stars breaking out of the frame edges: [x, y, radius, colour] (frame coordinates)
export const stars = [
  [-1.16, 2.72, 0.42, 'yellow'],    // large, top-left corner
  [1.24, 1.62, 0.27, 'cyan'],       // mid-right edge
  [1.2, 0.1, 0.16, 'pink'],         // small, near the chin
];
export const decals = { standZ: -0.78, shootZ: 2.5 };   // STAND HERE footprints · SHOOT FROM HERE spot
export const text = { date: '06.05–06.2027', hashtag: '#HASHTAG TBC' };
