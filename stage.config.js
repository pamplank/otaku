// ============================================================================
//  OTAKU POP FES 2027 · THE STICKER STAGE · Crystal Pavilion, Okada Manila
//  ---------------------------------------------------------------------------
//  EVERY DIMENSION LIVES IN THIS FILE.  Units: metres.
//  ALL SIZES ARE TBC UNTIL THE SITE SURVEY. Change a number, save, reload.
//
//  Axes:   x = across the stage (+x = audience's right / FOH side)
//          y = up from the hall floor
//          z = towards the audience / Fountain side
//  Origin: floor level, centre of the stage deck's FRONT edge.
//
//  "EST" = not dimensioned on the slides; measured off the drawing
//          (elevation ≈ 37.5 px/m, plan ≈ 8.8 px/m from its 0–10 m scale bar).
// ============================================================================

export const palette = {
  dark: '#242224',
  yellow: '#FFF33F',
  pink: '#FF66AD',
  cyan: '#00CAD8',
  white: '#FFFFFF',
};

// ─── THE STAGE (front elevation) ────────────────────────────────────────────
export const stage = {
  deck: { width: 6, depth: 6, height: 1.0 },

  // LED wall: 10 × 6 panels of 0.5 m. Bottom edge 1.5 m, top edge 4.5 m.
  led: { width: 5, height: 3, bottom: 1.5, cols: 10, rows: 6 },

  // White "sticker card" frame behind the LED, full stage width.
  frame: {
    width: 6,
    top: 5.25,        // EST from elevation (frame top edge)
    setback: 0.4,     // EST distance of the frame from the deck's back edge
    thickness: 0.12,
    outline: 0.09,    // bold dark border width
    offset: 0.22,     // pink offset layer shift (right & down)
  },

  // OPF logo: die-cut sign on the front of the front top truss, centred.
  // The board follows the logo's outline plus a border, in the board colour.
  // Height follows the artwork; the sign fits inside width × maxHeight.
  logo: {
    width: 3.2,       // EST sign width, border included
    maxHeight: 2.8,   // EST cap for tall artwork (the top is always kept 0.15 m under the ceiling)
    raise: 0.1,       // sign centre above the truss centre line
    standoff: 0.1,    // gap between the truss face and the back of the sign
    thickness: 0.06,  // board thickness
    border: 0.08,     // board border around the artwork
    board: 'cyan',    // board colour (palette name), shows around and between the letters
  },

  // Wings: cyan left, yellow right, on the floor either side of the deck.
  wings: { width: 1.5, height: 4.8, thickness: 0.1, angleDeg: 0 },

  // Ground-supported box truss: goalpost frames front and back, joined on top.
  truss: {
    top: 6.2,
    size: 0.3,        // EST box truss section (0.3 m, as drawn)
    spanOuter: 10.3,  // EST outside width of the goalpost (from elevation)
    frontZ: 0.2,      // EST front goalpost just in front of the deck edge
    depth: 6.5,       // EST distance front goalpost → rear goalpost
    fixtures: 5,      // lighting fixtures on the front top truss
  },

  // PA stacks: ground-stacked, 2 boxes each, outside the wings.
  pa: {
    centreX: 5.85,          // EST from elevation
    z: -0.8,                // EST from plan (near the deck's front corners)
    width: 0.9, depth: 0.9, // EST
    boxHeights: [1.15, 1.5],// EST bottom box, top box
  },

  // Crossover behind the LED (deck-height walkway).
  crossover: { width: 9, depth: 1.5, height: 1.0 }, // EST from plan

  // Hall ceiling over the stage zone ("low-ceiling portion").
  ceiling: {
    height: 7.6,                                  // 25 ft
    zone: { x0: -10, x1: 10, z0: -8.2, z1: 2.5 }, // EST extent of the low portion
  },

  // Sparkle stickers (4-point stars). x/y = centre, z = distance in front of the frame face.
  stars: [
    { color: 'yellow', size: 0.95, x: -2.95, y: 5.2, z: 0.3 },  // frame top-left
    { color: 'pink',   size: 0.42, x: 2.1,   y: 5.72, z: 0.35 }, // above the frame, right
    { color: 'cyan',   size: 0.62, x: 2.55,  y: 1.5, z: 0.3 },   // LED bottom-right
  ],
};

// ─── PLACEMENT IN THE HALL (plan view) ──────────────────────────────────────
export const site = {
  // The hall section is not centred on the stage in the plan; this shifts it.
  hallCentreX: 0.9, // EST

  hall: {
    backZ: -8.2,          // EST outer edge (the stage backs onto it)
    backHalfWidth: 35.7,  // EST half-width of the section at the back
    frontCornerZ: 20,     // EST where the curved front edge meets the section sides
    frontHalfWidth: 32,   // EST half-width at the front corners
    frontSag: 3,          // EST how far the curved front bows towards the Fountain
    eaveHeight: 8.5,      // EST glass wall height (illustrative shell)
    roofRise: 7,          // EST arched roof rise above the eaves (illustrative)
    boothAreaWidth: 14,   // EST booth areas shown beyond each side of the section
  },

  backstage: { width: 6, depth: 4, centreX: -11.5 }, // 6 × 4 m, rear left; position EST

  pit: { depth: 2, width: 24 },         // pit 2 m; width EST from plan
  barricade: { height: 1.2, foot: 0.8 },

  // Viewing pocket (standing). Straight back edge, curved front edge.
  pocket: {
    backZ: 3.2,            // EST
    backHalfWidth: 17.7,   // EST
    frontCornerZ: 13.9,    // EST
    frontHalfWidth: 16.4,  // EST
    frontSag: 2,           // EST
    statedArea: 250,       // m², as labelled on the plan (drawn shape measures larger, see NOTES)
  },

  foh: { x: 15.6, z: 8.9, width: 4, depth: 3, riser: 0.3 }, // EST from plan

  // AC towers at the pocket's front corners (positions indicative).
  acTowers: [
    { x: -14.5, z: 13.4 },
    { x: 16.1, z: 13.4 },
  ],
  acTower: { width: 0.7, depth: 0.7, height: 2.0 }, // EST

  aisle: { width: 4.5 },           // EST curved visitor aisle along the front edge
  flooringStrips: { width: 6 },    // 250 kg/m² strips down each side; width EST
};

// ─── HUMAN SCALE ────────────────────────────────────────────────────────────
export const people = {
  performers: [
    { x: -1.7, z: -2.6, color: 'pink' },
    { x: -0.55, z: -1.8, color: 'cyan' },
    { x: 0.6, z: -2.2, color: 'yellow' },
    { x: 1.75, z: -2.9, color: 'white' },
  ],
  crowdDensity: 0.55, // people per m² in the sample crowd (not a capacity figure)
  seed: 2027,
};

// ─── ARTWORK SLOTS ──────────────────────────────────────────────────────────
// Drop official CyberE files into /public/assets using these names.
// The first file that exists is used; otherwise a labelled placeholder shows.
// Artwork is always shown whole ("contain"): never cropped, stretched or recoloured.
export const assets = {
  led:       ['assets/led.mp4', 'assets/led.webm', 'assets/led.png', 'assets/led.jpg'],
  wingLeft:  ['assets/wing-left.png', 'assets/wing-left.jpg'],
  wingRight: ['assets/wing-right.png', 'assets/wing-right.jpg'],
  logo:      ['assets/opf-logo.png', 'assets/opf-logo.webp', 'assets/opf-logo.svg', 'assets/opf-logo.jpg'],
};

export const render = { width: 1920, height: 1080 };
