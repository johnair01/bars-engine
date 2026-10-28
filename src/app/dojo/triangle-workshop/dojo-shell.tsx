'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEmber, exitPractice, loadPractice, returnOutcomeToBar, savePractice, startPractice, type PracticeView } from '@/actions/dojo-practice'
import { entryChoices, exitsFor, modeLabel, type DojoRoute, type ExitId } from '@/lib/dojo-practice/lifecycle'
import { emptyTutorialLog, learningPractice, TUTORIAL_STEPS, type TutorialLog } from '@/lib/dojo-practice/tutorial'
import { ELEMENTS, OUTCOME_KINDS, type Element, type OutcomeKind, type PracticeContext, type PracticeState } from '@/lib/dojo-practice/types'
import { ThoughtStringBoard } from './thought-string-board'

type Home = {
  bars: Array<{ id: string; title: string; element?: Element }>
  practices: Array<{ id: string; kind: 'seed' | 'incipient_bar'; title: string | null; intention: string | null; status: string; updatedAt: string }>
  spirits: Array<{ id: string; name: string }>
  emberCount: number
}

type Screen =
  | { name: 'choose' }
  | { name: 'arrive'; route: Exclude<DojoRoute, 'learn'> }
  | { name: 'tutorial' }
  | { name: 'practice'; practice: PracticeView }

const OUTCOME_LABEL: Record<OutcomeKind, string> = {
  next_move: 'A next move', positive_continuation: 'A positive continuation', bridge: 'A bridge', charge_shift: 'A shift in charge',
}
const tap = 'min-h-11 min-w-11'
const btn = `${tap} rounded-lg px-4 text-sm font-medium`

export function DojoShell({ home, returnPath }: { home: Home; returnPath: string }) {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>({ name: 'choose' })
  const [practices, setPractices] = useState(home.practices)
  const [message, setMessage] = useState('')

  async function resume(id: string) {
    const r = await loadPractice(id)
    if ('error' in r) { setMessage(r.error); return }
    setScreen({ name: 'practice', practice: r.practice })
  }

  return (
    <div className="mt-7 space-y-5">
      {message && <p role="status" className="rounded-lg border border-teal-300/30 bg-teal-950/40 p-3 text-sm text-teal-50">{message}</p>}
      {screen.name === 'choose' && (
        <Choose home={home} practices={practices} onRoute={route => { setMessage(''); setScreen(route === 'learn' ? { name: 'tutorial' } : { name: 'arrive', route }) }} onResume={resume} />
      )}
      {screen.name === 'arrive' && (
        <Arrive route={screen.route} home={home} onBack={() => setScreen({ name: 'choose' })} onStarted={practice => setScreen({ name: 'practice', practice })} />
      )}
      {screen.name === 'tutorial' && (
        <Tutorial
          onLeave={() => router.push(returnPath)}
          onMine={async () => {
            // “Make this mine” starts a new, empty private seed. Nothing from the learning wall is copied.
            const r = await startPractice({ kind: 'seed' })
            if ('error' in r) { setMessage(r.error); return }
            setScreen({ name: 'practice', practice: r.practice })
          }}
        />
      )}
      {screen.name === 'practice' && (
        <Practice
          key={screen.practice.id} practice={screen.practice} returnPath={returnPath}
          onLeftToChoose={(note, removed) => {
            setMessage(note)
            if (removed) setPractices(cur => cur.filter(p => p.id !== screen.practice.id))
            else setPractices(cur => cur.some(p => p.id === screen.practice.id) || screen.practice.kind === 'bar' ? cur : [{ id: screen.practice.id, kind: screen.practice.kind as 'seed' | 'incipient_bar', title: screen.practice.title, intention: screen.practice.intention, status: 'active', updatedAt: new Date().toISOString() }, ...cur])
            setScreen({ name: 'choose' })
          }}
        />
      )}
      {screen.name === 'choose' && (
        <Link href={returnPath} className={`${tap} inline-flex items-center rounded-lg border border-zinc-600 px-4 text-sm text-zinc-200`}>Return to Nook</Link>
      )}
    </div>
  )
}

