'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { CardDrawRow, CardDrawSheet } from '@/components/deck/CardDraw'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { nextCourseDay } from '@/lib/mtgoa-course/course-days'
import {
  DAY_FOURTEEN_CAPACITIES,
  DAY_FOURTEEN_OPEN_STARTER,
  DAY_FOURTEEN_RECEIPT,
  dayFourteenCapacityLine,
  dayFourteenReceiptRows,
  dayFourteenRep,
} from '@/lib/mtgoa-course/day-fourteen'
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
  SelectRow,
  Step,
  StepBody,
  StepEyebrow,
  StepFooter,
  StepTitle,
  TextButton,
} from './CheckKit'

/**
 * Day 14 — Grow Up · The Resourcing Rep.
 *
 * Day 13 named the move you keep skipping around resources. Day 14 does not try to
 * fix all of it: Grow Up asks which capacity you are willing to practise, so the
 * reader picks one resourcing capacity, draws a GROW-GR lens, names one rep — one
 * notch bigger than today — and the signal that will tell them it grew. Nothing is
 * scheduled for them and nothing is a commitment to the campaign.
 *
 * Deliberately light and session-only, like Days 11 and 12: a rep is one small
 * repetition, not a 3-2-1. Inputs live in component state and clear on refresh.
 *
 * Colour is Grow Up's element, wood — the same green Days 4 and 9 run (the UI
 * covenant is element=color). Purple stays the primary-action colour; wood carries
 * the chrome, the eyebrows and the card frames. The reader-facing copy comes from
 * the Day 14 row in `round-three.ts`, read here rather than duplicated.
 *
 * @see .specify/specs/mtgoa-day14-resourcing-rep/design_handoff/
 */

type Screen = 'entry' | 'draw' | 'capacity' | 'rep' | 'receipt'

const ORDER: Screen[] = ['entry', 'draw', 'capacity', 'rep', 'receipt']
const DAY = 14
/** Grow Up is wood, the same wood Days 4 and 9 use. */
const ACCENT = { base: 'var(--bars-wood-glow)', lift: '#3ec97a' }
const BOOK_HREF = 'https://wendellbritt.gumroad.com/l/MTGOAbook'

