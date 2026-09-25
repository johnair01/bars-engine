'use client'

import { useEffect, useMemo, useState } from 'react'

import { CardDrawRow, CardDrawSheet } from '@/components/deck/CardDraw'
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
  mono,
} from './CheckKit'
import type { CheckAccent } from './CheckKit'
import { CampaignStatePanel } from './CampaignStatePanel'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { MOVE_ELEMENT } from '@/lib/allyship-deck/card-visuals'
import { nextCourseDay } from '@/lib/mtgoa-course/course-days'
import { ROUND_TWO_STATES, roundTwoEvidence } from '@/lib/mtgoa-course/round-two'
import type { RoundTwoDay, RoundTwoState } from '@/lib/mtgoa-course/round-two'
import type { MtgoaOrganizationState } from '@/lib/mtgoa-course/organization-state'
import type { RoundTwoAnalyticsEvent } from '@/lib/mtgoa-course/round-two-events'
import { markCourseDayComplete } from '@/lib/mtgoa-course/mark-day-complete'

/**
 * The Week 2 course day, rendered from a `round-two.ts` table row.
 *
 * Week 1's days were each authored separately and each got its own component.
 * Week 2's spec gives every day the same shape, so the days are data and this
 * renders them: prompts, a draw, a state, a receipt.
 *
 * Days 6, 9 and 10 outgrew the table and have their own components, dispatched
 * ahead of this one in `page.tsx`. Days 7 and 8 render here.
 *
 * The element comes from the move, as everywhere else — so Day 7 is liminal and
 * Day 8 water, matching Days 2 and 3 exactly. A reader walking the second loop
 * should recognise the colour of each move.
 *
 * `orgState` arrives from the Server Component so the public campaign panel has
 * no client fetch and no waterfall. It is public state, and it must never look
 * like the course remembering the reader's own work.
 */

type Screen = 'entry' | 'prompts' | 'draw' | 'state' | 'receipt'

/** Per-move accent, identical to the Week 1 day that shares the move. */
const ACCENTS: Record<string, CheckAccent> = {
  earth: { base: 'var(--bars-earth-glow)', lift: '#e0a93b' },
  liminal: { base: 'var(--bars-liminal)', lift: 'var(--bars-liminal-glow)' },
  water: { base: 'var(--bars-water-glow)', lift: '#3fa9c4' },
  wood: { base: 'var(--bars-wood-glow)', lift: '#3ec97a' },
  fire: { base: 'var(--bars-fire-glow)', lift: '#f0813a' },
}

const MOVE_SIGIL: Record<string, string> = {
  wake_up: '土', open_up: '◇', clean_up: '水', grow_up: '木', show_up: '火',
}

function track(event: RoundTwoAnalyticsEvent) {
  const body = JSON.stringify(event)
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/api/week-two/events', new Blob([body], { type: 'application/json' }))
    return
  }
  void fetch('/api/week-two/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true })
}

function drawThree(pool: MoveCard[]): MoveCard[] {
  const cards = [...pool]
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards.slice(0, 3)
}

