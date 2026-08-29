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
  SelectRow,
  Step,
  StepBody,
  StepEyebrow,
  StepFooter,
  StepTitle,
  TextButton,
  mono,
} from './CheckKit'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { nextCourseDay } from '@/lib/mtgoa-course/course-days'
import {
  DAY_ELEVEN_ACCESS,
  DAY_ELEVEN_ACCESS_STANDARD,
  DAY_ELEVEN_COLUMNS,
  DAY_ELEVEN_COPY_LABEL,
  DAY_ELEVEN_LINES,
  DAY_ELEVEN_PRIVACY,
  DAY_ELEVEN_PROMISE,
  dayElevenAccess,
  dayElevenLedger,
  dayElevenLedgerText,
  dayElevenLineLabel,
  dayElevenReceiptHeadline,
  dayElevenUnlabelled,
  dayElevenWritten,
} from '@/lib/mtgoa-course/day-eleven'
import type { DayElevenAccess, DayElevenEntry } from '@/lib/mtgoa-course/day-eleven'
import { markCourseDayComplete } from '@/lib/mtgoa-course/mark-day-complete'
import { roundThreeDay } from '@/lib/mtgoa-course/round-three'

/**
 * Day 11 — Wake Up · What Is Already in Your Hand.
 *
 * Week 3 opens Gather Resources by counting. The reader lists five lines of a
 * starting hand, labels each with one of four honest access answers, and reads
 * the three columns the ledger sorts itself into.
 *
 * The sort is derived from the access label rather than chosen a second time.
 * A reader who says "I can offer this" has said they hold the authority, which
 * is what `Move now` means; "I can ask whether it is available" and "I have a
 * possible connection" both put a question before an offer, so both land in
 * `Ask first`. That keeps the reader answering about access, which is the thing
 * they actually know, and lets the ledger do the filing.
 *
 * This day cannot run through `WeekTwoPractice`: that component has no repeating
 * row, no per-row label, and no derived grouping — and it belongs to Week 2's
 * table, which Day 11 is outside of.
 *
 * Nothing is persisted. Week 3 has no stated invariant of its own yet, so this
 * follows Week 2's: a refresh clears the pass, and only the day number reaches
 * the progress store.
 *
 * Colour follows the covenant. Wake Up is earth, the same earth Day 6 uses, and
 * purple `--bars-liminal` stays the primary-action colour it is on every day.
 *
 * @see .specify/specs/mtgoa-day11-starting-hand/design_handoff/
 */

type Screen = 'entry' | 'draw' | 'hand' | 'access' | 'ledger' | 'receipt'

const ORDER: Screen[] = ['entry', 'draw', 'hand', 'access', 'ledger', 'receipt']

/** Wake Up is earth, the same earth Day 6 uses. */
const ACCENT = { base: 'var(--bars-earth-frame)', lift: 'var(--bars-earth-gem)' }

const DAY = 11

function emptyEntries(): DayElevenEntry[] {
  return DAY_ELEVEN_LINES.map((line) => ({ key: line.key, text: '', access: null }))
}

