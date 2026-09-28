// ============================================================================
//  OTAKU POP FES 2027 · INSTALLATION · 2027 DATE LETTERS
//  Illustrated "sticker" numerals in a mall atrium: one chunky, bouncy word.
//  EVERY DIMENSION IS TBC. Metres. Origin: floor, centre of the word; +z = front.
// ============================================================================
export const letters = {
  text: '2027',
  heights: [2.35, 2.2, 2.1, 2.4],   // EST each numeral a little different (≈ 2.1–2.4 m)
  tilts: [-7, 6, -9, 8],            // EST in-plane tilt per numeral (degrees, + = anticlockwise)
  stagger: [0.17, -0.17, 0.17, -0.17],   // EST depth offset: front, back, front, back (≈ 0.3 m apart)
  gap: 0.1,                         // EST gap between numerals (they overlap a little once tilted)
  depth: 0.3,                       // EST body (dark return) depth
  face: 0.04,                       // EST coloured face standing proud of the body
  outline: 0.06,                    // EST dark outline round the face
  colors: ['yellow', 'pink', 'cyan', 'white'],   // face colours (palette; editable): 2 0 2 7
  plinth: { height: 0.15, margin: 0.32, depth: 1.35, z: -0.03, color: 'dark' },   // EST one shared plinth
};
export const lightbox = {
  logoWidth: 2.0,                   // EST logo width inside the box (height follows the logo file)
  logoMaxHeight: 0.9,               // EST cap for a tall logo
  padding: 0.1,                     // 10% of the logo width on every side
  depth: 0.16,                      // EST box depth
  outline: 0.06,                    // EST dark outline round the face
  shadow: { x: 0.1, y: -0.1, color: 'pink' },   // EST hard offset panel behind
  top: 3.4,                         // EST top of the box
  post: { radius: 0.05, z: -0.5 },  // EST single central post behind the numerals
};
// Sparkle stars on thin rods: [x, y, z, radius, colour] (x relative to the word's centre)
export const stars = [
  [-3.75, 2.75, 0.25, 0.38, 'yellow'],
  [-2.05, 3.05, -0.35, 0.17, 'cyan'],
  [2.45, 3.1, -0.35, 0.3, 'pink'],
  [3.95, 1.95, 0.2, 0.26, 'cyan'],
];
