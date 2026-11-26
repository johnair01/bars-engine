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

  // The first lit banner finishes Yun's first quest, 'first-light' (src/lib/wa/quest-table.ts). The finish is kept in
  // this browser (localStorage), so a guest who signs in later on the same browser is still paid (board look
  // npc-bounty-1, answer A). A signed-in player's room token goes to bars-engine, which pays once and answers
  // whether it did. No amount is shown or promised in-world; the amount is set on bars-engine, not here.
  const QUEST = 'first-light', DONE = 'bars_fh_quest_done', PAID = 'bars_fh_quest_paid';
  const mem = (k, v) => { try { if (v !== undefined) localStorage.setItem(k, v); return localStorage.getItem(k); } catch { return null; } };
  const PAYOUT = 'https://bars-engine.vercel.app/api/wa/quest-payout';
  let paying = false;
  const settle = async () => {
    if (paying || mem(DONE) !== QUEST || mem(PAID) === QUEST) return;
    const token = WA.player.userRoomToken;
    if (!token) return;                                   // a guest: keep the finish for the day they sign in
    paying = true;
    try {
      const r = await fetch(PAYOUT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questId: QUEST, userRoomToken: token }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && (j.paid || j.already)) mem(PAID, QUEST);   // paid, or paid earlier; amount-unset and 404 stay unpaid and retry next visit
    } catch { /* offline: try again next visit */ }
    paying = false;
  };
  settle();

  for (let k = 1; k <= STANCES; k++) {
    WA.room.area.onEnter('Stance ' + k).subscribe(async () => {
      WA.room.showLayer('lit' + k);
      if (!mem(DONE)) { mem(DONE, QUEST); settle(); }
      if (lit.has(String(k))) return;
      lit.add(String(k));
      // persist keeps the key across a reload; it was read back after a reload in the cloud bot test (callsheet)
      await WA.player.state.saveVariable(KEY, [...lit].sort().join(','), { persist: true, public: false, scope: 'world' });
      say('fh-lit', 'Lit. It stays lit for you.', 6000);
    });
  }
});
