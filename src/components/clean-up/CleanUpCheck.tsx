'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { CardDrawRow, CardDrawSheet } from '@/components/deck/CardDraw'
import { NextDayHandoff } from '@/components/mtgoa-check/CheckKit'
import { MovePip } from '@/components/deck/MovePip'
import { DECK_GOLD } from '@/lib/allyship-deck/card-visuals'
import type { MoveCard } from '@/lib/allyship-deck/types'
import {
  CLEAN_UP_BODY_READINGS,
  CLEAN_UP_CHANNELS,
  CLEAN_UP_EXPLAINER,
  CLEAN_UP_OPENERS,
  CLEAN_UP_STEPS,
  cleanUpActLabel,
  cleanUpBodyTakeaway,
  cleanUpChargeHeading,
  cleanUpCheckUrl,
  cleanUpCopyLabel,
  cleanUpDeckRibbon,
  cleanUpDraftLabel,
  cleanUpDraftLabelShort,
  cleanUpDrawSub,
  cleanUpEvidence,
  cleanUpLineHeading,
  cleanUpLineTakeaway,
  cleanUpLinesFor,
  cleanUpPoolFor,
  cleanUpReceipt,
  composeCleanUpDraft,
  findCleanUpChannel,
  findCleanUpLine,
} from '@/lib/clean-up/check-content'
import type { CleanUpMoveKey, CleanUpRoute } from '@/lib/clean-up/check-content'
import type { CleanUpAnalyticsEvent } from '@/lib/clean-up/events'
import { cleanUpBookHref, cleanUpDeckHref, cleanUpNextDayHref } from '@/lib/clean-up/outbound'
import { nextCourseDay } from '@/lib/mtgoa-course/course-days'

import styles from './CleanUpCheck.module.css'

type Screen = 'entry' | 'orient' | 'charge' | 'line' | 'draw' | 'work' | 'moves' | 'receipt'
type Voice = 'me' | 'it'
type ThreadMessage = { from: Voice; text: string }

const ORDER: Screen[] = ['entry', 'orient', 'charge', 'line', 'draw', 'work', 'moves', 'receipt']

/**
 * The draft is written to be pasted somewhere public, so it always carries the
 * canonical origin — never a preview or localhost host.
 */
const SITE_ORIGIN = 'https://masteringallyship.com'

const NUM_COLORS = { '3': 'var(--cu-water-lift)', '2': 'var(--bars-water-gem)', '1': 'var(--bars-liminal-glow)' } as const

const mono: CSSProperties = { fontFamily: 'var(--bars-font-mono)' }
const display: CSSProperties = { fontFamily: 'var(--bars-font-display)' }

function track(event: CleanUpAnalyticsEvent) {
  const body = JSON.stringify(event)
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/api/clean-up/events', new Blob([body], { type: 'application/json' }))
    return
  }
  void fetch('/api/clean-up/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true })
}

function drawThree(pool: MoveCard[]): MoveCard[] {
  const cards = [...pool]
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[cards[index], cards[swap]] = [cards[swap], cards[index]]
  }
  return cards.slice(0, 3)
}

