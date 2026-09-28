// Shared build definition for the INSTALLATIONS group: rendered (PBR) look,
// per-slot artwork with fit modes, design options in admin, dimension labels,
// and export at 1920×1080 / 3840×2160 with an optional transparent background.
import * as THREE from 'three';
import { buildLabels } from '../labels.js';
import { createArt } from './art.js';
import { setupRendered } from './render.js';

// def: { id, meta, presets, toggles, create({ art, renderer, scene, camera }) →
//   { install, setting: { group, glows, ceiling }, people, labels, dims,
//     key, glows, nightLights, shadowCatcher, exposure, visibility(state) } }
export function installationBuild(def) {
  const art = createArt();
  return {
    id: def.id,
    meta: def.meta,
    presets: def.presets,
    exportOptions: true,
    toggles: [{ key: 'dims', label: 'Dimensions', on: true }, { key: 'ceiling', label: 'Ceiling', on: true }, ...(def.toggles ?? [])],
    get artwork() { return art.artwork(); },
    create(ctx) {
      const s = def.create({ art, ...ctx });
      const dims = s.dims ?? new THREE.Group();
      // Dimension cards are information, not scene: keep their colours exact
      dims.traverse((o) => { if (o.material) o.material.toneMapped = false; });
      const r = setupRendered(ctx, {
        overlay: dims, key: s.key, context: s.setting.group, shadowCatcher: s.shadowCatcher ?? 20, exposure: s.exposure,
        glows: [...(s.setting.glows ?? []), ...(s.glows ?? [])], nightLights: s.nightLights,
      });
      let dimsOn = true;
      return {
        groups: [s.install, s.setting.group],
        decalRoots: [],
        people: s.people,
        labels: buildLabels(s.labels),
        lighting: r.lighting,
        slotsReady: [...art.ready(), r.ready],
        draw: r.draw,
        setSize: r.setSize,
        // Dimension cards (their own "Dimensions" layer) show on an export only
        // with the caption; a clean export has neither
        exportBegin(o) { r.exportBegin(o); dimsOn = dims.visible; dims.visible = dimsOn && o.caption && !o.clean; },
        exportEnd() { r.exportEnd(); dims.visible = dimsOn; },
        applyState: art.applyState,
        setupAdmin: art.setupAdmin,
        visibility(state, { plan }) {
          if (s.setting.ceiling) s.setting.ceiling.visible = state.ceiling && !plan;
          dims.visible = state.dims;
          s.visibility?.(state, { plan });
        },
      };
    },
  };
}
