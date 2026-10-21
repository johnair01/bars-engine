'use client'

/**
 * Unchosen: the lines he named on past mornings and did not choose, and the words that keep coming back in them
 * (six-faces-council pass unchosen1). Wendell, 2026-10-21: "emotional energy and idea energy that isn't being pulled
 * into our flows of yet".
 *
 * Closed until he opens it, with no count on the closed row, like the seed library (sl-no-pressure). Read-only: a
 * line here is not owed anything, and a word that keeps returning is something still arising, never avoidance
 * (tb-loss-not-avoidance).
 *
 * The council's weekly read (uc-who-reads B) sits under the words: each pattern it read, with one pitch and the lines
 * it came from. A pitch is an offer, never a task (uc-no-duty). When a pattern returns, the new pitch replaces the old
 * and the old one shows muted underneath as composted, so he can see it get sharper (his steer on uc-pattern-returns).
 */

import { useState } from 'react'
import type { UnchosenLine, UnchosenPattern } from '@/lib/tap-the-vein/unchosen'
import type { PitchView } from '@/lib/tap-the-vein/unchosen-read'

const mono = 'var(--bars-font-mono)'
const body = 'var(--bars-font-body)'
const purple = 'var(--bars-liminal)'

const FATE_LABEL: Record<UnchosenLine['fate'], string> = {
  raw: 'left raw',
  composted: 'composted',
  unpicked: 'marked play, not picked',
}

const card = {
  padding: '10px 12px',
  background: 'var(--bars-surface-card)',
  boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)',
}

function byDay(lines: UnchosenLine[]): [string, UnchosenLine[]][] {
  const days = new Map<string, UnchosenLine[]>()
  for (const l of lines) days.set(l.day, [...(days.get(l.day) ?? []), l])
  return [...days.entries()]
}

function Pitches({ pitches }: { pitches: PitchView[] }) {
  return (
    <div className="rounded-xl" style={card}>
      <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: 0 }}>
        The council&rsquo;s read · yours to take or leave
      </p>
      {pitches.map((p) => (
        <div key={p.id} style={{ marginTop: 10 }}>
          <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.08em', color: purple, margin: 0 }}>
            {p.word} · {p.face} · week of {p.weekOf}
          </p>
          <p style={{ fontFamily: body, fontSize: 12.5, color: 'var(--bars-text-secondary)', margin: '3px 0 0' }}>{p.kernel}</p>
          <p style={{ fontFamily: body, fontSize: 13.5, color: 'var(--bars-text-primary)', margin: '4px 0 0' }}>{p.pitch}</p>
          <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none' }}>
            {p.quotes.map((q, i) => (
              <li key={`${q.day}-${i}`} style={{ fontFamily: body, fontSize: 12, color: 'var(--bars-text-secondary)', marginTop: 2 }}>
                &ldquo;{q.text}&rdquo; <span style={{ fontFamily: mono, fontSize: 8.5, color: 'var(--bars-text-muted)' }}>{q.day}</span>
              </li>
            ))}
          </ul>
          {p.composted.map((c, i) => (
            <p key={i} style={{ fontFamily: body, fontSize: 12, color: 'var(--bars-text-muted)', margin: '4px 0 0', textDecoration: 'line-through' }}>
              {c.pitch}{' '}
              <span style={{ fontFamily: mono, fontSize: 8.5, textDecoration: 'none', display: 'inline-block' }}>composted, week of {c.weekOf}</span>
            </p>
          ))}
        </div>
      ))}
    </div>
  )
}

export function Unchosen({
  lines,
  patterns,
  pitches = [],
  sample = false,
  defaultOpen = false,
}: {
  lines: UnchosenLine[]
  patterns: UnchosenPattern[]
  pitches?: PitchView[]
  sample?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [word, setWord] = useState<string | null>(null)
  const picked = patterns.find((p) => p.word === word) ?? null

  return (
    <div style={{ marginTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-secondary)', background: 'none' }}
      >
        {open ? '▾' : '▸'} Not chosen
      </button>

      {open && (
        <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
          {sample && (
            <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.08em', color: 'var(--bars-text-muted)', margin: 0 }}>
              SAMPLE MORNINGS, NOT YOURS: drop &amp;sample=1 from the address to see your own.
            </p>
          )}
          {lines.length === 0 && (
            <p style={{ fontFamily: body, fontSize: 12.5, color: 'var(--bars-text-muted)', margin: 0 }}>
              Nothing yet. Lines you name in a brainstorm and don&rsquo;t pick show here from the next morning on.
            </p>
          )}

          {lines.length > 0 && (
            <div className="rounded-xl" style={card}>
              <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: 0 }}>
                Keeps coming back
              </p>
              {patterns.length === 0 ? (
                <p style={{ fontFamily: body, fontSize: 12.5, color: 'var(--bars-text-muted)', margin: '6px 0 0' }}>
                  No word has come back on two mornings yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2" style={{ marginTop: 8 }}>
                  {patterns.map((p) => (
                    <button
                      key={p.word}
                      type="button"
                      aria-pressed={word === p.word}
                      onClick={() => setWord(word === p.word ? null : p.word)}
                      className="rounded-full"
                      style={{
                        fontFamily: body,
                        fontSize: 12.5,
                        padding: '3px 10px',
                        color: word === p.word ? 'var(--bars-text-primary)' : purple,
                        background: word === p.word ? 'var(--bars-surface-raised, rgba(255,255,255,0.08))' : 'none',
                        boxShadow: 'inset 0 0 0 1px var(--bars-line)',
                      }}
                    >
                      {p.word} · {p.days.length} mornings
                    </button>
                  ))}
                </div>
              )}
              {picked && (
                <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
                  {picked.lines.map((l, i) => (
                    <li key={`${l.day}-${i}`} style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-primary)', marginTop: 4 }}>
                      {l.text}{' '}
                      <span style={{ fontFamily: mono, fontSize: 8.5, color: 'var(--bars-text-muted)' }}>{l.day}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {pitches.length > 0 && <Pitches pitches={pitches} />}

          {byDay(lines).map(([day, dayLines]) => (
            <div key={day} className="rounded-xl" style={card}>
              <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.08em', color: 'var(--bars-text-muted)', margin: 0 }}>{day}</p>
              {dayLines.map((l, i) => (
                <p key={i} style={{ fontFamily: body, fontSize: 13.5, color: l.fate === 'composted' ? 'var(--bars-text-muted)' : 'var(--bars-text-primary)', margin: '4px 0 0' }}>
                  {l.text}{' '}
                  <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.06em', color: 'var(--bars-text-muted)' }}>{FATE_LABEL[l.fate]}</span>
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
