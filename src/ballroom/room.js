// Grand Ballroom shell: floor + zones, walls with door openings, pixel-mapped LED
// ceiling, foyer, optional divider and flow arrows (config: ballroom.config.js).
// Walls and ceilings are one-sided (facing into the room), so views from outside
// or above look straight in, doll's-house style, while views inside see them.
import * as THREE from 'three';
import { room as R, foyer as F, doors as D, zoning as Z, divider as DV, flows } from '../../config/ballroom.config.js';
import { palette as P } from '../../stage.config.js';
import { toon, canvasTexture, floorZone, floorLine, floorDecal, floorArrow, polyline, OUTLINE, OUTLINE_THIN, FONT_BODY } from '../sticker.js';

const W = R.width, Dp = R.depth, xL = -W / 2, xR = W / 2, zB = -Dp / 2, zD = Dp / 2;

// Zone rectangles on plan ([x0, z0, x1, z1]) and areas, derived from the config
export function zones() {
  const xSplit = xL + W * Z.panelShare;
  const zMini = zB + Z.miniDepth;
  const pause = [xR - Z.pause.width, zD - Z.pause.depth, xR, zD];
  const r = {
    panel: [xL, zB, xSplit, zD],
    mini: [xSplit, zB, xR, zMini],
    networking: [xSplit, zMini, xR, zD],
    pause,
    foyer: [xL, zD, xR, zD + F.depth],
  };
  const area = ([x0, z0, x1, z1]) => (x1 - x0) * (z1 - z0);
  return {
    rects: r, xSplit, zMini,
    areas: {
      room: W * Dp,
      panel: area(r.panel), mini: area(r.mini),
      networking: area(r.networking) - area(pause), pause: area(pause), foyer: area(r.foyer),
    },
  };
}

const poly = ([x0, z0, x1, z1]) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];

function ledCeilingTexture(bright) {
  const tex = canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = bright ? '#15131c' : '#221f2a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = bright ? '#c9b8ff' : '#4a4560';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, bright ? 6 : 5, 0, Math.PI * 2);
    ctx.fill();
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(W / R.ledPitch, Dp / R.ledPitch);
  tex.anisotropy = 8;
  return tex;
}

// One-sided wall panel from (x0, z0) to (x1, z1). It faces the side to the right
// of that direction (walking from the first point to the second).
function wallPanel(x0, z0, x1, z1, y0, y1, mat) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(len, y1 - y0), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.rotation.y = Math.atan2(-(z1 - z0), x1 - x0) + Math.PI;
  m.receiveShadow = true;
  return m;
}

