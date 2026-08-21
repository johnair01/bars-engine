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
import { linkableRoute, mtgoaCourseDay, nextCourseDay } from '@/lib/mtgoa-course/course-days'
import {
  SHOW_UP_ARTIFACTS,
  SHOW_UP_BLOCKS,
  SHOW_UP_CARD_PROMPTS,
  SHOW_UP_CHANNELS,
  SHOW_UP_COME_BACK,
  SHOW_UP_CORE_OBJECT,
  SHOW_UP_DOMAIN_RULE,
  SHOW_UP_EARLIER_MOVES,
  SHOW_UP_PRACTICES,
  SHOW_UP_PUT_DOWN_OPTIONS,
  SHOW_UP_REASONS,
  SHOW_UP_RECEIPT,
  SHOW_UP_TIMINGS,
  canClaimHandoff,
  showUpEvidence,
} from '@/lib/show-up/check-content'
import type { ShowUpBlockKind, ShowUpState } from '@/lib/show-up/check-content'
import type { ShowUpAnalyticsEvent } from '@/lib/show-up/events'
import {
  showUpBookHref,
  showUpChapterHref,
  showUpDeckHref,
  showUpEarlierMoveHref,
  showUpNextDayHref,
} from '@/lib/show-up/outbound'

/**
 * MTGOA Show Up Check — Day 5, the end of round 1's loop.
 *
 * Built to MTGOA_DAYS_1_TO_5_HOSTILE_REVIEW_2026-08-21.md, which settled the
 * design before any copy existed. The three things that review is most insistent
 * about, and that this component must not quietly soften:
 *
 *  - **Prepared is not completed.** Three states, named separately on the receipt.
 *  - **No-send is data.** It forks on "unclear inside me" vs "not the right hand",
 *    and neither branch carries a failure label.
 *  - **A handoff needs a reason apart from a sale.** Claiming "I made it" requires
 *    naming what it gives the recipient whether or not they ever buy. That gates
 *    one *claim*, never the reader's progress — preparing, putting it down, and
 *    reaching the receipt all stay open with every field blank.
 *
 * Show Up is the Fire move. Purple `--bars-liminal` stays the reserved
 * primary-action color, as in every other day.
 */

type Screen = 'entry' | 'aim' | 'draw' | 'craft' | 'reason' | 'outcome' | 'comeback' | 'receipt'

const ORDER: Screen[] = ['entry', 'aim', 'draw', 'craft', 'reason', 'outcome', 'comeback', 'receipt']

/** Show Up is Fire. `lift` is the ember raised for legibility at 10px mono. */
const ACCENT: CheckAccent = { base: 'var(--bars-fire-glow)', lift: '#f0813a' }

function track(event: ShowUpAnalyticsEvent) {
  const body = JSON.stringify(event)
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/api/show-up/events', new Blob([body], { type: 'application/json' }))
    return
  }
  void fetch('/api/show-up/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true })
}

function drawThree(pool: MoveCard[]): MoveCard[] {
  const cards = [...pool]
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[cards[index], cards[swap]] = [cards[swap], cards[index]]
  }
  return cards.slice(0, 3)
}

