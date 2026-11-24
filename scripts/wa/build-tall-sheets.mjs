/**
 * Emit tall (96x256) variants of the preset woka sheets for the wa-tall fork.
 * Same frames, per-cell vertical x2 nearest-neighbor stretch of the stock
 * 96x128 sheets. Static files, because a ?fh query cannot change a CDN PNG.
 *
 *   node scripts/wa/build-tall-sheets.mjs
 */
import { mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const SRC = path.resolve(import.meta.dirname, '../../public/wa/woka/sheets')
const DST = path.resolve(import.meta.dirname, '../../public/wa/woka/sheets-tall')

mkdirSync(DST, { recursive: true })

let count = 0
for (const nation of readdirSync(SRC)) {
  const dir = path.join(SRC, nation)
  try {
    if (!readdirSync(dir)) continue
  } catch {
    continue
  }
  mkdirSync(path.join(DST, nation), { recursive: true })
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.png'))) {
    await sharp(path.join(dir, file))
      .resize(96, 256, { kernel: 'nearest' })
      .png({ compressionLevel: 9 })
      .toFile(path.join(DST, nation, file))
    count++
  }
}
console.log(`wrote ${count} tall sheets to public/wa/woka/sheets-tall/`)
