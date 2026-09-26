import './style.css';
import { findBuild } from './builds/index.js';
import { renderSwitcher } from './switcher.js';
import { startViewer } from './viewer.js';

const entry = findBuild(location.pathname);
renderSwitcher(entry);
if (entry.load) {
  entry.load().then((mod) => startViewer(mod.default));
} else {
  // Listed but not built yet
  document.body.classList.add('is-soon');
  document.querySelector('.title-card h1').textContent = entry.name;
  document.querySelector('.title-card .sub').textContent = `${entry.where} · coming in step ${entry.step}`;
}
