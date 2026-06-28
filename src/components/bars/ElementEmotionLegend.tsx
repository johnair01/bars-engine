'use client'

/**
 * ElementEmotionLegend — the shared "what do the elements mean?" explainer.
 *
 * Surfaces the connection players were missing: every Wuxing element is a
 * channel for one emotion, and a captured charge is energy, not a verdict.
 *
 * Single source of truth:
 *   - sigil / English name / emotion  → ELEMENT_TOKENS (src/lib/ui/card-tokens.ts)
 *   - the lesson each charge points at → ELEMENTS (src/lib/quest-grammar/elements.ts)
 *
 * Used inline (e.g. the wiki field guide) and as a modal overlay on the capture
 * canvas. Design ref: design_handoff_bars_v1_intake "Elements and Emotional Alchemy".
 */

import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import { ELEMENTS } from '@/lib/quest-grammar/elements'

// Read the elements in the order energy naturally flows (the generative cycle).
const FLOW_ORDER: ElementKey[] = ['wood', 'fire', 'earth', 'metal', 'water']

// Short, plain-language lesson per element (mirrors the field-guide copy; falls
// back to the canonical ELEMENTS lesson).
const SHORT_LESSON: Record<ElementKey, string> = {
  wood: 'Vitality detected — something alive and worth growing.',
  fire: 'An obstacle is present, or a boundary was crossed.',
  earth: 'Whole-system perspective. Grounded detachment.',
  metal: 'Risk — or opportunity — detected. Excitement is fear read as opportunity.',
  water: 'Something you care about is distant or misaligned.',
}

function ElementCard({ el }: { el: ElementKey }) {
  const t = ELEMENT_TOKENS[el]
  const lesson = SHORT_LESSON[el] ?? ELEMENTS[el].lesson
  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl p-4"
      style={{
        background: `radial-gradient(ellipse 120% 80% at 50% 0%, color-mix(in srgb, ${t.frame} 12%, transparent), transparent 60%), #1a1a18`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px color-mix(in srgb, ${t.frame} 55%, transparent)`,
      }}
    >
      <span
        style={{ color: t.gem, textShadow: `0 0 14px ${t.glow}`, fontSize: 30, lineHeight: 1 }}
        aria-hidden
      >
        {t.sigil}
      </span>
      <div>
        <div className="font-semibold" style={{ color: '#e8e6e0', fontSize: 17 }}>
          {t.label}
        </div>
        <div
          className="font-mono uppercase mt-0.5"
          style={{ color: '#6b6965', fontSize: 9.5, letterSpacing: '0.1em' }}
        >
          {t.sigil} · {t.label}
        </div>
      </div>
      <span
        className="self-start font-mono uppercase rounded"
        style={{
          color: t.gem,
          fontSize: 10,
          letterSpacing: '0.04em',
          padding: '4px 9px',
          background: `color-mix(in srgb, ${t.frame} 16%, transparent)`,
          boxShadow: `inset 0 0 0 1px ${t.frame}`,
        }}
      >
        {t.emotion}
      </span>
      <p className="leading-snug" style={{ color: '#a09e98', fontSize: 13, margin: 0 }}>
        {lesson}
      </p>
    </div>
  )
}

export function ElementEmotionLegend({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="font-bold" style={{ color: '#e8e6e0', fontSize: 22, letterSpacing: '-0.02em' }}>
          The five elements &amp; their emotions
        </h2>
        <p className="mt-2 leading-relaxed" style={{ color: '#a09e98', fontSize: 14 }}>
          Every charge you capture is <em style={{ fontStyle: 'normal', color: '#e8e6e0' }}>energy</em>, not
          a verdict. Each element is a channel for one emotion — the colour you attune a seed to says which
          emotion it carries. It&apos;s an energy economy, not a morality wheel.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Charge = energy detected', 'Element = which channel', 'Alchemy = how it moves'].map((chip) => (
            <span
              key={chip}
              className="font-mono rounded"
              style={{
                fontSize: 11,
                color: '#a09e98',
                padding: '6px 11px',
                background: '#111110',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)',
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        {FLOW_ORDER.map((el) => (
          <ElementCard key={el} el={el} />
        ))}
      </div>
    </div>
  )
}

/** Modal wrapper for surfacing the legend over the capture canvas. */
export function ElementEmotionLegendModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ zIndex: 45, background: 'rgba(5,4,3,0.92)', backdropFilter: 'blur(9px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="What the elements mean"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex items-center justify-between" style={{ padding: '18px 18px 6px' }}>
        <span
          className="font-mono uppercase"
          style={{ color: 'rgba(232,226,218,0.6)', fontSize: 9, letterSpacing: '0.14em' }}
        >
          火 水 木 金 土 · Field guide
        </span>
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            background: '#7c3aed',
            color: '#fff',
            fontFamily: 'Space Mono, monospace',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ padding: '8px 16px 24px' }}>
        <ElementEmotionLegend />
        <a
          href="/wiki/emotional-alchemy"
          className="mt-5 inline-flex items-center gap-2"
          style={{ color: '#a855f7', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
        >
          Learn the full alchemy →
        </a>
      </div>
    </div>
  )
}
