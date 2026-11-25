// Lantern Walk notice signs: unread signs sparkle cyan; once a visitor has stood at a sign and walked on,
// it settles to a calm white glow for that visitor. Layers: unread-N, unread-N-glow, read-N, read-N-glow.
// The read state is kept per player with WA.player.state (needs a signed-in or saved player to persist).
WA.onInit().then(() => {
  // The office door is the way through to the dojo. Walking into the doorway does it; the menu does it from
  // anywhere, which is the only way on a phone.
  WA.ui.registerMenuCommand('Walk to the Dojo', () => WA.nav.goToRoom('../calrunian-dojo/calrunian-dojo.tmj'));
  const show = (n, read) => {
    for (const l of [`unread-${n}`, `unread-${n}-glow`]) read ? WA.room.hideLayer(l) : WA.room.showLayer(l);
    for (const l of [`read-${n}`, `read-${n}-glow`]) read ? WA.room.showLayer(l) : WA.room.hideLayer(l);
  };
  for (const n of [1, 2, 3]) {
    show(n, !!WA.player.state[`read-${n}`]);
    let near = false;
    WA.room.area.onEnter(`notice-${n}`).subscribe(() => { near = true; });
    WA.room.area.onLeave(`notice-${n}`).subscribe(() => {
      if (!near) return;
      near = false;
      WA.player.state.saveVariable(`read-${n}`, true, { persist: true, public: false, scope: 'world' });
      show(n, true);
    });
  }
});
