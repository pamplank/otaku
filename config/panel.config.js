// ============================================================================
//  OTAKU POP FES 2027 · PANEL STAGE · Grand Ballroom
//  Talks, voice-actor and creator panels, Q&A. EVERY DIMENSION IS TBC. Metres.
//  Origin: floor level, centre of the deck's FRONT edge; +z = towards the audience,
//  +x = audience's right (stage left). "EST" = assumed, see ASSUMED_DIMENSIONS.md.
//  (Placed in the room by ballroom.config.js → placement.panel.)
// ============================================================================

export const stage = {
  deck: { width: 10, depth: 5, height: 0.8 },
  led: { width: 6, height: 3.375, bottom: 2.2 },          // 16:9, bottom clears seated panelists
  // White sticker-card frame behind the LED, full stage width, pink offset layer
  frame: { top: 6.4, setback: 0.4, thickness: 0.12, outline: 0.09, offset: 0.22 },  // top/setback EST
  // Header box across the top of the frame, cyan-and-dark checkerboard
  header: { height: 0.65, depth: 0.5, square: 0.22 },     // EST
  // OPF logo lightbox centred on top (supplied logo only)
  logo: { top: 7.2, width: 3.2, height: 0.8, depth: 0.3 }, // width/height/depth EST
  // Ground-supported box truss: goalpost at the deck front + one behind the frame
  truss: { top: 7.4, size: 0.3, span: 12.6, frontZ: 0.3, lights: 6 },  // span/frontZ EST
  // Side IMAG screens on their own truss towers
  imag: { width: 3.2, height: 1.8, bottom: 2.5, x: 8.3, z: -1.0, towerTop: 4.6 },  // x/z/towerTop EST
  pa: { width: 0.7, depth: 0.7, heights: [1.0, 1.0], x: 6.2, z: -0.6 },  // EST ground-stacked PA
};

export const access = {
  stairs: { width: 1.2, steps: 4, run: 0.3, x: 3.9 },      // both sides of the front; width/x EST
  lift: { width: 1.1, depth: 1.5, x: -5.75, z: -1.8 },     // portable wheelchair lift, stage right; EST
};

export const furniture = {
  table: { length: 6, depth: 0.7, height: 0.72, z: -2.2 },  // "low" panel table; depth/height/z EST
  chairs: 6,
  podium: { width: 0.7, depth: 0.5, height: 1.15, x: 4.2, z: -1.3 },  // MC podium at stage left; EST
  lounge: { armchairs: 6, tables: 2 },                      // alternative layout (toggle)
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

export const qaMics = [{ row: 3, x: -0.6 }, { row: 8, x: 0.6 }];   // in the centre aisle, beside these rows (EST)
export const cameraRiser = { width: 2, depth: 2, height: 0.6, back: 12 };  // 12 m back on the centre aisle; height EST
export const foh = { width: 3, depth: 1.5, gap: 2.5 };                     // EST, behind the last row
