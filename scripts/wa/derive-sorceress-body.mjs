#!/usr/bin/env node
/**
 * Code derivation for WOKA body builds (96x256, 32x64 cells).
 *
 * Derives a new build from an approved base sheet by remapping each cell's
 * silhouette rows around the per-cell center axis. The head rows are copied
 * verbatim (rule 5: build differences live below the neck only) and the feet
 * line is untouched.
 *
 *   node scripts/wa/derive-sorceress-body.mjs in.png out.png hourglass
 *       waist pinch + hip flare (feminine presentation from any base)
 *   node scripts/wa/derive-sorceress-body.mjs in.png out.png taper [--depth 0.14]
 *       gradual mass reduction below the neck (elder-ish from older)
 *
 * Modes are smooth Gaussian bumps/notches over the silhouette's row range:
 *   hourglass: waist notch at t=0.50 (-0.21x), hip bump at t=0.67 (+0.25x),
 *              both fading out at the shoulder line and above t=0.82 (legs).
 *   taper:     linear 1.0 -> (1 - depth) from the neck row to the feet.
 * Pixels are nearest-remapped, so the palette is preserved exactly.
 */
import sharp from 'sharp'

const [inp, outp, mode] = process.argv.slice(2)
const depthFlag = process.argv.indexOf('--depth')
const DEPTH = depthFlag >= 0 ? Number(process.argv[depthFlag + 1]) : 0.14
const hipFlag = process.argv.indexOf('--hip')
const HIP = hipFlag >= 0 ? Number(process.argv[hipFlag + 1]) : 0.25
const waistFlag = process.argv.indexOf('--waist')
const WAIST = waistFlag >= 0 ? Number(process.argv[waistFlag + 1]) : 0.21

if (!inp || !outp || !['hourglass', 'taper'].includes(mode)) {
  console.error('usage: derive-sorceress-body.mjs <in.png> <out.png> <hourglass|taper> [--depth 0.14]')
  process.exit(2)
}

const CW = 32, CH = 64

const { data, info } = await sharp(inp).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height
const A = (x, y) => data[((y * W) + x) * 4 + 3]
const out = Buffer.from(data)

for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 3; c++) {
    const x0 = c * CW, y0 = r * CH
    // silhouette bounds + per-row extents
    let miny = CH, maxy = -1
    const rows = []
    for (let y = 0; y < CH; y++) {
      let mn = CW, mx = -1
      for (let x = 0; x < CW; x++) if (A(x0 + x, y0 + y) > 40) { mn = Math.min(mn, x); mx = Math.max(mx, x) }
      rows.push({ mn, mx, w: mx < 0 ? 0 : mx - mn + 1 })
      if (mx >= 0) { miny = Math.min(miny, y); maxy = Math.max(maxy, y) }
    }
    if (maxy < 0) continue
    // neck row = first row where width exceeds the running head max by >3px
    let headMax = 0, neck = miny + 1
    for (let y = miny; y < maxy; y++) {
      headMax = Math.max(headMax, rows[y].w)
      if (rows[y].w > headMax + 3) { neck = y; break }
    }
    // clear output region
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const i = (((y0 + y) * W) + x0 + x) * 4
      for (let k = 0; k < 4; k++) out[i + k] = 0
    }
    const h = maxy - miny + 1
    for (let y = miny; y <= maxy; y++) {
      const row = rows[y]
      if (row.mx < 0) continue
      if (y < neck) { // head: verbatim
        for (let x = row.mn; x <= row.mx; x++) {
          const si = (((y0 + y) * W) + x0 + x) * 4
          for (let k = 0; k < 4; k++) out[si + k] = data[si + k]
        }
        continue
      }
      const t = (y - miny) / (h - 1) // 0 at neck .. 1 at feet
      let f = 1
      if (mode === 'taper') {
        f = 1 - DEPTH * ((y - neck) / Math.max(1, maxy - neck))
      } else {
        // hourglass: waist notch + hip bump, fading above t=0.28 (shoulders)
        // and below t=0.82 (legs stay put)
        const fade = t < 0.28 ? Math.max(0, (t - 0.12) / 0.16) : t > 0.82 ? Math.max(0, (0.98 - t) / 0.16) : 1
        const waist = Math.exp(-(((t - 0.50) / 0.09) ** 2))
        const hip = Math.exp(-(((t - 0.67) / 0.11) ** 2))
        f = 1 + fade * (HIP * hip - WAIST * waist)
      }
      const cx = (row.mn + row.mx) / 2
      for (let x = row.mn; x <= row.mx; x++) {
        const nx = Math.max(0, Math.min(CW - 1, Math.round(cx + (x - cx) * f)))
        const si = (((y0 + y) * W) + x0 + x) * 4
        const di = (((y0 + y) * W) + x0 + nx) * 4
        for (let k = 0; k < 4; k++) out[di + k] = data[si + k]
      }
    }
  }
}

await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(outp)
console.log(`wrote ${outp} (${mode}${mode === 'taper' ? ' depth ' + DEPTH : ''})`)
