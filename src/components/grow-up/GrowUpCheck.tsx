'use client'

import { useEffect, useMemo, useState } from 'react'

import { CardDrawRow, CardDrawSheet } from '@/components/deck/CardDraw'
import {
  BackLink,
  Chip,
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
} from '@/components/mtgoa-check/CheckKit'
import type { CheckAccent } from '@/components/mtgoa-check/CheckKit'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { MTGOA_DOMAIN_RULE, linkableRoute, mtgoaCourseDay, nextCourseDay } from '@/lib/mtgoa-course/course-days'
import {
  GROW_UP_BELIEFS,
  GROW_UP_BOUNDARIES,
  GROW_UP_CARD_PROMPTS,
  GROW_UP_CONTAINERS,
  GROW_UP_HANDOFFS,
  GROW_UP_NO_BELIEF,
  GROW_UP_PRACTICES,
  GROW_UP_RECEIPT,
  GROW_UP_SCOPES,
  GROW_UP_SUPPORTS,
  GROW_UP_WHEN,
  GROW_UP_WHERE,
  composeGrowUpReminder,
  findGrowUpBelief,
  findGrowUpRep,
  growUpEvidence,
  growUpRepsFor,
} from '@/lib/grow-up/check-content'
import type { GrowUpScope } from '@/lib/grow-up/check-content'
import type { GrowUpAnalyticsEvent } from '@/lib/grow-up/events'
import { growUpBookHref, growUpDayOneHref, growUpDeckHref, growUpNextDayHref } from '@/lib/grow-up/outbound'
import { markCourseDayComplete } from '@/lib/mtgoa-course/mark-day-complete'

/**
 * MTGOA Grow Up Check — Day 4, the last gap in round 1.
 *
 * Two authorities. The prototype
 * (`.specify/specs/mtgoa-grow-up-check/design_handoff/`) supplies the authored
 * vocabulary and most of the flow. `MTGOA_DAYS_1_TO_5_HOSTILE_REVIEW_2026-08-21.md`
 * is newer and wins where they conflict; its three required changes are all here:
 *
 *  1. **Three equal starting-hand choices**, including "I am not sure yet", which
 *     routes back to Day 1 rather than pretending everyone has a usable network.
 *  2. **Capability, support and boundary together** — otherwise Grow Up collapses
 *     into emotional courage and endurance becomes the point. A clean "not today"
 *     is a capable move.
 *  3. **No fake chance.** Three of the six are dealt face-up with their Game
 *     Master attached. Choosing a face and then revealing its sole card would be
 *     a selection wearing a draw's clothes.
 *
 * Grow Up is the Wood move. Purple `--bars-liminal` stays the reserved
 * primary-action color.
 */

type Screen = 'entry' | 'hand' | 'belief' | 'draw' | 'rep' | 'land' | 'receipt'

const ORDER: Screen[] = ['entry', 'hand', 'belief', 'draw', 'rep', 'land', 'receipt']

/** Grow Up is Wood. `lift` is the jade raised for legibility at 10px mono. */
const ACCENT: CheckAccent = { base: 'var(--bars-wood-glow)', lift: '#3ec97a' }

const SITE_ORIGIN = 'https://masteringallyship.com'

function track(event: GrowUpAnalyticsEvent) {
  const body = JSON.stringify(event)
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/api/grow-up/events', new Blob([body], { type: 'application/json' }))
    return
  }
  void fetch('/api/grow-up/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true })
}

function drawThree(pool: MoveCard[]): MoveCard[] {
  const cards = [...pool]
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[cards[index], cards[swap]] = [cards[swap], cards[index]]
  }
  return cards.slice(0, 3)
}

