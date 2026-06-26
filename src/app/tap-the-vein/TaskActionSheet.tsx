'use client'

/**
 * TaskActionSheet — bottom sheet for per-task actions (design handoff §09–§11).
 * Three modes: menu → (compost | assign). Parent owns the server calls; this
 * component only emits intent via onAction and switches sub-modes locally.
 *
 * Tier 1: "Upgrade — quest or daemon" emits a plain upgrade (records the
 * lifecycle transition). The quest/daemon ceremony + ♦ spend is Tier 2.
 */

import { useState } from 'react'
import { CultivationCard, type ElementKey } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import type { TtvTaskDTO, TtvCampaignOption } from '@/actions/tap-the-vein'

export type SheetAction =
  | { kind: 'start' }
  | { kind: 'complete' }
  | { kind: 'carry' }
  | { kind: 'keep' }
  | { kind: 'upgrade' }
  | { kind: 'compost'; reason: string }
  | { kind: 'assign'; campaignId: string; visibility: 'campaign' | null }

const COMPOST_REASONS: Array<{ key: string; label: string; hint: string }> = [
  { key: 'not_relevant', label: 'Not relevant', hint: 'stopped mattering' },
  { key: 'already_done', label: 'Already done', hint: 'handled earlier' },
  { key: 'assigned_elsewhere', label: 'Assigned elsewhere', hint: 'someone else owns it' },
  { key: 'too_small', label: 'Too small', hint: 'not worth a card' },
  { key: 'too_big', label: 'Too big', hint: 'make it a quest' },
  { key: 'other', label: 'Other', hint: 'name your own' },
]

const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
      {children}
    </span>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: display, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '6px 0 0' }}>
      {children}
    </h2>
  )
}

