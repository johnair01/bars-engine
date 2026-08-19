'use client'

import { useEffect, useMemo, useState } from 'react'
import type { OpenUpActionKey, OpenUpAnalyticsEvent, OpenUpCardId, OpenUpEntryMode } from '@/lib/open-up/events'
import { openUpBookHref, openUpChapterOneHref, openUpSalesHref } from '@/lib/open-up/outbound'
import { BOOK_ACTIONS, GENERIC_ACTIONS, OPEN_UP_BELIEFS, OPEN_UP_EMOTIONS, OPEN_UP_PRACTICES, OPEN_UP_WEATHER, type OpenUpPractice } from '@/lib/open-up/check-content'
import { AllyshipCard } from '@/components/deck/AllyshipCard'

type Screen = 'entry' | 'weather' | 'emotion' | 'belief' | 'people' | 'sampler' | 'action' | 'receipt'
type OutreachPerson = { id: string; name: string; sent: boolean }
type Emotion = (typeof OPEN_UP_EMOTIONS)[number]
type Belief = (typeof OPEN_UP_BELIEFS)[number]

const OUTREACH_STORAGE_KEY = 'mtgoa-open-up-outreach-v1'
const mono = { fontFamily: 'var(--bars-font-mono)' }
const display = { fontFamily: 'var(--bars-font-display)' }

function track(event: OpenUpAnalyticsEvent) {
  const body = JSON.stringify(event)
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/api/open-up/events', new Blob([body], { type: 'application/json' }))
    return
  }
  void fetch('/api/open-up/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true })
}

function drawThree() {
  const cards = [...OPEN_UP_PRACTICES]
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[cards[index], cards[swap]] = [cards[swap], cards[index]]
  }
  return cards.slice(0, 3)
}

