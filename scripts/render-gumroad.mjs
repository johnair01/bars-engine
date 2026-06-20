/**
 * render-gumroad.mjs — render the Allyship Deck "Struck Gold" surfaces to PNG.
 *
 * Reproduces the design handoff (`Deck Backs & Gumroad.dc.html`) without its DC
 * runtime: it pulls each surface's exact markup out of the handoff HTML, resolves
 * the template placeholders (guilloché field, fan/front card data) here in Node,
 * supplies the BARS design tokens as CSS variables, and screenshots each surface at
 * its native pixel size with Playwright.
 *
 * Usage:
 *   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers NODE_PATH=/opt/node22/lib/node_modules \
 *     node scripts/render-gumroad.mjs [--handoff <dir>] [--out <dir>]
 *
 * Tokens trace to src/lib/ui/card-tokens.ts (ELEMENT_TOKENS) + card-visuals.ts.
 */
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const sharp = require('sharp')

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const args = process.argv.slice(2)
const argOf = (flag, def) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : def
}
const HANDOFF = resolve(argOf('--handoff', join(ROOT, 'design/deck-card-backs')))
const OUT = resolve(argOf('--out', join(ROOT, 'gumroad-exports')))
const HTML_PATH = join(HANDOFF, 'Deck Backs & Gumroad.dc.html')
const LOGO_PATH = join(ROOT, 'public/allyship-deck/mtgoa-logo-transparent.png')

// ─── Design tokens (mirror src/lib/ui/card-tokens.ts + card-visuals.ts) ───────
const GOLD = '#C9A84C'
const EL = {
  fire:  { gradFrom: '#431407', gradTo: '#1c0700', glow: '#e8671a', gem: '#e74c3c', frame: '#c1392b' },
  water: { gradFrom: '#0c1e3e', gradTo: '#020c1f', glow: '#1a7a8a', gem: '#2980b9', frame: '#1a3a5c' },
  wood:  { gradFrom: '#052e16', gradTo: '#011309', glow: '#27ae60', gem: '#2ecc71', frame: '#4a7c59' },
  metal: { gradFrom: '#1e2530', gradTo: '#0d1017', glow: '#bdc3c7', gem: '#bdc3c7', frame: '#8e9aab' },
  earth: { gradFrom: '#451a03', gradTo: '#1a0a00', glow: '#d4a017', gem: '#d4a017', frame: '#b5651d' },
}
const LIMINAL = { frame: '#7c3aed', glow: '#a855f7', gradFrom: '#241a3e', gradTo: '#100a1f' }
const FACE_COLOR = { shaman: '#6fd0d0', challenger: '#e8896f', regent: '#e0c25a', architect: '#9fb2c8', diplomat: '#6fc795', sage: '#a99ae0' }

const tokenVars = () => {
  const lines = [`--gold:${GOLD};`, `--bars-liminal:${LIMINAL.frame};`, `--bars-liminal-glow:${LIMINAL.glow};`]
  for (const [k, v] of Object.entries(EL)) {
    lines.push(`--bars-${k}-gem:${v.gem};--bars-${k}-glow:${v.glow};--bars-${k}-frame:${v.frame};--bars-${k}-grad-from:${v.gradFrom};--bars-${k}-grad-to:${v.gradTo};`)
  }
  return lines.join('')
}

