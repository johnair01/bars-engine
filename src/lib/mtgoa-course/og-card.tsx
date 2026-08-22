import type { ReactElement } from 'react'

import { DECK_GOLD, MOVE_SIGIL, themeForMove } from '@/lib/allyship-deck/card-visuals'
import type { BasicMove } from '@/lib/allyship-deck/types'
import { MTGOA_COURSE_LENGTH, MTGOA_MOVE_ORDER } from '@/lib/mtgoa-course/course-days'
import type { CourseIndexDay } from '@/lib/mtgoa-course/course-index'

/**
 * The social preview card, drawn once for all thirty days.
 *
 * A link to a course day previews as bare text without one of these, which is a
 * real cost on a page whose whole job is being linked to. Every string here
 * comes from `course-index.ts` and every colour from the move's own element
 * channel, so a day gets its card by shipping rather than by anyone drawing one.
 *
 * Satori, which renders these, is not a browser: every element needs an explicit
 * `display`, and it cannot read a CSS variable, `color-mix` or `oklch`. So the
 * palette is resolved to hex here through `themeForMove` rather than referenced
 * through the `--bars-*` tokens the rest of the app uses.
 *
 * @see src/app/mastering-allyship/course/[round]/[move]/opengraph-image.tsx
 */

export const OG_SIZE = { width: 1200, height: 630 } as const
export const OG_CONTENT_TYPE = 'image/png'

const SITE = 'MASTERINGALLYSHIP.COM/COURSE'
const CANVAS_TEXT = '#ffffff'
const CANVAS_MUTED = '#e3dce6'

/**
 * Headline size, stepped down as the line gets longer.
 *
 * Week 1's headlines run from four words to twelve ("Something has your
 * attention. Until you work it, it works you."), and a single size either clips
 * the long one or wastes the short one. Satori has no text measurement, so the
 * step is on character count.
 */
function headlineSize(headline: string): number {
  const length = headline.length
  if (length <= 34) return 78
  if (length <= 52) return 66
  if (length <= 74) return 56
  return 48
}

function Shell({
  gradFrom,
  gradTo,
  glow,
  eyebrow,
  eyebrowColor,
  headline,
  footLeft,
  children,
}: {
  gradFrom: string
  gradTo: string
  glow: string
  eyebrow: string
  eyebrowColor: string
  headline: string
  footLeft: ReactElement
  children?: ReactElement
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        padding: 66,
        background: `linear-gradient(135deg, ${gradTo} 0%, ${gradFrom} 62%, ${gradTo} 100%)`,
        color: CANVAS_TEXT,
      }}
    >
      {/* The element's glow, thrown off the top-right corner. */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          width: 760,
          height: 760,
          right: -150,
          top: -210,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${glow}88, ${glow}00 68%)`,
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 23, letterSpacing: 5, color: eyebrowColor }}>
            {eyebrow}
          </div>
          <div style={{ display: 'flex', fontSize: 21, letterSpacing: 3, color: DECK_GOLD }}>
            MASTERING ALLYSHIP
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 960 }}>
          <div
            style={{
              display: 'flex',
              fontSize: headlineSize(headline),
              lineHeight: 1.06,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            {headline}
          </div>
          {children}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {footLeft}
          <div style={{ display: 'flex', fontSize: 20, letterSpacing: 3, color: CANVAS_MUTED }}>
            {SITE}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * A gem in an element's colour, carrying that move's mark.
 *
 * Four of the five marks are Wu Xing characters, which Satori's fallback font
 * covers. Open Up's is `◇` — it is liminal rather than an element, so it carries
 * a threshold lozenge instead of a character — and that codepoint has no glyph
 * in that font. It rendered as a tofu box, which on the index card sat second in
 * a row of five and read as a broken image.
 *
 * So the diamond is drawn rather than typed: a square turned forty-five degrees,
 * which needs no font at all. The design system keeps `◇` untouched; this is the
 * one surface that cannot rely on a font being there.
 */
function Gem({
  move,
  frame,
  glow,
  size = 54,
}: {
  move: BasicMove
  frame: string
  glow: string
  size?: number
}) {
  const sigil = MOVE_SIGIL[move]
  const drawn = move === 'open_up'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 999,
        background: `linear-gradient(150deg, ${glow}, ${frame})`,
        border: `2px solid ${DECK_GOLD}`,
        fontSize: Math.round(size * 0.44),
        color: CANVAS_TEXT,
      }}
    >
      {drawn ? (
        <div
          style={{
            display: 'flex',
            width: Math.round(size * 0.3),
            height: Math.round(size * 0.3),
            border: `2px solid ${CANVAS_TEXT}`,
            transform: 'rotate(45deg)',
          }}
        />
      ) : (
        sigil
      )}
    </div>
  )
}

/** One course day. */
export function courseDayOgCard(day: CourseIndexDay): ReactElement {
  const theme = themeForMove(day.move)
  return (
    <Shell
      gradFrom={theme.gradFrom}
      gradTo={theme.gradTo}
      glow={theme.glow}
      eyebrow={`DAY ${day.number} OF ${MTGOA_COURSE_LENGTH}`}
      eyebrowColor={theme.gem}
      headline={day.headline}
      footLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Gem move={day.move} frame={theme.frame} glow={theme.glow} />
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 3, color: CANVAS_TEXT }}>
            {day.moveLabel.toUpperCase()}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', marginTop: 26, fontSize: 30, lineHeight: 1.35, color: CANVAS_MUTED }}>
        You leave with {day.output}.
      </div>
    </Shell>
  )
}

/** The board itself — the card for `/course`. */
export function courseIndexOgCard(): ReactElement {
  return (
    <Shell
      gradFrom="#241a3e"
      gradTo="#0a0908"
      glow="#a855f7"
      eyebrow="THE FREE 30-DAY CHALLENGE"
      eyebrowColor={DECK_GOLD}
      headline="Thirty days of allyship practice, one move at a time."
      footLeft={
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {MTGOA_MOVE_ORDER.map((move) => {
            const theme = themeForMove(move)
            return <Gem key={move} move={move} frame={theme.frame} glow={theme.glow} size={48} />
          })}
        </div>
      }
    >
      <div style={{ display: 'flex', marginTop: 26, fontSize: 30, lineHeight: 1.35, color: CANVAS_MUTED }}>
        Five moves run six times, against a different field each week.
      </div>
    </Shell>
  )
}

/** Alt text a screen reader can use — the day's own words, never "social image". */
export function courseDayOgAlt(day: CourseIndexDay): string {
  return `Day ${day.number} of Mastering the Game of Allyship, ${day.moveLabel}: ${day.headline}`
}

export const COURSE_INDEX_OG_ALT =
  'The free 30-day challenge from Mastering the Game of Allyship: thirty days of allyship practice, one move at a time.'
