'use client'

import { useEffect, useState } from 'react'
import type { Operation } from '@/lib/allyship-deck/types'

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
import type { MtgoaOrganizationState } from '@/lib/mtgoa-course/organization-state'
import type { RoundTwoAnalyticsEvent } from '@/lib/mtgoa-course/round-two-events'
import { markCourseDayComplete } from '@/lib/mtgoa-course/mark-day-complete'

type Field = 'org' | 'own' | null
type Screen = 'entry' | 'faces' | 'draw' | 'rep' | 'receipt'

const ORDER: Screen[] = ['entry', 'faces', 'draw', 'rep', 'receipt']

const FACE_COLOR: Record<Operation, string> = {
  shaman: '#6fd0d0', challenger: '#e8896f', regent: '#e0c25a',
  architect: '#9fb2c8', diplomat: '#6fc795', sage: '#a99ae0',
}

/**
 * Day 9's reading of each Grow Up · Skillful Organizing card.
 *
 * Keyed by operation rather than by card id or deck number: there is exactly
 * one card per Face in this pool, and the Face is the stable identity. The
 * deck's own question still shows in the card sheet.
 */
const DAY_NINE_LENS: Record<Operation, string> = {
  shaman: 'What capacity is already beginning to appear in the way you see this tension?',
  challenger: 'What would you need to stop carrying, controlling, or rescuing for this work to have a real holder?',
  regent: 'Which repeatable rep — documentation, facilitation, delegation, or follow-through — will make this role trustworthy?',
  architect: 'What capability would make this small structure useful to more than one person?',
  diplomat: 'How can this role build another person’s capacity rather than turn them into invisible labor?',
  sage: 'What kind of stewarding practice is this teaching you to carry forward?',
}

/**
 * Six operations a living organization needs — the Faces read as work rather
 * than as a personality sort. Authored content, carried over from the Day 9
 * design reference.
 *
 * @see .specify/specs/mtgoa-day9-role-rep/design_handoff/
 */
const FACES: readonly {
  key: Operation
  name: string
  tag: string
  needs: string
  looks: string
  contribute: string
  question: string
}[] = [
  {
    key: 'shaman', name: 'Shaman', tag: 'feel the work',
    needs: 'People who can feel into the work and give feedback about what it is actually like to receive, practice, or be affected by it.',
    looks: 'Readers tell us where a page lands, where a practice does not make sense, what charge a campaign invitation creates, and what a person who needs help would actually experience.',
    contribute: 'Responding to a specific feedback invitation; naming a lived experience the book or a practice needs to account for; helping a steward tell useful friction apart from confusing design.',
    question: 'Who needs a way to sense and report what this work is actually like?',
  },
  {
    key: 'challenger', name: 'Challenger', tag: 'challenge the story',
    needs: 'People who publicly challenge the narratives that explain away why allyship is hard — and who challenge themselves to take ecological actions that may feel unfamiliar.',
    looks: 'Someone names when “I have no influence” is being used to avoid a useful handoff, or when a campaign is being made too gentle to move anything. Someone tests a direct, consentful action instead of only agreeing with the values.',
    contribute: 'Sharing a precise book excerpt or campaign claim with a person who could use it; naming an assumption that deserves a real test; taking a bounded action that contributes to a live campaign goal.',
    question: 'What story about this work needs a direct challenge, and what action would test it?',
  },
  {
    key: 'regent', name: 'Regent', tag: 'hold what people can belong to',
    needs: 'Traditions, roles, and structures scoped well enough that people can feel safe, understand what they are entering, and know how work is held and passed on.',
    looks: 'A newcomer can find a campaign brief, know who stewards a decision, understand a task’s terms, and see a clean way to pause or leave. A role remembers the work after the person holding it changes.',
    contribute: 'Documenting a working practice; making a campaign task or role easier for the next person to understand; helping a steward clarify scope, decision rights, or return rhythm.',
    question: 'What needs a clear scope, rhythm, or inherited practice so people can enter without guessing?',
  },
  {
    key: 'architect', name: 'Architect', tag: 'build systems that enact the values',
    needs: 'Systems that promote the organization’s values through the ordinary way work moves.',
    looks: 'The campaign page, intake, Deck practice, contact route, recognition design, and feedback process make consent, usefulness, renewable capacity, and real agency easier to practice.',
    contribute: 'Finding where an existing system asks people to act against a stated value; helping turn a value into an observable behavior, a supporting system, and a review question; improving a handoff people already use.',
    question: 'Which value should this system make easier to practice, and where does the current design teach the opposite?',
  },
  {
    key: 'diplomat', name: 'Diplomat', tag: 'make room for the people in the work',
    needs: 'A way to metabolize many perspectives while keeping the work sustainable, equitable, and kind.',
    looks: 'The people affected by a decision can understand its terms and find a route for feedback or repair. Capacity costs are visible. A person’s relationship is never treated as campaign inventory.',
    contribute: 'Bringing a missing perspective to a current design question; helping a group make a clean agreement; naming the cost, consent, or repair path a campaign decision needs.',
    question: 'Whose perspective or cost does this role need to receive before it acts, and what terms make that exchange workable?',
  },
  {
    key: 'sage', name: 'Sage', tag: 'learn the game, place agency close to the work',
    needs: 'Practices that help people recognize which Face, game, or level of complexity has live business today — and places where people can take agency inside clear authority.',
    looks: 'A person can name a tension, choose an appropriate move, make a local decision within their role, and return with what the action taught them. The organization learns instead of waiting for every decision to come from the founder.',
    contribute: 'Running a practice and returning with a learning; helping translate a recurring tension into a role or experiment; stewarding a clearly bounded piece of work where the authority is visible.',
    question: 'Which Face has live business here, and what authority can be placed close enough to the tension for someone to act?',
  },
]

