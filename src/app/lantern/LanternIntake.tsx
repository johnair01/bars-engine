'use client'

/**
 * Lantern Hall's intake, played on the board (six-faces-council council/callsheets/lantern-hall.md, brief "Lantern Hall,
 * port 1", step 2). His notes: "The less typing a player (myself included) to get outcomes the better" and "This needs
 * to be a representation of the game state not moving back into the card form". So the top of the screen is the table
 * the engine deals from the taps so far, and the chips under the thumb change it: a reservation turned off sends its keep
 * into fog, a tag sets a loop's strength. UI_COVENANT.md: element = color, altitude = border, stage = density. A keep in
 * fog is a seed, a live keep is growing, a held keep is composted.
 */
import './lantern.css'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS, altitudeCssVars, elementCssVars, type CardAltitude } from '@/lib/ui/card-tokens'
import { CHANNELS, CMD, KEEPS, STATE, cmdNeed, init, lvl, type Channel, type Intake, type Keep } from '@/lib/lantern/engine'
import { parseIntake } from '@/lib/lantern/store'
import {
  FEEL, GOALS, QUESTION, RESERVATION, STEPS, STRENGTH, TRUTH, blockCost, emptyIntake, feltNow, mayLeave, pickGoal,
  raiseNow, raiseTag, setTruthCtx, toggleRes, toggleTruth, toggleWant, type Step,
} from '@/lib/lantern/intake'

type Save = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; id: string } | { kind: 'guest' } | { kind: 'failed' }

const ALT: CardAltitude[] = ['dissatisfied', 'neutral', 'satisfied']
const vars = (c: Channel, a: CardAltitude) => ({ ...elementCssVars(c), ...altitudeCssVars(a) }) as CSSProperties

/** A keep's color is its strongest loop's channel (its predominant channel while it has none). */
function keepChannel(k: Keep, i: number): Channel {
  const top = [...k.loops].sort((a, b) => b.g - a.g)[0]
  return k.ch ?? top?.ch ?? KEEPS[i].pred
}
/** A keep's altitude is its strongest loop's state: lead at strength 2 or more, neutral at 1, gold at 0. */
function keepAltitude(k: Keep): CardAltitude {
  if (k.held) return 'satisfied'
  const g = Math.max(0, ...k.loops.map(l => l.g))
  return ALT[lvl(g)]
}

/** Six keeps on a hex ring around the well, clockwise from the top. Positions are percentages of the board. */
const RING = [0, 1, 2, 3, 4, 5].map(i => {
  const a = (-90 + 60 * i) * (Math.PI / 180)
  return { left: 50 + 35 * Math.cos(a), top: 50 + 35 * Math.sin(a) }
})

