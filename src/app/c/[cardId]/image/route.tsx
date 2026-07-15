/**
 * PROTOTYPE v4 — Approach A (satori) branded card graphic with a TEXT-FIT system.
 *
 * The structural chrome (marks row, foot, brand) stays at fixed sizes; the four variable-length
 * text blocks (title, flavor, question, application) size themselves to FILL their allotted box —
 * short text goes big and confident, long text shrinks just enough to stay readable, no dead
 * space and no overflow. satori can't measure-then-fit in one render pass, so the fit is COMPUTED
 * from the text: `fitText` estimates the wrapped line count at a candidate size and picks the
 * largest size whose block still fits its box. Pure and deterministic.
 *
 * Mirrors `AllyshipCard variant="full"` at teaser depth (title → marks → flavor hook → question →
 * "How it shows up" → foot). The paid working (practice/action/avoid/how-it-slips) stays deck-only.
 *
 * satori gaps handled: color-mix → rgba; radial-gradient → corner-lit linear; decorative diamonds
 * are CSS rotated squares (the ◆/◇/♦/→ glyphs aren't in the latin font subset → dynamic-font 500).
 *
 * View:  /c/SHOW-RA-CHALLENGER/image   (portrait 5:7)   ·   ?fmt=square (card centered on 1080²)
 */
import type { CSSProperties } from 'react'
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
  return s
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
}

/** hex → rgba (satori has no color-mix). */
function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/**
 * Estimate how many lines `text` wraps to at `charsPerLine`, packing whole words (satori doesn't
 * break mid-word). Slightly conservative — a word longer than the line still counts as one line.
 */
function estimateLines(text: string, charsPerLine: number): number {
  const cpl = Math.max(1, charsPerLine)
  let lines = 1
  let cur = 0
  for (const word of text.split(/\s+/)) {
    const add = (cur === 0 ? 0 : 1) + word.length
    if (cur + add <= cpl) {
      cur += add
    } else {
      lines += 1
      cur = word.length
    }
  }
  return lines
}

/**
 * Largest font size (design-space px) at which `text` fits inside `boxW × boxH`. Estimates chars-
 * per-line from an average glyph width (`charRatio × size`) and multiplies wrapped lines by the
 * line height. `charRatio` runs a touch wide so we round toward the smaller, safer size.
 */
function fitText(
  text: string,
  boxW: number,
  boxH: number,
  opts: { min: number; max: number; lineHeight: number; charRatio: number },
): number {
  const { min, max, lineHeight, charRatio } = opts
  for (let size = max; size > min; size -= 1) {
    const charsPerLine = Math.floor(boxW / (size * charRatio))
    const lines = estimateLines(text, charsPerLine)
    if (lines * size * lineHeight <= boxH) return size
  }
  return min
}

