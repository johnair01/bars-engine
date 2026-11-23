#!/usr/bin/env node
// Stub for WorkAdventure's Admin API (council wa-own-first-1, gate 2 of pass wa-own-world-1).
// It answers for ONE test account with a fixed look and the "editor" tag, so a person on the box can reload
// the world and see whether WorkAdventure's face shelf disappears. Everyone else gets an anonymous answer
// with no tags, so the world keeps working. No dependencies, no database, no secrets in the file.
//
//   ADMIN_API_TOKEN=... [PORT=8787] [WA_TEST_USER=test-admin] [WA_MAP_URL=...] node server.mjs
//
// The response fields are written from WorkAdventure's pusher source as remembered, NOT checked against a
// running pusher: which fields it reads is the thing this stub exists to test. See README.md.
import http from "node:http";

const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.ADMIN_API_TOKEN || "";
const TEST_USER = process.env.WA_TEST_USER || "test-admin";
const FRONT = (process.env.WA_FRONT_URL || "https://world.masteringallyship.com").replace(/\/$/, "");
const MAP_URL = process.env.WA_MAP_URL || "https://workadventure.github.io/map-starter-kit/map.tmj";
const TEST_TAGS = (process.env.WA_TEST_TAGS || "editor").split(",").map((t) => t.trim()).filter(Boolean);

// One fixed look for the test account: a body and a hair layer from the front's own stock sprites.
// Paths follow the front's /resources/customisation layout; the first run confirms they load.
export const FIXED_TEXTURES = [
  { id: "calrunia-body", layer: "body", url: `${FRONT}/resources/customisation/character_color/character_color0.png` },
  { id: "calrunia-hair", layer: "hair", url: `${FRONT}/resources/customisation/character_hair/character_hair1.png` },
];

export function wokaList() {
  const part = (t) => ({ id: t.id, url: t.url, layer: t.layer });
  return {
    body: { collections: [{ name: "calrunia", textures: FIXED_TEXTURES.filter((t) => t.layer === "body").map(part) }], required: true },
    hair: { collections: [{ name: "calrunia", textures: FIXED_TEXTURES.filter((t) => t.layer === "hair").map(part) }], required: false },
  };
}

export function memberData(userIdentifier) {
  const isTest = userIdentifier === TEST_USER;
  return {
    userUuid: userIdentifier || "anonymous",
    email: isTest ? `${TEST_USER}@admin.local` : null,
    username: isTest ? TEST_USER : null,
    tags: isTest ? TEST_TAGS : [],
    textures: isTest ? FIXED_TEXTURES : [],
    visitCardUrl: null,
    messages: [],
    anonymous: !isTest,
    canEdit: isTest && TEST_TAGS.includes("editor"),
  };
}

export function mapDetails(playUri) {
  return {
    mapUrl: MAP_URL,
    authenticationMandatory: false,
    roomName: "Calrunia (test)",
    contactPage: null,
    group: null,
    iframeAuthentication: null,
    opidLogoutRedirectUrl: null,
    playUri,
  };
}

export function route(method, url, authHeader) {
  if (TOKEN && authHeader !== `Bearer ${TOKEN}`) return [403, { error: "bad token" }];
  if (method !== "GET") return [405, { error: "GET only" }];
  const u = new URL(url, "http://stub");
  const q = u.searchParams;
  switch (u.pathname) {
    case "/api/capabilities": return [200, { "api/woka/list": "v1" }];
    case "/api/woka/list": return [200, wokaList()];
    case "/api/room/access": return [200, memberData(q.get("userIdentifier"))];
    case "/api/map": return [200, mapDetails(q.get("playUri"))];
    case "/healthz": return [200, { ok: true }];
    default: return [404, { error: "not implemented in the stub", path: u.pathname }];
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!TOKEN) console.error("warning: ADMIN_API_TOKEN is empty, so any caller is accepted. Set it before the box uses this.");
  http.createServer((req, res) => {
    const [status, body] = route(req.method, req.url, req.headers.authorization);
    console.log(new Date().toISOString(), req.method, req.url, status); // the log shows which calls the pusher makes
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  }).listen(PORT, () => console.log(`wa-admin-stub on :${PORT}, test account "${TEST_USER}", tags ${TEST_TAGS.join(",")}`));
}
