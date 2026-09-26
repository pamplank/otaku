# Assumed dimensions (all TBC)

Everything the brief did not dimension, with where to change it. Units: metres.
Given sizes from the brief are not listed here.

## Step 1 · Site switcher + Ballroom overview (`config/ballroom.config.js`)

| Item | Assumed | Config |
|---|---|---|
| Foyer depth (outside the long wall) | 8 | `foyer.depth` |
| Double doors: count / width × height | 3 × (2.4 × 3.0) | `doors` |
| Door positions along the long wall (x) | −8.3 (main, panel axis), 3.5, 13.5 | `doors.list` |
| LED ceiling dot spacing (drawing only) | 0.6 | `room.ledPitch` |
| Right third split: mini-stage zone depth from the far wall | 15 (networking fills the rest) | `zoning.miniDepth` |
| Proposed pause pocket | 8 × 6, corner by the doors | `zoning.pause` |
| Divider height (pipe & drape) | 3.0 | `divider.height` |
| Panel stage placement: deck front from the far wall | 7 (5 m deck + 2 m crossover) | `placement.panel` |
| Mini stage placement: deck front from the far wall | 5.5 (4 m deck + 1.5 m crossover) | `placement.mini` |
| Entrance arch: distance out from the main doors | 4 | `placement.arch` |
| Networking props | 8 high tables Ø0.8 × 1.1 h, 3 benches 2.4 × 0.5, noticeboard 2.4 × 1.6 | `src/builds/ballroom.js` |
| Pause pocket props | 4 soft seats 1.4 × 0.8, water point, REST sign 1.2 × 0.6 | `src/builds/ballroom.js` |

Used by the overview's massing (detailed in later steps):

| Item | Assumed | Config |
|---|---|---|
| Panel stage: frame top | 6.2 | `config/panel.config.js` → `stage.frameTop` |
| Panel stage: logo lightbox size | 3.2 × 0.8 | `stage.logo` |
| Panel stage: goalpost truss span | 13 | `stage.truss.span` |
| Panel stage: IMAG towers, centre from the stage centre line | 8.4 | `stage.imag.x` |
| Theatre seating: row pitch / seat width / side aisles | 0.95 / 0.55 / 1.5 | `seating` |
| Camera riser height | 0.6 | `cameraRiser.height` |
| FOH table / gap behind the last row | 3 × 1.5 / 2.5 | `foh` |
| Mini stage: goalpost truss span | 8 | `config/mini.config.js` → `stage.truss.span` |
| Mini stage: first chair row / row pitch / seat width | 2.5 / 0.95 / 0.55 | `seating` |
| Mini stage: standing area depth behind the chairs | 4.5 | `standing.depth` |

Derived areas (as drawn): room 50 × 33 = 1,650 m² (venue: 1,649 m²); panel zone ≈ 1,100 m²;
mini-stage zone ≈ 250 m²; networking ≈ 252 m²; pause pocket 48 m²; foyer ≈ 400 m².
