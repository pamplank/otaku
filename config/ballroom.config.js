// ============================================================================
//  OTAKU POP FES 2027 · GRAND BALLROOM · Okada Manila
//  Room, zoning and the overview. EVERY DIMENSION IS TBC. Units: metres.
//
//  Axes:   x = along the room's long side (−x = panel-stage end, +x = mini-stage end)
//          y = up from the ballroom floor
//          z = across the room (−z = far wall, +z = the long wall with the doors,
//              and the foyer beyond it)
//  Origin: floor level, centre of the room.
//  "EST" = not given in the brief; assumed and listed in the dimension notes.
// ============================================================================

export const room = {
  width: 50,           // long side (brief: ~50 × 33 m, 1,649 m²)
  depth: 33,
  ceiling: 9.6,        // 31.6 ft, flat, pixel-mapped LED ceiling
  ledPitch: 0.6,       // EST spacing of the LED dots drawn on the ceiling
  wallColor: '#e9e4dc',
  carpet: '#d7d1c8',
};

// Foyer strip outside the long wall with the doors
export const foyer = {
  depth: 8,            // EST
  ceiling: 5,          // foyer ceiling (toggle)
};

// Double doors in the long wall (z = +depth/2). x = centre of each door.
export const doors = {
  width: 2.4, height: 3.0,          // EST per double door
  list: [
    { x: -8.3, label: 'Main doors' },  // on the panel zone's centre line, behind the entrance arch
    { x: 3.5, label: 'Doors' },
    { x: 13.5, label: 'Doors' },       // right third, next to the pause pocket
  ],
};

// Zoning (plan): left ~2/3 = panel stage + theatre seating; right ~1/3 split
// from the far wall: mini stage → networking / community → pause pocket by the doors.
export const zoning = {
  panelShare: 2 / 3,
  miniDepth: 15,                   // EST mini-stage zone, from the far wall
  pause: { width: 8, depth: 6 },   // EST proposed pause pocket, corner by the doors
  colors: { panel: '#ffd3e6', mini: '#c9f1f4', networking: '#fff6ad', pause: '#ffffff', foyer: '#e3ded6' },
};

// Optional pipe-and-drape divider between the panel zone and the right third
export const divider = { height: 3.0, open: true };   // EST height; default open (hidden)

// Where each build sits in the room (its own origin = deck front centre, facing +z)
export const placement = {
  panel: { x: -8.3, z: -9.5 },     // deck front 7 m from the far wall (5 m deck + 2 m crossover, EST)
  mini: { x: 16.7, z: -11 },       // deck front 5.5 m from the far wall (4 m deck + 1.5 m crossover, EST)
  arch: { x: -8.3, z: 20.5 },      // in the foyer, 4 m out from the main doors (EST)
};

// Flow arrows: foyer → arch → doors → each zone ([x, z] waypoints)
// Every route runs foyer → through the arch → main doors, then splits to each zone.
export const flows = [
  { name: 'Through the arch', color: '#242224', path: [[-8.3, 24.3], [-8.3, 17.2]] },
  { name: 'To the panel stage', color: '#FF66AD', path: [[-9.1, 16], [-9.1, 11.8]] },
  { name: 'To the mini stage', color: '#00CAD8', path: [[-7.5, 16], [-7.5, 12.6], [9.8, 12.6], [14.2, 6.2], [16.7, -1.3]] },
  { name: 'To networking', color: '#FFF33F', path: [[10.6, 13.6], [13.8, 11]] },
];

export const render = { width: 1920, height: 1080 };
