// The Calrunian Dojo keeps one way out in code rather than in a doorway: the compound gate opens at the bottom of
// the map and the player spawns inside it, so an exit area there would throw them out the moment the room opens.
// The menu carries the return instead, and it works from anywhere on the map.
//
// First hour (pass wa-first-hour-1_2026-11-25). A lit lantern stands beside the gate path in view of the spawn.
// Six banners hang on the stance wall. Standing under one lights it, for that player only, and the light is kept in
// their saved state so it is still lit when they come back. Walking on costs nothing: no banner goes dark, no line
// says a banner was skipped, and nothing here moves the player.
const STANCES = 6;
const KEY = 'fh_lit';                         // comma list of lit banner numbers, e.g. "3,5"
const GOLD = '#ffbe46', WATER = '#1a3a5c';    // lantern gold and the water element, as the Lantern Walk notices carry

WA.onInit().then(async () => {
  WA.ui.registerMenuCommand('Back to the Lantern Walk', () => WA.nav.goToRoom('../lantern-walk/lantern-walk.tmj'));

  const readLit = () => String(WA.player.state[KEY] || '').split(',').filter(Boolean);
  const lit = new Set(readLit());
  lit.forEach((k) => WA.room.showLayer('lit' + k));

  const say = (id, text, ms) => WA.ui.banner.openBanner({ id, text, bgColor: WATER, textColor: GOLD, closable: true, timeToClose: ms });

  // Master Yun. Fixed lines, written by hand (Wendell, 2026-11-25: scripted for now, fresh lines later; no sign says so,
  // board row wfh-guide-author-1, answer C). He speaks only when a player steps into his circle, never moves them,
  // and the banner closes by itself or by the player: closing it is "leave me be". A returning player (a banner
  // already lit) hears a different line, so the place does not repeat itself word for word.
  const YUN = {
    first: 'Master Yun: Six banners hang behind me. Light one if you like. Or leave me be; the door stays open either way.',
    back: 'Master Yun: You were here before. Your light is still on the wall. The Lantern Walk begins past the gate, if you want a walk.',
  };
  let inYun = false;
  WA.room.area.onEnter('Master Yun').subscribe(() => {
    inYun = true;
    say('fh-yun', lit.size ? YUN.back : YUN.first, 10000);
  });
  WA.room.area.onLeave('Master Yun').subscribe(() => { inYun = false; WA.ui.banner.closeBanner().catch(() => {}); });

  // The waymark: one plain line as the newcomer reaches the stance wall, answered by acting or by walking on.
  let told = false;
  WA.room.area.onEnter('Waymark').subscribe(() => {
    if (told || lit.size || inYun) return;               // once a banner is lit the question has been answered
    told = true;
    say('fh-waymark', 'Six banners hang on this wall. Stand beneath one and it lights. Or walk on: nothing is lost.', 12000);
  });
  WA.room.area.onLeave('Waymark').subscribe(() => WA.ui.banner.closeBanner().catch(() => {}));

  for (let k = 1; k <= STANCES; k++) {
    WA.room.area.onEnter('Stance ' + k).subscribe(async () => {
      WA.room.showLayer('lit' + k);
      if (lit.has(String(k))) return;
      lit.add(String(k));
      // persist keeps the key across a reload; it was read back after a reload in the cloud bot test (callsheet)
      await WA.player.state.saveVariable(KEY, [...lit].sort().join(','), { persist: true, public: false, scope: 'world' });
      say('fh-lit', 'Lit. It stays lit for you.', 6000);
    });
  }
});