const BAR_LABEL: Record<string, string> = {
  awareness: 'AWARENESS',
  experience: 'EXPERIENCE',
  insight: 'INSIGHT',
  wisdom: 'WISDOM',
  artifact: 'ARTIFACT',
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
  const fonts = await loadFonts()

  const display = "'Jost', sans-serif"
  const body = "'Nunito', sans-serif"
  const mono = "'Space Mono', monospace"

  const pip = s(72)
  const glyph = Math.round(pip * 0.52)
  const badge = s(64)

  // teaser-dense content — no paid working (practice/action/avoid/how-it-slips stay deck-only)
  const app = card.applications?.[0]
  const capLine = card.capabilities.length ? card.capabilities.join(' · ') : ''
  const bar = BAR_LABEL[card.outputBar] ?? card.outputBar.toUpperCase()

  // ── text fit (design-space px; wrapped in s() at render) ─────────────────────────────
  // Interior width after 52px padding. Each block fits its own box; the flexGrow spacer soaks
  // any leftover so the card fills top-to-bottom regardless of how big the fitted text lands.
  const PAD = 52
  const IW = 1000 - PAD * 2 // 896
  const APP_PAD = 22
  const titleText = ascii(card.title)
  const flavorText = card.flavor ? `"${ascii(card.flavor)}"` : ''
  const questionText = ascii(card.primaryQuestion)
  const appExample = app ? ascii(app.example) : ''

  const titleSize = fitText(titleText, IW, 168, { min: 46, max: 82, lineHeight: 1.04, charRatio: 0.5 })
  const flavorSize = flavorText
    ? fitText(flavorText, IW, 250, { min: 34, max: 62, lineHeight: 1.2, charRatio: 0.52 })
    : 0
  const questionSize = fitText(questionText, IW, 190, { min: 27, max: 46, lineHeight: 1.3, charRatio: 0.54 })
  const appSize = appExample
    ? fitText(appExample, IW - APP_PAD * 2, 300, { min: 24, max: 40, lineHeight: 1.38, charRatio: 0.54 })
    : 0

  const markLabel = (color: string, size: number): CSSProperties => ({
    fontFamily: mono,
    fontSize: size,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color,
  })

  const card_ = (
    <div
      style={{
        width: cardW,
        height: cardH,
        display: 'flex',
        flexDirection: 'column',
        padding: s(PAD),
        backgroundImage: `linear-gradient(215deg, ${t.gradFrom}, ${t.gradTo} 70%)`,
        border: `${s(5)}px solid ${DECK_GOLD}`,
        borderRadius: s(26),
        boxShadow: `inset 0 2px 0 rgba(255,255,255,0.07)`,
        color: '#efeae0',
        fontFamily: body,
      }}
    >
      {/* title (fitted) */}
      <div
        style={{
          fontFamily: display,
          fontWeight: 800,
          fontSize: s(titleSize),
          lineHeight: 1.04,
          color: '#ffffff',
          letterSpacing: -1,
        }}
      >
        {titleText}
      </div>

      {/* marks row: [pip + move] · [badge + operation] · [◆ domain] — fixed chrome */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: s(28), marginTop: s(24) }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: s(8) }}>
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
          <span style={markLabel(t.gem, s(17))}>{MOVE_LABELS[card.move]}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: s(8) }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: badge,
              height: badge,
              borderRadius: s(12),
              fontFamily: display,
              fontWeight: 700,
              fontSize: s(28),
              color: face,
              backgroundColor: rgba(face, 0.14),
              border: `2px dashed ${rgba(face, 0.6)}`,
            }}
          >
            {OPERATION_LABELS[card.operation][0]}
          </div>
          <span style={markLabel(rgba('#ffffff', 0.6), s(17))}>{OPERATION_LABELS[card.operation]}</span>
        </div>

        <div style={{ display: 'flex', marginLeft: 'auto', alignSelf: 'center', alignItems: 'center', gap: s(9) }}>
          {/* CSS diamond (satori-safe; the glyph ◆/◇ isn't in the latin font subset) */}
          <div style={{ width: s(12), height: s(12), backgroundColor: t.gem, transform: 'rotate(45deg)' }} />
          <span style={markLabel(t.gem, s(19))}>{DOMAIN_LABELS[card.domain]}</span>
        </div>
      </div>

      {/* the flavor hook — the marketing aphorism (fitted, leads) */}
      {flavorText && (
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: s(flavorSize),
            lineHeight: 1.2,
            color: '#ffffff',
            marginTop: s(32),
          }}
        >
          {flavorText}
        </div>
      )}

      {/* the question — the invitation, gold italic (fitted) */}
      <div
        style={{
          fontFamily: body,
          fontStyle: 'italic',
          fontSize: s(questionSize),
          lineHeight: 1.3,
          color: '#e7c98a',
          marginTop: s(22),
        }}
      >
        {questionText}
      </div>

      {/* how this shows up in real life — one application (fitted example; teaser depth) */}
      {app && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: s(10),
            marginTop: s(28),
            padding: `${s(20)}px ${s(APP_PAD)}px`,
            borderRadius: s(12),
            backgroundColor: 'rgba(0,0,0,0.26)',
            boxShadow: `inset 0 0 0 1px ${rgba('#ffffff', 0.08)}`,
          }}
        >
          <span style={markLabel('#e7c98a', s(16))}>{`How it shows up · ${ascii(app.context)}`}</span>
          <span style={{ fontFamily: body, fontSize: s(appSize), lineHeight: 1.38, color: '#ffffff' }}>
            {appExample}
          </span>
        </div>
      )}

      {/* spacer — soaks leftover so the card fills regardless of fitted sizes */}
      <div style={{ display: 'flex', flexGrow: 1, minHeight: s(20) }} />

      {/* foot: restores + output BAR ; then brand — fixed chrome */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: s(14),
          borderTop: `1px solid ${rgba('#ffffff', 0.12)}`,
          paddingTop: s(20),
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          {capLine ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: s(10) }}>
              <span style={markLabel(rgba('#ffffff', 0.45), s(15))}>Restores</span>
              <span style={{ fontFamily: body, fontSize: s(21), color: '#ffffff' }}>{capLine}</span>
            </div>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: s(9) }}>
            {/* CSS diamond (satori-safe; ♦/◆ isn't in the latin font subset) */}
            <div style={{ width: s(12), height: s(12), backgroundColor: DECK_GOLD, transform: 'rotate(45deg)' }} />
            <span style={{ fontFamily: mono, fontSize: s(19), letterSpacing: 1, color: DECK_GOLD }}>{bar}</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: display, fontWeight: 800, fontSize: s(19), letterSpacing: 2, color: '#ffffff' }}>
            {`THE ALLYSHIP DECK · #${card.num}`}
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
    specs.map(async (spec) => {
      try {
        const res = await fetch(spec.url)
        if (!res.ok) return
        const data = await res.arrayBuffer()
        if (data.byteLength > 2000) out.push({ name: spec.name, data, weight: spec.weight, style: 'normal' })
      } catch {
        /* skip — fall back to the default font */
      }
    }),
  )
  return out
}
