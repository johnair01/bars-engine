import 'server-only'

import path from 'path'
import { readFile } from 'fs/promises'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import {
  DEPTHS,
  GM_SLOT_COUNT,
  GOODBYE_PALETTE,
  GOODBYE_PARTY_SLUG,
  HAND_SIZE,
  LENSES,
  type Depth,
  type Lens,
} from './config'
import { GM_SLOTS, PARTY_META, gmSlot } from './data/party'
import {
  getReading,
  getReadingAchievement,
  playableCardIds,
  readingRequiresBar,
  type PartyReading,
} from './interpretations'
import {
  deriveAchievements,
  deriveBoardPlays,
  deriveGmState,
  deriveHandState,
  drawablePool,
  planDraws,
  type BoardPlay,
  type GameEvent,
} from './events'
import { gmSlotsUnlockedByClock, isPartyStarted, isSpicyPlayUnlocked } from './time'

const PARTY_ADMIN_TOKEN =
  process.env.GOODBYE_PARTY_ADMIN_TOKEN || process.env.PARTY_ADMIN_TOKEN || 'yellow-brick-admin'
const PARTY_CONTACT_TYPE = 'party_guest'

function cleanText(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export function isLens(value: unknown): value is Lens {
  return typeof value === 'string' && (LENSES as readonly string[]).includes(value)
}

export function isDepth(value: unknown): value is Depth {
  return typeof value === 'string' && (DEPTHS as readonly string[]).includes(value)
}

async function readBaseOracleDeck() {
  const raw = await readFile(path.join(process.cwd(), 'public', 'oracle', 'deck.json'), 'utf8')
  return JSON.parse(raw)
}

/** The Goodbye party row. Slug-isolated: it can never touch Valkyrie's data. */
export async function ensureGoodbyeParty() {
  const themeJson = {
    title: PARTY_META.title,
    subtitle: PARTY_META.subtitle,
    ...GOODBYE_PALETTE,
  }
  return db.partyExperience.upsert({
    where: { slug: GOODBYE_PARTY_SLUG },
    update: {
      title: PARTY_META.title,
      subtitle: PARTY_META.subtitle,
      hostNote: PARTY_META.hostNote,
      themeJson,
      partyDateLabel: PARTY_META.dateLabel,
      location: PARTY_META.location,
      scheduleJson: [...PARTY_META.schedule],
    },
    create: {
      slug: GOODBYE_PARTY_SLUG,
      title: PARTY_META.title,
      subtitle: PARTY_META.subtitle,
      hostNote: PARTY_META.hostNote,
      storyJson: {},
      themeJson,
      partyDateLabel: PARTY_META.dateLabel,
      location: PARTY_META.location,
      scheduleJson: [...PARTY_META.schedule],
      invitationText: '',
    },
  })
}

async function ensureGuestInviteId() {
  const existing = await db.invite.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } })
  if (existing) return existing.id
  const created = await db.invite.create({
    data: { token: 'party-guest-system', maxUses: 999999, theme: 'party_guest' },
  })
  return created.id
}

