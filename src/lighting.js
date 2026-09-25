// Day / night. At night the LED + lightbox glow and the truss fixtures throw coloured beams.
import * as THREE from 'three';
import { stage as S, palette as P } from '../stage.config.js';
import { canvasTexture } from './sticker.js';

function gradient(top, bottom) {
  const t = canvasTexture(4, 256, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bottom);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
  });
  return t;
}

const beamVert = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }`;
const beamFrag = /* glsl */ `
  uniform vec3 color; uniform float opacity;
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main() {
    float d = abs(dot(vN, vV)) / max(length(vN) * length(vV), 1e-4);
    float edge = pow(clamp(d, 0.0, 1.0), 1.4);
    float a = pow(clamp(vUv.y, 0.0, 1.0), 1.25) * edge * opacity;
    // Guard against NaN/Inf, which bloom would smear across the whole frame.
    a = (a > 0.0 && a < 4.0) ? a : 0.0;
    gl_FragColor = vec4(color * a, a);
  }`;

export function buildLighting(scene, { fixtures, lightboxMat, glassMats, shellLines, glows = [] }) {
  const bg = { day: gradient('#cfe8ee', '#f4f0e8'), night: gradient('#0d0b10', '#221d29') };

  const amb = new THREE.AmbientLight('#ffffff', 1.6);
  const sun = new THREE.DirectionalLight('#ffffff', 1.55);
  sun.position.set(-14, 26, 24);
  sun.target.position.set(0, 0, 2);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 100 });
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(amb, sun, sun.target);

  // LED spill onto deck/performers at night
  const spill = new THREE.PointLight('#ffc0e0', 0, 12, 1.6);
  spill.position.set(0, 3, -3.2);
  scene.add(spill);

  // Beams + spots per fixture
  const beamTan = 0.11;
  const beamGeo = new THREE.CylinderGeometry(0.004, beamTan, 1, 32, 1, true);
  beamGeo.translate(0, -0.5, 0);
  beamGeo.rotateX(-Math.PI / 2);
  const rigs = fixtures.map((f, i) => {
    const color = new THREE.Color(f.color);
    const beam = new THREE.Mesh(beamGeo, new THREE.ShaderMaterial({
      uniforms: { color: { value: color }, opacity: { value: 0.55 } },
      vertexShader: beamVert, fragmentShader: beamFrag,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }));
    beam.position.z = 0.16;
    beam.visible = false;
    beam.renderOrder = 10;
    f.head.add(beam);
    const spot = new THREE.SpotLight(color, 0, 30, 0.2, 0.45, 1.4);
    const tgt = new THREE.Object3D();
    scene.add(spot, tgt);
    spot.target = tgt;
    return { ...f, beam, spot, tgt, phase: i * 1.7, live: f.target.clone() };
  });

  let night = false;
  const wp = new THREE.Vector3();

  function aim(t) {
    for (const r of rigs) {
      r.live.copy(r.target);
      if (night) {
        r.live.x += Math.sin(t * 0.5 + r.phase) * 2.2;
        r.live.z += Math.cos(t * 0.37 + r.phase) * 1.6;
      }
      r.head.lookAt(r.live);
      r.head.getWorldPosition(wp);
      const dist = wp.distanceTo(r.live);
      r.beam.scale.setScalar(dist * 1.05);
      r.spot.position.copy(wp);
      r.tgt.position.copy(r.live);
    }
  }

  function setNight(on) {
    night = on;
    scene.background = on ? bg.night : bg.day;
    amb.color.set(on ? '#7a6f9a' : '#ffffff');
    amb.intensity = on ? 0.55 : 1.6;
    sun.color.set(on ? '#8aa0ff' : '#ffffff');
    sun.intensity = on ? 0.25 : 1.55;
    spill.intensity = on ? 9 : 0;
    for (const r of rigs) {
      r.beam.visible = on;
      r.spot.intensity = on ? 55 : 0;
      r.lensMat.color.set(on ? r.color : '#555555');
      if (on) r.lensMat.color.multiplyScalar(1.8);
    }
    for (const gl of glows) gl.visible = on;
    lightboxMat.color.set(on ? '#ffffff' : '#f7f7f7');
    glassMats[0].opacity = on ? 0.07 : 0.16;
    glassMats[1].opacity = on ? 0.14 : 0.3;
    glassMats[2].opacity = on ? 0.05 : 0.1;
    for (const m of glassMats) m.color.set(on ? '#3b4a66' : '#bfe8ef');
    for (const m of shellLines) m.color.set(on ? '#4a5570' : '#8fa9b2');
    aim(0);
  }

  setNight(false);
  return { setNight, update: (t) => aim(t), get night() { return night; } };
}
