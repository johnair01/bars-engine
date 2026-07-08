'use client'

// ---------------------------------------------------------------------------
// PracticeCard — the POST-CARD formation, in the ALLYSHIP DECK design language
// (not CultivationCard — see docs/CARD_SYSTEM_ALIGNMENT.md). The drawn card
// becomes the practice: gold edge, DECK_FONTS, themeForMove(drawnMove) gradient,
// the move glyph. The emotional channel appears as a SECONDARY accent (the
// charge's signature inside the drawn card). Contrast with the pre-card raw
// diagnostic (SceneCard) — UI_COVENANT law 10.
// ---------------------------------------------------------------------------

import { useState, useTransition, type CSSProperties } from 'react'
import { SURFACE_TOKENS, ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import {
  themeForMove,
  DECK_GOLD,
  INSET_TOP,
  DECK_FONTS,
  MOVE_LABELS,
  MOVE_ICON_PATHS,
  MOVE_ICON_FILLED,
} from '@/lib/allyship-deck/card-visuals'
import type { MoveCard } from '@/lib/allyship-deck/types'
import {
  getToolById,
  EMOTION_TO_ELEMENT,
  isCrisisIntensity,
  crisisResources,
  type PracticeRecommendation,
  type EmotionalVector,
  type EmotionChannel,
  type AlchemySource,
  type DiagnosticFlag,
} from '@/lib/emotional-alchemy'
import { logAlchemySession } from '@/actions/alchemy-session'

/** What the practice card needs to log a session (service Phase 1). */
export interface PracticeLogContext {
  source: AlchemySource
  barId?: string
  threadLabel?: string
  drawnCardId?: string
  flags: DiagnosticFlag[]
}

const CHANNEL_LABEL: Record<EmotionChannel, string> = { anger: 'Anger', sadness: 'Sadness', fear: 'Fear', joy: 'Joy', neutrality: 'Neutrality' }

const kicker: CSSProperties = { fontFamily: DECK_FONTS.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: SURFACE_TOKENS.textSecondary }
const body: CSSProperties = { fontFamily: DECK_FONTS.body, color: SURFACE_TOKENS.textPrimary }

function MoveGlyph({ move, color, size = 30 }: { move: MoveCard['move']; color: string; size?: number }) {
  const filled = MOVE_ICON_FILLED[move]
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden style={{ flex: 'none' }}>
      {MOVE_ICON_PATHS[move].map((d, i) => (
        <path key={i} d={d} fill={filled ? color : 'none'} stroke={filled ? 'none' : color} strokeWidth={filled ? 0 : 3} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  )
}

function channelGem(channel: EmotionChannel): string {
  return ELEMENT_TOKENS[EMOTION_TO_ELEMENT[channel]].gem
}

function ReRate({ before, after, onRate }: { before: number; after: number | null; onRate: (n: number) => void }) {
  const setAfter = onRate
  const highDistress = after !== null && isCrisisIntensity(after) // 9–10 after the rep → escalate
  const delta = after === null ? null : before - after
  const verdict = delta === null ? null : delta >= 2 ? 'moved' : delta <= -2 ? 'worse' : 'flat'
  const message: Record<string, string> = {
    moved: 'That moved. Worth logging — the charge is lighter than it was.',
    flat: 'Barely shifted. One different tool, or just capture it — either is honest.',
    worse: 'It got louder. That is data, not failure — ground first, then a different tool.',
  }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <span style={kicker}>Re-rate · how loud now?</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 5 }}>
        {Array.from({ length: 11 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAfter(i)}
            style={{
              minHeight: 40, borderRadius: 8, fontFamily: DECK_FONTS.mono, fontSize: 13,
              border: `1px solid ${after === i ? DECK_GOLD : 'rgba(255,255,255,.12)'}`,
              background: after === i ? 'rgba(201,168,76,.14)' : 'transparent',
              color: after === i ? DECK_GOLD : SURFACE_TOKENS.textSecondary, cursor: 'pointer',
            }}
          >
            {i}
          </button>
        ))}
      </div>
      {verdict && !highDistress && <p style={{ ...body, fontSize: 14, color: verdict === 'worse' ? '#f0c84a' : SURFACE_TOKENS.textPrimary, margin: 0 }}>{before} → {after}. {message[verdict]}</p>}
      {highDistress && (
        <div style={{ background: 'rgba(240,200,74,.08)', border: '1px solid rgba(240,200,74,.4)', borderRadius: 10, padding: 14, display: 'grid', gap: 8 }}>
          <p style={{ ...body, fontSize: 14, color: '#f0c84a', margin: 0 }}>{before} → {after}. Still at a {after} after the rep — a practice may not be enough right now. Reaching out is the strong move:</p>
          {crisisResources().map((r) => (
            <p key={r.label} style={{ ...body, fontSize: 13, color: SURFACE_TOKENS.textPrimary, margin: 0 }}>
              <strong>{r.label}</strong> — {r.contact}{r.note ? ` · ${r.note}` : ''}
            </p>
          ))}
        </div>
      )}
      <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted }}>Not saved — this is your rep to keep.</span>
    </div>
  )
}

