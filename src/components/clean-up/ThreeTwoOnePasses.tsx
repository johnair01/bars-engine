'use client'

import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { CLEAN_UP_OPENERS } from '@/lib/clean-up/check-content'

import styles from './CleanUpCheck.module.css'

/**
 * The three passes of the 3-2-1, with the two-voice thread for "Talk to it".
 *
 * Lifted out of the Clean Up check (`/mastering-allyship/clean-up`, step 4) so
 * the same interface runs on `/coaching` (Wendell, 2026-10-06: "the 321 should
 * use the interactive 321 that's inside of bars engine"). The check renders
 * exactly what it rendered before; the coaching page passes its own openers
 * and name placeholder.
 *
 * The five answers are controlled by the caller, which needs them for its own
 * receipt. The draft line and the current voice are local: they reset when the
 * passes unmount, which is when both callers reset their work anyway.
 */

export type Voice = 'me' | 'it'
export type ThreadMessage = { from: Voice; text: string }

const NUM_COLORS = { '3': 'var(--cu-water-lift)', '2': 'var(--bars-water-gem)', '1': 'var(--bars-liminal-glow)' } as const

const mono: CSSProperties = { fontFamily: 'var(--bars-font-mono)' }
const display: CSSProperties = { fontFamily: 'var(--bars-font-display)' }

/** The Clean Up water tokens, set here too so the passes render outside the check's `.root`. */
const WATER_VARS = { '--cu-water': 'var(--bars-water-glow)', '--cu-water-lift': '#3fa9c4' } as CSSProperties

type Props = {
  faceCharge: string
  setFaceCharge: (value: string) => void
  maskName: string
  setMaskName: (value: string) => void
  thread: ThreadMessage[]
  setThread: (update: (current: ThreadMessage[]) => ThreadMessage[]) => void
  beVoice: string
  setBeVoice: (value: string) => void
  beShift: string
  setBeShift: (value: string) => void
  openers?: readonly string[]
  namePlaceholder?: string
}

export function ThreeTwoOnePasses({
  faceCharge,
  setFaceCharge,
  maskName,
  setMaskName,
  thread,
  setThread,
  beVoice,
  setBeVoice,
  beShift,
  setBeShift,
  openers = CLEAN_UP_OPENERS,
  namePlaceholder = 'e.g. The Cynic, The Protector, The Good Ally',
}: Props) {
  const [draft, setDraft] = useState('')
  const [voice, setVoice] = useState<Voice>('me')
  const partName = maskName.trim() || 'the part'

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setThread((current) => [...current, { from: voice, text }])
    setDraft('')
    setVoice(voice === 'me' ? 'it' : 'me')
  }

  return (
    <div style={WATER_VARS}>
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
          placeholder={namePlaceholder}
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
              {openers.map((opener) => (
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
            <SayButton onClick={send} />
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
    </div>
  )
}

function SayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={`${styles.clk} ${styles.press}`}
      onClick={onClick}
      style={{
        ...display,
        fontWeight: 700,
        fontSize: 14,
        color: '#fff',
        background: 'var(--bars-liminal)',
        padding: '11px 20px',
        minHeight: 44,
        textAlign: 'center',
        borderRadius: 'var(--bars-radius-lg)',
        border: 'none',
        flex: 'none',
        whiteSpace: 'nowrap',
        boxShadow: 'var(--bars-shadow-inset-top)',
      }}
    >
      say it
    </button>
  )
}

export function NumBadge({ num }: { num: '1' | '2' | '3' | string }) {
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
