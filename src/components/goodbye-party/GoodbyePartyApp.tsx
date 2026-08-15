'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { PartyCardBack, PartyCardFace, type PartyCardPalette } from '@/components/oracle/PartyCardFace'
import { GOODBYE_PALETTE } from '@/lib/goodbye-party/config'

type Lens = 'goodbye' | 'spicy'
type Depth = 'easy' | 'medium' | 'hard'

type Reading = {
  prompt: string
  emotionalAlchemy?: { move: string; targetSatisfaction: string }
  achievement?: { id: string; family: string; title: string; description: string; affordance: string }
  hard?: { requiresBar: boolean }
}

type PartyCard = {
  id: string
  suit: { code: string; name: string }
  rank: string
  title: string
  image_file: string
  crop_saved?: boolean
  crop?: { x: number; y: number; zoom: number }
  flavor: Record<Depth, { line: string; npc: string; title: string }>
  readings: Record<Lens, Record<Depth, Reading>>
}

type BoardPlay = {
  playEventId: string
  playerName: string
  cardId: string
  lens: Lens
  depth: Depth
  prompt: string
  cardTitle: string
  playedAt: string
  completedAt: string | null
  achievement: { id: string; family: string; title: string; affordance: string } | null
}

type GmSlot = {
  slot: number
  timeLabel: string
  cardId: string
  lens: Lens
  depth: Depth
  title: string
  prompt: string
}

type PartyPayload = {
  ok: boolean
  player_id: string | null
  party: {
    title: string
    subtitle: string
    host_note: string
    date: string | null
    location: string | null
    schedule: { time: string; title: string; details: string }[]
  }
  cards: PartyCard[]
  board: {
    featured_gm_card: GmSlot | null
    unlocked_gm_cards: GmSlot[]
    gm_unlocked_count: number
    gm_total: number
    active_plays: BoardPlay[]
    completed_plays: BoardPlay[]
  }
  hand: {
    started: boolean
    cycle: number
    hand: string[]
    resolved_count: number
    cycle_remaining: number
  }
  achievements: {
    id: string
    family: string
    title: string
    description: string
    affordance: string
    unlockedAt: string
  }[]
  gates: { party_started: boolean; spicy_play_unlocked: boolean; server_time: string }
}

const P = GOODBYE_PALETTE

const CARD_PALETTE: PartyCardPalette = {
  accent: P.gold,
  cream: P.cream,
  headerFrom: P.emerald,
  headerTo: P.plum,
  glow: 'rgba(227, 179, 65, 0.18)',
}

const SPICY_CARD_PALETTE: PartyCardPalette = {
  ...CARD_PALETTE,
  accent: P.spicy,
  glow: 'rgba(212, 69, 107, 0.24)',
}

/** Poll cadence while the party is live, so host edits reach clients. */
const ACTIVE_REFETCH_MS = 20_000

const DEPTHS: Depth[] = ['easy', 'medium', 'hard']
const LENS_LABEL: Record<Lens, string> = { goodbye: 'Goodbye', spicy: 'Spicy' }

const FAMILY_LABEL: Record<string, string> = {
  invocation: 'Shaman · invocation',
  challenge: 'Challenger · challenge',
  stewardship: 'Regent · stewardship',
  coordination: 'Architect · coordination',
  interface: 'Diplomat · interface',
  legacy: 'Sage · legacy',
}

function buttonStyle(primary = false, disabled = false, tone: string = P.gold): CSSProperties {
  return {
    border: primary ? 'none' : `1px solid ${tone}`,
    background: primary ? tone : 'transparent',
    color: primary ? P.plum : tone,
    borderRadius: 6,
    padding: '0.6rem 0.9rem',
    fontFamily: 'Georgia, serif',
    fontSize: '0.88rem',
    fontWeight: primary ? 700 : 400,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    minHeight: 44,
  }
}