/** Guest join, unchanged from the Valkyrie pattern apart from the slug namespace. */
export async function joinGoodbyeParty(input: {
  displayName: string
  email?: string
  keepPartyData?: boolean
  wantsFullSignup?: boolean
  clientSessionId?: string
}) {
  const party = await ensureGoodbyeParty()
  const currentPlayer = await getCurrentPlayer()
  const displayName = cleanText(input.displayName, 80)
  const email = cleanText(input.email, 120)
  const clientSessionId = cleanText(input.clientSessionId, 120)
  if (!displayName) throw new Error('Player name is required')

  let playerId = currentPlayer?.id || null
  if (!playerId) {
    if (!clientSessionId) throw new Error('Client session is required for guest join')
    const contactValue = `${GOODBYE_PARTY_SLUG}:${clientSessionId}`
    const existingGuest = await db.player.findUnique({
      where: { contactType_contactValue: { contactType: PARTY_CONTACT_TYPE, contactValue } },
      select: { id: true },
    })
    if (existingGuest) {
      playerId = existingGuest.id
      await db.player.update({ where: { id: playerId }, data: { name: displayName } })
    } else {
      const inviteId = await ensureGuestInviteId()
      const guest = await db.player.create({
        data: {
          name: displayName,
          contactType: PARTY_CONTACT_TYPE,
          contactValue,
          inviteId,
          onboardingMode: 'party_guest',
        },
        select: { id: true },
      })
      playerId = guest.id
    }
  }

  const participantId = `${party.id}:${playerId}`
  const participant = await db.partyParticipant.upsert({
    where: { id: participantId },
    update: {
      displayName,
      email: email || undefined,
      keepPartyData: input.keepPartyData !== false,
      wantsFullSignup: Boolean(input.wantsFullSignup),
      clientSessionId: clientSessionId || undefined,
      playerId,
    },
    create: {
      id: participantId,
      partyId: party.id,
      playerId,
      clientSessionId: clientSessionId || undefined,
      displayName,
      email: email || undefined,
      keepPartyData: input.keepPartyData !== false,
      wantsFullSignup: Boolean(input.wantsFullSignup),
    },
  })

  return { party, participant, playerId: playerId as string }
}

export async function isGoodbyePartyAdmin(playerId: string | null, adminToken?: string | null) {
  if (adminToken && cleanText(adminToken, 100) === PARTY_ADMIN_TOKEN) return true
  if (!playerId) return false
  const party = await ensureGoodbyeParty()
  const [adminRole, hostParticipant] = await Promise.all([
    db.playerRole.findFirst({ where: { playerId, role: { key: 'admin' } }, select: { id: true } }),
    db.partyParticipant.findFirst({
      where: { partyId: party.id, playerId, isHost: true },
      select: { id: true },
    }),
  ])
  return Boolean(adminRole || hostParticipant || party.createdByPlayerId === playerId)
}

// ── Deck assembly ───────────────────────────────────────────────────────────

export type PartyCard = {
  id: string
  suit: { code: string; name: string; domain: string; icon: string }
  rank: string
  title: string
  image_file: string
  uploaded?: boolean
  crop_saved?: boolean
  crop?: unknown
  /** Canonical Oracle flavor, untouched. */
  flavor: Record<Depth, { line: string; npc: string; title: string }>
  /** Canonical Oracle prompts, kept so existing card UI keeps working. */
  prompts: Record<Depth, string>
  /** Party interpretation layer: two lenses × three depths. */
  readings: Record<Lens, Record<Depth, PartyReading>>
}

/**
 * canonical Oracle + party interpretation JSON + live DB override.
 *
 * The DB override is the Game Master patch layer and wins last, so a bad
 * reading can be repaired mid-party without a redeploy. Overrides are stored
 * per lens under `promptsJson` as `{ goodbye: {easy,...}, spicy: {...} }`;
 * a flat `{easy,...}` override is treated as a Goodbye-lens patch so the
 * existing Valkyrie-shaped admin payload keeps working.
 */
