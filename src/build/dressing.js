// Stage dressing in the OPF 2027 deck style: barricade banner, PA wraps, hanging
// sparkles + speech bubble, floor graphics, and night-only neon on the arch.
// Everything is switched and edited in stage.config.js → dressing.
import * as THREE from 'three';
import { stage as S, site as X, dressing as DR, palette as P } from '../../stage.config.js';
import { L } from '../layout.js';
import { canvasTexture, drawSparkle, FONT_DISPLAY } from '../sticker.js';
import { dieCutBoard } from '../slots.js';

const LOGO_SRC = `${import.meta.env.BASE_URL}assets/opf-logo.png`;

function display(ctx, px) {
  ctx.font = `900 ${px}px ${FONT_DISPLAY}`;
  ctx.fontStretch = 'expanded';
}

// Rounded pill with a dark outline and centred display text; returns its width.
function pill(ctx, cx, cy, text, px, fill, lineWidth = px * 0.12) {
  display(ctx, px);
  const w = ctx.measureText(text).width + px * 1.8, h = px * 1.7;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = P.dark;
  ctx.stroke();
  ctx.fillStyle = P.dark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + px * 0.05);
  return w;
}

function printedPlane(w, h, map) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshToonMaterial({ map, transparent: true }));
  m.receiveShadow = true;
  return m;
}

// Flat graphic lying on the floor (drawn over zones; plan view keeps it on top).
function floorGraphic(w, d, map, y) {
  const m = printedPlane(w, d, map);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.material.depthWrite = false;
  m.renderOrder = 3;
  m.userData.decal = true;
  return m;
}

// ─── Barricade banner ───────────────────────────────────────────────────────
function barricadeBanner(g) {
  const cfg = DR.barricade;
  const PIT = X.pit, B = X.barricade;
  const ppm = 100, w = PIT.width, h = B.height - 0.1;
  const canvas = document.createElement('canvas');
  canvas.width = w * ppm;
  canvas.height = h * ppm;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const draw = (logo) => {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const top = H * 0.22, bottom = top * 0.6;
    ctx.fillStyle = P.teal;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = P.pink;
    ctx.fillRect(0, 0, W, top);
    ctx.fillStyle = P.yellow;
    ctx.fillRect(0, H - bottom, W, bottom);
    ctx.fillStyle = P.dark;
    ctx.fillRect(0, top, W, 3);
    ctx.fillRect(0, H - bottom - 3, W, 3);
    // Repeating tagline in the pink band
    display(ctx, top * 0.55);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const tag = `${cfg.tagline}  ✦  `;
    const tw = ctx.measureText(tag).width;
    for (let x = 0; x < W; x += tw) ctx.fillText(tag, x, top / 2 + 2);
    // Logos with sparkles between them
    const lh = H * 0.42, mid = top + (H - top - bottom) / 2, step = cfg.logoEvery * ppm;
    for (let x = step / 2, i = 0; x < W; x += step, i++) {
      if (logo) {
        const lw = lh * (logo.width / logo.height);
        ctx.drawImage(logo, x - lw / 2, mid - lh / 2, lw, lh);
      }
      drawSparkle(ctx, x + step / 2, mid, lh * 0.22, i % 2 ? P.yellow : P.white, P.dark, 3);
    }
    ctx.lineWidth = 4;
    ctx.strokeStyle = P.dark;
    ctx.strokeRect(0, 0, W, H);
    tex.needsUpdate = true;
  };
  draw(null);
  const img = new Image();
  img.onload = () => draw(img);
  img.src = LOGO_SRC;

  const banner = printedPlane(w, h, tex);
  banner.position.set(0, h / 2 + 0.05, PIT.depth + 0.085);
  g.add(banner);
}

// ─── PA wraps ───────────────────────────────────────────────────────────────
function paWraps(g) {
  const PA = S.pa;
  for (const side of [-1, 1]) {
    let y = 0;
    PA.boxHeights.forEach((bh, i) => {
      const tex = canvasTexture(300, Math.round((300 * bh) / PA.width), (ctx, W, H) => {
        ctx.fillStyle = i ? P.pink : P.yellow;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let yy = 0; yy < H; yy += 30) for (let xx = (yy / 30) % 2 ? 0 : 30; xx < W; xx += 60) ctx.fillRect(xx, yy, 30, 30);
        drawSparkle(ctx, W / 2, H * 0.45, W * 0.3, P.white, P.dark, 6);
        display(ctx, W * 0.12);
        ctx.fillStyle = P.dark;
        ctx.textAlign = 'center';
        ctx.fillText(DR.paWraps.labels[i] ?? '', W / 2, H * 0.85);
        ctx.lineWidth = 10;
        ctx.strokeStyle = P.dark;
        ctx.strokeRect(0, 0, W, H);
      });
      const wrap = printedPlane(PA.width, bh, tex);
      wrap.position.set(side * PA.centreX, y + bh / 2, PA.z + PA.depth / 2 + 0.006);
      g.add(wrap);
      y += bh;
    });
  }
}

