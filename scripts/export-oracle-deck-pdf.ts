/**
 * export-oracle-deck-pdf.ts — Track B: print-ready PDF of the Oracle deck.
 *
 * Reads public/oracle/deck.json (52 cards, spec v3) and the matching PNG art in
 * public/oracle/images, and emits a one-card-per-page PDF at poker size with
 * bleed (2.75" × 3.75"), full-bleed art + a bottom text panel (title, suit,
 * flavor, conversation prompt). Built on pdf-lib: pure JS, standard fonts, no
 * network — so it runs in CI / sandboxes where Google Fonts egress is blocked.
 *
 * The same PDF doubles as the digital deck deliverable and the print-run master
 * (printers take a single shared card-back image — public/oracle/card-back.png —
 * so backs are intentionally not paginated here).
 *
 * Usage:
 *   npm run deck:export-pdf                       # difficulty=medium, exports/oracle-deck.pdf
 *   npx tsx scripts/export-oracle-deck-pdf.ts --difficulty=hard --out=exports/oracle-hard.pdf
 *
 * Suit accent color is token-derived (each of the four moves maps to a Wuxing
 * element in ELEMENT_TOKENS) — no ad-hoc palette.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import sharp from 'sharp'
import { ELEMENT_TOKENS, type ElementKey } from '../src/lib/ui/card-tokens'

const ROOT = path.resolve(__dirname, '..')
const DECK_JSON = path.join(ROOT, 'public/oracle/deck.json')

// ── Geometry (points; 72pt = 1in). Poker card + 0.125" bleed each side. ──
const PT = 72
const CARD_W = 2.75 * PT // 198
const CARD_H = 3.75 * PT // 270
const SAFE = 24 // text safe inset from card edge
const PANEL_H = 96 // bottom text panel height

// Art transcode settings (override via --max-px / --jpeg-quality).
// 900px across a 2.75" card ≈ 327 DPI — above the 300 DPI print floor.
const MAX_PX = parseInt(arg('max-px', '900'), 10)
const JPEG_QUALITY = parseInt(arg('jpeg-quality', '82'), 10)

// ── Suit (the four moves) → Wuxing element → accent color. ──
const SUIT_ELEMENT: Record<string, ElementKey> = {
  WU: 'water', // Wake Up — notice / clarity / depth
  CU: 'metal', // Clean Up — refine / cut away
  GU: 'wood', //  Grow Up — growth / becoming
  SU: 'fire', //  Show Up — action / appearance
}

type Difficulty = 'easy' | 'medium' | 'hard'

interface Card {
  id: string
  suit: { code: string; name: string; domain?: string; icon?: string }
  rank: string
  title: string
  poet?: string
  image_file: string
  flavor?: Record<Difficulty, { line: string }>
  prompts?: Record<Difficulty, string>
}

function arg(name: string, fallback: string): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.split('=').slice(1).join('=') : fallback
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  )
}

/** Greedy word-wrap to a pixel width. */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

async function drawCard(
  doc: PDFDocument,
  card: Card,
  difficulty: Difficulty,
  fonts: { bold: PDFFont; regular: PDFFont; italic: PDFFont },
) {
  const page: PDFPage = doc.addPage([CARD_W, CARD_H])
  const accent = hexToRgb(ELEMENT_TOKENS[SUIT_ELEMENT[card.suit.code] ?? 'earth'].frame)

  // ── Full-bleed art (cover-fit, centered) ──
  // Source PNGs are 1024px losslessly — transcode to JPEG at print resolution
  // (MAX_PX longest side) so a 52-card deck stays a few MB instead of >100 MB.
  const imgPath = path.join(ROOT, 'public', card.image_file)
  if (existsSync(imgPath)) {
    const jpeg = await sharp(await readFile(imgPath))
      .resize(MAX_PX, MAX_PX, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer()
    const img = await doc.embedJpg(jpeg)
    const scale = Math.max(CARD_W / img.width, CARD_H / img.height)
    const w = img.width * scale
    const h = img.height * scale
    page.drawImage(img, { x: (CARD_W - w) / 2, y: (CARD_H - h) / 2, width: w, height: h })
  } else {
    page.drawRectangle({ x: 0, y: 0, width: CARD_W, height: CARD_H, color: rgb(0.04, 0.035, 0.03) })
  }

  // ── Bottom text panel (legibility scrim) + accent rule ──
  page.drawRectangle({ x: 0, y: 0, width: CARD_W, height: PANEL_H, color: rgb(0.04, 0.035, 0.03), opacity: 0.82 })
  page.drawRectangle({ x: 0, y: PANEL_H, width: CARD_W, height: 2.5, color: accent })

  const warm = rgb(0.91, 0.9, 0.88)
  const muted = rgb(0.63, 0.62, 0.6)
  const maxW = CARD_W - SAFE * 2
  let y = PANEL_H - 18

  // Title
  page.drawText(card.title, { x: SAFE, y, size: 13, font: fonts.bold, color: warm })
  y -= 14

  // Rank · Suit · poet
  const meta = [`${card.rank} · ${card.suit.name}`, card.poet].filter(Boolean).join('   ·   ')
  page.drawText(meta, { x: SAFE, y, size: 7.5, font: fonts.regular, color: muted })
  y -= 14

  // Flavor line (chosen difficulty)
  const flavor = card.flavor?.[difficulty]?.line
  if (flavor) {
    for (const ln of wrap(flavor, fonts.italic, 9, maxW)) {
      page.drawText(ln, { x: SAFE, y, size: 9, font: fonts.italic, color: warm })
      y -= 11
    }
  }

  // Conversation prompt (chosen difficulty)
  const prompt = card.prompts?.[difficulty]
  if (prompt) {
    y -= 2
    for (const ln of wrap(prompt, fonts.regular, 8, maxW)) {
      page.drawText(ln, { x: SAFE, y, size: 8, font: fonts.regular, color: muted })
      y -= 10
    }
  }
}

async function main() {
  const difficulty = arg('difficulty', 'medium') as Difficulty
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error(`--difficulty must be easy|medium|hard (got "${difficulty}")`)
  }
  const out = path.resolve(ROOT, arg('out', 'exports/oracle-deck.pdf'))

  const deck = JSON.parse(await readFile(DECK_JSON, 'utf8')) as { deck_name: string; cards: Card[] }
  const doc = await PDFDocument.create()
  doc.setTitle(deck.deck_name)
  doc.setSubject(`Oracle deck — ${difficulty} difficulty`)

  const fonts = {
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    regular: await doc.embedFont(StandardFonts.Helvetica),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  }

  for (const card of deck.cards) {
    await drawCard(doc, card, difficulty, fonts)
  }

  await mkdir(path.dirname(out), { recursive: true })
  const bytes = await doc.save()
  await writeFile(out, bytes)

  const mb = (bytes.length / 1024 / 1024).toFixed(1)
  console.log(`✓ ${deck.cards.length} cards → ${path.relative(ROOT, out)} (${mb} MB, ${difficulty})`)
  console.log(`  Card backs: public/oracle/card-back.png (printers take one shared back).`)
}

main().catch((err) => {
  console.error('✗ deck export failed:', err)
  process.exit(1)
})
