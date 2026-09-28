// Chunky rounded numerals for the 2027 date letters, drawn as shapes in a
// 1.0 × 1.4 unit box (x right, y up), scaled to size. Only the glyphs we need.
import * as THREE from 'three';

function roundRect(shape, x, y, w, h, r) {
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
}

const GLYPHS = {
  0: () => {
    const s = new THREE.Shape();
    roundRect(s, 0, 0, 1.0, 1.4, 0.46);
    // hole, drawn the other way round
    const hole = new THREE.Path();
    const x = 0.31, y = 0.3, w = 0.38, h = 0.8, r = 0.19;
    hole.moveTo(x + r, y);
    hole.quadraticCurveTo(x, y, x, y + r);
    hole.lineTo(x, y + h - r);
    hole.quadraticCurveTo(x, y + h, x + r, y + h);
    hole.lineTo(x + w - r, y + h);
    hole.quadraticCurveTo(x + w, y + h, x + w, y + h - r);
    hole.lineTo(x + w, y + r);
    hole.quadraticCurveTo(x + w, y, x + w - r, y);
    hole.lineTo(x + r, y);
    s.holes.push(hole);
    return s;
  },
  2: () => {
    const s = new THREE.Shape();
    s.moveTo(0.04, 0);
    s.lineTo(0.98, 0);
    s.lineTo(0.98, 0.29);
    s.lineTo(0.5, 0.29);
    s.lineTo(0.84, 0.66);
    s.quadraticCurveTo(1.0, 0.84, 0.99, 1.02);
    s.quadraticCurveTo(0.97, 1.4, 0.5, 1.4);
    s.quadraticCurveTo(0.04, 1.4, 0.02, 0.98);
    s.lineTo(0.31, 0.96);
    s.quadraticCurveTo(0.33, 1.12, 0.5, 1.12);
    s.quadraticCurveTo(0.68, 1.12, 0.69, 1.0);
    s.quadraticCurveTo(0.7, 0.9, 0.6, 0.79);
    s.lineTo(0.04, 0.2);
    s.lineTo(0.04, 0);
    return s;
  },
  7: () => {
    const s = new THREE.Shape();
    s.moveTo(0.02, 1.4);
    s.lineTo(0.98, 1.4);
    s.lineTo(0.98, 1.14);
    s.lineTo(0.56, 0);
    s.lineTo(0.22, 0);
    s.lineTo(0.63, 1.1);
    s.lineTo(0.02, 1.1);
    s.lineTo(0.02, 1.4);
    return s;
  },
};

// Shape for a digit, `height` metres tall, left edge at x = 0
export function digitShape(ch, height) {
  const k = height / 1.4;
  const src = GLYPHS[ch]();
  const scale = (pts) => pts.map((p) => new THREE.Vector2(p.x * k, p.y * k));
  const out = new THREE.Shape(scale(src.getPoints(24)));
  for (const h of src.holes) out.holes.push(new THREE.Path(scale(h.getPoints(24))));
  return out;
}
