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
 *     --prune-orphans base.png  drop disconnected overlay components that never
 *                            touch the base silhouette (floating feet, stray
 *                            blobs) — 8-connected flood fill per cell.
 *     --clamp-to-base base.png  clear overlay pixels outside the base's per-cell
 *                            silhouette bbox (+4px margin) — kills strays below
 *                            the feet line and off the flanks.
 *     --fill-skin base.png    replace overlay pixels colored like the base's skin
 *                            (bare-midriff artifacts) with the nearest fabric
 *                            color found below in the same column, else above.
 *     --drop-skin base.png    remove overlay pixels colored like the base's skin
 *                            entirely (for hood-up robes: floating face/hand
 *                            fragments; the base already provides those pixels).
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
const pruneBase = idx('prune-orphans')
const clampBase = idx('clamp-to-base')
const fillSkinBase = idx('fill-skin')
const dropSkinBase = idx('drop-skin')

if (!inp || !outp || (!degreen && !harden && !aboveNeckBase && !pruneBase && !clampBase && !fillSkinBase && !dropSkinBase)) {
  console.error('usage: clean-sorceress-overlay.mjs <in.png> <out.png> [--degreen] [--harden] [--above-neck base.png] [--prune-orphans base.png] [--clamp-to-base base.png] [--fill-skin base.png] [--drop-skin base.png]')
  process.exit(2)
}

const CW = 32, CH = 64

const { data, info } = await sharp(inp).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width

function neckRows(baseData, baseW) {
  // per cell: shoulder line = first row whose opaque width reaches the head
  // width plus a margin, where head width is measured over the first 8 rows of
  // the silhouette. Anchoring on the head (not the max width, which on an
  // hourglass base is the HIPS) keeps the strip from eating the whole torso.
  const rows = []
  const A = (x, y) => baseData[((y * baseW) + x) * 4 + 3]
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const widths = []
    for (let y = 0; y < CH; y++) {
      let mn = CW, mx = -1
      for (let x = 0; x < CW; x++) if (A(c * CW + x, r * CH + y) > 40) { mn = Math.min(mn, x); mx = Math.max(mx, x) }
      widths.push(mx < 0 ? 0 : mx - mn + 1)
    }
    const miny = widths.findIndex((w) => w > 0)
    let headW = 0
    for (let y = miny; y < Math.min(CH, miny + 8); y++) headW = Math.max(headW, widths[y])
    const threshold = Math.max(headW + 2, Math.ceil(headW * 1.15))
    let neck = miny + 1
    for (let y = miny + 1; y < 44; y++) { if (widths[y] >= threshold) { neck = y; break } }
    rows[r * 3 + c] = neck
  }
  return rows
}

let necks = null
let baseOpaque = null
if (aboveNeckBase || pruneBase || clampBase || fillSkinBase || dropSkinBase) {
  const b = await sharp(aboveNeckBase ?? pruneBase ?? clampBase ?? fillSkinBase ?? dropSkinBase).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  baseOpaque = b
  if (aboveNeckBase) necks = neckRows(b.data, b.info.width)
}

function pruneOrphans(data, W, baseData, baseW) {
  // per cell: 8-connected components of opaque overlay pixels; keep only
  // components with a pixel 8-adjacent to an opaque base pixel
  let dropped = 0
  const baseA = (x, y) => baseData[((y * baseW) + x) * 4 + 3]
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const x0 = c * CW, y0 = r * CH
    const A = (x, y) => data[(((y0 + y) * W) + x0 + x) * 4 + 3]
    const seen = new Uint8Array(CW * CH)
    const comp = []
    for (let sy = 0; sy < CH; sy++) for (let sx = 0; sx < CW; sx++) {
      if (seen[sy * CW + sx] || A(sx, sy) <= 40) continue
      // flood fill this component
      comp.length = 0
      const stack = [[sx, sy]]
      seen[sy * CW + sx] = 1
      let touches = false
      while (stack.length) {
        const [x, y] = stack.pop()
        comp.push([x, y])
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy
          if (nx < 0 || ny < 0 || nx >= CW || ny >= CH) continue
          if (dx === 0 && dy === 0) continue
          // adjacency to base silhouette keeps the component
          if (baseA(x0 + nx, y0 + ny) > 40) touches = true
          if (!seen[ny * CW + nx] && A(nx, ny) > 40) { seen[ny * CW + nx] = 1; stack.push([nx, ny]) }
        }
      }
      if (!touches) {
        for (const [x, y] of comp) { data[(((y0 + y) * W) + x0 + x) * 4 + 3] = 0 }
        dropped += comp.length
      }
    }
  }
  return dropped
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