export function CleanUpCheck({ queryString }: { queryString: string }) {
  const search = useMemo(() => new URLSearchParams(queryString), [queryString])

  const [screen, setScreen] = useState<Screen>('entry')
  const [route, setRoute] = useState<CleanUpRoute>('own_charge')
  const [bodyReading, setBodyReading] = useState<string | null>(null)
  const [channelKey, setChannelKey] = useState<string | null>(null)
  const [lineKey, setLineKey] = useState<string | null>(null)
  const [sampler, setSampler] = useState<MoveCard[]>([])
  const [carried, setCarried] = useState<MoveCard | null>(null)
  const [sheetCard, setSheetCard] = useState<MoveCard | null>(null)

  const [faceCharge, setFaceCharge] = useState('')
  const [maskName, setMaskName] = useState('')
  const [thread, setThread] = useState<ThreadMessage[]>([])
  const [draft, setDraft] = useState('')
  const [voice, setVoice] = useState<Voice>('me')
  const [beVoice, setBeVoice] = useState('')
  const [beShift, setBeShift] = useState('')

  const [move, setMove] = useState<CleanUpMoveKey | null>(null)
  const [postText, setPostText] = useState('')
  const [postEdited, setPostEdited] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => { track({ event: 'clean_up_check_viewed' }) }, [])

  const channel = findCleanUpChannel(channelKey)
  const line = findCleanUpLine(route, lineKey)
  const partName = maskName.trim() || 'the part'
  const checkUrl = cleanUpCheckUrl(SITE_ORIGIN)
  const deckHref = cleanUpDeckHref(search)
  const bookHref = cleanUpBookHref(search)

  // Day 3 of 30. Day 4 is designed but unbuilt, so the spine returns no route and
  // the handoff names Grow Up's question without linking at it. When Day 4 ships,
  // this becomes a link with no edit here.
  const tomorrow = nextCourseDay(3)
  const nextHref = tomorrow?.route ? cleanUpNextDayHref(search, tomorrow.route) : undefined

  const compose = useCallback(
    () =>
      composeCleanUpDraft({
        route,
        bodyReading,
        channel,
        line,
        cardQuestion: carried?.primaryQuestion ?? null,
        facedIt: !!faceCharge.trim(),
        namedIt: !!maskName.trim(),
        threadTurns: thread.length,
        spokeAsIt: !!beVoice.trim(),
        noticedShift: !!beShift.trim(),
        origin: SITE_ORIGIN,
      }),
    [route, bodyReading, channel, line, carried, faceCharge, maskName, thread.length, beVoice, beShift],
  )

  // Never scrollIntoView — a step change always returns to the top of the page.
  const go = (next: Screen) => {
    if (next === 'moves' && !postEdited) setPostText(compose())
    setScreen(next)
    window.scrollTo(0, 0)
  }

  const start = (nextRoute: CleanUpRoute) => {
    setRoute(nextRoute)
    setLineKey(null)
    setCarried(null)
    setSampler(drawThree(cleanUpPoolFor(nextRoute)))
    track({ event: 'clean_up_check_started', route: nextRoute })
    track({ event: 'clean_up_route_selected', route: nextRoute })
    go('charge')
  }

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setThread((current) => [...current, { from: voice, text }])
    setDraft('')
    setVoice(voice === 'me' ? 'it' : 'me')
  }

  const pickMove = (key: CleanUpMoveKey) => {
    setMove(key)
    setCopied(null)
    setScreen('receipt')
    window.scrollTo(0, 0)
    track({ event: 'clean_up_move_selected', route, moveKey: key, cardId: carried?.id })
    track({ event: 'clean_up_check_completed', route, moveKey: key, cardId: carried?.id })
  }

  const copy = (text: string, tag: string) => {
    if (text) void navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(tag)
  }

  const clearWork = () => {
    setBodyReading(null)
    setChannelKey(null)
    setLineKey(null)
    setCarried(null)
    setSheetCard(null)
    setFaceCharge('')
    setMaskName('')
    setThread([])
    setDraft('')
    setVoice('me')
    setBeVoice('')
    setBeShift('')
    setMove(null)
    setPostText('')
    setPostEdited(false)
    setCopied(null)
  }

  const restart = () => {
    clearWork()
    setSampler(drawThree(cleanUpPoolFor('own_charge')))
    setRoute('own_charge')
    setScreen('entry')
    window.scrollTo(0, 0)
  }

  /** "clean up something else" — a fresh charge on the practice route, keeping nothing. */
  const cleanSomethingElse = () => {
    clearWork()
    setRoute('own_charge')
    setSampler(drawThree(cleanUpPoolFor('own_charge')))
    setScreen('charge')
    window.scrollTo(0, 0)
  }

  const chooseSheetCard = () => {
    if (!sheetCard) return
    setCarried((current) => (current?.id === sheetCard.id ? null : sheetCard))
    setSheetCard(null)
  }

  const copyLabel = (tag: string, base: string) => (copied === tag ? 'copied ✓' : base)
  const bodyTakeaway = cleanUpBodyTakeaway(bodyReading, checkUrl)
  const lineTakeaway = cleanUpLineTakeaway(line, checkUrl)
  const progress = Math.round(((ORDER.indexOf(screen) + 1) / ORDER.length) * 100)

  const carriedStrip = carried ? <CarriedStrip card={carried} onOpen={() => setSheetCard(carried)} /> : null

  return (
    <main className={styles.root}>
      <div className={styles.page}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingBottom: 12 }}>
          <span className="bars-label" style={{ color: 'var(--bars-gold)' }}>Clean Up Check</span>
          <span className="bars-label" style={{ color: 'var(--cu-water-lift)' }}>clean up · 水</span>
        </div>
        <div
          role="progressbar"
          aria-label="Clean Up Check progress"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ height: 2, borderRadius: 2, background: 'var(--bars-line)', overflow: 'hidden' }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(to right, var(--cu-water), var(--bars-liminal))',
              transition: 'width .35s var(--bars-ease-out)',
            }}
          />
        </div>

        {screen === 'entry' ? (
          <Step>
            {/* The flow is titled once, here. Every later screen carries only the
                small chrome label, so the name never competes with the step. */}
            <h1 className="bars-title" style={{ margin: 0, fontSize: 24, lineHeight: 1.15, color: 'var(--bars-gold)' }}>
              The Clean Up Check
            </h1>
            <span className="bars-label" style={{ display: 'block', marginTop: 8, color: 'var(--bars-text-muted)' }}>
              a practice, walked in order
            </span>
            <p
              className="bars-title"
              style={{ margin: '10px 0 0', fontSize: 'clamp(28px,5.5vw,38px)', lineHeight: 1.16, fontWeight: 700, color: 'var(--bars-text-primary)', textWrap: 'pretty' }}
            >
              Something has your attention. Until you work it, it works you.
            </p>
            <p className="bars-prose" style={{ margin: '18px 0 0', fontSize: 17, lineHeight: 1.62, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
              Unnoticed charge runs you from underneath — it gathers a story, and the story is what makes the next move look
              impossible. Noticed, it becomes workable. Clean Up is how you work it until the energy inside it is yours to spend.
            </p>
            <p className="bars-prose" style={{ margin: '14px 0 0', fontSize: 17, lineHeight: 1.62, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
              Twenty minutes, or five. You name what is live, draw a card for the lens, and walk it around three vantage points.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 28 }}>
              <PrimaryButton onClick={() => start('book_promo')} block>
                I want to promote the book but something&rsquo;s in the way →
              </PrimaryButton>
              <OutlineButton onClick={() => start('own_charge')} block strong>
                I&rsquo;m carrying a charge about my allyship →
              </OutlineButton>
              <OutlineButton onClick={() => go('orient')} block>
                what is 3-2-1? →
              </OutlineButton>
            </div>
            <PrivacyLine>No sign-up. Nothing you write is saved or sent.</PrivacyLine>
          </Step>
        ) : null}

        {screen === 'orient' ? (
          <Step>
            <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>orientation · the three vantage points</span>
            <h2 className="bars-title" style={{ margin: '10px 0 0', fontSize: 26, lineHeight: 1.22 }}>
              A walk around the charge.
            </h2>
            <p className="bars-prose" style={{ margin: '10px 0 0', color: 'var(--bars-text-secondary)', lineHeight: 1.6 }}>
              You look at the same charge from three positions — as an it, as a you, as an I — until what was stuck as story is
              available as energy.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 24 }}>
              {CLEAN_UP_STEPS.map((step) => (
                <div
                  key={step.num}
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
                  <NumBadge num={step.num} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="bars-title" style={{ display: 'block', fontSize: 17, color: '#fff' }}>{step.title}</span>
                    <span className="bars-prose" style={{ display: 'block', marginTop: 5, fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                      {step.body}
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
                borderLeft: '2px solid var(--cu-water)',
              }}
            >
              <span className="bars-label" style={{ color: 'var(--cu-water-lift)' }}>why it belongs in allyship</span>
              <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.6, color: 'var(--bars-text-secondary)' }}>
                Charge arrives through a real person, a figure you have only read about, or a part of yourself. However it arrives, an
                uncleaned charge spends itself on the story instead of the work. Clean Up is one of the four moves that raise your
                throughput on the fifth one: showing up.
              </p>
            </div>
            <StepFooter back={() => go('entry')} next={{ label: 'continue →', onClick: () => go('charge') }} />
          </Step>
        ) : null}

        {screen === 'charge' ? (
          <Step>
            <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>step 1 · what is live</span>
            <h2 className="bars-title" style={{ margin: '10px 0 0', fontSize: 26, lineHeight: 1.22, textWrap: 'pretty' }}>
              {cleanUpChargeHeading(route)}
            </h2>
            <p className="bars-prose" style={{ margin: '8px 0 0', color: 'var(--bars-text-secondary)' }}>
              One read, no interpretation. Pick what&rsquo;s closest to true.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 20 }}>
              {CLEAN_UP_BODY_READINGS.map((reading) => (
                <Chip
                  key={reading}
                  selected={bodyReading === reading}
                  onClick={() => { setBodyReading(bodyReading === reading ? null : reading); setCopied(null) }}
                >
                  {reading}
                </Chip>
              ))}
            </div>
            <div style={{ marginTop: 24 }}>
              <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>the channel underneath</span>
              <p className="bars-prose" style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--bars-text-secondary)' }}>
                Which one is running? Naming it is already half the clean-up.
              </p>
              <div className={styles.channelgrid} style={{ marginTop: 12 }}>
                {CLEAN_UP_CHANNELS.map((item) => (
                  <SelectRow
                    key={item.key}
                    selected={channelKey === item.key}
                    onClick={() => { setChannelKey(channelKey === item.key ? null : item.key); setCopied(null) }}
                  >
                    <span className="bars-title" style={{ display: 'block', fontSize: 17, color: '#fff' }}>{item.label}</span>
                    <span className="bars-prose" style={{ display: 'block', marginTop: 4, fontSize: 14, lineHeight: 1.45, color: 'var(--bars-text-secondary)' }}>
                      {item.hint}
                    </span>
                  </SelectRow>
                ))}
              </div>
            </div>
            {bodyTakeaway ? (
              <TakeItWithYou text={bodyTakeaway} label={copyLabel('body', 'copy this')} onCopy={() => copy(bodyTakeaway, 'body')} />
            ) : null}
            <StepFooter back={() => go('entry')} next={{ label: 'continue →', onClick: () => go('line') }} />
          </Step>
        ) : null}

        {screen === 'line' ? (
          <Step>
            <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>step 2 · the line running underneath</span>
            <h2 className="bars-title" style={{ margin: '10px 0 0', fontSize: 26, lineHeight: 1.22, textWrap: 'pretty' }}>
              {cleanUpLineHeading(route)}
            </h2>
            <p className="bars-prose" style={{ margin: '8px 0 0', color: 'var(--bars-text-secondary)' }}>
              Familiar sentences, not types. Pick the one you&rsquo;d recognize in your own voice today.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
              {cleanUpLinesFor(route).map((option) => (
                <SelectRow
                  key={option.key}
                  selected={lineKey === option.key}
                  onClick={() => { setLineKey(lineKey === option.key ? null : option.key); setCopied(null) }}
                >
                  <span className="bars-title" style={{ display: 'block', fontSize: 17, lineHeight: 1.35, color: '#fff', textWrap: 'pretty' }}>
                    {option.voice}
                  </span>
                  {/* The clinical label appears only on the selected row — the screen never opens with six diagnoses. */}
                  {lineKey === option.key ? (
                    <span className="bars-label" style={{ display: 'block', marginTop: 8, color: 'var(--bars-liminal-glow)' }}>
                      the belief underneath · {option.belief}
                    </span>
                  ) : null}
                </SelectRow>
              ))}
              {/* Styled identically to the six — a skip that looks like a skip is a skip nobody takes. */}
              <SelectRow selected={false} onClick={() => { setLineKey(null); setCopied(null) }}>
                <span className="bars-title" style={{ display: 'block', fontSize: 17, lineHeight: 1.35, color: '#fff' }}>
                  none of these / skip
                </span>
              </SelectRow>
            </div>
            {lineTakeaway ? (
              <TakeItWithYou text={lineTakeaway} label={copyLabel('line', 'copy this')} onCopy={() => copy(lineTakeaway, 'line')} />
            ) : null}
            <StepFooter back={() => go('charge')} next={{ label: 'continue →', onClick: () => go('draw') }} />
          </Step>
        ) : null}

        {screen === 'draw' ? (
          <Step>
            <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>step 3 · draw a lens</span>
            <h2 className="bars-title" style={{ margin: '10px 0 0', fontSize: 26, lineHeight: 1.22 }}>Carry one card into the work.</h2>
            <p className="bars-prose" style={{ margin: '8px 0 0', color: 'var(--bars-text-secondary)' }}>{cleanUpDrawSub(route)}</p>

            {/* The deck doorway: an edge-to-edge darker well so the cards glow out of
                their own field instead of floating on the questionnaire's paper. */}
            <div
              style={{
                margin: '22px calc(-1 * var(--cu-gutter)) 0',
                padding: '26px var(--cu-gutter) 28px',
                background: 'var(--cu-well)',
                boxShadow: 'var(--bars-shadow-inset-top)',
                borderTop: '1px solid rgba(255,255,255,.05)',
                borderBottom: '1px solid rgba(255,255,255,.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className={styles.ribbonRule} style={{ background: 'linear-gradient(to right, transparent, color-mix(in srgb, var(--bars-gold) 45%, transparent))' }} />
                <span className={styles.ribbon}>{cleanUpDeckRibbon(route)}</span>
                <span className={styles.ribbonRule} style={{ background: 'linear-gradient(to left, transparent, color-mix(in srgb, var(--bars-gold) 45%, transparent))' }} />
              </div>
              <div style={{ marginTop: 22 }}>
                <CardDrawRow
                  cards={sampler}
                  carriedId={carried?.id ?? null}
                  onOpen={setSheetCard}
                  accent={DECK_GOLD}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
              <BackLink onClick={() => go('line')} />
              <span style={{ display: 'flex', gap: 9 }}>
                <OutlineButton strong onClick={() => { setSampler(drawThree(cleanUpPoolFor(route))); setCarried(null) }}>
                  draw three more
                </OutlineButton>
                {/* One button, two states — never three peer CTAs. */}
                <PrimaryButton onClick={() => go('work')}>{carried ? 'work it →' : 'skip the draw →'}</PrimaryButton>
              </span>
            </div>
          </Step>
        ) : null}

        {screen === 'work' ? (
          <Step>
            <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>step 4 · work the charge</span>
            <h2 className="bars-title" style={{ margin: '10px 0 0', fontSize: 26, lineHeight: 1.22 }}>
              Three passes. Same charge, three positions.
            </h2>
            <p className="bars-prose" style={{ margin: '8px 0 0', color: 'var(--bars-text-secondary)' }}>
              Write badly and quickly. Nothing here is saved, sent, or read by anyone.
            </p>

            {carriedStrip}

            <Pass num="3" title="Face it" caption="third person · it" captionColor="var(--cu-water-lift)" first>
              <p className="bars-prose" style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
                What does this charge look like if it were a person? Where are they from? How do they move through the world? Just
                write down what comes up and let yourself be surprised.
              </p>
              <textarea
                className={styles.field}
                rows={12}
                value={faceCharge}
                onChange={(event) => setFaceCharge(event.target.value)}
                placeholder="They&rsquo;re the kind of person who…"
                aria-label="Describe the charge in the third person"
                style={{ marginTop: 11, padding: '14px 15px', lineHeight: 1.6 }}
              />
            </Pass>

            <Pass num="2" title="Talk to it" caption="second person · you · a thread" captionColor="var(--cu-water-lift)">
              <p className="bars-prose" style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                Before you speak to them, what do you call them? Not a clinical label — a name that fits their nature.
              </p>
              <input
                className={styles.field}
                value={maskName}
                onChange={(event) => setMaskName(event.target.value)}
                placeholder="e.g. The Cynic, The Protector, The Good Ally"
                aria-label="A name for the part"
                style={{ marginTop: 10, padding: '13px 14px' }}
              />
              <p className="bars-prose" style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                Now go back and forth. Ask them something, switch voices, and let them answer in their own words. Keep going until
                they say something you didn&rsquo;t already know.
              </p>

              {thread.length ? (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {thread.map((message, index) => {
                    const isMe = message.from === 'me'
                    return (
                      <div
                        key={`${index}-${message.text}`}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}
                      >
                        <span
                          style={{
                            maxWidth: '82%',
                            padding: '11px 14px',
                            borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: isMe
                              ? 'color-mix(in srgb, var(--bars-liminal) 26%, transparent)'
                              : 'color-mix(in srgb, var(--cu-water) 18%, transparent)',
                            border: `1px solid ${isMe ? 'color-mix(in srgb, var(--bars-liminal) 45%, transparent)' : 'color-mix(in srgb, var(--cu-water) 45%, transparent)'}`,
                            color: isMe ? '#fff' : 'var(--bars-text-primary)',
                          }}
                        >
                          <span className="bars-label" style={{ display: 'block', fontSize: 9, opacity: 0.8, marginBottom: 4 }}>
                            {isMe ? 'me' : partName}
                          </span>
                          <span style={{ display: 'block', fontSize: 15, lineHeight: 1.5 }}>{message.text}</span>
                        </span>
                        <button
                          type="button"
                          className={styles.clk}
                          aria-label="Remove this turn"
                          onClick={() => setThread((current) => current.filter((_, position) => position !== index))}
                          style={{ ...mono, fontSize: 10, color: 'var(--bars-text-muted)', padding: '4px 6px', background: 'none', border: 'none' }}
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ marginTop: 14 }}>
                  <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>openers, if you want one</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
                    {CLEAN_UP_OPENERS.map((opener) => (
                      <button
                        key={opener}
                        type="button"
                        className={`${styles.clk} ${styles.press}`}
                        onClick={() => { setDraft(opener); setVoice('me') }}
                        style={{
                          ...mono,
                          fontSize: 11,
                          letterSpacing: '.06em',
                          textTransform: 'uppercase',
                          padding: '10px 13px',
                          borderRadius: 'var(--bars-radius-full)',
                          background: 'var(--bars-surface-inset)',
                          border: '1px solid var(--bars-line)',
                          color: 'var(--bars-text-secondary)',
                          textAlign: 'left',
                        }}
                      >
                        {opener}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--bars-line)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>speaking as</span>
                  <VoicePill on={voice === 'me'} onClick={() => setVoice('me')}>me</VoicePill>
                  <VoicePill on={voice === 'it'} onClick={() => setVoice('it')}>{partName}</VoicePill>
                </div>
                <textarea
                  className={styles.field}
                  rows={3}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      send()
                    }
                  }}
                  aria-label={voice === 'me' ? 'Say something to it' : `Answer as ${partName}`}
                  placeholder={voice === 'me' ? 'Ask it something, or say the thing you’d say if there were no cost…' : `Answer as ${partName}, in its own words…`}
                  style={{ marginTop: 10, padding: '13px 14px', lineHeight: 1.55 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <span style={{ ...mono, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', minWidth: 0 }}>
                    enter sends · shift+enter for a new line
                  </span>
                  <PrimaryButton onClick={send} compact>say it</PrimaryButton>
                </div>
              </div>
            </Pass>

            <Pass num="1" title="Be it" caption="first person · I · no one else in the room" captionColor="var(--bars-liminal-glow)">
              <p className="bars-prose" style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
                Drop the dialogue. You are {partName} now, alone, with nobody to convince and nothing to ask for. Say what is true
                when there&rsquo;s no one listening.
              </p>
              <textarea
                className={styles.field}
                rows={6}
                value={beVoice}
                onChange={(event) => setBeVoice(event.target.value)}
                placeholder="I am… / What is true about me is…"
                aria-label="Speak as it, in the first person"
                style={{ marginTop: 11, padding: '13px 14px', lineHeight: 1.6 }}
              />
              <p className="bars-prose" style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                Come back to yourself. Holding this presence with awareness — what shifted?
              </p>
              <textarea
                className={styles.field}
                rows={3}
                value={beShift}
                onChange={(event) => setBeShift(event.target.value)}
                placeholder="What feels different now…"
                aria-label="What shifted"
                style={{ marginTop: 11, padding: '13px 14px', lineHeight: 1.55 }}
              />
            </Pass>

            <PrivacyLine align="left">stays only in this browser</PrivacyLine>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26 }}>
              <BackLink onClick={() => go('draw')} />
              <span style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                <TextButton onClick={() => go('moves')}>skip</TextButton>
                <PrimaryButton onClick={() => go('moves')}>what&rsquo;s freed up →</PrimaryButton>
              </span>
            </div>
          </Step>
        ) : null}

        {screen === 'moves' ? (
          <Step>
            <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>step 5 · where the energy goes</span>
            <h2 className="bars-title" style={{ margin: '10px 0 0', fontSize: 26, lineHeight: 1.22 }}>
              The charge is worked. What does it fund?
            </h2>

            {carriedStrip}

            {/* The draft is composed and shown BEFORE the decision. The panel is a
                mirror — nothing here is submitted. */}
            <div
              style={{
                marginTop: 18,
                padding: 20,
                borderRadius: 'var(--bars-radius-lg)',
                background: 'var(--bars-surface-card)',
                border: '1px solid color-mix(in srgb, var(--bars-liminal) 45%, transparent)',
                boxShadow: 'var(--bars-shadow-inset-top), 0 0 34px -14px var(--bars-liminal)',
              }}
            >
              <span className="bars-label" style={{ color: 'var(--bars-liminal-glow)' }}>
                {line ? `worked just now · ${line.belief}` : channel ? `worked just now · ${channel.label}` : 'what the clean-up freed'}
              </span>
              {line ? (
                <>
                  <p className="bars-title" style={{ margin: '11px 0 0', fontSize: 20, lineHeight: 1.3, color: '#fff', textWrap: 'pretty' }}>
                    {line.overcome}
                  </p>
                  <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
                    {line.reframe}
                  </p>
                </>
              ) : null}
              <div style={{ marginTop: 18 }}>
                <label className="bars-label" htmlFor="clean-up-draft" style={{ color: 'var(--bars-text-muted)' }}>
                  {cleanUpDraftLabel(route)}
                </label>
                <textarea
                  id="clean-up-draft"
                  className={styles.field}
                  rows={7}
                  value={postText}
                  onChange={(event) => { setPostText(event.target.value); setPostEdited(true) }}
                  style={{ marginTop: 9, padding: 14, lineHeight: 1.6 }}
                />
                <span style={{ display: 'inline-block', marginTop: 11 }}>
                  <PillButton onClick={() => { copy(postText, 'post'); track({ event: 'clean_up_draft_copied', route }) }}>
                    {copyLabel('post', cleanUpCopyLabel(route))}
                  </PillButton>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 24 }}>
              <PrimaryButton block glow onClick={() => pickMove('act')}>{cleanUpActLabel(route)}</PrimaryButton>
              <OutlineButton block strong onClick={() => pickMove('later')}>let it settle · come back later</OutlineButton>
              <OutlineButton block onClick={() => pickMove('not_mine')}>this one isn&rsquo;t mine to clean</OutlineButton>
            </div>

            <div style={{ marginTop: 20 }}>
              <BackLink onClick={() => go('work')} />
            </div>
          </Step>
        ) : null}

        {screen === 'receipt' && move ? (
          <Step>
            <span className="bars-label" style={{ color: 'var(--cu-water-lift)' }}>the clean-up is done for now</span>
            <h2 className="bars-title" style={{ margin: '10px 0 0', fontSize: 28, lineHeight: 1.2, textWrap: 'pretty' }}>
              {cleanUpReceipt(route, move).title}
            </h2>
            <p className="bars-prose" style={{ margin: '10px 0 0', fontSize: 16, lineHeight: 1.6, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
              {cleanUpReceipt(route, move).body}
            </p>

            {move === 'act' || (route === 'book_promo' && move === 'later') ? (
              <div style={{ marginTop: 22 }}>
                <label className="bars-label" htmlFor="clean-up-draft-receipt" style={{ color: 'var(--bars-text-muted)' }}>
                  {cleanUpDraftLabelShort(route)}
                </label>
                <textarea
                  id="clean-up-draft-receipt"
                  className={styles.field}
                  rows={7}
                  value={postText}
                  onChange={(event) => { setPostText(event.target.value); setPostEdited(true) }}
                  style={{ marginTop: 9, padding: 14, lineHeight: 1.6 }}
                />
                <div style={{ marginTop: 12 }}>
                  <PrimaryButton onClick={() => { copy(postText, 'post'); track({ event: 'clean_up_draft_copied', route }) }}>
                    {copyLabel('post', cleanUpCopyLabel(route))}
                  </PrimaryButton>
                </div>
              </div>
            ) : null}

            {move === 'later' ? <CalendarChips checkUrl={checkUrl} /> : null}

            {move === 'not_mine' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 22 }}>
                <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>other doors, if one calls</span>
                <a
                  href={deckHref}
                  onClick={() => track({ event: 'clean_up_deck_cta_clicked', route })}
                  className={styles.link}
                  style={{ ...display, fontWeight: 600, fontSize: 15, padding: '13px 16px', borderRadius: 'var(--bars-radius-lg)', border: '1px solid var(--bars-line-strong)', color: 'var(--bars-text-primary)' }}
                >
                  explore the Allyship Deck →
                </a>
                <OutlineButton block strong onClick={cleanSomethingElse}>clean up something else →</OutlineButton>
                <span
                  style={{ padding: '14px 16px', borderRadius: 'var(--bars-radius-lg)', border: '1px dashed var(--bars-line-strong)', color: 'var(--bars-text-muted)', fontSize: 15 }}
                >
                  closing the tab is also a complete move.
                </span>
              </div>
            ) : null}

            {carriedStrip}

            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--bars-line)' }}>
              <span className="bars-label" style={{ color: 'var(--bars-text-secondary)' }}>the moves you made here</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {cleanUpEvidence({
                  route,
                  bodyReading,
                  channel,
                  line,
                  cardTitle: carried?.title ?? null,
                  facedIt: !!faceCharge.trim(),
                  partName: maskName,
                  threadTurns: thread.length,
                  spokeAsIt: !!beVoice.trim(),
                  move,
                }).map((label) => (
                  <span
                    key={label}
                    style={{
                      ...mono,
                      fontSize: 11,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      padding: '8px 13px',
                      borderRadius: 'var(--bars-radius-full)',
                      background: 'var(--bars-surface-inset)',
                      border: '1px solid var(--bars-line)',
                      color: 'var(--bars-text-secondary)',
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="bars-prose" style={{ margin: '16px 0 0', fontSize: 'var(--bars-text-sm)', lineHeight: 1.6, color: 'var(--bars-text-muted)' }}>
                {CLEAN_UP_EXPLAINER}
              </p>
            </div>

            <NextDayHandoff
              handoff={tomorrow}
              href={nextHref}
              onNavigate={() => track({ event: 'clean_up_next_day_clicked', route })}
              accent="var(--cu-water-lift)"
            />

            <div
              style={{
                marginTop: 26,
                padding: 20,
                borderRadius: 'var(--bars-radius-lg)',
                background: 'var(--bars-surface-card)',
                border: '1px solid color-mix(in srgb, var(--bars-gold) 40%, transparent)',
                boxShadow: 'var(--bars-shadow-inset-top)',
              }}
            >
              <span className="bars-label" style={{ color: 'var(--bars-gold)' }}>keep going</span>
              <h3 className="bars-title" style={{ margin: '8px 0 0', fontSize: 20, lineHeight: 1.25, color: '#fff', textWrap: 'pretty' }}>
                The practice has a deck and a book behind it.
              </h3>
              <p className="bars-prose" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                120 cards across five moves — the Clean Up suit you just drew from is one of them. The book is where the whole game
                is taught.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                <a
                  href={deckHref}
                  onClick={() => track({ event: 'clean_up_deck_cta_clicked', route })}
                  className={styles.link}
                  style={{ ...display, fontWeight: 700, fontSize: 15, color: '#fff', background: 'var(--bars-liminal)', padding: '14px 22px', borderRadius: 'var(--bars-radius-lg)', boxShadow: 'var(--bars-shadow-inset-top)' }}
                >
                  explore the Allyship Deck →
                </a>
                <a
                  href={bookHref}
                  onClick={() => track({ event: 'clean_up_book_cta_clicked', route })}
                  className={styles.link}
                  style={{ ...display, fontWeight: 600, fontSize: 15, color: 'var(--bars-text-primary)', padding: '14px 22px', borderRadius: 'var(--bars-radius-lg)', border: '1px solid color-mix(in srgb, var(--bars-gold) 55%, transparent)' }}
                >
                  buy the book →
                </a>
              </div>
            </div>

            {/* Choosing a move must not be a one-way door. */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 26, alignItems: 'center' }}>
              <TextButton onClick={() => go('moves')}>← back to the moves</TextButton>
              <OutlineButton strong onClick={restart}>start over</OutlineButton>
            </div>
          </Step>
        ) : null}
      </div>

      {sheetCard ? (
        <CardDrawSheet
          card={sheetCard}
          carried={carried?.id === sheetCard.id}
          onClose={() => setSheetCard(null)}
          onChoose={chooseSheetCard}
          accent="var(--bars-liminal)"
        />
      ) : null}
    </main>
  )
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function Step({ children }: { children: ReactNode }) {
  return <div className={styles.fadeup} style={{ paddingTop: 34 }}>{children}</div>
}

function PrivacyLine({ children, align = 'center' }: { children: ReactNode; align?: 'center' | 'left' }) {
  return (
    <p
      style={{
        margin: align === 'center' ? '18px 0 0' : '14px 0 0',
        textAlign: align,
        ...mono,
        fontSize: 'var(--bars-text-2xs)',
        color: 'var(--bars-text-muted)',
        letterSpacing: '.06em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </p>
  )
}

function NumBadge({ num }: { num: '1' | '2' | '3' | string }) {
  const color = NUM_COLORS[num as keyof typeof NUM_COLORS] ?? 'var(--bars-text-secondary)'
  return (
    <span
      aria-hidden
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        flex: 'none',
        borderRadius: 10,
        ...display,
        fontWeight: 700,
        fontSize: 16,
        color,
        background: `color-mix(in srgb, ${color} 13%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
      }}
    >
      {num}
    </span>
  )
}

function Pass({
  num,
  title,
  caption,
  captionColor,
  first,
  children,
}: {
  num: string
  title: string
  caption: string
  captionColor: string
  first?: boolean
  children: ReactNode
}) {
  return (
    <section
      style={{
        marginTop: first ? 22 : 14,
        padding: 18,
        borderRadius: 'var(--bars-radius-lg)',
        background: 'var(--bars-surface-card)',
        border: '1px solid var(--bars-line-strong)',
        boxShadow: 'var(--bars-shadow-inset-top)',
      }}
    >
      <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
        <NumBadge num={num} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="bars-title" style={{ display: 'block', fontSize: 17, color: '#fff' }}>{title}</span>
          <span className="bars-label" style={{ display: 'block', marginTop: 3, color: captionColor }}>{caption}</span>
        </span>
      </div>
      {children}
    </section>
  )
}

function StepFooter({ back, next }: { back: () => void; next: { label: string; onClick: () => void } }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 26 }}>
      <BackLink onClick={back} />
      <PrimaryButton onClick={next.onClick}>{next.label}</PrimaryButton>
    </div>
  )
}

function BackLink({ onClick }: { onClick: () => void }) {
  return <TextButton onClick={onClick}>← back</TextButton>
}

function TextButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={styles.clk}
      onClick={onClick}
      style={{
        color: 'var(--bars-text-secondary)',
        fontSize: 'var(--bars-text-sm)',
        fontFamily: 'var(--bars-font-body)',
        padding: '12px 8px',
        background: 'none',
        border: 'none',
        minHeight: 44,
      }}
    >
      {children}
    </button>
  )
}

function PrimaryButton({
  onClick,
  children,
  block,
  glow,
  compact,
}: {
  onClick: () => void
  children: ReactNode
  block?: boolean
  glow?: boolean
  compact?: boolean
}) {
  return (
    <button
      type="button"
      className={`${styles.clk} ${styles.press}`}
      onClick={onClick}
      style={{
        ...display,
        fontWeight: 700,
        fontSize: block ? 16 : compact ? 14 : 15,
        color: '#fff',
        background: 'var(--bars-liminal)',
        padding: block ? 16 : compact ? '11px 20px' : '13px 26px',
        minHeight: 44,
        width: block ? '100%' : undefined,
        textAlign: 'center',
        borderRadius: 'var(--bars-radius-lg)',
        border: 'none',
        // The compact variant sits beside a shrinking hint — keep it on one line.
        flex: compact ? 'none' : undefined,
        whiteSpace: compact ? 'nowrap' : undefined,
        textWrap: compact ? undefined : 'pretty',
        boxShadow: glow
          ? 'var(--bars-shadow-inset-top), 0 10px 24px -10px var(--bars-liminal)'
          : 'var(--bars-shadow-inset-top)',
      }}
    >
      {children}
    </button>
  )
}

function OutlineButton({
  onClick,
  children,
  block,
  strong,
}: {
  onClick: () => void
  children: ReactNode
  block?: boolean
  strong?: boolean
}) {
  return (
    <button
      type="button"
      className={`${styles.clk} ${styles.press}`}
      onClick={onClick}
      style={{
        ...display,
        fontWeight: 600,
        fontSize: block ? 15 : 14,
        color: strong ? 'var(--bars-text-primary)' : 'var(--bars-text-secondary)',
        background: 'none',
        padding: block ? 15 : '13px 18px',
        minHeight: 44,
        width: block ? '100%' : undefined,
        textAlign: 'center',
        borderRadius: 'var(--bars-radius-lg)',
        border: `1px solid ${strong ? 'var(--bars-line-strong)' : 'var(--bars-line)'}`,
        textWrap: 'pretty',
      }}
    >
      {children}
    </button>
  )
}

function PillButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`${styles.clk} ${styles.press}`}
      onClick={onClick}
      style={{
        ...mono,
        fontSize: 12,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        padding: '11px 18px',
        minHeight: 44,
        borderRadius: 'var(--bars-radius-full)',
        border: '1px solid var(--bars-line-strong)',
        background: 'none',
        color: 'var(--bars-text-primary)',
      }}
    >
      {children}
    </button>
  )
}

function VoicePill({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`${styles.clk} ${styles.press}`}
      aria-pressed={on}
      onClick={onClick}
      style={{
        ...mono,
        fontSize: 11,
        letterSpacing: '.08em',
        textTransform: 'uppercase',
        padding: '9px 14px',
        borderRadius: 'var(--bars-radius-full)',
        color: on ? '#fff' : 'var(--bars-text-secondary)',
        background: on ? 'var(--bars-liminal)' : 'var(--bars-surface-inset)',
        border: `1px solid ${on ? 'var(--bars-liminal)' : 'var(--bars-line-strong)'}`,
        boxShadow: on ? 'var(--bars-shadow-inset-top)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`${styles.clk} ${styles.press}`}
      aria-pressed={selected}
      onClick={onClick}
      style={{
        ...mono,
        fontSize: 13,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        padding: '14px 18px',
        minHeight: 44,
        borderRadius: 'var(--bars-radius-full)',
        color: selected ? '#fff' : 'var(--bars-text-primary)',
        background: selected ? 'var(--bars-liminal)' : 'var(--bars-surface-inset)',
        border: `1px solid ${selected ? 'var(--bars-liminal)' : 'var(--bars-line-strong)'}`,
        boxShadow: selected ? 'var(--bars-shadow-inset-top)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

/** A two-line selectable row. 16px of vertical padding — these are never 10px rows. */
function SelectRow({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`${styles.clk} ${styles.press}`}
      aria-pressed={selected}
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '16px 17px',
        borderRadius: 'var(--bars-radius-lg)',
        background: 'var(--bars-surface-card)',
        border: `1px solid ${selected ? 'var(--bars-liminal)' : 'var(--bars-line-strong)'}`,
        boxShadow: selected
          ? 'var(--bars-shadow-inset-top), 0 0 18px -6px var(--bars-liminal)'
          : 'var(--bars-shadow-inset-top)',
      }}
    >
      {children}
    </button>
  )
}

/** The consolation prize: someone who bails at step one still leaves with something postable. */
function TakeItWithYou({ text, label, onCopy }: { text: string; label: string; onCopy: () => void }) {
  return (
    <div
      style={{
        marginTop: 20,
        padding: '15px 16px',
        borderRadius: 'var(--bars-radius-lg)',
        background: 'var(--bars-surface-inset)',
        border: '1px solid var(--bars-line)',
      }}
    >
      <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>take it with you · text or socials</span>
      <p className="bars-prose" style={{ margin: '8px 0 12px', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-primary)' }}>{text}</p>
      <PillButton onClick={onCopy}>{label}</PillButton>
    </div>
  )
}

/** What makes the draw consequential: the visitor leaves holding one real card. */
function CarriedStrip({ card, onOpen }: { card: MoveCard; onOpen: () => void }) {
  return (
    <button
      type="button"
      className={styles.clk}
      onClick={onOpen}
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        width: '100%',
        textAlign: 'left',
        marginTop: 18,
        padding: '13px 15px',
        borderRadius: 'var(--bars-radius-lg)',
        background: 'var(--bars-surface-inset)',
        border: '1px solid var(--bars-line)',
        borderLeft: '2px solid var(--bars-gold)',
      }}
    >
      <MovePip move={card.move} size={34} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="bars-label" style={{ display: 'block', color: 'var(--bars-gold)' }}>the card you&rsquo;re carrying</span>
        <span className="bars-title" style={{ display: 'block', fontSize: 15, color: '#fff', marginTop: 2 }}>{card.title}</span>
        <span style={{ display: 'block', fontSize: 'var(--bars-text-sm)', color: 'var(--bars-text-secondary)', marginTop: 2 }}>
          {card.remediation}
        </span>
      </span>
    </button>
  )
}

/**
 * A nudge where the visitor's days actually live. No email capture, no reminder
 * service, no account.
 */
function CalendarChips({ checkUrl }: { checkUrl: string }) {
  const open = (days: number) => {
    const start = new Date()
    start.setDate(start.getDate() + days)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const stamp = (date: Date) => date.toISOString().slice(0, 10).replaceAll('-', '')
    const url =
      'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' +
      encodeURIComponent('Clean Up Check — come back to the charge') +
      `&dates=${stamp(start)}/${stamp(end)}&details=` +
      encodeURIComponent(`The charge is still worth working. ${checkUrl}`)
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 20 }}>
      {([[1, 'tomorrow'], [3, 'in three days'], [7, 'next week']] as const).map(([days, label]) => (
        <button
          key={label}
          type="button"
          className={`${styles.clk} ${styles.press}`}
          onClick={() => open(days)}
          style={{
            ...mono,
            fontSize: 13,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            padding: '14px 18px',
            minHeight: 44,
            borderRadius: 'var(--bars-radius-full)',
            background: 'var(--bars-surface-inset)',
            border: '1px solid var(--bars-line-strong)',
            color: 'var(--bars-text-primary)',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
