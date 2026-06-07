'use client'

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { ImageBand } from '@/components/oracle/ImageBand'
import { cropFromCard, DEFAULT_CROP, CARD_HEIGHT, CARD_WIDTH, ZONE_CONTENT_H, ZONE_HEADER_H, ZONE_TITLE_H, ZONE_TITLE_PADDING_X, type Crop } from '@/lib/oracle/cardLayout'
import { uploadPartyAsset } from '@/lib/valkyrie-party/upload-client'

type Depth = 'easy' | 'medium' | 'hard'

type OracleCard = {
  id: string
  suit: { code: string; name: string; domain: string; icon: string }
  rank: string
  title: string
  image_file: string
  uploaded?: boolean
  crop_saved?: boolean
  crop?: Crop
  flavor: Record<Depth, { line: string; npc: string; title: string }>
  prompts: Record<Depth, string>
}

type PlayerCard = {
  id: string
  base_card_id: string
  title: string
  prompt: string
  flavor: string
  author?: string
  created_at: string
}

type QuestCard = {
  id: string
  title: string
  prompt: string
  category: string
  kind?: 'ask' | 'offer'
  face?: string
  wave_mode?: 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'
  materials?: string
  author?: string
  wave?: { wake_up?: string; clean_up?: string; grow_up?: string; show_up?: string }
  game_master?: Record<string, string>
  created_at: string
  seed?: boolean
}

type PartyDeck = {
  deck_name: string
  for: string
  made_by: string
  total_cards: number
  base_total_cards: number
  theme?: {
    title: string
    subtitle: string
    accent: string
    background: string
    cream: string
    fire?: string
    water?: string
    wood?: string
    metal?: string
    earth?: string
    rose?: string
    teal?: string
  }
  story?: {
    premise: string
    invocation: string
    beats: { title: string; body: string }[]
  }
  party: {
    date: string
    location: string
    host_note: string
    schedule: { time: string; title: string; details: string }[]
  }
  player_cards: PlayerCard[]
  quest_cards: QuestCard[]
  cards: OracleCard[]
}

type Signup = {
  id: string
  name: string
  email: string
  wants_full_signup: boolean
  keep_party_data: boolean
}

type CardThread = {
  id: string
  base_card_id: string
  sender_name: string
  recipient_name: string
  sender_note: string
  status: 'sent' | 'answered'
  created_at: string
  answered_at: string | null
  answer: null | { from_name: string; text: string; private_note: string }
}

type CardSummary = Pick<OracleCard, 'id' | 'title' | 'rank' | 'suit' | 'image_file' | 'uploaded' | 'crop_saved' | 'crop'> & {
  prompt: string
}

type InboxItem = {
  thread: CardThread
  card: CardSummary | null
}

type InboxData = {
  incoming: InboxItem[]
  returned: InboxItem[]
  sent_pending: InboxItem[]
}

type DiscoverySlot = {
  id: string
  state: 'discovered' | 'undiscovered'
  card: CardSummary | null
  player_cards: PlayerCard[]
}

type DiscoveryData = {
  player: string
  discovered_count: number
  total_cards: number
  cards: DiscoverySlot[]
}

type PersonalDeckGroup = {
  base_card_id: string
  base_card: CardSummary | null
  answers: {
    thread_id: string
    from_name: string
    answer_text: string
    private_note: string
    sender_note: string
    answered_at: string
  }[]
}

type AdminDeckMapRow = {
  card: CardSummary
  player_cards: PlayerCard[]
  discovered_by: string[]
  discovery_count: number
  thread_count: number
  unanswered_count: number
  answered_count: number
}

type CurrentParticipant = {
  name: string
  email: string
  keep_party_data: boolean
  wants_full_signup: boolean
} | null

const PARTY_BG = '#5B160B'
const PARTY_PANEL = 'rgba(255, 243, 220, 0.09)'
const PARTY_GOLD = '#FFB000'
const PARTY_CREAM = '#FFF3DC'
const PARTY_ROSE = '#FF6A2A'
const PARTY_TEAL = '#2DE2C6'

const SUIT_SVG_FILES: Record<string, string> = {
  WU: '/oracle/icons/wake-up.svg',
  CU: '/oracle/icons/clean-up.svg',
  GU: '/oracle/icons/grow-up.svg',
  SU: '/oracle/icons/show-up.svg',
}

function buttonStyle(primary = false, disabled = false): CSSProperties {
  return {
    border: primary ? 'none' : `1px solid ${PARTY_GOLD}`,
    background: primary ? `linear-gradient(135deg, ${PARTY_GOLD}, ${PARTY_ROSE})` : 'transparent',
    color: primary ? '#230817' : PARTY_GOLD,
    borderRadius: 8,
    padding: '0.65rem 0.95rem',
    fontFamily: 'Georgia, serif',
    fontWeight: primary ? 700 : 400,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.55 : 1,
  }
}

