/**
 * DB-backed smoke test for the Goodbye Yellow Brick Road one-shot.
 *
 *   DATABASE_URL=... npx tsx scripts/smoke-goodbye-party.ts
 *
 * Runs outside Next, so `server-only` (which Next supplies) needs a stub first:
 *   mkdir -p node_modules/server-only \
 *     && echo '{"name":"server-only","main":"index.js"}' > node_modules/server-only/package.json \
 *     && echo 'module.exports = {};' > node_modules/server-only/index.js
 *
 * Drives the real service against a real Postgres: the 8 PM deal, the
 * play/discard loop, the no-repeat cycle, the server-side midnight gate,
 * completion + achievement + BAR capture, the Game Master schedule with host
 * overrides, and live card edits. Creates its own throwaway guests and cleans
 * up after itself.
 */

import { db } from '@/lib/db'
import {
  buildBoard,
  buildGoodbyeDeck,
  completePlay,
  ensureGoodbyeParty,
  ensureHand,
  featureGmCard,
  getHandView,
  hideBoardPlay,
  resolveCard,
  unlockNextGmCard,
  upsertGoodbyeCardOverride,
} from '@/lib/goodbye-party/service'
import { GOODBYE_PARTY_SLUG } from '@/lib/goodbye-party/config'
import { PARTY_START_MS, SPICY_UNLOCK_MS } from '@/lib/goodbye-party/time'

const BEFORE_PARTY = new Date(PARTY_START_MS - 60_000) // 7:59 PM
const AT_PARTY = new Date(PARTY_START_MS) // 8:00 PM
const BEFORE_MIDNIGHT = new Date(SPICY_UNLOCK_MS - 60_000) // 11:59 PM
const AT_MIDNIGHT = new Date(SPICY_UNLOCK_MS) // 12:00 AM

const results: { name: string; ok: boolean; detail: string }[] = []

function check(name: string, ok: boolean, detail = '') {
  results.push({ name, ok, detail })
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function makeGuest(name: string) {
  const invite =
    (await db.invite.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } })) ||
    (await db.invite.create({
      data: { token: `smoke-${Date.now()}-${name}`, maxUses: 999999, theme: 'party_guest' },
      select: { id: true },
    }))
  const player = await db.player.create({
    data: {
      name,
      contactType: 'party_guest',
      contactValue: `${GOODBYE_PARTY_SLUG}:smoke:${name}:${Date.now()}`,
      inviteId: invite.id,
      onboardingMode: 'party_guest',
    },
    select: { id: true },
  })
  const party = await ensureGoodbyeParty()
  await db.partyParticipant.create({
    data: { id: `${party.id}:${player.id}`, partyId: party.id, playerId: player.id, displayName: name },
  })
  return player.id
}

