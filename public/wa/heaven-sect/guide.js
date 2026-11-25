// The Gate Steward's "First time here?" bubble: shown over her head until this player has spoken with her once.
// guide.html saves guide_visits to WA.player.state when the dialogue opens, so the bubble goes for good after the first talk.
WA.onInit().then(() => {
  const sync = () => (WA.player.state.guide_visits ? WA.room.hideLayer('hint-new') : WA.room.showLayer('hint-new'));
  sync();
  WA.player.state.onVariableChange('guide_visits').subscribe(sync);
});
