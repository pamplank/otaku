// ============================================================================
//  OTAKU POP FES 2027 · MINI STAGE · Grand Ballroom (right third)
//  Fan sessions, signings, community tie-ups. EVERY DIMENSION IS TBC. Metres.
//  Origin: floor level, centre of the deck's FRONT edge; +z = towards the audience,
//  +x = audience's right. "EST" = assumed, see ASSUMED_DIMENSIONS.md.
//  (Placed in the room by ballroom.config.js → placement.mini.) Lead colour: cyan.
// ============================================================================

export const stage = {
  deck: { width: 6, depth: 4, height: 0.6 },
  // Cyan sticker-card frame, bold outline, yellow offset layer, LED inside
  frame: { width: 5.5, height: 3.5, setback: 0.5, thickness: 0.12, outline: 0.08, offset: 0.2 },  // setback etc. EST
  led: { width: 4, height: 2.25, bottom: 1.3 },
  // Round speech-bubble header sign "MINI STAGE" above the frame
  sign: { top: 5.2, width: 2.6, text: 'MINI STAGE' },     // width EST
  truss: { top: 5.4, size: 0.29, span: 8, frontZ: 0.3, lights: 3 },   // span/frontZ EST
  pa: { width: 0.5, depth: 0.5, heights: [0.7, 0.7], x: 4.6, z: -0.4 },   // smaller than the panel stage (EST)
  sidePanels: { width: 1.2, height: 3, x: 3.75, z: -1.2 },   // on the floor either side of the deck; x/z EST
  steps: { width: 1.2, steps: 3, run: 0.3, x: 2.0 },          // front steps, stage-left side (EST)
};

// Seating + standing
export const seating = { rows: 3, seatsPerRow: 20, firstRow: 2.5, rowPitch: 0.95, seatWidth: 0.55 };  // firstRow/pitch/width EST
export const standing = { depth: 4.5, capacity: 100 };   // EST depth of the standing area behind the chairs

// Signing (toggle): 3 m table on the deck + belt-stanchion queue lane along the side of the zone
export const signing = {
  table: { length: 3, depth: 0.7, height: 0.72, z: -1.4 },       // depth/height/z EST
  lane: { width: 1.2, post: 2.0, x: 6.8, zFrom: 8.8, zTo: 1.4 },  // local: runs along the right of the chairs, then in to the steps (EST)
  queue: 16,                                                      // people drawn in the lane
};

// Networking / community area (middle of the right third), room coordinates
export const networking = {
  highTables: { diameter: 0.8, height: 1.1, cols: 3, rows: 3, pitchX: 4.4, pitchZ: 4.2 },   // EST
  benches: { length: 2.4, depth: 0.5, height: 0.45 },                                        // EST
  noticeboard: { width: 2.4, height: 1.6, bottom: 0.7 },                                     // texture slot; EST
};

// Proposed pause pocket (corner by the doors), room coordinates from its rectangle
export const pause = {
  softSeats: 4, seat: { width: 1.4, depth: 0.8, height: 0.42 },   // EST
  sign: { width: 1.2, height: 0.6, text: 'REST' },               // EST
};
