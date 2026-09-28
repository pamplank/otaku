// ============================================================================
//  OTAKU POP FES 2027 · INSTALLATION · GIANT GACHAPON
//  Interactive capsule machine for a mall concourse or Okada. EVERY DIMENSION IS TBC.
//  Metres. Origin: floor, machine centre; +z = front.
// ============================================================================
export const machine = {
  plinth: { width: 2.0, depth: 1.7, height: 0.1 },       // EST
  body: { width: 1.8, depth: 1.5, height: 1.55 },        // EST
  collar: { radius: 1.05, height: 0.15 },                // EST ring under the dome
  dome: { radius: 0.95 },                                // EST clear dome
  cap: { radius: 0.32, height: 0.2 },                    // EST top knob → ≈ 3.7 m overall
  crank: { radius: 0.28, x: -0.45, y: 0.85 },            // EST
  chute: { width: 0.44, height: 0.38, x: 0.45, y: 0.58 },// EST
  color: 'pink', collarColor: 'white', capColor: 'yellow', crankColor: 'cyan',   // palette; editable
};
// Capsules in three tiers: common (palette colours), special (silver), rare (gold)
export const capsules = { radius: 0.14, common: 40, special: 6, rare: 4, seed: 27 };
// Prize display panel beside the machine (its own slot)
export const prizes = { width: 1.15, height: 1.8, bottom: 0.25, x: 2.15, z: 0.2, turn: -22 };
export const queue = { people: 4, x: -2.3, z: 2.6 };      // EST small queue with belt stanchions
export const text = { date: 'JUNE 5–6, 2027', giveaway: 'OPTIONAL · NEEDS CYBERE APPROVAL' };