export function OpenUpCheck({ queryString }: { queryString: string }) {
  const search = useMemo(() => new URLSearchParams(queryString), [queryString])
  const [screen, setScreen] = useState<Screen>('entry')
  const [mode, setMode] = useState<OpenUpEntryMode | null>(null)
  const [weather, setWeather] = useState<string | null>(null)
  const [emotionKey, setEmotionKey] = useState<string | null>(null)
  const [beliefKey, setBeliefKey] = useState<string | null>(null)
  const [draw, setDraw] = useState<OpenUpPractice[]>([])
  const [cardId, setCardId] = useState<OpenUpCardId | null>(null)
  const [action, setAction] = useState<OpenUpActionKey | null>(null)
  const [people, setPeople] = useState<OutreachPerson[]>([])
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => { track({ event: 'open_up_check_viewed' }) }, [])
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(OUTREACH_STORAGE_KEY)
      const value: unknown = raw ? JSON.parse(raw) : []
      if (Array.isArray(value)) setPeople(value.filter((item): item is OutreachPerson => !!item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.sent === 'boolean').slice(0, 100))
    } catch { /* Browser storage is optional. */ }
    setStorageReady(true)
  }, [])
  useEffect(() => {
    if (!storageReady) return
    try { window.localStorage.setItem(OUTREACH_STORAGE_KEY, JSON.stringify(people)) } catch { /* Browser storage is optional. */ }
  }, [people, storageReady])

  const emotion = OPEN_UP_EMOTIONS.find((item) => item.key === emotionKey) as Emotion | undefined
  const belief = OPEN_UP_BELIEFS.find((item) => item.key === beliefKey) as Belief | undefined
  const card = OPEN_UP_PRACTICES.find((item) => item.id === cardId)
  const bookHref = openUpBookHref(search)
  const addPerson = (name: string) => setPeople((current) => [...current, { id: globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()), name, sent: false }])
  const togglePerson = (id: string) => setPeople((current) => current.map((person) => person.id === id ? { ...person, sent: !person.sent } : person))
  const removePerson = (id: string) => setPeople((current) => current.filter((person) => person.id !== id))
  const begin = (nextMode: OpenUpEntryMode) => {
    setMode(nextMode); setScreen('weather')
    track({ event: 'open_up_check_started', entryMode: nextMode })
    track({ event: 'open_up_entry_mode_selected', entryMode: nextMode })
  }
  const openSampler = () => { setDraw(drawThree()); setCardId(null); setScreen('sampler') }
  const chooseAction = (actionKey: OpenUpActionKey) => {
    if (!mode) return
    setAction(actionKey); setScreen('receipt')
    track({ event: 'open_up_action_selected', entryMode: mode, actionKey, cardId: cardId ?? undefined })
    track({ event: 'open_up_check_completed', entryMode: mode, actionKey, cardId: cardId ?? undefined })
  }
  const restart = () => { setScreen('entry'); setMode(null); setWeather(null); setEmotionKey(null); setBeliefKey(null); setDraw([]); setCardId(null); setAction(null) }
  const goBack = () => {
    const previous: Record<Exclude<Screen, 'entry'>, Screen> = {
      weather: 'entry',
      emotion: 'weather',
      belief: 'emotion',
      people: emotion?.kind === 'dissatisfied' ? 'belief' : 'emotion',
      sampler: 'people',
      action: 'sampler',
      receipt: 'action',
    }
    if (screen !== 'entry') setScreen(previous[screen])
  }

  return <main className="min-h-screen bg-[#0b0910] px-4 py-7 text-[#ded7e4] sm:px-6 sm:py-10" style={{ fontFamily: 'var(--bars-font-body)' }}>
    <div className="mx-auto max-w-2xl">
      <header className="mb-9 flex items-center justify-between border-b border-white/10 pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7aabf]" style={mono}><span>MTGOA Open Up Check</span><span>Day 2 · Open Up</span></header>
      <section className="overflow-hidden rounded-[28px] border border-[#513d58] bg-[radial-gradient(110%_95%_at_50%_-10%,#321e40,#17111d_62%,#100d14)] p-6 shadow-2xl shadow-black/40 sm:p-10">
        {screen === 'entry' ? <Entry onBegin={begin} salesHref={openUpSalesHref(search)} /> : null}
        {screen === 'weather' ? <Weather value={weather} onChange={setWeather} onNext={() => setScreen('emotion')} onBack={goBack} mode={mode!} /> : null}
        {screen === 'emotion' ? <EmotionStep value={emotionKey} onChange={setEmotionKey} onNext={() => setScreen(emotion?.kind === 'dissatisfied' ? 'belief' : 'people')} onBack={goBack} /> : null}
        {screen === 'belief' ? <BeliefStep value={beliefKey} onChange={setBeliefKey} onNext={() => setScreen('people')} onBack={goBack} /> : null}
        {screen === 'people' ? <PeopleStep people={people} onAdd={addPerson} onToggle={togglePerson} onRemove={removePerson} onClear={() => setPeople([])} onNext={openSampler} onBack={goBack} /> : null}
        {screen === 'sampler' ? <Sampler cards={draw} value={cardId} onChange={setCardId} onDraw={() => { setDraw(drawThree()); setCardId(null) }} onNext={() => setScreen('action')} onBack={goBack} /> : null}
        {screen === 'action' ? <Action mode={mode!} card={card} belief={belief} onChoose={chooseAction} onBack={goBack} /> : null}
        {screen === 'receipt' ? <Receipt mode={mode!} action={action!} weather={weather} emotion={emotion} belief={belief} card={card} bookHref={bookHref} chapterHref={openUpChapterOneHref(search)} people={people} onToggle={togglePerson} onRemove={removePerson} onClear={() => setPeople([])} onBook={() => track({ event: 'open_up_book_cta_clicked', entryMode: mode!, actionKey: action!, cardId: cardId ?? undefined })} onChapter={() => track({ event: 'open_up_chapter_one_clicked', entryMode: mode!, actionKey: action!, cardId: cardId ?? undefined })} onCopy={(shareType) => track({ event: 'open_up_share_copy_copied', entryMode: mode!, actionKey: action!, cardId: cardId ?? undefined, shareType })} onRestart={restart} onBack={goBack} /> : null}
      </section>
      <p className="mx-auto mt-5 max-w-xl text-center text-xs leading-5 text-[#a99daa]">Your check selections and draft are not saved. Your outreach list stays only in this browser, until you clear it.</p>
    </div>
  </main>
}

