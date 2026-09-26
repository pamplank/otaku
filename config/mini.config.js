// ============================================================================
//  OTAKU POP FES 2027 · MINI STAGE · Grand Ballroom (right third)
//  Fan sessions, signings, community tie-ups. EVERY DIMENSION IS TBC. Metres.
//  Origin: floor level, centre of the deck's FRONT edge; +z = towards the audience.
//  (Placed in the room by ballroom.config.js → placement.mini.)
// ============================================================================

export const stage = {
  deck: { width: 6, depth: 4, height: 0.6 },
  frame: { width: 5.5, height: 3.5 },            // cyan sticker-card frame
  led: { width: 4, height: 2.25, bottom: 1.3 },
  sign: { top: 5.2 },                            // round speech-bubble header sign
  truss: { top: 5.4, size: 0.3, span: 8, lights: 3 },  // span EST
};

export const seating = { rows: 3, seatsPerRow: 20, firstRow: 2.5, rowPitch: 0.95, seatWidth: 0.55 };  // firstRow/pitch/width EST
export const standing = { depth: 4.5, capacity: 100 };   // EST depth of the standing area behind the chairs