// ─── Card data + helpers (port of the handoff logic class) ────────────────────
const MOVES = [
  { key: 'wake', label: 'Wake Up', el: 'earth' },
  { key: 'clean', label: 'Clean Up', el: 'water' },
  { key: 'grow', label: 'Grow Up', el: 'wood' },
  { key: 'show', label: 'Show Up', el: 'fire' },
  { key: 'open', label: 'Open Up', el: 'liminal' },
]
const MOVE_PATHS = {
  wake: ['M14 44 H50', 'M24 44 A8 8 0 0 1 40 44', 'M32 22 V14', 'M44 25 L48 21', 'M20 25 L16 21'],
  clean: ['M32 13 L36 28 L51 32 L36 36 L32 51 L28 36 L13 32 L28 28 Z'],
  grow: ['M32 51 V27', 'M32 34 C24 34 20 27 20 18', 'M32 30 C40 30 44 24 44 15', 'M22 53 H42'],
  show: ['M17 51 V25 Q32 11 47 25 V51', 'M27 51 L29 39 Q32 35 35 39 L37 51'],
  open: ['M27 16 Q15 32 27 48', 'M37 16 Q49 32 37 48', 'M32 30 V24', 'M26 33 L22 29', 'M38 33 L42 29'],
}
const CARDS = [
  { num: '047', title: 'Take Your First Action', move: 'show', el: 'fire', face: 'challenger', faceLabel: 'Challenger', domain: 'Direct Action', reward: 2, minutes: 10, ask: 'Complete one small, concrete action to contribute right now — the imperfect one beats the unmade one.' },
  { num: '112', title: 'The Empty Cup', move: 'open', el: 'liminal', face: 'diplomat', faceLabel: 'Diplomat', domain: 'Gather Resources', reward: 3, minutes: 5, ask: 'Name a resource you won’t let yourself want. Then ask one person for a sliver of it.' },
  { num: '068', title: 'Share a Resource', move: 'grow', el: 'wood', face: 'architect', faceLabel: 'Architect', domain: 'Gather Resources', reward: 2, minutes: 10, ask: 'Contribute something useful to the commons — a link, a tool, a contact, a template.' },
  { num: '039', title: 'Reflect and Report', move: 'clean', el: 'water', face: 'sage', faceLabel: 'Sage', domain: 'Raise Awareness', reward: 1, minutes: 10, ask: 'Take a few minutes to metabolize what happened, then name one outcome or learning out loud.' },
  { num: '003', title: 'What’s Worth Funding', move: 'wake', el: 'earth', face: 'regent', faceLabel: 'Regent', domain: 'Gather Resources', reward: 2, minutes: 15, ask: 'Of all that is depleted, what actually deserves resourcing first? Rank the top three.' },
]

const theme = (el) =>
  el === 'liminal'
    ? { gradFrom: '#241a3e', gradTo: '#100a1f', glow: 'var(--bars-liminal)', gem: 'var(--bars-liminal-glow)', frame: 'var(--bars-liminal)' }
    : { gradFrom: `var(--bars-${el}-grad-from)`, gradTo: `var(--bars-${el}-grad-to)`, glow: `var(--bars-${el}-glow)`, gem: `var(--bars-${el}-gem)`, frame: `var(--bars-${el}-frame)` }

const moveIcon = (move, size, color) => {
  const ds = MOVE_PATHS[move] || []
  const filled = move === 'clean'
  const paths = ds.map((d) => `<path d="${d}"></path>`).join('')
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="${filled ? color : 'none'}" stroke="${color}" stroke-width="${filled ? 1.5 : 3.6}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
}
const pip = (el, sz = 32) => {
  const t = theme(el)
  return `display:flex;align-items:center;justify-content:center;width:${sz}px;height:${sz}px;border-radius:50%;background:linear-gradient(150deg,${t.glow},${t.frame});box-shadow:0 0 10px -3px ${t.glow};flex:none;`
}
const faceBadge = (face, sz = 34) => {
  const c = FACE_COLOR[face]
  return `display:flex;align-items:center;justify-content:center;width:${sz}px;height:${sz}px;border-radius:9px;font-family:var(--bars-font-display);font-weight:700;font-size:${sz * 0.42}px;color:${c};background:color-mix(in srgb,${c} 14%,transparent);border:1px dashed color-mix(in srgb,${c} 60%,transparent);flex:none;`
}
const cardBase = (el, w) => {
  const t = theme(el)
  return `width:${w}px;aspect-ratio:2.5/3.5;border-radius:14px;overflow:hidden;border:2px solid var(--gold);background:radial-gradient(120% 90% at 78% 8%,${t.gradFrom},${t.gradTo} 64%);box-shadow:inset 0 1px 0 rgba(255,255,255,.07),0 0 26px 1px color-mix(in srgb,${t.glow} 38%,transparent),0 18px 40px -20px rgba(0,0,0,.9);`
}
const cardObj = (c, w) => {
  const t = theme(c.el)
  return {
    num: c.num, title: c.title, ask: c.ask, reward: c.reward, minutes: c.minutes,
    moveLabel: (MOVES.find((m) => m.key === c.move) || {}).label || '',
    domainLabel: c.domain, faceLabel: c.faceLabel, faceMono: c.faceLabel[0],
    gem: t.gem, glow: t.glow, frame: t.frame, gradFrom: t.gradFrom, gradTo: t.gradTo,
    moveIcon: moveIcon(c.move, 18, '#150a04'),
    moveIconBig: moveIcon(c.move, 26, '#150a04'),
    pipStyle: pip(c.el, 34),
    faceBadge: faceBadge(c.face, 36),
    base: cardBase(c.el, w),
  }
}
const fan = (cards, w, specs) =>
  cards.map((c, i) => {
    const o = cardObj(c, w)
    const s = specs[i] || { rot: 0, x: 0, y: 0, z: 1 }
    o.fanStyle = `position:absolute;left:50%;top:50%;z-index:${s.z};transform:translate(-50%,-50%) rotate(${s.rot}deg) translateX(${s.x}px) translateY(${s.y}px);` + cardBase(c.el, w)
    return o
  })

