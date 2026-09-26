// Camera presets. Positions derive from the config so they follow dimension changes.
import * as THREE from 'three';
import { stage as S, site as X } from '../stage.config.js';
import { L } from './layout.js';

export function presets() {
  const midStage = S.frame.top / 2 + 0.6;
  const pk = X.pocket;
  return {
    foh: {
      label: 'Front of house',
      // Kept below ~4 m so the front-truss fixtures never cover the OPF logo.
      pos: [L.cx - 0.9, 3.9, pk.frontCornerZ + 3.8], target: [0, midStage - 0.2, -3], fov: 40,
    },
    crowd: {
      label: 'Crowd eye level',
      pos: [-0.6, 1.6, pk.backZ + 8], target: [0, 3.3, -5], fov: 50,
    },
    side: {
      label: 'Side',
      pos: [21, 5.2, 5.5], target: [0, 2.8, -2.6], fov: 40,
    },
    plan: {
      // High + narrow lens so the plan reads almost orthographic.
      label: 'Top-down plan',
      pos: [L.cx, 420, 7.2 + 0.01], target: [L.cx, 0, 7.2], fov: 6.6, plan: true,
    },
    wide: {
      label: 'Wide hall',
      pos: [L.cx - 34, 23, 44], target: [L.cx + 1, 1.5, 4], fov: 42,
    },
  };
}

export function createCameraRig(camera, controls, P = presets()) {
  let tween = null;
  let current = Object.keys(P)[0];
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  function go(name, instant = false) {
    const p = P[name];
    if (!p) return;
    current = name;
    const to = { pos: new THREE.Vector3(...p.pos), target: new THREE.Vector3(...p.target), fov: p.fov };
    if (instant) {
      camera.position.copy(to.pos);
      controls.target.copy(to.target);
      camera.fov = to.fov;
      camera.updateProjectionMatrix();
      // Drop any leftover orbit momentum so the preset lands exactly.
      const damping = controls.enableDamping;
      controls.enableDamping = false;
      controls.update();
      controls.enableDamping = damping;
      tween = null;
      return;
    }
    tween = {
      t0: performance.now(), dur: 900, to,
      from: { pos: camera.position.clone(), target: controls.target.clone(), fov: camera.fov },
    };
  }

  function update(now) {
    if (!tween) return;
    const k = ease(Math.min(1, (now - tween.t0) / tween.dur));
    camera.position.lerpVectors(tween.from.pos, tween.to.pos, k);
    controls.target.lerpVectors(tween.from.target, tween.to.target, k);
    camera.fov = tween.from.fov + (tween.to.fov - tween.from.fov) * k;
    camera.updateProjectionMatrix();
    if (k >= 1) tween = null;
  }

  // User grabbed the controls: stop any tween and leave preset mode.
  function release() {
    tween = null;
    current = 'custom';
  }

  return { go, update, release, presets: P, get current() { return current; }, isPlan: () => !!P[current]?.plan };
}
