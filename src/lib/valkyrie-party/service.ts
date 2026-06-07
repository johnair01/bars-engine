import 'server-only'

import { cookies } from 'next/headers'
import path from 'path'
import { readFile } from 'fs/promises'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import partyMeta from '@/lib/valkyrie-party/data/deck.json'
import promptOverrides from '@/lib/valkyrie-party/data/prompt-overrides.json'
import seedQuestCards from '@/lib/valkyrie-party/data/quest-cards.json'
import staticCardOverrides from '@/lib/valkyrie-party/data/card-overrides.json'

export const VALKYRIE_PARTY_SLUG = 'valkyrie-party'
const PARTY_ADMIN_TOKEN = process.env.VALKYRIE_PARTY_ADMIN_TOKEN || process.env.PARTY_ADMIN_TOKEN || 'valkyrie-admin'
const PARTY_CONTACT_TYPE = 'party_guest'
export const PARTY_REACTIONS = ['triumph', 'poignance', 'bliss', 'excitement', 'peace'] as const
const DEPTHS = ['easy', 'medium', 'hard'] as const

function cleanText(value: unknown, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function valkyrieText(value: any): any {
  if (typeof value === 'string') {
    return value
      .replaceAll("Casey's", "Valkyrie's")
      .replaceAll('Casey’s', 'Valkyrie’s')
      .replaceAll('Casey', 'Valkyrie')
      .replaceAll(' he ', ' they ')
      .replaceAll(' him ', ' them ')
      .replaceAll(' his ', ' their ')
      .replaceAll('He ', 'They ')
      .replaceAll('Him ', 'Them ')
      .replaceAll('His ', 'Their ')
  }
  if (Array.isArray(value)) return value.map(valkyrieText)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, valkyrieText(v)]))
  return value
}

async function readBaseOracleDeck() {
  const raw = await readFile(path.join(process.cwd(), 'public', 'oracle', 'deck.json'), 'utf8')
  return JSON.parse(raw)
}

export async function ensurePartyExperience() {
  const meta: any = partyMeta
  return db.partyExperience.upsert({
    where: { slug: VALKYRIE_PARTY_SLUG },
    update: {
      title: meta.deck_name,
      subtitle: meta.theme?.subtitle || '',
      hostNote: meta.party?.host_note || '',
      storyJson: meta.story || {},
      themeJson: meta.theme || {},
      partyDateLabel: meta.party?.date || null,
      location: meta.party?.location || null,
      scheduleJson: meta.party?.schedule || [],
      invitationText: '',
    },
    create: {
      slug: VALKYRIE_PARTY_SLUG,
      title: meta.deck_name,
      subtitle: meta.theme?.subtitle || '',
      hostNote: meta.party?.host_note || '',
      storyJson: meta.story || {},
      themeJson: meta.theme || {},
      partyDateLabel: meta.party?.date || null,
      location: meta.party?.location || null,
      scheduleJson: meta.party?.schedule || [],
      invitationText: '',
    },
  })
}

export async function getPartyPlayerId() {
  const player = await getCurrentPlayer()
  return player?.id || null
}

async function ensureGuestInviteId() {
  const existing = await db.invite.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } })
  if (existing) return existing.id
  const created = await db.invite.create({ data: { token: 'party-guest-system', maxUses: 999999, theme: 'party_guest' } })
  return created.id
}

export async function joinParty(input: { displayName: string; email?: string; keepPartyData?: boolean; wantsFullSignup?: boolean; clientSessionId?: string }) {
  const party = await ensurePartyExperience()
  const currentPlayer = await getCurrentPlayer()
  const displayName = cleanText(input.displayName, 80)
  const email = cleanText(input.email, 120)
  const clientSessionId = cleanText(input.clientSessionId, 120)
  if (!displayName) throw new Error('Player name is required')

  let playerId = currentPlayer?.id || null
  if (!playerId) {
    if (!clientSessionId) throw new Error('Client session is required for guest join')
    const contactValue = `${VALKYRIE_PARTY_SLUG}:${clientSessionId}`
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

  return { party, participant, playerId }
}

async function getPlayerNameMap(playerIds: string[]) {
  const uniqueIds = Array.from(new Set(playerIds.filter(Boolean)))
  if (!uniqueIds.length) return new Map<string, string>()
  const players = await db.player.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, name: true } })
  return new Map(players.map((player) => [player.id, player.name]))
}

