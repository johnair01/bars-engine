// The Gate Steward on the map. Two jobs:
//  1. the "First time here?" bubble (layer hint-new) shows over her head until this player has talked with her once;
//     guide.html saves guide_visits to WA.player.state when the dialogue opens.
//  2. standing in her area and pressing space opens the dialogue as a sheet over the bottom of the game screen
//     (WA.ui.website.open), so the choices sit on the map instead of in the side panel. Leaving her area closes it.
WA.onInit().then(() => {
  const sync = () => (WA.player.state.guide_visits ? WA.room.hideLayer('hint-new') : WA.room.showLayer('hint-new'));
  sync();
  WA.player.state.onVariableChange('guide_visits').subscribe(sync);

  let prompt, sheet;
  const close = async () => { if (sheet) { const s = sheet; sheet = undefined; try { await s.close(); } catch (e) { /* already closed */ } } };
  WA.room.area.onEnter('Gate Steward').subscribe(() => {
    prompt = WA.ui.displayActionMessage({
      message: 'Press SPACE to talk with the Gate Steward',
      callback: async () => {
        if (sheet) return;
        sheet = await WA.ui.website.open({
          url: 'guide.html?overlay=1', allowApi: true,
          position: { vertical: 'bottom', horizontal: 'middle' }, size: { width: '100%', height: '46vh' },
        });
      },
    });
  });
  // The first Elder's hall: walking in with her lantern opens her sheet once (guide.html?at=elder-shaman).
  WA.room.area.onEnter('Shaman Elder').subscribe(async () => {
    const w = WA.player.state.elder_waiting;
    if (!w || w.hall !== 'elder-shaman' || sheet) return;
    sheet = await WA.ui.website.open({
      url: 'guide.html?overlay=1&at=elder-shaman', allowApi: true,
      position: { vertical: 'bottom', horizontal: 'middle' }, size: { width: '100%', height: '46vh' },
    });
  });
  WA.room.area.onLeave('Shaman Elder').subscribe(() => close());

  // The lantern rail by the gate: one lantern per Elder, lit for the Elder who waits for the player or has been met.
  // Standing on a lantern shows its line: the lit one says what she is waiting for, a dark one says when the player's own road reaches that hall.
  fetch('guide-halls.json').then((r) => r.json()).then(({ rail }) => {
    const paint = () => {
      const met = WA.player.state.elders_met || [], waiting = WA.player.state.elder_waiting || {};
      rail.forEach((h) => {
        const lit = h.id === waiting.hall || met.includes(h.id);
        (lit ? WA.room.showLayer : WA.room.hideLayer)(h.lit); (lit ? WA.room.hideLayer : WA.room.showLayer)(h.dark);
      });
    };
    paint();
    WA.player.state.onVariableChange('elders_met').subscribe(paint);
    WA.player.state.onVariableChange('elder_waiting').subscribe(paint);
    rail.forEach((h) => {
      let msg;
      WA.room.area.onEnter(h.area).subscribe(() => {
        const waiting = WA.player.state.elder_waiting || {}, met = WA.player.state.elders_met || [];
        const text = h.id === waiting.hall ? waiting.line : met.includes(h.id) ? 'You have met her.' : h.lights;
        msg = WA.ui.displayActionMessage({ message: `${h.place}: ${text}`, callback: () => {} });
      });
      WA.room.area.onLeave(h.area).subscribe(() => { if (msg) msg.remove(); });
    });
  });
  WA.room.area.onLeave('Gate Steward').subscribe(() => { if (prompt) prompt.remove(); close(); });
});
