'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AllyshipCard } from '@/components/deck/AllyshipCard'
import { CLEAN_UP_PRACTICES } from '@/lib/mtgoa-course/course-days'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { WakeUpIntake } from './WakeUpIntake'

type PracticeKind = 'wake_up' | 'clean_up'
type Screen = 'entry' | 'notice' | 'counterpart' | 'three' | 'two' | 'one' | 'draw' | 'receipt'

const COPY = {
  wake_up: {
    day: 'Day 1 · Wake Up',
    eyebrow: 'Start with what is actually happening',
    title: 'Wake up to your own allyship.',
    intro: 'Before you decide whether to act, notice what comes alive when you think about the allyship you want to practice.',
    noticeTitle: 'What catches your attention?',
    notice: 'You are not being asked to fix, justify, or make a plan. Awareness is enough for today.',
    choices: ['I feel pulled toward something', 'I am avoiding something', 'I feel uncertain where to begin', 'I notice a story about what I should already know', 'Something else is here'],
    drawTitle: 'Draw a Wake Up card, or keep your own notice.',
    draw: 'All 24 Wake Up cards are in the draw. A card is an invitation to notice more clearly, not a verdict about you.',
    receiptTitle: 'You made awareness.',
    receipt: 'You noticed what is happening. Tomorrow, Open Up asks whether you can make a little room for what you found.',
    nextHref: '/open-up',
    nextLabel: 'Continue to Day 2: Open Up →',
  },
  clean_up: {
    day: 'Day 3 · Clean Up',
    eyebrow: 'Separate the energy from the story',
    title: 'Clean up the interpretation.',
    intro: 'A charge can carry useful information. It can also gather a story that makes the next move look smaller, riskier, or more impossible than it is.',
    noticeTitle: 'Which self-sabotaging belief is doing the blocking?',
    notice: 'The book names six common reservations: not good enough, not ready, do not belong, insignificant, not worthy, and not capable. You do not need to prove one wrong. Name the one that is narrowing the next move.',
    choices: ['I’m not good enough', 'I’m not ready', 'I don’t belong', 'I’m insignificant', 'I’m not worthy', 'I’m not capable'],
    drawTitle: 'Draw a Clean Up card, or keep working with the story you named.',
    draw: 'All 24 Clean Up cards are in the draw. A card offers a missing move; it does not tell you what is wrong with you.',
    receiptTitle: 'You made room for an insight.',
    receipt: 'The question is not whether your charge disappears. It is whether you can see a cleaner next reading—and carry that into the next move.',
    nextHref: '/deck/sales',
    nextLabel: 'Explore the Allyship Deck →',
  },
} as const

function drawThree(cards: MoveCard[]) {
  const shuffled = [...cards]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]]
  }
  return shuffled.slice(0, 3)
}

