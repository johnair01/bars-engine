'use client'

import type { CSSProperties } from 'react'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import {
  CARD_BACK,
  DECK_GOLD,
  DECK_FONTS,
  FOIL_GRADIENT,
  LIMINAL,
  MTGOA_MARK_SRC,
  guillocheField,
} from '@/lib/allyship-deck/card-visuals'

// Element gem + glow pops for the spotlight + corner gems (kept in the engine palette).
const FIRE = ELEMENT_TOKENS.fire
const WATER = ELEMENT_TOKENS.water
const WOOD = ELEMENT_TOKENS.wood
const EARTH = ELEMENT_TOKENS.earth

const mix = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`

// The engraved guilloché field — computed once (deterministic).
const GUILLOCHE = guillocheField()

// Concentric hexagon "spotlight" — points in the 460×644 space, with their stroke colors.
const HEXES: { points: string; stroke: string }[] = [
  { points: '230,82 438,202 438,442 230,562 22,442 22,202', stroke: mix(DECK_GOLD, 26) },
  { points: '230,129 397,225 397,418 230,515 63,418 63,225', stroke: mix(FIRE.gem, 32) },
  { points: '230,176 356,249 356,395 230,468 104,395 104,249', stroke: mix(WOOD.gem, 30) },
  { points: '230,223 316,272 316,371 230,421 144,371 144,272', stroke: mix(WATER.gem, 34) },
  { points: '230,266 278,294 278,350 230,378 182,350 182,294', stroke: mix(DECK_GOLD, 32) },
]

// Four element-colored corner gems (fire TL, water TR, wood BL, earth BR).
const CORNER_GEM = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
const CORNERS: { pos: CSSProperties; gem: string; glow: string }[] = [
  { pos: { top: 40, left: 40 }, gem: FIRE.gem, glow: FIRE.glow },
  { pos: { top: 40, right: 40 }, gem: WATER.gem, glow: WATER.glow },
  { pos: { bottom: 40, left: 40 }, gem: WOOD.gem, glow: WOOD.glow },
  { pos: { bottom: 40, right: 40 }, gem: EARTH.gem, glow: EARTH.glow },
]

const abs: CSSProperties = { position: 'absolute' }
const fill: CSSProperties = { ...abs, inset: 0 }
const center: CSSProperties = { ...abs, left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }

export interface DeckCardBackProps {
  /** Rendered width in px; the back keeps its 2.5:3.5 ratio. Default = canonical 460. */
  width?: number
  /** Press-state shrink (e.g. while shuffling). */
  pulsing?: boolean
  /** Pause the foil/sheen motion (e.g. when used purely decoratively in a grid). */
  still?: boolean
  className?: string
  style?: CSSProperties
  onClick?: () => void
  'aria-label'?: string
}

/**
 * The **Struck Gold** card back — the premium print-and-store back of every Allyship
 * Deck card (design handoff: Back A). The full layered stack: substrate tooth → guilloché
 * engraved field → hexagon spotlight → arched label → center glow → MTGOA mark → spot-gloss
 * sheen → emboss underlay → animated foil ring → corner element gems.
 *
 * Authored in the canonical 460×644 space and CSS-scaled, so every layer (insets, type,
 * sheen) stays pixel-faithful at any `width`. Motion honors prefers-reduced-motion.
 *
 * @see src/lib/allyship-deck/card-visuals.ts — CARD_BACK, guillocheField, FOIL_GRADIENT
 */
export function DeckCardBack({
  width = CARD_BACK.width,
  pulsing = false,
  still = false,
  className,
  style,
  onClick,
  'aria-label': ariaLabel = 'The Allyship Deck — card back',
}: DeckCardBackProps) {
  const scale = width / CARD_BACK.width
  const foilAnim = still ? undefined : 'deck-foil-anim'
  const sheenAnim = still ? undefined : 'deck-sheen-anim'

  return (
    <div
      className={className}
      onClick={onClick}
      role="img"
      aria-label={ariaLabel}
      style={{
        position: 'relative',
        width,
        height: width * (CARD_BACK.height / CARD_BACK.width),
        transition: 'transform 200ms ease',
        transform: pulsing ? 'scale(.97)' : undefined,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: CARD_BACK.width,
          height: CARD_BACK.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* 1 · card body */}
        <div
          style={{
            ...fill,
            borderRadius: 18,
            overflow: 'hidden',
            border: `3px solid ${DECK_GOLD}`,
            background:
              'radial-gradient(120% 80% at 50% 42%, #161220 0%, #0a0810 60%, #060509 100%)',
            boxShadow: `inset 0 1px 0 rgba(255,255,255,.07), 0 0 34px 1px ${mix(LIMINAL.frame, 26)}, 0 30px 64px -28px rgba(0,0,0,.95)`,
          }}
        >
          {/* 2 · substrate tooth (linen) */}
          <div
            style={{
              ...fill,
              pointerEvents: 'none',
              mixBlendMode: 'overlay',
              backgroundImage:
                'repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.08) 0 1px,transparent 1px 3px)',
            }}
          />

          {/* 3 · guilloché engraved field */}
          <svg
            viewBox="0 0 460 644"
            width="460"
            height="644"
            fill="none"
            style={{ ...fill, opacity: 0.5 }}
          >
            {GUILLOCHE.map((d, i) => (
              <path key={i} d={d} stroke={mix(DECK_GOLD, 17)} strokeWidth={0.7} />
            ))}
          </svg>

          {/* 4 · hexagon spotlight */}
          <svg viewBox="0 0 460 644" width="460" height="644" fill="none" style={fill}>
            {HEXES.map((h, i) => (
              <polygon key={i} points={h.points} stroke={h.stroke} strokeWidth={1.4} />
            ))}
          </svg>

          {/* 10 · arched label */}
          <div style={{ ...abs, top: 44, left: 0, right: 0, textAlign: 'center' }}>
            <span
              style={{
                fontFamily: DECK_FONTS.mono,
                fontSize: 11,
                letterSpacing: '0.34em',
                color: mix(DECK_GOLD, 82),
              }}
            >
              ◆ THE ALLYSHIP DECK ◆
            </span>
          </div>

          {/* 5 · center glow */}
          <div
            style={{
              ...center,
              width: 360,
              height: 360,
              background: `radial-gradient(circle, ${mix(LIMINAL.frame, 30)}, transparent 62%)`,
            }}
          />

          {/* 6 · mark */}
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative, fixed-size, transform-positioned */}
          <img
            src={MTGOA_MARK_SRC}
            alt=""
            aria-hidden
            style={{
              ...center,
              width: 368,
              height: 368,
              objectFit: 'contain',
              filter: `drop-shadow(0 0 26px ${mix(LIMINAL.frame, 55)})`,
            }}
          />

          {/* 7 · spot-gloss sheen */}
          <div style={{ ...abs, left: 0, right: 0, top: 130, height: 360, overflow: 'hidden', pointerEvents: 'none' }}>
            <div
              className={sheenAnim}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: 90,
                background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.16),transparent)',
              }}
            />
          </div>

          {/* 8 · emboss / glow underlay */}
          <div
            style={{
              ...abs,
              inset: 14,
              borderRadius: 11,
              boxShadow: `inset 0 0 0 1px rgba(255,255,255,.22), 0 0 0 1px rgba(0,0,0,.5), 0 0 16px -3px ${mix(DECK_GOLD, 50)}, inset 0 0 22px -10px ${mix(DECK_GOLD, 60)}`,
            }}
          />

          {/* 9 · foil gradient ring */}
          <div
            className={foilAnim}
            style={{
              ...abs,
              inset: 14,
              borderRadius: 11,
              padding: 3,
              background: FOIL_GRADIENT,
              backgroundSize: '240% 240%',
              WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />

          {/* 11 · corner element gems */}
          {CORNERS.map((c, i) => (
            <div
              key={i}
              style={{
                ...abs,
                ...c.pos,
                width: 18,
                height: 20,
                background: c.gem,
                clipPath: CORNER_GEM,
                filter: `drop-shadow(0 0 6px ${mix(c.glow, 80)})`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