function baseBoxes(baseData, baseW) {
  // per cell: opaque bbox of the base
  const boxes = []
  const A = (x, y) => baseData[((y * baseW) + x) * 4 + 3]
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    let minx = CW, miny = CH, maxx = -1, maxy = -1
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (A(c * CW + x, r * CH + y) > 40) {
      if (x < minx) minx = x
      if (y < miny) miny = y
      if (x > maxx) maxx = x
      if (y > maxy) maxy = y
    }
    boxes[r * 3 + c] = { minx, miny, maxx, maxy }
  }
  return boxes
}

function clampToBase(data, W, baseData, baseW) {
  const boxes = baseBoxes(baseData, baseW)
  let cleared = 0
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const b = boxes[r * 3 + c]
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      if (x < b.minx - 4 || x > b.maxx + 4 || y < b.miny - 4 || y > b.maxy + 4) {
        const i = (((r * CH + y) * W) + c * CW + x) * 4
        if (data[i + 3] > 0) { data[i + 3] = 0; cleared++ }
      }
    }
  }
  return cleared
}

function skinFamily(baseData) {
  const skins = new Set()
  for (let i = 0; i < baseData.length; i += 4) {
    const [R, G, B, a] = [baseData[i], baseData[i+1], baseData[i+2], baseData[i+3]]
    if (a > 200 && R > 100 && R > G && G > B) skins.add(`${R},${G},${B}`)
  }
  return skins
}

function fillSkin(data, W, baseData, baseW) {
  // skin family = the base's own opaque colors whose R > G > B and R > 100
  // (the tan palette). Overlay px matching within dist 45 get filled from the
  // nearest non-skin overlay px below in the same column, else above.
  const skins = skinFamily(baseData)
  const isSkin = (R, G, B) => {
    if (!(R > 100 && R > G && G > B)) return false
    for (const s of skins) {
      const [r, g, b] = s.split(',').map(Number)
      const d = (R-r)*(R-r) + (G-g)*(G-g) + (B-b)*(B-b)
      if (d < 2025) return true // 45^2
    }
    return false
  }
  let filled = 0
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    for (let x = 0; x < CW; x++) {
      for (let y = 0; y < CH; y++) {
        const i = (((r * CH + y) * W) + c * CW + x) * 4
        if (data[i + 3] === 0) continue
        if (!isSkin(data[i], data[i + 1], data[i + 2])) continue
        // nearest non-skin fabric below, else above
        let pick = null
        for (let yy = y + 1; yy < CH; yy++) {
          const j = (((r * CH + yy) * W) + c * CW + x) * 4
          if (data[j + 3] > 0 && !isSkin(data[j], data[j + 1], data[j + 2])) { pick = [data[j], data[j + 1], data[j + 2]]; break }
        }
        if (!pick) {
          for (let yy = y - 1; yy >= 0; yy--) {
            const j = (((r * CH + yy) * W) + c * CW + x) * 4
            if (data[j + 3] > 0 && !isSkin(data[j], data[j + 1], data[j + 2])) { pick = [data[j], data[j + 1], data[j + 2]]; break }
          }
        }
        if (pick) { data[i] = pick[0]; data[i + 1] = pick[1]; data[i + 2] = pick[2]; filled++ }
      }
    }
  }
  return filled
}

function dropSkin(data, W, baseData) {
  const skins = skinFamily(baseData)
  let dropped = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    const R = data[i], G = data[i + 1], B = data[i + 2]
    if (!(R > 100 && R > G && G > B)) continue
    for (const s of skins) {
      const [r, g, b] = s.split(',').map(Number)
      const d = (R-r)*(R-r) + (G-g)*(G-g) + (B-b)*(B-b)
      if (d < 2025) { data[i + 3] = 0; dropped++; break }
    }
  }
  return dropped
}

if (pruneBase && baseOpaque) {
  const dropped = pruneOrphans(data, W, baseOpaque.data, baseOpaque.info.width)
  console.log(`  prune-orphans: dropped ${dropped} px`)
}

if (clampBase && baseOpaque) {
  const cleared = clampToBase(data, W, baseOpaque.data, baseOpaque.info.width)
  console.log(`  clamp-to-base: cleared ${cleared} px`)
}

if (fillSkinBase && baseOpaque) {
  const filled = fillSkin(data, W, baseOpaque.data, baseOpaque.info.width)
  console.log(`  fill-skin: filled ${filled} px`)
}

if (dropSkinBase && baseOpaque) {
  const dropped = dropSkin(data, W, baseOpaque.data)
  console.log(`  drop-skin: dropped ${dropped} px`)
}

await sharp(data, { raw: { width: W, height: info.height, channels: 4 } }).png().toFile(outp)
console.log(`wrote ${outp} (degreen: ${nGreen} px, hardened: ${nHard} px, above-neck: ${nAbove} px)`)
