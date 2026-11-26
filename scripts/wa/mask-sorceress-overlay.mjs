#!/usr/bin/env node
/**
 * Extract a WOKA overlay from a mask-color edit at NATIVE resolution:
 * scan the raw sheet for mask pixels, then for each 32x64 target cell sample
 * the corresponding raw region and mark the target pixel as overlay when a
 * sufficient fraction of its source region is mask (preserves thin lines).
 *
 *   node scripts/wa/mask-sorceress-overlay.mjs edited.png out.png \
 *        [--mask ff00ff] [--tol 80] [--min-px 40] [--max-frac 0.5] [--area-frac 0.2]
 */
import sharp from 'sharp'

const [inpEdited, out] = process.argv.slice(2)
const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : dflt
}
const MASK = arg('mask', 'ff00ff')
const TOL = Number(arg('tol', '80'))
const MIN_PX = Number(arg('min-px', '40'))
const MAX_FRAC = Number(arg('max-frac', '0.5'))
const AREA_FRAC = Number(arg('area-frac', '0.2'))
const COLS = 3, ROWS = 4, CW = 32, CH = 64

if (!inpEdited || !out) {
  console.error('usage: mask-sorceress-overlay.mjs <edited.png> <out.png> [--mask ff00ff] [--tol 80] [--min-px 40] [--max-frac 0.5] [--area-frac 0.2]')
  process.exit(2)
}

const mr = parseInt(MASK.slice(0, 2), 16), mg = parseInt(MASK.slice(2, 4), 16), mb = parseInt(MASK.slice(4, 6), 16)

async function main() {
  const { data, info } = await sharp(inpEdited).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height, C = info.channels
  const cellW = Math.floor(W / COLS), cellH = Math.floor(H / ROWS)

  // per-cell mask maps at raw resolution
  const maskMaps = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const map = new Uint8Array(cellW * cellH)
      let count = 0
      for (let y = 0; y < cellH; y++) {
        for (let x = 0; x < cellW; x++) {
          const p = ((r * cellH + y) * W + (c * cellW + x)) * C
          const dr = data[p] - mr, dg = data[p + 1] - mg, db = data[p + 2] - mb
          if (Math.sqrt(dr * dr + dg * dg + db * db) < TOL) {
            map[y * cellW + x] = 1
            count++
          }
        }
      }
      maskMaps.push({ map, count, cellW, cellH })
    }
  }

  const outBuf = Buffer.alloc(COLS * CW * ROWS * CH * 4)
  let ok = true
  for (let idx = 0; idx < COLS * ROWS; idx++) {
    const r = Math.floor(idx / COLS), c = idx % COLS
    const { map, count, cellW: cw, cellH: ch } = maskMaps[idx]
    const frac = count / (cw * ch)
    console.log(`cell ${r}x${c}: mask ${count} px (${(frac * 100).toFixed(0)}%)`)
    if (count < MIN_PX * 50) { // raw-resolution skip guard
      console.error(`  ✗ cell ${r}x${c}: mask too small (${count} raw px) — edit may have skipped the layer`)
      ok = false
      continue
    }
    if (frac > MAX_FRAC) {
      console.error(`  ✗ cell ${r}x${c}: ${(frac * 100).toFixed(0)}% of cell is mask — edit spilled beyond the target layer`)
      ok = false
      continue
    }
    // area-sample down to 32x64
    let fitted = 0
    for (let y = 0; y < CH; y++) {
      for (let x = 0; x < CW; x++) {
        const x0 = Math.floor(x * cw / CW), x1 = Math.max(x0 + 1, Math.floor((x + 1) * cw / CW))
        const y0 = Math.floor(y * ch / CH), y1 = Math.max(y0 + 1, Math.floor((y + 1) * ch / CH))
        let hit = 0, total = 0
        for (let yy = y0; yy < y1; yy++) {
          for (let xx = x0; xx < x1; xx++) {
            total++
            hit += map[yy * cw + xx]
          }
        }
        if (total > 0 && hit / total >= AREA_FRAC) {
          const q = ((r * CH + y) * (COLS * CW) + (c * CW + x)) * 4
          outBuf[q] = 128; outBuf[q + 1] = 128; outBuf[q + 2] = 128; outBuf[q + 3] = 255
          fitted++
        }
      }
    }
    if (fitted < MIN_PX) {
      console.error(`  ✗ cell ${r}x${c}: fitted only ${fitted} px after downscale (< ${MIN_PX})`)
      ok = false
    }
  }
  if (!ok) process.exit(1)

  await sharp(outBuf, { raw: { width: COLS * CW, height: ROWS * CH, channels: 4 } })
    .png({ palette: true, colors: 4, dither: 0 })
    .toFile(out)
  console.log(`wrote ${out} (${COLS * CW}x${ROWS * CH})`)
}

main().catch((e) => { console.error(e); process.exit(1) })