export function GrowUpCheck({ queryString }: { queryString: string }) {
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
    if (screen === 'receipt') markCourseDayComplete(4)
  }, [screen])
  const [scope, setScope] = useState<GrowUpScope | null>(null)
  const [handoffs, setHandoffs] = useState<string[]>([])
  const [beliefKey, setBeliefKey] = useState<string | null>(null)
  const [sampler, setSampler] = useState<MoveCard[]>([])
  const [carried, setCarried] = useState<MoveCard | null>(null)
  const [sheetCard, setSheetCard] = useState<MoveCard | null>(null)
  const [repKey, setRepKey] = useState<string | null>(null)
  const [where, setWhere] = useState<string | null>(null)
  const [when, setWhen] = useState<string | null>(null)
  const [support, setSupport] = useState<string | null>(null)
  const [boundary, setBoundary] = useState<string | null>(null)
  const [extra, setExtra] = useState('')
  const [container, setContainer] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    track({ event: 'grow_up_check_viewed' })
    setSampler(drawThree(GROW_UP_PRACTICES))
  }, [])

  const deckHref = growUpDeckHref(search)
  const bookHref = growUpBookHref(search)

  const tomorrow = nextCourseDay(4)
  const nextHref = tomorrow?.route ? growUpNextDayHref(search, tomorrow.route) : undefined

  const dayOne = mtgoaCourseDay(1)
  const dayOneRoute = dayOne ? linkableRoute(dayOne) : null
  const dayOneHref = dayOneRoute ? growUpDayOneHref(search, dayOneRoute) : null

  const go = (next: Screen) => {
    setScreen(next)
    window.scrollTo(0, 0)
  }

  const back = () => {
    const index = ORDER.indexOf(screen)
    go(ORDER[Math.max(0, index - 1)])
  }

  const chooseScope = (next: GrowUpScope) => {
    const value = scope === next ? null : next
    setScope(value)
    if (value) track({ event: 'grow_up_scope_chosen', scope: value })
  }

  const toggleHandoff = (key: string) =>
    setHandoffs((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]))

  const chooseSheetCard = () => {
    if (!sheetCard) return
    const next = carried?.id === sheetCard.id ? null : sheetCard
    setCarried(next)
    if (next) track({ event: 'grow_up_card_carried', cardId: next.id })
    setSheetCard(null)
  }

  const restart = () => {
    setScope(null); setHandoffs([]); setBeliefKey(null); setCarried(null); setSheetCard(null)
    setRepKey(null); setWhere(null); setWhen(null); setSupport(null); setBoundary(null)
    setExtra(''); setContainer(null); setCopied(false)
    setSampler(drawThree(GROW_UP_PRACTICES))
    go('entry')
  }

  const belief = findGrowUpBelief(beliefKey)
  const rep = findGrowUpRep(repKey)
  const face = carried ? carried.operation : null
  const { suggested, rest } = growUpRepsFor(face)
  const containerDef = GROW_UP_CONTAINERS.find((c) => c.key === container) ?? null

  const reminder = composeGrowUpReminder({ repKey, where, when, boundary, origin: SITE_ORIGIN })

  const selectedHandoffs = GROW_UP_HANDOFFS.filter((h) => handoffs.includes(h.key))
  const evidence = growUpEvidence({
    scope,
    handoffs: handoffs.length,
    namedBelief: !!belief,
    carried: !!carried,
    hasRep: !!rep,
    hasBoundary: !!boundary,
    container: !!container,
  })
  const wroteSomething = !!(scope || handoffs.length || belief || carried || rep || container || extra.trim())

  return (
    <CheckShell label="Grow Up Check" moveTag="grow up · 木" accent={ACCENT} steps={ORDER.length} index={ORDER.indexOf(screen)}>
      {screen === 'entry' ? (
        <Step>
          <h1 className="bars-title" style={{ margin: 0, fontSize: 24, lineHeight: 1.15, color: 'var(--bars-gold)' }}>
            The Grow Up Check
          </h1>
          <span className="bars-label" style={{ display: 'block', marginTop: 8, color: 'var(--bars-text-muted)' }}>
            day 4 · before you ask it to be easy
          </span>
          <p
            className="bars-title"
            style={{ margin: '10px 0 0', fontSize: 'clamp(28px,5.5vw,38px)', lineHeight: 1.16, fontWeight: 700, color: 'var(--bars-text-primary)', textWrap: 'pretty' }}
          >
            Choose a capacity to practise.
          </p>
          <StepBody top={18}>
            One rep small enough to finish, notice, and learn something from — the capacity the next honest handoff will
            need.
          </StepBody>
          <StepBody top={14}>{MTGOA_DOMAIN_RULE}</StepBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 28 }}>
            <PrimaryButton onClick={() => { track({ event: 'grow_up_check_started' }); go('hand') }} block>
              Build one rep →
            </PrimaryButton>
          </div>
          <PrivacyLine>No sign-up. Nothing you write is saved or sent.</PrivacyLine>
        </Step>
      ) : null}

      {screen === 'hand' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>step 1 · the hand you have</StepEyebrow>
          <StepTitle>Who would actually take a recommendation from you?</StepTitle>
          <StepBody>
            Somewhere your word already carries a little weight. All three of these are real answers.
          </StepBody>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            {GROW_UP_SCOPES.map((option) => (
              <SelectRow key={option.key} selected={scope === option.key} onClick={() => chooseScope(option.key)}>
                <span className="bars-title" style={{ display: 'block', fontSize: 17, color: '#fff' }}>{option.label}</span>
                <span className="bars-prose" style={{ display: 'block', marginTop: 5, fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                  {option.body}
                </span>
              </SelectRow>
            ))}
          </div>

          {/* "Not sure yet" is a Day 1 question. The course does not pretend
              everyone arrives with a network they can already use. */}
          {scope === 'not_sure' ? (
            <div
              style={{
                marginTop: 20,
                padding: 17,
                borderRadius: 'var(--bars-radius-lg)',
                background: 'var(--bars-surface-inset)',
                borderLeft: `2px solid ${ACCENT.base}`,
              }}
            >
              <span className="bars-label" style={{ color: ACCENT.lift }}>then start further back</span>
              <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
                Day 4 builds a capacity for a handoff you can already picture. If one has yet to come into focus, that is the
                question Day 1 asks. You are welcome to keep going here anyway.
              </p>
              {dayOneHref ? (
                <div style={{ marginTop: 14 }}>
                  <a href={dayOneHref} onClick={() => track({ event: 'grow_up_returned_to_day_one', scope: 'not_sure' })} style={{ textDecoration: 'none' }}>
                    <OutlineButton onClick={() => {}} block strong>Go to Day 1 · Wake Up →</OutlineButton>
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}

          <div style={{ marginTop: 26 }}>
            <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>what could honestly change hands</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {GROW_UP_HANDOFFS.map((option) => (
                <SelectRow key={option.key} selected={handoffs.includes(option.key)} onClick={() => toggleHandoff(option.key)}>
                  <span className="bars-title" style={{ display: 'block', fontSize: 16, color: '#fff' }}>{option.label}</span>
                  <span className="bars-prose" style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                    {option.ask}
                  </span>
                </SelectRow>
              ))}
            </div>
          </div>

          <StepFooter back={back} next={{ label: 'continue →', onClick: () => go('belief') }} />
        </Step>
      ) : null}

      {screen === 'belief' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>step 2 · the line in the way</StepEyebrow>
          <StepTitle>What makes the handoff feel bigger than it is?</StepTitle>
          <StepBody>
            The same six lines from Day 1 and Day 3, in the shape they take around handing something over. Each one has a capacity
            on the other side of it — which is what today is for.
          </StepBody>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            {GROW_UP_BELIEFS.map((option) => (
              <SelectRow
                key={option.key}
                selected={beliefKey === option.key}
                onClick={() => {
                  const next = beliefKey === option.key ? null : option.key
                  setBeliefKey(next)
                  if (next) track({ event: 'grow_up_belief_named' })
                }}
              >
                <span className="bars-prose" style={{ display: 'block', fontSize: 16, lineHeight: 1.5, color: '#fff' }}>{option.voice}</span>
                {beliefKey === option.key ? (
                  <span className="bars-prose" style={{ display: 'block', marginTop: 8, fontSize: 14, lineHeight: 1.5, color: ACCENT.lift }}>
                    {`the capacity on the other side: ${option.capacity.toLowerCase()}`}
                  </span>
                ) : null}
              </SelectRow>
            ))}
            <SelectRow selected={beliefKey === 'none'} onClick={() => setBeliefKey(beliefKey === 'none' ? null : 'none')}>
              <span className="bars-prose" style={{ display: 'block', fontSize: 16, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                {GROW_UP_NO_BELIEF}
              </span>
            </SelectRow>
          </div>

          <StepFooter back={back} next={{ label: 'draw a Grow Up card →', onClick: () => go('draw') }} />
          <PrivacyLine>A reservation is a pattern to work with.</PrivacyLine>
        </Step>
      ) : null}

      {screen === 'draw' ? (
        <Step>
          <DeckRibbon>the allyship deck · grow up · raise awareness</DeckRibbon>
          <div style={{ marginTop: 20 }}>
            <StepEyebrow>step 3 · the draw</StepEyebrow>
            <StepTitle>Six ways a capacity grows.</StepTitle>
            <StepBody>
              Three of the six Grow Up cards for this campaign&rsquo;s field, each carrying a different Game Master&rsquo;s
              operation. They are verbs — six ways a thing grows. Choose one, deal again, or skip.
            </StepBody>
          </div>
          <div style={{ marginTop: 22 }}>
            <CardDrawRow cards={sampler} carriedId={carried?.id ?? null} onOpen={setSheetCard} accent={ACCENT.lift} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <OutlineButton onClick={() => { setSampler(drawThree(GROW_UP_PRACTICES)); setCarried(null); setRepKey(null) }}>
              deal three more
            </OutlineButton>
            <OutlineButton onClick={() => { track({ event: 'grow_up_draw_skipped' }); go('rep') }}>
              skip the draw →
            </OutlineButton>
          </div>
          <StepFooter back={back} next={{ label: 'build the rep →', onClick: () => go('rep') }} />
        </Step>
      ) : null}

      {screen === 'rep' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>step 4 · one notch bigger</StepEyebrow>
          <StepTitle>What is one notch bigger than today?</StepTitle>
          <StepBody>
            A rep small enough to complete, notice, and learn from.
          </StepBody>

          {carried ? (
            <div
              style={{
                marginTop: 20,
                padding: 17,
                borderRadius: 'var(--bars-radius-lg)',
                background: 'var(--bars-surface-card)',
                border: '1px solid var(--bars-line-strong)',
                boxShadow: 'var(--bars-shadow-inset-top)',
              }}
            >
              <span className="bars-label" style={{ color: 'var(--bars-gold)' }}>{`${carried.title} · what this card asks`}</span>
              <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
                {GROW_UP_CARD_PROMPTS[carried.id] ?? carried.remediation}
              </p>
            </div>
          ) : null}

          <div style={{ marginTop: 22 }}>
            <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>
              {suggested.length ? 'the rep · ◇ marks what your card leans toward' : 'the rep'}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              {[...suggested, ...rest].map((option) => {
                const isSuggested = suggested.some((s) => s.key === option.key)
                return (
                  <SelectRow
                    key={option.key}
                    selected={repKey === option.key}
                    onClick={() => {
                      const next = repKey === option.key ? null : option.key
                      setRepKey(next)
                      if (next) track({ event: 'grow_up_rep_chosen', cardId: carried?.id })
                    }}
                  >
                    <span className="bars-prose" style={{ display: 'block', fontSize: 16, lineHeight: 1.5, color: '#fff' }}>
                      {isSuggested ? <span style={{ color: ACCENT.lift }}>◇ </span> : null}
                      {`I will practise ${option.label}`}
                    </span>
                  </SelectRow>
                )
              })}
            </div>
          </div>

          <ChipGroup label="where" options={GROW_UP_WHERE} value={where} onChange={setWhere} />
          <ChipGroup label="when" options={GROW_UP_WHEN} value={when} onChange={setWhen} />

          {/* Capability, support and boundary together — otherwise the rep quietly
              becomes an endurance test. */}
          <ChipGroup label="I will make this possible by" options={GROW_UP_SUPPORTS} value={support} onChange={setSupport} />
          <div style={{ marginTop: 22 }}>
            <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>I will pause or stop if</span>
            <p className="bars-prose" style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)' }}>
              A clean &ldquo;not today&rdquo; is a capable move. Fuel is a real cost.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 12 }}>
              {GROW_UP_BOUNDARIES.map((option) => (
                <Chip key={option} selected={boundary === option} onClick={() => setBoundary(boundary === option ? null : option)}>
                  {option}
                </Chip>
              ))}
            </div>
          </div>

          <PrivateField
            id="grow-up-extra"
            label="in my own words · optional · private to this page"
            value={extra}
            onChange={setExtra}
            placeholder="Anything else about this rep…"
            rows={4}
          />

          <StepFooter back={back} next={{ label: 'give it a place to land →', onClick: () => go('land') }} />
        </Step>
      ) : null}

      {screen === 'land' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>step 5 · a rep</StepEyebrow>
          <StepTitle>Give it a place to land.</StepTitle>
          <StepBody>
            Choose a container for noticing what the rep teaches. Choosing one schedules nothing.
          </StepBody>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            {GROW_UP_CONTAINERS.map((option) => (
              <SelectRow
                key={option.key}
                selected={container === option.key}
                onClick={() => {
                  const next = container === option.key ? null : option.key
                  setContainer(next)
                  if (next) track({ event: 'grow_up_container_chosen' })
                }}
              >
                <span className="bars-title" style={{ display: 'block', fontSize: 16, color: '#fff' }}>{option.label}</span>
              </SelectRow>
            ))}
          </div>

          <div
            style={{
              marginTop: 24,
              padding: '15px 16px',
              borderRadius: 'var(--bars-radius-lg)',
              background: 'var(--bars-surface-inset)',
              border: '1px solid var(--bars-line)',
            }}
          >
            <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>reminder text · yours to paste anywhere</span>
            <p className="bars-prose" style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-primary)' }}>
              {reminder}
            </p>
            <div style={{ marginTop: 12 }}>
              <PrimaryButton
                compact
                onClick={() => {
                  void navigator.clipboard?.writeText(reminder).catch(() => {})
                  setCopied(true)
                  track({ event: 'grow_up_reminder_copied' })
                }}
              >
                {copied ? 'copied ✓' : 'copy the reminder'}
              </PrimaryButton>
            </div>
            <PrivacyLine align="left">nothing is scheduled for you</PrivacyLine>
          </div>

          <StepFooter
            back={back}
            next={{ label: 'see my Day 4 receipt →', onClick: () => { track({ event: 'grow_up_check_completed', cardId: carried?.id }); go('receipt') } }}
          />
        </Step>
      ) : null}

      {screen === 'receipt' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>{GROW_UP_RECEIPT.eyebrow}</StepEyebrow>
          <StepTitle size={30}>{GROW_UP_RECEIPT.title}</StepTitle>
          <StepBody>{GROW_UP_RECEIPT.body}</StepBody>

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
            {!wroteSomething ? (
              <p className="bars-prose" style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                {GROW_UP_RECEIPT.empty}
              </p>
            ) : (
              <>
                <ReceiptRow label="the rep" value={rep ? `I will practise ${rep.label}${where ? ` ${where}` : ''}${when ? ` ${when}` : ''}.` : null} />
                <ReceiptRow label="I will make it possible by" value={support} />
                <ReceiptRow label="I will pause if" value={boundary} />
                <ReceiptRow label="the hand I have" value={GROW_UP_SCOPES.find((s) => s.key === scope)?.label ?? null} />
                <ReceiptRow label={selectedHandoffs.length > 1 ? 'the handoffs' : 'the handoff'} value={selectedHandoffs.map((h) => h.label).join(' · ') || null} />
                <ReceiptRow label="the line in the way" value={belief ? `“${belief.belief}” → ${belief.capacity}` : null} />
                <ReceiptRow label="in my own words" value={extra.trim() || null} />
                <ReceiptRow label="where it lands" value={containerDef?.label ?? null} />
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

          <NextDayHandoff
            handoff={tomorrow}
            href={nextHref}
            onNavigate={() => track({ event: 'grow_up_next_day_clicked' })}
            accent={ACCENT.lift}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            <a href={bookHref} onClick={() => track({ event: 'grow_up_book_cta_clicked' })} style={{ textDecoration: 'none' }}>
              <OutlineButton onClick={() => {}} block strong>Haven&rsquo;t read it yet? Get the book before you recommend it →</OutlineButton>
            </a>
            <a href={deckHref} onClick={() => track({ event: 'grow_up_deck_cta_clicked' })} style={{ textDecoration: 'none' }}>
              <OutlineButton onClick={() => {}} block>Keep the card close. Explore the Allyship Deck →</OutlineButton>
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
            <p className="bars-prose" style={{ margin: '16px 0 0', fontSize: 'var(--bars-text-sm)', lineHeight: 1.6, color: 'var(--bars-text-muted)' }}>
              How the book reads this: Grow Up raises your throughput on Show Up. A rep you can finish teaches you more than a
              gesture you can only admire.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
            <BackLink onClick={back} />
            <TextButton onClick={restart}>draw a different card</TextButton>
          </div>
          <PrivacyLine>{GROW_UP_RECEIPT.closing}</PrivacyLine>
        </Step>
      ) : null}

      {sheetCard ? (
        <CardDrawSheet
          card={sheetCard}
          carried={carried?.id === sheetCard.id}
          onClose={() => setSheetCard(null)}
          onChoose={chooseSheetCard}
          accent={ACCENT.lift}
          accentText="#011309"
          chooseLabel="carry this card"
        />
      ) : null}
    </CheckShell>
  )
}

/** A labelled row of single-select chips. Selecting the active one clears it. */
function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly string[]
  value: string | null
  onChange: (next: string | null) => void
}) {
  return (
    <div style={{ marginTop: 22 }}>
      <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 12 }}>
        {options.map((option) => (
          <Chip key={option} selected={value === option} onClick={() => onChange(value === option ? null : option)}>
            {option}
          </Chip>
        ))}
      </div>
    </div>
  )
}
