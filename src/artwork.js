// Artwork panel (admin mode): publish designs for the LED / wings / logo so
// everyone sees them. Files can be picked, dropped on a row, or dropped (or
// double-clicked) straight onto the slot in the 3D view.
import * as THREE from 'three';
import { slots } from './slots.js';
import { uploadFile, saveState } from './shared.js';

const INFO = {
  led:       { title: 'LED wall',   accept: 'image/*,video/*', kind: 'Image or video' },
  wingLeft:  { title: 'Left wing',  accept: 'image/*',         kind: 'Image' },
  wingRight: { title: 'Right wing', accept: 'image/*',         kind: 'Image' },
  logo:      { title: 'OPF logo sign', accept: 'image/*',      kind: 'Image' },
};

const m = (v) => +v.toFixed(2);
// 5:3 rather than 1.67:1 when a small whole-number ratio fits.
function ratio(a) {
  for (let d = 1; d <= 10; d++) {
    const n = Math.round(a * d);
    if (n > 0 && n <= 20 && Math.abs(n / d - a) < 0.002) return `${n}:${d}`;
  }
  return a >= 1 ? `${m(a)}:1` : `1:${m(1 / a)}`;
}

// getState / setState: the app's copy of the shared state (to revert a failed
// publish, and to record the new state after one succeeds).
export function buildArtworkPanel({ canvas, camera, getState, setState }) {
  const panel = document.getElementById('artPanel');
  const list = panel.querySelector('.art-list');
  const toggleBtn = document.getElementById('artBtn');
  const rows = {};

  const setOpen = (open) => {
    panel.hidden = !open;
    toggleBtn.setAttribute('aria-expanded', String(open));
  };
  toggleBtn.addEventListener('click', () => setOpen(panel.hidden));
  panel.querySelector('.art-close').addEventListener('click', () => setOpen(false));

  async function useFile(key, file) {
    const row = rows[key];
    row.error.hidden = true;
    const info = INFO[key];
    if (!file.type.startsWith('image/') && !(info.accept.includes('video') && file.type.startsWith('video/'))) {
      return fail(row, `${info.kind} files only`);
    }
    const slot = slots[key];
    row.el.classList.add('is-busy');
    slot.pending = true; // shared-state refreshes leave this slot alone meanwhile
    try {
      await slot.showFile(file); // preview straight away
    } catch {
      slot.pending = false;
      row.el.classList.remove('is-busy');
      return fail(row, 'Couldn’t read that file. Try PNG, JPG or MP4.');
    }
    row.status.textContent = 'Publishing…';
    try {
      const entry = await uploadFile(key, file);
      const state = await saveState({ slots: { [key]: entry } });
      setState(state);
      slot.published(state.slots[key]?.url ?? null);
    } catch (e) {
      fail(row, `Not published: ${e.message}`);
      slot.pending = false;
      slot.published(undefined); // forget the local preview…
      slot.setShared(getState()?.slots?.[key] ?? null); // …and show what everyone sees
    } finally {
      slot.pending = false;
      row.el.classList.remove('is-busy');
      render(key);
    }
  }

  async function reset(key) {
    const row = rows[key];
    row.error.hidden = true;
    row.el.classList.add('is-busy');
    try {
      setState(await saveState({ slots: { [key]: null } }));
      await slots[key].setShared(null);
    } catch (e) {
      fail(row, `Not reset: ${e.message}`);
    } finally {
      row.el.classList.remove('is-busy');
    }
  }

  function fail(row, msg) {
    row.error.textContent = msg;
    row.error.hidden = false;
  }

  for (const key of Object.keys(INFO)) {
    const slot = slots[key];
    const info = INFO[key];
    const el = document.createElement('li');
    el.className = 'art-row';
    el.innerHTML = `
      <p class="art-title display">${info.title}</p>
      <div class="art-main">
        <div class="art-thumb"></div>
        <div class="art-body">
          <p class="art-spec">${slot.spec ?? `${m(slot.width)} × ${m(slot.height)} m · ${ratio(slot.aspect)} · ${info.kind.toLowerCase()}`}</p>
          <p class="art-status"></p>
          <p class="art-error" role="alert" hidden></p>
          <div class="art-btns">
            <label class="art-upload">Upload<input type="file" accept="${info.accept}" hidden /></label>
            <button class="art-reset" type="button">Reset</button>
          </div>
        </div>
      </div>`;
    list.append(el);

    const input = el.querySelector('input');
    input.addEventListener('change', () => {
      if (input.files[0]) useFile(key, input.files[0]);
      input.value = '';
    });
    el.querySelector('.art-reset').addEventListener('click', () => reset(key));

    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('is-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('is-over'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('is-over');
      const file = e.dataTransfer.files[0];
      if (file) useFile(key, file);
    });

    rows[key] = {
      el, input,
      thumb: el.querySelector('.art-thumb'),
      status: el.querySelector('.art-status'),
      error: el.querySelector('.art-error'),
      upload: el.querySelector('.art-upload'),
      resetBtn: el.querySelector('.art-reset'),
    };
    slot.onChange = () => render(key);
    render(key);
  }

  function render(key) {
    const slot = slots[key];
    const row = rows[key];
    const labels = { placeholder: 'Placeholder', asset: 'From assets folder', shared: 'Published' };
    row.status.textContent = slot.file ? `${labels[slot.source]} · ${slot.file.split('/').pop()}` : labels.placeholder;
    row.el.dataset.source = slot.source;
    row.upload.firstChild.textContent = slot.source === 'shared' ? 'Replace' : 'Upload';
    row.resetBtn.hidden = slot.source !== 'shared';
    row.thumb.replaceChildren();
    const src = slot.thumbSrc();
    if (src) {
      const media = document.createElement(slot.isVideo() ? 'video' : 'img');
      media.src = src;
      if (media.tagName === 'VIDEO') Object.assign(media, { muted: true, loop: true, autoplay: true, playsInline: true });
      else media.alt = '';
      row.thumb.append(media);
    }
  }

  // ─── Drop / double-click on the 3D slots ───
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function slotAt(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const meshes = Object.values(slots).flatMap((s) => s.meshes); // the logo sign rebuilds its mesh
    return ray.intersectObjects(meshes, false)[0]?.object.userData.slotKey ?? null;
  }

  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setOpen(true);
    const key = slotAt(e);
    if (key) useFile(key, file);
  });
  canvas.addEventListener('dblclick', (e) => {
    const key = slotAt(e);
    if (key) rows[key].input.click();
  });

  return { setOpen, rows };
}
