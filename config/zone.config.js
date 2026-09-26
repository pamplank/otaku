// ============================================================================
//  OTAKU POP FES 2027 · IP BOOTH ZONE · Crystal Pavilion
//  The zoning arc around the Fountain (Artist Alley, Food, Sponsors, Stage,
//  IP Booths) as flat coloured floor zones, the main stage in its zone, and the
//  IP booth area: booth units in rows with clear aisles.
//  EVERY DIMENSION IS TBC. Metres. "EST" = assumed, see ASSUMED_DIMENSIONS.md.
//  Coordinates are the main stage's (stage.config.js): origin = deck front
//  centre, +z = towards the Fountain. The Fountain sits where the main stage
//  model draws it (16 m beyond the hall's front edge).
// ============================================================================

// The Fountain (ellipse radii in metres, as drawn in the main stage model)
export const fountain = { rx: 14, rz: 6, beyondHallFront: 16 };

// Zoning arc: annular sectors around the Fountain. Angles in degrees, measured
// from "straight at the stage" (−z), positive towards +x (the audience's right).
// Order left → right as on the deck. All angles and radii EST.
export const arc = {
  inner: 20,
  outer: 84,
  zones: [
    { id: 'artist', name: 'ARTIST ALLEY', color: '#ffc6df', from: -112, to: -82 },
    { id: 'food', name: 'FOOD', color: '#fff59e', from: -82, to: -57 },
    { id: 'sponsors', name: 'SPONSORS', color: '#ffffff', from: -57, to: -35 },
    { id: 'stage', name: 'STAGE', color: '#aeeaf0', from: -35, to: 35 },
    { id: 'ip', name: 'IP BOOTHS', color: '#dcd8de', from: 35, to: 98 },
  ],
};

// Placeholder mix of booth units (see config/booths.config.js for each plan)
export const mix = { A: 4, B: 8, C: 8, label: 'MIX TBC' };

// IP booth area: a grid of rows placed in the IP Booths sector, turned to face the Fountain.
export const grid = {
  angle: 66,          // EST sector angle of the grid centre
  radius: 58,         // EST distance of the grid centre from the Fountain
  rows: 4,            // units are shared across the rows, balanced by frontage
  aisle: 3.5,         // EST main aisles between / around the double rows
  crossAisle: 3.5,    // EST cross aisle through the middle of each row
  unitGap: 0,         // booths in a row stand side by side
};

// Visitors walking the aisles (+ a few in the other zones)
export const visitors = { aisles: 90, otherZones: 60, seed: 606 };

// OPF wayfinding sign at the front of the IP booth area (texture slot, ours — not IP)
export const zoneSign = { width: 4, height: 1.2, bottom: 2.2 };   // EST
