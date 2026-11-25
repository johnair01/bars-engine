#!/usr/bin/env node
/**
 * Extract a WOKA overlay by diffing an edited sheet against its base sheet.
 * Both inputs are raw sorceress outputs (green plate). Both are keyed with the
 * same plate color, resized to a common geometry, and then every pixel that
 * differs from the base by more than --delta becomes overlay alpha=1. A
 * per-cell coverage check fails loudly when the edit re-rendered the whole
 * sheet instead of changing only the target layer.
 *
 *   node scripts/wa/diff-sorceress-overlay.mjs base.png edited.png out.png \
 *        [--plate 06ab48] [--tol 55] [--delta 60] [--max-coverage 0.45]
 */
import sharp from 'sharp'

const [inpBase, inpEdited, out] = process.argv.slice(2)
const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : dflt
}
const PLATE = arg('plate', '06ab48')
const TOL = Number(arg('tol', '55'))
const DELTA = Number(arg('delta', '60'))
const MAX_COV = Number(arg('max-coverage', '0.45'))
const COLS = 3, ROWS = 4, CW = 32, CH = 64

if (!inpBase || !inpEdited || !out) {
  console.error('usage: diff-sorceress-overlay.mjs <base> <edited> <out> [--plate 06ab48] [--tol 55] [--delta 60] [--max-coverage 0.45]')
  process.exit(2)
}

const pr = parseInt(PLATE.slice(0, 2), 16)
const pg = parseInt(PLATE.slice(2, 4), 16)
const pb = parseInt(PLATE.slice(4, 6), 16)

function keyData(data, W, H, C) {
  for (let i = 0; i < W * H; i++) {
    const p = i * C
    const dr = data[p] - pr, dg = data[p + 1] - pg, db = data[p + 2] - pb
    const d = Math.sqrt(dr * dr + dg * dg + db * db)
    data[p + 3] = d < TOL ? 0 : 255
  }
}

async function loadKeyed(p, targetW, targetH) {
  let img = sharp(p)
  const m = await img.metadata()
  if (m.width !== targetW || m.height !== targetH) img = img.resize(targetW, targetH)
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  keyData(data, info.width, info.height, info.channels)
  return { data, w: info.width, h: info.height, c: info.channels }
}

async function main() {
  const bm = await sharp(inpBase).metadata()
  const base = await loadKeyed(inpBase, bm.width, bm.height)
  const edit = await loadKeyed(inpEdited, bm.width, bm.height)

  const W = base.w, H = base.h, C = base.c
  const outBuf = Buffer.alloc(W * H * 4)

  let ok = true
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let diffCount = 0, baseCount = 0
      for (let y = 0; y < CH; y++) {
        for (let x = 0; x < CW; x++) {
          const p = ((r * CH + y) * W + (c * CW + x)) * C
          const baseOn = base.data[p + 3] > 0
          const editOn = edit.data[p + 3] > 0
          if (baseOn) baseCount++
          const dr = edit.data[p] - base.data[p]
          const dg = edit.data[p + 1] - base.data[p + 1]
          const db = edit.data[p + 2] - base.data[p + 2]
          const changed = Math.sqrt(dr * dr + dg * dg + db * db) > DELTA
          // overlay = changed pixels that exist in the edit (added or recolored)
          const on = changed && editOn
          const q = ((r * CH + y) * COLS * CW + (c * CW + x)) * 4
          if (on) {
            outBuf[q] = edit.data[p]
            outBuf[q + 1] = edit.data[p + 1]
            outBuf[q + 2] = edit.data[p + 2]
            outBuf[q + 3] = 255
            diffCount++
          }
        }
      }
      const cov = baseCount > 0 ? diffCount / baseCount : diffCount / (CW * CH)
      console.log(`cell ${r}x${c}: diff ${diffCount} px, coverage ${(cov * 100).toFixed(0)}%`)
      if (cov > MAX_COV) {
        console.error(`  ✗ cell ${r}x${c}: ${(cov * 100).toFixed(0)}% of the cell changed — the edit re-rendered more than the target layer (max ${MAX_COV * 100}%)`)
        ok = false
      }
    }
  }
  if (!ok) process.exit(1)

  const OUT_W = COLS * CW, OUT_H = ROWS * CH
  await sharp(outBuf, { raw: { width: OUT_W, height: OUT_H, channels: 4 } })
    .png({ palette: true, colors: 24, dither: 0 })
    .toFile(out)
  console.log(`wrote ${out} (${OUT_W}x${OUT_H})`)
}

main().catch((e) => { console.error(e); process.exit(1) })
