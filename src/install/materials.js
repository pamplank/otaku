// Physically based materials for the installations (rendered look).
import * as THREE from 'three';
import { palette as P } from '../../stage.config.js';
import { MOBILE } from './render.js';

// Our palette (non-art parts use only these)
export const PALETTE = { dark: P.dark, yellow: P.yellow, pink: P.pink, cyan: P.cyan, white: P.white };
export const PALETTE_NAMES = { dark: 'Dark', yellow: 'Yellow', pink: 'Pink', cyan: 'Cyan', white: 'White' };
export const col = (name) => PALETTE[name] ?? name;

function canvasTex(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = 8;
  return t;
}

// Printed matte vinyl (art surfaces): slightly satin, no metal
export const vinyl = (map, extra = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.62, metalness: 0, ...extra });

// Painted body parts in a palette colour (satin)
export const paint = (color, extra = {}) => new THREE.MeshStandardMaterial({ color: col(color), roughness: 0.45, metalness: 0, ...extra });

// Glossy acrylic (tags, lightbox faces, capsules)
export const acrylic = (color, extra = {}) => new THREE.MeshPhysicalMaterial({
  color: col(color), roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, ...extra,
});

// Brushed metal (frames, posts, fixings): fine streaks in the roughness map
let brushed = null;
function brushedMap() {
  return (brushed ??= canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      const v = 110 + Math.floor(Math.random() * 60);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, w, 1);
    }
  }, { repeat: [1, 4], srgb: false }));
}
export const metal = (extra = {}) => new THREE.MeshStandardMaterial({
  color: '#c9ccd0', metalness: 1, roughness: 0.38, roughnessMap: brushedMap(), ...extra,
});
export const darkMetal = (extra = {}) => new THREE.MeshStandardMaterial({ color: '#3a393d', metalness: 0.85, roughness: 0.42, ...extra });
export const rubber = () => new THREE.MeshStandardMaterial({ color: '#1d1c1f', roughness: 0.9, metalness: 0 });

// Clear dome: real transmission on desktop, a cheaper see-through on phones
export function clearPlastic() {
  if (MOBILE) return new THREE.MeshPhysicalMaterial({ color: '#eaf6fb', roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false, clearcoat: 1 });
  return new THREE.MeshPhysicalMaterial({
    color: '#ffffff', roughness: 0.04, metalness: 0, transmission: 1, thickness: 0.04, ior: 1.49,
    clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1, envMapIntensity: 1.2,
  });
}

// Lightbox face: emissive (glows at night, lit-looking by day)
export const lightbox = (map) => new THREE.MeshStandardMaterial({
  color: '#ffffff', map, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.9, roughness: 0.3,
  userData: { dayGlow: 0.9, nightGlow: 0.7 },
});

// ─── Floors ───
// Polished stone tiles (lobby / concourse)
export function stoneFloor(size, tile = 1.2, { tone = '#e7e2d9', grout = '#cfc8bc', rough = 0.22 } = {}) {
  const n = 8;
  const map = canvasTex(1024, 1024, (ctx, w, h) => {
    const s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const l = 90 + Math.random() * 10;
      ctx.fillStyle = tone;
      ctx.globalAlpha = 1;
      ctx.fillRect(i * s, j * s, s, s);
      ctx.fillStyle = `hsl(35, 12%, ${l}%)`;
      ctx.globalAlpha = 0.18;
      ctx.fillRect(i * s, j * s, s, s);
      // soft veins
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = '#8f877a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i * s + Math.random() * s, j * s);
      ctx.bezierCurveTo(i * s + Math.random() * s, j * s + s * 0.3, i * s + Math.random() * s, j * s + s * 0.7, i * s + Math.random() * s, j * s + s);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = grout;
    ctx.lineWidth = 3;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(w, i * s); ctx.stroke();
    }
  }, { repeat: [size / (tile * n), size / (tile * n)] });
  return new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: 0 });
}

export const asphalt = () => new THREE.MeshStandardMaterial({ color: '#4a4a4e', roughness: 0.95 });
export const wallMat = (color = '#efeae2') => new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
export const glassPane = () => new THREE.MeshPhysicalMaterial({
  color: '#cfe6ee', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.28, depthWrite: false, clearcoat: 1,
});
export const glowPanel = (color = '#fff4e0', dayGlow = 0.9, nightGlow = 1.6) => new THREE.MeshStandardMaterial({
  color: '#ffffff', emissive: color, emissiveIntensity: dayGlow, roughness: 0.5, userData: { dayGlow, nightGlow },
});
