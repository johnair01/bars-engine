import test from "node:test";
import assert from "node:assert/strict";
process.env.ADMIN_API_TOKEN = "t";
const { route } = await import("./server.mjs");
const ok = "Bearer t";
test("rejects a bad or missing token with 403", () => {
  assert.equal(route("GET", "/api/woka/list", undefined)[0], 403);
  assert.equal(route("GET", "/api/woka/list", "Bearer x")[0], 403);
});
test("test account gets a fixed look and the editor tag", () => {
  const [s, b] = route("GET", "/api/room/access?userIdentifier=test-admin&playUri=x", ok);
  assert.equal(s, 200);
  assert.deepEqual(b.tags, ["editor"]);
  assert.equal(b.textures.length, 2);
  assert.equal(b.anonymous, false);
});
test("anyone else is anonymous with no tags and no textures", () => {
  const [, b] = route("GET", "/api/room/access?userIdentifier=someone", ok);
  assert.deepEqual(b.tags, []);
  assert.deepEqual(b.textures, []);
  assert.equal(b.anonymous, true);
});
test("woka list, map and capabilities answer; unknown paths 404", () => {
  assert.equal(route("GET", "/api/woka/list", ok)[1].body.collections[0].textures[0].id, "calrunia-body");
  assert.ok(route("GET", "/api/map?playUri=https://w/_/a/b", ok)[1].mapUrl);
  assert.equal(route("GET", "/api/capabilities", ok)[1]["api/woka/list"], "v1");
  assert.equal(route("GET", "/api/nope", ok)[0], 404);
});
