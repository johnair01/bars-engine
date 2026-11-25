#!/usr/bin/env node
/**
 * Local rescue pass for sorceress exports, so a marginal generation gets fixed
 * here instead of burning a re-roll in the editor:
 *
 *   node scripts/wa/normalize-sorceress.mjs <dir> [--frame-height 64] [--quantize 16]
 *
 * For every PNG in <dir> it writes a normalized copy to <dir>/normalized/:
 *   1. already exact (96 x 4*fh)?            -> pass through
 *   2. uniform integer scale of the target?  -> nearest-neighbor downscale
 *   3. otherwise: trim to opaque content and fit it onto a clean
 *      96 x 4*fh canvas, feet on the bottom pixel row, centered horizontally
 *   4. harden alpha (any a<128 -> 0, else 255): kills anti-aliased edges
 *   5. optional palette quantize (--quantize 16) for the palette budget
 *
 * Output is what you feed the gate:
 *   node scripts/wa/import-sorceress.mjs <dir>/normalized --frame-height 64 --dry-run
 */
import { mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const dir = args.find((a) => !a.startsWith('--'))
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const fh = Number(flag('frame-height', 64))
const quantize = Number(flag('quantize', 0))

if (!dir) {
  console.error('usage: node scripts/wa/normalize-sorceress.mjs <dir> [--frame-height 64] [--quantize 16]')
  process.exit(2)
}

const TARGET_W = 96
const TARGET_H = 4 * fh
const sharp = (await import('sharp')).default

async function loadRaw(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

function contentBounds({ data, w, h }, alphaMin = 128) {
  let minX = w, minY = h, maxX = -1, maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] >= alphaMin) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY }
}

function hardenAlpha(buf) {
  for (let i = 3; i < buf.length; i += 4) {
    buf[i] = buf[i] < 128 ? 0 : 255
  }
}

function quantizeToN(buf, n) {
  // coarse bucketing to roughly n colors (per-channel levels)
  const levels = Math.max(2, Math.round(Math.cbrt(n)))
  const step = Math.ceil(256 / levels)
  for (let i = 0; i < buf.length; i += 4) {
    if (buf[i + 3] === 0) continue
    buf[i] = Math.min(255, Math.round(buf[i] / step) * step)
    buf[i + 1] = Math.min(255, Math.round(buf[i + 1] / step) * step)
    buf[i + 2] = Math.min(255, Math.round(buf[i + 2] / step) * step)
  }
}

async function main() {
  const files = readdirSync(dir).filter((f) => f.endsWith('.png')).sort()
  if (!files.length) {
    console.error(`no PNGs in ${dir}`)
    process.exit(2)
  }
  const outDir = path.join(dir, 'normalized')
  mkdirSync(outDir, { recursive: true })

  // Auto-trim re-anchors content (feet at bottom): right for full-body sheets,
  // fatal for overlays whose whole job is pixel alignment. Overlays must arrive
  // exact-size or uniformly scaled; anything else fails the gate loudly.
  const kindOf = (f) => f.startsWith('base-') ? 'base' : f.startsWith('robe-') ? 'robe' : 'overlay'

  for (const file of files) {
    const kind = kindOf(file)
    const { data, w, h } = await loadRaw(path.join(dir, file))
    let out
    let note

    if (w === TARGET_W && h === TARGET_H) {
      out = data
      note = 'exact size'
    } else if (w % TARGET_W === 0 && h % TARGET_H === 0 && w / TARGET_W === h / TARGET_H) {
      const k = w / TARGET_W
      const compact = Buffer.alloc(TARGET_W * TARGET_H * 4)
      for (let y = 0; y < TARGET_H; y++) {
        for (let x = 0; x < TARGET_W; x++) {
          const si = (y * k * w + x * k) * 4
          const di = (y * TARGET_W + x) * 4
          compact[di] = data[si]
          compact[di + 1] = data[si + 1]
          compact[di + 2] = data[si + 2]
          compact[di + 3] = data[si + 3]
        }
      }
      out = compact
      note = `downscale x${k}`
    } else if (kind === 'overlay') {
      console.error(`  ! ${file}: ${w}x${h} is not the target grid and overlays are never auto-trimmed — crop to 96x${TARGET_H} in the editor (or export at a uniform scale of it), then re-run`)
      continue
    } else {
      const bounds = contentBounds({ data, w, h })
      if (!bounds) {
        console.error(`  ? ${file}: fully transparent — skipped`)
        continue
      }
      const bw = bounds.maxX - bounds.minX + 1
      const bh = bounds.maxY - bounds.minY + 1
      const scale = Math.min(TARGET_W / bw, TARGET_H / bh)
      const newW = Math.max(1, Math.round(bw * scale))
      const newH = Math.max(1, Math.round(bh * scale))
      const content = await sharp(path.join(dir, file), { raw: { width: w, height: h, channels: 4 } })
        .extract({ left: bounds.minX, top: bounds.minY, width: bw, height: bh })
        .resize(newW, newH, { kernel: 'nearest' })
        .raw()
        .toBuffer()
      const canvas = Buffer.alloc(TARGET_W * TARGET_H * 4, 0)
      const offX = Math.floor((TARGET_W - newW) / 2)
      const offY = TARGET_H - newH // feet on the bottom row
      for (let y = 0; y < newH; y++) {
        content.copy(canvas, ((y + offY) * TARGET_W + offX) * 4, y * newW * 4, (y + 1) * newW * 4)
      }
      out = canvas
      note = `trimmed ${w}x${h}, content ${bw}x${bh} -> fit ${newW}x${newH}, feet at bottom`
    }

    hardenAlpha(out)
    if (quantize > 0) quantizeToN(out, quantize)

    await sharp(out, { raw: { width: TARGET_W, height: TARGET_H, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(outDir, file))
    console.log(`  ${file}: ${note} -> ${TARGET_W}x${TARGET_H} (alpha hardened${quantize > 0 ? `, quantized ~${quantize}` : ''})`)
  }
  console.log(`\nnormalized copies in ${outDir}/ — run the gate on that folder.`)
}

main().catch((err) => { console.error(err); process.exit(1) })
