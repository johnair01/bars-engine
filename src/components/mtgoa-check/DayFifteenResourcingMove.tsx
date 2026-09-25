'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { CardDrawRow, CardDrawSheet } from '@/components/deck/CardDraw'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { nextCourseDay } from '@/lib/mtgoa-course/course-days'
import {
  DAY_FIFTEEN_CONSENT,
  DAY_FIFTEEN_RECEIPT,
  DAY_FIFTEEN_SHAPES,
  dayFifteenMessage,
  dayFifteenReceiptRows,
  dayFifteenShape,
} from '@/lib/mtgoa-course/day-fifteen'
import type { DayFifteenShape } from '@/lib/mtgoa-course/day-fifteen'
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
 * Day 15 — Show Up · The Resourcing Move.
 *
 * The last day of Week 3. Days 11–14 counted, held, cleaned and grew; Day 15
 * turns it into one real move — a concrete offer or ask, to one specific person,
 * in words they can act on, with consent named and no strings. Show Up asks what
 * another person can actually act on, so the artifact is a message a reader could
 * send today, not a plan.
 *
 * Light and session-only, like Days 11, 12 and 14. Colour is Show Up's element,
 * fire — the same ember Days 5 and 10 run (the UI covenant is element=color).
 * Purple stays the primary action; fire carries the chrome, eyebrows and cards.
 * The reader-facing copy comes from the Day 15 row in `round-three.ts`.
 *
 * @see .specify/specs/mtgoa-day15-resourcing-move/design_handoff/
 */

type Screen = 'entry' | 'draw' | 'shape' | 'compose' | 'receipt'

const ORDER: Screen[] = ['entry', 'draw', 'shape', 'compose', 'receipt']
const DAY = 15
/** Show Up is fire, the same fire Days 5 and 10 use. */
const ACCENT = { base: 'var(--bars-fire-glow)', lift: '#f0813a' }
const BOOK_HREF = 'https://wendellbritt.gumroad.com/l/MTGOAbook'

