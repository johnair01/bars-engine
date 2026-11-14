// Checks for the trade hand (trade-hand.js). Plain node: node content/calrunia/deck/trade-hand-test.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const TH = createRequire(import.meta.url)("./trade-hand.js");

const chart = { goal: 6000, ports: [{ id: "a", name: "Port A" }, { id: "b", name: "Port B" }], moves: [{ port: "a", action: "Send the first offer", ask: "a call" }, { port: "b", action: "Post the page" }] };
const d1 = "2026-11-03T15:00:00.000Z", d2 = "2026-11-04T15:00:00.000Z", d6 = "2026-11-08T15:00:00.000Z";
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok", name); };

t("deals one crate a morning from the trade deck (FR-001)", () => {
  const s = TH.blank(d1, chart); const c = TH.deal(s, d1);
  assert.equal(c.action, "Send the first offer"); assert.equal(s.moves.length, 1); assert.equal(TH.deal(s, d1), c);
  assert.equal(TH.tideTurned(s), false);
});
t("the free sweep puts the crate back once a day", () => {
  const s = TH.blank(d1, chart); TH.deal(s, d1);
  assert.equal(TH.sweep(s, d1), true); assert.equal(s.crate, null); assert.equal(s.moves.at(-1).action, "Send the first offer");
  TH.deal(s, d1); assert.equal(TH.sweep(s, d1), false);
});
t("presence 1 or 2 turns the crate to its spirit side (FR-003)", () => {
  const s = TH.blank(d1, chart); TH.deal(s, d1);
  assert.equal(TH.presence(s, 2, d1), true); assert.equal(TH.presence(s, 4, d1), false);
});
t("sending pays three, launches a boat, thins the fog and makes the port known (FR-004, mb-pay-more)", () => {
  const s = TH.blank(d1, chart); TH.deal(s, d1); TH.release(s, "sent", d1);
  assert.equal(s.vibeulons, 3); assert.equal(s.boats.length, 1); assert.equal(s.fog, TH.FOG_MAX - 1);
  assert.equal(s.ports[0].standing, "known"); assert.equal(TH.tideTurned(s), true);
  assert.equal(TH.deal(s, d1).state, "sent", "no second crate the same morning");
});
t("sitting with it and the crew bell both release and pay", () => {
  for (const how of ["sat", "crew"]) { const s = TH.blank(d1, chart); TH.deal(s, d1); TH.release(s, how, d1, "note"); assert.equal(s.vibeulons, 3); assert.equal(s.boats.length, 0); }
});
t("a waiting crate gains one a day up to seven (mb-bounty)", () => {
  const s = TH.blank(d1, chart); TH.deal(s, d1);
  assert.equal(TH.bounty(s, d2), 1); assert.equal(TH.bounty(s, "2026-11-30T00:00:00Z"), 7);
  TH.release(s, "sat", d2); assert.equal(s.vibeulons, 4);
});
t("a studio boat rows against the tide for one, and sails free after", () => {
  const s = TH.blank(d1, chart); s.vibeulons = 1; TH.deal(s, d1);
  assert.deepEqual(TH.rowAgainst(s, d1), { ok: true, cost: 1 }); assert.equal(s.vibeulons, 0);
  assert.equal(TH.rowAgainst(s, d1).ok, false);
  TH.release(s, "sent", d1); assert.deepEqual(TH.rowAgainst(s, d1), { ok: true, cost: 0 });
});
t("fog drifts back a step for each two days with none", () => {
  const s = TH.blank(d1, chart); TH.deal(s, d1); TH.release(s, "sent", d1); TH.settleFog(s, d6); assert.equal(s.fog, TH.FOG_MAX);
});
t("coin raises the tide and the port; a no moves nothing (FR-005, FR-007)", () => {
  const s = TH.blank(d1, chart); TH.deal(s, d1); TH.release(s, "sent", d1); const b = s.boats[0];
  TH.logReturn(s, b.id, { kind: "coin", amount: 1500 }, d2);
  assert.deepEqual(TH.tideLine(s, d2), { coin: 1500, goal: 6000, level: 0.25 }); assert.equal(s.ports[0].standing, "trusted");
  const s2 = TH.blank(d1, chart); TH.deal(s2, d1); TH.release(s2, "sent", d1); const before = JSON.stringify([s2.vibeulons, s2.fog, s2.ports]);
  TH.logReturn(s2, s2.boats[0].id, { kind: "lesson", line: "not this season" }, d2);
  assert.equal(JSON.stringify([s2.vibeulons, s2.fog, s2.ports]), before);
  assert.equal(TH.tideLine(s, "2026-12-02T00:00:00Z").coin, 0, "the tide line is this calendar month");
});
t("coin twice at a port makes it a standing route; kept routes fill the route book (FR-006)", () => {
  const s = TH.blank(d1, chart); TH.deal(s, d1); TH.release(s, "sent", d1);
  TH.logReturn(s, s.boats[0].id, { kind: "coin", amount: 100 }, d2); TH.keepRoute(s, s.boats[0].id, "the words that worked", d2);
  s.boats.push({ id: "x", port: "a", sentAt: d2, back: null }); TH.logReturn(s, "x", { kind: "coin", amount: 100 }, d2);
  assert.equal(s.ports[0].standing, "route"); assert.equal(TH.routeBook(s)[0].routes.length, 1);
});
const deck = createRequire(import.meta.url)("../../../fixtures/trade-deck/opportunities.json");
t("a boat comes home on its own after a day out, longest out first", () => {
  const s = TH.blank(d1, chart); TH.deal(s, d1); TH.release(s, "sent", d1);
  assert.equal(TH.homeward(s, d1), null, "not the same day");
  assert.equal(TH.homeward(s, d2).id, s.boats[0].id);
});
t("its crate opens on one opportunity card from its port, worth extra vibeulons, the same card each time", () => {
  const s = TH.blank(d1, { ...chart, ports: [{ id: "jobs", name: "Jobs" }], moves: [{ port: "jobs", action: "Submit the form", ask: "the director role" }] });
  TH.deal(s, d1); TH.release(s, "sent", d1); const b = s.boats[0];
  const o = TH.opportunity(s, b.id, deck);
  assert.ok(o.title && o.action && o.bonus > 0); assert.equal(o.element, "metal"); assert.equal(o.portName, "Jobs");
  assert.ok(!/[{}]/.test(o.title + o.line + o.action), "every blank is filled");
  assert.deepEqual(TH.opportunity(s, b.id, deck), o);
});
t("taking it aboard puts it on a clear hatch today and pays its extra when sent", () => {
  const s = TH.blank(d1, { ...chart, moves: [{ port: "a", action: "Send the first offer" }] });
  TH.deal(s, d1); TH.release(s, "sent", d1); const b = s.boats[0];
  const o = TH.opportunity(s, b.id, deck); const r = TH.takeAboard(s, o, d2);
  assert.equal(r.today, true); assert.equal(s.crate.action, o.action); assert.equal(b.back.kind, "opportunity");
  const before = s.vibeulons; TH.release(s, "sent", d2); assert.equal(s.vibeulons - before, TH.PAY.crate + o.bonus);
  assert.equal(TH.takeAboard(s, o, d2), null, "a boat comes home once");
});
t("taking it aboard while a crate waits chalks it for tomorrow; letting it drift lowers nothing", () => {
  const s = TH.blank(d1, chart); TH.deal(s, d1); TH.release(s, "sent", d1);
  s.boats.push({ id: "y", port: "b", action: "Post the page", ask: "", sentAt: d1, back: null });
  TH.deal(s, d2); assert.equal(s.crate.state, "waiting");
  const r = TH.takeAboard(s, TH.opportunity(s, s.boats[0].id, deck), d2); assert.equal(r.today, false); assert.equal(s.moves.at(-1).id, r.move.id);
  const before = JSON.stringify([s.vibeulons, s.fog, s.ports]);
  TH.letDrift(s, TH.opportunity(s, "y", deck), d2); assert.equal(JSON.stringify([s.vibeulons, s.fog, s.ports]), before);
  assert.equal(s.boats[1].back.taken, false);
});
t("coin logged at the tide post raises the tide and the port", () => {
  const s = TH.blank(d1, chart); assert.equal(TH.addCoin(s, 0, "a", d1), null);
  TH.addCoin(s, 600, "a", d1); assert.equal(TH.tideLine(s, d1).coin, 600); assert.equal(s.ports[0].standing, "trusted");
  TH.addCoin(s, 50, "a", d1); assert.equal(s.ports[0].standing, "route");
});
t("the store keeps nothing but this device's copy", () => {
  const mem = new Map(), ls = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const s = TH.blank(d1, chart); assert.equal(TH.store.put(s, ls), true); assert.deepEqual(TH.store.get(ls), s);
});
console.log(n + " trade hand checks passed");