async function getAssetMap(assetIds: string[]) {
  const uniqueIds = Array.from(new Set(assetIds.filter(Boolean)))
  if (!uniqueIds.length) return new Map<string, { id: string; url: string; mimeType: string | null; metadataJson: string | null }>()
  const assets = await db.asset.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, url: true, mimeType: true, metadataJson: true } })
  return new Map(assets.map((asset) => [asset.id, asset]))
}

function buildPromptSummary(card: any) {
  return card?.prompts?.hard || card?.prompts?.medium || card?.prompts?.easy || ''
}

function cardSummary(card: any) {
  if (!card) return null
  return {
    id: card.id,
    title: card.title,
    rank: card.rank,
    suit: card.suit,
    image_file: card.image_file,
    uploaded: card.uploaded,
    crop_saved: card.crop_saved,
    crop: card.crop,
    prompt: buildPromptSummary(card),
  }
}

export async function buildPartyDeck() {
  const party = await ensurePartyExperience()
  const baseDeck = valkyrieText(await readBaseOracleDeck())
  const overrides = promptOverrides as Record<string, any>
  const cardOverrideRows = await db.partyOracleCardOverride.findMany({ where: { partyId: party.id } })
  const cardOverrideMap = new Map(cardOverrideRows.map((row) => [row.cardId, row]))
  const overrideAssetMap = await getAssetMap(cardOverrideRows.map((row) => row.imageAssetId || ''))
  const cards = baseDeck.cards.map((card: any) => {
    const prompts = overrides[card.id]
    const staticOverride = (staticCardOverrides as Record<string, any>)[card.id]
    const dynamicOverride = cardOverrideMap.get(card.id)
    const asset = dynamicOverride?.imageAssetId ? overrideAssetMap.get(dynamicOverride.imageAssetId) : null
    return {
      ...card,
      title: cleanText(dynamicOverride?.title, 80) || cleanText(staticOverride?.title, 80) || card.title,
      image_file: asset?.url || card.image_file,
      crop: (dynamicOverride?.cropJson as any) || card.crop,
      crop_saved: dynamicOverride?.cropJson ? true : card.crop_saved,
      flavor: {
        easy: { ...card.flavor.easy, ...(staticOverride?.flavor?.easy || {}), ...(((dynamicOverride?.flavorJson as any)?.easy) || {}) },
        medium: { ...card.flavor.medium, ...(staticOverride?.flavor?.medium || {}), ...(((dynamicOverride?.flavorJson as any)?.medium) || {}) },
        hard: { ...card.flavor.hard, ...(staticOverride?.flavor?.hard || {}), ...(((dynamicOverride?.flavorJson as any)?.hard) || {}) },
      },
      prompts: {
        easy: cleanText((dynamicOverride?.promptsJson as any)?.easy, 320) || prompts?.easy || card.prompts.easy,
        medium: cleanText((dynamicOverride?.promptsJson as any)?.medium, 320) || prompts?.medium || card.prompts.medium,
        hard: cleanText((dynamicOverride?.promptsJson as any)?.hard, 320) || prompts?.hard || card.prompts.hard,
      },
    }
  })

  const [playerCards, questRows] = await Promise.all([
    db.partyPlayerCard.findMany({ where: { partyId: party.id }, orderBy: { createdAt: 'desc' } }),
    db.partyQuestCard.findMany({ where: { partyId: party.id }, orderBy: [{ seed: 'desc' }, { createdAt: 'desc' }] }),
  ])
  const playerNameMap = await getPlayerNameMap([
    ...playerCards.map((row) => row.authorPlayerId),
    ...questRows.map((row) => row.authorPlayerId || ''),
  ])

  const questCards = questRows.length
    ? questRows.map((row) => ({
        id: row.id,
        title: row.title,
        prompt: row.prompt,
        category: row.category,
        kind: row.kind,
        face: row.face,
        wave_mode: row.waveMode,
        materials: row.materials,
        author: row.authorPlayerId ? playerNameMap.get(row.authorPlayerId) || 'Anonymous' : 'Anonymous',
        wave: row.waveJson as any,
        game_master: row.gameMasterJson as any,
        created_at: row.createdAt.toISOString(),
        seed: row.seed,
      }))
    : (seedQuestCards as any[])

  return {
    ...baseDeck,
    deck_slug: (partyMeta as any).deck_slug,
    deck_name: party.title,
    for: 'Valkyrie',
    made_by: (partyMeta as any).made_by,
    forked_from: (partyMeta as any).forked_from,
    theme: party.themeJson,
    story: party.storyJson,
    party: {
      date: party.partyDateLabel,
      location: party.location,
      host_note: party.hostNote,
      schedule: Array.isArray(party.scheduleJson) ? party.scheduleJson : [],
    },
    cards,
    base_total_cards: cards.length,
    total_cards: cards.length,
    player_cards: playerCards.map((row) => ({
      id: row.id,
      base_card_id: row.baseCardId,
      title: row.title,
      prompt: row.prompt,
      flavor: row.flavor,
      author: playerNameMap.get(row.authorPlayerId) || 'Anonymous',
      created_at: row.createdAt.toISOString(),
    })),
    quest_cards: questCards,
  }
}

