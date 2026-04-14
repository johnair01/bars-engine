/**
 * Validates `humanoid_v1` walkable PNGs under public/sprites/walkable/*.png
 * (top-level only; subdirs like base/nation are out of scope for v1 flat keys).
 *
 * - Sheet: RGBA 512×64, 8×64×64 frames
 * - Sidecar: sibling {basename}.json must parse as humanoidV1WalkableMetadataSchema
 *
 * Usage: npx tsx scripts/validate-walkable-humanoid.ts
 */

import sharp from 'sharp'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { join, extname, basename } from 'path'
import {
  HUMANOID_V1_SHEET,
  humanoidV1WalkableMetadataSchema,
} from '../src/lib/humanoid-v1-walkable'

const WALKABLE_ROOT = join(process.cwd(), 'public/sprites/walkable')

async function main() {
  const failures: string[] = []
  if (!existsSync(WALKABLE_ROOT)) {
    console.error('Missing', WALKABLE_ROOT)
    process.exit(1)
  }

  const pngs = readdirSync(WALKABLE_ROOT).filter(
    f => extname(f).toLowerCase() === '.png' && !f.startsWith('.')
  )

  if (pngs.length === 0) {
    console.error('No PNG files in', WALKABLE_ROOT)
    process.exit(1)
  }

  for (const name of pngs) {
    const pngPath = join(WALKABLE_ROOT, name)
    const jsonPath = join(WALKABLE_ROOT, `${basename(name, '.png')}.json`)

    const meta = await sharp(pngPath).metadata()
    if (meta.width !== HUMANOID_V1_SHEET.width || meta.height !== HUMANOID_V1_SHEET.height) {
      failures.push(
        `${name}: expected sheet ${HUMANOID_V1_SHEET.width}×${HUMANOID_V1_SHEET.height}, got ${meta.width}×${meta.height}`
      )
    }
    if (meta.channels !== 4) {
      failures.push(`${name}: expected RGBA (4 channels), got ${meta.channels ?? 'unknown'}`)
    }

    if (!existsSync(jsonPath)) {
      failures.push(`${name}: missing sidecar ${basename(jsonPath)}`)
      continue
    }

    let raw: unknown
    try {
      raw = JSON.parse(readFileSync(jsonPath, 'utf-8'))
    } catch (e) {
      failures.push(`${basename(jsonPath)}: invalid JSON — ${e}`)
      continue
    }

    const parsed = humanoidV1WalkableMetadataSchema.safeParse(raw)
    if (!parsed.success) {
      failures.push(`${basename(jsonPath)}: ${parsed.error.message}`)
    }
  }

  if (failures.length > 0) {
    console.error('humanoid_v1 walkable validation failed:\n')
    for (const f of failures) console.error('  •', f)
    process.exit(1)
  }

  console.log(`humanoid_v1 walkable: ${pngs.length} sheet(s) + sidecars OK.`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
