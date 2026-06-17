import { FACE_COLOR, OPERATION_LABELS, DECK_FONTS } from '@/lib/allyship-deck/card-visuals'
import type { Operation } from '@/lib/allyship-deck/types'

/**
 * Squared "face" badge — the operation monogram (Shaman→S, Challenger→C, …) in its
 * identity color, with a dashed border (placeholder until final sigil art lands). The
 * right mark of a card's marks row (the move pip is the left mark).
 *
 * @see src/lib/allyship-deck/card-visuals.ts (FACE_COLOR)
 */
export function FaceBadge({ operation, size = 36 }: { operation: Operation; size?: number }) {
  const c = FACE_COLOR[operation]
  return (
    <span
      title={OPERATION_LABELS[operation]}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 9,
        fontFamily: DECK_FONTS.display,
        fontWeight: 700,
        fontSize: size * 0.42,
        color: c,
        background: `color-mix(in srgb, ${c} 14%, transparent)`,
        border: `1px dashed color-mix(in srgb, ${c} 60%, transparent)`,
        flex: 'none',
      }}
    >
      {OPERATION_LABELS[operation][0]}
    </span>
  )
}
