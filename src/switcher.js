// Build switcher across the top: STAGES and BOOTHS groups, one link per build.
import { BUILDS } from './builds/index.js';

export function renderSwitcher(current) {
  const nav = document.getElementById('switcher');
  const groups = [...new Set(BUILDS.map((b) => b.group))];
  nav.innerHTML = groups.map((g) => `
    <div class="sw-group">
      <span class="sw-label">${g}</span>
      ${BUILDS.filter((b) => b.group === g).map((b) => {
        const here = b === current;
        if (!b.load) return `<span class="sw-item is-soon" title="${b.name} · coming in step ${b.step}">${b.name}<small>soon</small></span>`;
        return `<a class="sw-item${here ? ' is-here' : ''}" href="${b.path}" ${here ? 'aria-current="page"' : ''} title="${b.name} · ${b.where}">${b.name}</a>`;
      }).join('')}
    </div>`).join('');
  nav.querySelector('.is-here')?.scrollIntoView({ inline: 'center', block: 'nearest' });
}
