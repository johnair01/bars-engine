/**
 * PROTOTYPE — Approach A (satori) branded card graphic for one card.
 *
 * Spec: .specify/specs/deck-card-share-permalink/spec.md (OQ #1 resolved → Approach A, reframed:
 * a PURPOSE-BUILT share card — bold, simple, big type, the flavor line as hook — NOT a screenshot
 * of the detail-dense in-app card). This route exists to gut-check felt-authenticity before scaling
 * the renderer to all 120 cards and wiring the /c/[cardId] page.
 *
 * View on the preview deploy:
 *   /c/SHOW-RA-CHALLENGER/image           → landscape 1200×630 (link OG)
 *   /c/SHOW-RA-CHALLENGER/image?fmt=square → square 1080×1080 (IG/Threads)
 *
 * Satori-safe only (no color-mix; every multi-child box is display:flex). Font: next/og default
 * for now — swapping in Jost/Futura (DECK_FONTS.display) is the top remaining fidelity lever.
 */
import { ImageResponse } from 'next/og'
import { getMoveCardById } from '@/lib/allyship-deck/assemble'
import {
  themeForMove,
  DECK_GOLD,
  MOVE_LABELS,
  OPERATION_LABELS,
  DOMAIN_LABELS,
  MOVE_ICON_PATHS,
  MOVE_ICON_FILLED,
  FACE_COLOR,
} from '@/lib/allyship-deck/card-visuals'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> },
) {
  const { cardId } = await params
  const card = getMoveCardById(cardId)
  if (!card) return new Response('Card not found', { status: 404 })

  const square = new URL(req.url).searchParams.get('fmt') === 'square'
  const W = square ? 1080 : 1200
  const H = square ? 1080 : 630

  const t = themeForMove(card.move)
  const face = FACE_COLOR[card.operation]
  const filled = MOVE_ICON_FILLED[card.move]
  const flavor = card.flavor ?? card.remediation
  const move = card.action ?? card.remediation

  const titleSize = square ? 92 : 76
  const flavorSize = square ? 40 : 34
  const glyph = square ? 66 : 54

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: `linear-gradient(135deg, ${t.gradFrom}, ${t.gradTo})`,
          border: `${square ? 6 : 5}px solid ${DECK_GOLD}`,
          borderRadius: square ? 40 : 30,
          padding: square ? 76 : 60,
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* top row: move+face identity · domain */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <svg width={glyph} height={glyph} viewBox="0 0 64 64">
              {MOVE_ICON_PATHS[card.move].map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill={filled ? t.gem : 'none'}
                  stroke={t.gem}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: square ? 26 : 22, fontWeight: 800, letterSpacing: 3 }}>
                {MOVE_LABELS[card.move].toUpperCase()}
              </span>
              <span style={{ fontSize: square ? 24 : 19, color: face }}>{OPERATION_LABELS[card.operation]}</span>
            </div>
          </div>
          <span style={{ fontSize: square ? 24 : 20, color: t.gem, fontWeight: 800, letterSpacing: 2 }}>
            ◇ {DOMAIN_LABELS[card.domain].toUpperCase()}
          </span>
        </div>

        {/* center: the hook — title huge, flavor as the line */}
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
          <div style={{ fontSize: titleSize, fontWeight: 800, lineHeight: 1.02, letterSpacing: -1 }}>
            {card.title}
          </div>
          <div style={{ fontSize: flavorSize, fontStyle: 'italic', color: '#e7c98a', marginTop: 22, lineHeight: 1.22 }}>
            “{flavor}”
          </div>
        </div>

        {/* your move — the whack */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(0,0,0,0.30)',
            border: '1px solid rgba(201,168,76,0.55)',
            borderRadius: 18,
            padding: square ? 30 : 24,
          }}
        >
          <span style={{ fontSize: square ? 18 : 15, fontWeight: 800, letterSpacing: 4, color: DECK_GOLD }}>
            YOUR MOVE
          </span>
          <span style={{ fontSize: square ? 31 : 25, marginTop: 8, lineHeight: 1.28 }}>{move}</span>
        </div>

        {/* footer: brand + url */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginTop: square ? 40 : 26,
          }}
        >
          <span style={{ fontSize: square ? 22 : 18, fontWeight: 800, letterSpacing: 2 }}>THE ALLYSHIP DECK</span>
          <span style={{ fontSize: square ? 20 : 16, color: 'rgba(255,255,255,0.65)' }}>masteringallyship.com</span>
        </div>
      </div>
    ),
    { width: W, height: H },
  )
}
