'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { CardDrawRow, CardDrawSheet } from '@/components/deck/CardDraw'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { nextCourseDay } from '@/lib/mtgoa-course/course-days'
import {
  DAY_TWELVE_HANDS,
  DAY_TWELVE_PRIVACY,
  DAY_TWELVE_WEATHER,
  dayTwelveHand,
  dayTwelveReceiptLines,
  dayTwelveSentence,
} from '@/lib/mtgoa-course/day-twelve'
import type { DayTwelveHand } from '@/lib/mtgoa-course/day-twelve'
import { markCourseDayComplete } from '@/lib/mtgoa-course/mark-day-complete'
import { roundThreeDay } from '@/lib/mtgoa-course/round-three'
import {
  BackLink,
  CheckShell,
  DeckRibbon,
  NextDayHandoff,
  OutlineButton,
  PrimaryButton,
  PrivacyLine,
  PrivateField,
  ReceiptRow,
  SelectRow,
  Step,
  StepBody,
  StepEyebrow,
  StepFooter,
  StepTitle,
  TextButton,
} from './CheckKit'

/**
 * Day 12 — Open Up · Hold the Resource Question.
 *
 * This is not an asking flow. A reader first confirms they have a concrete
 * resource question; otherwise Day 11's ledger is the accurate route. The
 * remaining screens turn one private label into a plain sentence, receive its
 * first response, hold it for a visible minute, and offer an OPEN-GR card lens.
 * Inputs are component state only and disappear on refresh.
 */

type Screen = 'entry' | 'hand' | 'sentence' | 'weather' | 'draw' | 'receipt'

const ORDER: Screen[] = ['entry', 'hand', 'sentence', 'weather', 'draw', 'receipt']
const DAY = 12
const ACCENT = { base: 'var(--bars-liminal)', lift: 'var(--bars-liminal-glow)' }

