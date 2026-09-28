// Positions derived from stage.config.js. Edit the config, not this file.
import { stage as S, site as X } from '../stage.config.js';
import { pavilion as ZONE_RING } from '../config/zone.config.js';   // read-only reference for the concave hall (see V)

const D = S.deck;
const T = S.truss;
const H = X.hall;
const PK = X.pocket;
const cx = X.hallCentreX;

const frameZ = -D.depth + S.frame.setback;
const frameFront = frameZ + S.frame.thickness / 2;
const kFront = H.frontSag / H.frontHalfWidth ** 2;

// z of the hall's curved front edge at a given x (parabolic arc).
const hallFrontZ = (x) => H.frontCornerZ + H.frontSag - kFront * (x - cx) ** 2;

// x of the section's side cut line at depth z. side = -1 (left) or +1 (right).
const cutX = (side, z) => {
  const t = (z - H.backZ) / (H.frontCornerZ - H.backZ);
  return cx + side * (H.backHalfWidth + (H.frontHalfWidth - H.backHalfWidth) * t);
};

// Parabolic arc from xL to xR whose ends sit at zEnds and middle bows by sag.
function arc(xL, xR, zOf, n = 32) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = xL + ((xR - xL) * i) / n;
    pts.push([x, zOf(x)]);
  }
  return pts;
}

// Viewing pocket outline: straight back edge, curved front edge.
const pocketFrontZ = (x) => PK.frontCornerZ + PK.frontSag * (1 - ((x - cx) / PK.frontHalfWidth) ** 2);
const pocketPoly = [
  [cx - PK.backHalfWidth, PK.backZ],
  [cx + PK.backHalfWidth, PK.backZ],
  ...arc(cx + PK.frontHalfWidth, cx - PK.frontHalfWidth, pocketFrontZ, 32),
];

function polyArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % pts.length];
    a += x1 * z2 - x2 * z1;
  }
  return Math.abs(a / 2);
}

export const L = {
  cx,
  frameZ,
  frameFront,
  ledZ: frameFront + 0.06,
  ledTop: S.led.bottom + S.led.height,
  trussLegX: T.spanOuter / 2 - T.size / 2,
  trussFrontZ: T.frontZ,
  // Header cladding (outer half-width, underside) and the logo sign on its front.
  // logoY is the sign centre at its tallest; the real height follows the artwork.
  archHalfWidth: T.spanOuter / 2 - T.size / 2 + (S.arch.pillars ? S.arch.pillarWidth : S.arch.headerDepth) / 2,
  archHeaderBottom: T.top - S.arch.headerHeight,
  logoY: T.top - S.logo.drop + S.logo.maxHeight / 2,
  logoZ: T.frontZ + (S.arch.enabled ? S.arch.headerDepth : T.size) / 2 + S.logo.standoff + S.logo.thickness / 2,
  trussBackZ: T.frontZ - T.depth,
  ceilingClear: S.ceiling.height - T.top,
  hallFrontZ,
  cutX,
  arc,
  pocketFrontZ,
  pocketPoly,
  pocketArea: polyArea(pocketPoly),
  aisleInnerZ: (x) => hallFrontZ(x) - X.aisle.width,
  polyArea,
};

// ─── Concave hall geometry (main stage view only) ───────────────────────────
// The hall section wraps around the Fountain like the IP BOOTH ZONE ring. The
// ring is an ellipse (config/zone.config.js → pavilion, read here as a reference
// only); at the stage — the top of the ellipse — it is matched by its osculating
// circle, radius semiX² / semiZ, so every curved edge below is an arc of that
// circle's centre C and every side edge is radial (points at C). The zone view
// itself does not use any of this.

const ringMidZ = hallFrontZ(cx) - ZONE_RING.width / 2;           // zone centreline at the stage (as in zone.js)
const Rc = ZONE_RING.semiX ** 2 / ZONE_RING.semiZ;               // radius of curvature at the top of the ellipse
const C = { x: cx, z: ringMidZ + Rc };                           // centre of the arcs, on the Fountain side
const polar = (t, r) => [C.x + r * Math.sin(t), C.z - r * Math.cos(t)];   // t: radians from the stage axis, + = right
const angleOf = (x, z) => Math.atan2(x - C.x, C.z - z);
const radiusOf = (x, z) => Math.hypot(x - C.x, C.z - z);
// Arc of radius r from angle t0 to t1
const arcR = (r, t0, t1, n = 48) => Array.from({ length: n + 1 }, (_, i) => polar(t0 + ((t1 - t0) * i) / n, r));
// Band between radii r0 < r1 and angles t0 < t1 (radial sides)
const band = (r0, r1, t0, t1, n = 48) => [...arcR(r1, t0, t1, n), ...arcR(r0, t1, t0, n)];

const Ri = C.z - hallFrontZ(cx);                                 // inner arc: hall edge on the Fountain side
const Rb = C.z - H.backZ;                                        // outer arc: behind the stage
const Ra = Ri + X.aisle.width;                                   // visitor aisle, stage-side edge
const alpha = Math.asin(H.frontHalfWidth / Ri);                  // section side edges (radial)
const beta = alpha + H.boothAreaWidth / ((Ri + Rb) / 2);         // outer edge of the booth areas
const strip = X.flooringStrips.width / ((Ra + Rb) / 2);          // 250 kg/m² strip, angular width

// Viewing pocket: straight back edge behind the pit, radial sides, front on an arc
// concentric with the hall; its front radius is solved so the area is the spec's.
const pocketHalf = Math.atan(PK.backHalfWidth / (C.z - PK.backZ));
function pocketFor(rFront) {
  const bx = (C.z - PK.backZ) * Math.tan(pocketHalf);
  return [[C.x - bx, PK.backZ], [C.x + bx, PK.backZ], ...arcR(rFront, pocketHalf, -pocketHalf, 40)];
}
let lo = C.z - PK.backZ - 30, hi = C.z - PK.backZ - 1;           // bisection on the front radius
for (let i = 0; i < 60; i++) {
  const mid = (lo + hi) / 2;
  if (polyArea(pocketFor(mid)) > PK.statedArea) lo = mid; else hi = mid;
}
const Rp = (lo + hi) / 2;
const concavePocket = pocketFor(Rp);

// FOH front-right inside the pocket; AC towers on the pocket's two front corners
const FOH = X.foh;
const fohR = Rp + FOH.depth / 2 + 0.7;
const fohT = pocketHalf - (FOH.width / 2 + 1.9) / fohR;
const [fohX, fohZ] = polar(fohT, fohR);
const acTowers = [-1, 1].map((s) => { const [x, z] = polar(s * (pocketHalf - 0.4 / Rp), Rp + 0.45); return { x, z }; });

export const V = {
  C, Rc, Ri, Rb, Ra, alpha, beta, strip,
  polar, angleOf, radiusOf, arcR, band,
  frontZ: (x) => C.z - Math.sqrt(Ri ** 2 - (x - C.x) ** 2),     // inner arc z at x
  aisleZ: (x) => C.z - Math.sqrt(Ra ** 2 - (x - C.x) ** 2),      // aisle's stage-side edge z at x
  sectionPoly: band(Ri, Rb, -alpha, alpha, 64),
  pocketPoly: concavePocket,
  pocketArea: polyArea(concavePocket),
  pocketFrontR: Rp,
  pocketHalf,
  foh: { ...FOH, x: fohX, z: fohZ, rot: -fohT },
  acTowers,
};