function Choose({ home, practices, onRoute, onResume }: { home: Home; practices: Home['practices']; onRoute: (r: DojoRoute) => void; onResume: (id: string) => void }) {
  const choices = entryChoices({ barCount: home.bars.length })
  return (
    <>
      <section aria-labelledby="entry-h" className="rounded-2xl border border-teal-300/25 bg-zinc-900/60 p-4">
        <h2 id="entry-h" className="text-lg font-medium text-teal-100">How would you like to come in?</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-400">You do not need a BAR, a spirit, or a clear goal. Any door works, and you can leave from any of them.</p>
        <ul className="mt-4 flex flex-col gap-3">
          {choices.map(ch => (
            <li key={ch.route}>
              <button type="button" onClick={() => onRoute(ch.route)} className={`${tap} w-full rounded-xl border border-teal-300/30 bg-teal-950/20 p-4 text-left active:bg-teal-400/10`}>
                <span className="block text-base font-medium text-white">{ch.title}</span>
                <span className="mt-1 block text-sm leading-6 text-zinc-400">{ch.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
        <Link href="/dojo/triangle-workshop/loop-lab" className={`${tap} mt-3 flex w-full items-center rounded-xl border border-amber-100/30 bg-amber-950/20 p-4 text-left active:bg-amber-400/10`}>
          <span><span className="block text-base font-medium text-white">Try the loop lab</span><span className="mt-1 block text-sm leading-6 text-zinc-400">A replayable, local-only practice bay for an authored Thought String → EA → action-card demonstration.</span></span>
        </Link>
      </section>
      {practices.length > 0 && (
        <section aria-labelledby="open-h" className="rounded-2xl border border-zinc-700 bg-zinc-900/50 p-4">
          <h2 id="open-h" className="text-base font-medium text-white">Pick up where you were</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {practices.map(p => (
              <li key={p.id}>
                <button type="button" onClick={() => onResume(p.id)} className={`${tap} w-full rounded-lg border border-zinc-700 p-3 text-left text-sm text-zinc-100`}>
                  <span className="block font-medium">{p.title || p.intention || (p.kind === 'seed' ? 'Private practice' : 'Drafting a BAR')}</span>
                  <span className="text-xs text-zinc-500">{p.kind === 'seed' ? 'Private practice' : 'Drafting a BAR'} · {p.status === 'settled' ? 'settled for now' : 'in progress'}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {home.emberCount > 0 && <p className="text-sm text-zinc-400">Your private satchel holds {home.emberCount} {home.emberCount === 1 ? 'ember' : 'embers'}.</p>}
    </>
  )
}

function Arrive({ route, home, onBack, onStarted }: { route: Exclude<DojoRoute, 'learn'>; home: Home; onBack: () => void; onStarted: (p: PracticeView) => void }) {
  const [kind, setKind] = useState<'seed' | 'incipient_bar' | 'bar'>(route === 'alive' ? 'seed' : route === 'make' ? 'incipient_bar' : 'bar')
  const [barId, setBarId] = useState(home.bars[0]?.id ?? '')
  const [intention, setIntention] = useState('')
  const [platform, setPlatform] = useState(['', '', ''])
  const [spiritId, setSpiritId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const prompt = kind === 'seed'
    ? 'What feels alive, sticky, charged, or worth noticing?'
    : kind === 'incipient_bar' ? 'What would you like to make, tend, invite, or change?' : 'Is there one sentence you are bringing to this BAR?'
  const contexts: Array<['seed' | 'incipient_bar' | 'bar', string]> = [['seed', 'Private practice'], ['incipient_bar', 'Drafting a BAR']]
  if (home.bars.length) contexts.push(['bar', 'Work an existing BAR'])

  async function go() {
    setBusy(true); setError('')
    const r = await startPractice({ kind, barId: kind === 'bar' ? barId : undefined, intention, platform, spiritId: spiritId || undefined })
    setBusy(false)
    if ('error' in r) { setError(r.error); return }
    onStarted(r.practice)
  }

  return (
    <section aria-labelledby="arrive-h" className="rounded-2xl border border-teal-300/25 bg-zinc-900/60 p-4">
      <h2 id="arrive-h" className="text-lg font-medium text-teal-100">Arriving</h2>
      <p className="mt-1 text-sm text-zinc-400">Everything on this screen is optional except where you are working from.</p>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-zinc-200">Working from</legend>
        <div className="mt-2 flex flex-col gap-2">
          {contexts.map(([k, label]) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`${tap} rounded-lg border px-3 text-left text-sm ${kind === k ? 'border-teal-300 bg-teal-400/10 text-white' : 'border-zinc-700 text-zinc-300'}`}>{label}</button>
          ))}
        </div>
      </fieldset>
      {kind === 'bar' && (
        <div className="mt-4">
          <label htmlFor="bar-pick" className="text-sm font-medium text-zinc-200">Which BAR</label>
          <select id="bar-pick" value={barId} onChange={e => setBarId(e.target.value)} className={`${tap} mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100`}>
            {home.bars.map(b => <option key={b.id} value={b.id}>{b.title}{b.element ? ` · ${b.element}` : ''}</option>)}
          </select>
        </div>
      )}
      <div className="mt-4">
        <label htmlFor="intention" className="text-sm font-medium text-zinc-200">{prompt} <span className="font-normal text-zinc-500">(optional)</span></label>
        <textarea id="intention" value={intention} maxLength={280} onChange={e => setIntention(e.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-base text-zinc-100 focus:border-teal-400 focus:outline-none" />
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-zinc-200">A three-word platform <span className="font-normal text-zinc-500">(optional)</span></legend>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {platform.map((w, i) => (
            <input key={i} aria-label={`Platform word ${i + 1}`} value={w} maxLength={40} onChange={e => setPlatform(cur => cur.map((x, j) => (j === i ? e.target.value : x)))} className={`${tap} min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-base text-zinc-100`} />
          ))}
        </div>
      </fieldset>
      {home.spirits.length > 0 && (
        <div className="mt-4">
          <label htmlFor="spirit" className="text-sm font-medium text-zinc-200">A spirit to witness <span className="font-normal text-zinc-500">(optional)</span></label>
          <select id="spirit" value={spiritId} onChange={e => setSpiritId(e.target.value)} className={`${tap} mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100`}>
            <option value="">No one in particular</option>
            {home.spirits.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-amber-200">{error}</p>}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
        <button type="button" disabled={busy || (kind === 'bar' && !barId)} onClick={go} className={`${btn} bg-teal-600 text-white disabled:opacity-40`}>{busy ? 'Opening…' : 'Enter the dojo'}</button>
        <button type="button" onClick={onBack} className={`${btn} border border-zinc-600 text-zinc-200`}>Back</button>
      </div>
    </section>
  )
}

function ModeBanner({ ctx, barTitle }: { ctx: PracticeContext; barTitle?: string }) {
  const learning = ctx.kind === 'tutorial'
  return (
    <p className={`rounded-lg border px-3 py-2 text-sm font-semibold ${learning ? 'border-amber-300/40 bg-amber-400/10 text-amber-100' : 'border-teal-300/40 bg-teal-400/10 text-teal-100'}`}>
      {modeLabel(ctx, barTitle)}
      <span className="ml-2 font-normal text-zinc-400">{learning ? '· nothing here is kept' : '· private to you'}</span>
    </p>
  )
}

function Tutorial({ onLeave, onMine }: { onLeave: () => void; onMine: () => void }) {
  const [start, setStart] = useState(learningPractice)
  const [state, setState] = useState<PracticeState>(start)
  const [log, setLog] = useState<TutorialLog>(emptyTutorialLog())
  const [busy, setBusy] = useState(false)
  const step = TUTORIAL_STEPS.find(s => !s.seen(start, state, log))
  const exits = exitsFor({ kind: 'tutorial' })

  function exit(id: ExitId) {
    if (id === 'restart') { const fresh = learningPractice(); setStart(fresh); setState(fresh); setLog(emptyTutorialLog()) }
    if (id === 'return_nook') onLeave()
    if (id === 'make_mine') { setBusy(true); onMine() }
  }

  return (
    <div className="space-y-4">
      <ModeBanner ctx={{ kind: 'tutorial' }} />
      <ol className="flex flex-wrap gap-2" aria-label="Moves you have seen">
        {TUTORIAL_STEPS.map(s => {
          const seen = s.seen(start, state, log)
          return <li key={s.id} className={`rounded-full border px-3 py-1 text-xs ${seen ? 'border-teal-300/50 text-teal-100' : 'border-zinc-700 text-zinc-500'}`}>{seen ? '✓ ' : ''}{s.title}</li>
        })}
      </ol>
      <ThoughtStringBoard
        state={state} onChange={setState} live={false}
        onProject={() => setLog(l => ({ ...l, projected: true }))} onReturnToWall={() => setLog(l => ({ ...l, returned: true }))}
        hint={step ? `${step.title}. ${step.instruction}` : 'That is the whole grammar. Keep playing, start the wall over, or make this mine.'}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        {exits.map(e => (
          <button key={e.id} type="button" disabled={busy} onClick={() => exit(e.id)} className={`${btn} ${e.id === 'make_mine' ? 'bg-teal-600 text-white' : 'border border-zinc-600 text-zinc-200'} disabled:opacity-40`}>{e.label}</button>
        ))}
      </div>
    </div>
  )
}

function Practice({ practice, returnPath, onLeftToChoose }: { practice: PracticeView; returnPath: string; onLeftToChoose: (note: string, removed: boolean) => void }) {
  const router = useRouter()
  const [state, setState] = useState<PracticeState>({ constellation: practice.constellation, projectedTriangleId: null })
  const [status, setStatus] = useState(practice.status)
  const [saved, setSaved] = useState<'saved' | 'saving' | 'error'>('saved')
  const [note, setNote] = useState('')
  const [outcomes, setOutcomes] = useState(practice.outcomes)
  const dirty = useRef(false)
  const change = (next: PracticeState) => { dirty.current = true; setSaved('saving'); setState(next) }

  // Autosave, debounced. The loaded state is not saved back until the player changes something.
  useEffect(() => {
    if (!dirty.current) return
    const t = setTimeout(async () => {
      const r = await savePractice(practice.id, state.constellation)
      setSaved('error' in r ? 'error' : 'saved')
      if (!('error' in r)) setStatus('active')
    }, 700)
    return () => clearTimeout(t)
  }, [state.constellation, practice.id])

  async function exit(id: ExitId) {
    setNote('')
    if (id === 'return_nook') { await savePractice(practice.id, state.constellation); router.push(returnPath); return }
    if (id === 'return_bar' && practice.barId) { await savePractice(practice.id, state.constellation); router.push(`/bars/${practice.barId}`); return }
    const r = await exitPractice(practice.id, id, state.constellation)
    if ('error' in r) { setNote(r.error); return }
    if (id === 'discard') onLeftToChoose('Discarded. Nothing from that practice was kept.', true)
    else if (id === 'keep_drafting') onLeftToChoose('Your draft is kept privately.', false)
    else if (id === 'settle') { setStatus('settled'); setNote('Settled for now. It stays private, and you can come back to it.') }
    else if (id === 'plant_bar' && r.barId) router.push(`/bars/${r.barId}`)
  }

  const exits = exitsFor(practice.context)
  return (
    <div className="space-y-4">
      <ModeBanner ctx={practice.context} barTitle={practice.bar?.title} />
      {practice.bar?.element && <p className="text-xs text-zinc-400">Element: {practice.bar.element}</p>}
      {practice.intention && <p className="rounded-lg bg-zinc-900/70 p-3 text-sm text-zinc-300">“{practice.intention}”</p>}
      {practice.platform.length > 0 && <p className="text-xs text-zinc-400">Platform: {practice.platform.join(' · ')}</p>}
      <ThoughtStringBoard state={state} onChange={change} live hint={state.constellation.words.length === 0 ? 'Add a word when one comes. There is no goal to name first.' : undefined} />
      <p aria-live="polite" className="text-xs text-zinc-500">{saved === 'saving' ? 'Saving…' : saved === 'error' ? 'Could not save just now. Your wall is still here.' : 'Saved privately.'}</p>

      {practice.kind === 'bar' && (
        <ReturnOutcome id={practice.id} onReturned={o => { setOutcomes(cur => [...cur, o]); setNote('Returned to your BAR.') }} count={outcomes.length} />
      )}

      <section aria-labelledby="exit-h" className="rounded-2xl border border-zinc-700 bg-zinc-900/50 p-4">
        <h2 id="exit-h" className="text-base font-medium text-white">Leave or keep going</h2>
        <p className="mt-1 text-sm text-zinc-400">There is no passing or failing here. Any of these is fine.</p>
        <div className="mt-3 flex flex-col gap-2">
          {exits.map(e => <button key={e.id} type="button" onClick={() => exit(e.id)} className={`${btn} border border-zinc-600 text-left text-zinc-100`}>{e.label}</button>)}
        </div>
        {note && <p role="status" className="mt-3 text-sm text-teal-100">{note}</p>}
      </section>

      {status === 'settled' && <EmberOffer id={practice.id} words={state.constellation.words.map(w => w.label)} />}
    </div>
  )
}

function ReturnOutcome({ id, count, onReturned }: { id: string; count: number; onReturned: (o: { kind: OutcomeKind; summary: string; createdAt: string }) => void }) {
  const [kind, setKind] = useState<OutcomeKind>('next_move')
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  async function send() {
    const r = await returnOutcomeToBar(id, kind, summary)
    if ('error' in r) { setError(r.error); return }
    onReturned({ kind, summary: summary.trim(), createdAt: new Date().toISOString() }); setSummary(''); setError('')
  }
  return (
    <section aria-labelledby="ret-h" className="rounded-2xl border border-teal-300/25 bg-zinc-950/70 p-4">
      <h2 id="ret-h" className="text-base font-medium text-white">Return one outcome to your BAR</h2>
      <p className="mt-1 text-sm text-zinc-400">Only the sentence you write here goes to the BAR. Your words, charges and history stay private.{count ? ` ${count} returned so far.` : ''}</p>
      <label htmlFor="out-kind" className="mt-3 block text-sm text-zinc-300">What kind</label>
      <select id="out-kind" value={kind} onChange={e => setKind(e.target.value as OutcomeKind)} className={`${tap} mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100`}>
        {OUTCOME_KINDS.map(k => <option key={k} value={k}>{OUTCOME_LABEL[k]}</option>)}
      </select>
      <label htmlFor="out-text" className="mt-3 block text-sm text-zinc-300">In a sentence</label>
      <input id="out-text" value={summary} maxLength={280} onChange={e => setSummary(e.target.value)} className={`${tap} mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100`} />
      {error && <p role="alert" className="mt-2 text-sm text-amber-200">{error}</p>}
      <button type="button" disabled={!summary.trim()} onClick={send} className={`${btn} mt-3 w-full bg-teal-600 text-white disabled:opacity-40`}>Return it to the BAR</button>
    </section>
  )
}

function EmberOffer({ id, words }: { id: string; words: string[] }) {
  const [intensity, setIntensity] = useState<1 | 2 | 3>(1)
  const [element, setElement] = useState<Element | ''>('')
  const [chosen, setChosen] = useState<string[]>([])
  const [result, setResult] = useState('')
  async function make() {
    const r = await createEmber(id, { intensity, element: element || undefined, ingredients: chosen })
    setResult('error' in r ? r.error : 'An ember is held in your private satchel. It needs no spirit.')
  }
  return (
    <section aria-labelledby="ember-h" className="rounded-2xl border border-amber-300/30 bg-amber-950/20 p-4">
      <h2 id="ember-h" className="text-base font-medium text-amber-100">Make an ember (optional)</h2>
      <p className="mt-1 text-sm text-zinc-400">Your own fuel from this practice. You can hold it; nothing is fed or offered yet.</p>
      <fieldset className="mt-3"><legend className="text-sm text-zinc-300">Intensity</legend>
        <div className="mt-1 flex gap-2">{([1, 2, 3] as const).map(n => <button key={n} type="button" aria-pressed={intensity === n} onClick={() => setIntensity(n)} className={`${tap} flex-1 rounded-lg border text-sm ${intensity === n ? 'border-amber-300 bg-amber-400/10 text-white' : 'border-zinc-700 text-zinc-300'}`}>{n}</button>)}</div>
      </fieldset>
      <label htmlFor="ember-el" className="mt-3 block text-sm text-zinc-300">Element (optional)</label>
      <select id="ember-el" value={element} onChange={e => setElement(e.target.value as Element | '')} className={`${tap} mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100`}>
        <option value="">None</option>{ELEMENTS.map(e => <option key={e} value={e}>{e}</option>)}
      </select>
      {words.length > 0 && (
        <fieldset className="mt-3"><legend className="text-sm text-zinc-300">Ingredients from your wall</legend>
          <div className="mt-1 flex flex-wrap gap-2">{words.map(w => <button key={w} type="button" aria-pressed={chosen.includes(w)} onClick={() => setChosen(c => (c.includes(w) ? c.filter(x => x !== w) : [...c, w]))} className={`${tap} rounded-full border px-3 text-sm ${chosen.includes(w) ? 'border-amber-300 bg-amber-400/10 text-white' : 'border-zinc-700 text-zinc-300'}`}>{w}</button>)}</div>
        </fieldset>
      )}
      <button type="button" onClick={make} className={`${btn} mt-4 w-full bg-amber-600 text-white`}>Hold this ember</button>
      {result && <p role="status" className="mt-3 text-sm text-amber-100">{result}</p>}
    </section>
  )
}
