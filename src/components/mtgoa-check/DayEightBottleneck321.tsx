'use client'

import { useEffect, useRef, useState } from 'react'

import { CardDrawRow, CardDrawSheet } from '@/components/deck/CardDraw'
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
  DAY_EIGHT_BLANK,
  DAY_EIGHT_OPENERS,
  DAY_EIGHT_OPEN_STARTER,
  DAY_EIGHT_RECEIPT,
  DAY_EIGHT_STARTERS,
  dayEightCondition,
  dayEightLens,
  dayEightPartName,
  dayEightReceiptRows,
  dayEightStrainLine,
} from '@/lib/mtgoa-course/day-eight'
import type { DayEightTurn } from '@/lib/mtgoa-course/day-eight'
import { clearDayEightDraft, readDayEightDraft, writeDayEightDraft } from '@/lib/mtgoa-course/day-eight-store'
import type { RoundTwoAnalyticsEvent } from '@/lib/mtgoa-course/round-two-events'
import { markCourseDayComplete } from '@/lib/mtgoa-course/mark-day-complete'

/**
 * Day 8 — Clean Up · The Organization Bottleneck 3-2-1.
 *
 * Day 7 notices what getting involved brings up. Day 8 takes the part of that
 * response with the most charge and lets it describe the job before anyone
 * designs a system around it. Six steps: entry, a draw, the strain, the 3-2-1,
 * one condition, a receipt.
 *
 * The shared `WeekTwoPractice` gave this day one screen and five textareas. A
 * 3-2-1 with a named part and a two-voice thread outgrows that, the way Days 6,
 * 9 and 10 did, so it gets its own component behind the same page.tsx seam.
 *
 * Two founder decisions of 2026-08-27 shape it. The pass is kept on the device
 * while it is open and cleared when the receipt arrives — Week 2's usual
 * session-only rule, bent exactly as far as a long 3-2-1 needs and no further.
 * And the day ends in a condition rather than a design principle: what a clean
 * arrangement would require, committing the reader to nothing.
 *
 * Colour follows the covenant. Water is Clean Up's element and carries the
 * chrome, the rings and the card frames; purple `--bars-liminal` stays the
 * primary-action colour, and the one place the page leaves water is the "Be it"
 * card, which the design paints `#a99ae0`.
 *
 * @see .specify/specs/mtgoa-day8-bottleneck-321/design_handoff/
 */

type Field = 'org' | 'own' | null
type Screen = 'entry' | 'draw' | 'strain' | 'three' | 'principle' | 'receipt'

const ORDER: Screen[] = ['entry', 'draw', 'strain', 'three', 'principle', 'receipt']

/** Clean Up is water, the same water Day 3 uses. */
const ACCENT = { base: 'var(--bars-water-glow)', lift: '#3fa9c4' }
/** The one place the day leaves water: the first-person pass. */
const BE_IT = '#a99ae0'

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
  background: '#0a1a28',
  border: '1px solid var(--bars-line-strong)',
  resize: 'vertical' as const,
}

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
  fontFamily: 'var(--bars-font-display)',
  fontWeight: 600,
  fontSize: 15,
  lineHeight: 1.4,
  textWrap: 'pretty',
} as const

