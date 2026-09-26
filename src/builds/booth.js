// Shared build definition for the IP booths (Plan A / B / C): one booth on the
// Crystal Pavilion hall floor with a visitor aisle in front and dashed neighbour
// plots. Configs: config/booths.config.js.
import { buildLabels } from '../labels.js';
import { palette as P } from '../../stage.config.js';
import { hallContext, nightWash } from '../booths/common.js';

// Presets: Front, Guest eye level (1.6 m), Iso, Top-down plan. `span` = the
// plan frame height in metres; `h` = the booth's tallest element.
function boothPresets({ width, depth, h }) {
  const span = Math.max(width * 0.62, depth) + 3.2;
  const far = Math.max(width, depth);
  return () => ({
    front: { label: 'Front', pos: [0, h * 1.05 + 2.3, depth / 2 + far * 1.02 + 1.6], target: [0, h * 0.3, -depth * 0.08], fov: 40 },
    eye: { label: 'Guest eye level', pos: [width * 0.12, 1.6, depth / 2 + 4.2], target: [0, 1.4, -depth / 2], fov: 52 },
    iso: { label: 'Iso', pos: [far * 1.3 + 1.5, far * 1.05 + 2, depth / 2 + far * 1.3 + 1.5], target: [0, h * 0.25, 0], fov: 38 },
    plan: { label: 'Top-down plan', pos: [0.3, 300, 0.35 + 0.01], target: [0.3, 0, 0.35], fov: (2 * Math.atan(span / 2 / 300) * 180) / Math.PI, plan: true },
  });
}

export function boothBuild({ id, plan, cfg, artwork, meta, build, staff = true, extraToggles = [] }) {
  const { width, depth } = cfg.footprint;
  return {
    id,
    meta,
    presets: boothPresets({ width, depth, h: plan.height }),
    toggles: [
      { key: 'flow', label: 'Guest flow', on: true },
      ...(staff ? [{ key: 'staffTags', label: 'Staff tags', on: true }] : []),
      ...extraToggles,
    ],
    artwork,
    create() {
      const booth = build();
      const hall = hallContext({ width, depth, lead: P[cfg.lead] });
      const wash = nightWash(0, booth.height + 2.4, depth / 2 + 2.5);
      booth.people.add(booth.tags);
      return {
        groups: [hall, booth.group, booth.dims, wash],
        decalRoots: [hall, booth.group],
        people: booth.people,
        labels: buildLabels(booth.labels),
        lighting: {
          fixtures: [], glows: [],
          sun: { pos: [-6, 24, 10], target: [0, 0, 0], extent: 11, far: 60 },
          spill: null,
          onNight: (on) => { wash.intensity = on ? 7 : 0; },
        },
        slotsReady: booth.slotsReady,
        visibility(state) {
          booth.flow.visible = state.flow;
          booth.tags.visible = !!state.staffTags;
          booth.dims.visible = state.labels;
          if (booth.clearance) booth.clearance.visible = state.clearance;
        },
      };
    },
  };
}

