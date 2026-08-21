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
import type { MoveCard } from '@/lib/allyship-deck/types'
import { MOVE_ELEMENT } from '@/lib/allyship-deck/card-visuals'
import { linkableRoute, mtgoaCourseDay, nextCourseDay } from '@/lib/mtgoa-course/course-days'
import {
  ALLYSHIP_RHYTHM_FIELDS,
  CAMPAIGN_HANDOFF_FIELDS,
  ROUND_TWO_COME_BACK,
  ROUND_TWO_LANES,
  ROUND_TWO_STATES,
  roundTwoEvidence,
} from '@/lib/mtgoa-course/round-two'
import type { RoundTwoDay, RoundTwoLane, RoundTwoState } from '@/lib/mtgoa-course/round-two'
import type { MtgoaOrganizationState } from '@/lib/mtgoa-course/organization-state'
import { NO_OPEN_PARTICIPATION_NOTE } from '@/lib/mtgoa-course/organization-state'
import type { RoundTwoAnalyticsEvent } from '@/lib/mtgoa-course/round-two-events'

/**
 * The Week 2 course day — one component for Days 6 through 10.
 *
 * Week 1's days were each authored separately and each got its own component.
 * Week 2's spec gives every day the same shape, so the days are data in
 * `round-two.ts` and this renders them. Day 10 adds the lane fork and the
 * artifact builder; the other four share one path.
 *
 * The element comes from the move, as everywhere else — so Day 6 is earth, Day 7
 * liminal, Day 8 water, Day 9 wood, Day 10 fire, matching Days 1–5 exactly.
 * A reader walking the second loop should recognise the colour of each move.
 *
 * `orgState` arrives from the Server Component so the public campaign panel has
 * no client fetch and no waterfall. It is public state, and it must never look
 * like the course remembering the reader's own work.
 */