/** Days a reader can route to when the Role Rep turns out to be the wrong move. */
const DIAGNOSTIC_DOORS: readonly { day: number; label: string }[] = [
  { day: 7, label: 'Day 7 Load Check — involvement activates too much load' },
  { day: 8, label: 'Day 8 3-2-1 — a story is designing the system' },
]

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

const trim = (v: string) => v.trim()
/** Drop a trailing period so a field reads inside the receipt sentence. */
const clause = (v: string) => trim(v).replace(/\.$/, '')
/**
 * Close a sentence without doubling punctuation. A learning question the reader
 * typed usually ends in "?", and "…chasing it?." reads like a typo.
 */
const endSentence = (v: string) => (/[.?!]$/.test(v) ? v : `${v}.`)

/**
 * Day 9 — Grow Up · The Role Rep.
 *
 * Two halves. First the organization read through the six Faces, so a reader
 * can see what the work actually asks for. Then an optional Role Rep: a named
 * piece of work with a purpose, accountabilities, a decision boundary and a
 * return date, which the reader can copy and hand to someone.
 *
 * Nothing is persisted, matching the Week 2 invariant — a refresh clears the
 * pass, and only the day number reaches the progress store.
 */
export function DayNineRoleRep({
  cards,
  orgState,
  hasOpenRoute,
}: {
  cards: MoveCard[]
  orgState: MtgoaOrganizationState
  hasOpenRoute: boolean
}) {
  const [screen, setScreen] = useState<Screen>('entry')
  const [field, setField] = useState<Field>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [openFaces, setOpenFaces] = useState<Operation[]>(['shaman'])
  const [learnFace, setLearnFace] = useState<Operation | null>(null)

  const [hand, setHand] = useState<MoveCard[]>([])
  const [chosen, setChosen] = useState<MoveCard | null>(null)
  const [sheet, setSheet] = useState<MoveCard | null>(null)

  const [tension, setTension] = useState('')
  const [roleName, setRoleName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [accs, setAccs] = useState(['', '', ''])
  const [boundary, setBoundary] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [learning, setLearning] = useState('')
  const [copiedLine, setCopiedLine] = useState(false)
  const [copiedRep, setCopiedRep] = useState(false)

  useEffect(() => {
    if (screen === 'receipt') {
      markCourseDayComplete(9)
      track({ event: 'week_two_completed', day: 9 })
    }
  }, [screen])

  const go = (next: Screen) => { setScreen(next); window.scrollTo(0, 0) }
  const begin = (next: Field) => { setField(next); track({ event: 'week_two_started', day: 9 }); go('faces') }
  const deal = () => setHand(drawThree(cards))

  const accent = { base: 'var(--bars-wood-frame)', lift: 'var(--bars-wood-gem)' }
  const tomorrow = nextCourseDay(9)
  const learn = FACES.find((f) => f.key === learnFace) ?? null
  const filledAccs = accs.map(trim).filter(Boolean)
  const dateLabel = returnDate
    ? new Date(`${returnDate}T00:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
    : ''

  const receiptSentence =
    `For the tension “${trim(tension) || '___'},” I am trying ${trim(roleName) || '___'}` +
    endSentence(` because its purpose is ${clause(purpose) || '___'}`) +
    endSentence(` The first next action is ${clause(nextAction) || '___'}`) +
    endSentence(` I will come back on ${dateLabel || '___'} and look for ${clause(learning) || '___'}`)

  const repArtifact = [
    `ROLE REP — ${trim(roleName) || 'unnamed role'}`,
    `Tension: ${trim(tension) || '—'}`,
    `Purpose: ${trim(purpose) || '—'}`,
    `Accountabilities: ${filledAccs.length ? filledAccs.map((a, i) => `${i + 1}) ${a}`).join('  ') : '—'}`,
    `Decision boundary: ${trim(boundary) || 'none named'}`,
    `First next action: ${trim(nextAction) || '—'}`,
    `Return: ${dateLabel || '—'} · looking for: ${trim(learning) || '—'}`,
    '',
    'Made as a Day 9 practice in Mastering the Game of Allyship. A proposal, not a claim on anyone’s time.',
  ].join('\n')

  const copy = (text: string, mark: (v: boolean) => void) => {
    navigator.clipboard?.writeText(text)
    track({ event: 'week_two_artifact_copied', day: 9 })
    mark(true)
    window.setTimeout(() => mark(false), 1800)
  }

  const fieldStyle = {
    width: '100%', marginTop: 11, padding: '13px 14px', borderRadius: 10, fontSize: 16, lineHeight: 1.55,
    fontFamily: 'var(--bars-font-body)', color: 'var(--bars-text-primary)', background: '#0c1a11',
    border: '1px solid var(--bars-line-strong)',
  } as const

  const repCard = (num: string, title: string, hint: string, hintColor: string, children: React.ReactNode) => (
    <div style={{ padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), 0 0 0 1px var(--bars-line)' }}>
      <div style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
        <span
          aria-hidden
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, flex: 'none',
            borderRadius: 10, fontFamily: 'var(--bars-font-display)', fontWeight: 700, fontSize: 17, color: hintColor,
            boxShadow: `inset 0 0 0 1.5px ${hintColor}66, inset 0 1px 0 rgba(255,255,255,.07)`,
          }}
        >
          {num}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: 'var(--bars-font-display)', fontWeight: 600, fontSize: 17, color: '#fff' }}>{title}</span>
          <span className="bars-label" style={{ display: 'block', marginTop: 3, color: hintColor }}>{hint}</span>
        </span>
      </div>
      {children}
    </div>
  )

  return (
    <CheckShell
      label="Week 2 · Skillful Organizing · Day 9 of 30"
      moveTag="grow up · 木"
      accent={accent}
      steps={ORDER.length}
      index={ORDER.indexOf(screen)}
    >
      {screen === 'entry' ? (
        <Step>
          <h1 className="bars-title" style={{ margin: 0, fontSize: 'clamp(29px,5.8vw,41px)', lineHeight: 1.14, textWrap: 'pretty' }}>
            Here is how this organization needs to grow.
          </h1>
          <StepBody top={18}>
            Mastering the Game of Allyship needs more than people who care about allyship. It needs people who can sense what
            the work is asking for, challenge the stories that keep it small, build trustworthy structures, design systems
            that carry values, hold many perspectives, and help the whole thing learn.
          </StepBody>
          <StepBody>The Six Faces give us a way to see that work. Start by looking at the organization through each one.</StepBody>

          <div style={{ marginTop: 22, padding: 17, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: `2px solid ${accent.base}` }}>
            <StepEyebrow color={accent.lift}>the live field</StepEyebrow>
            <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 15.5, lineHeight: 1.6, color: '#e8e6e0', textWrap: 'pretty' }}>
              Helping <em>Mastering the Game of Allyship</em> reach people who could use it. You can use this practice on that
              campaign or on a piece of your own allyship life.
            </p>
            <p className="bars-prose" style={{ margin: '9px 0 0', fontSize: 14.5, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
              Nothing here enrolls you, assigns a role, or sends anything to anyone. You can finish the day without designing a thing.
            </p>
          </div>

          <CampaignStatePanel
            orgState={orgState}
            hasOpenRoute={hasOpenRoute}
            open={panelOpen}
            onToggle={() => { setPanelOpen((o) => !o); if (!panelOpen) track({ event: 'week_two_state_panel_opened', day: 9 }) }}
            onSurfaceClick={() => track({ event: 'week_two_campaign_state_clicked', day: 9 })}
          />

          <div style={{ marginTop: 26 }}>
            <PrimaryButton onClick={() => begin('org')} block glow>Explore the Six Faces of the organization →</PrimaryButton>
          </div>
          <p className="bars-prose" style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)' }}>
            What each Face does here, and what a contribution looks like.
          </p>

          <span className="bars-label" style={{ display: 'block', margin: '26px 0 11px', color: 'var(--bars-text-muted)' }}>other ways in</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <OutlineButton onClick={() => begin('own')} block strong>Use this in my own allyship life →</OutlineButton>
            <OutlineButton onClick={() => { setField('own'); deal(); go('rep') }} block strong>
              I already have a live piece of work — go to the Role Rep →
            </OutlineButton>
          </div>
          <PrivacyLine>Session-only · nothing you write is stored, sent, or saved as a course answer</PrivacyLine>
        </Step>
      ) : null}

      {screen === 'faces' ? (
        <Step>
          <BackLink onClick={() => go('entry')} />
          <StepEyebrow color={accent.lift}>step one · the organization through six Faces</StepEyebrow>
          <StepTitle size={27}>Six operations a living organization needs.</StepTitle>
          <StepBody>
            A person can bring more than one, and the question is which operation has live business today. Open them in any order.
          </StepBody>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 20 }}>
            {FACES.map((f) => {
              const open = openFaces.includes(f.key)
              const isLearn = learnFace === f.key
              const color = FACE_COLOR[f.key]
              return (
                <div
                  key={f.key}
                  style={{
                    borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)',
                    boxShadow: `var(--bars-shadow-inset-top), 0 0 0 ${isLearn ? `1.5px ${color}b3` : '1px var(--bars-line)'}`,
                  }}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaces(open ? openFaces.filter((k) => k !== f.key) : [...openFaces, f.key])}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 13, padding: '16px 17px', width: '100%',
                      background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit', minHeight: 44,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, flex: 'none',
                        borderRadius: 9, fontFamily: 'var(--bars-font-display)', fontWeight: 700, fontSize: 16, color,
                        background: `color-mix(in srgb, ${color} 14%, transparent)`, border: `1px dashed color-mix(in srgb, ${color} 60%, transparent)`,
                      }}
                    >
                      {f.name.charAt(0)}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontFamily: 'var(--bars-font-display)', fontWeight: 600, fontSize: 17, color: '#fff' }}>{f.name}</span>
                      <span className="bars-label" style={{ display: 'block', marginTop: 3, color }}>{f.tag}</span>
                    </span>
                    <span aria-hidden style={{ ...mono, flex: 'none', fontSize: 15, color: 'var(--bars-text-muted)' }}>{open ? '−' : '+'}</span>
                  </button>

                  {open ? (
                    <div style={{ padding: '0 17px 17px' }}>
                      <div style={{ height: 1, background: 'var(--bars-line)', marginBottom: 15 }} />
                      <StepEyebrow color={accent.lift}>MTGOA needs</StepEyebrow>
                      <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15.5, lineHeight: 1.55, color: '#e8e6e0', textWrap: 'pretty' }}>{f.needs}</p>

                      <span className="bars-label" style={{ display: 'block', marginTop: 15, color: 'var(--bars-text-muted)' }}>what this looks like in the work</span>
                      <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15.5, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>{f.looks}</p>

                      <span className="bars-label" style={{ display: 'block', marginTop: 15, color: 'var(--bars-text-muted)' }}>a contribution might be</span>
                      <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15.5, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>{f.contribute}</p>

                      <div style={{ marginTop: 15, padding: '13px 14px', borderRadius: 10, background: 'var(--bars-surface-inset)', borderLeft: `2px solid ${color}` }}>
                        <StepEyebrow color={color}>the Role Rep question here</StepEyebrow>
                        <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15, lineHeight: 1.5, color: '#e8e6e0', textWrap: 'pretty' }}>{f.question}</p>
                      </div>

                      <div style={{ marginTop: 15 }}>
                        <OutlineButton onClick={() => setLearnFace(isLearn ? null : f.key)}>
                          {isLearn ? '◇ the Face I want to learn' : 'This is the Face I want to learn'}
                        </OutlineButton>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 26, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <BackLink onClick={() => go('entry')} />
            <PrimaryButton onClick={() => { deal(); go('draw') }} glow>Draw three ways to grow →</PrimaryButton>
          </div>
        </Step>
      ) : null}

      {screen === 'draw' ? (
        <Step>
          <StepEyebrow color={accent.lift}>the allyship deck · grow up · skillful organizing</StepEyebrow>
          <StepTitle>Six ways a capacity grows.</StepTitle>
          <StepBody>They are verbs — ways of growing something. Choose one, draw again, or continue without a card.</StepBody>

          <div style={{ marginTop: 22 }}>
            <CardDrawRow cards={hand} carriedId={chosen?.id ?? null} onOpen={setSheet} accent={accent.lift} carriedLabel="♦ chosen" />
          </div>

          {chosen ? (
            <div style={{ marginTop: 18, padding: 15, borderRadius: 'var(--bars-radius-lg)', border: `1px solid ${accent.base}`, background: 'var(--bars-surface-inset)' }}>
              <StepEyebrow color={accent.lift}>◇ your lens · {chosen.title}</StepEyebrow>
              <p className="bars-prose" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.5, color: '#e8e6e0' }}>{DAY_NINE_LENS[chosen.operation]}</p>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <OutlineButton onClick={() => { deal(); setChosen(null); track({ event: 'week_two_redraw', day: 9 }) }}>Draw again</OutlineButton>
            <OutlineButton onClick={() => { setChosen(null); track({ event: 'week_two_draw_skipped', day: 9 }); go('rep') }}>Continue without a card</OutlineButton>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <BackLink onClick={() => go('faces')} />
            <PrimaryButton onClick={() => go('rep')} glow>Build the Role Rep →</PrimaryButton>
          </div>

          {sheet ? (
            <CardDrawSheet
              card={sheet}
              carried={chosen?.id === sheet.id}
              onClose={() => setSheet(null)}
              onChoose={() => {
                const next = chosen?.id === sheet.id ? null : sheet
                setChosen(next)
                if (next) track({ event: 'week_two_card_carried', day: 9, cardId: next.id })
                setSheet(null)
              }}
              accent={accent.lift}
              accentText="#04140b"
              chooseLabel="Practice through this card"
              carriedLabel="Chosen ♦"
            />
          ) : null}
        </Step>
      ) : null}

      {screen === 'rep' ? (
        <Step>
          <BackLink onClick={() => go('draw')} />
          <StepEyebrow color={accent.lift}>step two · the Role Rep · optional</StepEyebrow>
          <StepTitle size={27}>A role is a piece of work. It is not a costume you have to become.</StepTitle>
          <StepBody>
            {field === 'own'
              ? 'Use it on a family, workplace, neighborhood, project, or allyship practice where you have standing to shape the work.'
              : 'Use it on the piece of work you just found, or on something in your own life.'}{' '}
            Every field is optional. Leave a field blank when the honest answer is not there yet — empty authority language is
            worse than a blank.
          </StepBody>

          {chosen ? (
            <div style={{ marginTop: 18, padding: '15px 16px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', boxShadow: `0 0 0 1px ${accent.base}` }}>
              <StepEyebrow color={accent.lift}>◇ your lens · {chosen.title}</StepEyebrow>
              <p className="bars-prose" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.5, color: '#e8e6e0' }}>{DAY_NINE_LENS[chosen.operation]}</p>
            </div>
          ) : null}

          <div style={{ marginTop: 18, padding: '16px 17px', borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', borderLeft: `2px solid ${accent.base}` }}>
            <StepEyebrow color={accent.lift}>the tension this is for</StepEyebrow>
            <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15, lineHeight: 1.5, color: 'var(--bars-text-secondary)' }}>
              A difference between what is happening and what could work better. One line.
            </p>
            <input
              aria-label="The tension this role is for"
              value={tension}
              onChange={(e) => setTension(e.target.value)}
              placeholder="e.g. host offers sit unanswered for a week"
              style={fieldStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
            {repCard('1', 'Role name', 'give the work a name someone could recognize', accent.lift, (
              <input aria-label="Role name" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Book Tour Host Follow-Up" style={fieldStyle} />
            ))}

            {repCard('2', 'Purpose', 'what does this role make possible?', accent.lift, (
              <textarea
                aria-label="Purpose" rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Potential hosts receive a timely, clear response and know what the next conversation is for."
                style={{ ...fieldStyle, resize: 'vertical' }}
              />
            ))}

            {repCard('3', 'Accountabilities', 'what recurring work belongs here? up to three', accent.lift, (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {['e.g. Review new host offers', 'e.g. Send the initial reply', 'e.g. Flag leads that need a founder decision'].map((ph, i) => (
                  <input
                    key={ph}
                    aria-label={`Accountability ${i + 1}`}
                    value={accs[i]}
                    onChange={(e) => setAccs(accs.map((a, j) => (j === i ? e.target.value : a)))}
                    placeholder={ph}
                    style={fieldStyle}
                  />
                ))}
              </div>
            ))}

            {repCard('4', 'Decision boundary', 'only if there is one', accent.lift, (
              <>
                <p className="bars-prose" style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' }}>
                  What can this holder decide, use, or steward without checking upward each time? Leave it blank when the answer is not real.
                </p>
                <textarea aria-label="Decision boundary" rows={2} value={boundary} onChange={(e) => setBoundary(e.target.value)} placeholder="Optional." style={{ ...fieldStyle, resize: 'vertical' }} />
              </>
            ))}

            {repCard('5', 'First next action', 'one action that can happen within seven days', accent.lift, (
              <textarea
                aria-label="First next action" rows={2} value={nextAction} onChange={(e) => setNextAction(e.target.value)}
                placeholder="e.g. Reply to the two host offers already waiting." style={{ ...fieldStyle, resize: 'vertical' }}
              />
            ))}

            {repCard('6', 'Return date and learning question', 'when will you look again, and what will tell you it helped?', '#a99ae0', (
              <>
                <input aria-label="Return date" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} style={fieldStyle} />
                <textarea
                  aria-label="Learning question" rows={2} value={learning} onChange={(e) => setLearning(e.target.value)}
                  placeholder="e.g. Did a host get a reply without me chasing it?" style={{ ...fieldStyle, marginTop: 9, resize: 'vertical' }}
                />
              </>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <PrimaryButton onClick={() => go('receipt')} block glow>Close the day →</PrimaryButton>
          </div>
          <p className="bars-prose" style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)', textWrap: 'pretty' }}>
            A blank Role Rep is a complete pass. Learning that this work needs a different technology — or an earlier move — is a real result.
          </p>
        </Step>
      ) : null}

      {screen === 'receipt' ? (
        <Step>
          <StepEyebrow color={accent.lift}>your Day 9 receipt</StepEyebrow>
          <StepTitle size={28}>
            {learn ? `You looked at the organization and found ${learn.name} work.` : 'You looked at the organization through all six Faces.'}
          </StepTitle>

          <div style={{ marginTop: 18, padding: 18, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', boxShadow: `var(--bars-shadow-inset-top), 0 0 0 1px ${accent.base}` }}>
            <p className="bars-prose" style={{ margin: 0, fontSize: 17, lineHeight: 1.58, color: '#e8e6e0', textWrap: 'pretty' }}>{receiptSentence}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
              <OutlineButton onClick={() => copy(receiptSentence, setCopiedLine)}>{copiedLine ? 'copied ♦' : 'copy this'}</OutlineButton>
              <OutlineButton onClick={() => copy(repArtifact, setCopiedRep)}>{copiedRep ? 'copied ♦' : 'copy the role rep'}</OutlineButton>
            </div>
          </div>

          <div style={{ marginTop: 16, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-inset)', padding: '6px 18px 16px' }}>
            {([
              ['the Face I want to learn', learn ? `${learn.name} · ${learn.tag}` : ''],
              ['the tension', trim(tension)],
              ['the role', trim(roleName)],
              ['purpose', trim(purpose)],
              ['accountabilities', filledAccs.join(' · ')],
              ['decision boundary', trim(boundary)],
              ['first next action', trim(nextAction)],
              ['return · looking for', (dateLabel || trim(learning)) ? `${dateLabel || 'no date'} · ${trim(learning) || 'nothing named yet'}` : ''],
            ] as const).map(([label, value]) => {
              // An unnamed boundary is a real answer here, so it says so rather
              // than reading as a field the reader forgot.
              const empty = label === 'decision boundary' ? '— none named, and that is an honest answer' : '— left blank'
              return (
                <div key={label} style={{ padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>{label}</span>
                  <p className="bars-prose" style={{ margin: '7px 0 0', fontSize: 15.5, lineHeight: 1.5, color: value ? '#e8e6e0' : 'var(--bars-text-muted)', textWrap: 'pretty' }}>
                    {value || empty}
                  </p>
                </div>
              )
            })}
            {chosen ? (
              <p style={{ ...mono, margin: '13px 0 0', fontSize: 11.5, letterSpacing: '.12em', textTransform: 'uppercase', color: accent.lift }}>
                ◇ practised through {chosen.title} · #{chosen.num}
              </p>
            ) : null}
          </div>

          <NextDayHandoff
            handoff={tomorrow}
            href={tomorrow?.route ?? undefined}
            onNavigate={() => track({ event: 'week_two_next_day_clicked', day: 9 })}
            accent={accent.lift}
          />

          <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid var(--bars-line)' }}>
            <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>if the Role Rep was the wrong move</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {DIAGNOSTIC_DOORS.map((door) => {
                const target = mtgoaCourseDay(door.day)
                const route = target ? linkableRoute(target) : null
                if (!route) return null
                return (
                  <a
                    key={door.day}
                    href={route}
                    onClick={() => track({ event: 'week_two_returned_to_day', day: 9, returnedToDay: door.day })}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '15px 17px',
                      borderRadius: 'var(--bars-radius-lg)', border: '1px solid var(--bars-line-strong)',
                      color: 'var(--bars-text-primary)', textDecoration: 'none', fontSize: 15, textWrap: 'pretty',
                    }}
                  >
                    {door.label} <span aria-hidden style={{ flex: 'none', color: accent.lift }}>→</span>
                  </a>
                )
              })}
            </div>
          </div>

          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <BackLink onClick={() => go('rep')} />
            <TextButton onClick={() => { setTension(''); setRoleName(''); setPurpose(''); setAccs(['', '', '']); setBoundary(''); setNextAction(''); setReturnDate(''); setLearning(''); setChosen(null); go('rep') }}>
              Build another Role Rep
            </TextButton>
          </div>
          <PrivacyLine>Closing the tab is also a complete move.</PrivacyLine>
        </Step>
      ) : null}
    </CheckShell>
  )
}
