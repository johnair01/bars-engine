'use client'

import { useEffect, useMemo, useState } from 'react'

import { CardDrawRow, CardDrawSheet } from '@/components/deck/CardDraw'
import {
  BackLink,
  Chip,
  CheckShell,
  DeckRibbon,
  OutlineButton,
  PrimaryButton,
  PrivacyLine,
  PrivateField,
  NextDayHandoff,
  NumBadge,
  ReceiptRow,
  SelectRow,
  Step,
  StepBody,
  StepEyebrow,
  StepFooter,
  StepTitle,
  TextButton,
  mono,
} from '@/components/mtgoa-check/CheckKit'
import type { CheckAccent } from '@/components/mtgoa-check/CheckKit'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { nextCourseDay } from '@/lib/mtgoa-course/course-days'
import {
  WAKE_UP_EXPLAINER,
  WAKE_UP_OPENERS,
  WAKE_UP_PRACTICES,
  WAKE_UP_QUESTIONS,
  WAKE_UP_RECEIPT,
  wakeUpEvidence,
} from '@/lib/wake-up/check-content'
import type { WakeUpRoute } from '@/lib/wake-up/check-content'
import type { WakeUpAnalyticsEvent } from '@/lib/wake-up/events'
import { wakeUpBookHref, wakeUpDeckHref, wakeUpNextDayHref } from '@/lib/wake-up/outbound'
import { markCourseDayComplete } from '@/lib/mtgoa-course/mark-day-complete'

/**
 * MTGOA Wake Up Check — Day 1 of the 30-day course.
 *
 * Six unpacking questions, a draw from all 24 canonical Wake Up cards, and a
 * receipt whose output is awareness. There is no design prototype for Day 1 the
 * way there is for Days 2–4; this is built to the course foundation note's
 * wording and to the Clean Up Check's shipped shape, through the shared
 * `CheckKit` so days 5–30 do not each fork the shell again.
 *
 * Wake Up is the Earth move. Purple `--bars-liminal` stays the reserved
 * primary-action color, exactly as in the Clean Up Check.
 *
 * Nothing is persisted. The six answers live in component state and are read
 * back only on the receipt.
 */

type Screen = 'entry' | 'orient' | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'draw' | 'receipt'

const ORDER: Screen[] = ['entry', 'orient', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'draw', 'receipt']

/** Wake Up is Earth. `lift` is the ochre raised for legibility at 10px mono. */
const ACCENT: CheckAccent = { base: 'var(--bars-earth-glow)', lift: '#e0a93b' }

const QUESTION_SCREENS: Screen[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6']

function track(event: WakeUpAnalyticsEvent) {
  const body = JSON.stringify(event)
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/api/wake-up/events', new Blob([body], { type: 'application/json' }))
    return
  }
  void fetch('/api/wake-up/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true })
}

function drawThree(pool: MoveCard[]): MoveCard[] {
  const cards = [...pool]
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[cards[index], cards[swap]] = [cards[swap], cards[index]]
  }
  return cards.slice(0, 3)
}

const EMPTY_ANSWERS: Record<string, string> = {}