export async function buildPartyPayload() {
  const party = await ensurePartyExperience()
  const [deck, participants] = await Promise.all([
    buildPartyDeck(),
    db.partyParticipant.findMany({ where: { partyId: party.id }, orderBy: { createdAt: 'desc' } }),
  ])
  return {
    deck,
    signups: participants.map((row) => ({
      id: row.id,
      name: row.displayName,
      email: row.email || '',
      wants_full_signup: row.wantsFullSignup,
      keep_party_data: row.keepPartyData,
    })),
  }
}

export async function recordDiscovery(playerId: string, baseCardId: string, source = 'draw') {
  const party = await ensurePartyExperience()
  return db.partyOracleDiscovery.create({ data: { partyId: party.id, playerId, baseCardId, source } })
}

export async function buildDiscoveryDeck(playerId: string, isAdmin = false) {
  const [partyDeck, party] = await Promise.all([buildPartyDeck(), ensurePartyExperience()])
  const found = await db.partyOracleDiscovery.findMany({ where: { partyId: party.id, playerId }, select: { baseCardId: true } })
  const foundSet = new Set(found.map((row) => row.baseCardId))
  return {
    player: playerId,
    discovered_count: isAdmin ? partyDeck.cards.length : foundSet.size,
    total_cards: partyDeck.cards.length,
    cards: partyDeck.cards.map((card: any) => {
      const discovered = isAdmin || foundSet.has(card.id)
      return {
        id: card.id,
        state: discovered ? 'discovered' : 'undiscovered',
        card: discovered ? cardSummary(card) : null,
        player_cards: discovered ? partyDeck.player_cards.filter((playerCard: any) => playerCard.base_card_id === card.id) : [],
      }
    }),
  }
}

export async function createOracleAnswer(playerId: string, input: { baseCardId: string; depth: string; scope: string; answerText: string }) {
  const party = await ensurePartyExperience()
  const row = await db.partyOracleAnswer.create({
    data: {
      partyId: party.id,
      playerId,
      baseCardId: cleanText(input.baseCardId, 40),
      depth: DEPTHS.includes(input.depth as any) ? input.depth : 'hard',
      scope: input.scope === 'valkyrie' ? 'valkyrie' : 'private',
      answerText: cleanText(input.answerText, 1200),
    },
  })
  await recordDiscovery(playerId, row.baseCardId, row.scope === 'valkyrie' ? 'answer_to_valkyrie' : 'private_answer')
  return row
}

export async function createQuestCard(playerId: string | null, input: any) {
  const party = await ensurePartyExperience()
  return db.partyQuestCard.create({
    data: {
      partyId: party.id,
      authorPlayerId: playerId || undefined,
      title: cleanText(input.title, 80),
      prompt: cleanText(input.prompt, 420),
      category: cleanText(input.category, 40) || 'treasure',
      kind: cleanText(input.kind, 20) === 'offer' ? 'offer' : 'ask',
      face: cleanText(input.face, 40) || undefined,
      waveMode: ['wake_up', 'clean_up', 'grow_up', 'show_up'].includes(input.wave_mode) ? input.wave_mode : 'wake_up',
      materials: cleanText(input.materials, 180),
      waveJson: input.wave || {},
      gameMasterJson: input.game_master || {},
      seed: false,
    },
  })
}

export async function createQuestCompletion(playerId: string, questCardId: string, assetId: string | null, caption: string) {
  const party = await ensurePartyExperience()
  return db.partyQuestCompletion.create({ data: { partyId: party.id, questCardId, playerId, assetId: assetId || undefined, caption: cleanText(caption, 180) } })
}

