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
      crate: null, boats: [], routes: [], coins: [], sits: [], log: [],
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
    const paid = PAY.crate + bounty(s, now);
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
      b.back = { kind: "coin", amount, at: now }; s.coins.push({ at: now, amount, port: b.port, boat: b.id });
      const p = s.ports.find((q) => q.id === b.port);
      if (p) { const same = s.coins.filter((x) => x.port === b.port).length; p.standing = same >= 2 ? "route" : STANDING[Math.max(STANDING.indexOf(p.standing), 2)]; }
    } else if (back.kind === "lesson") {
      b.back = { kind: "lesson", line: String(back.line || ""), at: now }; // the spirit holds it; no meter moves
    } else return null;
    s.log.push({ at: now, kind: "return", boat: b.id, back: b.back.kind });
    return b;
  }
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

  const TH = { V, PAY, FOG_MAX, STANDING, KEY, SAY_BACK, blank, deal, sweep, bounty, presence, release, tideTurned, rowAgainst, settleFog, logReturn, keepRoute, routeBook, tideLine, chalk, store };
  root.__tradeHand = TH;
  if (typeof module !== "undefined" && module.exports) module.exports = TH;
})(typeof window !== "undefined" ? window : globalThis);
