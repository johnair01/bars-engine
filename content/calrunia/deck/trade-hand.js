// The trade hand: the rules of the living ship's trade deck (Six-faces-council .specify/specs/money-trade-deck, FR-001 to
// FR-007; Game frame council/callsheets/pipeline/money-block/game-frame.md). Plain data in, plain data out, no drawing, so
// node can test it (trade-hand-test.mjs) and the deck page draws whatever it returns. Who is asked and every price live
// only in the player's own store on this device (FR-002, mb-money-reserved); nothing here names anyone's streams.
(function (root) {
  const V = 1;
  const PAY = { crate: 3, studio: 1, rowAgainst: 1, bountyPerDay: 1, bountyCap: 7 }; // mb-pay-more, mb-bounty
  const FOG_MAX = 5, FOG_BACK_DAYS = 2; // one step down per sent crate; one step back for each two days with none
  const STANDING = ["stranger", "known", "trusted", "route"]; // mbf-trader: a port moves up by contact, never down
  const KEY = "calrunia.tradeDeck.v1";

  const day = (iso) => String(iso).slice(0, 10);
  const days = (a, b) => Math.floor((Date.parse(day(b)) - Date.parse(day(a))) / 864e5);
  const uid = (p, now, n) => p + "-" + day(now).replace(/-/g, "") + "-" + n;

  // A chart is the player's intake: up to six ports and the moves they have chalked for tomorrow's hatches.
  function blank(now, chart) {
    const c = chart || { goal: 0, ports: [], moves: [] };
    return {
      v: V, goal: +c.goal || 0, vibeulons: +c.vibeulons || 0, fog: FOG_MAX, fogAt: day(now),
      ports: (c.ports || []).slice(0, 6).map((p, i) => ({ id: p.id || "port-" + i, name: String(p.name || "A port"), standing: "stranger" })),
      moves: (c.moves || []).map((m, i) => ({ id: m.id || uid("mv", now, i), port: m.port, action: String(m.action || ""), ask: String(m.ask || "") })),
      crate: null, boats: [], routes: [], coins: [], sits: [], opps: [], log: [],
    };
  }

  // FR-001: a morning hand of one, dealt from the trade deck; the free daily sweep puts a waiting crate back on the deck.
  function deal(s, now) {
    if (s.crate && s.crate.state === "waiting") return s.crate;
    if (s.crate && day(s.crate.releasedAt || s.crate.dealtAt) === day(now)) return s.crate; // today's crate is already off
    const mv = s.moves.shift();
    s.crate = mv ? { ...mv, dealtAt: now, state: "waiting", presence: null, spiritSide: false } : null;
    return s.crate;
  }
  function sweep(s, now) {
    if (!s.crate || s.crate.state !== "waiting") return false;
    if (s.sweptOn === day(now)) return false; // one free sweep a day
    const { id, port, action, ask } = s.crate; s.moves.push({ id, port, action, ask }); s.crate = null; s.sweptOn = day(now);
    s.log.push({ at: now, kind: "sweep", id });
    return true;
  }

  const bounty = (s, now) => (s.crate && s.crate.state === "waiting" ? Math.min(PAY.bountyCap, Math.max(0, days(s.crate.dealtAt, now)) * PAY.bountyPerDay) : 0);

  // FR-003: the presence tap. At 1 or 2 the crate turns to its spirit side and the 3-2-1 is offered first.
  function presence(s, n, now) {
    if (!s.crate) return null;
    const k = Math.max(1, Math.min(5, Math.round(+n) || 1));
    s.crate.presence = k; s.crate.spiritSide = k <= 2; s.log.push({ at: now, kind: "presence", n: k });
    return s.crate.spiritSide;
  }

  // Three good ways off the deck: sent (a boat), sat with (the 3-2-1), handed to the crew (Claude, with a note).
  function release(s, how, now, note) {
    const c = s.crate; if (!c || c.state !== "waiting") return null;
    if (!["sent", "sat", "crew"].includes(how)) throw new Error("unknown release " + how);
    const paid = PAY.crate + bounty(s, now) + (+c.bonus || 0); // a card a returning boat brought pays its extra on top
    c.state = how; c.releasedAt = now; c.paid = paid; if (note) c.note = String(note);
    s.vibeulons += paid;
    if (how === "sat") s.sits.push({ at: now, id: c.id, minted: 1 }); // the sit mints the vibeulon that pays (ReleaseResidue)
    if (how === "sent") {
      s.boats.push({ id: uid("boat", now, s.boats.length), crate: c.id, port: c.port, action: c.action, ask: c.ask, sentAt: now, back: null });
      settleFog(s, now); s.fog = Math.max(0, s.fog - 1);
      const p = s.ports.find((q) => q.id === c.port); if (p && p.standing === "stranger") p.standing = "known";
    }
    s.log.push({ at: now, kind: "release", how, id: c.id, paid });
    return c;
  }

  // The tide: in while today's crate waits; turned once it is off. A studio boat rows against it for one vibeulon.
  const tideTurned = (s) => !s.crate || s.crate.state !== "waiting";
  function rowAgainst(s, now) {
    if (tideTurned(s)) return { ok: true, cost: 0 };
    if (s.vibeulons < PAY.rowAgainst) return { ok: false, cost: PAY.rowAgainst };
    s.vibeulons -= PAY.rowAgainst; s.log.push({ at: now, kind: "row", cost: PAY.rowAgainst });
    return { ok: true, cost: PAY.rowAgainst };
  }

  // FR-004: fog drifts back one step for each two whole days with no sent crate.
  function settleFog(s, now) {
    const gone = Math.floor(Math.max(0, days(s.fogAt, now)) / FOG_BACK_DAYS);
    if (gone > 0) { s.fog = Math.min(FOG_MAX, s.fog + gone); s.fogAt = day(now); }
    if (s.boats.some((b) => day(b.sentAt) === day(now))) s.fogAt = day(now);
    return s.fog;
  }

  // FR-005 and FR-006: a boat comes back with coin, with a lesson, or stays out. A no lowers nothing of the player's.
  function logReturn(s, boatId, back, now) {
    const b = s.boats.find((x) => x.id === boatId); if (!b || b.back) return null;
    if (back.kind === "coin") {
      const amount = Math.max(0, +back.amount || 0);
      b.back = { kind: "coin", amount, at: now }; addCoin(s, amount, b.port, now, b.id);
    } else if (back.kind === "lesson") {
      b.back = { kind: "lesson", line: String(back.line || ""), at: now }; // the spirit holds it; no meter moves
    } else return null;
    s.log.push({ at: now, kind: "return", boat: b.id, back: b.back.kind });
    return b;
  }
  // Coin is logged at the tide post, never asked for at the return (his note on mb-return-build-look-1). It raises the
  // tide and the port's standing as a returning boat's coin did: trusted at the first coin, a route at the second.
  function addCoin(s, amount, port, now, boat) {
    const a = Math.max(0, +amount || 0); if (!(a > 0)) return null;
    const c = { at: now, amount: a, port: port || null }; if (boat) c.boat = boat; s.coins.push(c);
    const p = s.ports.find((q) => q.id === port);
    if (p) { const same = s.coins.filter((x) => x.port === port).length; p.standing = same >= 2 ? "route" : STANDING[Math.max(STANDING.indexOf(p.standing), 2)]; }
    s.log.push({ at: now, kind: "coin", amount: a, port: port || null });
    return c;
  }

  // The boat comes home on its own (his note on mb-return-build-look-1: "a surprise and delight engine"). On a visit,
  // the boat that has been out longest, and at least one whole day, is already sailing in. Nothing is asked.
  const HOME_AFTER_DAYS = 1;
  function homeward(s, now) {
    return s.boats.filter((b) => !b.back && days(b.sentAt, now) >= HOME_AFTER_DAYS).sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt))[0] || null;
  }

  // The crate it carries opens on one opportunity card: a way to move the money needle that came back from its port.
  // The draw is fixed by the boat, so reopening the same boat shows the same card, and a card taken or let drift is
  // not dealt again while others remain.
  function opportunity(s, boatId, deck) {
    const b = s.boats.find((x) => x.id === boatId); if (!b || !deck) return null;
    const port = s.ports.find((p) => p.id === b.port), name = port ? port.name : "a port";
    const fill = (t) => String(t || "").replace(/\{port\}/g, name).replace(/\{ask\}/g, b.ask || "what you sent").replace(/\{action\}/g, b.action || "");
    const own = (deck.ports && (deck.ports[b.port] || deck.ports.any)) || [];
    const seen = new Set((s.opps || []).map((o) => o.card));
    const all = (deck.from_boat || []).concat(own);
    const fresh = all.filter((c) => !seen.has(c.id)); const pool = fresh.length ? fresh : all; if (!pool.length) return null;
    let h = 0; for (const ch of String(b.id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const c = pool[h % pool.length], el = (deck.elements && (deck.elements[b.port] || deck.elements.any)) || { element: "earth" };
    return { card: c.id, boat: b.id, port: b.port, portName: name, element: el.element, title: fill(c.title), line: fill(c.line), action: fill(c.action), bonus: Math.max(0, +c.bonus || 0), pay: PAY.crate };
  }
  // Take it aboard: the card becomes a move in the hand, on the hatch today when the hatch is clear, else tomorrow.
  // Let it drift: it goes back to sea; nothing is lowered. Either way the boat is home.
  function takeAboard(s, opp, now) {
    const b = s.boats.find((x) => x.id === opp.boat); if (!b || b.back) return null;
    const mv = chalk(s, opp.port, opp.action, "", now); mv.bonus = opp.bonus; mv.from = b.id; mv.title = opp.title;
    b.back = { kind: "opportunity", card: opp.card, taken: true, at: now };
    (s.opps = s.opps || []).push({ at: now, boat: b.id, card: opp.card, taken: true });
    s.log.push({ at: now, kind: "home", boat: b.id, card: opp.card, taken: true });
    const c = deal(s, now); return { move: mv, today: !!c && c.id === mv.id };
  }
  function letDrift(s, opp, now) {
    const b = s.boats.find((x) => x.id === opp.boat); if (!b || b.back) return null;
    b.back = { kind: "opportunity", card: opp.card, taken: false, at: now };
    (s.opps = s.opps || []).push({ at: now, boat: b.id, card: opp.card, taken: false });
    s.log.push({ at: now, kind: "home", boat: b.id, card: opp.card, taken: false });
    return b;
  }
  // Route-keeping stays where it was: a boat whose return logged coin can be kept as a route. The return no longer asks
  // for coin, so the route book is written from logReturn's coin only (not reached from the deck page in this build).
  function keepRoute(s, boatId, words, now) {
    const b = s.boats.find((x) => x.id === boatId); if (!b || !b.back || b.back.kind !== "coin") return null;
    const r = { id: uid("route", now, s.routes.length), port: b.port, action: b.action, ask: b.ask, words: String(words || ""), from: b.id, at: now };
    s.routes.push(r); return r;
  }
  const routeBook = (s) => s.ports.map((p) => ({ port: p, routes: s.routes.filter((r) => r.port === p.id) }));

  // FR-007: the tide line is this calendar month's coin against the goal.
  function tideLine(s, now) {
    const m = day(now).slice(0, 7);
    const coin = s.coins.filter((c) => day(c.at).slice(0, 7) === m).reduce((a, c) => a + c.amount, 0);
    return { coin, goal: s.goal, level: s.goal > 0 ? Math.min(1, coin / s.goal) : 0 };
  }

  function chalk(s, port, action, ask, now) {
    const mv = { id: uid("mv", now, s.moves.length + s.log.length), port, action: String(action), ask: String(ask || "") };
    s.moves.push(mv); return mv;
  }

  const store = {
    get(ls) { try { const r = JSON.parse((ls || root.localStorage).getItem(KEY)); return r && r.v === V ? r : null; } catch (e) { return null; } },
    put(s, ls) { try { (ls || root.localStorage).setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; } },
  };

  // The say-back sentence (mbf-say-back), the only words the scene carries at rest.
  const SAY_BACK = ["Each morning one crate sits on the hatch;", "I send it, sit with it, or hand it to the crew,", "and the tide turns so my studio boats sail free;", "a crate pays three vibeulons, studio work pays one, and sailing before the tide turns costs one."];

  const TH = { V, PAY, FOG_MAX, STANDING, KEY, SAY_BACK, HOME_AFTER_DAYS, blank, deal, sweep, bounty, presence, release, tideTurned, rowAgainst, settleFog, logReturn, addCoin, homeward, opportunity, takeAboard, letDrift, keepRoute, routeBook, tideLine, chalk, store };
  root.__tradeHand = TH;
  if (typeof module !== "undefined" && module.exports) module.exports = TH;
})(typeof window !== "undefined" ? window : globalThis);
