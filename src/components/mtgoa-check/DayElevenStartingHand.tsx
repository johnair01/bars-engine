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
  DAY_ELEVEN_ASK_STATUSES,
  DAY_ELEVEN_COLUMNS,
  DAY_ELEVEN_COPY_LABEL,
  DAY_ELEVEN_INFORMATION_NEEDS,
  DAY_ELEVEN_LINES,
  DAY_ELEVEN_PRIVACY,
  DAY_ELEVEN_PROMISE,
  dayElevenAccess,
  dayElevenBlankLedgerText,
  dayElevenLedger,
  dayElevenLedgerText,
  dayElevenLineLabel,
  dayElevenReceiptHeadline,
  dayElevenStewardEmailText,
  dayElevenUnlabelled,
  dayElevenWritten,
} from '@/lib/mtgoa-course/day-eleven'
import type { DayElevenAccess, DayElevenAskStatus, DayElevenEntry } from '@/lib/mtgoa-course/day-eleven'
import { markCourseDayComplete } from '@/lib/mtgoa-course/mark-day-complete'
import { roundThreeDay } from '@/lib/mtgoa-course/round-three'

/**
 * Day 11 — Wake Up · What Is Already in Your Hand.
 *
 * Week 3 opens Gather Resources by counting. The reader lays out a flexible
 * set of resource slips across eight starting-hand piles,
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
 * Nothing is persisted. A reader may deliberately open a drafted email of
 * selected Ask first entries to the Campaign Steward; otherwise a refresh
 * clears the pass, and only the day number reaches the progress store.
 *
 * Colour follows the covenant. Wake Up is earth, the same earth Day 6 uses, and
 * purple `--bars-liminal` stays the primary-action colour it is on every day.
 *
 * @see .specify/specs/mtgoa-day11-starting-hand/design_handoff/
 */

type Screen = 'entry' | 'draw' | 'hand' | 'access' | 'questions' | 'ledger' | 'receipt'

const ORDER: Screen[] = ['entry', 'draw', 'hand', 'access', 'questions', 'ledger', 'receipt']

/** Wake Up is earth, the same earth Day 6 uses. */
const ACCENT = { base: 'var(--bars-earth-frame)', lift: 'var(--bars-earth-gem)' }

const DAY = 11

function emptyEntries(): DayElevenEntry[] {
  return []
}

