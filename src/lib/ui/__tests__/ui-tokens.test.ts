/**
 * The one token file (public/ui/tokens.css) stays in step with card-tokens.ts, and the ink on every accent reads.
 * Six-faces-council uu1-one-namespace and uu1-two-fixes-need-no-look (white on #5fc0b5 was 2.17:1).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ELEMENT_TOKENS } from '../card-tokens'
import { render, readElements as readElementsRaw, SCHEMES } from '../../../../scripts/ui-tokens.mjs'

const root = join(__dirname, '../../../..')
const css = readFileSync(join(root, 'public/ui/tokens.css'), 'utf8')

// ── The file is what the script writes from card-tokens.ts ──────────────────
assert.equal(css, render(), 'public/ui/tokens.css is out of step: run node scripts/ui-tokens.mjs')

// ── Every element's frame and glow come from card-tokens.ts ─────────────────
const els = readElementsRaw() as Record<string, { frame: string; glow: string }>
for (const [k, t] of Object.entries(ELEMENT_TOKENS)) {
  assert.equal(els[k].frame, t.frame.toLowerCase(), `${k} frame`)
  assert.equal(els[k].glow, t.glow.toLowerCase(), `${k} glow`)
  assert.ok(css.includes(`--ui-${k}: ${t.frame.toLowerCase()};`), `--ui-${k} in tokens.css`)
  assert.ok(css.includes(`--ui-${k}-glow: ${t.glow.toLowerCase()};`), `--ui-${k}-glow in tokens.css`)
}

// ── Contrast: accent-ink on accent, ink on bg and panel, muted on bg ────────
const lum = (hex: string) => {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
for (const [name, s] of Object.entries(SCHEMES as Record<string, Record<string, string>>)) {
  assert.ok(ratio(s['accent-ink'], s.accent) >= 4.5, `${name}: accent-ink on accent ${ratio(s['accent-ink'], s.accent).toFixed(2)}:1`)
  assert.ok(ratio(s.ink, s.bg) >= 4.5, `${name}: ink on bg`)
  assert.ok(ratio(s.ink, s.panel) >= 4.5, `${name}: ink on panel`)
  assert.ok(ratio(s.muted, s.bg) >= 4.5, `${name}: muted on bg ${ratio(s.muted, s.bg).toFixed(2)}:1`)
}
// the old Between button, for the record: white on the dark accent fails, the token ink passes
assert.ok(ratio('#ffffff', '#5fc0b5') < 4.5)

console.log('ui-tokens: in step with card-tokens.ts; every accent ink reads at 4.5:1 or more')