export async function createPlayerCard(playerId: string, input: any) {
  const party = await ensurePartyExperience()
  return db.partyPlayerCard.create({
    data: {
      partyId: party.id,
      authorPlayerId: playerId,
      baseCardId: cleanText(input.base_card_id, 40),
      title: cleanText(input.title, 80),
      prompt: cleanText(input.prompt, 280),
      flavor: cleanText(input.flavor, 220),
    },
  })
}

export async function createCardThread(playerId: string, input: any) {
  const party = await ensurePartyExperience()
  const recipient = await db.partyParticipant.findFirst({ where: { partyId: party.id, displayName: { equals: cleanText(input.recipient_name, 80), mode: 'insensitive' } } })
  if (!recipient?.playerId) throw new Error('Recipient not found')
  const row = await db.partyCardThread.create({
    data: {
      partyId: party.id,
      baseCardId: cleanText(input.base_card_id, 40),
      senderPlayerId: playerId,
      recipientPlayerId: recipient.playerId,
      senderNote: cleanText(input.sender_note, 600),
    },
  })
  await recordDiscovery(recipient.playerId, row.baseCardId, 'inbox')
  return row
}

export async function answerCardThread(playerId: string, threadId: string, input: any) {
  const thread = await db.partyCardThread.findUnique({ where: { id: threadId } })
  if (!thread) throw new Error('Thread not found')
  if (thread.recipientPlayerId !== playerId) throw new Error('Only the recipient can answer this card')
  if (thread.status !== 'sent') throw new Error('Thread already answered')
  const updated = await db.partyCardThread.update({
    where: { id: threadId },
    data: {
      status: 'answered',
      answerText: cleanText(input.answer_text, 1200),
      answerPrivateNote: cleanText(input.private_note, 600),
      answeredAt: new Date(),
    },
  })
  await recordDiscovery(thread.senderPlayerId, thread.baseCardId, 'returned')
  return updated
}

export async function buildInbox(playerId: string) {
  const party = await ensurePartyExperience()
  const deck = await buildPartyDeck()
  const threads = await db.partyCardThread.findMany({ where: { partyId: party.id }, orderBy: { createdAt: 'desc' } })
  const nameMap = await getPlayerNameMap(threads.flatMap((thread) => [thread.senderPlayerId, thread.recipientPlayerId]))
  const withCard = (thread: any) => ({
    thread: {
      id: thread.id,
      base_card_id: thread.baseCardId,
      sender_name: nameMap.get(thread.senderPlayerId) || 'Unknown',
      recipient_name: nameMap.get(thread.recipientPlayerId) || 'Unknown',
      sender_note: thread.senderNote,
      status: thread.status,
      created_at: thread.createdAt.toISOString(),
      answered_at: thread.answeredAt ? thread.answeredAt.toISOString() : null,
      answer: thread.answerText ? { from_name: nameMap.get(thread.recipientPlayerId) || 'Unknown', text: thread.answerText, private_note: thread.answerPrivateNote || '' } : null,
    },
    card: cardSummary(deck.cards.find((card: any) => card.id === thread.baseCardId)),
  })
  return {
    incoming: threads.filter((thread) => thread.recipientPlayerId === playerId && thread.status === 'sent').map(withCard),
    returned: threads.filter((thread) => thread.senderPlayerId === playerId && thread.status === 'answered').map(withCard),
    sent_pending: threads.filter((thread) => thread.senderPlayerId === playerId && thread.status === 'sent').map(withCard),
  }
}

