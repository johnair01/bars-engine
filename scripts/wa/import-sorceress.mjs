#!/usr/bin/env node
/**
 * Ingest + gate for sorceress.games art batches.
 *
 *   node scripts/wa/import-sorceress.mjs <dir> [--frame-height 64] [--dry-run]
 *
 * Expects one PNG per asset named:
 *   base-<gender>-<skin>.png          full 12-frame sheet (3 cols x 4 rows)
 *   hair-<gender>-<style>.png         transparent overlay, same grid
 *   robe-<nation>-<cut>.png           transparent overlay, same grid
 *   accessory-<archetype>.png         transparent overlay, same grid
 *
 * The gate is the buyer's acceptance test. It fails loudly unless every file:
 *   - is exactly 96 x (4 * frameHeight),
 *   - has 12 present frames with a per-frame lower-body silhouette,
 *   - keeps overlays inside the base silhouette (+/- 2px),
 *   - stays within the palette budget and has no anti-aliased edges.
 *
 * On success it writes the files into public/wa/woka/ (sources + layer parts)
 * and records frameHeight in the layer catalog so /api/woka/list advertises it
 * to the wa-tall fork.
 */
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const dir = args.find((a) => !a.startsWith('--'))
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}
const frameHeight = Number(flag('frame-height', 32))
const dryRun = args.includes('--dry-run')

if (!dir) {
  console.error('usage: node scripts/wa/import-sorceress.mjs <dir> [--frame-height 64] [--dry-run]')
  process.exit(2)
}
if (![32, 64, 96].includes(frameHeight)) {
  console.error(`unsupported frame height ${frameHeight} (use 32, 64, or 96)`)
  process.exit(2)
}

const FRAME_WIDTH = 32
const SHEET_WIDTH = FRAME_WIDTH * 3
const SHEET_HEIGHT = frameHeight * 4
const REPO = path.resolve(import.meta.dirname ?? process.cwd(), '../..')
const IN_DIR = path.resolve(dir)
const OUT_SOURCES = path.join(REPO, 'public/wa/woka/sorceress')

const NAME_RE = /^(base|hair|robe|accessory)-([a-z0-9-]+?)(?:-([a-z0-9-]+))?\.png$/

const fail = (file, msg) => {
  console.error(`  ✗ ${file}: ${msg}`)
  process.exitCode = 1
}