export async function buildGoodbyeDeck(): Promise<{ cards: PartyCard[]; party: unknown }> {
  const party = await ensureGoodbyeParty()
  const baseDeck = await readBaseOracleDeck()
  const overrideRows = await db.partyOracleCardOverride.findMany({ where: { partyId: party.id } })
  const overrideMap = new Map(overrideRows.map((row) => [row.cardId, row]))
  const assetIds = overrideRows.map((row) => row.imageAssetId).filter(Boolean) as string[]
  const assets = assetIds.length
    ? await db.asset.findMany({ where: { id: { in: assetIds } }, select: { id: true, url: true } })
    : []
  const assetMap = new Map(assets.map((asset) => [asset.id, asset.url]))

  const cards: PartyCard[] = baseDeck.cards.map((card: Record<string, unknown>) => {
    const cardId = String(card.id)
    const override = overrideMap.get(cardId)
    const overridePrompts = (override?.promptsJson as Record<string, unknown>) || {}
    const overrideUrl = override?.imageAssetId ? assetMap.get(override.imageAssetId) : null

    const readings = {} as Record<Lens, Record<Depth, PartyReading>>
    for (const lens of LENSES) {
      const byDepth = {} as Record<Depth, PartyReading>
      const lensOverride =
        (overridePrompts[lens] as Record<string, unknown>) ||
        (lens === 'goodbye' ? overridePrompts : {})
      for (const depth of DEPTHS) {
        const generated = getReading(cardId, lens, depth)
        const patched = cleanText(lensOverride?.[depth], 600)
        byDepth[depth] = {
          // Fall back to the canonical Oracle prompt if a card somehow has no
          // party reading — the card stays playable either way.
          prompt: patched || generated?.prompt || String((card.prompts as Record<string, string>)?.[depth] || ''),
          emotionalAlchemy: generated?.emotionalAlchemy,
          achievement: generated?.achievement,
          hard: generated?.hard,
        }
      }
      readings[lens] = byDepth
    }

    return {
      ...(card as object),
      id: cardId,
      title: cleanText(override?.title, 80) || String(card.title),
      image_file: overrideUrl || String(card.image_file),
      crop: (override?.cropJson as unknown) || card.crop,
      crop_saved: override?.cropJson ? true : Boolean(card.crop_saved),
      readings,
    } as PartyCard
  })

  return {
    cards,
    party: {
      slug: party.slug,
      title: party.title,
      subtitle: party.subtitle,
      host_note: party.hostNote,
      date: party.partyDateLabel,
      location: party.location,
      schedule: Array.isArray(party.scheduleJson) ? party.scheduleJson : [],
      theme: party.themeJson,
    },
  }
}

/** The corpus a player draws from — cards that have party readings. */
function corpusIds(cards: PartyCard[]): string[] {
  const playable = new Set(playableCardIds())
  const ids = cards.filter((card) => playable.has(card.id)).map((card) => card.id)
  return ids.length ? ids : cards.map((card) => card.id)
}

// ── Event helpers ───────────────────────────────────────────────────────────

async function loadEvents(partyId: string, playerId?: string | null): Promise<GameEvent[]> {
  const rows = await db.partyGameEvent.findMany({
    where: { partyId, ...(playerId ? { playerId } : {}) },
    orderBy: { createdAt: 'asc' },
    select: { id: true, playerId: true, type: true, cardId: true, payloadJson: true, createdAt: true },
  })
  return rows as GameEvent[]
}

export async function appendEvent(input: {
  partyId: string
  playerId?: string | null
  type: string
  cardId?: string | null
  payload?: Record<string, unknown>
}) {
  return db.partyGameEvent.create({
    data: {
      partyId: input.partyId,
      playerId: input.playerId || null,
      type: input.type,
      cardId: input.cardId || null,
      payloadJson: (input.payload || {}) as never,
    },
    select: { id: true },
  })
}

/**
 * Serialize a player's hand mutations. Rapid taps queue behind this lock
 * instead of racing, so a card can never be resolved twice and the hand can
 * never exceed three.
 */
async function withPlayerLock<T>(
  partyId: string,
  playerId: string,
  fn: () => Promise<T>,
): Promise<T> {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${partyId}:${playerId}`}))`
      return fn()
    },
    { timeout: 15_000, maxWait: 15_000 },
  )
}