// guilloché field — rosette rings (port of card-visuals.guillocheField)
const rosette = (cx, cy, baseR, amp, petals, phase) => {
  const steps = 260, p = []
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const rr = baseR + amp * Math.cos(petals * t + phase)
    p.push(`${(cx + rr * Math.cos(t)).toFixed(1)},${(cy + rr * Math.sin(t)).toFixed(1)}`)
  }
  return 'M' + p.join('L') + 'Z'
}
const guilloche = (cx, cy, r0, r1, rings, amp, petals) => {
  const a = []
  for (let i = 0; i < rings; i++) {
    const f = rings === 1 ? 0 : i / (rings - 1)
    a.push(rosette(cx, cy, r0 + (r1 - r0) * f, amp, petals, ((i % 2) * Math.PI) / petals))
  }
  return a
}
const G1 = guilloche(230, 322, 64, 250, 11, 9, 18)

const SUBSTRATE = 'position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,.08) 0 1px,transparent 1px 3px);'

// ─── Pull each surface's exact markup out of the handoff HTML ──────────────────
const RAW = readFileSync(HTML_PATH, 'utf8')

function extractSurface(id) {
  const marker = `data-ex="${id}"`
  const mi = RAW.indexOf(marker)
  if (mi < 0) throw new Error(`surface ${id} not found`)
  const divStart = RAW.lastIndexOf('<div', mi)
  const figEnd = RAW.indexOf('</figure>', mi)
  return RAW.slice(divStart, figEnd).trim()
}

// Expand <sc-for list="{{ g1Rings }}" as="d" ...><path d="{{ d }}" .../></sc-for>
function expandG1(html) {
  return html.replace(/<sc-for list="\{\{ g1Rings \}\}"[^>]*>([\s\S]*?)<\/sc-for>/g, (_m, inner) =>
    G1.map((d) => inner.replace(/\{\{ d \}\}/g, d)).join(''))
}

// Expand <sc-for list="{{ fanFive }}" as="c" ...> ... </sc-for>
function expandFan(html) {
  const FAN_FIVE = fan(CARDS, 224, [
    { rot: -26, x: -340, y: 96, z: 1 },
    { rot: -13, x: -176, y: 18, z: 2 },
    { rot: 0, x: 0, y: -12, z: 3 },
    { rot: 13, x: 176, y: 18, z: 2 },
    { rot: 26, x: 340, y: 96, z: 1 },
  ])
  return html.replace(/<sc-for list="\{\{ fanFive \}\}"[^>]*>([\s\S]*?)<\/sc-for>/g, (_m, inner) =>
    FAN_FIVE.map((c) => fillObj(inner, 'c', c)).join(''))
}

