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

Derived areas (as drawn): room 50 × 33 = 1,650 m² (venue: 1,649 m²); panel zone ≈ 1,100 m²;
mini-stage zone ≈ 250 m²; networking ≈ 252 m²; pause pocket 48 m²; foyer ≈ 400 m².

## Step 2 · Panel Stage (`config/panel.config.js`)

| Item | Assumed | Config |
|---|---|---|
| Sticker-card frame: top / setback from the deck's back edge / thickness | 6.4 / 0.4 / 0.12 | `stage.frame` |
| Header box (cyan/dark checkerboard): height / depth / square | 0.65 / 0.5 / 0.22 (bottom 5.75, clears the LED top at 5.575) | `stage.header` |
| OPF logo lightbox: size / depth | 3.2 × 0.8 / 0.3 (top edge 7.2 as given) | `stage.logo` |
| Box truss: span (outer) / front goalpost position | 12.6 / 0.3 in front of the deck edge; back goalpost 0.5 behind the frame | `stage.truss` |
| IMAG screens: centre from the stage centre line / z / tower height | 8.3 / 1.0 behind the deck front / 4.6 | `stage.imag` |
| PA stacks (ground-stacked) | 2 × (0.7 × 0.7 × 1.0) each side, at x ±6.2 | `stage.pa` |
| Stairs: width / steps / going / position | 1.2 / 4 × 0.2 rise / 0.3 / centres at x ±3.9 on the front edge | `access.stairs` |
| Handrails | 0.9 above the nosings, both sides of each stair | `src/ballroom/rig.js` |
| Portable wheelchair lift: platform / position | 1.1 × 1.5, stage right beside the deck | `access.lift` |
| Panel table: depth / height / set-back | 0.7 / 0.72 / 2.2 behind the deck front | `furniture.table` |
| MC podium: size / position | 0.7 × 0.5 × 1.15, stage left at x 4.2 | `furniture.podium` |
| Lounge layout: armchairs / low tables | 0.8 × 0.78 armchairs in a shallow arc; Ø0.8 × 0.42 tables | `src/ballroom/panelZone.js` |
| Q&A mic stands | beside rows 4 and 9, on alternate aisle edges | `qaMics` |
| Camera riser height | 0.6 (2 × 2, 12 m back as given) | `cameraRiser` |
| FOH table / gap behind the last row | 3 × 1.5 / 2.5 | `foh` |
| Theatre seats: row pitch / seat width / side aisles | 0.95 / 0.55 / 1.5 | `seating` |

## Step 3 · Mini Stage, networking, pause pocket (`config/mini.config.js`)

| Item | Assumed | Config |
|---|---|---|
| Frame: setback from the deck's back edge / thickness / offset | 0.5 / 0.12 / 0.2 (5.5 × 3.5 as given) | `stage.frame` |
| Speech-bubble sign width | 2.6 (top 5.2 as given) | `stage.sign` |
| Goalpost truss: span / front position | 8 / 0.3 in front of the deck edge; back goalpost behind the frame | `stage.truss` |
| PA stacks (smaller than the panel stage) | 2 × (0.5 × 0.5 × 0.7) each side, at x ±4.6 | `stage.pa` |
| Side panels: position | on the floor either side of the deck, centres x ±3.75 | `stage.sidePanels` |
| Front steps: width / steps / going / position | 1.2 / 3 × 0.2 / 0.3 / stage-left side (x 2.0) | `stage.steps` |
| Chairs: first row / row pitch / seat width | 2.5 / 0.95 / 0.55 | `seating` |
| Standing area depth behind the chairs | 4.5 (~100 people) | `standing.depth` |
| Signing table: depth / height / set-back | 0.7 / 0.72 / 1.4 behind the deck front | `signing.table` |
| Signing queue lane: width / post spacing / route | 1.2 / 2.0 / up the right side of the chairs, then in to the steps | `signing.lane` |
| Networking high tables | 8 × Ø0.8 × 1.1 h on a 4.4 × 4.2 grid | `networking.highTables` |
| Bench cluster | 3 × 2.4 × 0.5 × 0.45 h | `networking.benches` |
| Noticeboard (texture slot) | 2.4 × 1.6, bottom 0.7, on the end wall | `networking.noticeboard` |
| Pause pocket soft seats | 4 × 1.4 × 0.8 × 0.42 h | `pause.seat` |
| REST sign | 1.2 × 0.6 on a post, top ≈ 2.3 | `pause.sign` |

## Step 4 · Ballroom Entrance Arch (`config/arch.config.js`, placement in `config/ballroom.config.js`)

| Item | Assumed | Config |
|---|---|---|
| Arch position | centred on the main doors, 4 m out into the foyer (x −8.3) | `placement.arch` |
| Die-cut rounding: outer top corners / opening top corners | 0.45 / 0.35 | `arch.cornerRadius`, `arch.openingRadius` |
| Pink offset layer: shift right / up, behind the arch | 0.22 / 0.18 | `arch.offset` |
| Header band (logo + title) | 1.2 high (4.2 − 3.0 opening); logo area 3.3 × 0.96 at the left | `src/ballroom/archZone.js` |
| Schedule boards: bottom edge | 0.35 (1.5 × 2.4 as given), centred on each 2 m leg | `boards.bottom` |
| Queue lanes: width / post spacing / straight run | 1.2 / 2.0 / 11 along the foyer, then into each half of the opening | `lanes` |
| Queue lane centre line in front of the arch | 2.9 (the foyer is 8 m deep, assumed in step 1) | `lanes.z` |
| Ticket-check podium | 0.6 × 0.45 × 1.05 h, 1.6 in front of the arch | `lanes.podium` |
| Queue shown | VIP 6, General 13 | `lanes.vip.queue`, `lanes.general.queue` |
| Night wash on the arch face | soft point light, 3.6 m up, 4.5 m in front | `src/builds/arch.js` |

Flow arrows (overview) now all run foyer → through the arch → main doors, then split to each zone (`flows`).
