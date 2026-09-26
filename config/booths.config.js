// ============================================================================
//  OTAKU POP FES 2027 · IP BOOTHS · PLAN A / B / C
//  Licensed IP booths: graphics and construction come from CyberE / Japan. These
//  are clean neutral placeholders at the right size — never IP artwork. Every
//  graphic surface is a texture slot ("IP ARTWORK – SUPPLIED BY CYBERE").
//  EVERY DIMENSION IS TBC. Metres. "EST" = assumed, see ASSUMED_DIMENSIONS.md.
//  Origin: floor level, centre of the booth footprint; +z = the visitor aisle side.
// ============================================================================

export const neutral = {
  floor: '#e7e4df',       // hall floor around the booths
  shell: '#f4f2ef',       // booth walls / panels
  volume: '#d9d6d1',      // placeholder volumes
  standee: '#cfccc8',
};

// PLAN A: HOSTED EXHIBITION · 6 × 6 m · 1 director + 4 staff · lead colour yellow
// Guest path: QUEUE (front left) → MAIN EXPERIENCE (centre) → PHOTO (at the KV)
// → TAKEAWAY / EXIT (counter, right) → out at the front, past INFO / RESET.
export const planA = {
  lead: 'yellow',
  footprint: { width: 6, depth: 6 },
  platform: { height: 0.1 },                                         // 100 mm timber base platform, 6 × 6 m
  kvPanel: { width: 3.9, height: 3.0, thickness: 0.12, setback: 0.1 },  // back wall; setback from the rear edge EST
  experience: { width: 2.2, depth: 2.0, height: 2.2, x: -0.3, z: 0.4 },  // placeholder volume; size/position EST
  counter: { width: 2.0, depth: 0.5, height: 0.95, x: 2.25, z: -0.3 },   // display counter, faces the guest path; depth/height/position EST
  photo: { x: -0.3, z: -1.95 },                                      // stand-here spot in front of the KV (EST)
  queue: { width: 0.8, post: 0.9, path: [[-2.45, 2.75], [-2.45, 0.9], [-1.75, 0.9]], guests: 4 },  // belt queue inside the booth; EST
  info: { width: 0.6, depth: 0.45, height: 1.05, x: 0.55, z: 2.5 },  // INFO / RESET point at the exit; EST
  staff: [
    { role: 'DIRECTOR', x: 0.95, z: 2.2, rot: 0.6 },
    { role: 'WELCOME', x: -1.8, z: 2.72, rot: -1.0 },
    { role: 'HOST A', x: -2.15, z: -0.15, rot: 0.9 },
    { role: 'HOST B', x: 1.35, z: -1.25, rot: -2.0 },
    { role: 'EXIT / RESET', x: 2.75, z: -0.3, rot: -Math.PI / 2 },
  ],
};

// PLAN B: EXHIBITION + PHOTO · 6 m frontage × 3 m depth × 3 m high · 1 director + 1 staff · lead colour pink
// No games, hands-on stations, merch counters, monitors or game machines.
export const planB = {
  lead: 'pink',
  footprint: { width: 6, depth: 3 },
  shell: { height: 3, thickness: 0.1 },                                        // three-sided, open on the 6 m visitor side
  panels: { width: 1.2, height: 2.0, bottom: 0.5, xs: [-2.0, -0.7, 0.6] },   // exhibition panels on the back wall; EST
  photo: { width: 1.5, height: 2.4, bottom: 0.2, x: 2.1 },                     // photo spot panel at the right end; EST
  // "RR ADDS" (our additions)
  intro: { width: 0.9, height: 2.0, bottom: 0.3, x: -2.4, z: 1.2 },           // title intro panel at the entrance edge; EST
  markers: { size: 0.32, y: 2.75 },                                            // 1-2-3 read-order markers above the panels; EST
  standHere: { x: 2.1, z: -0.35, size: 0.7 },                                  // "stand here" photo cue; EST
  staff: [
    { role: 'DIRECTOR', x: -0.2, z: 1.15, rot: Math.PI },
    { role: 'STAFF', x: 1.4, z: 0.75, rot: -2.3 },
  ],
};

// PLAN C: PHOTO SPOT + STANDEES · backdrop W3.0 × H2.0 m · no op staff · lead colour cyan
export const planC = {
  lead: 'cyan',
  footprint: { width: 5, depth: 4 },                             // EST: area drawn around the photo spot
  backdrop: { width: 3.0, height: 2.0, bottom: 0.2, z: -1.5 },   // on its own supports; bottom/z EST
  standees: { height: 1.8, width: 0.7, x: 2.05, z: -1.2 },       // neutral silhouettes either side; EST
  clearance: { width: 4.0, depth: 3.0, height: 2.2, z: -1.2, label: 'PHOTO CLEARANCE – TBC' },  // annotation only; EST
};

// Hall context drawn around a single booth (Crystal Pavilion floor, visitor aisle in front)
export const context = { floor: 34, aisle: 3.0 };                // aisle width EST