function deal(cards: MoveCard[], count: number): MoveCard[] {
  const pool = [...cards]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

export function DayFifteenResourcingMove({ cards }: { cards: MoveCard[] }) {
  const day = roundThreeDay(DAY)
  const [screen, setScreen] = useState<Screen>('entry')
  const [ownLife, setOwnLife] = useState(false)
  const [shapeKey, setShapeKey] = useState<DayFifteenShape | null>(null)
  const [recipient, setRecipient] = useState('')
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [drawn, setDrawn] = useState<MoveCard[]>(() => deal(cards, 3))
  const [open, setOpen] = useState<MoveCard | null>(null)
  const [carriedId, setCarriedId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const shape = dayFifteenShape(shapeKey)
  const message = dayFifteenMessage(shapeKey, first, second)
  const carried = useMemo(() => drawn.find((card) => card.id === carriedId) ?? null, [drawn, carriedId])
  const rows = useMemo(() => dayFifteenReceiptRows({ shape: shapeKey, recipient, first, second }), [shapeKey, recipient, first, second])

  const go = (next: Screen) => {
    setScreen(next)
    if (next === 'receipt') markCourseDayComplete(DAY)
    window.scrollTo(0, 0)
  }
  const resetDraw = () => { setDrawn(deal(cards, 3)); setCarriedId(null) }
  const lens = (card: MoveCard) => day?.cardPrompts[card.id] ?? card.primaryQuestion
  const copy = () => {
    navigator.clipboard?.writeText(message)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <CheckShell
      label="Week 3 · Gather Resources · Day 15 of 30"
      moveTag="show up · 火"
      accent={ACCENT}
      steps={ORDER.length}
      index={ORDER.indexOf(screen)}
    >
      {screen === 'entry' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>day 15 · show up</StepEyebrow>
          <StepTitle size={30}>{day?.title}</StepTitle>
          <StepBody>{day?.entry}</StepBody>
          <div style={{ marginTop: 24, padding: '16px 17px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: `2px solid ${ACCENT.base}` }}>
            <span className="bars-label" style={{ color: ACCENT.lift }}>the contract</span>
            <p className="bars-prose" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
              You compose the move here; you decide whether to send it. Nothing is posted for you, and the other person owes you nothing.
            </p>
          </div>
          <div style={{ marginTop: 22 }}>
            <PrimaryButton block glow onClick={() => go('draw')}>Make one move →</PrimaryButton>
          </div>
          <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
            <Link href="/mastering-allyship/course/3/grow-up" style={{ display: 'block', padding: '15px 16px', border: '1px solid var(--bars-line-strong)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none' }}>
              <span className="bars-prose" style={{ display: 'block', fontSize: 15, lineHeight: 1.45 }}>I am not ready to move on a real person yet →</span>
              <span className="bars-label" style={{ display: 'block', marginTop: 5, color: 'var(--bars-text-muted)' }}>grow the capacity first with Day 14</span>
            </Link>
            <OutlineButton block strong onClick={() => { setOwnLife(true); go('draw') }}>Use this on a move in my own life →</OutlineButton>
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
          <DeckRibbon>the allyship deck · show up · gather resources</DeckRibbon>
          <StepTitle>{day?.drawTitle}</StepTitle>
          <StepBody>{day?.drawBody}</StepBody>
          <StepBody top={12}>A card names a way the move goes live. It does not tell you who to ask, or that they will say yes.</StepBody>
          <div style={{ marginTop: 20 }}><CardDrawRow cards={drawn} carriedId={carriedId} onOpen={setOpen} accent={ACCENT.lift} /></div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <TextButton onClick={resetDraw}>deal again</TextButton>
            <TextButton onClick={() => setCarriedId(null)}>continue without a card</TextButton>
          </div>
          <StepFooter back={() => go('entry')} next={{ label: 'Choose the move →', onClick: () => go('shape') }} />
        </Step>
      ) : null}

      {screen === 'shape' ? (
        <Step>
          <BackLink onClick={() => go('draw')} />
          <StepEyebrow color={ACCENT.lift}>1 · the shape of the move</StepEyebrow>
          <StepTitle>{ownLife ? 'Offering, or asking, in your own life?' : 'Are you offering, or asking?'}</StepTitle>
          <StepBody>One move, one person. Choose the shape, then name who it is for — a private label, never a full name.</StepBody>
          <div style={{ display: 'grid', gap: 9, marginTop: 20 }}>
            {DAY_FIFTEEN_SHAPES.map((candidate) => (
              <SelectRow key={candidate.key} selected={shapeKey === candidate.key} onClick={() => setShapeKey(candidate.key)}>
                <span className="bars-prose" style={{ display: 'block', fontSize: 17, color: 'var(--bars-text-primary)' }}>{candidate.label}</span>
                <span className="bars-prose" style={{ display: 'block', marginTop: 6, fontSize: 15, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>{candidate.prompt}</span>
              </SelectRow>
            ))}
          </div>
          {shape ? <PrivateField id="day15-recipient" label="who it is for" value={recipient} onChange={setRecipient} placeholder={shape.recipientPlaceholder} rows={1} /> : null}
          {shape ? <StepFooter back={() => go('draw')} next={{ label: 'Compose it →', onClick: () => go('compose') }} /> : null}
        </Step>
      ) : null}

      {screen === 'compose' && shape ? (
        <Step>
          <BackLink onClick={() => go('shape')} />
          <StepEyebrow color={ACCENT.lift}>2 · the message</StepEyebrow>
          <StepTitle>Say it in words they can act on.</StepTitle>
          <StepBody>Fill the two blanks. The consent line is fixed, because it is the move — an invitation, not a debt.</StepBody>
          <div style={{ marginTop: 20, padding: '18px 17px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', border: `1px solid ${ACCENT.base}` }}>
            <p className="bars-prose" style={{ margin: 0, fontSize: 18, lineHeight: 1.65, color: 'var(--bars-text-primary)' }}>{message}</p>
          </div>
          <PrivateField id="day15-first" label={shape.firstBlank} value={first} onChange={setFirst} placeholder={shape.firstBlank} rows={2} />
          <PrivateField id="day15-second" label={shape.secondBlank} value={second} onChange={setSecond} placeholder={shape.secondBlank} rows={2} />
          <div style={{ marginTop: 18, padding: '14px 15px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: `2px solid var(--bars-gold)` }}>
            <span className="bars-label" style={{ color: 'var(--bars-gold)' }}>the fixed line</span>
            <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>“{DAY_FIFTEEN_CONSENT}” keeps this an invitation. It is what makes the ask clean.</p>
          </div>
          {carried ? (
            <div style={{ marginTop: 16, padding: '13px 14px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', boxShadow: `0 0 0 1px ${ACCENT.base}` }}>
              <span className="bars-label" style={{ color: ACCENT.lift }}>◇ your lens · {carried.title}</span>
              <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>{lens(carried)}</p>
            </div>
          ) : null}
          <StepFooter back={() => go('shape')} next={{ label: 'See my receipt →', onClick: () => go('receipt') }} />
        </Step>
      ) : null}

      {screen === 'receipt' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>your Day 15 receipt</StepEyebrow>
          <StepTitle size={28}>{DAY_FIFTEEN_RECEIPT.headline}</StepTitle>
          <StepBody>Yours to send, or not. If you send it, send it as written — the consent line included.</StepBody>
          <div style={{ marginTop: 18, padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: `var(--bars-shadow-inset-top), 0 0 0 1px ${ACCENT.base}` }}>
            <p className="bars-prose" style={{ margin: 0, fontSize: 17, lineHeight: 1.58, color: 'var(--bars-text-primary)' }}>{message || '— no move composed —'}</p>
            {message ? (
              <div style={{ marginTop: 14 }}>
                <OutlineButton onClick={copy}>{copied ? 'copied ♦' : 'copy this message'}</OutlineButton>
              </div>
            ) : null}
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
          <p className="bars-prose" style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>{DAY_FIFTEEN_RECEIPT.weekClose}</p>
          <NextDayHandoff handoff={nextCourseDay(DAY)} accent={ACCENT.lift} />
          <span className="bars-label" style={{ display: 'block', margin: '28px 0 12px', color: 'var(--bars-text-muted)' }}>only if it fits</span>
          <div style={{ display: 'grid', gap: 10 }}>
            <Link href="/mastering-allyship/course/3/wake-up" style={{ display: 'block', padding: '14px 15px', border: '1px solid var(--bars-line-strong)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none', textAlign: 'center' }}>Return to Day 11: the Resource Ledger →</Link>
            <Link href="/organization" style={{ display: 'block', padding: '14px 15px', border: '1px solid var(--bars-line-strong)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none', textAlign: 'center' }}>See what work is actually live →</Link>
            <a href={BOOK_HREF} style={{ display: 'block', padding: '14px 15px', border: '1px solid var(--bars-line)', borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-primary)', textDecoration: 'none', textAlign: 'center' }}>Read the book →</a>
          </div>
          <PrivacyLine>Private by default · nothing you write is sent or saved as a course answer</PrivacyLine>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}><BackLink onClick={() => go('compose')} /></div>
        </Step>
      ) : null}

      {open ? <CardDrawSheet card={open} carried={carriedId === open.id} onClose={() => setOpen(null)} onChoose={() => { setCarriedId((current) => current === open.id ? null : open.id); setOpen(null) }} accent={ACCENT.lift} accentText="#1a0a00" /> : null}
    </CheckShell>
  )
}
