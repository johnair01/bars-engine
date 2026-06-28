'use client'

import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS, STAGE_TOKENS, elementLabel, type ElementKey } from '@/lib/ui/card-tokens'

/**
 * Renders the Face of a BAR card — image + first line teaser.
 * Used in list cards and as the "Face" view in detail.
 *
 * Canvas-captured BARs store their text in `canvasLayout` (and may have an
 * empty `description` when they are photo/voice-only), so the teaser falls
 * back to the first text sticker. When the BAR carries an element, the card
 * wears the element treatment (tint wash + sigil badge + charge dots);
 * old-format BARs (no element) keep the neutral surface — no regression.
 *
 * Design ref: design_handoff_bars_now_loop / "BARS Canvas BAR Display".
 */

type Sticker = { type?: string; text?: string }

function isElementKey(v: string | null | undefined): v is ElementKey {
  return v === 'fire' || v === 'water' || v === 'wood' || v === 'metal' || v === 'earth'
}

function firstTextSticker(canvasLayout: string | null | undefined): string {
  if (!canvasLayout) return ''
  try {
    const arr = JSON.parse(canvasLayout)
    if (!Array.isArray(arr)) return ''
    const t = (arr as Sticker[]).find((i) => i?.type === 'text' && i.text?.trim())
    return t?.text?.trim() ?? ''
  } catch {
    return ''
  }
}

export function BarCardFace({
  description,
  imageUrl,
  canvasLayout,
  element,
  charge,
  className = '',
}: {
  description: string
  imageUrl?: string | null
  canvasLayout?: string | null
  element?: string | null
  charge?: number | null
  className?: string
}) {
  const desc = (description || '').trim()
  // Teaser: description first line → first text sticker → captured-moment fallback.
  const teaser =
    desc.split(/\r?\n/)[0]?.trim() ||
    firstTextSticker(canvasLayout) ||
    '— a moment, captured'

  const el = isElementKey(element) ? ELEMENT_TOKENS[element] : null
  const st = STAGE_TOKENS['seed']
  const chargeLevel = typeof charge === 'number' && charge >= 1 ? Math.min(5, Math.round(charge)) : 0

  return (
    <CultivationCard
      stage="seed"
      altitude="dissatisfied"
      element={el ? (element as ElementKey) : undefined}
      className={className}
      aria-label={
        el
          ? `${elementLabel(element as ElementKey, { withEmotion: true })} seed — ${teaser}`
          : teaser
      }
    >
      <div className={`card-art-window ${st.artWindowHeight} overflow-hidden rounded-t-xl bg-black/20 relative`}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            className={`w-full h-full object-cover object-center ${st.artOpacity}`}
          />
        )}
        {/* Element sigil badge — only when the BAR carries an element.
            Sigil is a watermark; pair it with the English name + emotion so the
            Chinese character never stands alone. */}
        {el && !imageUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span
              style={{ color: el.gem, textShadow: `0 0 12px ${el.glow}`, fontSize: 38, lineHeight: 1 }}
              aria-hidden
            >
              {el.sigil}
            </span>
            <span
              className="font-mono text-[9px] uppercase tracking-[0.14em]"
              style={{ color: el.gem, opacity: 0.85 }}
            >
              {elementLabel(element as ElementKey, { withEmotion: true })}
            </span>
          </div>
        )}
      </div>
      <div className="p-4 relative z-10">
        {/* Kicker — names the BAR's origin, like the prototype Face card. */}
        <span className="block font-mono text-[7.5px] uppercase tracking-[0.1em] text-zinc-600 text-center mb-2">
          {canvasLayout ? 'from the canvas' : 'note'}
        </span>
        <p className="font-mono text-sm text-zinc-300 line-clamp-2 break-words text-center min-h-[40px] flex items-center justify-center">
          {teaser}
        </p>
        {/* Charge dots — element gem when present, liminal purple otherwise */}
        {chargeLevel > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-2" aria-label={`Charge ${chargeLevel} of 5`}>
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < chargeLevel
              return (
                <span
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: filled ? (el?.gem ?? '#7c3aed') : 'rgba(232,226,218,0.18)',
                    boxShadow: filled ? `0 0 6px 1px ${el?.glow ?? '#7c3aed'}` : 'none',
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    </CultivationCard>
  )
}