function deal(cards: MoveCard[], count: number): MoveCard[] {
  const pool = [...cards]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

function clock(seconds: number): string {
  return `0:${String(Math.max(0, seconds)).padStart(2, '0')}`
}

export function DayTwelveResourceQuestion({ cards }: { cards: MoveCard[] }) {
  const day = roundThreeDay(DAY)
  const [screen, setScreen] = useState<Screen>('entry')
  const [ownLife, setOwnLife] = useState(false)
  const [handKey, setHandKey] = useState<DayTwelveHand | null>(null)
  const [label, setLabel] = useState('')
  const [firstBlank, setFirstBlank] = useState('')
  const [secondBlank, setSecondBlank] = useState('')
  const [weather, setWeather] = useState<string[]>([])
  const [seconds, setSeconds] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [drawn, setDrawn] = useState<MoveCard[]>(() => deal(cards, 3))
  const [open, setOpen] = useState<MoveCard | null>(null)
  const [carriedId, setCarriedId] = useState<string | null>(null)

  const hand = dayTwelveHand(handKey)
  const carried = useMemo(() => drawn.find((card) => card.id === carriedId) ?? null, [drawn, carriedId])
  const receipt = useMemo(() => dayTwelveReceiptLines({ hand: handKey, label, weather }), [handKey, label, weather])

  useEffect(() => {
    if (!timerRunning) return undefined
    const interval = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false)
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [timerRunning])

  useEffect(() => {
    if (screen === 'receipt') markCourseDayComplete(DAY)
  }, [screen])

  const toggleWeather = (item: string) => {
    setWeather((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])
  }

  const startTimer = () => {
    if (seconds === 0) setSeconds(60)
    setTimerRunning(true)
  }

  const resetTimer = () => {
    setTimerRunning(false)
    setSeconds(60)
  }

  const resetDraw = () => {
    setDrawn(deal(cards, 3))
    setCarriedId(null)
  }

  return (
    <CheckShell
      label="Week 3 · Gather Resources · Day 12 of 30"
      moveTag="open up · 間"
      accent={ACCENT}
      steps={ORDER.length}
      index={ORDER.indexOf(screen)}
    >
      {screen === 'entry' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>day 12 · open up</StepEyebrow>
          <StepTitle size={30}>Hold the Resource Question</StepTitle>
          <StepBody>{day?.entry}</StepBody>
          <StepBody top={14}>Can you stay with it for one minute? You are here to let the question have a body before deciding whether anything should move.</StepBody>
          <div style={{ marginTop: 24, padding: '16px 17px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: '2px solid var(--bars-liminal)' }}>
            <span className="bars-label" style={{ color: ACCENT.lift }}>the contract</span>
            <p className="bars-prose" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
              A possible resource is not a promise. Stay with the question before you decide what, if anything, you want to move.
            </p>
          </div>
          <StepEyebrow color="var(--bars-text-muted)">first · do you have one to sit with?</StepEyebrow>
          <StepBody top={8}>Do you already have one resource, offer, permission question, or need you want to sit with?</StepBody>
          <div style={{ marginTop: 16 }}>
            <PrimaryButton block glow onClick={() => setScreen('hand')}>Yes, I have one →</PrimaryButton>
          </div>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            <Link href="/mastering-allyship/course/3/wake-up" style={{ display: 'block', padding: '15px 16px', border: '1px solid var(--bars-line-strong)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none' }}>
              <span className="bars-prose" style={{ display: 'block', fontSize: 15, lineHeight: 1.45 }}>I am not sure what resource I have to work with →</span>
              <span className="bars-label" style={{ display: 'block', marginTop: 5, color: 'var(--bars-text-muted)' }}>start with Day 11’s Resource Ledger</span>
            </Link>
            <Link href="/open-up" style={{ display: 'block', padding: '15px 16px', border: '1px solid var(--bars-line)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none' }}>
              <span className="bars-prose" style={{ display: 'block', fontSize: 15, lineHeight: 1.45 }}>My question is about sharing the book with someone →</span>
              <span className="bars-label" style={{ display: 'block', marginTop: 5, color: 'var(--bars-text-muted)' }}>use Week 1’s Open Up practice</span>
            </Link>
            <Link href="/mastering-allyship/course/2/open-up" style={{ display: 'block', padding: '15px 16px', border: '1px solid var(--bars-line)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none' }}>
              <span className="bars-prose" style={{ display: 'block', fontSize: 15, lineHeight: 1.45 }}>My question is about joining or carrying organization work →</span>
              <span className="bars-label" style={{ display: 'block', marginTop: 5, color: 'var(--bars-text-muted)' }}>use Week 2’s Organization Load Check</span>
            </Link>
            <OutlineButton block onClick={() => { setOwnLife(true); setScreen('hand') }}>Use this in my own allyship life →</OutlineButton>
          </div>
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <a href="https://wendellbritt.gumroad.com/l/MTGOAbook" style={{ color: 'var(--bars-liminal)', fontSize: 15 }}>Haven’t bought the book yet? Read the book →</a>
          </div>
          <PrivacyLine>{DAY_TWELVE_PRIVACY}</PrivacyLine>
        </Step>
      ) : null}

      {screen === 'hand' ? (
        <Step>
          <BackLink onClick={() => setScreen('entry')} />
          <StepEyebrow color={ACCENT.lift}>1 · choose one resource question</StepEyebrow>
          <StepTitle>Which hand are you holding?</StepTitle>
          <StepBody>{ownLife ? 'Choose the kind of resource question that is alive in your own allyship life.' : 'Choose the kind of resource question you want to hold for one minute.'}</StepBody>
          <div style={{ display: 'grid', gap: 9, marginTop: 22 }}>
            {DAY_TWELVE_HANDS.map((candidate) => (
              <SelectRow key={candidate.key} selected={handKey === candidate.key} onClick={() => setHandKey(candidate.key)}>
                <span className="bars-label" style={{ color: ACCENT.lift }}>{candidate.key === 'offer' ? '01' : candidate.key === 'ask_first' ? '02' : '03'}</span>
                <span className="bars-prose" style={{ display: 'block', marginTop: 6, fontSize: 17, color: 'var(--bars-text-primary)' }}>{candidate.label}</span>
                <span className="bars-prose" style={{ display: 'block', marginTop: 6, fontSize: 15, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>{candidate.prompt}</span>
              </SelectRow>
            ))}
          </div>
          {hand ? <PrivateField id="day12-label" label="a short private label" value={label} onChange={setLabel} placeholder={hand.labelPlaceholder} rows={2} /> : null}
          {hand ? <StepFooter back={() => setScreen('entry')} next={{ label: 'Make the sentence →', onClick: () => setScreen('sentence') }} /> : null}
        </Step>
      ) : null}

      {screen === 'sentence' && hand ? (
        <Step>
          <BackLink onClick={() => setScreen('hand')} />
          <StepEyebrow color={ACCENT.lift}>2 · the plain sentence</StepEyebrow>
          <StepTitle>Say it plainly, internally.</StepTitle>
          <StepBody>Read the sentence once, slowly. Do not make it more persuasive, reassuring, or complete. Fill the blanks or leave the frame generic.</StepBody>
          <div style={{ marginTop: 22, padding: '18px 17px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', border: '1px solid var(--bars-liminal)' }}>
            <p className="bars-prose" style={{ margin: 0, fontSize: 18, lineHeight: 1.65, color: 'var(--bars-text-primary)' }}>{dayTwelveSentence(handKey, firstBlank, secondBlank)}</p>
          </div>
          <PrivateField id="day12-first-blank" label={hand.firstBlank} value={firstBlank} onChange={setFirstBlank} placeholder={hand.firstBlank} rows={1} />
          <PrivateField id="day12-second-blank" label={hand.secondBlank} value={secondBlank} onChange={setSecondBlank} placeholder={hand.secondBlank} rows={1} />
          <div style={{ marginTop: 18, padding: '14px 15px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: '2px solid var(--bars-gold)' }}>
            <span className="bars-label" style={{ color: 'var(--bars-gold)' }}>why this is not Day 11</span>
            <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>Day 11 built a field map. Day 12 holds one plain sentence long enough to notice what happens when it becomes real.</p>
          </div>
          <StepFooter back={() => setScreen('hand')} next={{ label: 'I read it once →', onClick: () => setScreen('weather') }} />
        </Step>
      ) : null}

      {screen === 'weather' ? (
        <Step>
          <BackLink onClick={() => setScreen('sentence')} />
          <StepEyebrow color={ACCENT.lift}>3 · ask weather</StepEyebrow>
          <StepTitle>What shifts first when you sit with that sentence?</StepTitle>
          <StepBody>Choose any, or skip. No explanation is asked for, and nothing here is a diagnosis of you.</StepBody>
          <div style={{ display: 'grid', gap: 8, marginTop: 22 }}>
            {DAY_TWELVE_WEATHER.map((item) => <SelectRow key={item} selected={weather.includes(item)} onClick={() => toggleWeather(item)}><span className="bars-prose" style={{ fontSize: 15, color: 'var(--bars-text-primary)' }}>{item}</span></SelectRow>)}
          </div>
          <div style={{ marginTop: 26, padding: '24px 20px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', border: '1px solid var(--bars-line)', textAlign: 'center', boxShadow: 'var(--bars-shadow-inset-top)' }}>
            <span className="bars-label" style={{ color: ACCENT.lift }}>stay with it</span>
            <p className="bars-prose" style={{ margin: '9px auto 0', maxWidth: 420, fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>For one minute, let the answer be incomplete. Feel the resource question without solving the relationship, the campaign, or yourself.</p>
            <div aria-live="polite" style={{ marginTop: 20, fontFamily: 'var(--bars-font-mono)', fontSize: 60, lineHeight: 1, letterSpacing: '.02em', color: seconds === 0 ? 'var(--bars-gold)' : 'var(--bars-liminal-glow)', fontVariantNumeric: 'tabular-nums' }}>{clock(seconds)}</div>
            <p className="bars-prose" style={{ margin: '10px 0 0', fontSize: 15, color: 'var(--bars-text-secondary)' }}>{seconds === 0 ? 'What is here now?' : timerRunning ? 'Stay with the question.' : 'Start when you are ready.'}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              {!timerRunning && seconds > 0 ? <PrimaryButton compact onClick={startTimer}>start 1 minute</PrimaryButton> : null}
              {timerRunning ? <OutlineButton onClick={() => setTimerRunning(false)}>pause</OutlineButton> : null}
              <OutlineButton onClick={resetTimer}>restart</OutlineButton>
              <TextButton onClick={() => { setTimerRunning(false); setScreen('draw') }}>skip the timer</TextButton>
            </div>
          </div>
          <StepFooter back={() => setScreen('sentence')} next={{ label: 'Draw a card lens →', onClick: () => setScreen('draw') }} />
        </Step>
      ) : null}

      {screen === 'draw' ? (
        <Step>
          <BackLink onClick={() => setScreen('weather')} />
          <DeckRibbon>the allyship deck · open up · gather resources</DeckRibbon>
          <StepTitle>{day?.drawTitle}</StepTitle>
          <StepBody>{day?.drawBody}</StepBody>
          <StepBody top={12}>A card gives you a way to stay closer to the resource question. It does not tell you what you owe, whether the ask is good, or what another person will say.</StepBody>
          <div style={{ marginTop: 20 }}><CardDrawRow cards={drawn} carriedId={carriedId} onOpen={setOpen} accent={ACCENT.lift} /></div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <TextButton onClick={resetDraw}>deal again</TextButton>
            <TextButton onClick={() => setCarriedId(null)}>continue without a card</TextButton>
          </div>
          <StepFooter back={() => setScreen('weather')} next={{ label: 'See my receipt →', onClick: () => setScreen('receipt') }} />
        </Step>
      ) : null}

      {screen === 'receipt' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>the question is still allowed to be alive</StepEyebrow>
          <StepTitle size={28}>You held one real resource question.</StepTitle>
          <StepBody>A ledger can show what is in reach. A resource still has to pass through the experience of becoming a real offer, ask, or need. That part happened here.</StepBody>
          <div style={{ marginTop: 22, padding: '17px 18px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', border: '1px solid var(--bars-line)' }}>
            <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>private receipt · this browser only</span>
            <ReceiptRow label="The resource question is" value={receipt.question} />
            <ReceiptRow label="When I let it become real, I noticed" value={receipt.noticed} />
            <p className="bars-prose" style={{ margin: '16px 0 0', fontSize: 16, lineHeight: 1.55, color: 'var(--bars-text-primary)' }}>I do not have to settle it before I choose the next accurate move.</p>
          </div>
          {carried ? <div style={{ marginTop: 18, padding: '13px 14px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', border: '1px solid var(--bars-line)' }}><span className="bars-label" style={{ color: ACCENT.lift }}>card carried</span><p className="bars-prose" style={{ margin: '6px 0 0', fontSize: 16, color: 'var(--bars-text-primary)' }}>{carried.title}</p><p className="bars-prose" style={{ margin: '5px 0 0', fontSize: 15, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>{day?.cardPrompts[carried.id] ?? carried.primaryQuestion}</p></div> : null}
          <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
            <Link href="/mastering-allyship/course/3/wake-up" style={{ display: 'block', padding: '14px 15px', border: '1px solid var(--bars-line-strong)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none', textAlign: 'center' }}>Return to Day 11: Resource Ledger →</Link>
            <Link href="/organization" style={{ display: 'block', padding: '14px 15px', border: '1px solid var(--bars-line-strong)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none', textAlign: 'center' }}>See current campaign needs →</Link>
            <Link href="/deck/sales" style={{ display: 'block', padding: '14px 15px', border: '1px solid var(--bars-line)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none', textAlign: 'center' }}>Explore the Allyship Deck →</Link>
            <a href="https://wendellbritt.gumroad.com/l/MTGOAbook" style={{ display: 'block', padding: '14px 15px', border: '1px solid var(--bars-line)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none', textAlign: 'center' }}>Haven’t bought the book yet? Read the book →</a>
          </div>
          <NextDayHandoff handoff={nextCourseDay(DAY)} accent={ACCENT.lift} />
          <PrivacyLine>{DAY_TWELVE_PRIVACY}</PrivacyLine>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}><BackLink onClick={() => setScreen('draw')} /></div>
        </Step>
      ) : null}

      {open ? <CardDrawSheet card={open} carried={carriedId === open.id} onClose={() => setOpen(null)} onChoose={() => { setCarriedId((current) => current === open.id ? null : open.id); setOpen(null) }} accent={ACCENT.lift} accentText="#1a0a00" /> : null}
    </CheckShell>
  )
}
