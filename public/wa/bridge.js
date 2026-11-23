// WorkAdventure -> bars-engine bridge. Add to a map as the "script" property, or import from a map script:
//   WA.onInit().then(() => import('https://bars-engine.vercel.app/wa/bridge.js').then(m => m.start()))
// The browser uuid is a claim, not an identity: bars-engine logs it and re-decides everything.
const BASE = 'https://bars-engine.vercel.app/api/wa';
const post = (path, body) =>
  fetch(`${BASE}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(() => {});

export function start(opts = {}) {
  const base = () => ({ uuid: WA.player.uuid, room: WA.room.id });
  const send = (event, extra = {}) => post('event', { ...base(), event, ...extra });
  // Presence heartbeat every 30 seconds; the server forgets a visitor after 60.
  const beat = () => post('presence', base());
  beat();
  setInterval(beat, 30_000);
  window.addEventListener('pagehide', () => send('leave'));
  send('arrive');
  // Areas named in the map are reported as enter/leave; "press" is for areas the map marks with a bridge-press property.
  for (const name of opts.areas ?? []) {
    WA.room.area.onEnter(name).subscribe(() => send('enter', { area: name }));
    WA.room.area.onLeave(name).subscribe(() => send('leave', { area: name }));
  }
  return { send };
}
