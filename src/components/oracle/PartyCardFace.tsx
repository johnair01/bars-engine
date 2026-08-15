'use client'

import type { CSSProperties } from 'react'
import { ImageBand } from '@/components/oracle/ImageBand'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  DEFAULT_CROP,
  ZONE_CONTENT_H,
  ZONE_HEADER_H,
  ZONE_TITLE_H,
  ZONE_TITLE_PADDING_X,
  cropFromCard,
  type Crop,
} from '@/lib/oracle/cardLayout'

/**
 * The Oracle card face used by every party surface.
 *
 * Extracted from the Valkyrie party so a second party can reuse the exact
 * renderer instead of forking one. Art, suit icon, rank, and layout zones are
 * canonical; only the palette and the text slots are supplied by the caller.
 */

export const SUIT_SVG_FILES: Record<string, string> = {
  WU: '/oracle/icons/wake-up.svg',
  CU: '/oracle/icons/clean-up.svg',
  GU: '/oracle/icons/grow-up.svg',
  SU: '/oracle/icons/show-up.svg',
}

export type PartyCardPalette = {
  /** Card border and header/footer text. */
  accent: string
  /** Body text on the card. */
  cream: string
  /** Header gradient start. */
  headerFrom: string
  /** Header gradient end. */
  headerTo: string
  /** Outer glow. */
  glow: string
}

export type RenderableOracleCard = {
  id: string
  suit: { code: string; name: string; domain?: string; icon?: string }
  rank: string
  title: string
  image_file: string
  crop_saved?: boolean
  crop?: Crop
}

export function PartyCardFace({
  card,
  palette,
  prompt,
  flavorLine,
  flavorAttribution,
  titleOverride,
  ribbon,
  style,
}: {
  card: RenderableOracleCard
  palette: PartyCardPalette
  prompt: string
  flavorLine?: string
  flavorAttribution?: string
  titleOverride?: string
  /** Optional short label in the header, e.g. the active lens. */
  ribbon?: string
  style?: CSSProperties
}) {
  const crop = card.crop_saved ? cropFromCard(card as never) : DEFAULT_CROP
  const image =
    typeof card.image_file === 'string' && card.image_file.startsWith('/oracle/') ? card.image_file : null

  return (
    <article
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${palette.accent}`,
        background: '#111',
        boxShadow: `0 18px 50px ${palette.glow}`,
        maxWidth: '100%',
        ...style,
      }}
    >
      <div
        style={{
          height: ZONE_HEADER_H,
          background: `linear-gradient(90deg, ${palette.headerFrom}, ${palette.headerTo})`,
          borderBottom: `1px solid ${palette.accent}`,
          padding: '0 0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: palette.accent }}>
          <img
            src={SUIT_SVG_FILES[card.suit.code]}
            alt=""
            style={{ width: 32, height: 32, objectFit: 'contain' }}
          />
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>
            {card.suit.name.toUpperCase()}
          </span>
        </div>
        <span style={{ color: palette.accent, fontSize: '0.75rem' }}>
          {ribbon ? `${ribbon} · ${card.rank}` : card.rank}
        </span>
      </div>

      <ImageBand src={image} crop={crop} />

      <div
        style={{
          height: ZONE_TITLE_H,
          background: `linear-gradient(90deg, ${palette.headerTo}, ${palette.headerFrom})`,
          borderTop: `1px solid ${palette.accent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `0 ${ZONE_TITLE_PADDING_X}`,
        }}
      >
        <p
          style={{
            color: palette.cream,
            fontSize: '0.68rem',
            margin: 0,
            textAlign: 'center',
            letterSpacing: '0.04em',
            lineHeight: 1.15,
          }}
        >
          {(titleOverride || card.title).toUpperCase()}
        </p>
      </div>

      <div
        style={{
          height: ZONE_CONTENT_H,
          background: 'rgba(17,17,17,0.95)',
          padding: '0.45rem 0.5rem',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '0.25rem',
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            color: palette.cream,
            fontSize: '0.72rem',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.3,
            overflowWrap: 'break-word',
          }}
        >
          {prompt}
        </p>
        {(flavorLine || flavorAttribution) && (
          <div style={{ textAlign: 'center', minWidth: 0, marginTop: '0.15rem' }}>
            {flavorLine && (
              <p
                style={{
                  color: palette.cream,
                  fontSize: '0.68rem',
                  fontStyle: 'italic',
                  margin: '0 0 0.1rem',
                  lineHeight: 1.3,
                }}
              >
                &ldquo;{flavorLine}&rdquo;
              </p>
            )}
            {flavorAttribution && (
              <p
                style={{
                  color: palette.accent,
                  fontSize: '0.56rem',
                  margin: 0,
                  opacity: 0.85,
                  lineHeight: 1.2,
                }}
              >
                {flavorAttribution}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export function PartyCardBack({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        maxWidth: '100%',
        border: 'none',
        borderRadius: 12,
        padding: 0,
        overflow: 'hidden',
        background: 'transparent',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 18px 50px rgba(0,0,0,0.28)',
      }}
      aria-label={onClick ? 'Reveal card' : 'Card back'}
    >
      <img
        src="/oracle/card-back.png"
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </button>
  )
}