export async function buildPersonalDeck(playerId: string) {
  const party = await ensurePartyExperience()
  const deck = await buildPartyDeck()
  const threads = await db.partyCardThread.findMany({ where: { partyId: party.id, senderPlayerId: playerId, status: 'answered' }, orderBy: { answeredAt: 'desc' } })
  const answers = await db.partyOracleAnswer.findMany({ where: { partyId: party.id, playerId }, orderBy: { createdAt: 'desc' } })
  const nameMap = await getPlayerNameMap(threads.map((thread) => thread.recipientPlayerId))
  const byCard = new Map<string, any>()
  const ensureEntry = (baseCardId: string) => {
    const existing = byCard.get(baseCardId) || { base_card_id: baseCardId, base_card: cardSummary(deck.cards.find((card: any) => card.id === baseCardId)), answers: [] as any[] }
    byCard.set(baseCardId, existing)
    return existing
  }
  for (const thread of threads) {
    const entry = ensureEntry(thread.baseCardId)
    entry.answers.push({ thread_id: thread.id, from_name: nameMap.get(thread.recipientPlayerId) || 'Unknown', answer_text: thread.answerText || '', private_note: thread.answerPrivateNote || '', sender_note: thread.senderNote || '', answered_at: thread.answeredAt?.toISOString() || thread.createdAt.toISOString() })
  }
  for (const answer of answers) {
    const entry = ensureEntry(answer.baseCardId)
    entry.answers.push({ thread_id: answer.id, from_name: answer.scope === 'valkyrie' ? 'You to Valkyrie' : 'You', answer_text: answer.answerText, private_note: '', sender_note: answer.scope === 'valkyrie' ? 'Sent to Valkyrie' : 'Private answer', answered_at: answer.createdAt.toISOString() })
  }
  return Array.from(byCard.values())
}

export async function buildAdminDeckMap() {
  const party = await ensurePartyExperience()
  const deck = await buildPartyDeck()
  const [discoveries, threads] = await Promise.all([
    db.partyOracleDiscovery.findMany({ where: { partyId: party.id } }),
    db.partyCardThread.findMany({ where: { partyId: party.id } }),
  ])
  const nameMap = await getPlayerNameMap(discoveries.map((row) => row.playerId))
  return deck.cards.map((card: any) => {
    const discoveredBy = Array.from(new Set(discoveries.filter((row) => row.baseCardId === card.id).map((row) => nameMap.get(row.playerId) || row.playerId)))
    const cardThreads = threads.filter((thread) => thread.baseCardId === card.id)
    return {
      card: cardSummary(card),
      player_cards: deck.player_cards.filter((playerCard: any) => playerCard.base_card_id === card.id),
      discovered_by: discoveredBy,
      discovery_count: discoveredBy.length,
      thread_count: cardThreads.length,
      unanswered_count: cardThreads.filter((thread) => thread.status === 'sent').length,
      answered_count: cardThreads.filter((thread) => thread.status === 'answered').length,
    }
  })
}

export async function updatePartySchedule(input: any) {
  const party = await ensurePartyExperience()
  const rows = Array.isArray(input.schedule)
    ? input.schedule
        .map((item: any) => ({ time: cleanText(item?.time, 40), title: cleanText(item?.title, 100), details: cleanText(item?.details, 280) }))
        .filter((item: any) => item.time && item.title)
    : []
  if (!rows.length) throw new Error('Schedule rows are required')
  return db.partyExperience.update({
    where: { id: party.id },
    data: {
      location: cleanText(input.location, 160) || party.location,
      hostNote: cleanText(input.host_note, 400) || party.hostNote,
      scheduleJson: rows,
    },
  })
}

export async function isPartyAdmin(playerId: string | null, adminToken?: string | null) {
  if (adminToken && cleanText(adminToken, 100) === PARTY_ADMIN_TOKEN) return true
  if (!playerId) return false
  const party = await ensurePartyExperience()
  const [adminRole, hostParticipant] = await Promise.all([
    db.playerRole.findFirst({ where: { playerId, role: { key: 'admin' } }, select: { id: true } }),
    db.partyParticipant.findFirst({ where: { partyId: party.id, playerId, isHost: true }, select: { id: true } }),
  ])
  return Boolean(adminRole || hostParticipant || party.createdByPlayerId === playerId)
}

export async function createAltarPost(input: any) {
  const party = await ensurePartyExperience()
  const displayName = cleanText(input.displayName, 80) || (input.anonymous ? 'Anonymous' : 'Unknown')
  return db.partyAltarPost.create({
    data: {
      partyId: party.id,
      authorPlayerId: input.anonymous ? undefined : input.playerId,
      clientSessionId: cleanText(input.clientSessionId, 120) || undefined,
      displayName: input.anonymous ? 'Anonymous' : displayName,
      anonymous: Boolean(input.anonymous),
      category: cleanText(input.category, 40) || 'other',
      tagsJson: Array.isArray(input.tags) ? input.tags : String(input.tags || '').split(',').map((tag) => cleanText(tag, 40)).filter(Boolean),
      title: cleanText(input.title, 120),
      body: cleanText(input.body, 2000),
      sourceJson: input.source || {},
      assetId: cleanText(input.assetId, 80) || undefined,
    },
  })
}

