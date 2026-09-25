// Clickable hotspots with dimensions (all values read from stage.config.js).
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { stage as S, site as X } from '../stage.config.js';
import { L } from './layout.js';

const m = (v) => `${+v.toFixed(2)} m`;

export function hotspotDefs() {
  const D = S.deck, LED = S.led, T = S.truss, W = S.wings, LG = S.logo, C = S.ceiling;
  const F = X.foh, PK = X.pocket, BS = X.backstage;
  return [
    { id: 'deck', pos: [D.width / 2 - 0.5, D.height + 0.1, -0.4], title: 'Stage deck',
      lines: [`${D.width} × ${D.depth} m`, `Deck height ${m(D.height)}`] },
    { id: 'led', pos: [-LED.width / 2 + 0.4, L.ledTop - 0.3, L.ledZ + 0.05], title: 'LED wall',
      lines: [`${LED.width} × ${LED.height} m · ${LED.cols} × ${LED.rows} panels (${(LED.width / LED.cols) * 1000} mm)`,
        `Bottom ${m(LED.bottom)} · top ${m(L.ledTop)}`, 'KV loops · programme · live camera'] },
    { id: 'logo', pos: [LG.width / 2 + 0.9, L.logoY - 0.4, L.logoZ], title: 'OPF logo sign',
      lines: [`Die-cut ${LG.board} board on the front truss`, `≈ ${LG.width} m wide (est.)`, 'Official CyberE logo only, as supplied'] },
    { id: 'wings', pos: [-(D.width / 2 + W.width / 2), W.height, L.frameZ + 0.2], title: 'Wings',
      lines: [`${W.width} m wide each · floor to ${m(W.height)}`, 'Cyan left · yellow right', 'KV / sponsor print slots'] },
    { id: 'truss', pos: [-L.trussLegX, T.top, L.trussFrontZ], title: 'Box truss',
      lines: [`Top of truss ${m(T.top)}`, `Ground-supported goalpost · ≈ ${T.spanOuter} m wide (est.)`,
        `${T.fixtures} fixtures on the front truss`, 'No ceiling rigging'] },
    { id: 'ceiling', pos: [L.trussLegX + 0.9, (T.top + C.height) / 2, L.trussFrontZ], title: 'Ceiling clearance',
      lines: [`Ceiling ${m(C.height)} (25 ft)`, `≈ ${m(L.ceilingClear)} clear above the truss`] },
    { id: 'pit', pos: [-5, 0.3, X.pit.depth / 2], title: 'Pit + barricade',
      lines: [`Pit ${m(X.pit.depth)} deep`, `Barricade ≈ ${X.pit.width} m wide (est.)`] },
    { id: 'pocket', pos: [L.cx + 4, 0.3, (PK.backZ + PK.frontCornerZ) / 2 + 3], title: 'Viewing pocket',
      lines: [`≈ ${Math.round(L.pocketArea)} m² standing, as drawn to scale`, `Plan label says ~${PK.statedArea} m² (to confirm)`,
        'Curved front edge'] },
    { id: 'foh', pos: [F.x, F.riser + 1.2, F.z], title: 'FOH',
      lines: [`≈ ${F.width} × ${F.depth} m (est.)`, `≈ ${m(F.z)} from the deck front`, 'Front right of the pocket'] },
    { id: 'backstage', pos: [BS.centreX, 2.6, X.hall.backZ + BS.depth], title: 'Backstage holding',
      lines: [`${BS.width} × ${BS.depth} m, rear left`, 'Crossover behind the LED'] },
    { id: 'aisle', pos: [L.cx - 18, 0.3, L.hallFrontZ(L.cx - 18) - X.aisle.width / 2], title: 'Visitor aisle',
      lines: ['Keep clear at all times', `≈ ${X.aisle.width} m wide (est.)`] },
    { id: 'ac', pos: [X.acTowers[0].x, X.acTower.height + 0.2, X.acTowers[0].z], title: 'AC towers',
      lines: ['At the pocket’s front corners', 'Positions indicative'] },
  ];
}

export function buildLabels() {
  const group = new THREE.Group();
  group.name = 'labels';
  const all = [];
  hotspotDefs().forEach((d, i) => {
    const el = document.createElement('div');
    el.className = `hotspot hs-c${i % 3}`; // header strip colour: cyan / pink / yellow
    el.innerHTML = `
      <button class="hs-pin" type="button" aria-expanded="false"><span class="hs-dot"></span><span class="hs-title">${d.title}</span></button>
      <div class="hs-card" role="dialog" aria-label="${d.title}">
        <h4 class="display">${d.title}</h4><ul>${d.lines.map((l) => `<li>${l}</li>`).join('')}</ul>
        <p class="hs-tbc">All sizes TBC · site survey</p>
      </div>`;
    const pin = el.querySelector('.hs-pin');
    pin.addEventListener('pointerdown', (e) => e.stopPropagation());
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !el.classList.contains('open');
      all.forEach((o) => { o.classList.remove('open'); o.querySelector('.hs-pin').setAttribute('aria-expanded', 'false'); });
      el.classList.toggle('open', open);
      pin.setAttribute('aria-expanded', String(open));
    });
    all.push(el);
    const obj = new CSS2DObject(el);
    obj.position.set(...d.pos);
    group.add(obj);
  });
  const closeAll = () => all.forEach((o) => o.classList.remove('open'));
  return { group, closeAll };
}