function fieldStyle(): CSSProperties {
  return {
    width: '100%',
    border: `1px solid rgba(227, 179, 65, 0.45)`,
    borderRadius: 6,
    background: 'rgba(0, 0, 0, 0.25)',
    color: P.cream,
    boxSizing: 'border-box',
    padding: '0.65rem 0.75rem',
    fontFamily: 'Georgia, serif',
    fontSize: '0.95rem',
    minHeight: 44,
  }
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section
      style={{
        background: P.panel,
        border: `1px solid rgba(227, 179, 65, 0.24)`,
        borderRadius: 8,
        padding: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          margin: '0 0 0.85rem',
        }}
      >
        <h2
          style={{
            color: P.gold,
            fontFamily: 'Georgia, serif',
            fontSize: '0.95rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Toggle<T extends string>({
  options,
  value,
  onChange,
  tone,
  disabledHint,
}: {
  options: { value: T; label: string; disabled?: boolean }[]
  value: T
  onChange: (next: T) => void
  tone?: string
  disabledHint?: string
}) {
  return (
    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
      {options.map((option) => {
        const active = option.value === value
        const accent = tone || P.gold
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            title={option.disabled ? disabledHint : undefined}
            style={{
              ...buttonStyle(active, false, accent),
              padding: '0.45rem 0.75rem',
              minHeight: 40,
              fontSize: '0.82rem',
              opacity: option.disabled && !active ? 0.55 : 1,
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || json.ok === false) throw new Error(json.error || 'That did not go through')
  return json as T
}

function countdown(toIso: string | null, fromIso: string): string {
  if (!toIso) return ''
  const ms = Date.parse(toIso) - Date.parse(fromIso)
  if (ms <= 0) return ''
  const minutes = Math.floor(ms / 60_000)
  const hours = Math.floor(minutes / 60)
  // More than a day out, a countdown is noise — the date already says it.
  if (hours >= 24) return ''
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m`
}

const PARTY_START_ISO = '2026-08-15T20:00:00-07:00'
const SPICY_UNLOCK_ISO = '2026-08-16T00:00:00-07:00'

export function GoodbyePartyApp() {
  const [payload, setPayload] = useState<PartyPayload | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [joinName, setJoinName] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [lens, setLens] = useState<Record<string, Lens>>({})
  const [depth, setDepth] = useState<Record<string, Depth>>({})
  const [browseIndex, setBrowseIndex] = useState(0)
  const [browseOpen, setBrowseOpen] = useState(false)
  const [lastAchievement, setLastAchievement] = useState<PartyPayload['achievements'][number] | null>(null)
  const [adminToken, setAdminToken] = useState('')
  const [showHost, setShowHost] = useState(false)
  const [editDraft, setEditDraft] = useState({ card_id: '', lens: 'goodbye' as Lens, depth: 'easy' as Depth, prompt: '' })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/party/goodbye', { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok || json.ok === false) throw new Error(json.error || 'Could not load the party')
    setPayload(json as PartyPayload)
    return json as PartyPayload
  }, [])

  useEffect(() => {
    load().catch((err) => setNotice(err instanceof Error ? err.message : 'Could not load the party'))
  }, [load])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPlayerName(window.localStorage.getItem('goodbye_party_player') || '')
    setAdminToken(window.localStorage.getItem('goodbye_party_admin') || '')
    setShowHost(new URLSearchParams(window.location.search).get('host') === '1')
  }, [])

  // Live-edit propagation: a light poll while the party is running. No websockets.
  useEffect(() => {
    if (!payload?.gates.party_started) return
    pollRef.current = setInterval(() => {
      load().catch(() => {
        /* a dropped poll should never interrupt the party */
      })
    }, ACTIVE_REFETCH_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [payload?.gates.party_started, load])

  const cardMap = useMemo(() => {
    const map = new Map<string, PartyCard>()
    for (const card of payload?.cards || []) map.set(card.id, card)
    return map
  }, [payload?.cards])

  const spicyUnlocked = Boolean(payload?.gates.spicy_play_unlocked)
  const started = Boolean(payload?.gates.party_started)
  const joined = Boolean(payload?.player_id) && Boolean(playerName)

  const lensFor = useCallback((cardId: string): Lens => lens[cardId] || 'goodbye', [lens])
  const depthFor = useCallback((cardId: string): Depth => depth[cardId] || 'easy', [depth])

  const join = useCallback(async () => {
    const name = joinName.trim()
    if (!name) return
    setBusy(true)
    try {
      await postJson('/api/party/goodbye/join', { name })
      window.localStorage.setItem('goodbye_party_player', name)
      setPlayerName(name)
      setNotice('')
      await load()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not join')
    } finally {
      setBusy(false)
    }
  }, [joinName, load])

  const resolve = useCallback(
    async (cardId: string, action: 'play' | 'discard') => {
      if (busy) return
      setBusy(true)
      try {
        const json = await postJson<PartyPayload>('/api/party/goodbye/hand', {
          card_id: cardId,
          action,
          lens: lensFor(cardId),
          depth: depthFor(cardId),
        })
        setPayload(json)
        setNotice(action === 'play' ? 'On the board. Go do it.' : 'Discarded. New card dealt.')
      } catch (err) {
        setNotice(err instanceof Error ? err.message : 'That did not go through')
        await load().catch(() => null)
      } finally {
        setBusy(false)
      }
    },
    [busy, lensFor, depthFor, load],
  )

  const complete = useCallback(
    async (playEventId: string) => {
      if (busy) return
      setBusy(true)
      try {
        const json = await postJson<PartyPayload & { achievement: PartyPayload['achievements'][number] | null; bar_id: string | null }>(
          '/api/party/goodbye/board/complete',
          { play_event_id: playEventId },
        )
        setPayload(json)
        if (json.achievement) {
          setLastAchievement({ ...json.achievement, unlockedAt: new Date().toISOString() })
          setNotice('')
        } else {
          setNotice('Marked done.')
        }
      } catch (err) {
        setNotice(err instanceof Error ? err.message : 'Could not record that')
      } finally {
        setBusy(false)
      }
    },
    [busy],
  )

  const hostAction = useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true)
      try {
        const json = await postJson<PartyPayload>('/api/party/goodbye/admin/gm', {
          ...body,
          admin_token: adminToken,
        })
        setPayload(json)
        window.localStorage.setItem('goodbye_party_admin', adminToken)
        setNotice('Done.')
      } catch (err) {
        setNotice(err instanceof Error ? err.message : 'Host action failed')
      } finally {
        setBusy(false)
      }
    },
    [adminToken],
  )

  const saveEdit = useCallback(async () => {
    if (!editDraft.card_id || !editDraft.prompt.trim()) return
    setBusy(true)
    try {
      const json = await postJson<PartyPayload>('/api/party/goodbye/admin/card-override', {
        admin_token: adminToken,
        card_id: editDraft.card_id,
        prompts: { [editDraft.lens]: { [editDraft.depth]: editDraft.prompt } },
      })
      setPayload(json)
      window.localStorage.setItem('goodbye_party_admin', adminToken)
      setNotice(`Patched ${editDraft.card_id} · ${LENS_LABEL[editDraft.lens]} · ${editDraft.depth}.`)
      setEditDraft((draft) => ({ ...draft, prompt: '' }))
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not save the edit')
    } finally {
      setBusy(false)
    }
  }, [adminToken, editDraft])

  const renderCard = (card: PartyCard, options: { inHand: boolean }) => {
    const activeLens = lensFor(card.id)
    const activeDepth = depthFor(card.id)
    const reading = card.readings[activeLens][activeDepth]
    const spicyBlocked = activeLens === 'spicy' && !spicyUnlocked
    const palette = activeLens === 'spicy' ? SPICY_CARD_PALETTE : CARD_PALETTE

    return (
      <div
        key={card.id}
        style={{
          display: 'grid',
          gap: '0.6rem',
          justifyItems: 'center',
          border: `1px solid rgba(227, 179, 65, 0.2)`,
          borderRadius: 10,
          padding: '0.85rem',
          background: 'rgba(0,0,0,0.16)',
        }}
      >
        <PartyCardFace
          card={card}
          palette={palette}
          prompt={reading.prompt}
          flavorLine={card.flavor?.[activeDepth]?.line}
          flavorAttribution={
            card.flavor?.[activeDepth] ? `- ${card.flavor[activeDepth].npc}` : undefined
          }
          ribbon={LENS_LABEL[activeLens]}
        />

        <Toggle
          options={[
            { value: 'goodbye' as Lens, label: 'Goodbye' },
            { value: 'spicy' as Lens, label: spicyUnlocked ? 'Spicy' : 'Spicy 🔒' },
          ]}
          value={activeLens}
          onChange={(next) => setLens((prev) => ({ ...prev, [card.id]: next }))}
          tone={activeLens === 'spicy' ? P.spicy : P.gold}
        />

        <Toggle
          options={DEPTHS.map((value) => ({
            value,
            label: value[0].toUpperCase() + value.slice(1),
          }))}
          value={activeDepth}
          onChange={(next) => setDepth((prev) => ({ ...prev, [card.id]: next }))}
          tone={activeLens === 'spicy' ? P.spicy : P.gold}
        />

        {reading.achievement && (
          <p style={{ margin: 0, fontSize: '0.72rem', color: P.gold, opacity: 0.85, textAlign: 'center' }}>
            {/* The title already carries the family verb — no need to repeat it here. */}
            Finishing this earns <strong>{reading.achievement.title}</strong>
          </p>
        )}

        {activeDepth === 'hard' && reading.hard?.requiresBar && (
          <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.65, textAlign: 'center' }}>
            Hard makes something durable — it gets captured to your vault when you mark it done.
          </p>
        )}

        {spicyBlocked && (
          <p style={{ margin: 0, fontSize: '0.72rem', color: P.spicy, textAlign: 'center' }}>
            Read all the Spicy you like. Playing it opens at midnight.
          </p>
        )}

        {options.inHand && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              disabled={busy || spicyBlocked}
              onClick={() => resolve(card.id, 'play')}
              style={buttonStyle(true, busy || spicyBlocked, activeLens === 'spicy' ? P.spicy : P.gold)}
            >
              Play
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => resolve(card.id, 'discard')}
              style={buttonStyle(false, busy)}
            >
              Discard
            </button>
          </div>
        )}
      </div>
    )
  }

  const myActivePlays = (payload?.board.active_plays || []).filter(
    (play) => play.playerName === playerName,
  )

  const browseCards = payload?.cards || []
  const browseCard = browseCards[browseIndex % Math.max(1, browseCards.length)]

  return (
    <main
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${P.background}, ${P.plum})`,
        color: P.cream,
        fontFamily: 'Georgia, serif',
        padding: '1rem 0.9rem 4rem',
        overflowX: 'hidden',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <header style={{ textAlign: 'center', display: 'grid', gap: '0.35rem' }}>
          <h1 style={{ margin: 0, color: P.gold, fontSize: '1.7rem', lineHeight: 1.1 }}>
            {payload?.party.title || 'Goodbye Yellow Brick Road'}
          </h1>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '0.92rem' }}>
            {payload?.party.subtitle || ''}
          </p>
          {payload?.party.date && (
            <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem' }}>
              {payload.party.date}
              {payload.party.location ? ` · ${payload.party.location}` : ''}
            </p>
          )}
        </header>

        {notice && (
          <p
            style={{
              margin: 0,
              padding: '0.6rem 0.8rem',
              border: `1px solid ${P.gold}`,
              borderRadius: 6,
              fontSize: '0.85rem',
              background: 'rgba(0,0,0,0.25)',
            }}
          >
            {notice}
          </p>
        )}

        {!joined && (
          <Panel title="Join">
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.8 }}>
                First name is enough. No account, no password.
              </p>
              <input
                value={joinName}
                onChange={(event) => setJoinName(event.target.value)}
                placeholder="Your name"
                style={fieldStyle()}
              />
              <button type="button" disabled={busy || !joinName.trim()} onClick={join} style={buttonStyle(true, busy)}>
                I&rsquo;m here
              </button>
            </div>
          </Panel>
        )}

        {payload?.board.featured_gm_card && (
          <Panel title={`Featured · ${payload.board.featured_gm_card.timeLabel}`}>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <h3 style={{ margin: 0, color: P.gold, fontSize: '1.15rem' }}>
                {payload.board.featured_gm_card.title}
              </h3>
              <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.95rem' }}>
                {payload.board.featured_gm_card.prompt}
              </p>
              <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.6 }}>
                Anyone can run this. Several of you can run it at once.
                {' '}
                {payload.board.gm_unlocked_count} of {payload.board.gm_total} unlocked.
              </p>
            </div>
          </Panel>
        )}

        {!started && (
          <Panel title="Before eight">
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                Hands are dealt at 8:00 PM
                {payload ? ` — ${countdown(PARTY_START_ISO, payload.gates.server_time) || 'any minute now'}` : ''}
                . Until then the whole Oracle is open. Read anything, in either lens,
                at any depth. Browsing costs you nothing and changes nothing.
              </p>
              <button
                type="button"
                onClick={() => setBrowseOpen((open) => !open)}
                style={buttonStyle(true, false)}
              >
                {browseOpen ? 'Close the Oracle' : 'Browse the Oracle'}
              </button>
            </div>
          </Panel>
        )}

        {browseOpen && browseCard && (
          <Panel
            title={`Browsing · ${browseIndex + 1} of ${browseCards.length}`}
            action={
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setBrowseIndex((i) => (i - 1 + browseCards.length) % browseCards.length)}
                  style={{ ...buttonStyle(), padding: '0.4rem 0.7rem', minHeight: 40 }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => setBrowseIndex((i) => (i + 1) % browseCards.length)}
                  style={{ ...buttonStyle(), padding: '0.4rem 0.7rem', minHeight: 40 }}
                >
                  ›
                </button>
              </div>
            }
          >
            {renderCard(browseCard, { inHand: false })}
          </Panel>
        )}

        {joined && started && (
          <Panel
            title="Your hand"
            action={
              <span style={{ fontSize: '0.72rem', opacity: 0.6 }}>
                cycle {payload?.hand.cycle} · {payload?.hand.cycle_remaining} left in the deck
              </span>
            }
          >
            {payload?.hand.hand.length ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {payload.hand.hand
                  .map((cardId) => cardMap.get(cardId))
                  .filter(Boolean)
                  .map((card) => renderCard(card as PartyCard, { inHand: true }))}
              </div>
            ) : (
              <div style={{ display: 'grid', justifyItems: 'center', gap: '0.6rem' }}>
                <PartyCardBack />
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Dealing…</p>
              </div>
            )}
          </Panel>
        )}

        {joined && myActivePlays.length > 0 && (
          <Panel title="Yours in play">
            <div style={{ display: 'grid', gap: '0.7rem' }}>
              {myActivePlays.map((play) => (
                <div
                  key={play.playEventId}
                  style={{
                    border: `1px solid rgba(227, 179, 65, 0.25)`,
                    borderRadius: 8,
                    padding: '0.7rem',
                    display: 'grid',
                    gap: '0.45rem',
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.72rem', color: P.gold, letterSpacing: '0.06em' }}>
                    {play.cardTitle.toUpperCase()} · {LENS_LABEL[play.lens]} · {play.depth}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.45 }}>{play.prompt}</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => complete(play.playEventId)}
                    style={buttonStyle(true, busy)}
                  >
                    I did this
                  </button>
                </div>
              ))}
              <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.55 }}>
                Optional. A card can sit here all night without costing you anything.
              </p>
            </div>
          </Panel>
        )}

        {lastAchievement && (
          <Panel title="Unlocked">
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <h3 style={{ margin: 0, color: P.gold, fontSize: '1.1rem' }}>{lastAchievement.title}</h3>
              <p style={{ margin: 0, fontSize: '0.72rem', opacity: 0.7 }}>
                {FAMILY_LABEL[lastAchievement.family] || lastAchievement.family}
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.45 }}>{lastAchievement.description}</p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.88rem',
                  lineHeight: 1.45,
                  borderLeft: `2px solid ${P.gold}`,
                  paddingLeft: '0.6rem',
                }}
              >
                {lastAchievement.affordance}
              </p>
              <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.55 }}>
                Good for tonight only. It gives you standing to start something — never a claim on
                anyone else&rsquo;s yes.
              </p>
              <button type="button" onClick={() => setLastAchievement(null)} style={buttonStyle()}>
                Close
              </button>
            </div>
          </Panel>
        )}

        <Panel title="The board">
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            <div>
              <p style={{ margin: '0 0 0.4rem', fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.65 }}>
                ACTIVE
              </p>
              {payload?.board.active_plays.length ? (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {payload.board.active_plays.slice(0, 20).map((play) => (
                    <div key={play.playEventId} style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>
                      <strong style={{ color: play.lens === 'spicy' ? P.spicy : P.gold }}>
                        {play.playerName}
                      </strong>{' '}
                      — {play.prompt}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.55 }}>Nothing in play yet.</p>
              )}
            </div>

            <div>
              <p style={{ margin: '0 0 0.4rem', fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.65 }}>
                RECENTLY DID THIS
              </p>
              {payload?.board.completed_plays.length ? (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {payload.board.completed_plays.slice(0, 12).map((play) => (
                    <div key={play.playEventId} style={{ fontSize: '0.88rem', lineHeight: 1.4, opacity: 0.9 }}>
                      <strong style={{ color: P.gold }}>{play.playerName}</strong> — {play.cardTitle}
                      {play.achievement ? ` · ${play.achievement.title}` : ''}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.55 }}>Nobody yet. Be first.</p>
              )}
            </div>
          </div>
        </Panel>

        {payload && !spicyUnlocked && (
          <p style={{ margin: 0, textAlign: 'center', fontSize: '0.78rem', color: P.spicy, opacity: 0.85 }}>
            Spicy play opens at midnight
            {countdown(SPICY_UNLOCK_ISO, payload.gates.server_time)
              ? ` — ${countdown(SPICY_UNLOCK_ISO, payload.gates.server_time)}`
              : ''}
            . Reading it is open now.
          </p>
        )}

        {payload?.achievements.length ? (
          <Panel title="Yours tonight">
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {payload.achievements.map((achievement) => (
                <div key={achievement.id} style={{ fontSize: '0.86rem', lineHeight: 1.4 }}>
                  <strong style={{ color: P.gold }}>{achievement.title}</strong>
                  <span style={{ opacity: 0.6 }}> · {FAMILY_LABEL[achievement.family] || achievement.family}</span>
                  <div style={{ opacity: 0.75, fontSize: '0.82rem' }}>{achievement.affordance}</div>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}

        {showHost && (
          <Panel title="Host">
            <div style={{ display: 'grid', gap: '0.7rem' }}>
              <input
                value={adminToken}
                onChange={(event) => setAdminToken(event.target.value)}
                placeholder="Host token"
                style={fieldStyle()}
              />
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" disabled={busy} onClick={() => hostAction({ action: 'unlock_next' })} style={buttonStyle(true, busy)}>
                  Unlock next GM card
                </button>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {(payload?.board.unlocked_gm_cards || []).map((slot) => (
                  <button
                    key={slot.slot}
                    type="button"
                    disabled={busy}
                    onClick={() => hostAction({ action: 'feature', slot: slot.slot })}
                    style={{ ...buttonStyle(), padding: '0.4rem 0.6rem', minHeight: 38, fontSize: '0.78rem' }}
                  >
                    {slot.timeLabel}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gap: '0.45rem' }}>
                <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.7 }}>Patch a reading</p>
                <select
                  value={editDraft.card_id}
                  onChange={(event) => setEditDraft((draft) => ({ ...draft, card_id: event.target.value }))}
                  style={fieldStyle()}
                >
                  <option value="">Pick a card</option>
                  {(payload?.cards || []).map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.id} — {card.title}
                    </option>
                  ))}
                </select>
                <Toggle
                  options={[
                    { value: 'goodbye' as Lens, label: 'Goodbye' },
                    { value: 'spicy' as Lens, label: 'Spicy' },
                  ]}
                  value={editDraft.lens}
                  onChange={(next) => setEditDraft((draft) => ({ ...draft, lens: next }))}
                />
                <Toggle
                  options={DEPTHS.map((value) => ({ value, label: value }))}
                  value={editDraft.depth}
                  onChange={(next) => setEditDraft((draft) => ({ ...draft, depth: next }))}
                />
                <textarea
                  value={editDraft.prompt}
                  onChange={(event) => setEditDraft((draft) => ({ ...draft, prompt: event.target.value }))}
                  placeholder="Replacement prompt"
                  style={{ ...fieldStyle(), minHeight: 96 }}
                />
                <button type="button" disabled={busy} onClick={saveEdit} style={buttonStyle(true, busy)}>
                  Save patch
                </button>
              </div>

              {payload?.board.active_plays.length ? (
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.7 }}>Hide a play</p>
                  {payload.board.active_plays.slice(0, 10).map((play) => (
                    <button
                      key={play.playEventId}
                      type="button"
                      disabled={busy}
                      onClick={() => hostAction({ action: 'hide_play', play_event_id: play.playEventId })}
                      style={{ ...buttonStyle(), textAlign: 'left', fontSize: '0.78rem' }}
                    >
                      Hide: {play.playerName} — {play.prompt.slice(0, 60)}…
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </Panel>
        )}

        <p style={{ margin: 0, textAlign: 'center', fontSize: '0.75rem', opacity: 0.5, lineHeight: 1.5 }}>
          {payload?.party.host_note || ''}
        </p>
      </div>
    </main>
  )
}
