'use client'

import { useEffect, useState } from 'react'

import { CardDrawRow, CardDrawSheet } from '@/components/deck/CardDraw'
import { CampaignStatePanel } from './CampaignStatePanel'
import {
  BackLink,
  CheckShell,
  NextDayHandoff,
  OutlineButton,
  PrimaryButton,
  PrivacyLine,
  Step,
  StepBody,
  StepEyebrow,
  StepTitle,
  TextButton,
  mono,
} from './CheckKit'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { linkableRoute, mtgoaCourseDay, nextCourseDay } from '@/lib/mtgoa-course/course-days'
import {
  DAY_TEN_ATTESTATION_NOTE,
  DAY_TEN_COME_BACK_QUESTION,
  DAY_TEN_HANDOFF_FIELDS,
  DAY_TEN_LANES,
  DAY_TEN_LEARNINGS,
  DAY_TEN_PLACEMENTS,
  DAY_TEN_RETURN_DOORS,
  DAY_TEN_RHYTHM_FIELDS,
  DAY_TEN_STARTERS,
  DAY_TEN_STARTER_CAVEAT,
  DAY_TEN_THIRD_PARTY_NOTE,
  dayTenAttestation,
  dayTenHandoffText,
  dayTenLane,
  dayTenLens,
  dayTenPlacement,
  dayTenReceiptHeadline,
  dayTenReminderLine,
  dayTenRhythmText,
  dayTenStateChip,
} from '@/lib/mtgoa-course/day-ten'
import type { DayTenLane, DayTenPlacement } from '@/lib/mtgoa-course/day-ten'
import type { MtgoaOrganizationState } from '@/lib/mtgoa-course/organization-state'
import { NO_OPEN_PARTICIPATION_NOTE } from '@/lib/mtgoa-course/organization-state'
import type { RoundTwoAnalyticsEvent } from '@/lib/mtgoa-course/round-two-events'
import { markCourseDayComplete } from '@/lib/mtgoa-course/mark-day-complete'

/**
 * Day 10 — Show Up · The Campaign Handoff.
 *
 * Week 2 closes with the act. Days 6 to 9 were private; today puts one small
 * structure where another person, or future you, can use it. The standard is
 * the whole design: can someone take the next useful action from what you made?
 *
 * This day cannot run through `WeekTwoPractice`. That component finishes a day
 * on reaching a receipt whatever the reader built, and treats keeping the work
 * in your head as sufficient — right for Days 6 to 9, wrong here. So Day 10
 * keeps four distinct truth states, and a reader who says the structure is
 * placed attests to it before the page moves on.
 *
 * Nothing is persisted, matching the Week 2 invariant: a refresh clears the
 * pass, and only the day number reaches the progress store.
 *
 * Colour follows the covenant rather than the prototype. Fire is Show Up's
 * element and carries the chrome, the rings and the card frames; purple
 * `--bars-liminal` stays the primary-action colour it is on every other day.
 *
 * @see .specify/specs/mtgoa-day10-campaign-handoff/design_handoff/
 */

type Screen = 'entry' | 'draw' | 'lane' | 'build' | 'land' | 'comeback' | 'receipt'

const ORDER: Screen[] = ['entry', 'draw', 'lane', 'build', 'land', 'comeback', 'receipt']

/** Show Up is fire, the same fire Day 5 uses. A reader should recognise the move by its colour. */
const ACCENT = { base: 'var(--bars-fire-glow)', lift: '#f0813a' }

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

const fieldStyle = {
  width: '100%',
  marginTop: 11,
  padding: '13px 14px',
  borderRadius: 10,
  fontSize: 16,
  lineHeight: 1.55,
  fontFamily: 'var(--bars-font-body)',
  color: 'var(--bars-text-primary)',
  background: '#180a06',
  border: '1px solid var(--bars-line-strong)',
} as const

const doorStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '15px 17px',
  borderRadius: 'var(--bars-radius-lg)',
  border: '1px solid var(--bars-line-strong)',
  color: 'var(--bars-text-primary)',
  textDecoration: 'none',
  fontSize: 15,
  lineHeight: 1.4,
  textWrap: 'pretty',
} as const