export function WeekTwoPractice({
  day,
  cards,
  orgState,
  hasOpenRoute,
}: {
  day: RoundTwoDay
  cards: MoveCard[]
  orgState: MtgoaOrganizationState
  hasOpenRoute: boolean
}) {
  const order: Screen[] = useMemo(() => ['entry', 'prompts', 'draw', 'state', 'receipt'], [])

  const [screen, setScreen] = useState<Screen>('entry')

  /**
   * Reaching the receipt is what finishes a day, so this is where the board
   * learns to open tomorrow. One day number, written to this browser — never
   * anything the reader typed.
   *
   * @see src/lib/mtgoa-course/mark-day-complete.ts
   */
  useEffect(() => {
    if (screen === 'receipt') markCourseDayComplete(day.day)
  }, [screen, day.day])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [sampler, setSampler] = useState<MoveCard[]>([])
  const [carried, setCarried] = useState<MoveCard | null>(null)
  const [sheetCard, setSheetCard] = useState<MoveCard | null>(null)
  const [state, setState] = useState<RoundTwoState | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    track({ event: 'week_two_viewed', day: day.day })
    setSampler(drawThree(cards))
  }, [day.day, cards])

  const element = MOVE_ELEMENT[day.move]
  const accent = ACCENTS[element] ?? ACCENTS.earth

  const tomorrow = nextCourseDay(day.day)

  const go = (next: Screen) => { setScreen(next); window.scrollTo(0, 0) }
  const back = () => go(order[Math.max(0, order.indexOf(screen) - 1)])

  const write = (key: string, value: string) => setAnswers((c) => ({ ...c, [key]: value }))

  const chooseSheetCard = () => {
    if (!sheetCard) return
    const next = carried?.id === sheetCard.id ? null : sheetCard
    setCarried(next)
    if (next) track({ event: 'week_two_card_carried', day: day.day, cardId: next.id })
    setSheetCard(null)
  }

  const answered = day.prompts.filter((p) => (answers[p.key] ?? '').trim()).length
  const evidence = roundTwoEvidence({ day: day.day, answered, carried: !!carried, state })

  return (
    <CheckShell
      label={`Week 2 · Day ${day.day} of 30`}
      moveTag={`${day.slug.replace('-', ' ')} · ${MOVE_SIGIL[day.move] ?? ''}`}
      accent={accent}
      steps={order.length}
      index={order.indexOf(screen)}
    >
      {screen === 'entry' ? (
        <Step>
          <h1 className="bars-title" style={{ margin: 0, fontSize: 24, lineHeight: 1.15, color: 'var(--bars-gold)' }}>
            {day.title}
          </h1>
          <span className="bars-label" style={{ display: 'block', marginTop: 8, color: 'var(--bars-text-muted)' }}>
            skillful organizing · {day.practice.name}
          </span>
          <p
            className="bars-title"
            style={{ margin: '10px 0 0', fontSize: 'clamp(26px,5vw,34px)', lineHeight: 1.18, fontWeight: 700, color: 'var(--bars-text-primary)', textWrap: 'pretty' }}
          >
            {day.coreQuestion}
          </p>
          <StepBody top={18}>{day.entry}</StepBody>

          <div
            style={{
              marginTop: 20,
              padding: 17,
              borderRadius: 'var(--bars-radius-lg)',
              background: 'var(--bars-surface-inset)',
              borderLeft: `2px solid ${accent.base}`,
            }}
          >
            <span className="bars-label" style={{ color: accent.lift }}>{day.practice.name}</span>
            <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
              {day.practice.body}
            </p>
          </div>

          <CampaignStatePanel
            orgState={orgState}
            hasOpenRoute={hasOpenRoute}
            open={panelOpen}
            onToggle={() => { setPanelOpen((o) => !o); if (!panelOpen) track({ event: 'week_two_state_panel_opened', day: day.day }) }}
            onSurfaceClick={() => track({ event: 'week_two_campaign_state_clicked', day: day.day })}
          />

          <div style={{ marginTop: 26 }}>
            <PrimaryButton
              onClick={() => { track({ event: 'week_two_started', day: day.day }); go('prompts') }}
              block
            >
              Begin →
            </PrimaryButton>
          </div>
          <PrivacyLine>No sign-up. Nothing you write is saved or sent.</PrivacyLine>
        </Step>
      ) : null}

      {screen === 'prompts' ? (
        <Step>
          <StepEyebrow color={accent.lift}>{day.practice.name.toLowerCase()}</StepEyebrow>
          <StepTitle>{day.coreQuestion}</StepTitle>
          <StepBody>{day.practice.body} Every field is optional.</StepBody>
          {day.prompts.map((p) => (
            <PrivateField
              key={p.key}
              id={`w2-${day.day}-${p.key}`}
              label={`${p.label} · stays in your browser`}
              value={answers[p.key] ?? ''}
              onChange={(v) => write(p.key, v)}
              placeholder={p.placeholder}
              rows={4}
            />
          ))}
          <StepFooter back={back} next={{ label: 'draw a card →', onClick: () => go('draw') }} />
          <PrivacyLine>{day.doNot}</PrivacyLine>
        </Step>
      ) : null}

      {screen === 'draw' ? (
        <Step>
          <DeckRibbon>{`the allyship deck · ${day.slug.replace('-', ' ')} · skillful organizing`}</DeckRibbon>
          <div style={{ marginTop: 20 }}>
            <StepEyebrow>the draw</StepEyebrow>
            <StepTitle>{day.drawTitle}</StepTitle>
            <StepBody>{day.drawBody} Choose one, deal again, or skip.</StepBody>
          </div>
          <div style={{ marginTop: 22 }}>
            <CardDrawRow cards={sampler} carriedId={carried?.id ?? null} onOpen={setSheetCard} accent={accent.lift} />
          </div>
          {carried ? (
            <div
              style={{
                marginTop: 20, padding: 17, borderRadius: 'var(--bars-radius-lg)',
                background: 'var(--bars-surface-card)', border: '1px solid var(--bars-line-strong)',
                boxShadow: 'var(--bars-shadow-inset-top)',
              }}
            >
              <span className="bars-label" style={{ color: 'var(--bars-gold)' }}>{`${carried.title} · what this card asks`}</span>
              <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
                {day.cardPrompts[carried.id] ?? carried.remediation}
              </p>
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <OutlineButton onClick={() => { setSampler(drawThree(cards)); setCarried(null); track({ event: 'week_two_redraw', day: day.day }) }}>
              deal three more
            </OutlineButton>
            <OutlineButton onClick={() => { track({ event: 'week_two_draw_skipped', day: day.day }); go('state') }}>
              skip the draw →
            </OutlineButton>
          </div>
          <StepFooter back={back} next={{ label: 'continue →', onClick: () => go('state') }} />
        </Step>
      ) : null}

      {screen === 'state' ? (
        <Step>
          <StepEyebrow color={accent.lift}>what is true right now</StepEyebrow>
          <StepTitle>Where did today land?</StepTitle>
          <StepBody>
            Answer for what has actually happened. Nobody checks this, which is exactly why it only means something if it is
            true.
          </StepBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            {ROUND_TWO_STATES.map((s) => (
              <SelectRow
                key={s.key}
                selected={state === s.key}
                onClick={() => {
                  setState(s.key)
                  track({ event: 'week_two_state_chosen', day: day.day, state: s.key })
                  track({ event: 'week_two_completed', day: day.day, state: s.key })
                  go('receipt')
                }}
              >
                <span className="bars-title" style={{ display: 'block', fontSize: 17, color: '#fff' }}>{s.label}</span>
                <span className="bars-prose" style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                  {s.body}
                </span>
              </SelectRow>
            ))}
          </div>
          <div style={{ marginTop: 24 }}><BackLink onClick={back} /></div>
        </Step>
      ) : null}

      {screen === 'receipt' ? (
        <Step>
          <StepEyebrow color={accent.lift}>{day.receipt.eyebrow}</StepEyebrow>
          <StepTitle size={28}>{day.receipt.title}</StepTitle>
          <StepBody>{day.receipt.body}</StepBody>

          {day.receipt.stem ? (
            <p className="bars-prose" style={{ margin: '14px 0 0', fontSize: 16, lineHeight: 1.6, color: 'var(--bars-text-muted)', fontStyle: 'italic' }}>
              {day.receipt.stem}
            </p>
          ) : null}

          <div
            style={{
              marginTop: 22, padding: '18px 19px', borderRadius: 'var(--bars-radius-lg)',
              background: 'var(--bars-surface-card)', border: '1px solid var(--bars-line-strong)',
              boxShadow: 'var(--bars-shadow-inset-top)',
            }}
          >
            {day.prompts.map((p) => (
              <ReceiptRow key={p.key} label={p.label} value={(answers[p.key] ?? '').trim() || null} />
            ))}
            {state ? <ReceiptRow label="where it landed" value={ROUND_TWO_STATES.find((s) => s.key === state)?.label ?? null} /> : null}
            {carried ? (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--bars-line)' }}>
                <span className="bars-label" style={{ display: 'block', color: 'var(--bars-gold)' }}>the card you carried</span>
                <p className="bars-title" style={{ margin: '6px 0 0', fontSize: 18, color: '#fff' }}>{carried.title}</p>
                <p className="bars-prose" style={{ margin: '5px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                  {carried.primaryQuestion}
                </p>
              </div>
            ) : null}
            {answered === 0 && !carried ? (
              <p className="bars-prose" style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                You kept it all in your head. That still counts — the looking is the thing.
              </p>
            ) : null}
          </div>

          <NextDayHandoff
            handoff={tomorrow}
            href={tomorrow?.route ?? undefined}
            onNavigate={() => track({ event: 'week_two_next_day_clicked', day: day.day })}
            accent={accent.lift}
          />

          <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid var(--bars-line)' }}>
            <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>the moves you made here</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {evidence.map((item) => (
                <span
                  key={item}
                  style={{
                    ...mono, fontSize: 'var(--bars-text-2xs)', letterSpacing: '.08em', textTransform: 'uppercase',
                    color: 'var(--bars-text-secondary)', background: 'var(--bars-surface-inset)',
                    border: '1px solid var(--bars-line)', borderRadius: 'var(--bars-radius-full)', padding: '8px 12px',
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
            <BackLink onClick={back} />
            <TextButton onClick={() => { setAnswers({}); setCarried(null); setState(null); setSampler(drawThree(cards)); go('entry') }}>
              start again
            </TextButton>
          </div>
          <PrivacyLine>closing the tab is also a complete move.</PrivacyLine>
        </Step>
      ) : null}

      {sheetCard ? (
        <CardDrawSheet
          card={sheetCard}
          carried={carried?.id === sheetCard.id}
          onClose={() => setSheetCard(null)}
          onChoose={chooseSheetCard}
          accent={accent.lift}
          accentText="#0a0908"
          chooseLabel="carry this card"
        />
      ) : null}
    </CheckShell>
  )
}
