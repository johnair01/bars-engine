'use client'

/**
 * MenuPhase — the morning menu (TTV-MENU).
 *
 * His kept lines, each bridged to a Lens goal. A line with no goal shows a game
 * master's suggestion: the Architect names a goal it already serves, the Sage
 * proposes a smaller goal under a larger one (the side quest joining the main
 * quest), and the Challenger asks him to place a line nothing claims. He
 * accepts, picks another goal, or leaves it unaligned. Sealing freezes the copy
 * the council reads. The free write never appears here.
 */

import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  type MorningMenuView,
  acceptMenuSuggestion,
  getMorningMenu,
  sealMorningMenu,
  setMenuBridge,
} from '@/actions/tap-the-vein-menu'
import { goalTrace, toMenuExport, traceLabel, type GameMasterVoice, type MenuItem } from '@/lib/tap-the-vein/menu'
import { FACE_META } from '@/lib/quest-grammar/types'

const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'
const purple = 'var(--bars-liminal)'

const CADENCE_ORDER = ['week', 'month', 'quarter', 'year'] as const

function faceLabel(face: GameMasterVoice): string {
  return FACE_META[face].label
}

export function MenuPhase({ onDone }: { onDone: () => void }) {
  const [view, setView] = useState<MorningMenuView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let live = true
    void getMorningMenu().then((res) => {
      if (!live) return
      if ('error' in res) setError(res.error)
      else setView(res)
    })
    return () => {
      live = false
    }
  }, [])

  const act = (fn: () => Promise<MorningMenuView | { error: string }>) => {
    setError(null)
    setCopied(false)
    startTransition(async () => {
      const res = await fn()
      if ('error' in res) setError(res.error)
      else setView(res)
    })
  }

  const copyForCouncil = () => {
    if (!view?.sealedAt) return
    const json = JSON.stringify(toMenuExport(view.items, view.sessionDate, view.sealedAt), null, 2)
    void navigator.clipboard?.writeText(json).then(() => setCopied(true)).catch(() => setError('Copy failed. The council can still read the sealed menu.'))
  }

  const bridged = view?.items.filter((i) => i.status === 'bridged').length ?? 0

  return (
    <>
      <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: purple, margin: 0 }}>
        Tap the Vein · Menu
      </p>
      <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '4px 0 0' }}>
        Today&rsquo;s menu
      </h1>
      <p style={{ fontFamily: body, fontSize: 13, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '6px 0 0' }}>
        The lines you kept, each tied to a Lens goal. Only these lines reach the council. Your free write stays here.
      </p>

      {error && <p style={{ fontFamily: body, fontSize: 13, color: '#e05c2e', margin: '10px 0 0' }}>{error}</p>}

      {!view && !error && (
        <p style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-muted)', marginTop: 16 }}>Gathering your kept lines…</p>
      )}

      {view && view.items.length === 0 && (
        <p style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-muted)', marginTop: 16 }}>
          No kept lines yet. Go back and keep a few from the brainstorm.
        </p>
      )}

      {view && view.goals.length === 0 && view.items.length > 0 && (
        <p style={{ fontFamily: body, fontSize: 12.5, color: 'var(--bars-text-muted)', marginTop: 12 }}>
          You have no Lens goals yet, so nothing can be tied. <a href="/lenses" style={{ color: purple }}>Set your year frame</a> and come back.
        </p>
      )}

      {view && (
        <div className="flex flex-col gap-2" style={{ marginTop: 16 }}>
          {view.items.map((item) => (
            <MenuItemCard key={item.key} item={item} view={view} pending={pending} act={act} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        {view && view.items.length > 0 && (
          <>
            <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', textAlign: 'center', margin: '16px 0 0' }}>
              {bridged} of {view.items.length} tied to a goal
              {view.sealedAt ? ` · sealed ${new Date(view.sealedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
            <button
              type="button"
              onClick={() => act(() => sealMorningMenu())}
              disabled={pending}
              className="w-full"
              style={{ marginTop: 10, minHeight: 56, borderRadius: 12, background: purple, color: '#fff', fontFamily: display, fontWeight: 800, fontSize: 16, opacity: pending ? 0.55 : 1 }}
            >
              {view.sealedAt ? 'Seal again with these changes' : 'Seal the menu for the council'}
            </button>
            {view.sealedAt && (
              <button
                type="button"
                onClick={copyForCouncil}
                className="w-full"
                style={{ marginTop: 8, minHeight: 44, borderRadius: 12, background: 'var(--bars-surface-card)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', fontFamily: mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-secondary)' }}
              >
                {copied ? 'Copied' : 'Copy the sealed menu'}
              </button>
            )}
          </>
        )}
        <button
          type="button"
          onClick={onDone}
          className="w-full"
          style={{ marginTop: 8, minHeight: 48, borderRadius: 12, background: 'none', boxShadow: 'inset 0 0 0 1px var(--bars-line-strong)', fontFamily: display, fontWeight: 700, fontSize: 15, color: 'var(--bars-text-primary)' }}
        >
          Into the day →
        </button>
      </div>
    </>
  )
}

function MenuItemCard({
  item,
  view,
  pending,
  act,
}: {
  item: MenuItem
  view: MorningMenuView
  pending: boolean
  act: (fn: () => Promise<MorningMenuView | { error: string }>) => void
}) {
  const s = item.suggestion
  const [title, setTitle] = useState(s?.kind === 'side_quest' ? s.title : '')
  const [picking, setPicking] = useState(false)

  const goalOptions = useMemo(
    () =>
      [...view.goals]
        .sort((a, b) => CADENCE_ORDER.indexOf(a.cadence as never) - CADENCE_ORDER.indexOf(b.cadence as never))
        .map((g) => ({ id: g.id, label: `${g.cadence} · ${goalTrace(g.id, view.goals) ?? g.title}` })),
    [view.goals],
  )

  const voice: GameMasterVoice | null = s ? s.face : item.status === 'unaligned' && !item.leftUnaligned ? 'challenger' : null

  return (
    <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bars-surface-card)', boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)', opacity: item.status === 'unaligned' ? 0.85 : 1 }}>
      <p style={{ fontFamily: body, fontSize: 14, fontWeight: 600, color: 'var(--bars-text-primary)', margin: 0 }}>{item.text}</p>

      {item.bridge && (
        <p style={{ fontFamily: body, fontSize: 12, color: purple, margin: '6px 0 0' }}>→ {traceLabel(item.bridge)}</p>
      )}

      {item.status === 'unaligned' && item.leftUnaligned && (
        <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: '6px 0 0' }}>
          Unaligned · shown last
        </p>
      )}

      {voice && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 10, background: 'color-mix(in srgb, var(--bars-liminal) 10%, transparent)' }}>
          <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: purple, margin: 0 }}>{faceLabel(voice)}</p>
          <p style={{ fontFamily: body, fontSize: 12.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: '3px 0 0' }}>
            {s ? s.says : 'No goal claims this line yet. Pick one, or leave it unaligned and it stays on the menu, last.'}
          </p>
          {s?.kind === 'align' && (
            <p style={{ fontFamily: body, fontSize: 11.5, color: 'var(--bars-text-muted)', margin: '3px 0 0' }}>{traceLabel(s.goal)}</p>
          )}
          {s?.kind === 'side_quest' && (
            <label style={{ display: 'block', marginTop: 6 }}>
              <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
                New {s.cadence} goal under {traceLabel(s.parent)}
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full"
                style={{ marginTop: 4, padding: '8px 10px', borderRadius: 8, background: 'var(--bars-bg-base)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', fontFamily: body, fontSize: 13, color: 'var(--bars-text-primary)' }}
              />
            </label>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2" style={{ marginTop: 8 }}>
        {s && (
          <SmallButton disabled={pending} primary onClick={() => act(() => acceptMenuSuggestion({ key: item.key, title: s.kind === 'side_quest' ? title : undefined }))}>
            {s.kind === 'side_quest' ? 'Add goal and tie' : 'Tie it there'}
          </SmallButton>
        )}
        {view.goals.length > 0 && (
          <SmallButton disabled={pending} onClick={() => setPicking((p) => !p)}>
            {item.bridge ? 'Change goal' : 'Pick another goal'}
          </SmallButton>
        )}
        {!item.bridge && !item.leftUnaligned && (
          <SmallButton disabled={pending} onClick={() => act(() => setMenuBridge({ key: item.key, lensGoalId: null }))}>
            Leave unaligned
          </SmallButton>
        )}
      </div>

      {picking && (
        <select
          defaultValue=""
          disabled={pending}
          onChange={(e) => {
            const id = e.target.value
            if (!id) return
            setPicking(false)
            act(() => setMenuBridge({ key: item.key, lensGoalId: id }))
          }}
          className="w-full"
          style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--bars-bg-base)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', fontFamily: body, fontSize: 12.5, color: 'var(--bars-text-primary)' }}
        >
          <option value="">Choose a goal…</option>
          {goalOptions.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

function SmallButton({ children, onClick, disabled, primary }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 34,
        padding: '0 12px',
        borderRadius: 9999,
        background: primary ? purple : 'transparent',
        color: primary ? '#fff' : 'var(--bars-text-secondary)',
        boxShadow: primary ? 'none' : 'inset 0 0 0 1px var(--bars-line-strong)',
        fontFamily: mono,
        fontSize: 9.5,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  )
}
