// Every build on the site: its URL, switcher group and loader. Builds load on
// demand, so each page only downloads its own scene code.
export const BUILDS = [
  { id: 'main', group: 'Stages', name: 'Main Stage', where: 'Crystal Pavilion', path: '/main', load: () => import('./main.js') },
  { id: 'panel', group: 'Stages', name: 'Panel Stage', where: 'Grand Ballroom', path: '/ballroom/panel', load: () => import('./panel.js') },
  { id: 'mini', group: 'Stages', name: 'Mini Stage', where: 'Grand Ballroom', path: '/ballroom/mini', load: () => import('./mini.js') },
  { id: 'arch', group: 'Stages', name: 'Ballroom Arch', where: 'Ballroom foyer', path: '/ballroom/arch', step: 4 },
  { id: 'ballroom', group: 'Stages', name: 'Ballroom Overview', where: 'Grand Ballroom', path: '/ballroom', load: () => import('./ballroom.js') },
  { id: 'booth-a', group: 'Booths', name: 'Plan A', where: 'Hosted exhibition', path: '/booths/a', step: 5 },
  { id: 'booth-b', group: 'Booths', name: 'Plan B', where: 'Exhibition + photo', path: '/booths/b', step: 5 },
  { id: 'booth-c', group: 'Booths', name: 'Plan C', where: 'Photo spot', path: '/booths/c', step: 5 },
  { id: 'zone', group: 'Booths', name: 'IP Booth Zone', where: 'Crystal Pavilion', path: '/booths/zone', step: 6 },
];

// "/" and "/main" open the main stage; unknown paths fall back to it too.
export function findBuild(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/main';
  return BUILDS.find((b) => b.path === p) ?? BUILDS[0];
}
