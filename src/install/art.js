// Art slots + design options for the installations.
//
// Every graphic surface is a slot (admin "Edit artwork": upload, replace, reset).
// Uploaded art is composited onto the surface's canvas whole or cover-fitted —
// never stretched, recoloured or redrawn. Fit modes per slot:
//   contain  art shown whole, margins in the part's body colour
//   cover    art fills the surface, centred (the overflow is trimmed evenly)
//   fill     art shown whole on a chosen palette colour
// Design options (palette body colours, date / tag texts, fit modes) live in the
// build's shared state (`options`), the same way the artwork does.
import * as THREE from 'three';
import { customSlot } from '../slots.js';
import { saveState } from '../shared.js';
import { FONT, FONT_BODY, FONT_DISPLAY } from '../sticker.js';
import { PALETTE, PALETTE_NAMES, col } from './materials.js';

const FITS = { contain: 'Contain', cover: 'Cover', fill: 'Fill with colour' };

function fitFont(ctx, text, maxW, px, font, weight = '') {
  ctx.font = `${weight} ${px}px ${font}`;
  const w = ctx.measureText(text).width;
  if (w > maxW) ctx.font = `${weight} ${(px * maxW) / w}px ${font}`;
}

// Readable text colour on a palette colour
const inkOn = (c) => (['dark'].includes(c) || c === PALETTE.dark ? '#ffffff' : PALETTE.dark);

// Labelled placeholder: body colour, soft stripes, a white card with the label
export function drawLabel(ctx, w, h, { title, sub, note, color = 'white' }) {
  const c = col(color);
  ctx.fillStyle = c;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = inkOn(color);
  ctx.lineWidth = Math.max(w, h) / 60;
  for (let x = -h; x < w; x += Math.max(w, h) / 12) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke(); }
  ctx.restore();
  const s = Math.min(w, h);
  const bw = Math.min(w * 0.86, s * 1.9), bh = Math.min(h * 0.46, bw * 0.42);
  const bx = (w - bw) / 2, by = (h - bh) / 2;
  ctx.fillStyle = PALETTE.dark;
  ctx.beginPath(); ctx.roundRect(bx + s * 0.02, by + s * 0.02, bw, bh, bh * 0.12); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh * 0.12); ctx.fill();
  ctx.lineWidth = s * 0.01; ctx.strokeStyle = PALETTE.dark; ctx.stroke();
  ctx.fillStyle = PALETTE.dark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = title.split('\n');
  const lh = bh * (lines.length > 1 ? 0.2 : 0.26);
  lines.forEach((t, i) => {
    fitFont(ctx, t, bw * 0.88, lh, FONT);
    ctx.fillText(t, w / 2, by + bh * 0.36 + (i - (lines.length - 1) / 2) * lh * 1.15);
  });
  if (sub) { fitFont(ctx, sub, bw * 0.86, bh * 0.12, FONT_BODY, 800); ctx.fillStyle = '#5b585c'; ctx.fillText(sub, w / 2, by + bh * 0.78); }
  if (note) {
    ctx.fillStyle = inkOn(color);
    fitFont(ctx, note, w * 0.86, Math.min(h * 0.06, s * 0.07), FONT_BODY, 700);
    ctx.fillText(note, w / 2, Math.min(h - s * 0.06, by + bh + (h - by - bh) / 2));
  }
}

// Date / text face: big display type on the body colour
export function drawText(ctx, w, h, text, color = 'yellow', { ink } = {}) {
  ctx.fillStyle = col(color);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = ink ?? inkOn(color);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = String(text).split('\n');
  const lh = Math.min(h / (lines.length + 0.6), w * 0.3);
  lines.forEach((t, i) => {
    ctx.fontStretch = 'expanded';
    fitFont(ctx, t, w * 0.86, lh, FONT_DISPLAY, 900);
    ctx.fillText(t, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lh * 1.08);
  });
  ctx.fontStretch = 'normal';
}