function pickRandom(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Hand ────────────────────────────────────────────────────────────────────

export type PlayerHandView = {
  started: boolean
  cycle: number
  hand: string[]
  resolved_count: number
  cycle_remaining: number
}

/**
 * Bring a joined player's hand up to three, dealing at the party start and
 * replenishing after every resolution. Before 8:00 PM this is a no-op: browsing
 * is free and no hand exists yet.
 */
export async function ensureHand(partyId: string, playerId: string, now = new Date()) {
  if (!isPartyStarted(now)) return
  const { cards } = await buildGoodbyeDeck()
  const corpus = corpusIds(cards)

  await withPlayerLock(partyId, playerId, async () => {
    const events = await loadEvents(partyId, playerId)
    const state = deriveHandState(events)
    if (state.hand.length >= HAND_SIZE) return

    const draws = planDraws(state, corpus, pickRandom)
    if (!draws.length) return

    const firstDeal = !events.some((event) => event.type === 'card_drawn')
    if (firstDeal) {
      await appendEvent({
        partyId,
        playerId,
        type: 'hand_dealt',
        payload: { cards: draws.map((draw) => draw.cardId), cycle: draws[0]?.cycle ?? 1 },
      })
    }
    for (const draw of draws) {
      await appendEvent({
        partyId,
        playerId,
        type: 'card_drawn',
        cardId: draw.cardId,
        payload: { cycle: draw.cycle },
      })
      // Discovery stays the exposure/history record; the hand lives in events.
      await db.partyOracleDiscovery
        .create({ data: { partyId, playerId, baseCardId: draw.cardId, source: 'draw' } })
        .catch(() => null)
    }
  })
}

export async function getHandView(
  partyId: string,
  playerId: string | null,
  now = new Date(),
): Promise<PlayerHandView> {
  if (!playerId) {
    return { started: isPartyStarted(now), cycle: 1, hand: [], resolved_count: 0, cycle_remaining: 0 }
  }
  const { cards } = await buildGoodbyeDeck()
  const corpus = corpusIds(cards)
  const events = await loadEvents(partyId, playerId)
  const state = deriveHandState(events)
  return {
    started: isPartyStarted(now),
    cycle: state.cycle,
    hand: state.hand,
    resolved_count: state.resolvedCount,
    cycle_remaining: drawablePool(state, corpus).length,
  }
}

/**
 * Resolve a card for the player's current cycle and immediately replenish.
 * `Play` also puts the card on the shared board; `Discard` is a first-class
 * move and costs nothing.
 */
export async function resolveCard(input: {
  partyId: string
  playerId: string
  cardId: string
  lens: Lens
  depth: Depth
  action: 'play' | 'discard'
  now?: Date
}): Promise<{ playEventId: string | null; hand: string[] }> {
  const now = input.now || new Date()
  if (!isPartyStarted(now)) throw new Error('The party has not started yet')
  if (input.action === 'play' && input.lens === 'spicy' && !isSpicyPlayUnlocked(now)) {
    throw new Error('Spicy play opens at midnight. Read all you like until then.')
  }

  const { cards } = await buildGoodbyeDeck()
  const corpus = corpusIds(cards)
  const card = cards.find((entry) => entry.id === input.cardId)
  if (!card) throw new Error('Unknown card')

  return withPlayerLock(input.partyId, input.playerId, async () => {
    const events = await loadEvents(input.partyId, input.playerId)
    const state = deriveHandState(events)
    if (!state.hand.includes(input.cardId)) {
      throw new Error('That card is no longer in your hand')
    }

    const reading = card.readings[input.lens][input.depth]
    const resolution = await appendEvent({
      partyId: input.partyId,
      playerId: input.playerId,
      type: input.action === 'play' ? 'card_played' : 'card_discarded',
      cardId: input.cardId,
      payload: {
        cycle: state.cycle,
        lens: input.lens,
        depth: input.depth,
        prompt: reading.prompt,
        card_title: card.title,
      },
    })

    const afterResolve = deriveHandState(
      await loadEvents(input.partyId, input.playerId),
    )
    const draws = planDraws(afterResolve, corpus, pickRandom)
    for (const draw of draws) {
      await appendEvent({
        partyId: input.partyId,
        playerId: input.playerId,
        type: 'card_drawn',
        cardId: draw.cardId,
        payload: { cycle: draw.cycle },
      })
      await db.partyOracleDiscovery
        .create({
          data: { partyId: input.partyId, playerId: input.playerId, baseCardId: draw.cardId, source: 'draw' },
        })
        .catch(() => null)
    }

    const finalState = deriveHandState(await loadEvents(input.partyId, input.playerId))
    return {
      playEventId: input.action === 'play' ? resolution.id : null,
      hand: finalState.hand,
    }
  })
}

// ── Completion, achievements, BAR ───────────────────────────────────────────

/**
 * Thin BAR adapter. A Hard completion is allowed to succeed whether or not the
 * BAR lands: on failure we record `bar_capture_pending` carrying the intended
 * payload and provenance so it can be metabolized later. No auth refactor.
 */
async function tryCaptureHardBar(input: {
  partyId: string
  playerId: string
  cardId: string
  lens: Lens
  depth: Depth
  playEventId: string
  prompt: string
  cardTitle: string
}) {
  const provenance = {
    source: 'oracle_party',
    party: GOODBYE_PARTY_SLUG,
    card_id: input.cardId,
    lens: input.lens,
    depth: input.depth,
    play_event_id: input.playEventId,
  }
  const title = `${input.cardTitle} — ${input.lens === 'spicy' ? 'Spicy' : 'Goodbye'} (Hard)`
  const description = `${input.prompt}\n\nDone at Goodbye Yellow Brick Road, ${PARTY_META.dateLabel}.`

  try {
    const bar = await db.customBar.create({
      data: {
        creatorId: input.playerId,
        title: title.slice(0, 200),
        description,
        type: 'bar',
        reward: 0,
        visibility: 'private',
        status: 'active',
        inputs: '[]',
        rootId: 'temp',
        seedMetabolization: JSON.stringify({
          maturity: 'captured',
          soilKind: 'holding_pen',
          provenance,
        }),
      },
      select: { id: true },
    })
    await db.customBar.update({ where: { id: bar.id }, data: { rootId: bar.id } })
    await appendEvent({
      partyId: input.partyId,
      playerId: input.playerId,
      type: 'bar_donated',
      cardId: input.cardId,
      payload: { bar_id: bar.id, provenance },
    })
    return { barId: bar.id }
  } catch (error) {
    // Capture must never block play. Keep everything needed to import later.
    await appendEvent({
      partyId: input.partyId,
      playerId: input.playerId,
      type: 'bar_capture_pending',
      cardId: input.cardId,
      payload: {
        provenance,
        intended_bar: { title, description, visibility: 'private', type: 'bar' },
        error: error instanceof Error ? error.message : 'unknown error',
      },
    })
    return { barId: null }
  }
}

/**
 * "I did this" — optional, and only ever for the player's own play. Completion
 * is what unlocks the achievement, not pressing Play. A card may stay Active
 * forever with no penalty.
 */
export async function completePlay(input: {
  partyId: string
  playerId: string
  playEventId: string
  note?: string
}) {
  const playEvent = await db.partyGameEvent.findUnique({ where: { id: input.playEventId } })
  if (!playEvent || playEvent.partyId !== input.partyId || playEvent.type !== 'card_played') {
    throw new Error('Play not found')
  }
  if (playEvent.playerId !== input.playerId) throw new Error('Only the player who played this card can complete it')

  // Completion is idempotent — a double tap must not unlock the achievement twice.
  const already = await db.partyGameEvent.count({
    where: {
      partyId: input.partyId,
      type: 'card_completed',
      payloadJson: { path: ['playEventId'], equals: input.playEventId },
    },
  })
  if (already > 0) {
    return { alreadyCompleted: true, achievement: null, barId: null }
  }

  const payload = (playEvent.payloadJson || {}) as Record<string, unknown>
  const lens = isLens(payload.lens) ? payload.lens : 'goodbye'
  const depth = isDepth(payload.depth) ? payload.depth : 'easy'
  const cardId = playEvent.cardId || ''

  await appendEvent({
    partyId: input.partyId,
    playerId: input.playerId,
    type: 'card_completed',
    cardId,
    payload: {
      playEventId: input.playEventId,
      lens,
      depth,
      note: cleanText(input.note, 280),
    },
  })

  const achievement = getReadingAchievement(cardId, lens, depth)
  if (achievement) {
    await appendEvent({
      partyId: input.partyId,
      playerId: input.playerId,
      type: 'achievement_unlocked',
      cardId,
      payload: { playEventId: input.playEventId, achievement, lens, depth },
    })
  }

  let barId: string | null = null
  if (depth === 'hard' && readingRequiresBar(cardId, lens, depth)) {
    const result = await tryCaptureHardBar({
      partyId: input.partyId,
      playerId: input.playerId,
      cardId,
      lens,
      depth,
      playEventId: input.playEventId,
      prompt: String(payload.prompt || ''),
      cardTitle: String(payload.card_title || cardId),
    })
    barId = result.barId
  }

  return { alreadyCompleted: false, achievement, barId }
}

// ── Board + GM deck ─────────────────────────────────────────────────────────

export async function buildBoard(partyId: string, now = new Date()) {
  const [events, { cards }] = await Promise.all([loadEvents(partyId), buildGoodbyeDeck()])
  const cardMap = new Map(cards.map((card) => [card.id, card]))
  const { active, completed, hidden } = deriveBoardPlays(events)
  const playEvents = new Map(events.filter((event) => event.type === 'card_played').map((e) => [e.id, e]))

  const playerIds = Array.from(
    new Set(events.map((event) => event.playerId).filter(Boolean) as string[]),
  )
  const participants = playerIds.length
    ? await db.partyParticipant.findMany({
        where: { partyId, playerId: { in: playerIds } },
        select: { playerId: true, displayName: true },
      })
    : []
  const nameMap = new Map(participants.map((row) => [row.playerId as string, row.displayName]))

  const toPlay = (eventId: string): BoardPlay | null => {
    const event = playEvents.get(eventId)
    if (!event) return null
    const payload = (event.payloadJson || {}) as Record<string, unknown>
    const lens = isLens(payload.lens) ? payload.lens : 'goodbye'
    const depth = isDepth(payload.depth) ? payload.depth : 'easy'
    const completedAt = completed.get(eventId)
    const achievement = completedAt ? getReadingAchievement(event.cardId || '', lens, depth) : null
    return {
      playEventId: event.id,
      playerId: event.playerId,
      playerName: (event.playerId && nameMap.get(event.playerId)) || 'Someone',
      cardId: event.cardId || '',
      lens,
      depth,
      prompt: String(payload.prompt || ''),
      cardTitle: String(payload.card_title || cardMap.get(event.cardId || '')?.title || ''),
      playedAt: event.createdAt.toISOString(),
      completedAt: completedAt ? completedAt.toISOString() : null,
      achievement: achievement
        ? {
            id: achievement.id,
            family: achievement.family,
            title: achievement.title,
            affordance: achievement.affordance,
          }
        : null,
    }
  }

  const activePlays = active
    .map(toPlay)
    .filter(Boolean)
    .reverse() as BoardPlay[]

  const completedPlays = Array.from(completed.keys())
    .filter((id) => !hidden.has(id))
    .map(toPlay)
    .filter(Boolean)
    .sort((a, b) => (b as BoardPlay).completedAt!.localeCompare((a as BoardPlay).completedAt!)) as BoardPlay[]

  const { unlockedCount, featuredSlot } = deriveGmState(
    events,
    gmSlotsUnlockedByClock(now),
    GM_SLOT_COUNT,
  )

  return {
    featured_gm_card: featuredSlot ? gmSlot(featuredSlot) : null,
    unlocked_gm_cards: GM_SLOTS.slice(0, unlockedCount),
    gm_unlocked_count: unlockedCount,
    gm_total: GM_SLOT_COUNT,
    active_plays: activePlays,
    completed_plays: completedPlays.slice(0, 30),
  }
}

export async function featureGmCard(partyId: string, playerId: string | null, slot: number, now = new Date()) {
  const events = await loadEvents(partyId)
  const { unlockedCount } = deriveGmState(events, gmSlotsUnlockedByClock(now), GM_SLOT_COUNT)
  if (slot < 1 || slot > unlockedCount) throw new Error('That Game Master card is not unlocked yet')
  await appendEvent({ partyId, playerId, type: 'gm_card_featured', payload: { slot } })
  return { featured_slot: slot }
}

/** Host may pull the next slot forward. Nothing ever re-locks. */
export async function unlockNextGmCard(partyId: string, playerId: string | null, now = new Date()) {
  const events = await loadEvents(partyId)
  const { unlockedCount } = deriveGmState(events, gmSlotsUnlockedByClock(now), GM_SLOT_COUNT)
  const next = unlockedCount + 1
  if (next > GM_SLOT_COUNT) throw new Error('All Game Master cards are already unlocked')
  await appendEvent({ partyId, playerId, type: 'gm_card_unlocked', payload: { slot: next, early: true } })
  return { unlocked_count: next }
}

export async function hideBoardPlay(partyId: string, playerId: string | null, playEventId: string) {
  await appendEvent({
    partyId,
    playerId,
    type: 'host_override',
    payload: { action: 'hide_play', playEventId },
  })
  return { hidden: playEventId }
}

/** Live Game Master patch layer — same override table the Valkyrie admin uses. */
export async function upsertGoodbyeCardOverride(playerId: string | null, input: Record<string, unknown>) {
  const party = await ensureGoodbyeParty()
  const cardId = cleanText(input.card_id || input.cardId, 40)
  if (!cardId) throw new Error('card_id is required')
  const existing = await db.partyOracleCardOverride.findUnique({
    where: { partyId_cardId: { partyId: party.id, cardId } },
  })
  const currentPrompts = (existing?.promptsJson as Record<string, unknown>) || {}
  const incoming = (input.prompts as Record<string, unknown>) || {}
  // Merge per lens so patching Spicy never blanks a Goodbye repair.
  const promptsJson: Record<string, unknown> = { ...currentPrompts }
  for (const lens of LENSES) {
    const patch = incoming[lens] as Record<string, unknown> | undefined
    if (!patch) continue
    promptsJson[lens] = { ...((currentPrompts[lens] as object) || {}), ...patch }
  }

  return db.partyOracleCardOverride.upsert({
    where: { partyId_cardId: { partyId: party.id, cardId } },
    update: {
      title: cleanText(input.title, 80) || undefined,
      promptsJson: promptsJson as never,
      updatedByPlayerId: playerId || undefined,
    },
    create: {
      partyId: party.id,
      cardId,
      title: cleanText(input.title, 80) || undefined,
      promptsJson: promptsJson as never,
      updatedByPlayerId: playerId || undefined,
    },
  })
}

// ── Whole-party payload ─────────────────────────────────────────────────────

export async function buildGoodbyePayload(playerId: string | null, now = new Date()) {
  const party = await ensureGoodbyeParty()
  if (playerId) await ensureHand(party.id, playerId, now)

  const [deck, board, hand, playerEvents] = await Promise.all([
    buildGoodbyeDeck(),
    buildBoard(party.id, now),
    getHandView(party.id, playerId, now),
    playerId ? loadEvents(party.id, playerId) : Promise.resolve([] as GameEvent[]),
  ])

  return {
    party: deck.party,
    cards: deck.cards,
    board,
    hand,
    achievements: deriveAchievements(playerEvents),
    gates: {
      party_started: isPartyStarted(now),
      spicy_play_unlocked: isSpicyPlayUnlocked(now),
      server_time: now.toISOString(),
    },
  }
}

export async function getGoodbyePartyId() {
  const party = await ensureGoodbyeParty()
  return party.id
}