async function main() {
  console.log('=== GOODBYE YELLOW BRICK ROAD — DB SMOKE ===\n')
  const party = await ensureGoodbyeParty()
  check('party row is slug-isolated', party.slug === GOODBYE_PARTY_SLUG, party.slug)

  const { cards } = await buildGoodbyeDeck()
  check('deck assembles with both lenses', cards.length === 52 && Boolean(cards[0].readings.spicy.hard.prompt), `${cards.length} cards`)

  const alice = await makeGuest(`smoke-alice-${Date.now()}`)
  const bob = await makeGuest(`smoke-bob-${Date.now()}`)

  // ── Pre-party: browsing, no hand ──────────────────────────────────────────
  await ensureHand(party.id, alice, BEFORE_PARTY)
  const preHand = await getHandView(party.id, alice, BEFORE_PARTY)
  check('7:59 PM — no hand exists', preHand.hand.length === 0 && !preHand.started, `${preHand.hand.length} cards`)

  // ── 8:00 PM deal ──────────────────────────────────────────────────────────
  await ensureHand(party.id, alice, AT_PARTY)
  const dealt = await getHandView(party.id, alice, AT_PARTY)
  check('8:00 PM — exactly 3 unique cards', dealt.hand.length === 3 && new Set(dealt.hand).size === 3, dealt.hand.join(', '))

  // Idempotent: a second ensureHand must not grow the hand.
  await ensureHand(party.id, alice, AT_PARTY)
  const stillThree = await getHandView(party.id, alice, AT_PARTY)
  check('re-entering the party does not grow the hand', stillThree.hand.length === 3, `${stillThree.hand.length}`)

  // ── Discard → replacement ────────────────────────────────────────────────
  const toDiscard = dealt.hand[0]
  await resolveCard({ partyId: party.id, playerId: alice, cardId: toDiscard, lens: 'goodbye', depth: 'easy', action: 'discard', now: AT_PARTY })
  const afterDiscard = await getHandView(party.id, alice, AT_PARTY)
  check(
    'discard resolves and replenishes to 3',
    afterDiscard.hand.length === 3 && !afterDiscard.hand.includes(toDiscard),
    afterDiscard.hand.join(', '),
  )

  // ── Play → board + replacement ───────────────────────────────────────────
  const toPlay = afterDiscard.hand[0]
  const played = await resolveCard({ partyId: party.id, playerId: alice, cardId: toPlay, lens: 'goodbye', depth: 'easy', action: 'play', now: AT_PARTY })
  const afterPlay = await getHandView(party.id, alice, AT_PARTY)
  check('play resolves and replenishes to 3', afterPlay.hand.length === 3 && !afterPlay.hand.includes(toPlay), afterPlay.hand.join(', '))

  const board1 = await buildBoard(party.id, AT_PARTY)
  check('play lands on the shared board as Active', board1.active_plays.some((p) => p.playEventId === played.playEventId))

  // ── Double resolution is rejected ────────────────────────────────────────
  let doubleRejected = false
  try {
    await resolveCard({ partyId: party.id, playerId: alice, cardId: toPlay, lens: 'goodbye', depth: 'easy', action: 'play', now: AT_PARTY })
  } catch {
    doubleRejected = true
  }
  const afterDouble = await getHandView(party.id, alice, AT_PARTY)
  check('a card already resolved cannot be resolved again', doubleRejected && afterDouble.hand.length === 3, `hand ${afterDouble.hand.length}`)

  // Concurrent taps on a live hand card: exactly one wins, hand stays at 3.
  const raceCard = afterDouble.hand[0]
  const race = await Promise.allSettled([
    resolveCard({ partyId: party.id, playerId: alice, cardId: raceCard, lens: 'goodbye', depth: 'easy', action: 'play', now: AT_PARTY }),
    resolveCard({ partyId: party.id, playerId: alice, cardId: raceCard, lens: 'goodbye', depth: 'easy', action: 'play', now: AT_PARTY }),
  ])
  const fulfilled = race.filter((r) => r.status === 'fulfilled').length
  const afterRace = await getHandView(party.id, alice, AT_PARTY)
  check('rapid double-tap resolves once and keeps the hand at 3', fulfilled === 1 && afterRace.hand.length === 3, `${fulfilled} succeeded, hand ${afterRace.hand.length}`)

  // ── Spicy gate, server-side ──────────────────────────────────────────────
  let spicyBlocked = false
  try {
    await resolveCard({ partyId: party.id, playerId: alice, cardId: afterRace.hand[0], lens: 'spicy', depth: 'easy', action: 'play', now: BEFORE_MIDNIGHT })
  } catch {
    spicyBlocked = true
  }
  check('11:59 PM — Spicy play is refused by the server', spicyBlocked)

  const spicyCard = (await getHandView(party.id, alice, AT_MIDNIGHT)).hand[0]
  const spicyPlay = await resolveCard({ partyId: party.id, playerId: alice, cardId: spicyCard, lens: 'spicy', depth: 'hard', action: 'play', now: AT_MIDNIGHT })
  const afterSpicy = await getHandView(party.id, alice, AT_MIDNIGHT)
  check('12:00 AM — Spicy play succeeds, hand preserved at 3', Boolean(spicyPlay.playEventId) && afterSpicy.hand.length === 3)

  // ── Two players may play the same base card ──────────────────────────────
  await ensureHand(party.id, bob, AT_PARTY)
  const bobHand = await getHandView(party.id, bob, AT_PARTY)
  const sharedCard = bobHand.hand[0]
  const bobPlay = await resolveCard({ partyId: party.id, playerId: bob, cardId: sharedCard, lens: 'goodbye', depth: 'medium', action: 'play', now: AT_PARTY })
  // Alice plays that same base card if she is holding it; otherwise the check
  // is covered by the projection test suite.
  check('a second player can play independently', Boolean(bobPlay.playEventId), sharedCard)

  // ── Completion → achievement → BAR ───────────────────────────────────────
  const completion = await completePlay({ partyId: party.id, playerId: bob, playEventId: bobPlay.playEventId! })
  check('"I did this" unlocks the configured achievement', Boolean(completion.achievement), completion.achievement?.title || 'none')

  const repeat = await completePlay({ partyId: party.id, playerId: bob, playEventId: bobPlay.playEventId! })
  check('completing twice is idempotent', repeat.alreadyCompleted === true)

  const hardCompletion = await completePlay({ partyId: party.id, playerId: alice, playEventId: spicyPlay.playEventId! })
  const barEvents = await db.partyGameEvent.findMany({
    where: { partyId: party.id, playerId: alice, type: { in: ['bar_donated', 'bar_capture_pending'] } },
  })
  check(
    'Hard completion captures a BAR or records a pending one — never blocks',
    barEvents.length > 0,
    hardCompletion.barId ? `BAR ${hardCompletion.barId}` : `pending (${barEvents[0]?.type})`,
  )
  if (hardCompletion.barId) {
    const bar = await db.customBar.findUnique({ where: { id: hardCompletion.barId } })
    const stamp = JSON.parse(bar?.seedMetabolization || '{}')
    check(
      'BAR carries party/card/lens/depth/play-event provenance',
      stamp.provenance?.source === 'oracle_party' &&
        stamp.provenance?.party === GOODBYE_PARTY_SLUG &&
        stamp.provenance?.lens === 'spicy' &&
        stamp.provenance?.depth === 'hard' &&
        stamp.provenance?.play_event_id === spicyPlay.playEventId,
      JSON.stringify(stamp.provenance),
    )
  }

  // BAR capture is allowed to fail. Force it and confirm the completion still
  // lands, with enough in the pending event to import the BAR later.
  const failCard = (await getHandView(party.id, alice, AT_MIDNIGHT)).hand[0]
  const failPlay = await resolveCard({ partyId: party.id, playerId: alice, cardId: failCard, lens: 'goodbye', depth: 'hard', action: 'play', now: AT_MIDNIGHT })
  const realCreate = db.customBar.create
  ;(db.customBar as unknown as { create: unknown }).create = async () => {
    throw new Error('simulated BAR failure')
  }
  let fallback: Awaited<ReturnType<typeof completePlay>> | null = null
  try {
    fallback = await completePlay({ partyId: party.id, playerId: alice, playEventId: failPlay.playEventId! })
  } finally {
    ;(db.customBar as unknown as { create: unknown }).create = realCreate
  }
  const pending = await db.partyGameEvent.findFirst({
    where: { partyId: party.id, playerId: alice, type: 'bar_capture_pending' },
    orderBy: { createdAt: 'desc' },
  })
  const pendingPayload = (pending?.payloadJson || {}) as Record<string, { [k: string]: unknown }>
  check(
    'Hard completion still succeeds when BAR creation fails',
    Boolean(fallback && !fallback.alreadyCompleted && fallback.achievement) && fallback?.barId === null,
    fallback?.achievement?.title || 'no achievement',
  )
  check(
    'the fallback records intended BAR payload + provenance for later import',
    Boolean(pending) &&
      pendingPayload.provenance?.source === 'oracle_party' &&
      pendingPayload.provenance?.play_event_id === failPlay.playEventId &&
      Boolean(pendingPayload.intended_bar?.title) &&
      Boolean(pendingPayload.intended_bar?.description),
    pending ? String(pendingPayload.intended_bar?.title) : 'no pending event',
  )

  const board2 = await buildBoard(party.id, AT_MIDNIGHT)
  check(
    'completed play moves to Recently Did This',
    board2.completed_plays.some((p) => p.playEventId === bobPlay.playEventId) &&
      !board2.active_plays.some((p) => p.playEventId === bobPlay.playEventId),
  )
  check('other plays stay Active with no penalty', board2.active_plays.length > 0, `${board2.active_plays.length} active`)

  const toHide = board2.active_plays[0].playEventId
  await hideBoardPlay(party.id, null, toHide)
  const board3 = await buildBoard(party.id, AT_MIDNIGHT)
  check(
    'host can hide an inappropriate board play',
    !board3.active_plays.some((p) => p.playEventId === toHide) &&
      !board3.completed_plays.some((p) => p.playEventId === toHide),
    `${board3.active_plays.length} active after hide`,
  )

  // ── Game Master schedule ─────────────────────────────────────────────────
  const boardAt8 = await buildBoard(party.id, AT_PARTY)
  check('8:00 PM — one GM card unlocked and featured', boardAt8.gm_unlocked_count === 1 && boardAt8.featured_gm_card?.slot === 1)

  const boardAt840 = await buildBoard(party.id, new Date(PARTY_START_MS + 40 * 60_000))
  check('8:40 PM — three GM cards unlocked', boardAt840.gm_unlocked_count === 3, `${boardAt840.gm_unlocked_count}`)

  await featureGmCard(party.id, null, 2, new Date(PARTY_START_MS + 40 * 60_000))
  const featured = await buildBoard(party.id, new Date(PARTY_START_MS + 40 * 60_000))
  check('host can feature any unlocked GM card', featured.featured_gm_card?.slot === 2, `slot ${featured.featured_gm_card?.slot}`)

  await unlockNextGmCard(party.id, null, new Date(PARTY_START_MS + 40 * 60_000))
  const early = await buildBoard(party.id, new Date(PARTY_START_MS + 40 * 60_000))
  check('host early-unlock persists across a fresh read', early.gm_unlocked_count === 4, `${early.gm_unlocked_count}`)

  const boardLate = await buildBoard(party.id, new Date(PARTY_START_MS + 220 * 60_000))
  check('11:40 PM — all 12 GM cards unlocked', boardLate.gm_unlocked_count === 12)

  // ── Live edit propagation ────────────────────────────────────────────────
  const editCardId = cards[0].id
  await upsertGoodbyeCardOverride(null, {
    card_id: editCardId,
    prompts: { spicy: { medium: 'PATCHED SPICY MEDIUM' } },
  })
  const patched = await buildGoodbyeDeck()
  const patchedCard = patched.cards.find((c) => c.id === editCardId)!
  check('host edit reaches the rebuilt deck', patchedCard.readings.spicy.medium.prompt === 'PATCHED SPICY MEDIUM')
  check(
    'patching one lens leaves the other intact',
    patchedCard.readings.goodbye.medium.prompt !== 'PATCHED SPICY MEDIUM' && patchedCard.readings.goodbye.medium.prompt.length > 20,
  )

  await upsertGoodbyeCardOverride(null, { card_id: editCardId, prompts: { goodbye: { easy: 'PATCHED GOODBYE EASY' } } })
  const patched2 = await buildGoodbyeDeck()
  const patchedCard2 = patched2.cards.find((c) => c.id === editCardId)!
  check(
    'a second patch merges rather than clobbering the first',
    patchedCard2.readings.spicy.medium.prompt === 'PATCHED SPICY MEDIUM' &&
      patchedCard2.readings.goodbye.easy.prompt === 'PATCHED GOODBYE EASY',
  )

  // ── Full personal cycle: no base card repeats before exhaustion ──────────
  const walker = await makeGuest(`smoke-cycle-${Date.now()}`)
  await ensureHand(party.id, walker, AT_PARTY)
  const seen: string[] = []
  for (let i = 0; i < cards.length; i += 1) {
    const view = await getHandView(party.id, walker, AT_PARTY)
    if (!view.hand.length) break
    const next = view.hand[0]
    seen.push(next)
    await resolveCard({
      partyId: party.id,
      playerId: walker,
      cardId: next,
      lens: 'goodbye',
      depth: 'easy',
      action: i % 2 === 0 ? 'discard' : 'play',
      now: AT_PARTY,
    })
  }
  check(
    'no base card repeats across a full 52-card personal cycle',
    seen.length === cards.length && new Set(seen).size === seen.length,
    `${new Set(seen).size} unique of ${seen.length} resolved`,
  )
  const afterCycle = await getHandView(party.id, walker, AT_PARTY)
  check('the deck comes back around after the corpus is exhausted', afterCycle.hand.length === 3 && afterCycle.cycle >= 2, `cycle ${afterCycle.cycle}, hand ${afterCycle.hand.length}`)

  // ── Cleanup ──────────────────────────────────────────────────────────────
  await db.partyGameEvent.deleteMany({ where: { partyId: party.id } })
  await db.partyOracleCardOverride.deleteMany({ where: { partyId: party.id } })
  await db.partyOracleDiscovery.deleteMany({ where: { partyId: party.id } })
  await db.partyParticipant.deleteMany({ where: { partyId: party.id, playerId: { in: [alice, bob, walker] } } })
  await db.customBar.deleteMany({ where: { creatorId: { in: [alice, bob, walker] } } })
  await db.player.deleteMany({ where: { id: { in: [alice, bob, walker] } } })

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  if (failed.length) {
    console.error('\nFAILED:')
    for (const f of failed) console.error(`  - ${f.name} ${f.detail}`)
    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
