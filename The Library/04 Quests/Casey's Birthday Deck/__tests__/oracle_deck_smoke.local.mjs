#!/usr/bin/env node
/** Quick smoke test for local dev stack (api on 3099). Run after `npm run api`. */
import http from "http";

const BASE = "http://127.0.0.1:3099";
let pass = 0;
let fail = 0;

function check(name, ok, detail = "") {
  if (ok) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () =>
        resolve({ status: res.statusCode, body: Buffer.concat(chunks), headers: res.headers })
      );
    }).on("error", reject);
  });
}

console.log("\n=== LOCAL ORACLE API SMOKE ===\n");

try {
  const deckRes = await get(`${BASE}/api/oracle/deck`);
  check("GET /api/oracle/deck → 200", deckRes.status === 200, String(deckRes.status));
  const deck = JSON.parse(deckRes.body.toString());
  check("52 cards", deck.cards?.length === 52, String(deck.cards?.length));

  const wuA = deck.cards.find((c) => c.id === "WU-A");
  check("WU-A present", Boolean(wuA));
  if (wuA) {
    check("WU-A has crop_saved field", typeof wuA.crop_saved === "boolean");
    check("all cards have crop_saved field", deck.cards.every((c) => typeof c.crop_saved === "boolean"));
  }

  const iconRes = await get(`${BASE}/images/oracle/icon-wake-up.svg`);
  check("GET icon-wake-up.svg → 200", iconRes.status === 200, String(iconRes.status));

  const backRes = await get(`${BASE}/images/oracle/card-back.png`);
  check("GET card-back.png → 200", backRes.status === 200, String(backRes.status));

  const imgRes = await get(`${BASE}/images/oracle/wu-a.png`);
  check("GET wu-a.png (200 if uploaded)", imgRes.status === 200 || imgRes.status === 404, String(imgRes.status));

  const statusRes = await get(`${BASE}/api/oracle/publish/status`);
  check("GET /api/oracle/publish/status → 200", statusRes.status === 200, String(statusRes.status));
  const status = JSON.parse(statusRes.body.toString());
  check("publish status has cards_ready", typeof status.cards_ready === "number");

  const readerRes = await get(`${BASE}/api/oracle/deck?mode=reader`);
  if (status.has_published_snapshot) {
    check("GET deck?mode=reader → 200 when published", readerRes.status === 200, String(readerRes.status));
    const pubDeck = JSON.parse(readerRes.body.toString());
    check("published deck has 52 cards", pubDeck.cards?.length === 52, String(pubDeck.cards?.length));
    const pubImg = await get(`${BASE}/images/oracle/wu-a.png?source=published`);
    check("GET published wu-a.png → 200", pubImg.status === 200, String(pubImg.status));
  } else {
    check("GET deck?mode=reader → 404 before first publish", readerRes.status === 404, String(readerRes.status));
  }
} catch (e) {
  check("server reachable", false, String(e));
}

console.log(`\n${pass} passed / ${fail} failed\n`);
process.exit(fail ? 1 : 0);
