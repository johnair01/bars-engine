#!/usr/bin/env node
/**
 * Per-cell registration of a 96x256 overlay sheet onto a 96x256 base sheet:
 * for every cell, brute-force the (dx,dy) shift that maximizes the fraction of
 * overlay pixels landing on base silhouette pixels, then emit the shifted
 * overlay. Fails loudly when even the best offset leaves a cell poorly
 * anchored (< --min-overlap of overlay pixels on the body).
 *
 *   node scripts/wa/register-sorceress-overlay.mjs overlay.png base.png out.png [--range 6] [--min-overlap 0.5]
 */
import sharp from 'sharp'

const [inp, basePath, out] = process.argv.slice(2)
const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? Number(process.argv[i + 1]) : dflt
}
const RANGE = arg('range', 6)
const MIN_OVERLAP = arg('min-overlap', 0.5)
const COLS = 3, ROWS = 4, CW = 32, CH = 64

if (!inp || !basePath || !out) {
  console.error('usage: register-sorceress-overlay.mjs <overlay> <base> <out> [--range 6] [--min-overlap 0.5]')
  process.exit(2)
}

async function load(p) {
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height, c: info.channels }
}

async function main() {
  const ov = await load(inp)
  const base = await load(basePath)
  if (ov.w !== base.w || ov.h !== base.h) {
    console.error(`size mismatch: overlay ${ov.w}x${ov.h} vs base ${base.w}x${base.h}`)
    process.exit(1)
  }
  const W = ov.w, H = ov.h, C = ov.c
  const isOn = (d, x, y) => d[(y * W + x) * C + 3] > 0

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // gather overlay pixel coords in this cell
      const pts = []
      for (let y = 0; y < CH; y++) {
        for (let x = 0; x < CW; x++) {
          if (isOn(ov.data, c * CW + x, r * CH + y)) pts.push([x, y])
        }
      }
      if (pts.length === 0) { console.log(`cell ${r}x${c}: empty — skipped`); continue }
      let best = { dx: 0, dy: 0, frac: 0 }
      for (let dy = -RANGE; dy <= RANGE; dy++) {
        for (let dx = -RANGE; dx <= RANGE; dx++) {
          let hit = 0
          for (const [x, y] of pts) {
            const bx = c * CW + x + dx, by = r * CH + y + dy
            if (bx < c * CW || bx >= (c + 1) * CW || by < r * CH || by >= (r + 1) * CH) continue
            if (isOn(base.data, bx, by)) hit++
          }
          const frac = hit / pts.length
          if (frac > best.frac + 1e-9 || (frac === best.frac && Math.abs(dy) + Math.abs(dx) < Math.abs(best.dy) + Math.abs(best.dx))) {
            best = { dx, dy, frac }
          }
        }
      }
      if (best.frac < MIN_OVERLAP) {
        console.error(`cell ${r}x${c}: best anchor ${(best.frac * 100).toFixed(0)}% < ${MIN_OVERLAP * 100}% — overlay art does not fit the base silhouette here (re-roll or resize the source)`)
        process.exit(1)
      }
      if (best.dx !== 0 || best.dy !== 0) {
        // output(x, y) = original(x - dx, y - dy), scoped to this cell
        const snapshot = Buffer.from(ov.data)
        for (let y = 0; y < CH; y++) {
          for (let x = 0; x < CW; x++) {
            const to = ((r * CH + y) * W + (c * CW + x)) * C
            const sx = c * CW + x - best.dx, sy = r * CH + y - best.dy
            if (sx < c * CW || sx >= (c + 1) * CW || sy < r * CH || sy >= (r + 1) * CH) {
              ov.data.fill(0, to, to + C)
            } else {
              const from = (sy * W + sx) * C
              snapshot.copy(ov.data, to, from, from + C)
            }
          }
        }
      }
      console.log(`cell ${r}x${c}: shift (${best.dx},${best.dy}) anchor ${(best.frac * 100).toFixed(0)}%`)
    }
  }

  await sharp(ov.data, { raw: { width: W, height: H, channels: C } })
    .png({ palette: true, colors: 16, dither: 0 })
    .toFile(out)
  console.log(`wrote ${out}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