export async function listAltarBoard(category = '') {
  const party = await ensurePartyExperience()
  const posts = await db.partyAltarPost.findMany({ where: { partyId: party.id, deletedAt: null, ...(category ? { category } : {}) }, orderBy: { createdAt: 'desc' } })
  const replies = await db.partyAltarReply.findMany({ where: { partyId: party.id, deletedAt: null }, orderBy: { createdAt: 'asc' } })
  const reactions = await db.partyAltarReaction.findMany({ where: { partyId: party.id } })
  const keepsakes = await db.partyKeepsake.findMany({ where: { partyId: party.id, artifactType: 'altar_post' } })
  const assets = await getAssetMap(posts.map((post) => post.assetId || ''))
  return {
    posts: posts.map((post) => {
      const counts = Object.fromEntries(PARTY_REACTIONS.map((reaction) => [reaction, 0])) as Record<string, number>
      for (const reaction of reactions.filter((row) => row.postId === post.id)) counts[reaction.reaction] = (counts[reaction.reaction] || 0) + 1
      const asset = post.assetId ? assets.get(post.assetId) : null
      return {
        post: {
          id: post.id,
          author_name: post.displayName,
          anonymous: post.anonymous,
          category: post.category,
          tags: post.tagsJson as any,
          title: post.title,
          body: post.body,
          source: post.sourceJson,
          media: asset ? [{ id: asset.id, type: asset.mimeType?.startsWith('image/') ? 'image' : 'file', url: asset.url, alt: post.title || post.body.slice(0, 80) }] : [],
          created_at: post.createdAt.toISOString(),
          deleted_at: null,
        },
        replies: replies
          .filter((reply) => reply.postId === post.id)
          .map((reply) => ({ id: reply.id, post_id: reply.postId, author_name: reply.displayName, anonymous: reply.anonymous, body: reply.body, created_at: reply.createdAt.toISOString(), deleted_at: null })),
        reactions: counts,
        saved_count: keepsakes.filter((save) => save.artifactId === post.id).length,
      }
    }),
    categories: ['blessing', 'memory', 'quest_dare', 'inside_joke', 'question', 'public_card_answer', 'inspiration', 'photo', 'other'],
    reaction_types: PARTY_REACTIONS,
  }
}

export async function createAltarReply(input: any) {
  const party = await ensurePartyExperience()
  return db.partyAltarReply.create({
    data: {
      partyId: party.id,
      postId: cleanText(input.postId, 80),
      authorPlayerId: input.anonymous ? undefined : input.playerId,
      clientSessionId: cleanText(input.clientSessionId, 120) || undefined,
      displayName: input.anonymous ? 'Anonymous' : cleanText(input.displayName, 80),
      anonymous: Boolean(input.anonymous),
      body: cleanText(input.body, 1200),
    },
  })
}

export async function toggleAltarReaction(playerId: string, postId: string, reaction: string) {
  const party = await ensurePartyExperience()
  if (!PARTY_REACTIONS.includes(reaction as any)) throw new Error('Invalid reaction')
  const existing = await db.partyAltarReaction.findFirst({ where: { partyId: party.id, postId, playerId, reaction } })
  if (existing) {
    await db.partyAltarReaction.delete({ where: { id: existing.id } })
    return { active: false }
  }
  await db.partyAltarReaction.create({ data: { partyId: party.id, postId, playerId, reaction } })
  return { active: true }
}

export async function saveAltarPost(playerId: string, artifactId: string, note = '') {
  const party = await ensurePartyExperience()
  const post = await db.partyAltarPost.findUnique({ where: { id: artifactId } })
  if (!post || post.deletedAt) throw new Error('Altar post not found')
  return db.partyKeepsake.upsert({
    where: { partyId_playerId_artifactType_artifactId: { partyId: party.id, playerId, artifactType: 'altar_post', artifactId } },
    update: { note: cleanText(note, 240), snapshotJson: { title: post.title, body: post.body, category: post.category, author_name: post.displayName, tags: post.tagsJson, created_at: post.createdAt.toISOString(), asset_id: post.assetId } },
    create: { partyId: party.id, playerId, artifactType: 'altar_post', artifactId, note: cleanText(note, 240), snapshotJson: { title: post.title, body: post.body, category: post.category, author_name: post.displayName, tags: post.tagsJson, created_at: post.createdAt.toISOString(), asset_id: post.assetId } },
  })
}