function Board({ intake, dealt }: { intake: Intake; dealt: boolean }) {
  const s = useMemo(() => init(intake), [intake])
  const want = intake.want
  return (
    <div className="relative mx-auto aspect-square w-full" style={{ maxWidth: "min(21rem, 34dvh)" }} role="group" aria-label="The table, as your answers deal it">
      <div className="lantern-well absolute left-1/2 top-1/2 flex w-[34%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center">
        <p className="lantern-goal line-clamp-3">{intake.goal.trim() || 'Your goal'}</p>
        <div className="flex gap-1" aria-label={want.length ? `Toward ${want.map(c => STATE[c][2]).join(', ')}` : 'No feeling chosen yet'}>
          {want.map(c => <span key={c} className="lantern-gem" style={vars(c, 'satisfied')} title={STATE[c][2]} />)}
        </div>
      </div>
      {s.keeps.map((k, i) => {
        const ch = keepChannel(k, i)
        const fog = k.fog
        const label = `${KEEPS[i].b}${i === CMD ? `, the commander, struck once ${cmdNeed(s)} other keeps are held` : ''}: ${fog ? 'in fog' : k.loops.map(l => `${FEEL[l.ch]} at ${STRENGTH[Math.min(3, l.g)] || 'gold'}`).join(', ')}`
        return (
          <div key={i} className="absolute w-[30%] -translate-x-1/2 -translate-y-1/2" style={{ left: `${RING[i].left}%`, top: `${RING[i].top}%` }}>
            <CultivationCard element={ch} altitude={fog ? 'dissatisfied' : keepAltitude(k)} stage={fog ? 'seed' : k.held ? 'composted' : 'growing'} aria-label={label} className={fog ? 'lantern-fog' : ''}>
              <div className="flex min-h-[4.25rem] flex-col items-center justify-center gap-1 px-1.5 py-2 text-center">
                <span className="lantern-keep-name">{KEEPS[i].b}</span>
                {i === CMD && <span className="lantern-small">commander</span>}
                {fog ? <span className="lantern-small">in fog</span> : (
                  <span className="flex flex-wrap justify-center gap-1">
                    {k.loops.map(l => (
                      <span key={l.ch} className="lantern-pip" style={vars(l.ch, ALT[lvl(l.g)])} title={`${FEEL[l.ch]} · ${STRENGTH[Math.min(3, l.g)]}`}>
                        {k.ph ? '?' : l.g}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </CultivationCard>
          </div>
        )
      })}
      {dealt && <p className="sr-only">The table is dealt.</p>}
    </div>
  )
}

function Chip({ on, ch, onClick, children, label }: { on: boolean; ch?: Channel; onClick: () => void; children: React.ReactNode; label?: string }) {
  const alt: CardAltitude = on ? 'satisfied' : 'dissatisfied'
  return (
    <button type="button" aria-pressed={on} aria-label={label} onClick={onClick}
      className={`cultivation-card lantern-chip ${ch ? '' : 'lantern-chip--plain'}`} style={(ch ? vars(ch, alt) : altitudeCssVars(alt)) as CSSProperties}>
      {children}
    </button>
  )
}

const Sigil = ({ c }: { c: Channel }) => <span aria-hidden className="lantern-sigil">{ELEMENT_TOKENS[c].sigil}</span>

export function LanternIntake() {
  const [x, setX] = useState<Intake>(emptyIntake)
  const [step, setStep] = useState<Step>(1)
  const [ownGoal, setOwnGoal] = useState(false)
  const [ctxOpen, setCtxOpen] = useState<Partial<Record<Channel, boolean>>>({})
  const [allOpen, setAllOpen] = useState<boolean[]>(KEEPS.map(() => false))
  const [save, setSave] = useState<Save>({ kind: 'idle' })
  const [tableId, setTableId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/lantern/table').then(r => (r.ok ? r.json() : null)).then(d => {
      const got = d?.table ? parseIntake(d.table.intake) : null
      if (got && d.table.id) { setX(got); setTableId(d.table.id); setStep(6); setSave({ kind: 'saved', id: d.table.id }) }
    }).catch(() => {})
  }, [])

  const edit = (f: (v: Intake) => Intake) => { setX(f); if (save.kind !== 'saving') setSave({ kind: 'idle' }) }
  const cost = blockCost(x)
  const felt = feltNow(x)

  async function deal() {
    setSave({ kind: 'saving' })
    try {
      const r = await fetch('/api/lantern/table', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: tableId ?? undefined, intake: x }) })
      if (r.status === 401) return setSave({ kind: 'guest' })
      const d = await r.json().catch(() => null)
      if (!r.ok || !d?.id) return setSave({ kind: 'failed' })
      setTableId(d.id); setSave({ kind: 'saved', id: d.id })
    } catch { setSave({ kind: 'failed' }) }
  }

  function freshTable() { setX(emptyIntake()); setTableId(null); setStep(1); setOwnGoal(false); setSave({ kind: 'idle' }) }

  return (
    <main className="lantern-hall flex min-h-[100dvh] flex-col">
      <header className="px-4 pt-4">
        <h1 className="lantern-title">Lantern Hall</h1>
        <p className="lantern-sub">Set your table. Six taps deal the block you will play.</p>
      </header>

      <section className="flex flex-1 items-center px-3 py-6">
        <Board intake={x} dealt={save.kind === 'saved'} />
      </section>

      <p className="lantern-cost px-4 text-center" aria-live="polite">
        This block takes <b>{cost.refinements}</b> refinements to overcome: about {cost.moves} matched moves, or {cost.watches} {cost.watches === 1 ? 'watch' : 'watches'} of oil alone.
      </p>

      <section className="lantern-hand sticky bottom-0 mt-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3" aria-labelledby="lantern-q">
        <ol className="mb-2 flex justify-between gap-1" aria-label="Intake steps">
          {STEPS.map((n, k) => {
            const s = (k + 1) as Step
            const ok = s <= step || STEPS.slice(0, k).every((_, j) => mayLeave(x, (j + 1) as Step))
            return (
              <li key={n} className="flex-1">
                <button type="button" disabled={!ok} aria-current={s === step ? 'step' : undefined} onClick={() => setStep(s)}
                  className={`lantern-step w-full ${s === step ? 'lantern-step--now' : ''}`}>{n}</button>
              </li>
            )
          })}
        </ol>

        <h2 id="lantern-q" className="lantern-q">{QUESTION[step]}</h2>

        <div className="mt-2 max-h-[30dvh] overflow-y-auto pb-1">
          {step === 1 && (
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => <Chip key={g} on={x.goal === g && !ownGoal} onClick={() => { setOwnGoal(false); edit(v => pickGoal(v, g)) }}>{g}</Chip>)}
              <Chip on={ownGoal} onClick={() => { setOwnGoal(true); edit(v => pickGoal(v, GOALS.includes(v.goal) ? '' : v.goal)) }}>Something else</Chip>
              {ownGoal && (
                <label className="mt-1 block w-full">
                  <span className="lantern-small">Your goal, as one done-or-not sentence</span>
                  <input className="lantern-input mt-1 w-full" value={x.goal} autoFocus maxLength={140} onChange={e => edit(v => pickGoal(v, e.target.value))} />
                </label>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map(c => <Chip key={c} ch={c} on={x.want.includes(c)} onClick={() => edit(v => toggleWant(v, c))}><Sigil c={c} />{STATE[c][2]}</Chip>)}
              <p className="lantern-small w-full">Pick any. They glow in the well at the center of the table.</p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map(c => {
                const v = x.now[c] ?? 0
                return <Chip key={c} ch={c} on={v > 0} onClick={() => edit(y => raiseNow(y, c))} label={`${FEEL[c]}${v ? `, ${STRENGTH[v]}` : ''}. Tap to raise.`}><Sigil c={c} />{FEEL[c]}{v ? ` · ${STRENGTH[v]}` : ''}</Chip>
              })}
              <p className="lantern-small w-full">Tap to raise it: Minor, Medium, Major, then off.</p>
            </div>
          )}

          {step === 4 && (felt.length ? (
            <div className="flex flex-col gap-3">
              {felt.map(c => (
                <div key={c} className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap gap-2">
                    <Chip ch={c} on={!!x.truth[c]} onClick={() => edit(v => toggleTruth(v, c))}><Sigil c={c} />{TRUTH[c]}</Chip>
                    {!ctxOpen[c] && !x.truthCtx[c] && <Chip on={false} onClick={() => setCtxOpen(o => ({ ...o, [c]: true }))}>Add context</Chip>}
                  </div>
                  {(ctxOpen[c] || x.truthCtx[c]) && (
                    <input className="lantern-input" aria-label={`More about ${FEEL[c]}, if you want`} value={x.truthCtx[c] ?? ''} maxLength={280} onChange={e => edit(v => setTruthCtx(v, c, e.target.value))} />
                  )}
                </div>
              ))}
            </div>
          ) : <p className="lantern-small">Pick at least one feeling in Now first, or go on without one.</p>)}

          {step === 5 && (
            <div className="flex flex-col gap-2">
              {KEEPS.map((k, i) => (
                <Chip key={k.b} on={x.res[i]} onClick={() => edit(v => toggleRes(v, i))} label={`${RESERVATION[i]} ${x.res[i] ? 'Kept on the table' : 'In fog'}`}>
                  {RESERVATION[i]}{i === CMD ? ' · commander' : ''}
                </Chip>
              ))}
              <p className="lantern-small">Each one you keep becomes a keep on the table. Any you turn off sit in fog and can surface later.</p>
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col gap-3">
              {KEEPS.map((k, i) => {
                if (!x.res[i]) return null
                const tg = x.tags[i] ?? {}
                const chs = allOpen[i] ? CHANNELS : [...felt, ...CHANNELS.filter(c => !felt.includes(c) && (tg[c] ?? 0) > 0)]
                return (
                  <div key={k.b}>
                    <p className="lantern-keep-name mb-1 text-left">{k.b}{i === CMD ? ' · commander' : ''}</p>
                    <div className="flex flex-wrap gap-2">
                      {chs.map(c => {
                        const v = tg[c] ?? 0
                        return <Chip key={c} ch={c} on={v > 0} onClick={() => edit(y => raiseTag(y, i, c))} label={`${k.b}: ${FEEL[c]}${v ? `, ${STRENGTH[v]}` : ''}. Tap to raise.`}><Sigil c={c} />{FEEL[c]}{v ? ` · ${STRENGTH[v]}` : ''}</Chip>
                      })}
                      {!allOpen[i] && <Chip on={false} onClick={() => setAllOpen(a => a.map((o, j) => (j === i ? true : o)))}>Other feelings</Chip>}
                    </div>
                  </div>
                )
              })}
              <p className="lantern-small">Strength is how many refinements that loop needs to turn gold. A keep you don&apos;t tag plays at Medium in its own channel until you do.</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button type="button" className="lantern-nav" disabled={step === 1} onClick={() => setStep(s => Math.max(1, s - 1) as Step)}>Back</button>
          {step < 6
            ? <button type="button" className="lantern-nav lantern-nav--go ml-auto" disabled={!mayLeave(x, step)} onClick={() => setStep(s => Math.min(6, s + 1) as Step)}>Next</button>
            : <button type="button" className="lantern-nav lantern-nav--go ml-auto" disabled={!mayLeave(x, 1) || save.kind === 'saving'} onClick={deal}>{save.kind === 'saved' ? 'Save the table' : 'Deal the table'}</button>}
        </div>
        <p className="lantern-small mt-2 min-h-[1.25rem]" role="status">
          {save.kind === 'saving' && 'Dealing…'}
          {save.kind === 'saved' && <>Your table is dealt and kept. <button type="button" className="lantern-link" onClick={freshTable}>Play a new intake</button></>}
          {save.kind === 'guest' && <>Dealt for this visit. <a className="lantern-link" href="/login?returnTo=%2Flantern">Sign in to keep your table</a>.</>}
          {save.kind === 'failed' && 'The table could not be kept just now. Your answers are still here; try Deal again.'}
        </p>
      </section>
    </main>
  )
}
