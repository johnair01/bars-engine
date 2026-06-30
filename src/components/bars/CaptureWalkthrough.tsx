'use client'

/**
 * CaptureWalkthrough — first-run coach-marks for the seed-capture canvas.
 *
 * Players told us they didn't understand how to capture a seed. This walks the
 * five-beat flow once on first visit (write → attune → charge → capture → Hand),
 * is gated by localStorage so it only auto-shows once, and stays replayable from
 * a quiet "How it works" pill. A video embed slot is left for a real screen
 * recording (set WALKTHROUGH_VIDEO_URL).
 *
 * Mounted inside SeedCaptureWhiteboard's phone-frame container, so absolute
 * positioning lands within the canvas.
 */

import { useEffect, useState } from 'react'

const SEEN_KEY = 'bars:capture:walkthrough-seen'

// Drop a real screen-recording URL here later (mp4 or embed) — the slot renders
// automatically when set; until then players see a labelled placeholder.
const WALKTHROUGH_VIDEO_URL = ''

type Step = {
  kicker: string
  title: string
  body: string
  // Where the relevant control lives, as a hint arrow on the card.
  point?: 'right' | 'down' | 'up'
}

const STEPS: Step[] = [
  {
    kicker: 'Step 1 · Write',
    title: 'Write your spark',
    body: 'Tap the board (or the “Aa” tool) and type what’s charged for you right now — a line, a scrap, whatever wants out.',
    point: 'up',
  },
  {
    kicker: 'Step 2 · Attune',
    title: 'Give it an element',
    body: 'Tap a colour on the right rail to tint your seed. Each colour is an element — and the emotion it carries.',
    point: 'right',
  },
  {
    kicker: 'Step 3 · Charge',
    title: 'Set the charge',
    body: 'Down below, say how charged it feels — from “barely a flicker” to “can’t put it down.”',
    point: 'down',
  },
  {
    kicker: 'Step 4 · Capture',
    title: 'Capture the seed',
    body: 'Hit “Capture this seed →” to plant it. That’s the whole move — no forms, no required fields.',
    point: 'down',
  },
  {
    kicker: 'Step 5 · Hand',
    title: 'It lands in your Hand',
    body: 'Your seed drops into your Hand — the cards you’re carrying. Tune it any time to grow it into a quest.',
  },
]

function ArrowHint({ point }: { point: NonNullable<Step['point']> }) {
  const glyph = point === 'right' ? '→' : point === 'down' ? '↓' : '↑'
  const label =
    point === 'right' ? 'the element rail →' : point === 'down' ? '↓ the bottom bar' : '↑ the board'
  return (
    <span
      className="font-mono uppercase"
      style={{ color: '#a855f7', fontSize: 10, letterSpacing: '0.12em' }}
    >
      <span style={{ fontSize: 13 }}>{glyph}</span> {label}
    </span>
  )
}

export function CaptureWalkthrough({ onOpenLegend }: { onOpenLegend?: () => void }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  // Auto-show once on first visit.
  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) {
        setStep(0)
        setOpen(true)
      }
    } catch {
      /* localStorage unavailable — skip auto-show */
    }
  }, [])

  function dismiss() {
    setOpen(false)
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  function replay() {
    setStep(0)
    setOpen(true)
  }

  // Quiet replay affordance when the walkthrough isn't showing.
  if (!open) {
    return (
      <button
        onClick={replay}
        aria-label="Show me how to capture a seed"
        className="absolute font-mono uppercase"
        style={{
          left: 14,
          bottom: 14,
          zIndex: 30,
          fontSize: 9,
          letterSpacing: '0.12em',
          color: 'rgba(232,226,218,0.6)',
          background: 'rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
          backdropFilter: 'blur(5px)',
          border: 'none',
          borderRadius: 999,
          padding: '6px 11px',
          cursor: 'pointer',
        }}
      >
        How it works
      </button>
    )
  }

  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div
      className="absolute inset-0 flex flex-col justify-end"
      style={{ zIndex: 50, background: 'rgba(5,4,3,0.78)', backdropFilter: 'blur(3px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="How to capture a seed"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) dismiss()
      }}
    >
      <div
        style={{
          margin: 14,
          borderRadius: 18,
          padding: '20px 20px 16px',
          background: 'linear-gradient(180deg, #201d2b, #15131c)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(124,58,237,0.5), 0 -10px 40px -12px rgba(124,58,237,0.4)',
        }}
      >
        {/* Progress dots */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="font-mono uppercase"
            style={{ color: '#a855f7', fontSize: 9.5, letterSpacing: '0.14em' }}
          >
            {s.kicker}
          </span>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === step ? 16 : 6,
                  height: 6,
                  borderRadius: 999,
                  background: i === step ? '#a855f7' : 'rgba(232,226,218,0.22)',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>

        <h3 className="font-bold" style={{ color: '#f4f1ec', fontSize: 19, letterSpacing: '-0.01em' }}>
          {s.title}
        </h3>
        <p className="mt-1.5 leading-relaxed" style={{ color: '#c9c5be', fontSize: 13.5 }}>
          {s.body}
        </p>

        {s.point && (
          <div className="mt-2.5">
            <ArrowHint point={s.point} />
          </div>
        )}

        {step === 1 && onOpenLegend && (
          <button
            onClick={onOpenLegend}
            className="mt-2"
            style={{ color: '#a855f7', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            What do the elements mean? →
          </button>
        )}

        {/* Final step: video slot for a real end-to-end recording. */}
        {isLast && (
          <div className="mt-3">
            {WALKTHROUGH_VIDEO_URL ? (
              <video
                src={WALKTHROUGH_VIDEO_URL}
                controls
                playsInline
                style={{ width: '100%', borderRadius: 12, display: 'block' }}
              />
            ) : (
              <div
                className="flex flex-col items-center justify-center text-center"
                style={{
                  aspectRatio: '16 / 9',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  color: 'rgba(232,226,218,0.45)',
                  gap: 6,
                  padding: 12,
                }}
              >
                <span style={{ fontSize: 22 }}>▶</span>
                <span className="font-mono uppercase" style={{ fontSize: 9.5, letterSpacing: '0.12em' }}>
                  Full walkthrough video — coming soon
                </span>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={dismiss}
            className="font-mono uppercase"
            style={{ color: 'rgba(232,226,218,0.5)', fontSize: 10, letterSpacing: '0.12em', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((n) => Math.max(0, n - 1))}
                style={{
                  padding: '9px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e8e6e0',
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? dismiss() : setStep((n) => Math.min(STEPS.length - 1, n + 1)))}
              style={{
                padding: '9px 18px',
                borderRadius: 999,
                background: '#7c3aed',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 0 20px -6px rgba(168,85,247,0.6), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              {isLast ? 'Start capturing' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
