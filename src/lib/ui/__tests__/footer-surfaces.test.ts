/**
 * The footer's surface rule, tested as a result rather than a mechanism.
 *
 * "Is the route in the allowlist" is the mechanism. "Can a logged-in player end
 * up reading speaking fees under her private vault" is the result, and only the
 * second one is the check.
 */
import assert from 'node:assert/strict'
import { hasFooter } from '../footer-surfaces'

// ── The public surfaces get it ───────────────────────────────────────────────

for (const route of [
  '/mastering-allyship',
  '/mastering-allyship/sheet',
  '/mastering-allyship/origin',
  '/mastering-allyship/what-comes-next',
  '/mastering-allyship/one-to-one',
  '/mastering-allyship/book-tour/help',
  '/support',
  '/nonprofit',
  '/speaking',
  '/succession',
  '/podcasts',
  '/campaigns',
  '/deck/sales',
  '/campaign/the-crossing',
  '/igniting-joy',
]) {
  assert.equal(hasFooter(route, false), true, `${route} should carry the footer`)
  assert.equal(hasFooter(route, true), true, `${route} keeps it when signed in`)
}

// ── The app does not ─────────────────────────────────────────────────────────

for (const route of [
  '/vault',
  '/bars/garden',
  '/admin',
  '/admin/backlog',
  '/event/barn', // big-screen kiosk
  '/event/donate',
  '/play',
  '/adventure/hub/abc',
  '/oracle',
  '/wiki/glossary',
  '/login',
  '/deck', // the app deck, not /deck/sales
  '/campaign/bruised-banana', // a different campaign
  '/campaigns-archive', // must not match the /campaigns exact entry
]) {
  assert.equal(hasFooter(route, true), false, `${route} must not carry the footer`)
  assert.equal(hasFooter(route, false), false, `${route} stays clean logged out too`)
}

// ── `/` is two pages behind one route ────────────────────────────────────────

assert.equal(hasFooter('/', false), true, 'the logged-out marketing home carries it')
assert.equal(hasFooter('/', true), false, 'the NOW dashboard must not')

console.log('✓ footer-surfaces: public surfaces carry the footer, the app does not')