function fieldStyle(multiline = false): CSSProperties {
  return {
    width: '100%',
    minHeight: multiline ? 92 : undefined,
    border: '1px solid rgba(255, 176, 0, 0.45)',
    borderRadius: 8,
    background: 'rgba(0, 0, 0, 0.22)',
    color: PARTY_CREAM,
    boxSizing: 'border-box',
    padding: '0.65rem 0.75rem',
    fontFamily: 'Georgia, serif',
    fontSize: '0.92rem',
  }
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ background: PARTY_PANEL, border: '1px solid rgba(255, 176, 0, 0.28)', borderRadius: 8, padding: '1rem', boxShadow: '0 0 28px rgba(255, 79, 163, 0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        <h2 style={{ color: PARTY_GOLD, fontFamily: 'Georgia, serif', fontSize: '1rem', letterSpacing: '0.08em', margin: 0 }}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || json.ok === false) throw new Error(json.error || 'Save failed')
  return json as T
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok || json.ok === false) throw new Error(json.error || 'Load failed')
  return json as T
}

function CardFace({ card, depth, playerCard }: { card: OracleCard; depth: Depth; playerCard: PlayerCard | null }) {
  const crop = card.crop_saved ? cropFromCard(card) : DEFAULT_CROP
  const image = card.image_file || null
  const flavor = card.flavor[depth]
  const prompt = card.prompts[depth]

  return (
    <article style={{ width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 12, overflow: 'hidden', border: `1px solid ${PARTY_GOLD}`, background: '#111', boxShadow: '0 18px 50px rgba(255,77,46,0.22)' }}>
      <div style={{ height: ZONE_HEADER_H, background: `linear-gradient(90deg, ${PARTY_BG}, #4B1248)`, borderBottom: `1px solid ${PARTY_GOLD}`, padding: '0 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: PARTY_GOLD }}>
          <img src={SUIT_SVG_FILES[card.suit.code]} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>{card.suit.name.toUpperCase()}</span>
        </div>
        <span style={{ color: PARTY_GOLD, fontSize: '0.75rem' }}>{card.rank}</span>
      </div>

      <ImageBand src={image} crop={crop} />

      <div style={{ height: ZONE_TITLE_H, background: `linear-gradient(90deg, #4B1248, ${PARTY_BG})`, borderTop: `1px solid ${PARTY_GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${ZONE_TITLE_PADDING_X}` }}>
        <p style={{ color: PARTY_CREAM, fontSize: '0.68rem', margin: 0, textAlign: 'center', letterSpacing: '0.04em', lineHeight: 1.15 }}>
          {(playerCard?.title || card.title).toUpperCase()}
        </p>
      </div>

      <div style={{ height: ZONE_CONTENT_H, background: 'rgba(17,17,17,0.95)', padding: '0.45rem 0.5rem', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.25rem', overflow: 'hidden' }}>
        <p style={{ color: PARTY_CREAM, fontSize: '0.72rem', textAlign: 'center', margin: 0, lineHeight: 1.3, overflowWrap: 'break-word' }}>
          {playerCard?.prompt || prompt}
        </p>
        <div style={{ textAlign: 'center', minWidth: 0, marginTop: '0.15rem' }}>
          <p style={{ color: PARTY_CREAM, fontSize: '0.68rem', fontStyle: 'italic', margin: '0 0 0.1rem', lineHeight: 1.3 }}>
            "{playerCard?.flavor || flavor.line}"
          </p>
          <p style={{ color: PARTY_GOLD, fontSize: '0.56rem', margin: 0, opacity: 0.85, lineHeight: 1.2 }}>
            {playerCard ? `Added by ${playerCard.author || 'Anonymous'}` : `- ${flavor.npc}, ${flavor.title}`}
          </p>
        </div>
      </div>
    </article>
  )
}

function CardBack({ onClick, label = 'Reveal card' }: { onClick?: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        border: 'none',
        borderRadius: 12,
        padding: 0,
        overflow: 'hidden',
        background: 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 18px 50px rgba(0,0,0,0.28)',
      }}
      aria-label={label}
    >
      <img src="/oracle/card-back.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </button>
  )
}

function QuestSlip({ card }: { card: QuestCard }) {
  const waveRows = [
    ['Wake', card.wave?.wake_up],
    ['Clean', card.wave?.clean_up],
    ['Grow', card.wave?.grow_up],
    ['Show', card.wave?.show_up],
  ].filter(([, value]) => Boolean(value))

  return (
    <article style={{ width: 'min(100%, 330px)', minHeight: 430, border: '1px solid rgba(255, 176, 0, 0.55)', borderRadius: 12, padding: '1rem', background: 'linear-gradient(180deg, rgba(255,243,220,0.16), rgba(255,77,46,0.09))', boxShadow: '0 18px 45px rgba(0,0,0,0.18)', boxSizing: 'border-box', display: 'grid', alignContent: 'start', gap: '0.65rem' }}>
      <p style={{ margin: 0, color: PARTY_TEAL, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {(card.kind || 'ask').toUpperCase()} · {card.face || 'freeform'} · {card.wave_mode ? card.wave_mode.replace('_', ' ') : 'quest'}
      </p>
      <h3 style={{ margin: 0, color: PARTY_GOLD, fontSize: '1.35rem', lineHeight: 1.1 }}>
        {card.title}
      </h3>
      <p style={{ margin: 0, lineHeight: 1.5, fontSize: '1rem' }}>{card.prompt}</p>
      {card.materials && (
        <p style={{ margin: 0, opacity: 0.76, fontSize: '0.84rem', lineHeight: 1.35 }}>
          Bring: {card.materials}
        </p>
      )}
      {waveRows.length > 0 && (
        <div style={{ display: 'grid', gap: '0.3rem', borderTop: '1px solid rgba(255,176,0,0.22)', paddingTop: '0.55rem' }}>
          {waveRows.map(([label, value]) => (
            <p key={label} style={{ margin: 0, fontSize: '0.76rem', lineHeight: 1.28, opacity: 0.82 }}>
              <span style={{ color: PARTY_GOLD }}>{label}:</span> {value}
            </p>
          ))}
        </div>
      )}
      <p style={{ margin: 0, opacity: 0.62, fontSize: '0.78rem', alignSelf: 'end' }}>Added by {card.author || 'Anonymous'}</p>
    </article>
  )
}

export function PartyApp() {
  const [deck, setDeck] = useState<PartyDeck | null>(null)
  const [signups, setSignups] = useState<Signup[]>([])
  const [currentParticipant, setCurrentParticipant] = useState<CurrentParticipant>(null)
  const [selectedCard, setSelectedCard] = useState<OracleCard | null>(null)
  const [selectedPlayerCard, setSelectedPlayerCard] = useState<PlayerCard | null>(null)
  const [selectedQuestCard, setSelectedQuestCard] = useState<QuestCard | null>(null)
  const [selectedDepth, setSelectedDepth] = useState<Depth>('hard')
  const [cardRevealed, setCardRevealed] = useState(false)
  const [questRevealed, setQuestRevealed] = useState(false)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [signup, setSignup] = useState({ email: '', keep: true, full: false })
  const [mailDraft, setMailDraft] = useState({ recipient_name: '', sender_note: '' })
  const [oracleAnswerDraft, setOracleAnswerDraft] = useState('')
  const [questDraft, setQuestDraft] = useState({ title: '', prompt: '', category: 'treasure', kind: 'ask', face: 'regent', wave_mode: 'show_up', materials: '' })
  const [questPhotoCaption, setQuestPhotoCaption] = useState('')
  const [inbox, setInbox] = useState<InboxData>({ incoming: [], returned: [], sent_pending: [] })
  const [answering, setAnswering] = useState<InboxItem | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [answerPrivateNote, setAnswerPrivateNote] = useState('')
  const [discoveryOpen, setDiscoveryOpen] = useState(false)
  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null)
  const [personalDeck, setPersonalDeck] = useState<PersonalDeckGroup[]>([])
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState('')
  const [scheduleDraft, setScheduleDraft] = useState<PartyDeck['party'] | null>(null)
  const [adminDeckMap, setAdminDeckMap] = useState<AdminDeckMapRow[]>([])
  const [selectedAdminCardId, setSelectedAdminCardId] = useState('')
  const [adminCopyDraft, setAdminCopyDraft] = useState({ title: '', easy: '', medium: '', hard: '' })

  const loadParty = useCallback(async () => {
    const json = await getJson<{ deck: PartyDeck; signups: Signup[]; current_participant: CurrentParticipant }>(`/api/party/valkyrie`)
    setDeck(json.deck)
    setSignups(json.signups || [])
    setCurrentParticipant(json.current_participant || null)
    setScheduleDraft(json.deck.party)
    if (json.current_participant?.name) {
      setPlayerName(json.current_participant.name)
      setShowJoinModal(false)
      window.localStorage.setItem('valkyrie_party_player', json.current_participant.name)
    } else {
      const saved = window.localStorage.getItem('valkyrie_party_player') || ''
      setPlayerName(saved)
      setShowJoinModal(!saved)
    }
  }, [])

  const loadPlayerViews = useCallback(async () => {
    const [inboxJson, discoveryJson, personalJson] = await Promise.all([
      getJson<InboxData>(`/api/party/valkyrie/inbox`),
      getJson<DiscoveryData>(`/api/party/valkyrie/discovery`),
      getJson<{ cards: PersonalDeckGroup[] }>(`/api/party/valkyrie/personal-deck`),
    ])
    setInbox({
      incoming: inboxJson.incoming || [],
      returned: inboxJson.returned || [],
      sent_pending: inboxJson.sent_pending || [],
    })
    setDiscovery(discoveryJson)
    setPersonalDeck(personalJson.cards || [])
  }, [])

  useEffect(() => {
    setAdminToken(window.localStorage.getItem('valkyrie_party_admin') || '')
    setShowAdmin(new URLSearchParams(window.location.search).get('admin') === '1')
    loadParty().catch((err) => setNotice(err instanceof Error ? err.message : 'Could not load party'))
  }, [loadParty])

  useEffect(() => {
    if (currentParticipant?.name) {
      loadPlayerViews().catch(() => undefined)
    }
  }, [currentParticipant, loadPlayerViews])

  const players = useMemo(() => {
    const names = new Set(signups.map((s) => s.name).filter(Boolean))
    if (playerName) names.add(playerName)
    names.add('Valkyrie')
    return Array.from(names)
  }, [signups, playerName])

  const relatedPlayerCards = useMemo(() => {
    if (!deck || !selectedCard) return []
    return deck.player_cards.filter((card) => card.base_card_id === selectedCard.id)
  }, [deck, selectedCard])

  const currentAdminCard = useMemo(
    () => deck?.cards.find((card) => card.id === selectedAdminCardId) || null,
    [deck, selectedAdminCardId]
  )

  useEffect(() => {
    if (!currentAdminCard) return
    setAdminCopyDraft({
      title: currentAdminCard.title,
      easy: currentAdminCard.prompts.easy,
      medium: currentAdminCard.prompts.medium,
      hard: currentAdminCard.prompts.hard,
    })
  }, [currentAdminCard])

  const drawCard = useCallback(async () => {
    if (!deck?.cards.length) return
    const pool = selectedCard && deck.cards.length > 1 ? deck.cards.filter((card) => card.id !== selectedCard.id) : deck.cards
    const card = pool[Math.floor(Math.random() * pool.length)]
    setSelectedCard(card)
    setSelectedPlayerCard(null)
    setCardRevealed(false)
    setOracleAnswerDraft('')
    if (currentParticipant) {
      await postJson('/api/party/valkyrie/discovery', { base_card_id: card.id, source: 'draw' }).catch(() => undefined)
      loadPlayerViews().catch(() => undefined)
    }
  }, [deck, selectedCard, currentParticipant, loadPlayerViews])

  const drawQuestCard = useCallback(() => {
    if (!deck?.quest_cards.length) return
    const pool = selectedQuestCard && deck.quest_cards.length > 1 ? deck.quest_cards.filter((card) => card.id !== selectedQuestCard.id) : deck.quest_cards
    setSelectedQuestCard(pool[Math.floor(Math.random() * pool.length)])
    setQuestRevealed(false)
    setQuestPhotoCaption('')
  }, [deck, selectedQuestCard])

  const saveSignup = useCallback(async () => {
    if (!playerName.trim()) return
    setBusy(true)
    try {
      const json = await postJson<{ signup: Signup }>('/api/party/valkyrie/signups', {
        name: playerName,
        email: signup.email,
        keep_party_data: signup.keep,
        wants_full_signup: signup.full,
      })
      window.localStorage.setItem('valkyrie_party_player', json.signup.name)
      setShowJoinModal(false)
      setNotice(signup.full ? 'You are in. Full bars-engine signup is marked for follow-up.' : 'You are in the party.')
      await loadParty()
      await loadPlayerViews().catch(() => undefined)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setBusy(false)
    }
  }, [playerName, signup, loadParty, loadPlayerViews])

  const saveOracleAnswer = useCallback(async (scope: 'private' | 'valkyrie') => {
    if (!selectedCard || !oracleAnswerDraft.trim()) return
    setBusy(true)
    try {
      await postJson('/api/party/valkyrie/oracle-answers', {
        base_card_id: selectedCard.id,
        depth: selectedDepth,
        scope,
        answer_text: oracleAnswerDraft,
      })
      setOracleAnswerDraft('')
      setNotice(scope === 'valkyrie' ? 'Answer sent to Valkyrie.' : 'Private answer saved to your deck.')
      await loadPlayerViews().catch(() => undefined)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save answer')
    } finally {
      setBusy(false)
    }
  }, [selectedCard, oracleAnswerDraft, selectedDepth, loadPlayerViews])

  const sendCardMail = useCallback(async () => {
    if (!selectedCard || !mailDraft.recipient_name.trim()) return
    setBusy(true)
    try {
      await postJson('/api/party/valkyrie/card-threads', {
        base_card_id: selectedCard.id,
        recipient_name: mailDraft.recipient_name,
        sender_note: mailDraft.sender_note,
      })
      setMailDraft({ recipient_name: '', sender_note: '' })
      setNotice(`Sent ${selectedCard.title} to ${mailDraft.recipient_name}.`)
      await loadPlayerViews().catch(() => undefined)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not send card')
    } finally {
      setBusy(false)
    }
  }, [selectedCard, mailDraft, loadPlayerViews])

  const answerThread = useCallback(async () => {
    if (!answering || !answerText.trim()) return
    setBusy(true)
    try {
      await postJson(`/api/party/valkyrie/card-threads/${answering.thread.id}/answer`, {
        answer_text: answerText,
        private_note: answerPrivateNote,
      })
      setAnswering(null)
      setAnswerText('')
      setAnswerPrivateNote('')
      setNotice('Answer sent back as a card.')
      await loadPlayerViews().catch(() => undefined)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not answer card')
    } finally {
      setBusy(false)
    }
  }, [answering, answerText, answerPrivateNote, loadPlayerViews])

  const addQuestCard = useCallback(async () => {
    if (!questDraft.title.trim() || !questDraft.prompt.trim()) return
    setBusy(true)
    try {
      const json = await postJson<{ deck: PartyDeck; card: QuestCard }>('/api/party/valkyrie/quest-cards', questDraft)
      setDeck(json.deck)
      setSelectedQuestCard(json.card)
      setQuestRevealed(true)
      setQuestDraft({ title: '', prompt: '', category: 'treasure', kind: 'ask', face: 'regent', wave_mode: 'show_up', materials: '' })
      setNotice('Quest added to the party deck.')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not add quest')
    } finally {
      setBusy(false)
    }
  }, [questDraft])

  const uploadQuestPhoto = useCallback(async (file: File | null) => {
    if (!file || !selectedQuestCard) return
    setBusy(true)
    try {
      const uploaded = await uploadPartyAsset(file, { kind: 'quest_completion', questCardId: selectedQuestCard.id })
      await postJson(`/api/party/valkyrie/quest-cards/${selectedQuestCard.id}/completions`, {
        asset_url: uploaded.url,
        caption: questPhotoCaption,
      })
      setQuestPhotoCaption('')
      setNotice('Quest photo attached.')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not attach photo')
    } finally {
      setBusy(false)
    }
  }, [selectedQuestCard, questPhotoCaption])

  const loadAdminDeckMap = useCallback(async () => {
    if (!adminToken.trim()) return
    const json = await getJson<{ cards: AdminDeckMapRow[] }>(`/api/party/valkyrie/admin/deck-map?admin_token=${encodeURIComponent(adminToken)}`)
    setAdminDeckMap(json.cards || [])
  }, [adminToken])

  const saveSchedule = useCallback(async () => {
    if (!scheduleDraft) return
    setBusy(true)
    try {
      const json = await postJson<{ deck: PartyDeck }>('/api/party/valkyrie/schedule', {
        admin_token: adminToken,
        location: scheduleDraft.location,
        host_note: scheduleDraft.host_note,
        schedule: scheduleDraft.schedule,
      })
      window.localStorage.setItem('valkyrie_party_admin', adminToken)
      setDeck(json.deck)
      setScheduleDraft(json.deck.party)
      setNotice('Schedule updated.')
      await loadAdminDeckMap().catch(() => undefined)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not update schedule')
    } finally {
      setBusy(false)
    }
  }, [adminToken, scheduleDraft, loadAdminDeckMap])

  const saveCardOverride = useCallback(async (file?: File | null) => {
    if (!currentAdminCard || !adminToken.trim()) return
    setBusy(true)
    try {
      let imageUrl = ''
      if (file) {
        const uploaded = await uploadPartyAsset(file, { kind: 'oracle_override', cardId: currentAdminCard.id })
        imageUrl = uploaded.url
      }
      const json = await postJson<{ deck: PartyDeck }>('/api/party/valkyrie/admin/card-override', {
        admin_token: adminToken,
        card_id: currentAdminCard.id,
        title: adminCopyDraft.title,
        prompts: {
          easy: adminCopyDraft.easy,
          medium: adminCopyDraft.medium,
          hard: adminCopyDraft.hard,
        },
        ...(imageUrl ? { image_url: imageUrl } : {}),
      })
      window.localStorage.setItem('valkyrie_party_admin', adminToken)
      setDeck(json.deck)
      setNotice(file ? 'Card art updated.' : 'Card copy updated.')
      await loadAdminDeckMap().catch(() => undefined)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save card override')
    } finally {
      setBusy(false)
    }
  }, [currentAdminCard, adminToken, adminCopyDraft, loadAdminDeckMap])

  return (
    <main style={{ minHeight: '100vh', background: `radial-gradient(circle at 18% 8%, rgba(255,176,0,0.28), transparent 28%), radial-gradient(circle at 82% 4%, rgba(255,77,46,0.24), transparent 26%), linear-gradient(180deg, ${PARTY_BG}, #220700 72%)`, color: PARTY_CREAM, fontFamily: 'Georgia, serif', padding: '1.25rem' }}>
      <div style={{ width: '100%', maxWidth: 1160, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <header style={{ display: 'grid', gap: '0.65rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'start' }}>
            <div>
              <p style={{ margin: 0, color: PARTY_TEAL, letterSpacing: '0.12em' }}>VALKYRIE PARTY</p>
              <h1 style={{ margin: '0.3rem 0 0', color: PARTY_GOLD, fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>{deck?.deck_name || 'Get Fucking Treasured'}</h1>
              <p style={{ margin: '0.4rem 0 0', maxWidth: 780, lineHeight: 1.55, opacity: 0.88 }}>
                {deck?.story?.premise || 'Oracle for connection, quest deck for care, and a shared altar for the party memory field.'}
              </p>
            </div>
            <div style={{ display: 'grid', gap: '0.55rem', justifyItems: 'end' }}>
              <div style={{ color: PARTY_TEAL }}>{currentParticipant?.name || playerName || 'Guest'}</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowJoinModal(true)} style={buttonStyle()}>
                  {currentParticipant ? 'Update player' : 'Join the party'}
                </button>
                <button type="button" onClick={() => window.location.assign('/valkyrie-party/altar')} style={buttonStyle()}>
                  Open altar
                </button>
                <button type="button" onClick={() => setShowAdmin((value) => !value)} style={buttonStyle()}>
                  {showAdmin ? 'Hide admin' : 'Admin'}
                </button>
              </div>
            </div>
          </div>
        </header>

        {notice && <div style={{ border: '1px solid rgba(255,176,0,0.3)', borderRadius: 8, padding: '0.75rem', background: 'rgba(0,0,0,0.18)', color: PARTY_GOLD }}>{notice}</div>}

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(300px, 0.8fr)', gap: '1rem', alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <Panel title="Oracle">
              <div style={{ display: 'grid', justifyItems: 'center', gap: '0.85rem' }}>
                {selectedCard && cardRevealed ? (
                  <CardFace card={selectedCard} depth={selectedDepth} playerCard={selectedPlayerCard} />
                ) : (
                  <CardBack onClick={selectedCard ? () => setCardRevealed(true) : undefined} />
                )}
                <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button type="button" onClick={drawCard} style={buttonStyle(true)}>Shuffle</button>
                  {selectedCard && !cardRevealed && (
                    <button type="button" onClick={() => setCardRevealed(true)} style={buttonStyle()}>
                      Reveal
                    </button>
                  )}
                  {selectedCard && cardRevealed && (
                    <>
                      {(['easy', 'medium', 'hard'] as const).map((depth) => (
                        <button key={depth} type="button" onClick={() => setSelectedDepth(depth)} style={buttonStyle(selectedDepth === depth)}>
                          {depth}
                        </button>
                      ))}
                    </>
                  )}
                </div>
                {selectedCard && cardRevealed && (
                  <div style={{ width: '100%', display: 'grid', gap: '0.7rem' }}>
                    {relatedPlayerCards.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{ opacity: 0.8 }}>Player variants:</span>
                        <button type="button" onClick={() => setSelectedPlayerCard(null)} style={buttonStyle(selectedPlayerCard === null)}>Base card</button>
                        {relatedPlayerCards.map((playerCard) => (
                          <button key={playerCard.id} type="button" onClick={() => setSelectedPlayerCard(playerCard)} style={buttonStyle(selectedPlayerCard?.id === playerCard.id)}>
                            {playerCard.title}
                          </button>
                        ))}
                      </div>
                    )}
                    <textarea value={oracleAnswerDraft} onChange={(e) => setOracleAnswerDraft(e.target.value)} placeholder="Answer the prompt here. Save privately or send it to Valkyrie." style={fieldStyle(true)} />
                    <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                      <button type="button" disabled={!oracleAnswerDraft.trim() || busy} onClick={() => saveOracleAnswer('private')} style={buttonStyle(true, !oracleAnswerDraft.trim() || busy)}>
                        Save privately
                      </button>
                      <button type="button" disabled={!oracleAnswerDraft.trim() || busy} onClick={() => saveOracleAnswer('valkyrie')} style={buttonStyle(false, !oracleAnswerDraft.trim() || busy)}>
                        Send to Valkyrie
                      </button>
                    </div>
                    <div style={{ display: 'grid', gap: '0.55rem', borderTop: '1px solid rgba(255,176,0,0.16)', paddingTop: '0.7rem' }}>
                      <p style={{ margin: 0, opacity: 0.82 }}>Pass this card to another player:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 180px) minmax(0, 1fr)', gap: '0.55rem' }}>
                        <select value={mailDraft.recipient_name} onChange={(e) => setMailDraft((draft) => ({ ...draft, recipient_name: e.target.value }))} style={fieldStyle()}>
                          <option value="">Choose player</option>
                          {players.filter((name) => name !== (currentParticipant?.name || playerName)).map((name) => <option key={name} value={name}>{name}</option>)}
                        </select>
                        <input value={mailDraft.sender_note} onChange={(e) => setMailDraft((draft) => ({ ...draft, sender_note: e.target.value }))} placeholder="Optional note" style={fieldStyle()} />
                      </div>
                      <button type="button" disabled={!mailDraft.recipient_name.trim() || busy} onClick={sendCardMail} style={buttonStyle(true, !mailDraft.recipient_name.trim() || busy)}>
                        Send card
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            <Panel title="Quest Deck">
              <div style={{ display: 'grid', justifyItems: 'center', gap: '0.85rem' }}>
                {selectedQuestCard && questRevealed ? <QuestSlip card={selectedQuestCard} /> : <CardBack onClick={selectedQuestCard ? () => setQuestRevealed(true) : undefined} label="Reveal quest card" />}
                <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button type="button" onClick={drawQuestCard} style={buttonStyle(true)}>Shuffle quest deck</button>
                  {selectedQuestCard && !questRevealed && <button type="button" onClick={() => setQuestRevealed(true)} style={buttonStyle()}>Reveal</button>}
                </div>
                {selectedQuestCard && questRevealed && (
                  <div style={{ width: '100%', display: 'grid', gap: '0.55rem' }}>
                    <input value={questPhotoCaption} onChange={(e) => setQuestPhotoCaption(e.target.value)} placeholder="Caption for completion photo" style={fieldStyle()} />
                    <label style={buttonStyle(false, busy)}>
                      Attach completion photo
                      <input
                        type="file"
                        accept="image/*"
                        disabled={busy}
                        onChange={async (e) => {
                          const file = e.currentTarget.files?.[0] || null
                          if (file) await uploadQuestPhoto(file)
                          e.currentTarget.value = ''
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
                <div style={{ width: '100%', display: 'grid', gap: '0.55rem', borderTop: '1px solid rgba(255,176,0,0.16)', paddingTop: '0.8rem' }}>
                  <p style={{ margin: 0, color: PARTY_TEAL }}>Add an ASK or OFFER</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.55rem' }}>
                    <select value={questDraft.kind} onChange={(e) => setQuestDraft((draft) => ({ ...draft, kind: e.target.value }))} style={fieldStyle()}>
                      <option value="ask">ASK</option>
                      <option value="offer">OFFER</option>
                    </select>
                    <select value={questDraft.face} onChange={(e) => setQuestDraft((draft) => ({ ...draft, face: e.target.value }))} style={fieldStyle()}>
                      <option value="regent">Regent</option>
                      <option value="shaman">Shaman</option>
                      <option value="challenger">Challenger</option>
                      <option value="architect">Architect</option>
                      <option value="diplomat">Diplomat</option>
                      <option value="sage">Sage</option>
                    </select>
                    <select value={questDraft.wave_mode} onChange={(e) => setQuestDraft((draft) => ({ ...draft, wave_mode: e.target.value }))} style={fieldStyle()}>
                      <option value="wake_up">Wake Up</option>
                      <option value="clean_up">Clean Up</option>
                      <option value="grow_up">Grow Up</option>
                      <option value="show_up">Show Up</option>
                    </select>
                  </div>
                  <input value={questDraft.title} onChange={(e) => setQuestDraft((draft) => ({ ...draft, title: e.target.value }))} placeholder="Quest title" style={fieldStyle()} />
                  <textarea value={questDraft.prompt} onChange={(e) => setQuestDraft((draft) => ({ ...draft, prompt: e.target.value }))} placeholder="What is the actual treasured experience?" style={fieldStyle(true)} />
                  <input value={questDraft.materials} onChange={(e) => setQuestDraft((draft) => ({ ...draft, materials: e.target.value }))} placeholder="Materials or logistics" style={fieldStyle()} />
                  <button type="button" disabled={!questDraft.title.trim() || !questDraft.prompt.trim() || busy} onClick={addQuestCard} style={buttonStyle(true, !questDraft.title.trim() || !questDraft.prompt.trim() || busy)}>
                    Add to quest deck
                  </button>
                </div>
              </div>
            </Panel>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <Panel title="Party Flow">
              <div style={{ display: 'grid', gap: '0.65rem' }}>
                {(scheduleDraft?.schedule || []).map((item, index) => (
                  <div key={`${item.time}-${index}`} style={{ borderTop: '1px solid rgba(255,176,0,0.14)', paddingTop: '0.55rem' }}>
                    <p style={{ margin: 0, color: PARTY_GOLD }}>{item.time} · {item.title}</p>
                    <p style={{ margin: '0.2rem 0 0', opacity: 0.82 }}>{item.details}</p>
                  </div>
                ))}
                <p style={{ margin: 0, opacity: 0.8 }}>{scheduleDraft?.host_note}</p>
              </div>
            </Panel>

            <Panel title="Inbox">
              <div style={{ display: 'grid', gap: '0.75rem', maxHeight: 400, overflow: 'auto' }}>
                {[...inbox.incoming, ...inbox.returned].map((item) => (
                  <div key={item.thread.id} style={{ borderTop: '1px solid rgba(255,176,0,0.16)', paddingTop: '0.65rem', display: 'grid', gap: '0.35rem' }}>
                    <p style={{ margin: 0, color: PARTY_GOLD }}>{item.card?.title || item.thread.base_card_id}</p>
                    <p style={{ margin: 0, opacity: 0.82 }}>{item.thread.sender_name}: {item.thread.sender_note || 'sent you a card.'}</p>
                    {item.thread.answer?.text && <p style={{ margin: 0 }}>{item.thread.answer.text}</p>}
                    {item.thread.status === 'sent' && (
                      <button type="button" onClick={() => setAnswering(item)} style={buttonStyle()}>
                        Answer card
                      </button>
                    )}
                  </div>
                ))}
                {!inbox.incoming.length && !inbox.returned.length && <p style={{ margin: 0, opacity: 0.72 }}>No cards in motion yet.</p>}
              </div>
            </Panel>

            <Panel title="Discovered Cards" action={<button type="button" onClick={() => setDiscoveryOpen((value) => !value)} style={buttonStyle()}>{discoveryOpen ? 'Collapse' : 'Expand'}</button>}>
              <p style={{ margin: '0 0 0.5rem', opacity: 0.82 }}>
                {discovery ? `${discovery.discovered_count} / ${discovery.total_cards} discovered` : 'Shuffle and draw to discover cards.'}
              </p>
              {discoveryOpen && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.55rem' }}>
                  {(discovery?.cards || []).map((slot) => (
                    <div key={slot.id} style={{ border: '1px solid rgba(255,176,0,0.16)', borderRadius: 8, padding: '0.55rem', minHeight: 84, display: 'grid', alignContent: 'center' }}>
                      <p style={{ margin: 0, textAlign: 'center', color: slot.state === 'discovered' ? PARTY_GOLD : 'rgba(255,243,220,0.52)' }}>
                        {slot.state === 'discovered' ? slot.card?.title || slot.id : 'Locked'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Personal Deck">
              <div style={{ display: 'grid', gap: '0.75rem', maxHeight: 340, overflow: 'auto' }}>
                {personalDeck.map((group) => (
                  <div key={group.base_card_id} style={{ borderTop: '1px solid rgba(255,176,0,0.16)', paddingTop: '0.65rem' }}>
                    <p style={{ margin: 0, color: PARTY_GOLD }}>{group.base_card?.title || group.base_card_id}</p>
                    {group.answers.map((answer) => (
                      <p key={answer.thread_id} style={{ margin: '0.3rem 0 0', opacity: 0.84 }}>
                        <strong>{answer.from_name}:</strong> {answer.answer_text}
                      </p>
                    ))}
                  </div>
                ))}
                {!personalDeck.length && <p style={{ margin: 0, opacity: 0.72 }}>Private answers and returned cards will gather here.</p>}
              </div>
            </Panel>

            {showAdmin && (
              <Panel title="Admin Tools">
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <input value={adminToken} onChange={(e) => setAdminToken(e.target.value)} placeholder="Admin token" style={fieldStyle()} />
                  <button type="button" onClick={() => { window.localStorage.setItem('valkyrie_party_admin', adminToken); loadAdminDeckMap().catch(() => undefined) }} style={buttonStyle()}>
                    Load admin deck
                  </button>
                  {scheduleDraft && (
                    <div style={{ display: 'grid', gap: '0.55rem' }}>
                      {scheduleDraft.schedule.map((row, index) => (
                        <div key={`${row.time}-${index}`} style={{ display: 'grid', gridTemplateColumns: '120px minmax(0,1fr)', gap: '0.45rem' }}>
                          <input value={row.time} onChange={(e) => setScheduleDraft((draft) => draft ? { ...draft, schedule: draft.schedule.map((item, i) => i === index ? { ...item, time: e.target.value } : item) } : draft)} style={fieldStyle()} />
                          <input value={row.title} onChange={(e) => setScheduleDraft((draft) => draft ? { ...draft, schedule: draft.schedule.map((item, i) => i === index ? { ...item, title: e.target.value } : item) } : draft)} style={fieldStyle()} />
                        </div>
                      ))}
                      <textarea value={scheduleDraft.host_note} onChange={(e) => setScheduleDraft((draft) => draft ? { ...draft, host_note: e.target.value } : draft)} style={fieldStyle(true)} />
                      <button type="button" onClick={saveSchedule} style={buttonStyle(true, busy)}>Save schedule</button>
                    </div>
                  )}
                  {adminDeckMap.length > 0 && (
                    <>
                      <select value={selectedAdminCardId} onChange={(e) => setSelectedAdminCardId(e.target.value)} style={fieldStyle()}>
                        <option value="">Choose card</option>
                        {adminDeckMap.map((row) => <option key={row.card.id} value={row.card.id}>{row.card.title}</option>)}
                      </select>
                      {currentAdminCard && (
                        <div style={{ display: 'grid', gap: '0.55rem' }}>
                          <input value={adminCopyDraft.title} onChange={(e) => setAdminCopyDraft((draft) => ({ ...draft, title: e.target.value }))} style={fieldStyle()} />
                          <textarea value={adminCopyDraft.easy} onChange={(e) => setAdminCopyDraft((draft) => ({ ...draft, easy: e.target.value }))} style={fieldStyle(true)} />
                          <textarea value={adminCopyDraft.medium} onChange={(e) => setAdminCopyDraft((draft) => ({ ...draft, medium: e.target.value }))} style={fieldStyle(true)} />
                          <textarea value={adminCopyDraft.hard} onChange={(e) => setAdminCopyDraft((draft) => ({ ...draft, hard: e.target.value }))} style={fieldStyle(true)} />
                          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => saveCardOverride()} style={buttonStyle(true, busy)}>Save card copy</button>
                            <label style={buttonStyle(false, busy)}>
                              Upload new image
                              <input
                                type="file"
                                accept="image/*"
                                disabled={busy}
                                onChange={async (e) => {
                                  const file = e.currentTarget.files?.[0] || null
                                  if (file) await saveCardOverride(file)
                                  e.currentTarget.value = ''
                                }}
                                style={{ display: 'none' }}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Panel>
            )}
          </div>
        </section>
      </div>

      {showJoinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <div style={{ width: 'min(100%, 440px)', background: '#2B0E08', border: '1px solid rgba(255,176,0,0.35)', borderRadius: 14, padding: '1rem', display: 'grid', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, color: PARTY_GOLD }}>Join the Party</h2>
            <p style={{ margin: 0, opacity: 0.84 }}>Tell the app who you are so your cards, answers, inbox, altar keepsakes, and quest photos have somewhere real to live.</p>
            <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Display name" style={fieldStyle()} />
            <input value={signup.email} onChange={(e) => setSignup((draft) => ({ ...draft, email: e.target.value }))} placeholder="Email if you want follow-up" style={fieldStyle()} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <input type="checkbox" checked={signup.keep} onChange={(e) => setSignup((draft) => ({ ...draft, keep: e.target.checked }))} />
              Keep my party data
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <input type="checkbox" checked={signup.full} onChange={(e) => setSignup((draft) => ({ ...draft, full: e.target.checked }))} />
              I want full bars-engine signup later
            </label>
            <div style={{ display: 'flex', gap: '0.55rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowJoinModal(false)} style={buttonStyle()}>
                Later
              </button>
              <button type="button" disabled={!playerName.trim() || busy} onClick={saveSignup} style={buttonStyle(true, !playerName.trim() || busy)}>
                Save player
              </button>
            </div>
          </div>
        </div>
      )}

      {answering && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', padding: '1rem' }}>
          <div style={{ width: 'min(100%, 520px)', background: '#2B0E08', border: '1px solid rgba(255,176,0,0.35)', borderRadius: 14, padding: '1rem', display: 'grid', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, color: PARTY_GOLD }}>{answering.card?.title || 'Answer card'}</h2>
            <p style={{ margin: 0, opacity: 0.84 }}>{answering.thread.sender_name} asked you to answer this prompt.</p>
            <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Your answer" style={fieldStyle(true)} />
            <textarea value={answerPrivateNote} onChange={(e) => setAnswerPrivateNote(e.target.value)} placeholder="Optional private note back" style={fieldStyle(true)} />
            <div style={{ display: 'flex', gap: '0.55rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setAnswering(null)} style={buttonStyle()}>
                Cancel
              </button>
              <button type="button" disabled={!answerText.trim() || busy} onClick={answerThread} style={buttonStyle(true, !answerText.trim() || busy)}>
                Send answer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