function entryFor(key: string): DayElevenEntry {
  return {
    key,
    id: `${key}-${crypto.randomUUID()}`,
    text: '',
    access: null,
    askStatus: null,
    includeInEmail: false,
  }
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
  const [informationNeeds, setInformationNeeds] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const written = useMemo(() => dayElevenWritten(entries), [entries])
  const unlabelled = useMemo(() => dayElevenUnlabelled(entries), [entries])
  const ledger = useMemo(() => dayElevenLedger(entries), [entries])
  const ledgerText = useMemo(() => dayElevenLedgerText(entries), [entries])
  const carried = useMemo(() => hand.find((c) => c.id === carriedId) ?? null, [hand, carriedId])

  useEffect(() => {
    if (screen === 'receipt') markCourseDayComplete(DAY)
  }, [screen])

  const addEntry = (key: string) => setEntries((prev) => [...prev, entryFor(key)])
  const removeEntry = (id: string) => setEntries((prev) => prev.filter((entry) => entry.id !== id))

  const setText = (id: string, text: string) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, text } : e)))

  const setAccess = (id: string, access: DayElevenAccess) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, access } : e)))

  const setAskStatus = (id: string, askStatus: DayElevenAskStatus | null) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, askStatus } : e)))

  const toggleIncludeInEmail = (id: string) =>
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, includeInEmail: !e.includeInEmail } : e)))

  const toggleInformationNeed = (need: string) =>
    setInformationNeeds((prev) => prev.includes(need) ? prev.filter((item) => item !== need) : [...prev, need])

  const copyLedger = () => {
    if (!ledgerText) return
    void navigator.clipboard?.writeText(ledgerText).then(
      () => setCopied(true),
      () => setCopied(false),
    )
  }

  const downloadText = (filename: string, content: string) => {
    const href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = href
    link.download = filename
    link.click()
    URL.revokeObjectURL(href)
  }

  const emailHref = useMemo(() => {
    const body = dayElevenStewardEmailText(entries, informationNeeds)
    return `mailto:wendell@masteringallyship.com?subject=${encodeURIComponent('Day 11 Resource Ledger')}&body=${encodeURIComponent(body)}`
  }, [entries, informationNeeds])

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
          {DAY_ELEVEN_LINES.map((line) => {
            const categoryEntries = entries.filter((entry) => entry.key === line.key)
            return (
              <section key={line.key} style={{ marginTop: 22 }}>
                <span className="bars-label" style={{ display: 'block', color: ACCENT.lift }}>
                  {line.label}
                </span>
                <p className="bars-prose" style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--bars-text-muted)' }}>
                  {line.placeholder}
                </p>
                {categoryEntries.map((entry, index) => (
                  <div key={entry.id} style={{ marginTop: 10 }}>
                    <PrivateField
                      id={`day11-${entry.id}`}
                      label={`${line.label} ${index + 1} · stays in your browser`}
                      value={entry.text}
                      onChange={(text) => setText(entry.id, text)}
                      placeholder="Add one short private label…"
                      rows={2}
                    />
                    <div style={{ marginTop: 6 }}>
                      <TextButton onClick={() => removeEntry(entry.id)}>remove this item</TextButton>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 10 }}>
                  <OutlineButton onClick={() => addEntry(line.key)}>+ add {line.label.toLowerCase()}</OutlineButton>
                </div>
              </section>
            )
          })}
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
              <div key={entry.id} style={{ marginTop: 26 }}>
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
                      onClick={() => setAccess(entry.id, access.key)}
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
            next={{ label: 'What do I need to know? →', onClick: () => setScreen('questions') }}
          />
          {unlabelled.length > 0 ? (
            <PrivacyLine>
              {`${unlabelled.length} line${unlabelled.length === 1 ? '' : 's'} still unlabelled · they stay off the ledger`}
            </PrivacyLine>
          ) : null}
        </Step>
      ) : null}

      {screen === 'questions' ? (
        <Step>
          <StepEyebrow color={ACCENT.lift}>3 · campaign facts</StepEyebrow>
          <StepTitle>What would make this offer clear?</StepTitle>
          <StepBody>
            Select the campaign facts you would need before deciding whether a resource should move. You can select none.
          </StepBody>
          <div style={{ display: 'grid', gap: 8, marginTop: 22 }}>
            {DAY_ELEVEN_INFORMATION_NEEDS.map((need) => (
              <SelectRow key={need} selected={informationNeeds.includes(need)} onClick={() => toggleInformationNeed(need)}>
                <span className="bars-prose" style={{ fontSize: 15, color: 'var(--bars-text-primary)' }}>{need}</span>
              </SelectRow>
            ))}
          </div>
          <StepFooter back={() => setScreen('access')} next={{ label: 'Put it in the ledger →', onClick: () => setScreen('ledger') }} />
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
                  <div
                    key={entry.id}
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 13, fontSize: 14, color: 'var(--bars-text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={entry.askStatus !== null}
                        onChange={(event) => setAskStatus(entry.id, event.target.checked ? 'sent' : null)}
                      />
                      I made the ask / transfer
                    </label>
                    {entry.askStatus ? (
                      <select
                        aria-label={`Ask or transfer status for ${entry.text.trim()}`}
                        value={entry.askStatus}
                        onChange={(event) => setAskStatus(entry.id, event.target.value as DayElevenAskStatus)}
                        style={{ width: '100%', minHeight: 40, marginTop: 10, padding: '8px 10px', borderRadius: 8, color: 'var(--bars-text-primary)', background: 'var(--bars-surface-inset)', border: '1px solid var(--bars-line)' }}
                      >
                        {DAY_ELEVEN_ASK_STATUSES.map((status) => <option key={status.key} value={status.key}>{status.label}</option>)}
                      </select>
                    ) : null}
                    {column.key === 'ask_first' ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 14, color: 'var(--bars-text-secondary)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={entry.includeInEmail} onChange={() => toggleIncludeInEmail(entry.id)} />
                        Include this resource in an email to the Campaign Steward
                      </label>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          ))}
          <StepFooter back={() => setScreen('questions')} next={{ label: 'See my Resource Ledger →', onClick: () => setScreen('receipt') }} />
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

          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            <OutlineButton block onClick={() => downloadText('my-resource-ledger.txt', ledgerText || dayElevenBlankLedgerText())}>
              Download my Resource Ledger
            </OutlineButton>
            <OutlineButton block onClick={() => downloadText('resource-ledger-blank.txt', dayElevenBlankLedgerText())}>
              Download a blank ledger
            </OutlineButton>
            <OutlineButton block onClick={() => window.print()}>
              Print my ledger
            </OutlineButton>
          </div>

          <div style={{ marginTop: 24, padding: 17, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)', border: '1px solid var(--bars-liminal)' }}>
            <span className="bars-label" style={{ display: 'block', color: 'var(--bars-liminal-glow)' }}>offer to explore fit</span>
            <p className="bars-prose" style={{ margin: '8px 0 0', fontSize: 15, lineHeight: 1.55, color: 'var(--bars-text-secondary)' }}>
              Email only the selected Ask first resources and the campaign facts you want answered. Nothing else from this ledger leaves your browser.
            </p>
            <a href={emailHref} style={{ display: 'block', marginTop: 14, color: '#fff', textDecoration: 'none', background: 'var(--bars-liminal)', padding: '13px 14px', borderRadius: 'var(--bars-radius-lg)', textAlign: 'center', fontFamily: 'var(--bars-font-display)', fontWeight: 700 }}>
              Email selected resources and questions to the Campaign Steward
            </a>
          </div>

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