// ─── Hanging sparkles + speech bubble ───────────────────────────────────────
function sparkles(g) {
  const cfg = DR.sparkles;
  const yTruss = S.truss.top - S.truss.size / 2;
  const cable = new THREE.LineBasicMaterial({ color: '#555555' });
  for (const [x, y, z, size, colour] of cfg.stars) {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    drawSparkle(c.getContext('2d'), 256, 256, 230, P[colour], P.dark, 14);
    const star = dieCutBoard(c, size, { thickness: 0.04, border: size * 0.06 });
    star.position.set(x, y, z);
    star.rotation.z = ((x * 7) % 0.4) - 0.2; // a little tilt each
    g.add(star);
    const pts = [new THREE.Vector3(x, y + size / 2 - 0.02, z), new THREE.Vector3(x, yTruss, z)];
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), cable));
  }

  const b = cfg.bubble;
  if (!b) return;
  const c = document.createElement('canvas');
  c.width = 900;
  c.height = 560;
  const ctx = c.getContext('2d');
  ctx.beginPath();
  ctx.ellipse(450, 240, 400, 200, 0, 0, Math.PI * 2);
  ctx.moveTo(250, 400);
  ctx.lineTo(170, 540);
  ctx.lineTo(360, 420);
  ctx.fillStyle = P.white;
  ctx.fill();
  ctx.lineWidth = 18;
  ctx.strokeStyle = P.dark;
  ctx.stroke();
  display(ctx, 110);
  ctx.fillStyle = P.dark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.text, 450, 235, 720);
  drawSparkle(ctx, 820, 70, 55, P.yellow, P.dark, 8);
  const bubble = dieCutBoard(c, b.width, { thickness: 0.04, border: 0.06, board: P.pink, edge: '#d9558f' });
  bubble.position.set(b.x, b.y, b.z);
  bubble.rotation.y = -0.25;
  g.add(bubble);
}

// ─── Floor graphics ─────────────────────────────────────────────────────────
function floorGraphics(g) {
  const cfg = DR.floor;
  const PIT = X.pit;
  const pitTex = canvasTexture(PIT.width * 100, PIT.depth * 100, (ctx, W, H) => {
    const sq = 50; // 0.5 m squares
    for (let y = 0; y < H; y += sq) for (let x = 0; x < W; x += sq) {
      ctx.fillStyle = ((x + y) / sq) % 2 ? '#ffffff' : '#ffc2df';
      ctx.fillRect(x, y, sq, sq);
    }
  });
  const pit = floorGraphic(PIT.width, PIT.depth, pitTex, 0.028);
  pit.position.z = PIT.depth / 2;
  g.add(pit);

  const ppm = 90;
  const tex = canvasTexture(cfg.width * ppm, cfg.depth * ppm, (ctx, W, H) => {
    const cy = H * 0.62;
    ctx.beginPath();
    ctx.arc(W * 0.14, cy, H * 0.26, 0, Math.PI * 2);
    ctx.fillStyle = P.yellow;
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = P.dark;
    ctx.stroke();
    display(ctx, H * 0.24);
    ctx.fillStyle = P.dark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.badge, W * 0.14, cy + 4);
    pill(ctx, W * 0.58, cy, cfg.title, H * 0.13, P.pink, 10);
    // Chevrons pointing at the stage
    ctx.fillStyle = P.white;
    ctx.lineWidth = 8;
    for (let i = 0; i < 5; i++) {
      const x = W * (0.32 + i * 0.13), y = H * 0.2, s = H * 0.1;
      ctx.beginPath();
      ctx.moveTo(x - s, y + s * 0.7);
      ctx.lineTo(x, y - s * 0.3);
      ctx.lineTo(x + s, y + s * 0.7);
      ctx.lineTo(x + s, y + s * 1.2);
      ctx.lineTo(x, y + s * 0.2);
      ctx.lineTo(x - s, y + s * 1.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  });
  const badge = floorGraphic(cfg.width, cfg.depth, tex, 0.045);
  badge.position.x = L.cx - 0.5;
  badge.position.z = X.pocket.backZ + 2.6;
  g.add(badge);
}

// ─── Night neon ─────────────────────────────────────────────────────────────
// HDR-bright strips (above the bloom threshold), only visible at night.
function neon(g, glows) {
  const strip = (w, h, x, y, z, colour, k = 3) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.04),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(colour).multiplyScalar(k), toneMapped: false }));
    m.position.set(x, y, z);
    m.visible = false;
    g.add(m);
    glows.push(m);
  };
  const t = 0.06;
  if (S.arch.enabled) {
    const A = S.arch, xo = L.archHalfWidth;
    const zPillar = L.trussFrontZ + A.pillarDepth / 2 + 0.03;
    const zHeader = L.trussFrontZ + A.headerDepth / 2 + 0.03;
    strip(2 * xo, t, 0, S.truss.top - t / 2, zHeader, P.pink);                                   // header top
    strip(2 * xo - 2 * A.pillarWidth, t, 0, L.archHeaderBottom + t / 2, zHeader, P.pink);        // header underside
    for (const side of [-1, 1]) {
      strip(t, L.archHeaderBottom, side * (xo - t / 2), L.archHeaderBottom / 2, zPillar, P.cyan);                 // pillar outer
      strip(t, L.archHeaderBottom, side * (xo - A.pillarWidth + t / 2), L.archHeaderBottom / 2, zPillar, P.cyan); // pillar inner
    }
  }
  strip(S.deck.width, 0.05, 0, S.deck.height - 0.025, 0.03, P.yellow, 2.5); // deck front edge
}

export function buildDressing() {
  const group = new THREE.Group();
  group.name = 'dressing';
  const glows = [];
  if (DR.barricade.enabled) barricadeBanner(group);
  if (DR.paWraps.enabled) paWraps(group);
  if (DR.sparkles.enabled) sparkles(group);
  if (DR.floor.enabled) floorGraphics(group);
  if (DR.neon.enabled) neon(group, glows);
  return { group, glows };
}