export function createArt() {
  const slotDefs = {};          // key -> slot record
  const optionDefs = [];        // [{ key, type, label, def, group }]
  const listeners = [];
  let values = {};

  const get = (key) => values[key] ?? optionDefs.find((o) => o.key === key)?.def;

  function option(key, type, label, def, group = 'Design') {
    optionDefs.push({ key, type, label, def, group });
    return () => get(key);
  }

  // A slot drawn onto a canvas texture of aspect w:h.
  //   draw(ctx, W, H) paints the placeholder; body() → the part's colour name.
  function slot(key, { title, w, h, body = () => 'white', placeholder, assets = [], fit = 'contain', px = 1024, emissive = false }) {
    const W = w >= h ? px : Math.round((px * w) / h), H = w >= h ? Math.round((px * h) / w) : px;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const rec = { key, title, w, h, body, placeholder, image: null, tex, canvas, fitDef: fit, emissive };
    rec.redraw = () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      if (!rec.image) {
        placeholder(ctx, W, H);
      } else {
        const img = rec.image;
        const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
        const mode = get(`fit.${key}`) ?? fit;
        ctx.fillStyle = col(mode === 'fill' ? (get(`fill.${key}`) ?? 'white') : body());
        ctx.fillRect(0, 0, W, H);
        const k = mode === 'cover' ? Math.max(W / iw, H / ih) : Math.min(W / iw, H / ih);
        ctx.drawImage(img, (W - iw * k) / 2, (H - ih * k) / 2, iw * k, ih * k);
      }
      tex.needsUpdate = true;
    };
    const s = customSlot(key, {
      info: { width: w, height: h, aspect: w / h, spec: `${+w.toFixed(2)} × ${+h.toFixed(2)} m · image · contain / cover / fill` },
      assets,
      placeholderThumb: () => { const c = document.createElement('canvas'); c.width = W; c.height = H; placeholder(c.getContext('2d'), W, H); return c.toDataURL(); },
      apply(res) { rec.image = res ? res.tex.image : null; rec.redraw(); },
    });
    rec.ready = s.ready;
    slotDefs[key] = rec;
    return rec;
  }

  function applyState(state) {
    values = { ...(state?.options ?? {}) };
    for (const r of Object.values(slotDefs)) r.redraw();
    for (const fn of listeners) fn(get);
  }

  // Admin: design options at the top of the Artwork panel, fit controls per slot row
  function setupAdmin({ panel, getState, setState }) {
    const list = document.querySelector('#artPanel .art-list');
    const save = async (key, value, note) => {
      note.textContent = 'Publishing…';
      try {
        const st = await saveState({ options: { [key]: value } });
        setState(st);
        note.textContent = 'Published to everyone.';
      } catch (e) {
        note.textContent = `Not published: ${e.message}`;
      }
    };
    const swatches = (current, onPick) => Object.entries(PALETTE).map(([name, hex]) =>
      `<button type="button" class="opt-swatch${name === current ? ' is-on' : ''}" data-c="${name}" title="${PALETTE_NAMES[name]}" style="--c:${hex}"></button>`).join('');

    // Design options section
    const box = document.createElement('li');
    box.className = 'art-row opt-box';
    const groups = [...new Set(optionDefs.map((o) => o.group))];
    box.innerHTML = `<p class="art-title display">Design options</p>` + groups.map((g) => `<p class="opt-group">${g}</p>` +
      optionDefs.filter((o) => o.group === g).map((o) => o.type === 'color'
        ? `<div class="opt-line" data-k="${o.key}"><span class="opt-label">${o.label}</span><span class="opt-swatches">${swatches(get(o.key))}</span></div>`
        : `<div class="opt-line" data-k="${o.key}"><span class="opt-label">${o.label}</span><span class="opt-text"><input type="text" maxlength="60" value="${String(get(o.key)).replace(/\n/g, ' / ').replace(/"/g, '&quot;')}" /><button type="button" class="art-reset opt-save">Save</button></span></div>`).join('')).join('') +
      `<p class="art-status opt-note">Palette colours only. Text: use " / " for a line break.</p>`;
    list.prepend(box);
    const note = box.querySelector('.opt-note');
    box.querySelectorAll('.opt-line').forEach((line) => {
      const key = line.dataset.k;
      line.querySelectorAll('.opt-swatch').forEach((b) => b.addEventListener('click', () => {
        line.querySelectorAll('.opt-swatch').forEach((x) => x.classList.toggle('is-on', x === b));
        save(key, b.dataset.c, note);
      }));
      const input = line.querySelector('input');
      line.querySelector('.opt-save')?.addEventListener('click', () => save(key, input.value.trim().replace(/\s*\/\s*/g, '\n') || null, note));
    });

    // Fit controls on each slot row
    for (const [key, rec] of Object.entries(slotDefs)) {
      const row = panel.rows[key]?.el;
      if (!row) continue;
      const ui = document.createElement('div');
      ui.className = 'opt-fit';
      const mode = get(`fit.${key}`) ?? rec.fitDef;
      ui.innerHTML = `<label class="opt-label">Fit <select>${Object.entries(FITS).map(([v, t]) => `<option value="${v}"${v === mode ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <span class="opt-swatches"${mode === 'fill' ? '' : ' hidden'}>${swatches(get(`fill.${key}`) ?? 'white')}</span>
        <p class="art-status opt-fit-note"></p>`;
      row.querySelector('.art-body').append(ui);
      const sel = ui.querySelector('select'), sw = ui.querySelector('.opt-swatches'), n = ui.querySelector('.opt-fit-note');
      sel.addEventListener('change', () => { sw.hidden = sel.value !== 'fill'; save(`fit.${key}`, sel.value, n); });
      sw.querySelectorAll('.opt-swatch').forEach((b) => b.addEventListener('click', () => {
        sw.querySelectorAll('.opt-swatch').forEach((x) => x.classList.toggle('is-on', x === b));
        save(`fill.${key}`, b.dataset.c, n);
      }));
    }
  }

  return {
    slot, option, get, applyState, setupAdmin,
    onChange: (fn) => { listeners.push(fn); fn(get); },
    slots: slotDefs,
    // For the Artwork panel (build.artwork)
    artwork: () => Object.fromEntries(Object.values(slotDefs).map((r) => [r.key, { title: r.title, accept: 'image/*', kind: 'Image' }])),
    ready: () => Object.values(slotDefs).map((r) => r.ready),
  };
}