export function DayEightBottleneck321({ cards }: { cards: MoveCard[] }) {
  const [screen, setScreen] = useState<Screen>('entry')
  const [field, setField] = useState<Field>(null)

  const [hand, setHand] = useState<MoveCard[]>([])
  const [chosen, setChosen] = useState<MoveCard | null>(null)
  const [sheet, setSheet] = useState<MoveCard | null>(null)

  const [starter, setStarter] = useState<string | null>(null)
  const [strainText, setStrainText] = useState('')

  const [they, setThey] = useState('')
  const [maskName, setMaskName] = useState('')
  const [thread, setThread] = useState<DayEightTurn[]>([])
  const [draft, setDraft] = useState('')
  const [voice, setVoice] = useState<'me' | 'it'>('me')
  const [i, setI] = useState('')
  const [shift, setShift] = useState('')

  const [needsText, setNeedsText] = useState('')
  const [becauseText, setBecauseText] = useState('')

  const [copied, setCopied] = useState(false)
  const [left, setLeft] = useState(false)
  const [restored, setRestored] = useState(false)
  const draftRef = useRef<HTMLTextAreaElement>(null)

  const partName = dayEightPartName(maskName)
  const strain = dayEightStrainLine(starter, strainText)
  const condition = dayEightCondition(needsText, becauseText)
  const tomorrow = nextCourseDay(8)

  /**
   * Restore an in-progress pass.
   *
   * Runs once, before the first write-back, so a reader who reloads mid-3-2-1
   * lands where they left off with the hand they were dealt.
   */
  useEffect(() => {
    const saved = readDayEightDraft()
    if (saved) {
      if (saved.step && (ORDER as string[]).includes(saved.step) && saved.step !== 'receipt') {
        setScreen(saved.step as Screen)
      }
      setField(saved.field ?? null)
      setStarter(saved.starter ?? null)
      setStrainText(saved.strainText ?? '')
      setThey(saved.they ?? '')
      setMaskName(saved.maskName ?? '')
      setThread(saved.thread ?? [])
      setI(saved.i ?? '')
      setShift(saved.shift ?? '')
      setNeedsText(saved.needsText ?? '')
      setBecauseText(saved.becauseText ?? '')
      if (saved.drawn?.length === 3) {
        const restoredHand = saved.drawn.map((num) => cards.find((c) => c.num === num)).filter((c): c is MoveCard => !!c)
        if (restoredHand.length === 3) setHand(restoredHand)
        if (saved.chosen) setChosen(restoredHand.find((c) => c.num === saved.chosen) ?? null)
      }
    }
    setRestored(true)
    track({ event: 'week_two_viewed', day: 8 })
  }, [cards])

  /**
   * Write the pass back on every change, and clear it at the receipt.
   *
   * The clear is the founder's condition on keeping anything at all: the
   * dialogue lives on the device while the practice is open, and goes when it
   * closes. The receipt still reads from component state, so nothing is lost
   * on screen.
   */
  useEffect(() => {
    if (!restored) return
    if (screen === 'receipt') {
      clearDayEightDraft()
      return
    }
    writeDayEightDraft({
      step: screen, field, starter, strainText, they, maskName, thread, i, shift, needsText, becauseText,
      drawn: hand.map((c) => c.num),
      chosen: chosen?.num ?? null,
    })
  }, [restored, screen, field, starter, strainText, they, maskName, thread, i, shift, needsText, becauseText, hand, chosen])

  useEffect(() => {
    if (screen === 'receipt') {
      markCourseDayComplete(8)
      track({ event: 'week_two_completed', day: 8 })
    }
  }, [screen])

  const go = (next: Screen) => { setScreen(next); window.scrollTo(0, 0) }
  const deal = () => setHand(drawThree(cards))
  const begin = (next: Field) => {
    setField(next)
    track({ event: 'week_two_started', day: 8 })
    if (hand.length === 0) deal()
    go('draw')
  }

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setThread((t) => [...t, { from: voice, text }])
    setDraft('')
    setVoice(voice === 'me' ? 'it' : 'me')
    draftRef.current?.focus()
  }

  const copy = () => {
    navigator.clipboard?.writeText(condition)
    track({ event: 'week_two_artifact_copied', day: 8 })
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const restart = () => {
    setField('own')
    setStarter(null); setStrainText('')
    setThey(''); setMaskName(''); setThread([]); setDraft(''); setVoice('me'); setI(''); setShift('')
    setNeedsText(''); setBecauseText(''); setChosen(null); setLeft(false)
    go('strain')
  }

  const day7 = mtgoaCourseDay(7)
  const day7Href = day7 ? linkableRoute(day7) : null
  const day3 = mtgoaCourseDay(3)
  const day3Href = day3 ? linkableRoute(day3) : null

  const stepCard = (num: string, title: string, tag: string, color: string, children: React.ReactNode) => (
    <div style={{ marginTop: 14, padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), 0 0 0 1px var(--bars-line)' }}>
      <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
        <span
          aria-hidden
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, flex: 'none',
            borderRadius: 10, fontFamily: 'var(--bars-font-display)', fontWeight: 700, fontSize: 17, color,
            boxShadow: `inset 0 0 0 1.5px ${color}80, inset 0 1px 0 rgba(255,255,255,.07)`,
          }}
        >
          {num}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: 'var(--bars-font-display)', fontWeight: 600, fontSize: 17, color: '#fff' }}>{title}</span>
          <span className="bars-label" style={{ display: 'block', marginTop: 3, color }}>{tag}</span>
        </span>
      </div>
      {children}
    </div>
  )

  const lensPanel = chosen ? (
    <div style={{ marginTop: 18, padding: '15px 16px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', boxShadow: `0 0 0 1px ${ACCENT.base}` }}>
      <StepEyebrow color={ACCENT.lift}>◇ your lens · {chosen.title}</StepEyebrow>
      <p className="bars-prose" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.5, color: '#e8e6e0', textWrap: 'pretty' }}>{dayEightLens(chosen)}</p>
    </div>
  ) : null

  return (
    <CheckShell
      label="Week 2 · Skillful Organizing · Day 8 of 30"
      moveTag="clean up · 水"
      accent={ACCENT}
      steps={ORDER.length}
      index={ORDER.indexOf(screen)}
    >
      {screen === 'entry' ? (
        <Step>
          <h1 className="bars-title" style={{ margin: 0, fontSize: 'clamp(29px,5.8vw,41px)', lineHeight: 1.14, textWrap: 'pretty' }}>
            The work will inherit the story you build it from.
          </h1>
          <StepBody top={18}>
            Yesterday you noticed what getting involved brings up. Today, take the part of that response with the most charge.
            It may have been keeping work moving for a long time. Let it describe the job before you ask it to carry anything
            else.
          </StepBody>

          <div style={{ marginTop: 22, padding: 17, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: `2px solid ${ACCENT.base}` }}>
            <StepEyebrow color={ACCENT.lift}>the contract</StepEyebrow>
            <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15.5, lineHeight: 1.6, color: '#e8e6e0', textWrap: 'pretty' }}>
              You are allowed to let a part say, &ldquo;I cannot carry this,&rdquo; &ldquo;I do not trust this yet,&rdquo; or
              &ldquo;I do not know what I need.&rdquo; Those answers change what a clean arrangement would require.
            </p>
            <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 14.5, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
              No role is assigned and nothing here asks you to delegate. You can end the practice without an action.
            </p>
          </div>

          <div style={{ marginTop: 26 }}>
            <PrimaryButton onClick={() => begin('org')} block glow>Work the organizing strain →</PrimaryButton>
          </div>
          <p className="bars-prose" style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)' }}>
            A card, one short 3-2-1, one condition.
          </p>

          <span className="bars-label" style={{ display: 'block', margin: '26px 0 11px', color: 'var(--bars-text-muted)' }}>if that is not your live question</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {day7Href ? (
              <a href={day7Href} onClick={() => track({ event: 'week_two_returned_to_day', day: 8, returnedToDay: 7 })} style={doorStyle}>
                I need to feel the invitation before I can name the strain <span aria-hidden style={{ flex: 'none', color: ACCENT.lift }}>→</span>
              </a>
            ) : null}
            {day3Href ? (
              <a href={day3Href} onClick={() => track({ event: 'week_two_returned_to_day', day: 8, returnedToDay: 3 })} style={doorStyle}>
                My live question is putting the book in someone&rsquo;s hands <span aria-hidden style={{ flex: 'none', color: ACCENT.lift }}>→</span>
              </a>
            ) : null}
            <OutlineButton onClick={() => begin('own')} block strong>Use this on work in my own life →</OutlineButton>
          </div>
          <PrivacyLine>Private by default · nothing you write is sent or saved as a course answer</PrivacyLine>
        </Step>
      ) : null}

      {screen === 'draw' ? (
        <Step>
          <BackLink onClick={() => go('entry')} />
          <StepEyebrow color={ACCENT.lift}>the allyship deck · clean up · skillful organizing</StepEyebrow>
          <StepTitle size={27}>Draw the lens first.</StepTitle>
          <StepBody>
            The card gives you one way to look at the strain before you try to explain it. It offers a question, and it leaves
            the arrangement to you.
          </StepBody>

          <div style={{ marginTop: 22 }}>
            <CardDrawRow cards={hand} carriedId={chosen?.id ?? null} onOpen={setSheet} accent={ACCENT.lift} carriedLabel="♦ chosen" />
          </div>

          {lensPanel}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <OutlineButton onClick={() => { deal(); setChosen(null); track({ event: 'week_two_redraw', day: 8 }) }}>Draw again</OutlineButton>
            <OutlineButton onClick={() => { setChosen(null); track({ event: 'week_two_draw_skipped', day: 8 }); go('strain') }}>Continue without a card</OutlineButton>
          </div>

          <div style={{ marginTop: 24 }}>
            <PrimaryButton onClick={() => go('strain')} block glow>Name the strain →</PrimaryButton>
          </div>

          {sheet ? (
            <CardDrawSheet
              card={sheet}
              carried={chosen?.id === sheet.id}
              onClose={() => setSheet(null)}
              onChoose={() => {
                const next = chosen?.id === sheet.id ? null : sheet
                setChosen(next)
                if (next) track({ event: 'week_two_card_carried', day: 8, cardId: next.id })
                setSheet(null)
              }}
              accent={ACCENT.lift}
              accentText="#03101f"
              chooseLabel="Look through this card"
              carriedLabel="Chosen ♦"
            />
          ) : null}
        </Step>
      ) : null}

      {screen === 'strain' ? (
        <Step>
          <BackLink onClick={() => go('draw')} />
          <StepEyebrow color={ACCENT.lift}>step one · the active strain</StepEyebrow>
          <StepTitle size={27}>
            {field === 'own'
              ? 'What story, feeling, or strain is shaping how you picture taking this on?'
              : 'What story, feeling, or strain is shaping how you picture getting involved?'}
          </StepTitle>
          <StepBody>Use a starter, write your own words, or skip this step entirely.</StepBody>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18 }}>
            {DAY_EIGHT_STARTERS.map((label) => {
              const selected = starter === label
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setStarter(selected ? null : label)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '14px 15px', cursor: 'pointer',
                    borderRadius: 12, border: 'none', background: selected ? '#0e1e2e' : 'var(--bars-surface-card)',
                    boxShadow: `var(--bars-shadow-inset-top), 0 0 0 ${selected ? `1.5px ${ACCENT.lift}` : '1px var(--bars-line)'}`,
                  }}
                >
                  <span style={{ display: 'block', fontFamily: 'var(--bars-font-body)', fontSize: 15.5, lineHeight: 1.42, color: selected ? '#fff' : 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>

          <textarea
            aria-label="The strain, in your own words"
            rows={2}
            value={strainText}
            placeholder="In your own words. Optional."
            onChange={(e) => setStrainText(e.target.value)}
            style={{ ...fieldStyle, marginTop: 12 }}
          />
          {starter === DAY_EIGHT_OPEN_STARTER && !strainText.trim() ? (
            <p style={{ margin: '9px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)', textWrap: 'pretty' }}>
              Your own words go in the box above. Leaving it empty is also a full answer.
            </p>
          ) : null}

          {lensPanel}

          <div style={{ marginTop: 24 }}>
            <PrimaryButton onClick={() => go('three')} block glow>Start the 3-2-1 →</PrimaryButton>
          </div>
        </Step>
      ) : null}

      {screen === 'three' ? (
        <Step>
          <BackLink onClick={() => go('strain')} />
          <StepEyebrow color={ACCENT.lift}>step two · the short 3-2-1</StepEyebrow>
          <StepTitle size={27}>Give the part a turn at the microphone.</StepTitle>
          <StepBody>
            Use the strain you named, or the one your card brought into focus. You can leave the part disagreed with,
            unargued with, and exactly where it is.
          </StepBody>

          {strain ? (
            <div style={{ marginTop: 16, padding: '13px 15px', borderRadius: 10, background: 'var(--bars-surface-inset)', borderLeft: `2px solid ${ACCENT.base}` }}>
              <span style={{ fontSize: 15.5, lineHeight: 1.5, color: '#e8e6e0', textWrap: 'pretty' }}>{strain}</span>
            </div>
          ) : null}

          {stepCard('3', 'Face it', 'third person · they', ACCENT.lift, (
            <>
              <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
                Describe the part as &ldquo;they.&rdquo; What are they trying to do? What do they keep watching for? How long
                have they been doing this job?
              </p>
              <textarea aria-label="Face it — describe the part as they" rows={8} value={they} placeholder="They’re the kind of part who…" onChange={(e) => setThey(e.target.value)} style={fieldStyle} />
            </>
          ))}

          {stepCard('2', 'Talk to it', 'second person · you · a thread', ACCENT.lift, (
            <>
              <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                Before you speak to them, what do you call them? A name that fits how they work, in place of a job title.
              </p>
              <input aria-label="A name for the part" value={maskName} placeholder="e.g. The Only One, The Carrier, The Quiet Steward" onChange={(e) => setMaskName(e.target.value)} style={fieldStyle} />

              <p style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
                Now go back and forth. Ask what they are protecting, switch voices, and let them answer in their own words.
                Keep going until they say something you did not already know.
              </p>

              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {thread.map((msg, index) => {
                  const mine = msg.from === 'me'
                  return (
                    <div key={`${index}-${msg.text}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexDirection: mine ? 'row-reverse' : 'row' }}>
                      <span
                        style={{
                          maxWidth: '82%', padding: '11px 14px',
                          borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: mine ? `color-mix(in srgb, ${ACCENT.lift} 26%, transparent)` : 'rgba(26,122,138,.18)',
                          border: `1px solid ${mine ? `color-mix(in srgb, ${ACCENT.lift} 45%, transparent)` : 'rgba(26,122,138,.45)'}`,
                          color: mine ? '#fff' : 'var(--bars-text-primary)',
                        }}
                      >
                        <span className="bars-label" style={{ display: 'block', fontSize: 9, opacity: 0.8, marginBottom: 4 }}>{mine ? 'me' : partName}</span>
                        <span style={{ display: 'block', fontSize: 15, lineHeight: 1.5 }}>{msg.text}</span>
                      </span>
                      <button
                        type="button"
                        aria-label="Remove this line"
                        onClick={() => setThread((t) => t.filter((_, j) => j !== index))}
                        style={{ ...mono, fontSize: 10, color: 'var(--bars-text-muted)', padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>

              {thread.length === 0 ? (
                <div style={{ marginTop: 14 }}>
                  <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>openers, if you want one</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
                    {DAY_EIGHT_OPENERS.map((opener) => (
                      <button
                        key={opener}
                        type="button"
                        onClick={() => { setDraft(opener); setVoice('me'); draftRef.current?.focus() }}
                        style={{
                          ...mono, fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', padding: '10px 13px',
                          minHeight: 44, borderRadius: 'var(--bars-radius-full)', cursor: 'pointer',
                          background: 'var(--bars-surface-inset)', border: '1px solid var(--bars-line)', color: 'var(--bars-text-secondary)',
                        }}
                      >
                        {opener}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--bars-line)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="bars-label" style={{ color: 'var(--bars-text-muted)' }}>speaking as</span>
                  {(['me', 'it'] as const).map((v) => {
                    const on = voice === v
                    return (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setVoice(v)}
                        style={{
                          ...mono, fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', padding: '9px 14px',
                          minHeight: 44, borderRadius: 'var(--bars-radius-full)', cursor: 'pointer',
                          color: on ? '#fff' : 'var(--bars-text-secondary)',
                          background: on ? ACCENT.lift : 'var(--bars-surface-inset)',
                          border: `1px solid ${on ? ACCENT.lift : 'var(--bars-line-strong)'}`,
                        }}
                      >
                        {v === 'me' ? 'me' : partName}
                      </button>
                    )
                  })}
                </div>
                <textarea
                  ref={draftRef}
                  aria-label="What you say next"
                  rows={3}
                  value={draft}
                  placeholder={voice === 'me'
                    ? 'Ask them something, or say the thing you would say if there were no cost…'
                    : `Answer as ${partName}, in their own words…`}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  style={{ ...fieldStyle, marginTop: 10 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <span style={{ ...mono, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
                    enter sends · shift+enter for a new line
                  </span>
                  <button
                    type="button"
                    onClick={send}
                    style={{
                      fontFamily: 'var(--bars-font-display)', fontWeight: 700, fontSize: 14, color: '#fff',
                      background: ACCENT.lift, padding: '11px 20px', minHeight: 44, borderRadius: 'var(--bars-radius-lg)',
                      border: 'none', cursor: 'pointer', boxShadow: 'var(--bars-shadow-inset-top)',
                    }}
                  >
                    say it
                  </button>
                </div>
              </div>
            </>
          ))}

          {stepCard('1', 'Be it', 'first person · I · no one else in the room', BE_IT, (
            <>
              <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
                Drop the dialogue. You are {partName} now, with nobody to convince and no arrangement to defend. Finish it:
                &ldquo;The smallest true thing I know, need, or can hand off is…&rdquo;
              </p>
              <textarea aria-label="Be it — speak as I" rows={6} value={i} placeholder="The smallest true thing is…" onChange={(e) => setI(e.target.value)} style={fieldStyle} />
              <p style={{ margin: '16px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>Come back to yourself. What shifted?</p>
              <textarea aria-label="What shifted" rows={3} value={shift} placeholder="What feels different now…" onChange={(e) => setShift(e.target.value)} style={fieldStyle} />
            </>
          ))}

          <div style={{ marginTop: 26 }}>
            <PrimaryButton onClick={() => go('principle')} block glow>Carry one condition forward →</PrimaryButton>
          </div>
          <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)', textWrap: 'pretty' }}>
            A partial 3-2-1 is a complete pass. If the part stays quiet, Day 7 is the right place to be.
          </p>
        </Step>
      ) : null}

      {screen === 'principle' ? (
        <Step>
          <BackLink onClick={() => go('three')} />
          <StepEyebrow color={ACCENT.lift}>step three · one condition</StepEyebrow>
          <StepTitle size={27}>What would let this work be organized without repeating the strain?</StepTitle>
          <StepBody>
            A condition. It describes what a clean arrangement would require, and it leaves the plan and the responsibility
            for building it to whoever holds them.
          </StepBody>

          <div style={{ marginTop: 20, padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: `var(--bars-shadow-inset-top), 0 0 0 1px ${ACCENT.base}` }}>
            <label htmlFor="d8-needs" style={{ display: 'block', margin: 0, fontSize: 16, lineHeight: 1.6, color: '#e8e6e0' }}>
              {DAY_EIGHT_RECEIPT.opening}…
            </label>
            <textarea id="d8-needs" rows={2} value={needsText} placeholder={DAY_EIGHT_RECEIPT.needsPlaceholder} onChange={(e) => setNeedsText(e.target.value)} style={{ ...fieldStyle, marginTop: 9 }} />
            <label htmlFor="d8-because" style={{ display: 'block', margin: '16px 0 0', fontSize: 16, lineHeight: 1.6, color: '#e8e6e0' }}>
              …{DAY_EIGHT_RECEIPT.turn}…
            </label>
            <textarea id="d8-because" rows={2} value={becauseText} placeholder={DAY_EIGHT_RECEIPT.becausePlaceholder} onChange={(e) => setBecauseText(e.target.value)} style={{ ...fieldStyle, marginTop: 9 }} />
          </div>

          <div style={{ marginTop: 24 }}>
            <PrimaryButton onClick={() => go('receipt')} block glow>Close the day →</PrimaryButton>
          </div>
        </Step>
      ) : null}

      {screen === 'receipt' ? (
        <Step>
          <BackLink onClick={() => go('principle')} />
          <StepEyebrow color={ACCENT.lift}>your Day 8 receipt</StepEyebrow>
          <StepTitle size={28}>{DAY_EIGHT_RECEIPT.headline}</StepTitle>

          <div style={{ marginTop: 18, padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: `var(--bars-shadow-inset-top), 0 0 0 1px ${ACCENT.base}` }}>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.58, color: '#e8e6e0', textWrap: 'pretty' }}>{condition}</p>
            <div style={{ marginTop: 14 }}>
              <OutlineButton onClick={copy}>{copied ? 'copied ♦' : 'copy this'}</OutlineButton>
            </div>
          </div>

          <div style={{ marginTop: 16, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', padding: '6px 18px 16px' }}>
            {dayEightReceiptRows({ strain, they, thread, i, shift, partName }).map((row) => (
              <div key={row.label} style={{ padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>{row.label}</span>
                <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15.5, lineHeight: 1.5, color: row.filled ? '#e8e6e0' : 'var(--bars-text-muted)', textWrap: 'pretty' }}>
                  {row.value}
                </p>
              </div>
            ))}
            {chosen ? (
              <p style={{ ...mono, margin: '13px 0 0', fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase', color: ACCENT.lift }}>
                ◇ looked through {chosen.title} · #{chosen.num}
              </p>
            ) : null}
          </div>

          <NextDayHandoff
            handoff={tomorrow}
            href={tomorrow?.route ?? undefined}
            onNavigate={() => track({ event: 'week_two_next_day_clicked', day: 8 })}
            accent={ACCENT.lift}
          />

          <span className="bars-label" style={{ display: 'block', margin: '28px 0 12px', color: 'var(--bars-text-muted)' }}>only if it fits</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {day7Href ? (
              <a href={day7Href} onClick={() => track({ event: 'week_two_returned_to_day', day: 8, returnedToDay: 7 })} style={doorStyle}>
                Return to the Organization Load Check <span aria-hidden style={{ flex: 'none', color: ACCENT.lift }}>→</span>
              </a>
            ) : null}
            <a href="/organization" onClick={() => track({ event: 'week_two_campaign_state_clicked', day: 8 })} style={doorStyle}>
              See what work is actually live <span aria-hidden style={{ flex: 'none', color: ACCENT.lift }}>→</span>
            </a>
            <button type="button" onClick={restart} style={{ ...doorStyle, cursor: 'pointer', background: 'none', textAlign: 'left', width: '100%' }}>
              Use this practice on another situation <span aria-hidden style={{ flex: 'none', color: ACCENT.lift }}>→</span>
            </button>
          </div>

          <div style={{ marginTop: 18 }}>
            <TextButton onClick={() => setLeft(true)}>Leave it here for now</TextButton>
          </div>
          {left ? (
            <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
              Left where it is. Nothing follows this, and nothing is owed.
            </p>
          ) : null}

          <PrivacyLine>
            This pass is cleared from your device · only the day number was kept
          </PrivacyLine>
        </Step>
      ) : null}
    </CheckShell>
  )
}