export function PracticeCard({ card, rec, vector, logContext }: { card: MoveCard; rec: PracticeRecommendation; vector: EmotionalVector; logContext?: PracticeLogContext }) {
  const [showWhy, setShowWhy] = useState(false)
  const [picked, setPicked] = useState<'internal' | 'external' | null>(null)
  const [after, setAfter] = useState<number | null>(null)
  const [logState, setLogState] = useState<'idle' | 'saved' | 'signin' | 'error'>('idle')
  const [saving, startSave] = useTransition()

  function logRep() {
    if (!logContext) return
    startSave(async () => {
      const res = await logAlchemySession({
        chargeSourceBarId: logContext.barId,
        source: logContext.source,
        vectorBefore: vector,
        drawnCardId: logContext.drawnCardId,
        toolId: rec.primaryToolId,
        rolePath: rec.rolePath,
        showUp: picked ? { kind: picked } : undefined,
        vectorAfterIntensity: after ?? undefined,
        threadLabel: logContext.threadLabel,
        flags: logContext.flags,
      })
      setLogState('error' in res ? (res.error === 'Not logged in' ? 'signin' : 'error') : 'saved')
    })
  }

  const t = themeForMove(card.move)
  const tool = getToolById(rec.primaryToolId)
  const prependTool = rec.prepend ? getToolById(rec.prepend) : null
  const gem = channelGem(vector.channel)

  const rootStyle: CSSProperties = {
    position: 'relative',
    borderRadius: 14,
    border: `2px solid ${DECK_GOLD}`,
    background: `radial-gradient(120% 90% at 78% 8%, ${t.gradFrom}, ${t.gradTo} 64%)`,
    boxShadow: `${INSET_TOP}, 0 0 26px 1px color-mix(in srgb, ${t.glow} 34%, transparent), 0 18px 40px -20px rgba(0,0,0,.9)`,
    padding: 20,
    display: 'grid',
    gap: 18,
  }
  const wellStyle: CSSProperties = { background: 'rgba(0,0,0,.28)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: 14 }
  const showUpBtn = (on: boolean): CSSProperties => ({
    width: '100%', textAlign: 'left', borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
    border: `1px solid ${on ? DECK_GOLD : 'rgba(255,255,255,.12)'}`, background: on ? 'rgba(201,168,76,.12)' : 'rgba(0,0,0,.22)',
    color: SURFACE_TOKENS.textPrimary,
  })

  return (
    <div style={rootStyle}>
      {/* Grounding prepend (hot charge, §4.1 step 1). */}
      {prependTool && (
        <div style={{ ...wellStyle, borderColor: 'rgba(240,200,74,.4)' }}>
          <span style={{ ...kicker, color: '#f0c84a' }}>First · {prependTool.timebox.minMinutes}–{prependTool.timebox.maxMinutes} min</span>
          <p style={{ ...body, fontSize: 14, margin: '4px 0 0' }}>{prependTool.barsName} — cool the charge before the move.</p>
        </div>
      )}

      {/* Header — the drawn card becomes the practice. Move glyph + move label
          (theme), channel gem accent (the charge's signature). */}
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MoveGlyph move={card.move} color={t.gem} />
            <span style={{ fontFamily: DECK_FONTS.mono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.gem }}>{MOVE_LABELS[card.move]}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: gem, display: 'inline-block' }} />
            <span style={{ ...kicker }}>{CHANNEL_LABEL[vector.channel]} {vector.intensity}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 800, fontSize: 24, color: '#fff', margin: 0 }}>{tool?.barsName ?? rec.primaryToolId}</h2>
          <span style={{ fontFamily: DECK_FONTS.mono, fontSize: 14, color: DECK_GOLD, flex: 'none' }}>{rec.timeboxMinutes} min</span>
        </div>
        {tool && <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted }}>{tool.genericName} · {card.title}</span>}
      </div>

      {rec.bridged && <p style={{ ...body, fontSize: 13, fontStyle: 'italic', color: SURFACE_TOKENS.textSecondary, margin: 0 }}>Your drawn move is banked for later — we cool and metabolize the charge first.</p>}

      {/* Stance question — the drawn card's question. */}
      {rec.stanceQuestion && (
        <p style={{ ...body, fontSize: 16, lineHeight: 1.5, borderLeft: `2px solid ${DECK_GOLD}`, paddingLeft: 14, margin: 0 }}>{rec.stanceQuestion}</p>
      )}

      {/* Protocol well — spirit step (last) carries the ♦ gold accent. */}
      <div style={wellStyle}>
        <span style={kicker}>The practice</span>
        <ol style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'grid', gap: 10 }}>
          {rec.protocol.map((step, i) => {
            const isSpirit = step === rec.spiritStep
            return (
              <li key={i} style={{ ...body, fontSize: 14, lineHeight: 1.5, display: 'flex', gap: 10 }}>
                <span aria-hidden style={{ marginTop: 6, width: 6, height: 6, borderRadius: '50%', flex: 'none', background: isSpirit ? DECK_GOLD : 'rgba(255,255,255,.28)' }} />
                <span style={{ color: isSpirit ? '#fff' : SURFACE_TOKENS.textPrimary }}>{step}</span>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Show Up — primary action (§1.7). */}
      <div style={{ display: 'grid', gap: 8 }}>
        <span style={kicker}>Show up · make it real</span>
        <button type="button" onClick={() => setPicked('internal')} style={showUpBtn(picked === 'internal')}>
          <span style={{ ...kicker, display: 'block' }}>Internal</span>
          <span style={{ ...body, fontSize: 14, marginTop: 4, display: 'block' }}>{rec.showUp.internal}</span>
        </button>
        {rec.showUp.external ? (
          <button type="button" onClick={() => setPicked('external')} style={showUpBtn(picked === 'external')}>
            <span style={{ ...kicker, display: 'block' }}>External{rec.showUp.externalGated ? ' · when the charge cools' : ''}</span>
            <span style={{ ...body, fontSize: 14, marginTop: 4, display: 'block' }}>{rec.showUp.external}</span>
          </button>
        ) : (
          <p style={{ ...body, fontSize: 13, color: SURFACE_TOKENS.textSecondary, border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '12px 14px', margin: 0 }}>
            Internal only for now — nothing external is aimed at the person who caused this by default. That is your call to make, later.
          </p>
        )}
      </div>

      {/* Re-rate close (§1.5). */}
      {picked && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 16 }}>
          <ReRate before={vector.intensity} after={after} onRate={setAfter} />
        </div>
      )}

      {/* Log the rep — the "extension of BARs logging" (service Phase 1). Only
          when a log context is present (a seeded/authenticated session). */}
      {logContext && picked && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 16, display: 'grid', gap: 8 }}>
          {logState === 'saved' ? (
            <span style={{ ...kicker, color: DECK_GOLD }}>Logged to this charge — it&apos;s part of your practice now.</span>
          ) : logState === 'signin' ? (
            <span style={{ ...body, fontSize: 13, color: SURFACE_TOKENS.textSecondary }}>Sign in to keep this rep on your charge&apos;s history.</span>
          ) : (
            <>
              <button
                type="button"
                onClick={logRep}
                disabled={saving}
                style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 14, background: DECK_GOLD, border: `1px solid ${DECK_GOLD}`, borderRadius: 10, padding: '11px 20px', color: '#150a04', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, justifySelf: 'start' }}
              >
                {saving ? 'Logging…' : 'Log this rep →'}
              </button>
              {logState === 'error' && <span style={{ ...body, fontSize: 13, color: '#f0c84a' }}>Couldn&apos;t log that — try again.</span>}
            </>
          )}
        </div>
      )}

      {/* Inspectable reasoning (§8). */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 12 }}>
        <button type="button" onClick={() => setShowWhy((s) => !s)} style={{ ...kicker, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: SURFACE_TOKENS.textMuted }}>
          {showWhy ? 'Hide' : 'Why this tool?'}
        </button>
        {showWhy && (
          <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            <p style={{ ...body, fontSize: 12, color: SURFACE_TOKENS.textSecondary, margin: 0 }}>Considered: {rec.candidatesConsidered.map((c) => `${c.toolId} (${c.score})`).join(' · ')}</p>
            <p style={{ ...body, fontSize: 12, color: SURFACE_TOKENS.textSecondary, margin: 0 }}>Role: {rec.rolePath.join(' → ')}{rec.guardsApplied.length ? ` · Guards: ${rec.guardsApplied.join(', ')}` : ''}</p>
            {rec.notes.map((n, i) => (
              <p key={i} style={{ ...body, fontSize: 12, color: SURFACE_TOKENS.textSecondary, margin: 0, lineHeight: 1.5 }}>› {n}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
