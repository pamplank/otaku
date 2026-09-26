// ============================================================================
//  OTAKU POP FES 2027 · IP BOOTH ZONE · Crystal Pavilion
//  Follows the RFP venue layout (OPF27 RFP pp. 34 / 36, "layout is provisional"):
//  the Crystal Pavilion is a long curved glass arcade around the north side of
//  the Fountain, split left → right into Artist Alley · Food · Sponsors · Stage ·
//  IP zone (merchandise "MD" at its start), with the Entrance at the IP end.
//  No floor plan was supplied: shape and proportions are traced from the RFP
//  plan and scaled so the pavilion is ≈ 5,700 m² as the RFP states.
//  EVERY DIMENSION IS TBC. Metres. "EST" = assumed, see ASSUMED_DIMENSIONS.md.
//  Coordinates are the main stage's (stage.config.js): origin = deck front
//  centre, +z = towards the Fountain. The Stage segment is the main stage model.
// ============================================================================

// The pavilion follows an elliptical arc (centreline). Angles t in degrees:
// t = 0 at the stage, − = towards Artist Alley (left), + = towards the Entrance.
// Semi-axes traced from the RFP plan (330 : 180 px) × 0.35 m/px (EST).
export const pavilion = {
  semiX: 115.5,       // EST half-span of the centreline across
  semiZ: 63,          // EST depth of the centreline arc
  width: 20,          // EST arcade width (the Stage segment widens to the main stage section)
  from: -76,          // Artist Alley end
  to: 80,             // Entrance end
  wall: { height: 6, color: '#efe3c2' },   // EST outer facade (the cream wall in the RFP photos)
};

// Zones along the arcade, left → right as in the RFP (angle ranges traced from the plan)
export const zones = [
  { id: 'artist', name: 'ARTIST ALLEY', color: '#ffc6df', from: -76, to: -50.6 },
  { id: 'food', name: 'FOOD', color: '#fff59e', from: -50.6, to: -35.2 },
  { id: 'sponsors', name: 'SPONSORS', color: '#ffffff', from: -35.2, to: -11 },
  { id: 'stage', name: 'STAGE', color: '#aeeaf0', from: -11, to: 11 },
  { id: 'md', name: 'MD · MERCHANDISE', color: '#dcd8de', from: 11, to: 22.3, dashed: true },
  { id: 'ip', name: 'IP ZONE', color: '#dcd8de', from: 22.3, to: 80 },
];

// The Fountain (lake) inside the arc, proportions traced from the RFP plan (EST)
export const fountain = { rx: 94, rz: 40, offset: 6 };   // offset: lake centre beyond the arc centre (towards +z)

// Placeholder mix of booth units (see config/booths.config.js for each plan)
export const mix = { A: 4, B: 8, C: 8, label: 'MIX TBC' };

// IP booth layout across the 20 m arcade (distances from the outer wall inwards):
// outer row (backs to the facade) · central aisle · inner row · walkway on the glass side.
export const ip = {
  outerRowFront: 6,    // outer row booth fronts line up 6 m in from the facade
  aisle: 5,            // EST central aisle
  walkway: 3,          // EST walkway along the fountain side
  groupSize: 5,        // units between cross aisles
  gap: { outer: 0.4, inner: 1.2 },   // EST side gaps (more on the inner row, where the arc pinches the backs)
  margin: { start: 3, end: 7 },      // EST clear space after the MD zone / before the Entrance
};

// Visitors walking the aisles (+ others along the arcade)
export const visitors = { ip: 110, otherZones: 90, seed: 606 };

// OPF wayfinding sign at the Entrance end of the IP zone (texture slot, ours — not IP)
export const zoneSign = { width: 4, height: 1.2, bottom: 2.2 };   // EST
