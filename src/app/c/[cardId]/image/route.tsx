/**
 * PROTOTYPE v2 — Approach A (satori) branded card graphic, rebuilt to MIRROR the deck card.
 *
 * v1 was a bespoke feed graphic (wrong — unrecognizable). v2 reproduces #183's `DeckCardLanding`
 * card: true 5:7 poker shape, marks row (move pip + id + face badge), tags, the hook, the
 * "Restores" footer — with the real fonts (Jost/Nunito/Space Mono) loaded, and `color-mix` /
 * `radial-gradient` (unsupported by satori) precomputed to rgba / approximated by a corner-lit
 * linear. Hook = flavor-primary, question-fallback (the Six Faces ruling).
 *
 * View:  /c/SHOW-RA-CHALLENGER/image   (portrait 5:7)   ·   ?fmt=square (card centered on 1080²)
 * The one true satori gap vs the DOM card is the radial gradient (linear approximation here).
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

/** Non-Latin punctuation → ASCII so next/og never triggers a dynamic-font fetch (400 → 500). */
function ascii(s: string): string {
  return s.replace(/[—–]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
}

/** hex → rgba (satori has no color-mix). */
function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/** Fetch the deck fonts once; skip any that fail so the image never 500s on fonts. */
async function loadFonts() {
  const base = 'https://cdn.jsdelivr.net/npm/@fontsource'
  const specs = [
    { name: 'Jost', weight: 700 as const, url: `${base}/jost/files/jost-latin-700-normal.woff` },
    { name: 'Jost', weight: 800 as const, url: `${base}/jost/files/jost-latin-800-normal.woff` },
    { name: 'Nunito', weight: 400 as const, url: `${base}/nunito/files/nunito-latin-400-normal.woff` },
    { name: 'Space Mono', weight: 400 as const, url: `${base}/space-mono/files/space-mono-latin-400-normal.woff` },
  ]
  const out: { name: string; data: ArrayBuffer; weight: 400 | 700 | 800; style: 'normal' }[] = []
  await Promise.all(
    specs.map(async (s) => {
      try {
        const res = await fetch(s.url)
        if (!res.ok) return
        const data = await res.arrayBuffer()
        if (data.byteLength > 2000) out.push({ name: s.name, data, weight: s.weight, style: 'normal' })
      } catch {
        /* skip — fall back to the default font */
      }
    }),
  )
  return out
}

export async function GET(req: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = await params
  const card = getMoveCardById(cardId)
  if (!card) return new Response('Card not found', { status: 404 })

  const square = new URL(req.url).searchParams.get('fmt') === 'square'
  const outerW = square ? 1080 : 1000
  const outerH = square ? 1080 : 1400
  // The card holds the deck's 5:7 poker proportion. Square crops to a centered card on dark.
  const cardW = square ? 740 : 1000
  const cardH = Math.round((cardW * 7) / 5)
  const f = cardW / 1000
  const s = (n: number) => Math.round(n * f)

  const t = themeForMove(card.move)
  const face = FACE_COLOR[card.operation]
  const filled = MOVE_ICON_FILLED[card.move]
  const hook = card.flavor ?? card.primaryQuestion // flavor-primary, question-fallback (ruling)
  const fonts = await loadFonts()

  const display = "'Jost', sans-serif"
  const body = "'Nunito', sans-serif"
  const mono = "'Space Mono', monospace"

  const pip = s(64)
  const glyph = Math.round(pip * 0.52)

  const card_ = (
    <div
      style={{
        width: cardW,
        height: cardH,
        display: 'flex',
        flexDirection: 'column',
        padding: s(56),
        backgroundImage: `linear-gradient(215deg, ${t.gradFrom}, ${t.gradTo} 70%)`,
        border: `${s(5)}px solid ${DECK_GOLD}`,
        borderRadius: s(26),
        boxShadow: `inset 0 2px 0 rgba(255,255,255,0.07)`,
        color: '#efeae0',
        fontFamily: body,
      }}
    >
      {/* marks row: move pip · id · face badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: pip,
            height: pip,
            borderRadius: pip,
            backgroundImage: `linear-gradient(150deg, ${t.glow}, ${t.frame})`,
            boxShadow: `0 0 ${s(18)}px -4px ${t.glow}`,
          }}
        >
          <svg width={glyph} height={glyph} viewBox="0 0 64 64">
            {MOVE_ICON_PATHS[card.move].map((d, i) => (
              <path
                key={i}
                d={d}
                fill={filled ? '#0a0908' : 'none'}
                stroke={filled ? 'none' : '#0a0908'}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        </div>
        <span style={{ fontFamily: mono, fontSize: s(21), letterSpacing: 3, color: rgba('#ffffff', 0.5) }}>
          {card.id}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: s(58),
            height: s(58),
            borderRadius: s(12),
            fontFamily: display,
            fontWeight: 700,
            fontSize: s(26),
            color: face,
            backgroundColor: rgba(face, 0.14),
            border: `2px dashed ${rgba(face, 0.6)}`,
          }}
        >
          {OPERATION_LABELS[card.operation][0]}
        </div>
      </div>

      {/* title */}
      <div
        style={{
          fontFamily: display,
          fontWeight: 800,
          fontSize: s(66),
          lineHeight: 1.05,
          color: '#ffffff',
          marginTop: s(40),
          letterSpacing: -1,
        }}
      >
        {ascii(card.title)}
      </div>

      {/* tags: move · operation · domain */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: s(12), marginTop: s(24) }}>
        {[
          { label: MOVE_LABELS[card.move], color: t.gem },
          { label: OPERATION_LABELS[card.operation], color: '#e7c98a' },
          { label: DOMAIN_LABELS[card.domain], color: t.gem },
        ].map((tag) => (
          <div
            key={tag.label}
            style={{
              display: 'flex',
              fontFamily: mono,
              fontSize: s(19),
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: tag.color,
              padding: `${s(8)}px ${s(16)}px`,
              borderRadius: 999,
              backgroundColor: 'rgba(0,0,0,0.22)',
              border: `1px solid ${rgba(tag.color, 0.4)}`,
            }}
          >
            {tag.label}
          </div>
        ))}
      </div>

      {/* the hook — flavor (or question), italic gold */}
      <div style={{ fontFamily: body, fontStyle: 'italic', fontSize: s(40), lineHeight: 1.3, color: '#e7c98a', marginTop: s(34) }}>
        {`"${ascii(hook)}"`}
      </div>

      <div style={{ display: 'flex', flexGrow: 1 }} />

      {/* footer: restores + brand */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: s(18), borderTop: `1px solid ${rgba('#ffffff', 0.1)}`, paddingTop: s(22) }}>
        {card.capabilities.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: s(12) }}>
            <span style={{ fontFamily: mono, fontSize: s(16), letterSpacing: 2, textTransform: 'uppercase', color: rgba('#ffffff', 0.45) }}>
              Restores
            </span>
            <span style={{ fontFamily: body, fontSize: s(23), color: '#ffffff' }}>
              {card.capabilities.join(' · ')}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: display, fontWeight: 800, fontSize: s(20), letterSpacing: 2, color: '#ffffff' }}>
            THE ALLYSHIP DECK
          </span>
          <span style={{ fontFamily: mono, fontSize: s(15), color: rgba('#ffffff', 0.6) }}>masteringallyship.com</span>
        </div>
      </div>
    </div>
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0908',
        }}
      >
        {card_}
      </div>
    ),
    { width: outerW, height: outerH, ...(fonts.length ? { fonts } : {}) },
  )
}
