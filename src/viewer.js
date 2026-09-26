// The 3D viewer shell shared by every build (main stage, ballroom, booths…):
// renderer, orbit controls, camera presets, day/night, toggles, labels, export,
// shared artwork + admin mode. A build supplies the scene content (see builds/).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { render as R, palette as P } from '../stage.config.js';
import { updateLineResolution, FONT, FONT_DISPLAY, FONT_BODY } from './sticker.js';
import { slotStatus, slots, slotEvents } from './slots.js';
import { buildLighting } from './lighting.js';
import { createCameraRig } from './cameras.js';
import { buildArtworkPanel } from './artwork.js';
import { setupLogoMove, attachLogoLabel } from './logoMove.js';
import { setupAdminEntry } from './admin.js';
import { fetchState, adminStatus, setBuild } from './shared.js';

// Title card, toggles and preset bar for this build
function renderChrome(build, presets) {
  const m = build.meta;
  document.title = `OPF 2027 · ${m.title}`;
  document.getElementById('scene').setAttribute('aria-label', m.ariaLabel);
  document.querySelector('.title-card .eyebrow').textContent = m.eyebrow;
  document.querySelector('.title-card h1').textContent = m.title;
  document.querySelector('.title-card .sub').textContent = m.sub;

  const toggles = document.querySelector('.toggles');
  toggles.innerHTML = `
    <button class="chip chip-night" data-toggle="night" aria-pressed="false" type="button">
      <span class="ico" aria-hidden="true"></span><span class="lbl">Day</span>
    </button>
    <button class="chip" data-toggle="labels" aria-pressed="true" type="button">Labels</button>
    <button class="chip" data-toggle="people" aria-pressed="true" type="button">People</button>` +
    build.toggles.map((t) => `
    <button class="chip" data-toggle="${t.key}" aria-pressed="${t.on}" type="button">${t.label}</button>`).join('');

  document.querySelector('.presets').innerHTML = Object.entries(presets).map(([key, p], i) =>
    `<button data-preset="${key}" aria-pressed="${i === 0}" type="button"><kbd>${i + 1}</kbd>${p.label}</button>`).join('');
}