export function MovePractice({ kind, courseRound = 1 }: { kind: PracticeKind; courseRound?: number }) {
  if (kind === 'wake_up') return <WakeUpIntake courseRound={courseRound} />
  const copy = COPY[kind]
  const practices = CLEAN_UP_PRACTICES
  const [screen, setScreen] = useState<Screen>('entry')
  const [notice, setNotice] = useState<string | null>(null)
  const [draw, setDraw] = useState<MoveCard[]>(() => drawThree(practices))
  const [selectedCard, setSelectedCard] = useState<MoveCard | null>(null)
  const [expandedCard, setExpandedCard] = useState<MoveCard | null>(null)
  const [counterpart, setCounterpart] = useState<string | null>(null)
  const [three, setThree] = useState('')
  const [two, setTwo] = useState('')
  const [one, setOne] = useState('')

  const back = () => setScreen((current) => ({ notice: 'entry', counterpart: 'notice', three: 'counterpart', two: 'three', one: 'two', draw: 'one', receipt: 'draw', entry: 'entry' })[current] as Screen)
  const restart = () => { setNotice(null); setCounterpart(null); setThree(''); setTwo(''); setOne(''); setSelectedCard(null); setDraw(drawThree(practices)); setScreen('entry') }

  return <main className="min-h-screen bg-[#0b0910] px-4 py-7 text-[#ded7e4] sm:px-6 sm:py-10" style={{ fontFamily: 'var(--bars-font-body)' }}>
    <div className="mx-auto max-w-2xl">
      <header className="mb-9 flex items-center justify-between border-b border-white/10 pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7aabf]" style={{ fontFamily: 'var(--bars-font-mono)' }}><span>Mastering the Game of Allyship</span><span>{copy.day}</span></header>
      <section className="overflow-hidden rounded-[28px] border border-[#513d58] bg-[radial-gradient(110%_95%_at_50%_-10%,#321e40,#17111d_62%,#100d14)] p-6 shadow-2xl shadow-black/40 sm:p-10">
        {screen === 'entry' ? <><Heading eyebrow={copy.eyebrow} title={copy.title}>{copy.intro}</Heading><button type="button" onClick={() => setScreen('notice')} className="mt-8 w-full rounded-2xl bg-gradient-to-r from-[#ff73b1] to-[#e7a851] px-5 py-4 text-left font-bold text-[#1b1018]">Begin the practice →</button><p className="mt-4 text-center text-xs text-[#a99daa]">Your answers stay on this page. They are not saved or sent anywhere.</p></> : null}
        {screen === 'notice' ? <><Back onClick={back} /><Heading eyebrow="Notice" title={copy.noticeTitle}>{copy.notice}</Heading><div className="mt-6 grid gap-2">{copy.choices.map((choice) => <button type="button" key={choice} onClick={() => setNotice(choice)} className={'rounded-2xl border p-4 text-left text-sm ' + (notice === choice ? 'border-[#ff9fca] bg-[#3c2036] text-white' : 'border-white/15 bg-black/10 text-[#e6dae6]')}>{choice}</button>)}</div><button type="button" onClick={() => setScreen(kind === 'clean_up' ? 'counterpart' : 'draw')} className="mt-6 w-full rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">{kind === 'clean_up' ? 'Find the part that knows more →' : 'Continue to the card draw →'}</button></> : null}
        {screen === 'counterpart' ? <><Back onClick={back} /><Heading eyebrow="A campaign adaptation of 3-2-1" title="Find the part of you that does not believe this is the whole story.">The belief may be loud. It is not the only voice you have. Choose a part with some actual evidence that you can read, recommend, or practice without becoming a different person first.</Heading><div className="mt-6 grid gap-2">{['The part that has put something meaningful in a friend’s hands before', 'The part that knows what I would tell a friend carrying this belief', 'The part that has acted before certainty arrived', 'The part that can name one honest sentence about the book', 'Another part is here'].map((choice) => <button type="button" key={choice} onClick={() => setCounterpart(choice)} className={'rounded-2xl border p-4 text-left text-sm ' + (counterpart === choice ? 'border-[#ff9fca] bg-[#3c2036] text-white' : 'border-white/15 bg-black/10 text-[#e6dae6]')}>{choice}</button>)}</div><button type="button" onClick={() => setScreen('three')} className="mt-6 w-full rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Begin 3-2-1 →</button></> : null}
        {screen === 'three' ? <ThreeTwoOneStep number="3" pronoun="They" title="Face this part." body="Describe the part you chose as if you were describing someone in the next room. What do they notice? What do they know about the belief you named?" value={three} onChange={setThree} onBack={back} onNext={() => setScreen('two')} /> : null}
        {screen === 'two' ? <ThreeTwoOneStep number="2" pronoun="You" title="Talk to this part." body="Address it directly. Ask: What do you want for me? What are you protecting? What would you have me do about reading, sharing, or practicing allyship?" value={two} onChange={setTwo} onBack={back} onNext={() => setScreen('one')} /> : null}
        {screen === 'one' ? <ThreeTwoOneStep number="1" pronoun="I" title="Let it speak in your voice." body="Write from this part in the first person. Do not make a grand promise. Let it name one small thing it knows is possible." value={one} onChange={setOne} onBack={back} onNext={() => setScreen('draw')} /> : null}
        {screen === 'draw' ? <><Back onClick={back} /><Heading eyebrow="A practice from the Allyship Deck" title={copy.drawTitle}>{copy.draw}</Heading><div className="mt-6 grid gap-4 sm:grid-cols-3">{draw.map((card) => <div key={card.id} className={selectedCard?.id === card.id ? 'rounded-xl outline outline-2 outline-[#ff9fca] outline-offset-4' : ''}><AllyshipCard card={card} variant="grid" onClick={() => setExpandedCard(card)} /></div>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => { setDraw(drawThree(practices)); setSelectedCard(null) }} className="rounded-2xl border border-white/15 px-5 py-4 font-bold text-[#f1dce8]">Draw three more</button><button type="button" onClick={() => setScreen('receipt')} className="rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">{selectedCard ? 'Continue with this card →' : 'Skip the draw →'}</button></div></> : null}
        {screen === 'receipt' ? <><Back onClick={back} /><Heading eyebrow="Your receipt" title={copy.receiptTitle}>{copy.receipt}</Heading><div className="mt-6 rounded-2xl border border-[#765b70] bg-black/15 p-4 text-sm leading-6 text-[#e8dce8]"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#b7aabf]" style={{ fontFamily: 'var(--bars-font-mono)' }}>What you held</p><p className="mt-2">{notice ?? 'You chose to stay with the question.'}</p>{kind === 'clean_up' && one ? <><p className="mt-4 text-[10px] font-bold uppercase tracking-[.18em] text-[#b7aabf]" style={{ fontFamily: 'var(--bars-font-mono)' }}>The part you reclaimed</p><p className="mt-2 whitespace-pre-wrap">{one}</p></> : null}{selectedCard ? <><p className="mt-4 text-[10px] font-bold uppercase tracking-[.18em] text-[#b7aabf]" style={{ fontFamily: 'var(--bars-font-mono)' }}>Your card</p><p className="mt-2 font-bold text-white">{selectedCard.title}</p><p className="mt-1 text-[#c9bdcd]">{selectedCard.remediation}</p></> : null}</div><Link href={copy.nextHref} className="mt-6 block rounded-2xl border border-[#ff9fca] px-5 py-4 text-center font-bold text-[#ffd6e8]">{copy.nextLabel}</Link><button type="button" onClick={restart} className="mt-5 w-full text-sm text-[#bcaec0] underline underline-offset-4">Start again</button></> : null}
      </section>
      <p className="mx-auto mt-5 max-w-xl text-center text-xs leading-5 text-[#a99daa]">Course-answer persistence is intentionally off. Nothing you choose here is stored, logged, or sent to us.</p>
    </div>
    {expandedCard ? <CardModal card={expandedCard} onClose={() => setExpandedCard(null)} onChoose={() => { setSelectedCard(expandedCard); setExpandedCard(null) }} /> : null}
  </main>
}

function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <div><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#ff9fca]" style={{ fontFamily: 'var(--bars-font-mono)' }}>{eyebrow}</p><h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl" style={{ fontFamily: 'var(--bars-font-display)' }}>{title}</h1><p className="mt-3 leading-7 text-[#d0c6d5]">{children}</p></div>
}

function Back({ onClick }: { onClick: () => void }) { return <button type="button" onClick={onClick} className="mb-5 text-sm text-[#c9bdcd] underline underline-offset-4">← Back</button> }

function ThreeTwoOneStep({ number, pronoun, title, body, value, onChange, onBack, onNext }: { number: '3' | '2' | '1'; pronoun: 'They' | 'You' | 'I'; title: string; body: string; value: string; onChange: (value: string) => void; onBack: () => void; onNext: () => void }) {
  return <><Back onClick={onBack} /><Heading eyebrow={`3-2-1 · ${number} · ${pronoun}`} title={title}>{body}</Heading><label className="mt-6 block"><span className="text-sm font-bold text-[#f1e7f3]">Begin with “{pronoun}…”</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={7} placeholder={`${pronoun}…`} className="mt-2 w-full rounded-2xl border border-[#765b70] bg-black/20 p-4 text-sm leading-6 text-[#eee3f0] outline-none focus:border-[#ff9fca]" /><span className="mt-2 block text-xs text-[#a99daa]">Private to this page. It is not saved or sent to us.</span></label><button type="button" onClick={onNext} className="mt-6 w-full rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Continue →</button></>
}

function CardModal({ card, onClose, onChoose }: { card: MoveCard; onClose: () => void; onChoose: () => void }) {
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [onClose])
  return <div role="dialog" aria-modal="true" aria-label={card.title} className="fixed inset-0 z-50 flex items-end bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-8" onMouseDown={onClose}><div className="mx-auto flex max-h-[96dvh] w-full max-w-lg flex-col rounded-t-[28px] bg-[#120d17] p-4 shadow-2xl sm:rounded-[28px]" onMouseDown={(event) => event.stopPropagation()}><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#c9bdcd]" style={{ fontFamily: 'var(--bars-font-mono)' }}>Drawn card</span><button type="button" onClick={onClose} className="rounded-full border border-white/15 px-3 py-1 text-sm text-[#f2e6f0]">Close</button></div><div className="min-h-0 overflow-y-auto px-1 pb-2"><AllyshipCard card={card} variant="full" /></div><button type="button" onClick={onChoose} className="mt-4 shrink-0 rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Choose this card →</button></div></div>
}