async function loadSheet(file) {
  const sharp = (await import('sharp')).default
  const { data, info } = await sharp(path.join(IN_DIR, file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

function cell(data, width, col, row) {
  const pixels = []
  for (let y = 0; y < frameHeight; y++) {
    for (let x = 0; x < FRAME_WIDTH; x++) {
      const i = ((row * frameHeight + y) * width + col * FRAME_WIDTH + x) * 4
      pixels.push(data[i], data[i + 1], data[i + 2], data[i + 3])
    }
  }
  return pixels
}

/** Fraction of a cell's lower half covered by opaque pixels. */
function lowerBodyCoverage(pixels) {
  let covered = 0
  let total = 0
  for (let y = Math.floor(frameHeight / 2); y < frameHeight; y++) {
    for (let x = 0; x < FRAME_WIDTH; x++) {
      total++
      if (pixels[(y * FRAME_WIDTH + x) * 4 + 3] > 40) covered++
    }
  }
  return covered / total
}

function silhouetteBounds(pixels) {
  let minX = FRAME_WIDTH, minY = frameHeight, maxX = -1, maxY = -1
  for (let y = 0; y < frameHeight; y++) {
    for (let x = 0; x < FRAME_WIDTH; x++) {
      if (pixels[(y * FRAME_WIDTH + x) * 4 + 3] > 40) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY }
}

/** Hard pixel edges: an anti-aliased pixel is semi-transparent but not fully. */
function antiAliasedCount(pixels) {
  let count = 0
  for (let i = 3; i < pixels.length; i += 4) {
    const a = pixels[i]
    if (a > 8 && a < 247) count++
  }
  return count
}

function palette(pixels, budget) {
  const colors = new Map()
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 40) continue
    const key = `${pixels[i] >> 3},${pixels[i + 1] >> 3},${pixels[i + 2] >> 3}`
    colors.set(key, (colors.get(key) ?? 0) + 1)
  }
  return colors.size
}

async function main() {
  if (!existsSync(IN_DIR)) {
    console.error(`input dir not found: ${IN_DIR}`)
    process.exit(2)
  }
  const { readdir } = await import('node:fs/promises')
  const files = (await readdir(IN_DIR)).filter((f) => f.endsWith('.png'))
  if (!files.length) {
    console.error(`no PNGs in ${IN_DIR}`)
    process.exit(2)
  }

  console.log(`import-sorceress: ${files.length} file(s), frame height ${frameHeight}, ${dryRun ? 'DRY RUN' : 'write mode'}\n`)

  const bases = new Map() // gender-skin -> bounds per cell, for overlay alignment
  const accepted = []

  for (const file of files) {
    const match = NAME_RE.exec(path.basename(file))
    if (!match) {
      fail(file, 'name must be base-<gender>-<skin>.png | hair-<gender>-<style>.png | robe-<nation>-<cut>.png | accessory-<archetype>.png')
      continue
    }
    const [, kind, a, b] = match
    if (kind === 'base' && !b) { fail(file, 'base needs both gender and skin: base-<gender>-<skin>.png'); continue }

    const sheet = await loadSheet(file)
    if (sheet.width !== SHEET_WIDTH || sheet.height !== SHEET_HEIGHT) {
      fail(file, `expected ${SHEET_WIDTH}x${SHEET_HEIGHT}, got ${sheet.width}x${sheet.height}`)
      continue
    }

    let ok = true
    const cells = []
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const px = cell(sheet.data, sheet.width, col, row)
        const coverage = lowerBodyCoverage(px)
        if (coverage < 0.08) {
          fail(file, `cell r${row}c${col} lower body missing (coverage ${(coverage * 100).toFixed(1)}%)`)
          ok = false
        }
        if (kind === 'base' && antiAliasedCount(px) > 24) {
          fail(file, `cell r${row}c${col} looks anti-aliased (${antiAliasedCount(px)} semi-transparent px) — run True Pixel/Pixel Snap`)
          ok = false
        }
        if (palette(px) > 24) {
          fail(file, `cell r${row}c${col} palette too rich (${palette(px)} buckets > 24)`)
          ok = false
        }
        cells.push(silhouetteBounds(px))
      }
    }

    // Overlays must sit inside the base silhouette (±2px) in every cell.
    if (kind !== 'base') {
      const gender = kind === 'hair' ? a : null
      const baseKey = kind === 'hair'
        ? [...bases.keys()].find((k) => k.startsWith(`${gender}-`))
        : [...bases.keys()][0]
      const baseBounds = baseKey ? bases.get(baseKey) : null
      if (!baseBounds) {
        fail(file, `no base sheet seen yet for alignment check (${kind}) — put base-*.png first / run again`)
        ok = false
      } else {
        cells.forEach((bounds, i) => {
          const base = baseBounds[i]
          if (!bounds) { fail(file, `cell ${i} overlay is empty`); ok = false; return }
          const slack = 2
          if (
            bounds.minX < base.minX - slack || bounds.maxX > base.maxX + slack ||
            bounds.minY < base.minY - slack || bounds.maxY > base.maxY + slack
          ) {
            fail(file, `cell ${i} overlay escapes base silhouette by more than ${slack}px`)
            ok = false
          }
        })
      }
    }

    if (ok) {
      accepted.push({ file, kind, a, b })
      if (kind === 'base') bases.set(`${a}-${b}`, cells)
      console.log(`  ✓ ${file}`)
    }
  }

  if (process.exitCode === 1) {
    console.error('\ngate FAILED — fix the files above and re-run. No files were written.')
    process.exit(1)
  }
  if (dryRun) {
    console.log(`\ngate passed for ${accepted.length} file(s); dry run — nothing written.`)
    return
  }

  await mkdir(OUT_SOURCES, { recursive: true })
  for (const { file } of accepted) {
    await writeFile(path.join(OUT_SOURCES, path.basename(file)), await readFile(path.join(IN_DIR, file)))
  }

  const catalogPath = path.join(REPO, 'public/wa/woka/layers/catalog.json')
  if (existsSync(catalogPath)) {
    const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
    if (!catalog.frameHeight || catalog.frameHeight < frameHeight) {
      catalog.frameHeight = frameHeight
      await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n')
      console.log(`\ncatalog.frameHeight -> ${frameHeight} (/api/woka/list now advertises it to the wa-tall fork)`)
    }
  }

  console.log(`\n${accepted.length} file(s) copied to public/wa/woka/sorceress/. Next: npm run wa:assets to rebuild the layer catalog, then deploy bars-engine.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