function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <div><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#ff9fca]" style={mono}>{eyebrow}</p><h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl" style={display}>{title}</h1><p className="mt-3 leading-7 text-[#d0c6d5]">{children}</p></div>
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="mb-5 text-sm text-[#c9bdcd] underline underline-offset-4">← Back</button>
}

function Entry({ onBegin, salesHref }: { onBegin: (mode: OpenUpEntryMode) => void; salesHref: string }) {
  return <div className="space-y-8"><Heading eyebrow="A small opening, not a test" title="There is energy here to work with.">When allyship—or helping put this book in someone’s hands—brings up a lot, slow down long enough to notice where the energy wants to go.</Heading><div className="grid gap-3"><button onClick={() => onBegin('book_share')} className="rounded-2xl bg-gradient-to-r from-[#ff73b1] to-[#e7a851] px-5 py-4 text-left font-bold text-[#1b1018]">I want to help put the book in someone’s hands →</button><a href={salesHref} className="rounded-2xl border border-[#765b70] bg-[#211824] px-5 py-4 text-sm font-semibold text-[#f1dce8]">Haven’t bought the book yet? Start here →</a><button onClick={() => onBegin('generic_allyship')} className="rounded-2xl border border-white/15 bg-black/10 px-5 py-4 text-left text-sm font-semibold text-[#d7cbdc]">Practice with something alive in your own allyship</button></div></div>
}

function Weather({ mode, value, onChange, onNext, onBack }: { mode: OpenUpEntryMode; value: string | null; onChange: (value: string) => void; onNext: () => void; onBack: () => void }) {
  return <div className="space-y-7"><BackButton onClick={onBack} /><Heading eyebrow="Let it register" title={mode === 'book_share' ? 'Where does the charge around sharing the book live in your body?' : 'Where does the charge live in your body?'}>You do not need to fix it or explain it. Just notice it.</Heading><div className="flex flex-wrap gap-2">{OPEN_UP_WEATHER.map((item) => <button key={item} onClick={() => onChange(item)} className={'rounded-full border px-3 py-2 text-sm ' + (value === item ? 'border-[#ff9fca] bg-[#522843] text-white' : 'border-white/15 bg-black/10 text-[#d5c9d8]')}>{item}</button>)}</div><button onClick={onNext} className="w-full rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Notice the emotional weather →</button></div>
}

function EmotionStep({ value, onChange, onNext, onBack }: { value: string | null; onChange: (value: string) => void; onNext: () => void; onBack: () => void }) {
  return <div className="space-y-6"><BackButton onClick={onBack} /><Heading eyebrow="Emotional weather" title="Which description is closest?">This is a prompt, not a diagnosis. Pick one, or keep moving.</Heading><div className="grid gap-2">{OPEN_UP_EMOTIONS.map((item) => <button key={item.key} onClick={() => onChange(item.key)} className={'rounded-2xl border p-4 text-left ' + (value === item.key ? 'border-[#ff9fca] bg-[#3c2036]' : 'border-white/15 bg-black/10')}><strong className="text-[#fff5fb]">{item.label}</strong><span className="mt-1 block text-sm text-[#bcaec0]">{item.hint}</span></button>)}</div><button onClick={onNext} className="w-full rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Continue →</button></div>
}

function BeliefStep({ value, onChange, onNext, onBack }: { value: string | null; onChange: (value: string) => void; onNext: () => void; onBack: () => void }) {
  const active = OPEN_UP_BELIEFS.find((item) => item.key === value)
  return <div className="space-y-6"><BackButton onClick={onBack} /><Heading eyebrow="The voice under the weather" title="Which one sounds familiar?">Name it if it fits. You are not required to agree with it.</Heading><div className="grid gap-2">{OPEN_UP_BELIEFS.map((item) => <button key={item.key} onClick={() => onChange(item.key)} className={'rounded-2xl border p-4 text-left ' + (value === item.key ? 'border-[#ff9fca] bg-[#3c2036]' : 'border-white/15 bg-black/10')}><span className="text-[#f5e8f0]">{item.voice}</span><span className="mt-2 block text-xs text-[#bcaec0]">{item.belief}</span></button>)}</div>{active ? <div className="rounded-2xl border border-[#765b70] bg-black/15 p-4 text-sm leading-6 text-[#e8dce8]"><strong>{active.question}</strong><p className="mt-2 text-[#bcaec0]">{active.reframe}</p></div> : null}<button onClick={onNext} className="w-full rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Continue →</button></div>
}

