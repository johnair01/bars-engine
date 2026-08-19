'use client'

import { useEffect, useMemo, useState } from 'react'
import type { OpenUpActionKey, OpenUpAnalyticsEvent, OpenUpCardId, OpenUpEntryMode } from '@/lib/open-up/events'
import { openUpBookHref, openUpChapterOneHref, openUpSalesHref } from '@/lib/open-up/outbound'
import { BOOK_ACTIONS, GENERIC_ACTIONS, OPEN_UP_PRACTICES, OPEN_UP_STORIES, OPEN_UP_WEATHER } from '@/lib/open-up/check-content'

type Screen = 'entry' | 'notice' | 'practice' | 'action' | 'receipt'

function track(event: OpenUpAnalyticsEvent) {
  const body = JSON.stringify(event)
  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    navigator.sendBeacon('/api/open-up/events', new Blob([body], { type: 'application/json' }))
    return
  }
  void fetch('/api/open-up/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true })
}

const mono = { fontFamily: 'var(--bars-font-mono)' }
const display = { fontFamily: 'var(--bars-font-display)' }

export function OpenUpCheck({ queryString }: { queryString: string }) {
  const search = useMemo(() => new URLSearchParams(queryString), [queryString])
  const [screen, setScreen] = useState<Screen>('entry')
  const [mode, setMode] = useState<OpenUpEntryMode | null>(null)
  const [weather, setWeather] = useState<string | null>(null)
  const [story, setStory] = useState<string | null>(null)
  const [cardId, setCardId] = useState<OpenUpCardId | null>(null)
  const [action, setAction] = useState<OpenUpActionKey | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { track({ event: 'open_up_check_viewed' }) }, [])

  const begin = (entryMode: OpenUpEntryMode) => {
    setMode(entryMode)
    setScreen('notice')
    track({ event: 'open_up_check_started', entryMode })
    track({ event: 'open_up_entry_mode_selected', entryMode })
  }

  const chooseAction = (actionKey: OpenUpActionKey) => {
    if (!mode) return
    setAction(actionKey)
    setScreen('receipt')
    track({ event: 'open_up_action_selected', entryMode: mode, actionKey, cardId: cardId ?? undefined })
    track({ event: 'open_up_check_completed', entryMode: mode, actionKey, cardId: cardId ?? undefined })
  }

  const reset = () => {
    setScreen('entry'); setMode(null); setWeather(null); setStory(null); setCardId(null); setAction(null); setCopied(false)
  }

  const card = OPEN_UP_PRACTICES.find((candidate) => candidate.id === cardId)
  const actions = mode === 'book_share' ? BOOK_ACTIONS : GENERIC_ACTIONS

  return (
    <main className="min-h-screen bg-[#0b0910] px-4 py-7 text-[#ded7e4] sm:px-6 sm:py-10" style={{ fontFamily: 'var(--bars-font-body)' }}>
      <div className="mx-auto max-w-2xl">
        <header className="mb-9 flex items-center justify-between border-b border-white/10 pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7aabf]" style={mono}>
          <span>MTGOA Open Up Check</span><span>Day 2 · Open Up</span>
        </header>

        <section className="overflow-hidden rounded-[28px] border border-[#513d58] bg-[radial-gradient(110%_95%_at_50%_-10%,#321e40,#17111d_62%,#100d14)] p-6 shadow-2xl shadow-black/40 sm:p-10">
          {screen === 'entry' && <Entry onBegin={begin} salesHref={openUpSalesHref(search)} />}
          {screen === 'notice' && <Notice weather={weather} story={story} onWeather={setWeather} onStory={setStory} onNext={() => setScreen(mode === 'generic_allyship' ? 'practice' : 'action')} />}
          {screen === 'practice' && <Practice selected={cardId} onSelect={(id) => { setCardId(id); setScreen('action') }} />}
          {screen === 'action' && <Action mode={mode!} actions={actions} selectedCard={card} onChoose={chooseAction} />}
          {screen === 'receipt' && <Receipt mode={mode!} action={action!} card={card} bookHref={openUpBookHref(search)} chapterHref={openUpChapterOneHref(search)} copied={copied} onCopy={() => { navigator.clipboard?.writeText(openUpBookHref(search)); setCopied(true); track({ event: 'open_up_share_copy_copied', entryMode: mode!, actionKey: action!, shareType: 'personal_note' }) }} onBook={() => track({ event: 'open_up_book_cta_clicked', entryMode: mode!, actionKey: action!, cardId: cardId ?? undefined })} onChapter={() => track({ event: 'open_up_chapter_one_clicked', entryMode: mode!, actionKey: action!, cardId: cardId ?? undefined })} onReset={reset} />}
        </section>
        <p className="mx-auto mt-5 max-w-xl text-center text-xs leading-5 text-[#a99daa]">Nothing you select here is saved. This check is not a score, diagnosis, or obligation.</p>
      </div>
    </main>
  )
}