type Screen = 'entry' | 'prompts' | 'draw' | 'lane' | 'artifact' | 'state' | 'comeback' | 'receipt'

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
  const isFinalDay = day.move === 'show_up'
  const order: Screen[] = useMemo(
    () =>
      isFinalDay
        ? ['entry', 'draw', 'lane', 'artifact', 'state', 'comeback', 'receipt']
        : ['entry', 'prompts', 'draw', 'state', 'receipt'],
    [isFinalDay],
  )

  const [screen, setScreen] = useState<Screen>('entry')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [artifact, setArtifact] = useState<Record<string, string>>({})
  const [lane, setLane] = useState<RoundTwoLane | null>(null)
  const [sampler, setSampler] = useState<MoveCard[]>([])
  const [carried, setCarried] = useState<MoveCard | null>(null)
  const [sheetCard, setSheetCard] = useState<MoveCard | null>(null)
  const [state, setState] = useState<RoundTwoState | null>(null)
  const [comeBack, setComeBack] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    track({ event: 'week_two_viewed', day: day.day })
    setSampler(drawThree(cards))
  }, [day.day, cards])

  const element = MOVE_ELEMENT[day.move]
  const accent = ACCENTS[element] ?? ACCENTS.earth

  const tomorrow = nextCourseDay(day.day)
  const laneDef = ROUND_TWO_LANES.find((l) => l.key === lane) ?? null
  const artifactFields = lane === 'local_team' ? CAMPAIGN_HANDOFF_FIELDS : ALLYSHIP_RHYTHM_FIELDS

  const go = (next: Screen) => { setScreen(next); window.scrollTo(0, 0) }
  const back = () => go(order[Math.max(0, order.indexOf(screen) - 1)])

  const write = (key: string, value: string) => setAnswers((c) => ({ ...c, [key]: value }))
  const writeArtifact = (key: string, value: string) => setArtifact((c) => ({ ...c, [key]: value }))

  const chooseSheetCard = () => {
    if (!sheetCard) return
    const next = carried?.id === sheetCard.id ? null : sheetCard
    setCarried(next)
    if (next) track({ event: 'week_two_card_carried', day: day.day, cardId: next.id })
    setSheetCard(null)
  }

  const answered = day.prompts.filter((p) => (answers[p.key] ?? '').trim()).length
  const artifactAnswered = artifactFields.filter((f) => (artifact[f.key] ?? '').trim()).length
  const evidence = roundTwoEvidence({ day: day.day, answered: answered + artifactAnswered, carried: !!carried, state })

  /** Assembled from the reader's own words, for them to copy. Never sent. */
  const artifactText = [
    `${laneDef?.artifact ?? 'Week 2 artifact'} — Day ${day.day}`,
    ...artifactFields.map((f) => {
      const v = (artifact[f.key] ?? '').trim()
      return v ? `${f.label}: ${v}` : null
    }).filter(Boolean),
  ].join('\n')

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

          {/* Public campaign state. Collapsed by default so it informs without
              taking the top of the page from the practice. */}
          <div style={{ marginTop: 22, borderTop: '1px solid var(--bars-line)', paddingTop: 18 }}>
            <button
              type="button"
              onClick={() => { setPanelOpen((o) => !o); if (!panelOpen) track({ event: 'week_two_state_panel_opened', day: day.day }) }}
              style={{
                ...mono, fontSize: 'var(--bars-text-2xs)', letterSpacing: '.08em', textTransform: 'uppercase',
                color: 'var(--bars-gold)', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', minHeight: 44,
              }}
            >
              {panelOpen ? '− what is already happening' : '+ what is already happening'}
            </button>

            {panelOpen ? (
              <div style={{ marginTop: 10 }}>
                <p className="bars-prose" style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
                  {orgState.campaignSummary}
                </p>

                <span className="bars-label" style={{ display: 'block', marginTop: 16, color: 'var(--bars-text-muted)' }}>true right now</span>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--bars-text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                  {orgState.currentTruths.map((t) => <li key={t}>{t}</li>)}
                </ul>

                <span className="bars-label" style={{ display: 'block', marginTop: 16, color: 'var(--bars-text-muted)' }}>and not true right now</span>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--bars-text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
                  {orgState.notCurrentlyTrue.map((t) => <li key={t}>{t}</li>)}
                </ul>

                {/* The spec's rule: with nothing approved, say so and send the
                    reader to the personal lane. Never invent a vacancy. */}
                {hasOpenRoute ? null : (
                  <div
                    style={{
                      marginTop: 16, padding: 15, borderRadius: 'var(--bars-radius-lg)',
                      background: 'var(--bars-surface-card)', border: '1px dashed var(--bars-line-strong)',
                    }}
                  >
                    <p className="bars-prose" style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
                      {NO_OPEN_PARTICIPATION_NOTE}
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
                  {orgState.relatedSurfaces.map((s) => (
                    <a
                      key={s.href}
                      href={s.href}
                      onClick={() => track({ event: 'week_two_campaign_state_clicked', day: day.day })}
                      style={{ ...mono, fontSize: 'var(--bars-text-2xs)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--bars-gold)', textDecoration: 'none' }}
                    >
                      {s.label} →
                    </a>
                  ))}
                </div>

                <p style={{ ...mono, margin: '16px 0 0', fontSize: 'var(--bars-text-2xs)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
                  last updated {orgState.updatedAt} · next review by {orgState.nextReviewAt}
                </p>
              </div>
            ) : null}
          </div>

          <div style={{ marginTop: 26 }}>
            <PrimaryButton
              onClick={() => { track({ event: 'week_two_started', day: day.day }); go(isFinalDay ? 'draw' : 'prompts') }}
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
          <StepEyebrow color={accent.lift}>{`the ${day.practice.name.toLowerCase()}`}</StepEyebrow>
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
            <OutlineButton onClick={() => { track({ event: 'week_two_draw_skipped', day: day.day }); go(isFinalDay ? 'lane' : 'state') }}>
              skip the draw →
            </OutlineButton>
          </div>
          <StepFooter back={back} next={{ label: 'continue →', onClick: () => go(isFinalDay ? 'lane' : 'state') }} />
        </Step>
      ) : null}

      {screen === 'lane' ? (
        <Step>
          <StepEyebrow color={accent.lift}>step 2 · choose a lane</StepEyebrow>
          <StepTitle>What are you organizing?</StepTitle>
          <StepBody>
            Both are real, and they are different commitments. Working alone counts — &ldquo;Owner: me&rdquo; is a valid answer.
          </StepBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            {ROUND_TWO_LANES.map((l) => (
              <SelectRow
                key={l.key}
                selected={lane === l.key}
                onClick={() => { const n = lane === l.key ? null : l.key; setLane(n); if (n) track({ event: 'week_two_lane_chosen', day: day.day, lane: n }) }}
              >
                <span className="bars-title" style={{ display: 'block', fontSize: 17, color: '#fff' }}>{l.label}</span>
                <span className="bars-prose" style={{ display: 'block', marginTop: 5, fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                  {l.body}
                </span>
                <span className="bars-label" style={{ display: 'block', marginTop: 8, color: accent.lift }}>
                  {`you will build: ${l.artifact}`}
                </span>
              </SelectRow>
            ))}
          </div>
          {lane === 'local_team' && !hasOpenRoute ? (
            <div
              style={{
                marginTop: 18, padding: 15, borderRadius: 'var(--bars-radius-lg)',
                background: 'var(--bars-surface-inset)', border: '1px dashed var(--bars-line-strong)',
              }}
            >
              <p className="bars-prose" style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
                {NO_OPEN_PARTICIPATION_NOTE} You can still build the handoff for a group you already belong to.
              </p>
            </div>
          ) : null}
          <StepFooter back={back} next={{ label: 'build it →', onClick: () => go('artifact') }} />
        </Step>
      ) : null}

      {screen === 'artifact' ? (
        <Step>
          <StepEyebrow color={accent.lift}>step 3 · {laneDef?.artifact ?? 'the artifact'}</StepEyebrow>
          <StepTitle>One page someone can act on.</StepTitle>
          <StepBody>{day.entry}</StepBody>
          {artifactFields.map((f) => (
            <PrivateField
              key={f.key}
              id={`w2-artifact-${f.key}`}
              label={`${f.label} · stays in your browser`}
              value={artifact[f.key] ?? ''}
              onChange={(v) => writeArtifact(f.key, v)}
              placeholder={f.placeholder}
              rows={3}
            />
          ))}
          {artifactAnswered > 0 ? (
            <div
              style={{
                marginTop: 24, padding: '15px 16px', borderRadius: 'var(--bars-radius-lg)',
                background: 'var(--bars-surface-inset)', border: '1px solid var(--bars-line)',
              }}
            >
              <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>yours to paste somewhere real</span>
              <pre
                style={{
                  margin: '10px 0 0', whiteSpace: 'pre-wrap', fontFamily: 'var(--bars-font-body)',
                  fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-primary)',
                }}
              >
                {artifactText}
              </pre>
              <div style={{ marginTop: 12 }}>
                <PrimaryButton
                  compact
                  onClick={() => {
                    void navigator.clipboard?.writeText(artifactText).catch(() => {})
                    setCopied(true)
                    track({ event: 'week_two_artifact_copied', day: day.day, lane: lane ?? undefined })
                  }}
                >
                  {copied ? 'copied ✓' : 'copy it'}
                </PrimaryButton>
              </div>
            </div>
          ) : null}
          <StepFooter back={back} next={{ label: 'where did it land? →', onClick: () => go('state') }} />
          <PrivacyLine>{day.doNot}</PrivacyLine>
        </Step>
      ) : null}

      {screen === 'state' ? (
        <Step>
          <StepEyebrow color={accent.lift}>what is true right now</StepEyebrow>
          <StepTitle>{isFinalDay ? 'Can someone use it?' : 'Where did today land?'}</StepTitle>
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
                  go(isFinalDay ? 'comeback' : 'receipt')
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

      {screen === 'comeback' ? (
        <Step>
          <StepEyebrow color={accent.lift}>come back · after the loop</StepEyebrow>
          <StepTitle>{ROUND_TWO_COME_BACK.question}</StepTitle>
          <StepBody>Contact teaches something a plan cannot. This is the part the course is actually for.</StepBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            {ROUND_TWO_COME_BACK.answers.map((a) => {
              const target = a.returnToDay ? mtgoaCourseDay(a.returnToDay) : null
              const route = target ? linkableRoute(target) : null
              return (
                <SelectRow
                  key={a.key}
                  selected={comeBack === a.key}
                  onClick={() => {
                    setComeBack(a.key)
                    if (a.returnToDay) track({ event: 'week_two_returned_to_day', day: day.day, returnedToDay: a.returnToDay })
                  }}
                >
                  <span className="bars-title" style={{ display: 'block', fontSize: 16, color: '#fff' }}>{a.label}</span>
                  <span className="bars-prose" style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                    {a.body}
                  </span>
                  {comeBack === a.key && route ? (
                    <span className="bars-label" style={{ display: 'block', marginTop: 8, color: accent.lift }}>
                      {`Day ${a.returnToDay} is at ${route}`}
                    </span>
                  ) : null}
                </SelectRow>
              )
            })}
          </div>
          <StepFooter back={back} next={{ label: `see my Day ${day.day} receipt →`, onClick: () => { track({ event: 'week_two_completed', day: day.day, state: state ?? undefined }); go('receipt') } }} />
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
            {isFinalDay ? artifactFields.map((f) => (
              <ReceiptRow key={f.key} label={f.label} value={(artifact[f.key] ?? '').trim() || null} />
            )) : null}
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
            {answered === 0 && artifactAnswered === 0 && !carried ? (
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
            <TextButton onClick={() => { setAnswers({}); setArtifact({}); setLane(null); setCarried(null); setState(null); setComeBack(null); setCopied(false); setSampler(drawThree(cards)); go('entry') }}>
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
