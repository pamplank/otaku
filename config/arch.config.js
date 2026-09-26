// ============================================================================
//  OTAKU POP FES 2027 · BALLROOM ENTRANCE ARCH · foyer
//  EVERY DIMENSION IS TBC. Metres. "EST" = assumed, see ASSUMED_DIMENSIONS.md.
//  Origin: floor level, centre of the arch; +z = the approach side (away from the
//  doors). Placed in the foyer by ballroom.config.js → placement.arch.
//  The whole face artwork is swappable in admin mode (CyberE may supply the
//  Japan-side design); until then the default below is drawn.
// ============================================================================

export const arch = {
  width: 8, height: 4.2, depth: 1.2,
  opening: { width: 4, height: 3 },
  cornerRadius: 0.45,       // EST die-cut rounding, outer top corners
  openingRadius: 0.35,      // EST rounding, opening top corners
  offset: { x: 0.22, y: 0.18, color: 'pink' },   // EST pink offset layer, behind
  title: 'BALLROOM',
  subtitle: 'PANEL STAGE · MINI STAGE',
};

// Schedule boards on the legs (texture slots)
export const boards = { width: 1.5, height: 2.4, bottom: 0.35 };   // bottom EST

// Queue lanes on the approach side: VIP (yellow) and General (cyan), each ending
// at a ticket-check podium in front of its half of the opening.
export const lanes = {
  width: 1.2, post: 2.0,           // EST
  z: 2.9,                          // EST lane centre line, in front of the arch
  length: 11,                      // EST straight run along the foyer
  podium: { width: 0.6, depth: 0.45, height: 1.05, z: 1.6 },   // EST ticket-check podium
  vip: { side: -1, color: 'yellow', label: 'VIP', queue: 6 },
  general: { side: 1, color: 'cyan', label: 'GENERAL', queue: 13 },
};
