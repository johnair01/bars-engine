import { themeForMove } from '@/lib/allyship-deck/card-visuals'
import type { BasicMove } from '@/lib/allyship-deck/types'
import { MoveIcon } from './MoveIcon'

/**
 * Circular move "pip" — an element-gradient disc holding the move glyph. The left mark
 * of a card's marks row (the face badge is the right mark).
 *
 * @see src/lib/allyship-deck/card-visuals.ts (themeForMove)
 */
export function MovePip({ move, size = 34 }: { move: BasicMove; size?: number }) {
  const t = themeForMove(move)
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(150deg, ${t.glow}, ${t.frame})`,
        boxShadow: `0 0 10px -3px ${t.glow}`,
        flex: 'none',
      }}
    >
      <MoveIcon move={move} size={Math.round(size * 0.53)} />
    </span>
  )
}
