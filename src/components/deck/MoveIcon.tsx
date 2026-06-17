import { MOVE_ICON_PATHS, MOVE_ICON_FILLED } from '@/lib/allyship-deck/card-visuals'
import type { BasicMove } from '@/lib/allyship-deck/types'

/**
 * The glyph for one of the five Basic Moves (viewBox 0 0 64 64). `clean_up` renders
 * filled; the rest are stroked. Default color is the dark ink used on a bright move pip.
 *
 * @see src/lib/allyship-deck/card-visuals.ts (MOVE_ICON_PATHS)
 */
export function MoveIcon({
  move,
  size = 18,
  color = '#150a04',
}: {
  move: BasicMove
  size?: number
  color?: string
}) {
  const paths = MOVE_ICON_PATHS[move] ?? []
  const filled = MOVE_ICON_FILLED[move]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={filled ? 1.5 : 3.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}
