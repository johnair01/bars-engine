/**
 * Superpower emotional arcs + accent resolution (ADR 0002).
 *
 * A superpower is an *arc* across elements (its emotional alchemy path), not a
 * single Wuxing channel. Its identity color is its own accent — never a borrowed
 * element. Element stays a property of cards/moves/emotions only.
 */
import type { ElementKey } from '@/lib/ui/card-tokens'

/** One leg of a superpower's emotional alchemy: a `from → to` shift on an element. */
export interface EmotionArc {
  /** The dissatisfied / raw emotion (e.g. "Anger", "Fear", "Neutrality"). */
  from: string
  /** The metabolized / satisfied emotion (e.g. "Triumph", "Clarity", "Peace"). */
  to: string
  /** The Wuxing element this leg runs on. */
  element: ElementKey
}

/** Distinct elements an arc touches, in first-seen order. */
export function arcElements(arc: EmotionArc[]): ElementKey[] {
  const seen = new Set<ElementKey>()
  const out: ElementKey[] = []
  for (const leg of arc) {
    if (!seen.has(leg.element)) {
      seen.add(leg.element)
      out.push(leg.element)
    }
  }
  return out
}

/**
 * The arc's anchor element — its first leg. Use ONLY as a neutral card-frame
 * default where an `ElementKey` is structurally required; it is not an identity
 * claim (a superpower is the whole arc, not this one element). See ADR 0002.
 */
export function arcAnchorElement(arc: EmotionArc[], fallback: ElementKey = 'earth'): ElementKey {
  return arc[0]?.element ?? fallback
}

/**
 * Resolve a superpower's identity accent (ADR 0002, option A+B).
 * - `accentOverride` (a superpower-owned, non-Wuxing hue) wins when set.
 * - otherwise a gradient across the arc's element gems — derived from meaning,
 *   so distinct arcs read distinctly. Mono-element arcs (e.g. coach vs disruptor)
 *   are the case an override is meant to disambiguate.
 *
 * Returns a CSS color/gradient value (usable as `background`).
 */
export function superpowerAccentCss(arc: EmotionArc[], accentOverride?: string): string {
  if (accentOverride) return accentOverride
  const els = arcElements(arc)
  if (els.length === 0) return 'var(--bars-text-secondary)'
  if (els.length === 1) return `var(--bars-${els[0]}-gem)`
  const stops = els
    .map((el, i) => `var(--bars-${el}-gem) ${Math.round((i / (els.length - 1)) * 100)}%`)
    .join(', ')
  return `linear-gradient(135deg, ${stops})`
}

/** Human "Anger→Triumph (Fire) + …" rendering of an arc, for labels/alt text. */
export function arcToProse(arc: EmotionArc[]): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  return arc.map((leg) => `${leg.from}→${leg.to} (${cap(leg.element)})`).join(' + ')
}
