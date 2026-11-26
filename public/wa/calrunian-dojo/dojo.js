// The Calrunian Dojo keeps one way out in code rather than in a doorway: the compound gate opens at the bottom of
// the map and the player spawns inside it, so an exit area there would throw them out the moment the room opens.
// The menu carries the return instead, and it works from anywhere on the map.
WA.onInit().then(() => {
  WA.ui.registerMenuCommand('Back to the Lantern Walk', () => WA.nav.goToRoom('../lantern-walk/lantern-walk.tmj'));
});