export function buildRoom({ labels = true } = {}) {
  const g = new THREE.Group();
  g.name = 'ballroom';
  const { rects, areas } = zones();

  // ─── Floor + zones ───
  g.add(floorZone(poly([xL, zB, xR, zD]), R.carpet, 0));
  g.add(floorZone(poly(rects.foyer), Z.colors.foyer, 0));
  for (const k of ['panel', 'mini', 'networking']) {
    g.add(floorZone(poly(rects[k]), Z.colors[k], 0.01));
    g.add(floorLine(poly(rects[k]), 0.03, OUTLINE_THIN));
  }
  g.add(floorZone(poly(rects.pause), Z.colors.pause, 0.015));
  g.add(floorLine(poly(rects.pause), 0.035, OUTLINE));
  g.add(floorLine(poly([xL, zB, xR, zD]), 0.04, OUTLINE));
  g.add(floorLine(poly(rects.foyer), 0.04, OUTLINE_THIN));

  // ─── Walls (one-sided, facing in) with door openings in the long wall ───
  const wallMat = toon(R.wallColor, { side: THREE.FrontSide });
  const H = R.ceiling;
  g.add(wallPanel(xR, zB, xL, zB, 0, H, wallMat));          // far wall
  g.add(wallPanel(xL, zB, xL, zD, 0, H, wallMat));          // left end
  g.add(wallPanel(xR, zD, xR, zB, 0, H, wallMat));          // right end
  const doorsX = D.list.map((d) => d.x).sort((a, b) => a - b);
  let x = xL;
  for (const dx of doorsX) {                                 // long wall, split at the doors
    const a = dx - D.width / 2, b = dx + D.width / 2;
    g.add(wallPanel(x, zD, a, zD, 0, H, wallMat));
    g.add(wallPanel(a, zD, b, zD, D.height, H, wallMat));  // lintel
    x = b;
  }
  g.add(wallPanel(x, zD, xR, zD, 0, H, wallMat));
  // the same wall seen from the foyer, up to the foyer ceiling
  const foyerWall = toon('#f3efe8');
  x = xL;
  for (const dx of doorsX) {
    const a = dx - D.width / 2, b = dx + D.width / 2;
    g.add(wallPanel(a, zD, x, zD, 0, F.ceiling, foyerWall));
    g.add(wallPanel(b, zD, a, zD, D.height, F.ceiling, foyerWall));
    x = b;
  }
  g.add(wallPanel(xR, zD, x, zD, 0, F.ceiling, foyerWall));
  // wall tops and door frames as bold outlines
  g.add(polyline([[xL, zB], [xR, zB], [xR, zD], [xL, zD]].map(([px, pz]) => new THREE.Vector3(px, H, pz)), OUTLINE, true));
  for (const [px, pz] of [[xL, zB], [xR, zB], [xR, zD], [xL, zD]]) {
    g.add(polyline([new THREE.Vector3(px, 0, pz), new THREE.Vector3(px, H, pz)], OUTLINE_THIN));
  }
  const doorMat = toon('#5a4a44');
  for (const d of D.list) {
    g.add(polyline([[d.x - D.width / 2, 0], [d.x - D.width / 2, D.height], [d.x + D.width / 2, D.height], [d.x + D.width / 2, 0]]
      .map(([px, py]) => new THREE.Vector3(px, py, zD)), OUTLINE));
    for (const side of [-1, 1]) { // door leaves, standing open into the room
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.05, D.height - 0.05, D.width / 2), doorMat);
      leaf.position.set(d.x + side * (D.width / 2 - 0.03), D.height / 2, zD - D.width / 4);
      leaf.castShadow = true;
      g.add(leaf);
    }
  }

  // ─── Ceilings (one-sided, seen from below) ───
  const ceilingDay = ledCeilingTexture(false), ceilingNight = ledCeilingTexture(true);
  const ceilMat = new THREE.MeshBasicMaterial({ map: ceilingDay });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, Dp), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  g.add(ceiling);
  const foyerCeiling = new THREE.Mesh(new THREE.PlaneGeometry(W, F.depth), toon('#f6f3ee'));
  foyerCeiling.rotation.x = Math.PI / 2;
  foyerCeiling.position.set(0, F.ceiling, zD + F.depth / 2);
  g.add(foyerCeiling);

  // ─── Divider (pipe & drape) between the panel zone and the right third ───
  const divider = new THREE.Group();
  const { xSplit } = zones();
  const drape = new THREE.Mesh(new THREE.BoxGeometry(0.08, DV.height, Dp - 2 * 1.2), toon('#2f2c32'));
  drape.position.set(xSplit, DV.height / 2, 0);
  drape.castShadow = true;
  divider.add(drape);
  divider.add(polyline([[zB + 1.2, 0], [zB + 1.2, DV.height], [zD - 1.2, DV.height], [zD - 1.2, 0]]
    .map(([pz, py]) => new THREE.Vector3(xSplit, py, pz)), OUTLINE));
  divider.visible = !DV.open;
  g.add(divider);

  // ─── Floor lettering: zones with areas and seat counts ───
  const decals = new THREE.Group();
  const m2 = (a) => `≈ ${Math.round(a).toLocaleString('en-US')} M²`;
  const put = (lines, w, h, x0, z0, rot = 0) => { const d = floorDecal(lines, w, h, { rotate: rot }); d.position.set(x0, 0.05, z0); decals.add(d); };
  if (labels) {
    const [px0, , px1] = rects.panel;
    put([{ text: 'PANEL STAGE ZONE', size: 0.36 }, { text: `${m2(areas.panel)} · 480 SEATS`, size: 0.26 }], 16, 3, (px0 + px1) / 2, zD - 2.2);
    const [mx0, mz0, mx1] = rects.mini;
    put([{ text: 'MINI STAGE', size: 0.36 }, { text: `${m2(areas.mini)} · 60 SEATS + ~100 STANDING`, size: 0.24 }], 11, 2.6, (mx0 + mx1) / 2, mz0 + Z.miniDepth - 1.4);
    const [nx0, nz0] = rects.networking;
    put([{ text: 'NETWORKING / COMMUNITY', size: 0.34 }, { text: m2(areas.networking), size: 0.26 }], 11, 2.4, nx0 + 5.8, nz0 + 7.2);
    const [qx0, qz0, qx1] = rects.pause;
    put([{ text: 'PROPOSED', size: 0.22 }, { text: 'PAUSE POCKET', size: 0.3 }, { text: m2(areas.pause), size: 0.2 }], Z.pause.width - 0.6, 2.8, (qx0 + qx1) / 2, qz0 + 1.7);
    put([{ text: `FOYER · CEILING ${F.ceiling} M`, size: 0.4 }, { text: m2(areas.foyer), size: 0.3 }], 14, 2.2, 13.5, zD + F.depth - 1.6);
  }
  g.add(decals);

  // ─── Flow arrows (foyer → arch → doors → zones) ───
  const arrows = new THREE.Group();
  for (const f of flows) {
    for (let i = 0; i < f.path.length - 1; i++) {
      const [ax, az] = f.path[i], [bx, bz] = f.path[i + 1];
      const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.floor(len / 2.6));
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n;
        const arrow = floorArrow(ax + (bx - ax) * t, az + (bz - az) * t, bx - ax, bz - az, 1.5, 0.75, f.color, 0.07);
        arrow.children[0].material.depthWrite = false;
        arrow.children[0].renderOrder = 3;
        arrow.children[0].userData.decal = true;
        arrows.add(arrow);
      }
    }
  }
  g.add(arrows);

  const setNight = (on) => { ceilMat.map = on ? ceilingNight : ceilingDay; ceilMat.needsUpdate = true; };
  return { group: g, ceiling, foyerCeiling, divider, arrows, decals, setNight, areas, rects };
}
