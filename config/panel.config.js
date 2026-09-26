// ============================================================================
//  OTAKU POP FES 2027 · PANEL STAGE · Grand Ballroom
//  Talks, voice-actor and creator panels, Q&A. EVERY DIMENSION IS TBC. Metres.
//  Origin: floor level, centre of the deck's FRONT edge; +z = towards the audience.
//  (Placed in the room by ballroom.config.js → placement.panel.)
// ============================================================================

export const stage = {
  deck: { width: 10, depth: 5, height: 0.8 },
  led: { width: 6, height: 3.375, bottom: 2.2 },       // 16:9, clears seated panelists
  frameTop: 6.2,                                       // EST top of the white sticker-card frame
  logo: { top: 7.2, width: 3.2, height: 0.8 },         // lightbox; width/height EST
  truss: { top: 7.4, size: 0.3, span: 13, lights: 6 }, // ground-supported goalpost; span EST
  imag: { width: 3.2, height: 1.8, bottom: 2.5, x: 8.4 }, // side IMAG screens on their own truss towers; x (centre) EST
};

// Theatre seating: 2 blocks × 12 rows × 20 seats = 480
export const seating = {
  blocks: 2, rows: 12, seatsPerRow: 20,
  firstRow: 3,           // first row 3 m from the stage front
  rowPitch: 0.95,        // EST row-to-row
  seatWidth: 0.55,       // EST seat-to-seat
  centreAisle: 2,
  sideAisle: 1.5,        // EST
  vipRows: 2,            // front 2 rows: yellow seat covers
};

export const cameraRiser = { width: 2, depth: 2, height: 0.6, back: 12 };  // 12 m back on the centre aisle; height EST
export const foh = { width: 3, depth: 1.5, gap: 2.5 };                     // EST, behind the last row