export function WakeUpCheck({ queryString }: { queryString: string }) {
  const search = useMemo(() => new URLSearchParams(queryString), [queryString])

  const [screen, setScreen] = useState<Screen>('entry')

  /**
   * Reaching the receipt is what finishes a day, so this is where the board
   * learns to open tomorrow. One day number, written to this browser — never
   * anything the reader typed.
   *
   * @see src/lib/mtgoa-course/mark-day-complete.ts
   */
  useEffect(() => {
    if (screen === 'receipt') markCourseDayComplete(1)
  }, [screen])
  const [route, setRoute] = useState<WakeUpRoute>('own_practice')
  const [answers, setAnswers] = useState<Record<string, string>>(EMPTY_ANSWERS)
  const [sampler, setSampler] = useState<MoveCard[]>([])
  const [carried, setCarried] = useState<MoveCard | null>(null)
  const [sheetCard, setSheetCard] = useState<MoveCard | null>(null)
  const [drew, setDrew] = useState(false)

  useEffect(() => { track({ event: 'wake_up_check_viewed' }) }, [])

  const deckHref = wakeUpDeckHref(search)
  const bookHref = wakeUpBookHref(search)

  // Day 2 exists, so this resolves to a real link. If it ever stops existing the
  // spine returns null and the CTA falls back to "coming next" on its own.
  const tomorrow = nextCourseDay(1)
  const nextHref = tomorrow?.route ? wakeUpNextDayHref(search, tomorrow.route) : undefined

  const write = (key: string, value: string) =>
    setAnswers((current) => ({ ...current, [key]: value }))

  const go = (next: Screen) => {
    setScreen(next)
    window.scrollTo(0, 0)
  }

  const start = (nextRoute: WakeUpRoute) => {
    setRoute(nextRoute)
    setSampler(drawThree(WAKE_UP_PRACTICES))
    track({ event: 'wake_up_check_started', route: nextRoute })
    track({ event: 'wake_up_route_selected', route: nextRoute })
    go('orient')
  }

  const advance = (from: number) => {
    track({ event: 'wake_up_question_advanced', route, questionNumber: from })
    go(from < 6 ? (`q${from + 1}` as Screen) : 'draw')
  }

  const finish = (skipped: boolean) => {
    if (skipped) track({ event: 'wake_up_draw_skipped', route })
    track({ event: 'wake_up_check_completed', route, cardId: carried?.id })
    go('receipt')
  }

  const chooseSheetCard = () => {
    if (!sheetCard) return
    const next = carried?.id === sheetCard.id ? null : sheetCard
    setCarried(next)
    if (next) track({ event: 'wake_up_card_carried', route, cardId: next.id })
    setSheetCard(null)
  }

  const redraw = () => {
    setSampler(drawThree(WAKE_UP_PRACTICES))
    setCarried(null)
    setDrew(true)
  }

  const restart = () => {
    setAnswers(EMPTY_ANSWERS)
    setCarried(null)
    setSheetCard(null)
    setDrew(false)
    setSampler(drawThree(WAKE_UP_PRACTICES))
    setRoute('own_practice')
    go('entry')
  }

  const answered = WAKE_UP_QUESTIONS.filter((question) => (answers[question.key] ?? '').trim()).length
  const evidence = wakeUpEvidence({ answered, drew: drew || sampler.length > 0, carried: !!carried })

  const back = () => {
    const index = ORDER.indexOf(screen)
    go(ORDER[Math.max(0, index - 1)])
  }

  return (
    <CheckShell label="Wake Up Check" moveTag="wake up · 土" accent={ACCENT} steps={ORDER.length} index={ORDER.indexOf(screen)}>
      {screen === 'entry' ? (
        <Step>
          {/* The flow is titled once, here. Every later screen carries only the
              small chrome label, so the name never competes with the step. */}
          <h1 className="bars-title" style={{ margin: 0, fontSize: 24, lineHeight: 1.15, color: 'var(--bars-gold)' }}>
            The Wake Up Check
          </h1>
          <span className="bars-label" style={{ display: 'block', marginTop: 8, color: 'var(--bars-text-muted)' }}>
            a practice, walked in order
          </span>
          <p
            className="bars-title"
            style={{ margin: '10px 0 0', fontSize: 'clamp(28px,5.5vw,38px)', lineHeight: 1.16, fontWeight: 700, color: 'var(--bars-text-primary)', textWrap: 'pretty' }}
          >
            Before you decide whether to act, notice what comes alive.
          </p>
          <StepBody top={18}>
            Most allyship advice starts by telling you what to do. Day 1 starts with what you notice. Six questions map the
            experience you want to create, where you actually are today, and the reservation quietly narrowing the next move.
          </StepBody>
          <StepBody top={14}>
            Fifteen minutes, or five. Awareness is the whole output.
          </StepBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 28 }}>
            <PrimaryButton onClick={() => start('own_practice')} block>
              {WAKE_UP_OPENERS.own_practice.label}
            </PrimaryButton>
            <OutlineButton onClick={() => start('book_promo')} block strong>
              {WAKE_UP_OPENERS.book_promo.label}
            </OutlineButton>
          </div>
          <PrivacyLine>No sign-up. Nothing you write is saved or sent.</PrivacyLine>
        </Step>
      ) : null}

      {screen === 'orient' ? (
        <Step>
          <StepEyebrow>orientation · the six questions</StepEyebrow>
          <StepTitle>Three pairs of questions.</StepTitle>
          <StepBody>{WAKE_UP_OPENERS[route].lead}</StepBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 24 }}>
            {WAKE_UP_EXPLAINER.map((item) => (
              <div
                key={item.num}
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  padding: '16px 17px',
                  borderRadius: 'var(--bars-radius-lg)',
                  background: 'var(--bars-surface-card)',
                  border: '1px solid var(--bars-line-strong)',
                  boxShadow: 'var(--bars-shadow-inset-top)',
                }}
              >
                <NumBadge num={item.num} color={ACCENT.lift} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="bars-title" style={{ display: 'block', fontSize: 17, color: '#fff' }}>{item.title}</span>
                  <span className="bars-prose" style={{ display: 'block', marginTop: 5, fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                    {item.body}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 22,
              padding: 17,
              borderRadius: 'var(--bars-radius-lg)',
              background: 'var(--bars-surface-inset)',
              borderLeft: `2px solid ${ACCENT.base}`,
            }}
          >
            <span className="bars-label" style={{ color: ACCENT.lift }}>why it comes first</span>
            <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
              Acting over an unexamined charge is how allyship turns into performance. Wake Up is the move that makes the rest
              of the form possible: you can only open up to, clean up, or grow past something you have already noticed.
            </p>
          </div>
          <StepFooter back={() => go('entry')} next={{ label: 'begin the six →', onClick: () => go('q1') }} />
          <PrivacyLine>Every question is skippable. You can leave with just the question.</PrivacyLine>
        </Step>
      ) : null}

      {QUESTION_SCREENS.map((questionScreen, index) => {
        if (screen !== questionScreen) return null
        const question = WAKE_UP_QUESTIONS[index]
        const value = answers[question.key] ?? ''
        return (
          <Step key={question.key}>
            <StepEyebrow color={ACCENT.lift}>{`the six · ${question.number} of 6`}</StepEyebrow>
            <StepTitle>{question.title}</StepTitle>
            <StepBody>{question.body}</StepBody>

            {question.kind === 'text' ? (
              <PrivateField
                id={`wake-up-${question.key}`}
                label="private to this page · stays in your browser"
                value={value}
                onChange={(next) => write(question.key, next)}
                placeholder={question.placeholder}
                rows={6}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: question.key === 'direction' ? 'row' : 'column',
                  flexWrap: 'wrap',
                  gap: question.key === 'direction' ? 9 : 10,
                  marginTop: 22,
                }}
              >
                {(question.choices ?? []).map((choice) =>
                  question.key === 'direction' ? (
                    <Chip key={choice} selected={value === choice} onClick={() => write(question.key, value === choice ? '' : choice)}>
                      {choice}
                    </Chip>
                  ) : (
                    <SelectRow key={choice} selected={value === choice} onClick={() => write(question.key, value === choice ? '' : choice)}>
                      <span className="bars-title" style={{ display: 'block', fontSize: 17, color: '#fff' }}>{choice}</span>
                    </SelectRow>
                  ),
                )}
              </div>
            )}

            <StepFooter back={back} next={{ label: question.number < 6 ? 'continue →' : 'draw a card →', onClick: () => advance(question.number) }} />
            {question.key === 'reservation' ? (
              <PrivacyLine>A reservation is a pattern to work with.</PrivacyLine>
            ) : null}
          </Step>
        )
      })}

      {screen === 'draw' ? (
        <Step>
          <DeckRibbon>the allyship deck · wake up · 24 cards</DeckRibbon>
          <div style={{ marginTop: 20 }}>
            <StepEyebrow>the draw</StepEyebrow>
            <StepTitle>Draw a card, or keep the map you just made.</StepTitle>
            <StepBody>
              All 24 Wake Up cards are in the draw. A card is an invitation to notice something more clearly.
              Tap one to read it, carry it if it lands, or skip the draw entirely.
            </StepBody>
          </div>
          <div style={{ marginTop: 22 }}>
            <CardDrawRow cards={sampler} carriedId={carried?.id ?? null} onOpen={setSheetCard} accent={ACCENT.lift} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <OutlineButton onClick={redraw}>draw three more</OutlineButton>
            <OutlineButton onClick={() => finish(true)}>skip the draw →</OutlineButton>
          </div>
          <StepFooter back={back} next={{ label: carried ? 'carry it to the receipt →' : 'see my Day 1 receipt →', onClick: () => finish(false) }} />
        </Step>
      ) : null}

      {screen === 'receipt' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>{WAKE_UP_RECEIPT.eyebrow}</StepEyebrow>
          <StepTitle size={30}>{WAKE_UP_RECEIPT.title}</StepTitle>
          <StepBody>{WAKE_UP_RECEIPT.body}</StepBody>

          <div
            style={{
              marginTop: 24,
              padding: '18px 19px',
              borderRadius: 'var(--bars-radius-lg)',
              background: 'var(--bars-surface-card)',
              border: '1px solid var(--bars-line-strong)',
              boxShadow: 'var(--bars-shadow-inset-top)',
            }}
          >
            {answered === 0 && !carried ? (
              <p className="bars-prose" style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                {WAKE_UP_RECEIPT.empty}
              </p>
            ) : (
              <>
                {WAKE_UP_QUESTIONS.map((question) => (
                  <ReceiptRow key={question.key} label={question.receiptLabel} value={(answers[question.key] ?? '').trim() || null} />
                ))}
                {carried ? (
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--bars-line)' }}>
                    <span className="bars-label" style={{ display: 'block', color: 'var(--bars-gold)' }}>the card you carried</span>
                    <p className="bars-title" style={{ margin: '6px 0 0', fontSize: 18, color: '#fff' }}>{carried.title}</p>
                    <p className="bars-prose" style={{ margin: '5px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                      {carried.primaryQuestion}
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Tomorrow's question is named whether or not Day 2 exists; the spine
              decides whether it renders as a link. */}
          <NextDayHandoff
            handoff={tomorrow}
            href={nextHref}
            onNavigate={() => track({ event: 'wake_up_next_day_clicked', route })}
            accent={ACCENT.lift}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            <a
              href={deckHref}
              onClick={() => track({ event: 'wake_up_deck_cta_clicked', route })}
              style={{ textDecoration: 'none' }}
            >
              <OutlineButton onClick={() => {}} block strong>Explore the Allyship Deck →</OutlineButton>
            </a>
            <a
              href={bookHref}
              onClick={() => track({ event: 'wake_up_book_cta_clicked', route })}
              style={{ textDecoration: 'none' }}
            >
              <OutlineButton onClick={() => {}} block>Get Mastering the Game of Allyship →</OutlineButton>
            </a>
          </div>

          <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid var(--bars-line)' }}>
            <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>the moves you made here</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {evidence.map((item) => (
                <span
                  key={item}
                  style={{
                    ...mono,
                    fontSize: 'var(--bars-text-2xs)',
                    letterSpacing: '.08em',
                    textTransform: 'uppercase',
                    color: 'var(--bars-text-secondary)',
                    background: 'var(--bars-surface-inset)',
                    border: '1px solid var(--bars-line)',
                    borderRadius: 'var(--bars-radius-full)',
                    padding: '8px 12px',
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
            <BackLink onClick={back} />
            <TextButton onClick={restart}>start again</TextButton>
          </div>
          <PrivacyLine>{WAKE_UP_RECEIPT.closing}</PrivacyLine>
        </Step>
      ) : null}

      {sheetCard ? (
        <CardDrawSheet
          card={sheetCard}
          carried={carried?.id === sheetCard.id}
          onClose={() => setSheetCard(null)}
          onChoose={chooseSheetCard}
          accent={ACCENT.lift}
          accentText="#1a0a00"
          chooseLabel="carry this card"
        />
      ) : null}
    </CheckShell>
  )
}
