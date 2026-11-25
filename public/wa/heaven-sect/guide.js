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
  WA.room.area.onLeave('Gate Steward').subscribe(() => { if (prompt) prompt.remove(); close(); });
});