// Replace {{ ns.prop }} placeholders from an object.
function fillObj(html, ns, obj) {
  return html.replace(new RegExp(`\\{\\{ ${ns}\\.([a-zA-Z]+) \\}\\}`, 'g'), (_m, prop) =>
    obj[prop] != null ? String(obj[prop]) : '')
}

function resolveTemplate(html) {
  let out = html
  out = out.replace(/\{\{ substrateStyle \}\}/g, SUBSTRATE)
  out = out.replace(/\{\{ foilClass \}\}/g, 'foil-anim')
  out = expandG1(out)
  if (out.includes('{{ fanFive }}')) out = expandFan(out)
  if (out.includes('{{ pairFront.')) out = fillObj(out, 'pairFront', cardObj(CARDS[0], 0))
  // Any stray sc-if wrappers (gallery labels) — drop them entirely; keep inner only when shown.
  out = out.replace(/<sc-if value="\{\{ isGallery \}\}"[^>]*>[\s\S]*?<\/sc-if>/g, '')
  return out
}

function page(surfaceHtml, w, h) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&family=Nunito:ital,wght@0,400;0,600;0,700;1,400&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root{${tokenVars()}--bars-font-display:'Jost','Futura PT',system-ui,sans-serif;--bars-font-body:'Nunito',system-ui,sans-serif;--bars-font-mono:'Space Mono',ui-monospace,monospace;}
  *{box-sizing:border-box;} html,body{margin:0;padding:0;background:transparent;}
  #stage{width:${w}px;height:${h}px;}
  @keyframes foilshift{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
  @keyframes sheensweep{0%{transform:translateX(-160%) skewX(-18deg);}60%,100%{transform:translateX(260%) skewX(-18deg);}}
  .foil-anim{animation:foilshift 7s linear infinite;}
</style></head>
<body><div id="stage">${surfaceHtml}</div></body></html>`
}

// ─── Surfaces to export ────────────────────────────────────────────────────────
const SURFACES = [
  { id: 'back1', file: 'card-back-struck-gold.png', w: 460, h: 644 },
  { id: 'cover', file: 'gumroad-cover-1280x720.png', w: 1280, h: 720 },
  { id: 'fan', file: 'gumroad-card-fan-1080.png', w: 1080, h: 1080 },
  { id: 'box', file: 'gumroad-box-shot-1080.png', w: 1080, h: 1080 },
  { id: 'thumb', file: 'gumroad-thumbnail-1080.png', w: 1080, h: 1080 },
  { id: 'pair', file: 'gumroad-front-back-1080.png', w: 1080, h: 1080 },
]

async function main() {
  if (!existsSync(HTML_PATH)) throw new Error(`handoff HTML not found at ${HTML_PATH}`)
  mkdirSync(OUT, { recursive: true })
  const logoDataUri = `data:image/png;base64,${readFileSync(LOGO_PATH).toString('base64')}`

  const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] })
  const SCALE = 2 // render at 2x, then downscale to exact size for crisp output
  const page0 = await browser.newPage({ deviceScaleFactor: SCALE, viewport: { width: 1400, height: 1400 } })

  for (const s of SURFACES) {
    let markup = resolveTemplate(extractSurface(s.id))
    markup = markup.replace(/assets\/logo\/mtgoa-logo-transparent\.png/g, logoDataUri)
    await page0.setViewportSize({ width: s.w, height: s.h })
    await page0.setContent(page(markup, s.w, s.h), { waitUntil: 'networkidle' })
    await page0.evaluate(() => document.fonts.ready)
    const stage = await page0.$('#stage')
    const buf = await stage.screenshot({ omitBackground: true })
    await sharp(buf).resize(s.w, s.h, { fit: 'fill' }).png().toFile(join(OUT, s.file))
    console.log(`✓ ${s.file}  (${s.w}×${s.h})`)
  }

  await browser.close()
  console.log(`\nDone → ${OUT}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
