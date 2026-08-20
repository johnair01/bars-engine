'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AllyshipCard } from '@/components/deck/AllyshipCard'
import { CLEAN_UP_PRACTICES } from '@/lib/mtgoa-course/course-days'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { WakeUpIntake } from './WakeUpIntake'

type PracticeKind = 'wake_up' | 'clean_up'
type Screen = 'entry' | 'orientation' | 'notice' | 'counterpart' | 'three' | 'two' | 'one' | 'draw' | 'receipt'

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

  const back = () => setScreen((current) => ({ orientation: 'entry', notice: 'orientation', draw: 'notice', counterpart: 'draw', three: 'counterpart', two: 'three', one: 'two', receipt: 'one', entry: 'entry' })[current] as Screen)
  const restart = () => { setNotice(null); setCounterpart(null); setThree(''); setTwo(''); setOne(''); setSelectedCard(null); setDraw(drawThree(practices)); setScreen('entry') }

  return <main className="min-h-screen bg-[#0b0910] px-4 py-7 text-[#ded7e4] sm:px-6 sm:py-10" style={{ fontFamily: 'var(--bars-font-body)' }}>
    <div className="mx-auto max-w-2xl">
      <header className="mb-9 flex items-center justify-between border-b border-white/10 pb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7aabf]" style={{ fontFamily: 'var(--bars-font-mono)' }}><span>Mastering the Game of Allyship</span><span>{copy.day}</span></header>
      <section className="overflow-hidden rounded-[28px] border border-[#513d58] bg-[radial-gradient(110%_95%_at_50%_-10%,#321e40,#17111d_62%,#100d14)] p-6 shadow-2xl shadow-black/40 sm:p-10">
        {screen === 'entry' ? <><Heading eyebrow={copy.eyebrow} title={copy.title}>{copy.intro}</Heading><button type="button" onClick={() => setScreen('orientation')} className="mt-8 w-full rounded-2xl bg-gradient-to-r from-[#ff73b1] to-[#e7a851] px-5 py-4 text-left font-bold text-[#1b1018]">Learn the practice, then begin →</button><p className="mt-4 text-center text-xs text-[#a99daa]">Your answers stay on this page. They are not saved or sent anywhere.</p></> : null}
        {screen === 'orientation' ? <ThreeTwoOneOrientation onBack={back} onNext={() => setScreen('notice')} /> : null}
        {screen === 'notice' ? <><Back onClick={back} /><Heading eyebrow="Notice" title={copy.noticeTitle}>{copy.notice}</Heading><div className="mt-6 grid gap-2">{copy.choices.map((choice) => <button type="button" key={choice} onClick={() => setNotice(choice)} className={'rounded-2xl border p-4 text-left text-sm ' + (notice === choice ? 'border-[#ff9fca] bg-[#3c2036] text-white' : 'border-white/15 bg-black/10 text-[#e6dae6]')}>{choice}</button>)}</div><button type="button" onClick={() => setScreen('draw')} className="mt-6 w-full rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Draw a Clean Up card →</button></> : null}
        {screen === 'counterpart' ? <><Back onClick={back} /><Heading eyebrow="A campaign adaptation of 3-2-1" title="Find the part of you that does not believe this is the whole story.">The belief may be loud. It is not the only voice you have. Choose a part with some actual evidence that you can read, recommend, or practice without becoming a different person first.</Heading><div className="mt-6 grid gap-2">{['The part that has put something meaningful in a friend’s hands before', 'The part that knows what I would tell a friend carrying this belief', 'The part that has acted before certainty arrived', 'The part that can name one honest sentence about the book', 'Another part is here'].map((choice) => <button type="button" key={choice} onClick={() => setCounterpart(choice)} className={'rounded-2xl border p-4 text-left text-sm ' + (counterpart === choice ? 'border-[#ff9fca] bg-[#3c2036] text-white' : 'border-white/15 bg-black/10 text-[#e6dae6]')}>{choice}</button>)}</div><button type="button" onClick={() => setScreen('three')} className="mt-6 w-full rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Begin 3-2-1 →</button></> : null}
        {screen === 'three' ? <ThreeTwoOneStep number="3" pronoun="They" title="Face this part." body="Describe the part you chose as if you were describing someone in the next room. What do they notice? What do they know about the belief you named?" value={three} onChange={setThree} onBack={back} onNext={() => setScreen('two')} /> : null}
        {screen === 'two' ? <ThreeTwoOneStep number="2" pronoun="You" title="Talk to this part." body="Address it directly. Ask: What do you want for me? What are you protecting? What would you have me do about reading, sharing, or practicing allyship?" value={two} onChange={setTwo} onBack={back} onNext={() => setScreen('one')} /> : null}
        {screen === 'one' ? <ThreeTwoOneStep number="1" pronoun="I" title="Let it speak in your voice." body="Write from this part in the first person. Do not make a grand promise. Let it name one small thing it knows is possible." value={one} onChange={setOne} onBack={back} onNext={() => setScreen('receipt')} /> : null}
        {screen === 'draw' ? <><Back onClick={back} /><Heading eyebrow="A practice from the Allyship Deck" title={copy.drawTitle}>{copy.draw} Let the card set the missing-move lens before you work the 3-2-1.</Heading><div className="mt-6 grid gap-4 sm:grid-cols-3">{draw.map((card) => <div key={card.id} className={selectedCard?.id === card.id ? 'rounded-xl outline outline-2 outline-[#ff9fca] outline-offset-4' : ''}><AllyshipCard card={card} variant="grid" onClick={() => setExpandedCard(card)} /></div>)}</div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => { setDraw(drawThree(practices)); setSelectedCard(null) }} className="rounded-2xl border border-white/15 px-5 py-4 font-bold text-[#f1dce8]">Draw three more</button><button type="button" onClick={() => setScreen('counterpart')} className="rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">{selectedCard ? 'Use this lens for 3-2-1 →' : 'Skip the draw and continue →'}</button></div></> : null}
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

function ThreeTwoOneOrientation({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return <><Back onClick={onBack} /><Heading eyebrow="Before you use it" title="3-2-1 is a way to get your energy back.">When a person, a figure, or a part of you is carrying a lot of charge, 3-2-1 gives you three vantage points. You first see the figure clearly, then speak with it, then let it speak in your own voice. What had been consuming energy from the outside can become available for the work.</Heading><div className="mt-6 space-y-3"><div className="rounded-2xl border border-[#765b70] bg-black/15 p-4"><strong className="text-white">3 — They: Face it.</strong><p className="mt-1 text-sm leading-6 text-[#c9bdcd]">Describe the charged figure or part in the third person. You are looking at the pattern your nervous system has built, not issuing a verdict about reality.</p></div><div className="rounded-2xl border border-[#765b70] bg-black/15 p-4"><strong className="text-white">2 — You: Talk to it.</strong><p className="mt-1 text-sm leading-6 text-[#c9bdcd]">Address it directly. Ask what it wants, needs, fears, or protects. Let the answer have its own logic.</p></div><div className="rounded-2xl border border-[#765b70] bg-black/15 p-4"><strong className="text-white">1 — I: Own it.</strong><p className="mt-1 text-sm leading-6 text-[#c9bdcd]">Speak as the part. This is where you reclaim the capacity or energy you have split off.</p></div></div><div className="mt-6 rounded-2xl border border-[#ff9fca]/50 bg-[#3c2036]/60 p-4 text-sm leading-6 text-[#eadce8]"><strong className="text-white">Why it belongs in allyship:</strong> charge that stays outside us can become blame, shutdown, or performance. 3-2-1 brings our side of the split into contact, so the energy can support a cleaner next move. It does not erase real harm or accountability.</div><div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm leading-6 text-[#c9bdcd]"><strong className="text-[#f1e7f3]">This course’s lineage:</strong> the original 2020 Mastering the Game of Allyship course was built around repeated 3-2-1 practice. Of 175 paying students, 80% reached the penultimate chapter—meaning they completed at least 20 rounds of the practice. This Day 3 version is a small campaign adaptation: you will work with the part of you that is not wholly convinced by a self-sabotaging belief.</div><button type="button" onClick={onNext} className="mt-6 w-full rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Use 3-2-1 to work the reservation →</button></>
}

function ThreeTwoOneStep({ number, pronoun, title, body, value, onChange, onBack, onNext }: { number: '3' | '2' | '1'; pronoun: 'They' | 'You' | 'I'; title: string; body: string; value: string; onChange: (value: string) => void; onBack: () => void; onNext: () => void }) {
  return <><Back onClick={onBack} /><Heading eyebrow={`3-2-1 · ${number} · ${pronoun}`} title={title}>{body}</Heading><label className="mt-6 block"><span className="text-sm font-bold text-[#f1e7f3]">Begin with “{pronoun}…”</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={7} placeholder={`${pronoun}…`} className="mt-2 w-full rounded-2xl border border-[#765b70] bg-black/20 p-4 text-sm leading-6 text-[#eee3f0] outline-none focus:border-[#ff9fca]" /><span className="mt-2 block text-xs text-[#a99daa]">Private to this page. It is not saved or sent to us.</span></label><button type="button" onClick={onNext} className="mt-6 w-full rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Continue →</button></>
}

function CardModal({ card, onClose, onChoose }: { card: MoveCard; onClose: () => void; onChoose: () => void }) {
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [onClose])
  return <div role="dialog" aria-modal="true" aria-label={card.title} className="fixed inset-0 z-50 flex items-end bg-black/80 p-3 backdrop-blur-sm sm:items-center sm:p-8" onMouseDown={onClose}><div className="mx-auto flex max-h-[96dvh] w-full max-w-lg flex-col rounded-t-[28px] bg-[#120d17] p-4 shadow-2xl sm:rounded-[28px]" onMouseDown={(event) => event.stopPropagation()}><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#c9bdcd]" style={{ fontFamily: 'var(--bars-font-mono)' }}>Drawn card</span><button type="button" onClick={onClose} className="rounded-full border border-white/15 px-3 py-1 text-sm text-[#f2e6f0]">Close</button></div><div className="min-h-0 overflow-y-auto px-1 pb-2"><AllyshipCard card={card} variant="full" /></div><button type="button" onClick={onChoose} className="mt-4 shrink-0 rounded-2xl bg-[#f3e5ed] px-5 py-4 font-bold text-[#251525]">Choose this card →</button></div></div>
}