export async function listAltarSaves(playerId: string) {
  const party = await ensurePartyExperience()
  const saves = await db.partyKeepsake.findMany({ where: { partyId: party.id, playerId, artifactType: 'altar_post' }, orderBy: { createdAt: 'desc' } })
  const posts = await db.partyAltarPost.findMany({ where: { id: { in: saves.map((save) => save.artifactId) } } })
  const postMap = new Map(posts.map((post) => [post.id, post]))
  return saves.map((save) => {
    const post = postMap.get(save.artifactId)
    const snapshot: any = save.snapshotJson || {}
    return {
      ...save,
      post: post
        ? {
            id: post.id,
            title: post.title,
            body: post.body,
            author_name: post.displayName,
            category: post.category,
          }
        : snapshot,
    }
  })
}

export async function deleteOwnAltarItem(input: { playerId?: string | null; clientSessionId?: string; postId?: string; replyId?: string }) {
  const party = await ensurePartyExperience()
  if (input.postId) {
    const post = await db.partyAltarPost.findUnique({ where: { id: input.postId } })
    if (!post || post.partyId !== party.id) throw new Error('Post not found')
    const canDelete = post.anonymous ? Boolean(input.clientSessionId && post.clientSessionId === input.clientSessionId) : Boolean(input.playerId && post.authorPlayerId === input.playerId)
    if (!canDelete) throw new Error('Not allowed to delete this post')
    return db.partyAltarPost.update({ where: { id: post.id }, data: { deletedAt: new Date() } })
  }
  if (input.replyId) {
    const reply = await db.partyAltarReply.findUnique({ where: { id: input.replyId } })
    if (!reply || reply.partyId !== party.id) throw new Error('Reply not found')
    const canDelete = reply.anonymous ? Boolean(input.clientSessionId && reply.clientSessionId === input.clientSessionId) : Boolean(input.playerId && reply.authorPlayerId === input.playerId)
    if (!canDelete) throw new Error('Not allowed to delete this reply')
    return db.partyAltarReply.update({ where: { id: reply.id }, data: { deletedAt: new Date() } })
  }
  throw new Error('Nothing to delete')
}

export async function adminDeleteAltarItem(input: { postId?: string; replyId?: string }) {
  if (input.postId) return db.partyAltarPost.update({ where: { id: input.postId }, data: { deletedAt: new Date() } })
  if (input.replyId) return db.partyAltarReply.update({ where: { id: input.replyId }, data: { deletedAt: new Date() } })
  throw new Error('Nothing to delete')
}

export async function exportAltar() {
  const party = await ensurePartyExperience()
  const [posts, replies, reactions, saves] = await Promise.all([
    db.partyAltarPost.findMany({ where: { partyId: party.id }, orderBy: { createdAt: 'desc' } }),
    db.partyAltarReply.findMany({ where: { partyId: party.id }, orderBy: { createdAt: 'asc' } }),
    db.partyAltarReaction.findMany({ where: { partyId: party.id }, orderBy: { createdAt: 'asc' } }),
    db.partyKeepsake.findMany({ where: { partyId: party.id }, orderBy: { createdAt: 'desc' } }),
  ])
  return { exported_at: new Date().toISOString(), posts, replies, reactions, saves }
}

export async function upsertCardOverride(playerId: string | null, input: any) {
  const party = await ensurePartyExperience()
  const cardId = cleanText(input.card_id || input.cardId, 40)
  if (!cardId) throw new Error('card_id is required')
  return db.partyOracleCardOverride.upsert({
    where: { partyId_cardId: { partyId: party.id, cardId } },
    update: {
      title: cleanText(input.title, 80) || undefined,
      promptsJson: input.prompts || undefined,
      flavorJson: input.flavor || undefined,
      imageAssetId: cleanText(input.imageAssetId, 80) || undefined,
      cropJson: input.crop || undefined,
      updatedByPlayerId: playerId || undefined,
    },
    create: {
      partyId: party.id,
      cardId,
      title: cleanText(input.title, 80) || undefined,
      promptsJson: input.prompts || undefined,
      flavorJson: input.flavor || undefined,
      imageAssetId: cleanText(input.imageAssetId, 80) || undefined,
      cropJson: input.crop || undefined,
      updatedByPlayerId: playerId || undefined,
    },
  })
}

export async function getClientSessionId() {
  const cookieStore = await cookies()
  return cookieStore.get('valkyrie_party_session')?.value || null
}
