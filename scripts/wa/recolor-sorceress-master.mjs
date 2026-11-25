#!/usr/bin/env node
/**
 * Recolor a gray-value mask master (from mask-sorceress-overlay.mjs) to a
 * target color, preserving antialias softness via the master's gray value:
 * out = target * (v / 128), clamped. Use --solid to fill every non-transparent
 * pixel with the exact target color instead.
 *
 *   node scripts/wa/recolor-sorceress-master.mjs in.png out.png --color 7d8ea6 [--solid]
 */
import sharp from 'sharp'

const [inp, out] = process.argv.slice(2)
const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : dflt
}
const hex = arg('color', '7d8ea6')
const solid = process.argv.includes('--solid')

if (!inp || !out) {
  console.error('usage: recolor-sorceress-master.mjs <in.png> <out.png> --color 7d8ea6 [--solid]')
  process.exit(2)
}
const R = parseInt(hex.slice(0, 2), 16), G = parseInt(hex.slice(2, 4), 16), B = parseInt(hex.slice(4, 6), 16)

async function main() {
  const { data, info } = await sharp(inp).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    if (solid) {
      data[i] = R; data[i + 1] = G; data[i + 2] = B
    } else {
      const k = Math.min(2, (data[i] + data[i + 1] + data[i + 2]) / 3 / 128)
      data[i] = Math.min(255, Math.round(R * k))
      data[i + 1] = Math.min(255, Math.round(G * k))
      data[i + 2] = Math.min(255, Math.round(B * k))
    }
    data[i + 3] = 255
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ palette: true, colors: 16, dither: 0 })
    .toFile(out)
  console.log(`wrote ${out} recolored to #${hex}${solid ? ' (solid)' : ''}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