function Entry({ onBegin, salesHref }: { onBegin: (mode: OpenUpEntryMode) => void; salesHref: string }) {
  return <div className="space-y-8">
    <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#ff9fca]" style={mono}>A small opening, not a test</p>
    <div><h1 className="text-4xl font-bold leading-[1.02] text-white sm:text-5xl" style={display}>The charge is not the verdict.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-[#d0c6d5]">When allyship—or helping put this book in someone’s hands—brings up a lot, you do not have to disappear or force yourself through it. You can make a little room and choose one aligned action.</p></div>
    <div className="grid gap-3">
      <button onClick={() => onBegin('book_share')} className="rounded-2xl bg-gradient-to-r from-[#ff73b1] to-[#e7a851] px-5 py-4 text-left font-bold text-[#1b1018] transition hover:brightness-110">I want to help put the book in someone’s hands <span className="ml-2">→</span></button>
      <a href={salesHref} className="rounded-2xl border border-[#765b70] bg-[#211824] px-5 py-4 text-sm font-semibold text-[#f1dce8] transition hover:border-[#e8a1c5]">Haven’t bought the book yet? Start here <span className="ml-2">→</span></a>
      <button onClick={() => onBegin('generic_allyship')} className="rounded-2xl border border-white/15 bg-black/10 px-5 py-4 text-left text-sm font-semibold text-[#d7cbdc] transition hover:border-[#ba9ac0]">Practice with something alive in your own allyship</button>
    </div>
  </div>
}

function Notice({ weather, story, onWeather, onStory, onNext }: { weather: string | null; story: string | null; onWeather: (value: string) => void; onStory: (value: string) => void; onNext: () => void }) {
  return <div className="space-y-8"><div><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#ff9fca]" style={mono}>Let it register</p><h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl" style={display}>Before you decide what to do, notice what arrived.</h1><p className="mt-3 leading-7 text-[#d0c6d5]">You don’t need to fix it or explain it. Just notice it.</p></div><Choice label="What is the weather?" values={OPEN_UP_WEATHER} selected={weather} onSelect={onWeather} /><Choice label="Is there a story trying to run the show?" values={OPEN_UP_STORIES} selected={story} onSelect={onStory} /><button onClick={onNext} className="w-full rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Make room for a next move →</button><p className="text-center text-xs text-[#a99daa]">Selections stay in this browser tab only.</p></div>
}

function Choice({ label, values, selected, onSelect }: { label: string; values: readonly string[]; selected: string | null; onSelect: (value: string) => void }) {
  return <div><p className="mb-3 text-sm font-bold text-[#f1e7f3]">{label}</p><div className="flex flex-wrap gap-2">{values.map((value) => <button key={value} onClick={() => onSelect(value)} className={`rounded-full border px-3 py-2 text-sm transition ${selected === value ? 'border-[#ff9fca] bg-[#522843] text-white' : 'border-white/15 bg-black/10 text-[#d5c9d8] hover:border-[#b78eac]'}`}>{value}</button>)}</div></div>
}

function Practice({ selected, onSelect }: { selected: OpenUpCardId | null; onSelect: (id: OpenUpCardId) => void }) {
  return <div className="space-y-6"><div><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#ff9fca]" style={mono}>Choose a practice</p><h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl" style={display}>Try one move. Not all three.</h1><p className="mt-3 leading-7 text-[#d0c6d5]">Pick the one that creates a little more room without asking you to become a different person.</p></div><div className="grid gap-3">{OPEN_UP_PRACTICES.map((practice) => <button key={practice.id} onClick={() => onSelect(practice.id)} className={`rounded-2xl border p-5 text-left transition ${selected === practice.id ? 'border-[#ff9fca] bg-[#3c2036]' : 'border-white/15 bg-black/10 hover:border-[#b78eac]'}`}><span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#ff9fca]" style={mono}>{practice.role}</span><h2 className="mt-2 text-xl font-bold text-white" style={display}>{practice.title}</h2><p className="mt-2 text-sm leading-6 text-[#d0c6d5]">{practice.instruction}</p></button>)}</div></div>
}

function Action({ mode, actions, selectedCard, onChoose }: { mode: OpenUpEntryMode; actions: Array<{ key: OpenUpActionKey; label: string; detail: string }>; selectedCard?: { title: string; instruction: string }; onChoose: (key: OpenUpActionKey) => void }) {
  return <div className="space-y-7"><div><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#ff9fca]" style={mono}>One next move</p><h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl" style={display}>{mode === 'book_share' ? 'What could you actually do from here?' : 'What could you do with the room you made?'}</h1>{selectedCard && <p className="mt-3 rounded-xl border border-[#765b70] bg-black/15 p-3 text-sm text-[#dccde0]">{selectedCard.title}: {selectedCard.instruction}</p>}</div><div className="grid gap-3">{actions.map((choice) => <button key={choice.key} onClick={() => onChoose(choice.key)} className="rounded-2xl border border-white/15 bg-black/10 p-4 text-left transition hover:border-[#ff9fca] hover:bg-[#2d1a2b]"><strong className="text-[#fff5fb]">{choice.label}</strong><span className="mt-1 block text-sm text-[#bcaec0]">{choice.detail}</span></button>)}</div></div>
}

function Receipt({ mode, action, card, bookHref, chapterHref, copied, onCopy, onBook, onChapter, onReset }: { mode: OpenUpEntryMode; action: OpenUpActionKey; card?: { title: string }; bookHref: string; chapterHref: string; copied: boolean; onCopy: () => void; onBook: () => void; onChapter: () => void; onReset: () => void }) {
  const actionWords = { not_my_ask: 'decided this is not your ask', come_back: 'decided to come back', save_excerpt: 'saved this practice', name_one_person: 'named one person', send_personal_note: 'chose one personal note', take_personal_step: 'chose one small step', share_publicly: 'chose a public share' }[action]
  return <div className="space-y-7"><div><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#ff9fca]" style={mono}>Your receipt</p><h1 className="mt-3 text-4xl font-bold leading-[1.02] text-white sm:text-5xl" style={display}>The charge is not the verdict.</h1><p className="mt-5 text-lg leading-8 text-[#d0c6d5]">You {actionWords}.{card ? ` You chose ${card.title}.` : ''} That is all this check gets to say.</p></div>{mode === 'book_share' && <div className="grid gap-3"><button onClick={onCopy} className="rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">{copied ? 'Book link copied' : 'Copy the book link'}</button><a href={bookHref} onClick={onBook} className="rounded-2xl border border-[#ff9fca] px-5 py-4 text-center font-bold text-[#ffd6e8]">Get the book →</a><a href={chapterHref} onClick={onChapter} className="text-center text-sm text-[#d0c6d5] underline underline-offset-4">Read Chapter 1 free</a></div>}<button onClick={onReset} className="w-full text-sm text-[#bcaec0] underline underline-offset-4">Start again</button></div>
}