export async function startViewer(build) {
  setBuild(build.id);
  const presetsDef = build.presets();
  renderChrome(build, presetsDef);

  try {
    await Promise.race([
      Promise.all([document.fonts.load(`64px ${FONT}`), document.fonts.load(`expanded 900 32px ${FONT_DISPLAY}`),
        document.fonts.load(`600 32px ${FONT_BODY}`)]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* fall back to system fonts */ }

  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.3, 700);

  const built = build.create();
  const { labels } = built;
  const people = built.people ?? new THREE.Group();
  scene.add(...built.groups, people, labels.group);

  const lighting = buildLighting(scene, built.lighting);

  const labelRenderer = new CSS2DRenderer({ element: document.getElementById('labels') });

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.62; // allow looking up from eye level
  controls.minDistance = 1.5;
  controls.maxDistance = 600;
  controls.screenSpacePanning = true;

  const rig = createCameraRig(camera, controls, presetsDef);
  const presetKeys = Object.keys(presetsDef);
  rig.go(presetKeys[0], true);

  // Night bloom (only used at night; day renders straight for exact brand colours).
  // Threshold 1.0: only HDR glow rims, lenses and beam overlaps bloom — never the artwork.
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.8, 0.45, 1.08);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ─── State + toggles ───
  const state = { night: false, labels: true, people: true, caption: true };
  for (const t of build.toggles) state[t.key] = t.on;
  const applyVisibility = () => {
    const plan = rig.isPlan();
    labels.group.visible = state.labels;
    document.getElementById('labels').style.display = state.labels ? '' : 'none';
    people.visible = state.people;
    built.visibility?.(state, { plan });
    // In plan view floor lettering draws over the crowd so zones stay legible.
    for (const d of decals) {
      d.material.depthTest = !plan;
      d.renderOrder = plan ? 30 : 2;
    }
  };
  const decals = [];
  for (const grp of built.decalRoots ?? built.groups) grp.traverse((o) => { if (o.userData.decal) decals.push(o); });

  const setToggle = (name, value) => {
    state[name] = value;
    const btn = document.querySelector(`[data-toggle="${name}"]`);
    if (btn) btn.setAttribute('aria-pressed', String(value));
    if (name === 'night') {
      lighting.setNight(value);
      document.body.classList.toggle('is-night', value);
      const lab = document.querySelector('[data-toggle="night"] .lbl');
      if (lab) lab.textContent = value ? 'Night' : 'Day';
    }
    applyVisibility();
  };
  document.querySelectorAll('[data-toggle]').forEach((b) => {
    b.addEventListener('click', () => setToggle(b.dataset.toggle, !state[b.dataset.toggle]));
  });

  const presetBtns = document.querySelectorAll('[data-preset]');
  const markPreset = (name) => presetBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preset === name)));
  const goPreset = (name, instant = false) => {
    rig.go(name, instant);
    markPreset(name);
    applyVisibility();
  };
  presetBtns.forEach((b) => b.addEventListener('click', () => goPreset(b.dataset.preset)));
  controls.addEventListener('start', () => {
    if (rig.current === 'custom') return;
    rig.release();
    markPreset(null);
    applyVisibility();
  });
  canvas.addEventListener('pointerdown', () => labels.closeAll());

  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key >= '1' && e.key <= '9' && presetKeys[+e.key - 1]) goPreset(presetKeys[+e.key - 1]);
    if (e.key.toLowerCase() === 'n') setToggle('night', !state.night);
    if (e.key.toLowerCase() === 'l') setToggle('labels', !state.labels);
  });

  document.getElementById('captionChk').addEventListener('change', (e) => { state.caption = e.target.checked; });

  // ─── Sizing ───
  function setRenderSize(w, h, pr) {
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    bloom.resolution.set(w * pr, h * pr);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    updateLineResolution(w * pr, h * pr);
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    setRenderSize(w, h, Math.min(window.devicePixelRatio, 2));
    labelRenderer.setSize(w, h);
  }
  window.addEventListener('resize', resize);
  resize();

  // Keep the camera above the floor, and scale the near plane with distance
  // so thin floor layers never z-fight in far views (plan / wide).
  function keepAboveFloor() {
    if (camera.position.y < 0.4) camera.position.y = 0.4;
    const near = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target) * 0.04, 0.2, 60);
    if (Math.abs(near - camera.near) > 1e-3) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }
  }

  function draw() {
    if (state.night) composer.render();
    else renderer.render(scene, camera);
  }

  // ─── Export render (1920×1080 PNG) ───
  function renderPNG(viewName) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const pr = renderer.getPixelRatio();
    setRenderSize(R.width, R.height, 1);
    keepAboveFloor();
    draw();
    const out = document.createElement('canvas');
    out.width = R.width;
    out.height = R.height;
    const ctx = out.getContext('2d');
    ctx.drawImage(renderer.domElement, 0, 0);
    if (state.caption) drawCaption(ctx, viewName);
    const url = out.toDataURL('image/png');
    setRenderSize(w, h, pr);
    draw();
    return url;
  }

  // Caption card in the deck's style: rounded white card, dark outline, hard dark shadow.
  function drawCaption(ctx, viewName) {
    const text = `OTAKU POP FES 2027 · ${build.meta.caption} · ${viewName.toUpperCase()}`;
    const sub = 'Concept only · all sizes TBC pending site survey' +
      (Object.values(slotStatus).includes('placeholder') ? ' · placeholder artwork' : '');
    const head = () => { ctx.font = `900 24px ${FONT_DISPLAY}`; ctx.fontStretch = 'expanded'; };
    const body = () => { ctx.font = `600 18px ${FONT_BODY}`; ctx.fontStretch = 'normal'; };
    head();
    const tw = ctx.measureText(text).width;
    body();
    const sw = ctx.measureText(sub).width;
    const bw = Math.max(tw, sw) + 52, bh = 88, x = 40, y = R.height - bh - 40, r = 18;
    ctx.fillStyle = P.dark;
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, bw, bh, r);
    ctx.fill();
    ctx.fillStyle = P.white;
    ctx.beginPath();
    ctx.roundRect(x, y, bw, bh, r);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = P.dark;
    ctx.stroke();
    ctx.fillStyle = P.dark;
    ctx.textBaseline = 'alphabetic';
    head();
    ctx.fillText(text, x + 26, y + 40);
    body();
    ctx.fillText(sub, x + 26, y + 68);
  }

  const viewLabel = () => rig.presets[rig.current]?.label || 'Custom view';
  const fileName = (label) => `OPF27_${build.meta.fileTag}_${label.replace(/[^\w]+/g, '-')}_${state.night ? 'night' : 'day'}_1920x1080.png`;

  document.getElementById('exportBtn').addEventListener('click', () => {
    const label = viewLabel();
    const a = document.createElement('a');
    a.href = renderPNG(label);
    a.download = fileName(label);
    a.click();
  });

  // ─── Loop ───
  const t0 = performance.now();
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    rig.update(now);
    controls.update();
    keepAboveFloor();
    lighting.update((now - t0) / 1000);
    draw();
    labelRenderer.render(scene, camera);
  });

  // Placeholder badge (kept in sync as artwork changes)
  const updateBadge = () => {
    document.getElementById('artBadge').hidden = !Object.values(slotStatus).includes('placeholder');
  };
  slotEvents.addEventListener('change', updateBadge);
  Promise.allSettled(built.slotsReady ?? []).then(() => setTimeout(updateBadge, 300));

  // ─── Shared artwork + logo pose (everyone), admin mode (editing) ───
  let shared = null;
  let logoMove = null;
  const setShared = (state) => { shared = state; };
  // A build's own slots follow its state; slots shown from other builds follow theirs.
  const ownKeys = build.artwork ? Object.keys(build.artwork) : Object.keys(slots).filter((k) => !(build.alsoShow ?? []).some((a) => a.keys.includes(k)));
  const applyKeys = (state, keys) => {
    for (const key of keys) slots[key]?.setShared(state.slots?.[key] ?? null);
  };
  const others = {};
  const applyOthers = async () => {
    for (const a of build.alsoShow ?? []) {
      const st = await fetchState(a.id);
      if (st && st.updatedAt !== others[a.id]) {
        others[a.id] = st.updatedAt;
        applyKeys(st, a.keys);
      }
    }
  };
  const applyShared = (state) => {
    if (!state) return;
    shared = state;
    applyKeys(state, ownKeys);
    if (built.logoSign && !logoMove?.isBusy()) {
      built.logoSign.pose = state.logoPose ?? null;
      built.logoSign.apply();
    }
  };
  if (built.logoSign) attachLogoLabel(built.logoSign, labels.byId.logo);
  (async () => {
    const [state, status] = await Promise.all([fetchState(), adminStatus()]);
    applyShared(state);
    applyOthers();
    setupAdminEntry(status);
    if (status.admin && build.artwork) {
      document.getElementById('artBtn').hidden = false;
      const artPanel = buildArtworkPanel({ canvas, camera, getState: () => shared, setState: setShared, info: build.artwork });
      if (built.logoSign) {
        logoMove = setupLogoMove({ canvas, camera, controls, sign: built.logoSign, row: artPanel.rows.logo.el, setState: setShared });
      }
    }
    // Pick up other people's changes while the page is open
    setInterval(async () => {
      if (document.hidden) return;
      const next = await fetchState();
      if (next && next.updatedAt !== shared?.updatedAt) applyShared(next);
      applyOthers();
    }, 30000);
  })();

  // Hook for batch renders (used to produce the deck PNGs)
  window.__opf = {
    build: build.id, goPreset, setToggle, state, slotStatus, crowd: people.userData.crowdCount, camera, controls, composer, renderer, scene, bloom,
    renderPNG: (name, night = false) => {
      setToggle('night', night);
      goPreset(name, true);
      lighting.update(night ? 2.0 : 0);
      controls.update();
      return renderPNG(rig.presets[name].label);
    },
    fileName,
  };

  document.body.classList.add('ready');
}