export function ShowUpCheck({ queryString }: { queryString: string }) {
  const search = useMemo(() => new URLSearchParams(queryString), [queryString])

  const [screen, setScreen] = useState<Screen>('entry')
  const [room, setRoom] = useState('')
  const [channel, setChannel] = useState<string | null>(null)
  const [artifact, setArtifact] = useState<string | null>(null)
  const [timing, setTiming] = useState<string | null>(null)
  const [sentence, setSentence] = useState('')
  const [reasonKey, setReasonKey] = useState<string | null>(null)
  const [reasonOwn, setReasonOwn] = useState('')
  const [sampler, setSampler] = useState<MoveCard[]>([])
  const [carried, setCarried] = useState<MoveCard | null>(null)
  const [sheetCard, setSheetCard] = useState<MoveCard | null>(null)
  const [state, setState] = useState<ShowUpState | null>(null)
  const [blockKind, setBlockKind] = useState<ShowUpBlockKind | null>(null)
  const [happened, setHappened] = useState('')

  useEffect(() => {
    track({ event: 'show_up_check_viewed' })
    setSampler(drawThree(SHOW_UP_PRACTICES))
  }, [])

  const deckHref = showUpDeckHref(search)
  const bookHref = showUpBookHref(search)
  const chapterHref = showUpChapterHref(search)

  const tomorrow = nextCourseDay(5)
  const nextHref = tomorrow?.route ? showUpNextDayHref(search, tomorrow.route) : undefined

  // A reader may only claim a useful handoff once they can say what it gives the
  // recipient apart from a purchase. Every other exit stays open.
  const hasReason = !!(reasonKey && (reasonKey !== 'own_words' || reasonOwn.trim()))
  const mayClaim = canClaimHandoff(hasReason)

  const go = (next: Screen) => {
    setScreen(next)
    window.scrollTo(0, 0)
  }

  const back = () => {
    const index = ORDER.indexOf(screen)
    go(ORDER[Math.max(0, index - 1)])
  }

  const chooseState = (next: ShowUpState) => {
    setState(next)
    track({ event: 'show_up_state_chosen', state: next, cardId: carried?.id })
    if (next === 'put_down') track({ event: 'show_up_put_down', state: next })
    go('comeback')
  }

  const chooseSheetCard = () => {
    if (!sheetCard) return
    const next = carried?.id === sheetCard.id ? null : sheetCard
    setCarried(next)
    if (next) track({ event: 'show_up_card_carried', cardId: next.id })
    setSheetCard(null)
  }

  const restart = () => {
    setRoom(''); setChannel(null); setArtifact(null); setTiming(null); setSentence('')
    setReasonKey(null); setReasonOwn(''); setCarried(null); setSheetCard(null)
    setState(null); setBlockKind(null); setHappened('')
    setSampler(drawThree(SHOW_UP_PRACTICES))
    go('entry')
  }

  const artifactDef = SHOW_UP_ARTIFACTS.find((a) => a.key === artifact) ?? null
  const channelDef = SHOW_UP_CHANNELS.find((c) => c.key === channel) ?? null
  const timingDef = SHOW_UP_TIMINGS.find((t) => t.key === timing) ?? null
  const reasonDef = SHOW_UP_REASONS.find((r) => r.key === reasonKey) ?? null
  const reasonText = reasonKey === 'own_words' ? reasonOwn.trim() : reasonDef?.label ?? ''

  const receipt = state ? SHOW_UP_RECEIPT[state] : SHOW_UP_RECEIPT.prepared
  const evidence = showUpEvidence({
    aimed: !!(room.trim() || channel),
    carried: !!carried,
    hasReason,
    state,
    returned: !!(happened.trim() || blockKind),
  })

  return (
    <CheckShell label="Show Up Check" moveTag="show up · 火" accent={ACCENT} steps={ORDER.length} index={ORDER.indexOf(screen)}>
      {screen === 'entry' ? (
        <Step>
          <h1 className="bars-title" style={{ margin: 0, fontSize: 24, lineHeight: 1.15, color: 'var(--bars-gold)' }}>
            The Show Up Check
          </h1>
          <span className="bars-label" style={{ display: 'block', marginTop: 8, color: 'var(--bars-text-muted)' }}>
            day 5 · the move that leaves your hands
          </span>
          <p
            className="bars-title"
            style={{ margin: '10px 0 0', fontSize: 'clamp(28px,5.5vw,38px)', lineHeight: 1.16, fontWeight: 700, color: 'var(--bars-text-primary)', textWrap: 'pretty' }}
          >
            A handoff leaves your hands.
          </p>
          <StepBody top={18}>
            Four days of noticing, opening, clearing and practising were for this: making one thing that another person can
            actually receive, and putting it where they can reach it.
          </StepBody>
          <div
            style={{
              marginTop: 20,
              padding: 17,
              borderRadius: 'var(--bars-radius-lg)',
              background: 'var(--bars-surface-inset)',
              borderLeft: `2px solid ${ACCENT.base}`,
            }}
          >
            <span className="bars-label" style={{ color: ACCENT.lift }}>what counts as showing up today</span>
            <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
              {SHOW_UP_CORE_OBJECT}
            </p>
          </div>
          <StepBody top={16}>{SHOW_UP_DOMAIN_RULE}</StepBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 26 }}>
            <PrimaryButton onClick={() => { track({ event: 'show_up_check_started' }); go('aim') }} block>
              Aim one handoff →
            </PrimaryButton>
          </div>

          {/* Come Back re-entry. No saved context is implied, because none exists. */}
          <div style={{ marginTop: 26, paddingTop: 20, borderTop: '1px solid var(--bars-line)' }}>
            <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>coming back to this</span>
            <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
              {SHOW_UP_COME_BACK.reentry}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <OutlineButton onClick={() => { track({ event: 'show_up_reentry_chosen', state: 'shown_up' }); setState('shown_up'); go('comeback') }} strong>
                I made the handoff
              </OutlineButton>
              <OutlineButton onClick={() => { track({ event: 'show_up_reentry_chosen', state: 'prepared' }); setState('prepared'); go('comeback') }}>
                I did not make it yet
              </OutlineButton>
            </div>
            <PrivacyLine align="left">{SHOW_UP_COME_BACK.noMemory}</PrivacyLine>
          </div>
        </Step>
      ) : null}

      {screen === 'aim' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>step 1 · aim it</StepEyebrow>
          <StepTitle>Who, exactly — and how will it reach them?</StepTitle>
          <StepBody>
            One person or one room. A message to everyone is a message to no one.
          </StepBody>
          <PrivateField
            id="show-up-room"
            label="private to this page · stays in your browser"
            value={room}
            onChange={setRoom}
            placeholder="The person or room I have in mind is…"
            rows={3}
          />
          <div style={{ marginTop: 22 }}>
            <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>the channel</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 11 }}>
              {SHOW_UP_CHANNELS.map((option) => (
                <Chip
                  key={option.key}
                  selected={channel === option.key}
                  onClick={() => setChannel(channel === option.key ? null : option.key)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </div>
          <StepFooter
            back={back}
            next={{ label: 'draw a Show Up card →', onClick: () => { if (room.trim() || channel) track({ event: 'show_up_aimed' }); go('draw') } }}
          />
        </Step>
      ) : null}

      {screen === 'draw' ? (
        <Step>
          <DeckRibbon>the allyship deck · show up · raise awareness</DeckRibbon>
          <div style={{ marginTop: 20 }}>
            <StepEyebrow>step 2 · the draw</StepEyebrow>
            <StepTitle>Six ways to hand something over.</StepTitle>
            <StepBody>
              Three of the six Show Up cards for this campaign&rsquo;s field. Each carries a different Game Master&rsquo;s
              operation — a way of making the handoff. Choose one, deal again, or skip.
            </StepBody>
          </div>
          <div style={{ marginTop: 22 }}>
            <CardDrawRow cards={sampler} carriedId={carried?.id ?? null} onOpen={setSheetCard} accent={ACCENT.lift} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <OutlineButton onClick={() => { setSampler(drawThree(SHOW_UP_PRACTICES)); setCarried(null) }}>
              deal three more
            </OutlineButton>
            <OutlineButton onClick={() => { track({ event: 'show_up_draw_skipped' }); go('craft') }}>
              skip the draw →
            </OutlineButton>
          </div>
          <StepFooter back={back} next={{ label: 'build the handoff →', onClick: () => go('craft') }} />
        </Step>
      ) : null}

      {screen === 'craft' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>step 3 · build it</StepEyebrow>
          <StepTitle>What actually changes hands?</StepTitle>
          <StepBody>
            Something they can receive and use. Pick what you are handing over.
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
                {SHOW_UP_CARD_PROMPTS[carried.id] ?? carried.remediation}
              </p>
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            {SHOW_UP_ARTIFACTS.map((option) => (
              <SelectRow
                key={option.key}
                selected={artifact === option.key}
                onClick={() => setArtifact(artifact === option.key ? null : option.key)}
              >
                <span className="bars-title" style={{ display: 'block', fontSize: 16, color: '#fff' }}>{option.label}</span>
              </SelectRow>
            ))}
          </div>

          <PrivateField
            id="show-up-sentence"
            label="the actual sentence · private to this page"
            value={sentence}
            onChange={setSentence}
            placeholder="What I would actually say to them…"
            rows={5}
          />

          <div style={{ marginTop: 22 }}>
            <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>when</span>
            <p className="bars-prose" style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)' }}>
              A time you pick. Choose one when you will still have something left.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 12 }}>
              {SHOW_UP_TIMINGS.map((option) => (
                <Chip key={option.key} selected={timing === option.key} onClick={() => setTiming(timing === option.key ? null : option.key)}>
                  {option.label}
                </Chip>
              ))}
            </div>
          </div>

          <StepFooter back={back} next={{ label: 'what does it give them? →', onClick: () => go('reason') }} />
        </Step>
      ) : null}

      {screen === 'reason' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>step 4 · the test</StepEyebrow>
          <StepTitle>What does this give them, whether or not they buy it?</StepTitle>
          <StepBody>
            This is the whole difference between a handoff and an errand you are running for someone else&rsquo;s book. If the
            answer comes easily, send it. If nothing comes, that is real information.
          </StepBody>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            {SHOW_UP_REASONS.map((option) => (
              <SelectRow
                key={option.key}
                selected={reasonKey === option.key}
                onClick={() => setReasonKey(reasonKey === option.key ? null : option.key)}
              >
                <span className="bars-prose" style={{ display: 'block', fontSize: 16, lineHeight: 1.5, color: '#fff' }}>{option.label}</span>
              </SelectRow>
            ))}
          </div>

          {reasonKey === 'own_words' ? (
            <PrivateField
              id="show-up-reason-own"
              label="in my own words · private to this page"
              value={reasonOwn}
              onChange={setReasonOwn}
              placeholder="What it gives them is…"
              rows={4}
            />
          ) : null}

          <div
            style={{
              marginTop: 22,
              padding: 15,
              borderRadius: 'var(--bars-radius-lg)',
              background: 'var(--bars-surface-inset)',
              border: '1px dashed var(--bars-line-strong)',
            }}
          >
            <p className="bars-prose" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--bars-text-muted)' }}>
              They stay free to decline it, ignore it, borrow it, or find something better. Whether they buy anything is a
              campaign number. What made this worth doing is what it gives them.
            </p>
          </div>

          <StepFooter
            back={back}
            next={{ label: 'where did it land? →', onClick: () => { if (hasReason) track({ event: 'show_up_reason_named' }); go('outcome') } }}
          />
        </Step>
      ) : null}

      {screen === 'outcome' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>step 5 · what is true right now</StepEyebrow>
          <StepTitle>Did it leave your hands?</StepTitle>
          <StepBody>
            Answer for what has actually happened. Nobody checks this — which is exactly why it only means something if it is
            true.
          </StepBody>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            {/* Claiming a useful handoff requires having named what it gives them. */}
            {mayClaim ? (
              <SelectRow selected={state === 'shown_up'} onClick={() => chooseState('shown_up')}>
                <span className="bars-title" style={{ display: 'block', fontSize: 17, color: '#fff' }}>I made it. It is with them.</span>
                <span className="bars-prose" style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                  Sent, said, or handed over. Shown up.
                </span>
              </SelectRow>
            ) : (
              <div
                style={{
                  padding: '16px 17px',
                  borderRadius: 'var(--bars-radius-lg)',
                  background: 'var(--bars-surface-inset)',
                  border: '1px dashed var(--bars-line-strong)',
                }}
              >
                <span className="bars-label" style={{ display: 'block', color: ACCENT.lift }}>one step back first</span>
                <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
                  A useful handoff needs one more thing: what it gives them apart from a purchase. Go back a step and name it,
                  or take one of the doors below. Both are fine answers.
                </p>
                <div style={{ marginTop: 14 }}>
                  <OutlineButton onClick={() => go('reason')} strong>name what it gives them →</OutlineButton>
                </div>
              </div>
            )}

            <SelectRow selected={state === 'prepared'} onClick={() => chooseState('prepared')}>
              <span className="bars-title" style={{ display: 'block', fontSize: 17, color: '#fff' }}>It is built, not sent.</span>
              <span className="bars-prose" style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                Prepared. It is built, and still waiting on you.
              </span>
            </SelectRow>

            <SelectRow selected={state === 'put_down'} onClick={() => chooseState('put_down')}>
              <span className="bars-title" style={{ display: 'block', fontSize: 17, color: '#fff' }}>I am not sending this one.</span>
              <span className="bars-prose" style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                Either something earlier is unfinished, or this is not the right hand.
              </span>
            </SelectRow>
          </div>

          <div style={{ marginTop: 24 }}>
            <BackLink onClick={back} />
          </div>
        </Step>
      ) : null}

      {screen === 'comeback' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>come back · after the loop</StepEyebrow>
          <StepTitle>{SHOW_UP_COME_BACK.title}</StepTitle>
          <StepBody>{SHOW_UP_COME_BACK.body}</StepBody>

          <PrivateField
            id="show-up-happened"
            label="private to this page · stays in your browser"
            value={happened}
            onChange={setHappened}
            placeholder={state === 'shown_up' ? 'What happened when it landed…' : 'What stopped it…'}
            rows={5}
          />

          {state === 'shown_up' ? null : (
            <div style={{ marginTop: 26 }}>
              <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>
                which of these is truer?
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                {SHOW_UP_BLOCKS.map((block) => (
                  <SelectRow
                    key={block.key}
                    selected={blockKind === block.key}
                    onClick={() => {
                      const next = blockKind === block.key ? null : block.key
                      setBlockKind(next)
                      if (next) track({ event: 'show_up_block_named', blockKind: next })
                    }}
                  >
                    <span className="bars-title" style={{ display: 'block', fontSize: 16, color: '#fff' }}>{block.label}</span>
                    <span className="bars-prose" style={{ display: 'block', marginTop: 5, fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                      {block.body}
                    </span>
                  </SelectRow>
                ))}
              </div>
            </div>
          )}

          {/* "Unclear inside me" routes back into the loop — but only to days that
              actually resolve, so this can never offer a door onto a 404. */}
          {blockKind === 'inside_me' ? (
            <div style={{ marginTop: 22 }}>
              <span className="bars-label" style={{ display: 'block', color: ACCENT.lift }}>go back to the move that is unfinished</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                {SHOW_UP_EARLIER_MOVES.map((move) => {
                  const day = mtgoaCourseDay(move.day)
                  const route = day ? linkableRoute(day) : null
                  const label = `Day ${move.day} · ${move.label}`
                  return route ? (
                    <a
                      key={move.key}
                      href={showUpEarlierMoveHref(search, route)}
                      onClick={() => track({ event: 'show_up_returned_to_move', blockKind: 'inside_me', returnedToDay: move.day })}
                      style={{
                        display: 'block',
                        textDecoration: 'none',
                        padding: '16px 17px',
                        borderRadius: 'var(--bars-radius-lg)',
                        background: 'var(--bars-surface-card)',
                        border: '1px solid var(--bars-line-strong)',
                        boxShadow: 'var(--bars-shadow-inset-top)',
                      }}
                    >
                      <span className="bars-title" style={{ display: 'block', fontSize: 16, color: '#fff' }}>{`${label} →`}</span>
                      <span className="bars-prose" style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
                        {move.why}
                      </span>
                    </a>
                  ) : (
                    <span
                      key={move.key}
                      aria-disabled
                      style={{
                        display: 'block',
                        padding: '16px 17px',
                        borderRadius: 'var(--bars-radius-lg)',
                        border: '1px dashed var(--bars-line-strong)',
                        color: 'var(--bars-text-muted)',
                      }}
                    >
                      <span className="bars-title" style={{ display: 'block', fontSize: 16, color: 'var(--bars-text-muted)' }}>
                        {`${label} · coming next`}
                      </span>
                      <span className="bars-prose" style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.5 }}>{move.why}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          ) : null}

          {blockKind === 'not_this_hand' ? (
            <div style={{ marginTop: 22 }}>
              <span className="bars-label" style={{ display: 'block', color: ACCENT.lift }}>then one of these, and none of them is a failure</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                {SHOW_UP_PUT_DOWN_OPTIONS.map((option) => (
                  <span
                    key={option}
                    style={{
                      padding: '15px 16px',
                      borderRadius: 'var(--bars-radius-lg)',
                      background: 'var(--bars-surface-inset)',
                      border: '1px solid var(--bars-line)',
                      color: 'var(--bars-text-secondary)',
                      fontSize: 15,
                      lineHeight: 1.5,
                    }}
                  >
                    {option}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <OutlineButton onClick={() => { setState(null); setBlockKind(null); go('aim') }} block strong>
                  aim at a different hand →
                </OutlineButton>
              </div>
            </div>
          ) : null}

          <StepFooter
            back={back}
            next={{ label: 'see my Day 5 receipt →', onClick: () => { if (happened.trim()) track({ event: 'show_up_came_back' }); go('receipt') } }}
          />
        </Step>
      ) : null}

      {screen === 'receipt' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>{receipt.eyebrow}</StepEyebrow>
          <StepTitle size={30}>{receipt.title}</StepTitle>
          <StepBody>{receipt.body}</StepBody>

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
            <ReceiptRow label="the room" value={room.trim() || null} />
            <ReceiptRow label="what changed hands" value={artifactDef?.label ?? null} />
            <ReceiptRow label="how" value={channelDef?.label ?? null} />
            <ReceiptRow label="when" value={timingDef?.label ?? null} />
            <ReceiptRow label="what it gives them" value={reasonText || null} />
            <ReceiptRow label="the sentence" value={sentence.trim() || null} />
            <ReceiptRow label="what happened" value={happened.trim() || null} />
            {carried ? (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--bars-line)' }}>
                <span className="bars-label" style={{ display: 'block', color: 'var(--bars-gold)' }}>the card you carried</span>
                <p className="bars-title" style={{ margin: '6px 0 0', fontSize: 18, color: '#fff' }}>{carried.title}</p>
                <p className="bars-prose" style={{ margin: '5px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                  {carried.primaryQuestion}
                </p>
              </div>
            ) : null}
          </div>

          <NextDayHandoff
            handoff={tomorrow}
            href={nextHref}
            onNavigate={() => track({ event: 'show_up_next_day_clicked' })}
            accent={ACCENT.lift}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
            <a href={chapterHref} style={{ textDecoration: 'none' }}>
              <OutlineButton onClick={() => {}} block strong>Read Chapter 1 free — the handoff that costs them nothing →</OutlineButton>
            </a>
            <a href={deckHref} onClick={() => track({ event: 'show_up_deck_cta_clicked' })} style={{ textDecoration: 'none' }}>
              <OutlineButton onClick={() => {}} block>Explore the Allyship Deck →</OutlineButton>
            </a>
            <a href={bookHref} onClick={() => track({ event: 'show_up_book_cta_clicked' })} style={{ textDecoration: 'none' }}>
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
            <p className="bars-prose" style={{ margin: '16px 0 0', fontSize: 'var(--bars-text-sm)', lineHeight: 1.6, color: 'var(--bars-text-muted)' }}>
              How the book reads this: that is one full turn of the Five Move Form — notice, receive, clear, build, hand over.
              The loop is the game, and it is built to be run again on the next live thing.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
            <BackLink onClick={back} />
            <TextButton onClick={restart}>run the loop again</TextButton>
          </div>
          <PrivacyLine>{SHOW_UP_RECEIPT.closing}</PrivacyLine>
        </Step>
      ) : null}

      {sheetCard ? (
        <CardDrawSheet
          card={sheetCard}
          carried={carried?.id === sheetCard.id}
          onClose={() => setSheetCard(null)}
          onChoose={chooseSheetCard}
          accent={ACCENT.lift}
          accentText="#1c0700"
          chooseLabel="carry this card"
        />
      ) : null}
    </CheckShell>
  )
}
