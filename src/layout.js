// Positions derived from stage.config.js. Edit the config, not this file.
import { stage as S, site as X } from '../stage.config.js';

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