function PeopleStep({ people, onAdd, onToggle, onRemove, onClear, onNext, onBack }: { people: OutreachPerson[]; onAdd: (name: string) => void; onToggle: (id: string) => void; onRemove: (id: string) => void; onClear: () => void; onNext: () => void; onBack: () => void }) {
  return <div className="space-y-6"><BackButton onClick={onBack} /><Heading eyebrow="Who might need this?" title="Make a list, not a performance.">These names stay in your browser and will be waiting beside the share draft.</Heading><OutreachList people={people} editable onAdd={onAdd} onToggle={onToggle} onRemove={onRemove} onClear={onClear} /><div className="grid gap-3 sm:grid-cols-2"><button onClick={onNext} className="rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Continue to the card draw →</button><button onClick={onNext} className="rounded-2xl border border-white/15 px-5 py-4 font-bold text-[#f1dce8]">Skip this list →</button></div></div>
}

function Sampler({ cards, value, onChange, onDraw, onNext, onBack }: { cards: OpenUpPractice[]; value: string | null; onChange: (id: string) => void; onDraw: () => void; onNext: () => void; onBack: () => void }) {
  const [expanded, setExpanded] = useState<OpenUpPractice | null>(null)
  return <div className="space-y-6"><BackButton onClick={onBack} /><Heading eyebrow="A random draw from the Allyship Deck" title="Pick one, draw again, or skip.">Draw from all 24 Open Up cards, then use the one you choose as a doorway into practice.</Heading><div className="grid gap-4 sm:grid-cols-3">{cards.map((item) => <div key={item.id} className={value === item.id ? 'rounded-xl outline outline-2 outline-[#ff9fca] outline-offset-4' : ''}><AllyshipCard card={item} variant="grid" onClick={() => setExpanded(item)} /></div>)}</div><div className="grid gap-3 sm:grid-cols-2"><button onClick={onDraw} className="rounded-2xl border border-white/15 px-5 py-4 font-bold text-[#f1dce8]">Draw three more</button><button onClick={onNext} className="rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">{value ? 'Continue with this card →' : 'Skip the draw →'}</button></div>{expanded ? <CardModal card={expanded} onClose={() => setExpanded(null)} onChoose={() => { onChange(expanded.id); setExpanded(null) }} /> : null}</div>
}

function CardModal({ card, onClose, onChoose }: { card: OpenUpPractice; onClose: () => void; onChoose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  return <div role="dialog" aria-modal="true" aria-label={card.title} className="fixed inset-0 z-50 flex items-end bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-8" onMouseDown={onClose}><div className="mx-auto flex max-h-[96dvh] w-full max-w-lg flex-col rounded-t-[28px] bg-[#120d17] p-4 shadow-2xl sm:rounded-[28px]" onMouseDown={(event) => event.stopPropagation()}><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#c9bdcd]" style={mono}>Drawn card</span><button type="button" onClick={onClose} className="rounded-full border border-white/15 px-3 py-1 text-sm text-[#f2e6f0]">Close</button></div><div className="min-h-0 overflow-y-auto px-1 pb-2"><AllyshipCard card={card} variant="full" /></div><button type="button" onClick={onChoose} className="mt-4 shrink-0 rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Choose this card →</button></div></div>
}

function Action({ mode, card, belief, onChoose, onBack }: { mode: OpenUpEntryMode; card?: OpenUpPractice; belief?: Belief; onChoose: (action: OpenUpActionKey) => void; onBack: () => void }) {
  const actions = mode === 'book_share' ? BOOK_ACTIONS : GENERIC_ACTIONS
  return <div className="space-y-7"><BackButton onClick={onBack} /><Heading eyebrow={belief ? 'Alive right now · ' + belief.belief : 'One next move'} title={mode === 'book_share' ? 'What could you actually do from here?' : 'What could you do with the room you made?'}>{belief ? belief.question + ' ' + belief.reframe : 'Choose a move that your actual capacity can support.'}</Heading>{card ? <div className="rounded-2xl border border-[#765b70] bg-black/15 p-4 text-sm leading-6 text-[#dccde0]"><strong>{card.title}</strong><br />{card.remediation}</div> : null}<div className="grid gap-3">{actions.map((item) => <button key={item.key} onClick={() => onChoose(item.key)} className="rounded-2xl border border-white/15 bg-black/10 p-4 text-left hover:border-[#ff9fca]"><strong className="text-[#fff5fb]">{item.label}</strong><span className="mt-1 block text-sm text-[#bcaec0]">{item.detail}</span></button>)}</div></div>
}

function Receipt({ mode, action, weather, emotion, belief, card, bookHref, chapterHref, people, onToggle, onRemove, onClear, onBook, onChapter, onCopy, onRestart, onBack }: { mode: OpenUpEntryMode; action: OpenUpActionKey; weather: string | null; emotion?: Emotion; belief?: Belief; card?: OpenUpPractice; bookHref: string; chapterHref: string; people: OutreachPerson[]; onToggle: (id: string) => void; onRemove: (id: string) => void; onClear: () => void; onBook: () => void; onChapter: () => void; onCopy: (type: 'personal_note' | 'public_share') => void; onRestart: () => void; onBack: () => void }) {
  const [draft, setDraft] = useState(() => draftFor(mode, weather, emotion, belief, bookHref))
  const [copied, setCopied] = useState(false)
  const actions: Record<OpenUpActionKey, string> = { not_my_ask: 'decided this is not your ask', come_back: 'decided to come back', save_excerpt: 'saved this practice', name_one_person: 'named one person', send_personal_note: 'chose one personal note', take_personal_step: 'chose one small step', share_publicly: 'chose a public share' }
  const evidence = ['showed up to the question', weather && weather !== 'not sure / skip' ? 'body weather · ' + weather : null, emotion ? 'emotional weather · ' + emotion.label : null, belief ? 'named the charged belief' : null, people.length ? 'made an outreach list' : null, card ? 'drew ' + card.title : null, 'chose · ' + actions[action]].filter(Boolean)
  const copy = () => { void navigator.clipboard?.writeText(draft); setCopied(true); onCopy(action === 'share_publicly' ? 'public_share' : 'personal_note') }
  return <div className="space-y-7"><BackButton onClick={onBack} /><Heading eyebrow="Your receipt" title={action === 'not_my_ask' ? 'Heard. This is not your ask.' : action === 'come_back' ? 'Come back whenever.' : 'The share is live in your hands.'}>You {actions[action]}.{card ? ' You drew ' + card.title + '.' : ''}</Heading>{action === 'come_back' ? <CalendarReturn /> : null}{action !== 'not_my_ask' ? <div className="grid gap-5"><label><span className="text-sm font-bold text-[#f1e7f3]">Your draft share</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={8} className="mt-2 w-full rounded-2xl border border-[#765b70] bg-black/20 p-4 text-sm leading-6 text-[#eee3f0] outline-none focus:border-[#ff9fca]" /><span className="mt-2 block text-xs text-[#a99daa]">Edit it until it sounds like you. This text is never sent to us.</span></label><button onClick={copy} className="rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">{copied ? 'Draft copied' : 'Copy the draft'}</button>{mode === 'book_share' ? <><OutreachList people={people} onAdd={() => {}} onToggle={onToggle} onRemove={onRemove} onClear={onClear} /><a href={bookHref} onClick={onBook} className="rounded-2xl border border-[#ff9fca] px-5 py-4 text-center font-bold text-[#ffd6e8]">Get the book →</a><a href="/deck/sales" className="rounded-2xl border border-[#765b70] px-5 py-4 text-center font-bold text-[#f1dce8]">Explore the Allyship Deck →</a><a href={chapterHref} onClick={onChapter} className="text-center text-sm text-[#d0c6d5] underline underline-offset-4">Read Chapter 1 free</a></> : <a href="/deck/sales" className="rounded-2xl border border-[#765b70] px-5 py-4 text-center font-bold text-[#f1dce8]">Explore the Allyship Deck →</a>}</div> : <div className="rounded-2xl border border-dashed border-[#765b70] p-4 text-sm text-[#d0c6d5]">Closing the tab is also a complete move.</div>}<div className="border-t border-white/10 pt-5"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#a99daa]" style={mono}>The moves you made here</p><div className="mt-3 flex flex-wrap gap-2">{evidence.map((item) => <span key={item} className="rounded-full border border-white/10 bg-black/15 px-3 py-2 text-[10px] uppercase tracking-[.08em] text-[#c9bdcd]" style={mono}>{item}</span>)}</div></div><button onClick={onRestart} className="w-full text-sm text-[#bcaec0] underline underline-offset-4">Start again</button></div>
}

function OutreachList({ people, editable = false, onAdd, onToggle, onRemove, onClear }: { people: OutreachPerson[]; editable?: boolean; onAdd: (name: string) => void; onToggle: (id: string) => void; onRemove: (id: string) => void; onClear: () => void }) {
  const [name, setName] = useState('')
  const add = () => { const trimmed = name.trim(); if (!trimmed) return; onAdd(trimmed); setName('') }
  return <div className="rounded-2xl border border-[#765b70] bg-black/15 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-bold text-[#f1e7f3]">People who might need this</p><p className="mt-1 text-xs text-[#a99daa]">Saved only in this browser. Check them off when you send it.</p></div>{people.length ? <button onClick={onClear} className="text-xs text-[#d6b1c4] underline">Clear list</button> : null}</div>{editable ? <div className="mt-3 flex gap-2"><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add() } }} placeholder="Add a person" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-[#ff9fca]" /><button onClick={add} className="rounded-xl bg-[#513047] px-3 py-2 text-sm font-bold text-white">Add</button></div> : null}{people.length ? <ul className="mt-3 space-y-2">{people.map((person) => <li key={person.id} className="flex items-center gap-2 rounded-xl bg-black/15 px-3 py-2"><input id={person.id} type="checkbox" checked={person.sent} onChange={() => onToggle(person.id)} className="size-4 accent-[#ff9fca]" /><label htmlFor={person.id} className={'min-w-0 flex-1 text-sm ' + (person.sent ? 'text-[#a99daa] line-through' : 'text-[#eee3f0]')}>{person.name}</label><button aria-label={'Remove ' + person.name} onClick={() => onRemove(person.id)} className="text-sm text-[#d6b1c4]">×</button></li>)}</ul> : null}</div>
}

function CalendarReturn() {
  const open = (days: number) => { const start = new Date(); start.setDate(start.getDate() + days); const end = new Date(start); end.setDate(end.getDate() + 1); const stamp = (date: Date) => date.toISOString().slice(0, 10).replaceAll('-', ''); const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Open Up Check — come back to the question') + '&dates=' + stamp(start) + '/' + stamp(end); window.open(url, '_blank', 'noopener,noreferrer') }
  return <div><p className="text-sm font-bold text-[#f1e7f3]">Put it in the calendar</p><p className="mt-1 text-sm text-[#bcaec0]">The check waits either way.</p><div className="mt-3 flex flex-wrap gap-2">{[[1, 'Tomorrow'], [3, 'In three days'], [7, 'Next week']].map(([days, label]) => <button key={days} onClick={() => open(days as number)} className="rounded-full border border-white/15 px-3 py-2 text-sm text-[#eee3f0]">{label}</button>)}</div></div>
}

function draftFor(mode: OpenUpEntryMode, weather: string | null, emotion: Emotion | undefined, belief: Belief | undefined, bookHref: string) {
  const reflection = [weather && weather !== 'not sure / skip' ? 'The feeling showed up ' + weather + ' in my body.' : null, emotion ? 'I noticed ' + emotion.label + ' around it.' : null, belief ? 'Under that was the voice saying “' + belief.belief + '.”' : null].filter(Boolean).join(' ')
  return mode === 'book_share' ? 'I sat with one question today: would I put Mastering the Game of Allyship in the hands of someone who trusts my taste? ' + reflection + ' I slowed down long enough to see where the energy wanted to go. This book made me think of you: ' + bookHref : 'I ran a small Open Up practice on something alive in my allyship. ' + reflection + ' There is energy here to work with.'
}