/** Three of the six, dealt once per pass. Fisher–Yates, matching Days 8 and 10. */
function deal(cards: MoveCard[], count: number): MoveCard[] {
  const pool = [...cards]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

export function DayElevenStartingHand({ cards }: { cards: MoveCard[] }) {
  const day = roundThreeDay(DAY)
  const [screen, setScreen] = useState<Screen>('entry')
  const [hand, setHand] = useState<MoveCard[]>(() => deal(cards, 3))
  const [open, setOpen] = useState<MoveCard | null>(null)
  const [carriedId, setCarriedId] = useState<string | null>(null)
  const [entries, setEntries] = useState<DayElevenEntry[]>(emptyEntries)
  const [copied, setCopied] = useState(false)

  const written = useMemo(() => dayElevenWritten(entries), [entries])
  const unlabelled = useMemo(() => dayElevenUnlabelled(entries), [entries])
  const ledger = useMemo(() => dayElevenLedger(entries), [entries])
  const ledgerText = useMemo(() => dayElevenLedgerText(entries), [entries])
  const carried = useMemo(() => hand.find((c) => c.id === carriedId) ?? null, [hand, carriedId])

  useEffect(() => {
    if (screen === 'receipt') markCourseDayComplete(DAY)
  }, [screen])

  const setText = (key: string, text: string) =>
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, text } : e)))

  const setAccess = (key: string, access: DayElevenAccess) =>
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, access } : e)))

  const copyLedger = () => {
    if (!ledgerText) return
    void navigator.clipboard?.writeText(ledgerText).then(
      () => setCopied(true),
      () => setCopied(false),
    )
  }

  return (
    <CheckShell
      label="Week 3 · Gather Resources · Day 11 of 30"
      moveTag="wake up · 土"
      accent={ACCENT}
      steps={ORDER.length}
      index={ORDER.indexOf(screen)}
    >
      {screen === 'entry' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>day 11 · wake up</StepEyebrow>
          <StepTitle size={30}>{DAY_ELEVEN_PROMISE}</StepTitle>
          <StepBody>{day?.entry}</StepBody>
          <StepBody top={16}>{day?.doNot}</StepBody>
          <div style={{ marginTop: 26 }}>
            <PrimaryButton block glow onClick={() => setScreen('draw')}>
              Count what you can reach
            </PrimaryButton>
          </div>
          <PrivacyLine>{DAY_ELEVEN_PRIVACY}</PrivacyLine>
        </Step>
      ) : null}

      {screen === 'draw' ? (
        <Step>
          <DeckRibbon>the deck</DeckRibbon>
          <StepTitle>{day?.drawTitle}</StepTitle>
          <StepBody>{day?.drawBody}</StepBody>
          <div style={{ marginTop: 20 }}>
            <CardDrawRow
              cards={hand}
              carriedId={carriedId}
              onOpen={setOpen}
              accent={ACCENT.lift}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <TextButton
              onClick={() => {
                setHand(deal(cards, 3))
                setCarriedId(null)
              }}
            >
              deal again
            </TextButton>
          </div>
          <StepFooter
            back={() => setScreen('entry')}
            next={{ label: 'List the hand →', onClick: () => setScreen('hand') }}
          />
        </Step>
      ) : null}

      {screen === 'hand' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>1 · the starting hand</StepEyebrow>
          <StepTitle>Write what you can already reach.</StepTitle>
          <StepBody>
            Every line is optional. A short hand that is true beats a long one that is
            aspirational.
          </StepBody>
          {carried ? (
            <p
              className="bars-prose"
              style={{
                margin: '18px 0 0',
                padding: '13px 15px',
                borderRadius: 'var(--bars-radius-lg)',
                background: 'var(--bars-surface-inset)',
                border: '1px solid var(--bars-line)',
                fontSize: 15,
                lineHeight: 1.55,
                color: 'var(--bars-text-secondary)',
              }}
            >
              <span className="bars-label" style={{ display: 'block', color: ACCENT.lift }}>
                {carried.title}
              </span>
              {day?.cardPrompts[carried.id] ?? carried.primaryQuestion}
            </p>
          ) : null}
          {DAY_ELEVEN_LINES.map((line) => (
            <PrivateField
              key={line.key}
              id={`day11-${line.key}`}
              label={line.label}
              value={entries.find((e) => e.key === line.key)?.text ?? ''}
              onChange={(text) => setText(line.key, text)}
              placeholder={line.placeholder}
              rows={3}
            />
          ))}
          <StepFooter
            back={() => setScreen('draw')}
            next={{ label: 'Tell the truth about each →', onClick: () => setScreen('access') }}
          />
        </Step>
      ) : null}

      {screen === 'access' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>2 · access</StepEyebrow>
          <StepTitle>Then tell the truth about each one.</StepTitle>
          <StepBody>{DAY_ELEVEN_ACCESS_STANDARD}</StepBody>
          {written.length === 0 ? (
            <p
              className="bars-prose"
              style={{ margin: '22px 0 0', fontSize: 16, color: 'var(--bars-text-muted)' }}
            >
              Your hand is empty so far. Go back and write at least one line.
            </p>
          ) : (
            written.map((entry) => (
              <div key={entry.key} style={{ marginTop: 26 }}>
                <span
                  className="bars-label"
                  style={{ display: 'block', color: 'var(--bars-text-muted)' }}
                >
                  {dayElevenLineLabel(entry.key)}
                </span>
                <p
                  className="bars-prose"
                  style={{
                    margin: '6px 0 12px',
                    fontSize: 16,
                    lineHeight: 1.55,
                    color: 'var(--bars-text-primary)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {entry.text.trim()}
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {DAY_ELEVEN_ACCESS.map((access) => (
                    <SelectRow
                      key={access.key}
                      selected={entry.access === access.key}
                      onClick={() => setAccess(entry.key, access.key)}
                    >
                      <span
                        className="bars-prose"
                        style={{ fontSize: 16, color: 'var(--bars-text-primary)' }}
                      >
                        {access.label}
                      </span>
                    </SelectRow>
                  ))}
                </div>
              </div>
            ))
          )}
          <StepFooter
            back={() => setScreen('hand')}
            next={{ label: 'Read the ledger →', onClick: () => setScreen('ledger') }}
          />
          {unlabelled.length > 0 ? (
            <PrivacyLine>
              {`${unlabelled.length} line${unlabelled.length === 1 ? '' : 's'} still unlabelled · they stay off the ledger`}
            </PrivacyLine>
          ) : null}
        </Step>
      ) : null}

      {screen === 'ledger' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>3 · the ledger</StepEyebrow>
          <StepTitle>Three columns. That is the whole ledger.</StepTitle>
          {DAY_ELEVEN_COLUMNS.map((column) => (
            <div key={column.key} style={{ marginTop: 24 }}>
              <span className="bars-label" style={{ display: 'block', color: ACCENT.lift }}>
                {column.label}
              </span>
              <p
                style={{
                  margin: '5px 0 0',
                  ...mono,
                  fontSize: 'var(--bars-text-2xs)',
                  color: 'var(--bars-text-muted)',
                }}
              >
                {column.blurb}
              </p>
              {ledger[column.key].length === 0 ? (
                <p
                  className="bars-prose"
                  style={{ margin: '10px 0 0', fontSize: 15, color: 'var(--bars-text-muted)' }}
                >
                  Empty today.
                </p>
              ) : (
                ledger[column.key].map((entry) => (
                  <p
                    key={entry.key}
                    className="bars-prose"
                    style={{
                      margin: '10px 0 0',
                      padding: '12px 14px',
                      borderRadius: 'var(--bars-radius-lg)',
                      background: 'var(--bars-surface-card)',
                      border: '1px solid var(--bars-line)',
                      fontSize: 16,
                      lineHeight: 1.55,
                      color: 'var(--bars-text-primary)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <span
                      className="bars-label"
                      style={{ display: 'block', color: 'var(--bars-text-muted)' }}
                    >
                      {dayElevenLineLabel(entry.key)}
                    </span>
                    {entry.text.trim()}
                  </p>
                ))
              )}
            </div>
          ))}
          <StepFooter
            back={() => setScreen('access')}
            next={{ label: 'Finish →', onClick: () => setScreen('receipt') }}
          />
        </Step>
      ) : null}

      {screen === 'receipt' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>day 11 · receipt</StepEyebrow>
          <StepTitle size={28}>{dayElevenReceiptHeadline(entries)}</StepTitle>
          <StepBody>Map it before you offer it.</StepBody>

          {ledgerText ? (
            <>
              <pre
                style={{
                  margin: '22px 0 0',
                  padding: '15px 16px',
                  borderRadius: 'var(--bars-radius-lg)',
                  background: 'var(--bars-surface-inset)',
                  border: '1px solid var(--bars-line)',
                  fontFamily: 'var(--bars-font-body)',
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: 'var(--bars-text-primary)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {ledgerText}
              </pre>
              <div style={{ marginTop: 14 }}>
                <OutlineButton block strong onClick={copyLedger}>
                  {copied ? 'copied ✓' : DAY_ELEVEN_COPY_LABEL}
                </OutlineButton>
              </div>
            </>
          ) : null}

          {carried ? (
            <div style={{ marginTop: 24 }}>
              <span className="bars-label" style={{ display: 'block', color: 'var(--bars-text-muted)' }}>
                card carried
              </span>
              <p
                className="bars-prose"
                style={{ margin: '5px 0 0', fontSize: 16, color: 'var(--bars-text-primary)' }}
              >
                {carried.title}
              </p>
            </div>
          ) : null}

          <NextDayHandoff handoff={nextCourseDay(DAY)} accent={ACCENT.lift} />
          <PrivacyLine>{DAY_ELEVEN_PRIVACY}</PrivacyLine>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
            <BackLink onClick={() => setScreen('ledger')} />
          </div>
        </Step>
      ) : null}

      {open ? (
        <CardDrawSheet
          card={open}
          carried={carriedId === open.id}
          onClose={() => setOpen(null)}
          onChoose={() => {
            setCarriedId((prev) => (prev === open.id ? null : open.id))
            setOpen(null)
          }}
          accent={ACCENT.lift}
          accentText="#1a0a00"
        />
      ) : null}
    </CheckShell>
  )
}
