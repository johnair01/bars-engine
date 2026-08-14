/**
 * The T8 format's rules, enforced as a test rather than as a habit.
 *
 * "Does the page compile" is the mechanism. "Can a /go page end up serving two
 * audiences, offering two things, or asking twice" is the result, and the
 * result is the one the format lives or dies by.
 */
import assert from 'node:assert/strict'
import { GO_AUDIENCES, getGoAudience } from '../audiences'

// ── Every audience carries the whole skeleton ────────────────────────────────

for (const a of GO_AUDIENCES) {
  assert.ok(a.problem.trim(), `${a.slug}: their problem, in their words`)
  assert.ok(a.oneThing.trim(), `${a.slug}: the one thing this gives them`)
  assert.ok(a.proof.trim(), `${a.slug}: the proof that lands for them`)
  assert.ok(a.ask.label.trim(), `${a.slug}: one ask`)
  assert.ok(a.ask.href.trim(), `${a.slug}: one button`)
  assert.ok(a.ask.afterward.trim(), `${a.slug}: what pressing it actually does`)
}

// ── One ask, and no link tree ────────────────────────────────────────────────

for (const a of GO_AUDIENCES) {
  // `ask` is a single object by type. This catches the other way a second
  // offer sneaks in: a URL smuggling more destinations after the first.
  assert.equal(
    a.ask.href.includes('?') || a.ask.href.includes('&'),
    false,
    `${a.slug}: the button goes one place, plainly`,
  )
  assert.ok(a.ask.href.startsWith('/'), `${a.slug}: internal destination`)
}

// ── Slugs are unique and resolvable ──────────────────────────────────────────

const slugs = GO_AUDIENCES.map((a) => a.slug)
assert.equal(new Set(slugs).size, slugs.length, 'slugs are unique')
for (const slug of slugs) assert.ok(getGoAudience(slug), `${slug} resolves`)
assert.equal(getGoAudience('nobody-by-this-name'), null, 'unknown slugs 404 rather than guess')

// ── The five the handoff names ───────────────────────────────────────────────

for (const expected of ['backers', 'podcast', 'bookstore', 'org', 'facilitator']) {
  assert.ok(getGoAudience(expected), `${expected} exists`)
}

// ── The promise to the backers ───────────────────────────────────────────────

// The handoff bans urgency and manufactured scarcity outright, and these pages
// are the surface most tempted by both.
const BANNED_URGENCY = /\b(only \d+ left|limited time|doors clos|act now|last chance|\d+ days left)\b/i
for (const a of GO_AUDIENCES) {
  const copy = [a.problem, a.oneThing, a.proof, a.ask.label, a.ask.afterward, a.caveat ?? ''].join(' ')
  assert.equal(BANNED_URGENCY.test(copy), false, `${a.slug}: no urgency substrate`)
  assert.equal(/join thousands/i.test(copy), false, `${a.slug}: no "join thousands"`)
  assert.equal(copy.includes('!'), false, `${a.slug}: no exclamation points in body copy`)
}

// The backers page must not imply a mailing sequence it is forbidden to run.
{
  const backers = getGoAudience('backers')!
  assert.ok(
    /not on a mailing sequence|will not be put on one/i.test(backers.caveat ?? ''),
    'the backers page states the sequence exclusion it is held to',
  )
}

console.log('✓ go-audiences: one audience, one ask, one button, no urgency')
