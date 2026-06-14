/**
 * export-book-pdf.ts — Track C: render a manuscript (Markdown or plain prose)
 * into a clean, book-sized PDF.
 *
 * Built on pdf-lib with the standard Times/Helvetica fonts — pure JS, no network
 * — so it runs in CI / sandboxes where Google Fonts egress is blocked (same
 * constraint that blocks `next build` here).
 *
 * Input handling:
 *   - Markdown headings: `# ` (chapter, page break), `## `, `### `.
 *   - Bullets: lines starting with -, *, •, ●.
 *   - Otherwise a short, punctuation-free standalone line is treated as a
 *     heading (so the plain-prose manuscript gets chapter/section breaks too);
 *     `Chapter N` / `Part N` start a new page.
 *   - Blank-line-separated blocks become paragraphs.
 *
 * Usage:
 *   npm run book:export-mtgoa
 *   npx tsx scripts/export-book-pdf.ts --in <file.md|.txt> --out exports/x.pdf \
 *     --title "Title" --subtitle "Sub" --author "Name" --size 6x9|letter
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'

const ROOT = path.resolve(__dirname, '..')

function arg(name: string, fallback = ''): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  if (hit) return hit.split('=').slice(1).join('=')
  const idx = process.argv.indexOf(`--${name}`)
  if (idx >= 0 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) {
    return process.argv[idx + 1]
  }
  return fallback
}

// ── WinAnsi sanitation — pdf-lib standard fonts throw on un-encodable glyphs. ──
const WINANSI_HIGH = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160,
  0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
])
const FALLBACK: Record<string, string> = { '→': '->', '←': '<-', '✓': 'v', '–': '-' }

function sanitize(s: string): string {
  const bulleted = s.replace(/[●◦‣·∙]/g, '•')
  let out = ''
  for (const ch of bulleted) {
    const c = ch.codePointAt(0)!
    if (c <= 0xff || WINANSI_HIGH.has(c)) out += ch
    else if (FALLBACK[ch]) out += FALLBACK[ch]
    // else drop
  }
  return out
}

// ── Block model ──
type Block =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'bullet'; text: string }

const BULLET_RE = /^\s*[-*•●]\s+/
const SENTENCE_END = /[.,:;!?]$/

function looksLikeHeading(line: string): boolean {
  const t = line.trim()
  if (t.length === 0 || t.length > 64) return false
  if (BULLET_RE.test(t)) return false
  if (SENTENCE_END.test(t)) return false
  if (!/^[A-Z0-9“"]/.test(t)) return false
  return true
}

function parse(text: string): Block[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  const flush = () => {
    if (para.length) {
      blocks.push({ type: 'p', text: para.join(' ').trim() })
      para = []
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.trim() === '') {
      flush()
      continue
    }
    if (line.startsWith('### ')) {
      flush()
      blocks.push({ type: 'h3', text: line.slice(4).trim() })
    } else if (line.startsWith('## ')) {
      flush()
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
    } else if (line.startsWith('# ')) {
      flush()
      blocks.push({ type: 'h1', text: line.slice(2).trim() })
    } else if (BULLET_RE.test(line)) {
      flush()
      blocks.push({ type: 'bullet', text: line.replace(BULLET_RE, '').trim() })
    } else if (para.length === 0 && looksLikeHeading(line)) {
      // Standalone short line in prose → section heading; Chapter/Part → page break.
      const isChapter = /^(chapter|part)\b/i.test(line.trim())
      blocks.push({ type: isChapter ? 'h1' : 'h2', text: line.trim() })
    } else {
      para.push(line.trim())
    }
  }
  flush()
  return blocks
}

// ── Geometry ──
const PT = 72
const SIZES: Record<string, [number, number]> = {
  '6x9': [6 * PT, 9 * PT],
  letter: [8.5 * PT, 11 * PT],
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = sanitize(text).split(/\s+/).filter(Boolean)
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

async function main() {
  const inPath = path.resolve(ROOT, arg('in'))
  if (!arg('in')) throw new Error('--in <manuscript> is required')
  const out = path.resolve(ROOT, arg('out', 'exports/book.pdf'))
  const title = arg('title', 'Untitled')
  const subtitle = arg('subtitle')
  const author = arg('author')
  const [W, H] = SIZES[arg('size', '6x9')] ?? SIZES['6x9']

  const MARGIN = 0.75 * PT * 1 // 54pt
  const TOP = H - MARGIN
  const BOTTOM = MARGIN
  const MAXW = W - MARGIN * 2

  const text = await readFile(inPath, 'utf8')
  const blocks = parse(text)

  const doc = await PDFDocument.create()
  doc.setTitle(title)
  if (author) doc.setAuthor(author)
  const serif = await doc.embedFont(StandardFonts.TimesRoman)
  const serifIt = await doc.embedFont(StandardFonts.TimesRomanItalic)
  const sans = await doc.embedFont(StandardFonts.HelveticaBold)

  const ink = rgb(0.1, 0.09, 0.08)
  const muted = rgb(0.45, 0.43, 0.4)

  // ── Title page ──
  let page = doc.addPage([W, H])
  {
    let y = H * 0.62
    for (const ln of wrap(title, sans, 26, MAXW)) {
      const w = sans.widthOfTextAtSize(ln, 26)
      page.drawText(sanitize(ln), { x: (W - w) / 2, y, size: 26, font: sans, color: ink })
      y -= 32
    }
    if (subtitle) {
      y -= 6
      for (const ln of wrap(subtitle, serifIt, 13, MAXW)) {
        const w = serifIt.widthOfTextAtSize(ln, 13)
        page.drawText(sanitize(ln), { x: (W - w) / 2, y, size: 13, font: serifIt, color: muted })
        y -= 18
      }
    }
    if (author) {
      const a = sanitize(author)
      const w = serif.widthOfTextAtSize(a, 12)
      page.drawText(a, { x: (W - w) / 2, y: BOTTOM + 24, size: 12, font: serif, color: muted })
    }
  }

  // ── Flow content ──
  let pageNo = 1
  let y = TOP
  const newPage = () => {
    page = doc.addPage([W, H])
    pageNo += 1
    // page number footer
    const label = String(pageNo)
    const w = serif.widthOfTextAtSize(label, 9)
    page.drawText(label, { x: (W - w) / 2, y: BOTTOM - 18 + 18 - 12, size: 9, font: serif, color: muted })
    y = TOP
  }
  newPage()

  const ensure = (needed: number) => {
    if (y - needed < BOTTOM) newPage()
  }
  const drawLines = (lines: string[], font: PDFFont, size: number, leading: number, color = ink, gapAfter = 0) => {
    for (const ln of lines) {
      ensure(leading)
      page.drawText(ln, { x: MARGIN, y: y - size, size, font, color })
      y -= leading
    }
    y -= gapAfter
  }

  for (const b of blocks) {
    if (b.type === 'h1') {
      if (y < TOP - 1) newPage() // start chapters on a fresh page
      y -= 24
      drawLines(wrap(b.text, sans, 20, MAXW), sans, 20, 26, ink, 14)
    } else if (b.type === 'h2') {
      y -= 12
      drawLines(wrap(b.text, sans, 14, MAXW), sans, 14, 18, ink, 8)
    } else if (b.type === 'h3') {
      y -= 8
      drawLines(wrap(b.text, sans, 11.5, MAXW), sans, 11.5, 15, ink, 6)
    } else if (b.type === 'bullet') {
      const lines = wrap(b.text, serif, 11, MAXW - 16)
      lines.forEach((ln, i) => {
        ensure(15)
        if (i === 0) page.drawText('•', { x: MARGIN, y: y - 11, size: 11, font: serif, color: ink })
        page.drawText(ln, { x: MARGIN + 16, y: y - 11, size: 11, font: serif, color: ink })
        y -= 15
      })
      y -= 4
    } else {
      drawLines(wrap(b.text, serif, 11, MAXW), serif, 11, 15.5, ink, 8)
    }
  }

  await mkdir(path.dirname(out), { recursive: true })
  const bytes = await doc.save()
  await writeFile(out, bytes)
  const kb = (bytes.length / 1024).toFixed(0)
  console.log(`✓ ${blocks.length} blocks → ${path.relative(ROOT, out)} (${kb} KB, ${doc.getPageCount()} pages)`)
}

main().catch((err) => {
  console.error('✗ book export failed:', err)
  process.exit(1)
})
