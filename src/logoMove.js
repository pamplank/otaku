// Move the OPF logo sign freely (admin mode): drag it in the 3D view (while
// "Move" is on), nudge it with the arrow keys, and set its size and forward/back
// position with sliders in the Artwork panel. Every change is published to the
// shared state, so everyone sees the logo where the admin put it.
import * as THREE from 'three';
import { stage as S } from '../stage.config.js';
import { saveState } from './shared.js';

const Z_RANGE = [-6, 10];     // forward/back slider, metres (+z = towards the audience)
const X_LIMIT = 15;
const SCALE_RANGE = [0.4, 2];

const f2 = (v) => v.toFixed(2);

// Keep the logo's hotspot label next to the sign wherever it goes (all viewers).
export function attachLogoLabel(sign, label) {
  if (!label) return;
  const d = sign.defaults();
  const offset = label.position.clone().sub(new THREE.Vector3(d.x, d.y, d.z));
  sign.listeners.push((p) => label.position.set(p.x, p.y, p.z).add(offset));
  sign.apply();
}

// setState records the shared state returned after a publish.
export function setupLogoMove({ canvas, camera, controls, sign, row, setState }) {
  const ui = document.createElement('div');
  ui.className = 'art-move';
  ui.innerHTML = `
    <div class="art-btns">
      <button class="art-move-btn" type="button" aria-pressed="false">Move</button>
      <button class="art-move-reset" type="button">Reset position</button>
    </div>
    <label class="art-slider"><span>Size</span>
      <input type="range" name="scale" min="${SCALE_RANGE[0]}" max="${SCALE_RANGE[1]}" step="0.05" /><output></output></label>
    <label class="art-slider"><span>Forward / back</span>
      <input type="range" name="z" min="${(sign.limits?.zRange ?? Z_RANGE)[0]}" max="${(sign.limits?.zRange ?? Z_RANGE)[1]}" step="0.05" /><output></output></label>
    <p class="art-pos"></p>
    <p class="art-pos-note">Changes are published to everyone.</p>`;
  row.append(ui);
  const moveBtn = ui.querySelector('.art-move-btn');
  const resetBtn = ui.querySelector('.art-move-reset');
  const scaleIn = ui.querySelector('[name=scale]');
  const zIn = ui.querySelector('[name=z]');
  const posOut = ui.querySelector('.art-pos');
  const note = ui.querySelector('.art-pos-note');

  const hint = document.createElement('div');
  hint.className = 'move-hint';
  hint.hidden = true;
  hint.innerHTML = '<span>Drag the logo to move it · arrow keys nudge</span><button type="button">Done</button>';
  document.getElementById('app').append(hint);
  hint.querySelector('button').addEventListener('click', () => setMoving(false));

  const current = () => ({ ...sign.defaults(), ...sign.pose });
  // Limits: the main stage's by default; other stages pass their own (in the sign's local coordinates).
  const lim = { ceiling: S.ceiling.height, xLimit: X_LIMIT, zRange: Z_RANGE, ...sign.limits };

  // Keep the sign above the floor and under the ceiling, within the hall.
  function clamp(p) {
    const half = (sign.height * p.scale) / 2;
    const yMax = lim.ceiling - 0.15 - half;
    p.x = THREE.MathUtils.clamp(p.x, -lim.xLimit, lim.xLimit);
    p.y = THREE.MathUtils.clamp(p.y, half, Math.max(half, yMax));
    p.z = THREE.MathUtils.clamp(p.z, lim.zRange[0], lim.zRange[1]);
    p.scale = THREE.MathUtils.clamp(p.scale, SCALE_RANGE[0], SCALE_RANGE[1]);
    return p;
  }

  // ─── Publishing (debounced, so sliders and key repeats send one save) ───
  let timer = null, saving = false;
  function publish(delay = 400) {
    clearTimeout(timer);
    note.textContent = 'Publishing…';
    timer = setTimeout(async () => {
      timer = null;
      saving = true;
      try {
        setState(await saveState({ logoPose: sign.pose }));
        note.textContent = 'Published to everyone.';
      } catch (e) {
        note.textContent = `Not published: ${e.message}`;
      } finally {
        saving = false;
      }
    }, delay);
  }

  function setPose(pose, persist = true) {
    sign.pose = pose ? clamp({ ...current(), ...pose }) : null;
    sign.apply();
    if (persist) publish();
  }

  sign.listeners.push((p) => {
    scaleIn.value = p.scale;
    zIn.value = p.z;
    scaleIn.nextElementSibling.textContent = `${Math.round(p.scale * 100)}%`;
    zIn.nextElementSibling.textContent = `${f2(p.z)} m`;
    posOut.textContent = `x ${f2(p.x)} · y ${f2(p.y)} · z ${f2(p.z)} m · size ${Math.round(p.scale * 100)}%`;
    resetBtn.hidden = !sign.pose;
  });
  sign.apply();

  scaleIn.addEventListener('input', () => setPose({ scale: +scaleIn.value }));
  zIn.addEventListener('input', () => setPose({ z: +zIn.value }));
  resetBtn.addEventListener('click', () => setPose(null));

  // ─── Move mode ───
  let moving = false;
  function setMoving(on) {
    moving = on;
    moveBtn.setAttribute('aria-pressed', String(on));
    moveBtn.textContent = on ? 'Done moving' : 'Move';
    hint.hidden = !on;
    canvas.style.cursor = '';
  }
  moveBtn.addEventListener('click', () => setMoving(!moving));

  const toLocal = (v) => (sign.group.parent ? sign.group.parent.worldToLocal(v) : v);
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hitPoint = new THREE.Vector3();
  const grab = new THREE.Vector3();
  function aim(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  }
  const overSign = (e) => {
    aim(e);
    return ray.intersectObject(sign.group, true).length > 0;
  };

  let dragId = null;
  // Capture phase on the app root runs before OrbitControls' own listener on the
  // canvas, so a drag that starts on the sign never orbits the camera.
  document.getElementById('app').addEventListener('pointerdown', (e) => {
    if (!moving || e.target !== canvas || e.button !== 0 || !overSign(e)) return;
    e.stopPropagation();
    const p = current();
    const parent = sign.group.parent;
    const wp = parent ? parent.localToWorld(new THREE.Vector3(p.x, p.y, p.z)) : new THREE.Vector3(p.x, p.y, p.z);
    plane.constant = -wp.z; // the sign's own vertical plane
    if (!ray.ray.intersectPlane(plane, hitPoint)) return;
    toLocal(hitPoint);
    grab.set(p.x, p.y, p.z).sub(hitPoint);
    dragId = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    controls.enabled = false;
    canvas.style.cursor = 'grabbing';
  }, true);

  canvas.addEventListener('pointermove', (e) => {
    if (!moving) return;
    if (dragId === null) {
      canvas.style.cursor = overSign(e) ? 'grab' : '';
      return;
    }
    if (e.pointerId !== dragId) return;
    aim(e);
    if (!ray.ray.intersectPlane(plane, hitPoint)) return;
    toLocal(hitPoint).add(grab);
    setPose({ x: hitPoint.x, y: hitPoint.y }, false);
  });

  const endDrag = (e) => {
    if (dragId === null || e.pointerId !== dragId) return;
    dragId = null;
    controls.enabled = true;
    canvas.style.cursor = moving ? 'grab' : '';
    publish(0);
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  window.addEventListener('keydown', (e) => {
    if (!moving || e.target.closest('input, textarea')) return;
    const step = e.shiftKey ? 0.25 : 0.05;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (e.key === 'Escape') return setMoving(false);
    if (!d) return;
    e.preventDefault();
    const p = current();
    setPose({ x: p.x + d[0], y: p.y + d[1] });
  });

  // Shared-state refreshes leave the logo alone while it's being moved or saved.
  return { isBusy: () => dragId !== null || timer !== null || saving };
}
