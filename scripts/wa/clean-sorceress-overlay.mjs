#!/usr/bin/env node
/**
 * Cleanup pass for keyed sorceress sheets (96x256).
 *
 *   node scripts/wa/clean-sorceress-overlay.mjs in.png out.png [flags]
 *     --degreen              drop pixels with a chroma-green cast (spill residue)
 *     --harden               hard alpha: <128 -> 0, else 255 (no soft edges)
 *     --above-neck base.png  clear overlay pixels above the base's shoulder line,
 *                            per cell (strips hood-down robe head remnants while
 *                            keeping the collar). The base must be the parent
 *                            gated sheet the overlay registers against.
 *
 * Green test: G > max(R, B) + LEVEL (default 10). Catches the keyer's spill
 * suppression residue, which leaves G raised up to +40 over the other channels
 * on edge pixels. Safe for charcoal/gray art, white robes, orange skin
 * (G < R), silver-blue and gray-blue robes — kills only chroma plate residue.
 */
import sharp from 'sharp'

const [inp, outp] = process.argv.slice(2)
const idx = (name) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const degreen = process.argv.includes('--degreen')
const greenLevel = Number(idx('green-level') ?? 10)
const harden = process.argv.includes('--harden')
const aboveNeckBase = idx('above-neck')

if (!inp || !outp || (!degreen && !harden && !aboveNeckBase)) {
  console.error('usage: clean-sorceress-overlay.mjs <in.png> <out.png> [--degreen] [--harden] [--above-neck base.png]')
  process.exit(2)
}

const CW = 32, CH = 64

const { data, info } = await sharp(inp).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width

function neckRows(baseData, baseW) {
  // per cell: shoulder line = first row from the top whose opaque width reaches
  // ~90% of the widest row in the upper body band. Robust against hair/topknot
  // inflating the head width and against small (2-3px) head->shoulder jumps.
  const rows = []
  const A = (x, y) => baseData[((y * baseW) + x) * 4 + 3]
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const widths = []
    for (let y = 0; y < CH; y++) {
      let mn = CW, mx = -1
      for (let x = 0; x < CW; x++) if (A(c * CW + x, r * CH + y) > 40) { mn = Math.min(mn, x); mx = Math.max(mx, x) }
      widths.push(mx < 0 ? 0 : mx - mn + 1)
    }
    const shoulderW = Math.max(...widths.slice(0, 40))
    let neck = 1
    for (let y = 0; y < 40; y++) { if (widths[y] >= shoulderW * 0.9) { neck = y; break } }
    rows[r * 3 + c] = neck
  }
  return rows
}

let necks = null
if (aboveNeckBase) {
  const b = await sharp(aboveNeckBase).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  necks = neckRows(b.data, b.info.width)
}

let nGreen = 0, nHard = 0, nAbove = 0
for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const i = (((r * CH + y) * W) + c * CW + x) * 4
    if (data[i + 3] === 0) continue
    if (harden) {
      const a = data[i + 3]
      const na = a < 128 ? 0 : 255
      if (na !== a) { data[i + 3] = na; nHard++ }
      if (na === 0) continue
    }
    if (degreen) {
      const R = data[i], G = data[i + 1], B = data[i + 2]
      const lean = G - Math.max(R, B)
      if (lean > 2 && R + G + B < 150) {
        // dark outline pixel with a spill-darkened green cast: repair, don't
        // delete (deleting would punch holes in the silhouette outline)
        data[i + 1] = Math.max(R, B) + 1
        nGreen++
      } else if (lean > greenLevel) {
        data[i + 3] = 0
        nGreen++
      }
    }
    if (necks && y < necks[r * 3 + c] - 2) { data[i + 3] = 0; nAbove++ }
  }
}

await sharp(data, { raw: { width: W, height: info.height, channels: 4 } }).png().toFile(outp)
console.log(`wrote ${outp} (degreen: ${nGreen} px, hardened: ${nHard} px, above-neck: ${nAbove} px)`)