export function DayTenCampaignHandoff({
  cards,
  orgState,
  hasOpenRoute,
  bookHref,
  deckHref,
}: {
  cards: MoveCard[]
  orgState: MtgoaOrganizationState
  hasOpenRoute: boolean
  bookHref: string
  deckHref: string
}) {
  const [screen, setScreen] = useState<Screen>('entry')
  const [panelOpen, setPanelOpen] = useState(false)

  const [hand, setHand] = useState<MoveCard[]>([])
  const [chosen, setChosen] = useState<MoveCard | null>(null)
  const [sheet, setSheet] = useState<MoveCard | null>(null)

  const [lane, setLane] = useState<DayTenLane | null>(null)
  const [starter, setStarter] = useState<string | null>(null)

  const [rhythm, setRhythm] = useState<Record<string, string>>({})
  const [handoff, setHandoff] = useState<Record<string, string>>({})
  const [bookOpen, setBookOpen] = useState(false)
  const [book, setBook] = useState({ who: '', why: '', line: '' })

  const [placement, setPlacement] = useState<DayTenPlacement | null>(null)
  const [attested, setAttested] = useState(false)
  const [learning, setLearning] = useState<string | null>(null)
  const [returnDate, setReturnDate] = useState('')

  const [copiedArtifact, setCopiedArtifact] = useState(false)
  const [copiedReminder, setCopiedReminder] = useState(false)

  /**
   * Reaching the receipt records one thing: that Day 10 was explored. Never the
   * artifact, never the state, never a word the reader typed.
   *
   * @see src/lib/mtgoa-course/mark-day-complete.ts
   */
  useEffect(() => {
    if (screen === 'receipt') {
      markCourseDayComplete(10)
      track({ event: 'week_two_completed', day: 10 })
    }
  }, [screen])

  useEffect(() => {
    track({ event: 'week_two_viewed', day: 10 })
  }, [])

  const go = (next: Screen) => { setScreen(next); window.scrollTo(0, 0) }
  const deal = () => setHand(drawThree(cards))
  const begin = (presetLane: DayTenLane | null) => {
    if (presetLane) setLane(presetLane)
    track({ event: 'week_two_started', day: 10 })
    deal()
    go('draw')
  }

  const shared = lane === 'local_team'
  const laneDef = dayTenLane(lane)
  const placementDef = dayTenPlacement(placement)
  const starterDef = DAY_TEN_STARTERS.find((s) => s.key === starter) ?? null
  const tomorrow = nextCourseDay(10)
  /** Day 9 is the Six Faces read. It only links when that day has actually shipped. */
  const dayNine = mtgoaCourseDay(9)
  const facesHref = dayNine ? linkableRoute(dayNine) : null

  const dateLabel = returnDate
    ? new Date(`${returnDate}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
    : ''

  const artifactText = shared ? dayTenHandoffText(handoff) : dayTenRhythmText(rhythm, book)
  const reminderLine = dayTenReminderLine(dateLabel)

  /** Placed is the one state that asks for a word before the page moves on. */
  const landReady = placement !== null && (placement !== 'placed' || attested)

  const copy = (text: string, mark: (v: boolean) => void) => {
    navigator.clipboard?.writeText(text)
    track({ event: 'week_two_artifact_copied', day: 10, lane: lane ?? undefined })
    mark(true)
    window.setTimeout(() => mark(false), 1800)
  }

  const returnDoors = DAY_TEN_RETURN_DOORS.map((door) => {
    const target = mtgoaCourseDay(door.day)
    const route = target ? linkableRoute(target) : null
    return route ? { ...door, route } : null
  }).filter((d): d is { day: number; label: string; route: string } => d !== null)

  const returnDoorList = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {returnDoors.map((door) => (
        <a
          key={door.day}
          href={door.route}
          onClick={() => track({ event: 'week_two_returned_to_day', day: 10, returnedToDay: door.day })}
          style={doorStyle}
        >
          {door.label} <span aria-hidden style={{ flex: 'none', color: ACCENT.lift }}>→</span>
        </a>
      ))}
    </div>
  )

  const fieldCard = (
    num: number,
    label: string,
    prompt: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
  ) => (
    <div style={{ padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), 0 0 0 1px var(--bars-line)' }}>
      <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
        <span
          aria-hidden
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, flex: 'none',
            borderRadius: 10, fontFamily: 'var(--bars-font-display)', fontWeight: 700, fontSize: 17, color: ACCENT.lift,
            boxShadow: 'inset 0 0 0 1.5px rgba(193,57,43,.6), inset 0 1px 0 rgba(255,255,255,.07)',
          }}
        >
          {num}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: 'var(--bars-font-display)', fontWeight: 600, fontSize: 17, color: '#fff' }}>{label}</span>
          <span className="bars-label" style={{ display: 'block', marginTop: 3, color: ACCENT.lift }}>{prompt}</span>
        </span>
      </div>
      <textarea
        aria-label={label}
        rows={2}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...fieldStyle, resize: 'vertical' }}
      />
    </div>
  )

  /** The reader's own words, rebuilt as they type, with the placement instruction under it. */
  const artifactBlock = (instruction: string, copyLabel: string) => (
    <div style={{ marginTop: 20, padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: `var(--bars-shadow-inset-top), 0 0 0 1px ${ACCENT.base}` }}>
      <StepEyebrow color={ACCENT.lift}>{shared ? 'shared work handoff' : 'my Allyship Rhythm'}</StepEyebrow>
      <p className="bars-prose" style={{ margin: '10px 0 0', fontSize: 16, lineHeight: 1.6, color: '#e8e6e0', whiteSpace: 'pre-wrap', textWrap: 'pretty' }}>
        {artifactText}
      </p>
      <p className="bars-prose" style={{ margin: '14px 0 0', fontSize: 14.5, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
        {instruction}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 13 }}>
        <OutlineButton onClick={() => copy(artifactText, setCopiedArtifact)}>
          {copiedArtifact ? 'copied ♦' : copyLabel}
        </OutlineButton>
        {shared ? (
          <a
            href="/organization"
            onClick={() => track({ event: 'week_two_campaign_state_clicked', day: 10 })}
            style={{ ...mono, fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase', padding: '13px 16px', borderRadius: 'var(--bars-radius-lg)', border: '1px solid var(--bars-line-strong)', color: 'var(--bars-text-secondary)', textDecoration: 'none' }}
          >
            see current MTGOA work →
          </a>
        ) : null}
      </div>
    </div>
  )

  return (
    <CheckShell
      label="Week 2 · Skillful Organizing · Day 10 of 30"
      moveTag="show up · 火"
      accent={ACCENT}
      steps={ORDER.length}
      index={ORDER.indexOf(screen)}
    >
      {screen === 'entry' ? (
        <Step>
          <h1 className="bars-title" style={{ margin: 0, fontSize: 'clamp(29px,5.8vw,41px)', lineHeight: 1.14, textWrap: 'pretty' }}>
            Put one useful structure where someone can use it.
          </h1>
          <StepBody top={18}>
            You can have a clear idea, a careful plan, and a real desire to help. The work still stays with you until it has a
            place to land.
          </StepBody>
          <StepBody>
            Today you will build one small handoff: a rhythm future you can keep, or a shared-work page another person has
            agreed to receive. The standard is simple — can someone take the next useful action from what you made?
          </StepBody>

          <div style={{ marginTop: 22, padding: 17, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: `2px solid ${ACCENT.base}` }}>
            <StepEyebrow color={ACCENT.lift}>the live field</StepEyebrow>
            <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15.5, lineHeight: 1.6, color: '#e8e6e0', textWrap: 'pretty' }}>
              Helping <em>Mastering the Game of Allyship</em> reach people who could use it. Use today&rsquo;s practice on the
              campaign where a current route fits, or on a piece of your own allyship life.
            </p>
            <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 14.5, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
              Nothing here enrolls you, assigns a role, or sends anything to anyone. You can finish the day having decided this
              work needs no structure at all.
            </p>
          </div>

          <CampaignStatePanel
            orgState={orgState}
            hasOpenRoute={hasOpenRoute}
            open={panelOpen}
            onToggle={() => { setPanelOpen((o) => !o); if (!panelOpen) track({ event: 'week_two_state_panel_opened', day: 10 }) }}
            onSurfaceClick={() => track({ event: 'week_two_campaign_state_clicked', day: 10 })}
          />

          <div style={{ marginTop: 26 }}>
            <PrimaryButton onClick={() => begin(null)} block glow>Build the handoff →</PrimaryButton>
          </div>
          <p className="bars-prose" style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)' }}>
            Draw a card, choose a lane, make one thing someone can use.
          </p>

          <span className="bars-label" style={{ display: 'block', margin: '26px 0 11px', color: 'var(--bars-text-muted)' }}>other ways in</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <OutlineButton onClick={() => begin('personal')} block strong>Use this in my own allyship life →</OutlineButton>
            <a href="/organization" onClick={() => track({ event: 'week_two_campaign_state_clicked', day: 10 })} style={doorStyle}>
              See the current organization work <span aria-hidden style={{ flex: 'none', color: ACCENT.lift }}>→</span>
            </a>
          </div>
          <PrivacyLine>Session-only · nothing you write is stored, sent, or saved as a course answer</PrivacyLine>
        </Step>
      ) : null}

      {screen === 'draw' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>the allyship deck · show up · skillful organizing</StepEyebrow>
          <StepTitle>Six ways to make a structure real.</StepTitle>
          <StepBody>
            Each card gives you one way to take the handoff out of your head and into a place where it can be used. Choose one,
            deal again, or continue without a card.
          </StepBody>

          <div style={{ marginTop: 22 }}>
            <CardDrawRow cards={hand} carriedId={chosen?.id ?? null} onOpen={setSheet} accent={ACCENT.lift} carriedLabel="♦ chosen" />
          </div>

          {chosen ? (
            <div style={{ marginTop: 18, padding: '15px 16px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', boxShadow: `0 0 0 1px ${ACCENT.base}` }}>
              <StepEyebrow color={ACCENT.lift}>◇ your lens · {chosen.title}</StepEyebrow>
              <p className="bars-prose" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.5, color: '#e8e6e0' }}>{dayTenLens(chosen)}</p>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <OutlineButton onClick={() => { deal(); setChosen(null); track({ event: 'week_two_redraw', day: 10 }) }}>Deal again</OutlineButton>
            <OutlineButton onClick={() => { setChosen(null); track({ event: 'week_two_draw_skipped', day: 10 }); go('lane') }}>Continue without a card</OutlineButton>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <BackLink onClick={() => go('entry')} />
            <PrimaryButton onClick={() => go('lane')} glow>Choose what you are organizing →</PrimaryButton>
          </div>

          {sheet ? (
            <CardDrawSheet
              card={sheet}
              carried={chosen?.id === sheet.id}
              onClose={() => setSheet(null)}
              onChoose={() => {
                const next = chosen?.id === sheet.id ? null : sheet
                setChosen(next)
                if (next) track({ event: 'week_two_card_carried', day: 10, cardId: next.id })
                setSheet(null)
              }}
              accent={ACCENT.lift}
              accentText="#1c0700"
              chooseLabel="Play through this card"
              carriedLabel="Chosen ♦"
            />
          ) : null}
        </Step>
      ) : null}

      {screen === 'lane' ? (
        <Step>
          <BackLink onClick={() => go('draw')} />
          <StepEyebrow color={ACCENT.lift}>step two · choose the lane</StepEyebrow>
          <StepTitle size={27}>What needs a place to live?</StepTitle>

          {chosen ? (
            <div style={{ marginTop: 18, padding: '15px 16px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', boxShadow: `0 0 0 1px ${ACCENT.base}` }}>
              <StepEyebrow color={ACCENT.lift}>◇ your lens · {chosen.title}</StepEyebrow>
              <p className="bars-prose" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.5, color: '#e8e6e0' }}>{dayTenLens(chosen)}</p>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
            {DAY_TEN_LANES.map((l) => {
              const selected = lane === l.key
              return (
                <button
                  key={l.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => { setLane(l.key); track({ event: 'week_two_lane_chosen', day: 10, lane: l.key }) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: 19, cursor: 'pointer',
                    borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', border: 'none',
                    boxShadow: selected
                      ? `var(--bars-shadow-inset-top), 0 0 0 1.5px ${ACCENT.lift}, 0 12px 28px -18px ${ACCENT.base}`
                      : 'var(--bars-shadow-inset-top), 0 0 0 1px var(--bars-line)',
                  }}
                >
                  <span className="bars-label" style={{ display: 'block', color: ACCENT.lift }}>{l.eyebrow}</span>
                  <p style={{ margin: '9px 0 0', fontSize: 16.5, lineHeight: 1.5, color: '#fff', fontFamily: 'var(--bars-font-display)', fontWeight: 600, textWrap: 'pretty' }}>
                    {l.headline}
                  </p>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 13 }}>
                    <span style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                      <strong style={{ color: '#e8e6e0' }}>You will build:</strong> {l.builds}
                    </span>
                    <span style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                      <strong style={{ color: '#e8e6e0' }}>Who can use it:</strong> {l.whoCanUse}
                    </span>
                    <span style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                      <strong style={{ color: '#e8e6e0' }}>What happens to it:</strong> {l.whatHappens}
                    </span>
                  </span>
                  {l.caution ? (
                    <p style={{ margin: '13px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)', textWrap: 'pretty' }}>{l.caution}</p>
                  ) : null}
                </button>
              )
            })}
          </div>

          <span className="bars-label" style={{ display: 'block', margin: '24px 0 11px', color: 'var(--bars-text-muted)' }}>book-promotion starters · optional</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {DAY_TEN_STARTERS.map((s) => {
              const on = starter === s.key
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    const next = on ? null : s.key
                    setStarter(next)
                    if (next) { setLane(s.lane); track({ event: 'week_two_lane_chosen', day: 10, lane: s.lane }) }
                  }}
                  style={{
                    ...mono, fontSize: 11.5, letterSpacing: '.1em', textTransform: 'uppercase', padding: '13px 15px',
                    minHeight: 44, borderRadius: 9, cursor: 'pointer',
                    color: on ? '#fff' : 'var(--bars-text-secondary)',
                    background: on ? 'var(--bars-liminal)' : 'var(--bars-surface-inset)',
                    border: `1px solid ${on ? 'var(--bars-liminal)' : 'var(--bars-line-strong)'}`,
                  }}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
          {starterDef ? (
            <div style={{ marginTop: 12, padding: '14px 15px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: '2px solid var(--bars-gold)' }}>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: '#e8e6e0', textWrap: 'pretty' }}>{starterDef.blurb}</p>
              <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)', textWrap: 'pretty' }}>
                {hasOpenRoute ? DAY_TEN_STARTER_CAVEAT : NO_OPEN_PARTICIPATION_NOTE}
              </p>
            </div>
          ) : null}

          <div style={{ marginTop: 22 }}>
            <PrimaryButton onClick={() => { if (!lane) setLane('personal'); go('build') }} block glow>
              {shared ? 'Build the Shared Work Handoff →' : 'Build the Allyship Rhythm →'}
            </PrimaryButton>
          </div>

          <div style={{ marginTop: 30, paddingTop: 18, borderTop: '1px solid var(--bars-line)' }}>
            <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>lane c · an earlier move is still live</span>
            <p style={{ margin: '10px 0 12px', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
              The invitation, the story, or the capacity still needs attention before I build a structure around it. Choosing
              this is a complete and useful response to the page.
            </p>
            {returnDoorList}
          </div>
        </Step>
      ) : null}

      {screen === 'build' ? (
        <Step>
          <BackLink onClick={() => go('lane')} />
          <StepEyebrow color={ACCENT.lift}>step three · {shared ? 'a Shared Work Handoff' : 'an Allyship Rhythm'}</StepEyebrow>
          <StepTitle size={27}>
            {shared
              ? 'Make the next action legible to the person who will carry it.'
              : 'Give future you a rhythm that fits in a real week.'}
          </StepTitle>
          <StepBody>
            {shared
              ? 'A shared handoff tells someone what this piece of work is for, what happens next, who owns it, what is optional, and when the work comes back for review. Write only what you have standing to offer or decide.'
              : 'A rhythm holds one useful action in a place you can actually reach. Make it small enough that you can put it on a calendar, in a note you will open, or beside a recurring moment you already have.'}
          </StepBody>

          {shared ? (
            <div style={{ marginTop: 16, padding: '14px 15px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: `2px solid ${ACCENT.base}` }}>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>{DAY_TEN_THIRD_PARTY_NOTE}</p>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            {(shared ? DAY_TEN_HANDOFF_FIELDS : DAY_TEN_RHYTHM_FIELDS).map((f, i) =>
              <div key={f.key}>
                {fieldCard(
                  i + 1,
                  f.label,
                  f.prompt,
                  (shared ? handoff : rhythm)[f.key] ?? '',
                  (v) => (shared ? setHandoff : setRhythm)((c) => ({ ...c, [f.key]: v })),
                  f.placeholder,
                )}
              </div>,
            )}
          </div>

          {shared ? null : (
            <div style={{ marginTop: 16, padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', boxShadow: '0 0 0 1px rgba(201,168,76,.35)' }}>
              <button
                type="button"
                aria-expanded={bookOpen}
                onClick={() => setBookOpen((o) => !o)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', minHeight: 44, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
              >
                <span>
                  <span style={{ display: 'block', fontFamily: 'var(--bars-font-display)', fontWeight: 600, fontSize: 16.5, color: '#fff' }}>Book Handoff Rhythm · optional</span>
                  <span className="bars-label" style={{ display: 'block', marginTop: 4, color: 'var(--bars-gold)' }}>one thoughtful recommendation, at a rhythm you can keep</span>
                </span>
                <span aria-hidden style={{ ...mono, flex: 'none', fontSize: 15, color: 'var(--bars-text-muted)' }}>{bookOpen ? '−' : '+'}</span>
              </button>
              {bookOpen ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14 }}>
                  <input aria-label="The person or kind of group I will consider" value={book.who} onChange={(e) => setBook((b) => ({ ...b, who: e.target.value }))} placeholder="The person or kind of group I will consider…" style={{ ...fieldStyle, marginTop: 0 }} />
                  <input aria-label="Why this book could be useful to them" value={book.why} onChange={(e) => setBook((b) => ({ ...b, why: e.target.value }))} placeholder="Why this book could be useful to them…" style={{ ...fieldStyle, marginTop: 0 }} />
                  <input aria-label="The one sentence that leaves their choice intact" value={book.line} onChange={(e) => setBook((b) => ({ ...b, line: e.target.value }))} placeholder="The one sentence that leaves their choice intact…" style={{ ...fieldStyle, marginTop: 0 }} />
                  <p style={{ margin: '2px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)', textWrap: 'pretty' }}>
                    My boundary: I will follow up only when they invite more conversation.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {artifactBlock(
            shared
              ? 'Copy it into the document, message, shared space, or meeting where the intended person can use it. While you are still waiting on their agreement to receive it, keep it as a draft and choose the Prepared state.'
              : 'Copy it into the calendar, task list, notebook, or reminder system you actually use. Then create the first instance now. The structure is placed once future you can encounter it without having to remember this page.',
            shared ? 'copy the Shared Work Handoff' : 'copy my Allyship Rhythm',
          )}

          <div style={{ marginTop: 22 }}>
            <PrimaryButton onClick={() => go('land')} block glow>Tell the truth about where it landed →</PrimaryButton>
          </div>
        </Step>
      ) : null}

      {screen === 'land' ? (
        <Step>
          <BackLink onClick={() => go('build')} />
          <StepEyebrow color={ACCENT.lift}>step four · the honest state</StepEyebrow>
          <StepTitle size={27}>Can someone use it from here?</StepTitle>
          <StepBody>
            Choose the sentence that describes the handoff&rsquo;s current state. This tells you what the next move is. No state
            earns a score, a reward, or a role.
          </StepBody>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 20 }}>
            {DAY_TEN_PLACEMENTS.map((p) => {
              const selected = placement === p.key
              return (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => { setPlacement(p.key); setAttested(false) }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: 19, cursor: 'pointer',
                    borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', border: 'none',
                    boxShadow: selected
                      ? `var(--bars-shadow-inset-top), 0 0 0 1.5px ${p.color}, 0 12px 28px -18px ${p.color}`
                      : 'var(--bars-shadow-inset-top), 0 0 0 1px var(--bars-line)',
                  }}
                >
                  <span style={{ display: 'block', fontFamily: 'var(--bars-font-display)', fontWeight: 600, fontSize: 17, color: '#fff', textWrap: 'pretty' }}>{p.label}</span>
                  <span className="bars-label" style={{ display: 'block', marginTop: 5, color: p.color }}>{p.tag}</span>
                  <p style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>{p.body}</p>
                </button>
              )
            })}
          </div>

          {placement === 'placed' ? (
            <>
              <label
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 13, marginTop: 16, padding: '16px 17px', cursor: 'pointer',
                  borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)',
                  boxShadow: `0 0 0 ${attested ? '1.5px #6fc795' : '1px var(--bars-line-strong)'}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={attested}
                  onChange={(e) => setAttested(e.target.checked)}
                  style={{ flex: 'none', width: 22, height: 22, marginTop: 1, accentColor: '#6fc795' }}
                />
                <span style={{ flex: 1, fontSize: 15, lineHeight: 1.55, color: '#e8e6e0', textWrap: 'pretty' }}>{dayTenAttestation(lane)}</span>
              </label>
              <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)', textWrap: 'pretty' }}>{DAY_TEN_ATTESTATION_NOTE}</p>
            </>
          ) : null}

          {placement === 'returned' ? (
            <div style={{ marginTop: 16 }}>
              <span className="bars-label" style={{ display: 'block', marginBottom: 10, color: 'var(--bars-text-muted)' }}>which move is still live?</span>
              {returnDoorList}
            </div>
          ) : null}

          <div style={{ marginTop: 22 }}>
            {landReady ? (
              <PrimaryButton
                onClick={() => {
                  if (placement) track({ event: 'week_two_state_chosen', day: 10, state: placement })
                  go('comeback')
                }}
                block
                glow
              >
                What did the placement teach you? →
              </PrimaryButton>
            ) : (
              <span
                aria-disabled
                style={{
                  display: 'block', textAlign: 'center', fontFamily: 'var(--bars-font-display)', fontWeight: 700, fontSize: 16,
                  padding: 16, borderRadius: 'var(--bars-radius-lg)', color: 'var(--bars-text-muted)',
                  background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line-strong)',
                }}
              >
                {placement === null ? 'Choose the honest state to continue' : 'Confirm the placement above to continue'}
              </span>
            )}
          </div>
        </Step>
      ) : null}

      {screen === 'comeback' ? (
        <Step>
          <BackLink onClick={() => go('land')} />
          <StepEyebrow color={ACCENT.lift}>step five · come back</StepEyebrow>
          <StepTitle size={27}>What did the placement teach you?</StepTitle>
          <StepBody>
            {DAY_TEN_COME_BACK_QUESTION} This page cannot know whether you will return later — so take the question with you.
          </StepBody>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 20 }}>
            {DAY_TEN_LEARNINGS.map((l) => {
              const selected = learning === l.key
              return (
                <button
                  key={l.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setLearning(l.key)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: 19, cursor: 'pointer',
                    borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', border: 'none',
                    boxShadow: selected
                      ? `var(--bars-shadow-inset-top), 0 0 0 1.5px ${ACCENT.lift}`
                      : 'var(--bars-shadow-inset-top), 0 0 0 1px var(--bars-line)',
                  }}
                >
                  <span style={{ display: 'block', fontFamily: 'var(--bars-font-display)', fontWeight: 600, fontSize: 17, color: '#fff', textWrap: 'pretty' }}>{l.label}</span>
                  <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>{l.body}</p>
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 18, padding: 17, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: '2px solid var(--bars-liminal-glow)' }}>
            <StepEyebrow color="var(--bars-liminal-glow)">a line for your own reminder system</StepEyebrow>
            <input aria-label="Return date" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} style={fieldStyle} />
            <p style={{ ...mono, margin: '11px 0 0', fontSize: 13.5, lineHeight: 1.6, color: '#e8e6e0', textWrap: 'pretty' }}>{reminderLine}</p>
            <div style={{ marginTop: 12 }}>
              <OutlineButton onClick={() => copy(reminderLine, setCopiedReminder)}>{copiedReminder ? 'copied ♦' : 'copy this line'}</OutlineButton>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)', textWrap: 'pretty' }}>
              The reminder lives in your system. This page keeps no date and sends no reminder.
            </p>
          </div>

          <div style={{ marginTop: 22 }}>
            <PrimaryButton onClick={() => go('receipt')} block glow>Close the day →</PrimaryButton>
          </div>
        </Step>
      ) : null}

      {screen === 'receipt' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>your Day 10 receipt</StepEyebrow>
          <StepTitle size={28}>{dayTenReceiptHeadline(placement)}</StepTitle>
          <StepBody top={12}>
            Week 2 closes with a handoff: something future you or another person can use to take the next step. Run the loop
            again when the work needs another pass.
          </StepBody>

          <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            <span style={{ ...mono, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', padding: '9px 12px', borderRadius: 7, color: 'var(--bars-text-secondary)', border: '1px solid var(--bars-line-strong)' }}>
              Day 10 explored
            </span>
            <span
              style={{
                ...mono, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', padding: '9px 12px', borderRadius: 7,
                color: placementDef ? placementDef.color : 'var(--bars-text-muted)',
                border: placementDef ? `1px solid ${placementDef.color}8c` : '1px dashed var(--bars-line-strong)',
              }}
            >
              {dayTenStateChip(placement, lane)}
            </span>
          </div>

          <div style={{ marginTop: 16, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', padding: '6px 18px 16px' }}>
            <div style={{ padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
              <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>lane</span>
              <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15.5, lineHeight: 1.5, color: '#e8e6e0' }}>{laneDef?.builds ?? 'no lane chosen'}</p>
            </div>
            {(shared ? DAY_TEN_HANDOFF_FIELDS : DAY_TEN_RHYTHM_FIELDS).map((f) => {
              const raw = ((shared ? handoff : rhythm)[f.key] ?? '').trim()
              const value = raw || (f.key === 'return' ? dateLabel : '')
              return (
                <div key={f.key} style={{ padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>{f.label.toLowerCase()}</span>
                  <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15.5, lineHeight: 1.5, color: value ? '#e8e6e0' : 'var(--bars-text-muted)', textWrap: 'pretty' }}>
                    {value || '— left blank'}
                  </p>
                </div>
              )
            })}
            {chosen ? (
              <p style={{ ...mono, margin: '13px 0 0', fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase', color: ACCENT.lift }}>
                ◇ played through {chosen.title} · #{chosen.num}
              </p>
            ) : null}
          </div>

          {placement === 'prepared' ? (
            <div style={{ marginTop: 16, padding: '16px 17px', borderRadius: 'var(--bars-radius-lg)', border: '1px dashed var(--bars-line-strong)' }}>
              <StepEyebrow color="var(--bars-gold)">choose a placement</StepEyebrow>
              <p style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
                You have something concrete. Decide where it will land before calling it a finished structure — a calendar, a
                shared document, a consented message, a meeting.
              </p>
            </div>
          ) : null}

          <div style={{ marginTop: 22 }}>
            <OutlineButton onClick={() => copy(artifactText, setCopiedArtifact)} block strong>
              {copiedArtifact ? 'copied ♦' : shared ? 'copy the Shared Work Handoff' : 'copy my Allyship Rhythm'}
            </OutlineButton>
          </div>

          <NextDayHandoff
            handoff={tomorrow}
            href={tomorrow?.route ?? undefined}
            onNavigate={() => track({ event: 'week_two_next_day_clicked', day: 10 })}
            accent={ACCENT.lift}
          />

          <span className="bars-label" style={{ display: 'block', margin: '28px 0 12px', color: 'var(--bars-text-muted)' }}>next steps</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {facesHref ? (
              <a href={facesHref} style={doorStyle}>
                See the Six Faces of the organization <span aria-hidden style={{ flex: 'none', color: ACCENT.lift }}>→</span>
              </a>
            ) : null}
            <a href="/organization" onClick={() => track({ event: 'week_two_campaign_state_clicked', day: 10 })} style={doorStyle}>
              See current MTGOA work <span aria-hidden style={{ flex: 'none', color: ACCENT.lift }}>→</span>
            </a>
            <a href={bookHref} style={doorStyle}>
              Read the book <span aria-hidden style={{ flex: 'none', color: ACCENT.lift }}>→</span>
            </a>
            <a href={deckHref} style={doorStyle}>
              Use the Allyship Deck for the next move <span aria-hidden style={{ flex: 'none', color: ACCENT.lift }}>→</span>
            </a>
          </div>

          <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid var(--bars-line)' }}>
            <span className="bars-label" style={{ display: 'block', marginBottom: 10, color: 'var(--bars-text-muted)' }}>or return to the move that is still live</span>
            {returnDoorList}
          </div>

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <BackLink onClick={() => go('comeback')} />
            <TextButton onClick={() => { setRhythm({}); setHandoff({}); setBook({ who: '', why: '', line: '' }); setPlacement(null); setAttested(false); setLearning(null); setReturnDate(''); setChosen(null); go('build') }}>
              Build another handoff
            </TextButton>
          </div>
          <PrivacyLine>Session-only · nothing you write is stored, sent, or saved as a course answer</PrivacyLine>
        </Step>
      ) : null}
    </CheckShell>
  )
}