export function TaskActionSheet({
  task,
  element,
  nationName,
  campaigns,
  busy,
  onAction,
  onClose,
}: {
  task: TtvTaskDTO
  element: ElementKey
  nationName: string | null
  campaigns: TtvCampaignOption[]
  busy: boolean
  onAction: (a: SheetAction) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<'menu' | 'compost' | 'assign'>('menu')
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [share, setShare] = useState(false)
  const gem = ELEMENT_TOKENS[element].gem
  const purple = 'var(--bars-liminal)'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.62)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full"
        style={{
          maxWidth: 432,
          background: 'var(--bars-surface-elevated)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: 'inset 0 1px 0 var(--bars-inset-top), 0 -20px 60px rgba(0,0,0,0.6)',
          padding: '10px 16px calc(16px + env(safe-area-inset-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle */}
        <div className="flex justify-center pb-3">
          <span style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--bars-line-strong)' }} />
        </div>

        {/* Card preview (always shown) */}
        <CultivationCard element={element} altitude="satisfied" stage="seed" className="w-full mb-3">
          <div className="flex items-center gap-3 p-3">
            <div
              className="flex-none flex items-center justify-center rounded-lg"
              style={{ width: 34, height: 34, background: `color-mix(in srgb, ${gem} 14%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${gem} 45%, transparent)`, color: gem, fontSize: 15 }}
              aria-hidden
            >
              {ELEMENT_TOKENS[element].sigil}
            </div>
            <div className="min-w-0">
              <Eyebrow>
                {(nationName ?? 'Your nation')} · {task.status.replace(/_/g, ' ')}
              </Eyebrow>
              <p className="truncate" style={{ fontFamily: body, fontSize: 14, color: 'var(--bars-text-primary)', margin: '2px 0 0' }}>
                {task.text}
              </p>
            </div>
          </div>
        </CultivationCard>

        {mode === 'menu' && (
          <div className="flex flex-col gap-2">
            {task.status === 'committed' && (
              <ActionRow icon="●" iconColor={gem} label="Start" hint="→ in progress" disabled={busy} onClick={() => onAction({ kind: 'start' })} />
            )}
            <ActionRow icon="✓" iconColor={gem} label="Complete" hint="pave a brick · ♦+1" disabled={busy} onClick={() => onAction({ kind: 'complete' })} />
            <ActionRow icon="↻" label="Carry to tomorrow" hint="keeps the thread" disabled={busy} onClick={() => onAction({ kind: 'carry' })} />
            <ActionRow icon="❖" label="Keep as a BAR" hint="plant in the loop" disabled={busy} onClick={() => onAction({ kind: 'keep' })} />
            <ActionRow icon="↩" label="Compost" hint="return to field" disabled={busy} onClick={() => setMode('compost')} />
            <ActionRow icon="◇" label="Assign to campaign" hint="private by default" disabled={busy} onClick={() => setMode('assign')} />
            <ActionRow
              icon="✦"
              label="Upgrade — quest or daemon"
              hint="out of hand →"
              highlight
              disabled={busy}
              onClick={() => onAction({ kind: 'upgrade' })}
            />
          </div>
        )}

        {mode === 'compost' && (
          <div>
            <Eyebrow>Compost · return to the field</Eyebrow>
            <Title>Why let this one go?</Title>
            <p style={{ fontFamily: body, fontSize: 12.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '6px 0 12px' }}>
              Composting isn&rsquo;t failure — it feeds the soil. The reason is kept with the card.
            </p>
            <div className="flex flex-col gap-2">
              {COMPOST_REASONS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  disabled={busy}
                  onClick={() => onAction({ kind: 'compost', reason: r.key })}
                  className="flex items-center justify-between gap-3 rounded-xl text-left"
                  style={{
                    minHeight: 44,
                    padding: '10px 14px',
                    background: 'var(--bars-surface-card)',
                    boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)',
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span style={{ width: 16, height: 16, borderRadius: 9999, boxShadow: 'inset 0 0 0 1.5px var(--bars-line-strong)' }} aria-hidden />
                    <span style={{ fontFamily: display, fontWeight: 700, fontSize: 14, color: 'var(--bars-text-primary)' }}>{r.label}</span>
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.06em', color: 'var(--bars-text-muted)' }}>{r.hint}</span>
                </button>
              ))}
            </div>
            <BackRow onClick={() => setMode('menu')} />
          </div>
        )}

        {mode === 'assign' && (
          <div>
            <Eyebrow>Assign to a campaign</Eyebrow>
            <Title>Where does this belong?</Title>
            <div className="flex flex-col gap-2" style={{ marginTop: 12 }}>
              {campaigns.map((c) => {
                const selected = campaignId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={busy}
                    onClick={() => setCampaignId(c.id)}
                    className="flex items-center justify-between gap-3 rounded-xl text-left"
                    style={{
                      minHeight: 44,
                      padding: '10px 14px',
                      background: selected ? `color-mix(in srgb, var(--bars-liminal) 16%, transparent)` : 'var(--bars-surface-card)',
                      boxShadow: selected
                        ? `inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1.5px ${purple}`
                        : 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)',
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span style={{ width: 16, height: 16, borderRadius: 9999, background: selected ? purple : 'transparent', boxShadow: `inset 0 0 0 1.5px ${selected ? purple : 'var(--bars-line-strong)'}` }} aria-hidden />
                      <span style={{ fontFamily: display, fontWeight: 700, fontSize: 14, color: 'var(--bars-text-primary)' }}>{c.name}</span>
                    </span>
                    {selected && <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: purple }}>Selected</span>}
                  </button>
                )
              })}
              {/* Personal — unfiled (keeps the task personal; just closes) */}
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl text-left"
                style={{ minHeight: 44, padding: '10px 14px', background: 'var(--bars-surface-card)', boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)' }}
              >
                <span style={{ width: 16, height: 16, borderRadius: 9999, boxShadow: 'inset 0 0 0 1.5px var(--bars-line-strong)' }} aria-hidden />
                <span style={{ fontFamily: display, fontWeight: 700, fontSize: 14, color: 'var(--bars-text-secondary)' }}>Personal — unfiled</span>
              </button>
            </div>

            {/* Privacy toggle (off by default) */}
            <div
              className="flex items-center justify-between gap-3 rounded-xl"
              style={{ marginTop: 12, padding: '12px 14px', background: 'var(--bars-surface-card)', boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)' }}
            >
              <div className="min-w-0">
                <p style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-primary)', margin: 0 }}>Share with campaign stewards &amp; members</p>
                <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: '3px 0 0' }}>
                  {share ? 'On · shared' : 'Off · visible only to you'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={share}
                aria-label="Share with campaign"
                onClick={() => setShare((v) => !v)}
                className="flex-none"
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 9999,
                  background: share ? purple : 'var(--bars-line-strong)',
                  position: 'relative',
                  transition: 'background 150ms ease-out',
                }}
              >
                <span style={{ position: 'absolute', top: 3, left: share ? 21 : 3, width: 20, height: 20, borderRadius: 9999, background: '#fff', transition: 'left 150ms ease-out' }} />
              </button>
            </div>

            <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.06em', color: 'var(--bars-text-muted)', margin: '10px 2px 0' }}>
              Your charge stays private unless you choose to share it.
            </p>

            <button
              type="button"
              disabled={busy || !campaignId}
              onClick={() => campaignId && onAction({ kind: 'assign', campaignId, visibility: share ? 'campaign' : null })}
              className="w-full"
              style={{
                marginTop: 12,
                minHeight: 48,
                borderRadius: 8,
                background: campaignId ? purple : 'var(--bars-surface-card)',
                color: campaignId ? '#fff' : 'var(--bars-text-muted)',
                fontFamily: display,
                fontWeight: 800,
                fontSize: 15,
                boxShadow: 'inset 0 1px 0 var(--bars-inset-top)',
                opacity: busy ? 0.6 : 1,
              }}
            >
              Assign
            </button>
            <BackRow onClick={() => setMode('menu')} />
          </div>
        )}
      </div>
    </div>
  )
}

function ActionRow({
  icon,
  iconColor,
  label,
  hint,
  highlight,
  disabled,
  onClick,
}: {
  icon: string
  iconColor?: string
  label: string
  hint: string
  highlight?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  const purple = 'var(--bars-liminal)'
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-xl text-left"
      style={{
        minHeight: 48,
        padding: '12px 14px',
        background: highlight ? `color-mix(in srgb, var(--bars-liminal) 14%, transparent)` : 'var(--bars-surface-card)',
        boxShadow: highlight
          ? `inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1.5px ${purple}`
          : 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span className="flex items-center gap-3 min-w-0">
        <span style={{ width: 18, textAlign: 'center', color: iconColor ?? (highlight ? purple : 'var(--bars-text-secondary)'), fontSize: 13 }} aria-hidden>
          {icon}
        </span>
        <span style={{ fontFamily: 'var(--bars-font-display)', fontWeight: 700, fontSize: 15, color: highlight ? purple : 'var(--bars-text-primary)' }}>
          {label}
        </span>
      </span>
      <span style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: highlight ? purple : 'var(--bars-text-muted)' }}>
        {hint}
      </span>
    </button>
  )
}

function BackRow({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full"
      style={{ marginTop: 10, minHeight: 44, fontFamily: 'var(--bars-font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-secondary)', background: 'transparent' }}
    >
      ← Back
    </button>
  )
}
