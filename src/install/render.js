// Rendered look for the installations: physically based materials lit by a
// self-hosted HDRI (public/assets/env), ACES tone mapping, soft shadows, ambient
// occlusion (GTAO) and, at night, subtle bloom on the lightboxes. Phones get
// smaller shadow maps and no AO. Used only by the installation builds.
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const BASE = import.meta.env.BASE_URL;
export const MOBILE = typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 820);

function gradient(top, bottom) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// opts: { overlay (Group drawn on top after post: dimension cards), key: { pos, target, extent }, context (Group hidden for transparent
// export), shadowCatcher: size, glows: [materials whose emissive rises at night],
// nightLights: [lights on only at night], exposure }
export function setupRendered({ renderer, scene, camera }, opts = {}) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = opts.exposure ?? 0.74;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = MOBILE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;

  // ─── Environment (HDRI → PMREM) ───
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = { day: null, night: null };
  const ready = Promise.all(['day', 'night'].map((k) => new Promise((resolve) => {
    new HDRLoader().load(`${BASE}assets/env/lobby-${k}.hdr`, (tex) => {
      env[k] = pmrem.fromEquirectangular(tex).texture;
      tex.dispose();
      resolve();
    }, undefined, () => resolve());
  }))).then(() => applyNight(night));

  const bg = { day: gradient('#eef0f0', '#d9d4cc'), night: gradient('#15121a', '#2a2219') };

  // ─── Lights ───
  const hemi = new THREE.HemisphereLight('#f4f7ff', '#b9ab95', 0.6);
  const key = new THREE.DirectionalLight('#ffffff', 2.2);
  const K = opts.key ?? {};
  key.position.set(...(K.pos ?? [6, 12, 8]));
  key.target.position.set(...(K.target ?? [0, 1, 0]));
  key.castShadow = true;
  const ext = K.extent ?? 8;
  Object.assign(key.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 0.5, far: 60 });
  key.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
  key.shadow.radius = 5;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.02;
  scene.add(hemi, key, key.target);

  // Transparent export: a floor that only receives shadows
  let catcher = null;
  if (opts.shadowCatcher) {
    catcher = new THREE.Mesh(new THREE.PlaneGeometry(opts.shadowCatcher, opts.shadowCatcher), new THREE.ShadowMaterial({ opacity: 0.28 }));
    catcher.rotation.x = -Math.PI / 2;
    catcher.position.y = 0.002;
    catcher.receiveShadow = true;
    catcher.visible = false;
    scene.add(catcher);
  }

  // ─── Post: render → AO → bloom (night) → tone map / sRGB ───
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: MOBILE ? 0 : 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null;
  if (!MOBILE) {
    gtao = new GTAOPass(scene, camera, 1, 1);
    gtao.output = GTAOPass.OUTPUT.Default;
    gtao.blendIntensity = 0.85;
    gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 12 });
    composer.addPass(gtao);
  }
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.28, 0.45, 1.0);
  bloom.enabled = false;
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let night = false;
  function applyNight(on) {
    night = on;
    scene.environment = (on ? env.night : env.day) ?? env.day;
    scene.environmentIntensity = on ? 0.4 : 0.5;
    scene.background = on ? bg.night : bg.day;
    hemi.color.set(on ? '#ffd9b0' : '#f4f7ff');
    hemi.groundColor.set(on ? '#3a2a1f' : '#b9ab95');
    hemi.intensity = on ? 0.1 : 0.22;
    key.color.set(on ? '#ffc98f' : '#ffffff');
    key.intensity = on ? 0.3 : 2.1;
    renderer.toneMappingExposure = (opts.exposure ?? 0.74) * (on ? 1.1 : 1.0);
    bloom.enabled = on;
    for (const m of opts.glows ?? []) m.emissiveIntensity = on ? (m.userData.nightGlow ?? 2.4) : (m.userData.dayGlow ?? 1.0);
    for (const l of opts.nightLights ?? []) l.visible = on;
    opts.onNight?.(on);
  }
  applyNight(false);

  let exporting = null;
  // Annotations (dimension cards) are drawn after the post passes, so AO never sees them
  const overlay = new THREE.Scene();
  if (opts.overlay) overlay.add(opts.overlay);
  if (typeof window !== 'undefined') window.__opfRender = { composer, gtao, bloom, key, hemi };   // for batch renders / checks
  return {
    ready,
    lighting: { custom: true, setNight: applyNight, update: () => {} },
    setSize(w, h, pr) {
      if (MOBILE && pr > 1.5) {            // phones: cap the pixel ratio for a smooth frame rate
        pr = 1.5;
        renderer.setPixelRatio(pr);
        renderer.setSize(w, h, false);
      }
      composer.setPixelRatio(pr);
      composer.setSize(w, h);
      gtao?.setSize(w * pr, h * pr);
      bloom.resolution.set(w * pr, h * pr);
    },
    draw({ transparent = false } = {}) {
      if (transparent) {
        // straight render (no post) so the alpha channel survives
        renderer.setClearColor(0x000000, 0);
        renderer.render(scene, camera);
        return;
      }
      composer.render();
      if (overlay.children.length) {
        const ac = renderer.autoClear;
        renderer.autoClear = false;
        renderer.clearDepth();
        renderer.render(overlay, camera);
        renderer.autoClear = ac;
      }
    },
    exportBegin({ transparent }) {
      exporting = { background: scene.background };
      if (transparent) {
        scene.background = null;
        if (opts.context) opts.context.visible = false;
        if (catcher) catcher.visible = true;
      }
      opts.onExport?.(true);
    },
    exportEnd() {
      if (!exporting) return;
      scene.background = exporting.background;
      if (opts.context) opts.context.visible = true;
      if (catcher) catcher.visible = false;
      exporting = null;
      opts.onExport?.(false);
    },
    get night() { return night; },
  };
}