function deal(cards: MoveCard[], count: number): MoveCard[] {
  const pool = [...cards]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

export function DayFourteenResourcingRep({ cards }: { cards: MoveCard[] }) {
  const day = roundThreeDay(DAY)
  const [screen, setScreen] = useState<Screen>('entry')
  const [ownLife, setOwnLife] = useState(false)
  const [starter, setStarter] = useState<string | null>(null)
  const [capacityText, setCapacityText] = useState('')
  const [repText, setRepText] = useState('')
  const [knowText, setKnowText] = useState('')
  const [drawn, setDrawn] = useState<MoveCard[]>(() => deal(cards, 3))
  const [open, setOpen] = useState<MoveCard | null>(null)
  const [carriedId, setCarriedId] = useState<string | null>(null)

  const capacity = dayFourteenCapacityLine(starter, capacityText)
  const rep = dayFourteenRep(repText, knowText)
  const carried = useMemo(() => drawn.find((card) => card.id === carriedId) ?? null, [drawn, carriedId])
  const rows = useMemo(() => dayFourteenReceiptRows({ capacity, rep: repText, know: knowText }), [capacity, repText, knowText])

  useEffect(() => {
    if (screen === 'receipt') markCourseDayComplete(DAY)
  }, [screen])

  const go = (next: Screen) => { setScreen(next); window.scrollTo(0, 0) }
  const resetDraw = () => { setDrawn(deal(cards, 3)); setCarriedId(null) }
  const lens = (card: MoveCard) => day?.cardPrompts[card.id] ?? card.primaryQuestion

  return (
    <CheckShell
      label="Week 3 · Gather Resources · Day 14 of 30"
      moveTag="grow up · 木"
      accent={ACCENT}
      steps={ORDER.length}
      index={ORDER.indexOf(screen)}
    >
      {screen === 'entry' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>day 14 · grow up</StepEyebrow>
          <StepTitle size={30}>{day?.title}</StepTitle>
          <StepBody>{day?.entry}</StepBody>
          <div style={{ marginTop: 24, padding: '16px 17px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: `2px solid ${ACCENT.base}` }}>
            <span className="bars-label" style={{ color: ACCENT.lift }}>the contract</span>
            <p className="bars-prose" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
              One notch bigger than today, not a transformation. Nothing is scheduled for you, and nothing here is a promise to the campaign.
            </p>
          </div>
          <div style={{ marginTop: 22 }}>
            <PrimaryButton block glow onClick={() => go('draw')}>Grow one capacity →</PrimaryButton>
          </div>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            <Link href="/mastering-allyship/course/3/clean-up" style={{ display: 'block', padding: '15px 16px', border: '1px solid var(--bars-line-strong)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none' }}>
              <span className="bars-prose" style={{ display: 'block', fontSize: 15, lineHeight: 1.45 }}>I have not worked the charge around this yet →</span>
              <span className="bars-label" style={{ display: 'block', marginTop: 5, color: 'var(--bars-text-muted)' }}>start with Day 13’s Resourcing 3-2-1</span>
            </Link>
            <OutlineButton block strong onClick={() => { setOwnLife(true); go('draw') }}>Use this on resourcing in my own life →</OutlineButton>
          </div>
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <a href={BOOK_HREF} style={{ color: ACCENT.lift, fontSize: 15 }}>Haven’t read the book yet? Read the book →</a>
          </div>
          <PrivacyLine>Private by default · nothing you write is sent or saved as a course answer</PrivacyLine>
        </Step>
      ) : null}

      {screen === 'draw' ? (
        <Step>
          <BackLink onClick={() => go('entry')} />
          <DeckRibbon>the allyship deck · grow up · gather resources</DeckRibbon>
          <StepTitle>{day?.drawTitle}</StepTitle>
          <StepBody>{day?.drawBody}</StepBody>
          <StepBody top={12}>A card names a growth edge. It does not tell you how big the rep should be, or that you owe anyone the practice.</StepBody>
          <div style={{ marginTop: 20 }}><CardDrawRow cards={drawn} carriedId={carriedId} onOpen={setOpen} accent={ACCENT.lift} /></div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <TextButton onClick={resetDraw}>deal again</TextButton>
            <TextButton onClick={() => setCarriedId(null)}>continue without a card</TextButton>
          </div>
          <StepFooter back={() => go('entry')} next={{ label: 'Choose the capacity →', onClick: () => go('capacity') }} />
        </Step>
      ) : null}

      {screen === 'capacity' ? (
        <Step>
          <BackLink onClick={() => go('draw')} />
          <StepEyebrow color={ACCENT.lift}>1 · the capacity</StepEyebrow>
          <StepTitle>{ownLife ? 'Which capacity in your own life is trying to grow?' : 'Which resourcing capacity is trying to grow?'}</StepTitle>
          <StepBody>Pick the one already emerging, not the one you wish for. Use a starter, write your own, or skip it.</StepBody>
          <div style={{ display: 'grid', gap: 9, marginTop: 20 }}>
            {DAY_FOURTEEN_CAPACITIES.map((label) => (
              <SelectRow key={label} selected={starter === label} onClick={() => setStarter(starter === label ? null : label)}>
                <span className="bars-prose" style={{ fontSize: 16, lineHeight: 1.45, color: 'var(--bars-text-primary)' }}>{label}</span>
              </SelectRow>
            ))}
          </div>
          <PrivateField id="day14-capacity" label="in your own words" value={capacityText} onChange={setCapacityText} placeholder="The capacity, in your own words. Optional." rows={2} />
          {starter === DAY_FOURTEEN_OPEN_STARTER && !capacityText.trim() ? (
            <p style={{ margin: '9px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)' }}>Your own words go in the box above. Leaving it empty is also a full answer.</p>
          ) : null}
          {carried ? (
            <div style={{ marginTop: 18, padding: '13px 14px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', boxShadow: `0 0 0 1px ${ACCENT.base}` }}>
              <span className="bars-label" style={{ color: ACCENT.lift }}>◇ your lens · {carried.title}</span>
              <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>{lens(carried)}</p>
            </div>
          ) : null}
          <StepFooter back={() => go('draw')} next={{ label: 'Name the rep →', onClick: () => go('rep') }} />
        </Step>
      ) : null}

      {screen === 'rep' ? (
        <Step>
          <BackLink onClick={() => go('capacity')} />
          <StepEyebrow color={ACCENT.lift}>2 · the rep</StepEyebrow>
          <StepTitle>One rep, one notch bigger than today.</StepTitle>
          <StepBody>Small enough to do this week, and one notch past comfortable. Name the rep, and the signal that will tell you it grew.</StepBody>
          {day?.doNot ? (
            <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)' }}>
              Not <span style={{ color: 'var(--bars-text-secondary)' }}>{day.doNot.charAt(0).toLowerCase() + day.doNot.slice(1)}</span> One rep is the whole ask.
            </p>
          ) : null}
          <div style={{ marginTop: 20, padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: `var(--bars-shadow-inset-top), 0 0 0 1px ${ACCENT.base}` }}>
            <p className="bars-prose" style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--bars-text-primary)' }}>{rep}</p>
          </div>
          <PrivateField id="day14-rep" label={DAY_FOURTEEN_RECEIPT.opening} value={repText} onChange={setRepText} placeholder={DAY_FOURTEEN_RECEIPT.repPlaceholder} rows={2} />
          <PrivateField id="day14-know" label={DAY_FOURTEEN_RECEIPT.turn} value={knowText} onChange={setKnowText} placeholder={DAY_FOURTEEN_RECEIPT.knowPlaceholder} rows={2} />
          <StepFooter back={() => go('capacity')} next={{ label: 'See my receipt →', onClick: () => go('receipt') }} />
        </Step>
      ) : null}

      {screen === 'receipt' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>your Day 14 receipt</StepEyebrow>
          <StepTitle size={28}>{DAY_FOURTEEN_RECEIPT.headline}</StepTitle>
          <div style={{ marginTop: 18, padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: `var(--bars-shadow-inset-top), 0 0 0 1px ${ACCENT.base}` }}>
            <p className="bars-prose" style={{ margin: 0, fontSize: 17, lineHeight: 1.58, color: 'var(--bars-text-primary)' }}>{rep}</p>
          </div>
          <div style={{ marginTop: 16, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', padding: '6px 18px 16px' }}>
            {rows.map((row) => (
              <div key={row.label} style={{ padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>{row.label}</span>
                <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15.5, lineHeight: 1.5, color: row.filled ? 'var(--bars-text-primary)' : 'var(--bars-text-muted)' }}>{row.value}</p>
              </div>
            ))}
            {carried ? (
              <p className="bars-label" style={{ margin: '13px 0 0', color: ACCENT.lift }}>◇ looked through {carried.title} · #{carried.num}</p>
            ) : null}
          </div>
          <p className="bars-prose" style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>A capacity grows one rep at a time. This one is enough for today.</p>
          <NextDayHandoff handoff={nextCourseDay(DAY)} accent={ACCENT.lift} />
          <span className="bars-label" style={{ display: 'block', margin: '28px 0 12px', color: 'var(--bars-text-muted)' }}>only if it fits</span>
          <div style={{ display: 'grid', gap: 10 }}>
            <Link href="/mastering-allyship/course/3/clean-up" style={{ display: 'block', padding: '14px 15px', border: '1px solid var(--bars-line-strong)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none', textAlign: 'center' }}>Return to Day 13: the Resourcing 3-2-1 →</Link>
            <Link href="/organization" style={{ display: 'block', padding: '14px 15px', border: '1px solid var(--bars-line-strong)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none', textAlign: 'center' }}>See what work is actually live →</Link>
            <a href={BOOK_HREF} style={{ display: 'block', padding: '14px 15px', border: '1px solid var(--bars-line)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none', textAlign: 'center' }}>Read the book →</a>
          </div>
          <PrivacyLine>Private by default · nothing you write is sent or saved as a course answer</PrivacyLine>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}><BackLink onClick={() => go('rep')} /></div>
        </Step>
      ) : null}

      {open ? <CardDrawSheet card={open} carried={carriedId === open.id} onClose={() => setOpen(null)} onChoose={() => { setCarriedId((current) => current === open.id ? null : open.id); setOpen(null) }} accent={ACCENT.lift} accentText="#011309" /> : null}
    </CheckShell>
  )
}
