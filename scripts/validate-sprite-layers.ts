/**
 * validate-sprite-layers.ts
 *
 * Validates all PNG files in public/sprites/parts/ and public/sprites/walkable/
 * against the production rules from seed-bar-lobby-world.yaml LW-9 and
 * the Asset Register Design System spec.
 *
 * Rules:
 *   Portrait layers (public/sprites/parts/):  RGBA, 64×64px
 *   Walkable sheets (public/sprites/walkable/base/):      RGBA, 512×64px
 *   Walkable sheets (public/sprites/walkable/nation/):    RGBA, 512×64px
 *   Walkable sheets (public/sprites/walkable/archetype/): RGBA, 512×64px
 *   Sigil marks (public/sprites/sigils/):                 RGBA, 24×24px (nation) or 16×16px (archetype)
 *
 * Usage:
 *   npx tsx scripts/validate-sprite-layers.ts
 *   npx tsx scripts/validate-sprite-layers.ts --fix-alpha  (future: auto-fix RGB → RGBA)
 *
 * Exit code 0 = all pass. Exit code 1 = one or more failures.
 */

import sharp from 'sharp'
import { readdirSync, existsSync } from 'fs'
import { join, extname, relative } from 'path'

interface ValidationRule {
  dir: string
  width: number
  height: number
  channels: 4  // always RGBA
  label: string
}

const RULES: ValidationRule[] = [
  { dir: 'public/sprites/parts/base',             width: 64,  height: 64, channels: 4, label: 'portrait base' },
  { dir: 'public/sprites/parts/nation_body',      width: 64,  height: 64, channels: 4, label: 'portrait nation_body' },
  { dir: 'public/sprites/parts/nation_accent',    width: 64,  height: 64, channels: 4, label: 'portrait nation_accent' },
  { dir: 'public/sprites/parts/playbook_outfit',  width: 64,  height: 64, channels: 4, label: 'portrait archetype_outfit' },
  { dir: 'public/sprites/parts/playbook_accent',  width: 64,  height: 64, channels: 4, label: 'portrait archetype_accent' },
  // Walkable sheets — not yet generated, skipped if directory doesn't exist
  { dir: 'public/sprites/walkable/base',          width: 512, height: 64, channels: 4, label: 'walkable base sheet' },
  { dir: 'public/sprites/walkable/nation',        width: 512, height: 64, channels: 4, label: 'walkable nation sheet' },
  { dir: 'public/sprites/walkable/archetype',     width: 512, height: 64, channels: 4, label: 'walkable archetype sheet' },
  // Sigil marks — not yet generated, skipped if directory doesn't exist
  { dir: 'public/sprites/sigils/nation',          width: 24,  height: 24, channels: 4, label: 'nation sigil' },
  { dir: 'public/sprites/sigils/archetype',       width: 16,  height: 16, channels: 4, label: 'archetype mark' },
]

interface Failure {
  file: string
  expected: string
  actual: string
}

async function validateFile(filePath: string, rule: ValidationRule): Promise<Failure | null> {
  const meta = await sharp(filePath).metadata()
  const issues: string[] = []

  if (meta.channels !== rule.channels) {
    issues.push(`channels: expected ${rule.channels} (RGBA), got ${meta.channels} ${meta.channels === 3 ? '(RGB — no alpha!)' : ''}`)
  }
  if (meta.width !== rule.width || meta.height !== rule.height) {
    issues.push(`size: expected ${rule.width}×${rule.height}, got ${meta.width}×${meta.height}`)
  }

  if (issues.length === 0) return null
  return {
    file: relative(process.cwd(), filePath),
    expected: `${rule.label}: RGBA ${rule.width}×${rule.height}`,
    actual: issues.join('; '),
  }
}

async function main() {
  const failures: Failure[] = []
  let checked = 0
  let skipped = 0

  for (const rule of RULES) {
    if (!existsSync(rule.dir)) {
      console.log(`  skip  ${rule.dir}/ (not yet generated)`)
      skipped++
      continue
    }

    const files = readdirSync(rule.dir)
      .filter(f => extname(f).toLowerCase() === '.png')
      .map(f => join(rule.dir, f))

    if (files.length === 0) {
      console.log(`  skip  ${rule.dir}/ (no PNG files)`)
      skipped++
      continue
    }

    for (const file of files) {
      const failure = await validateFile(file, rule)
      if (failure) {
        failures.push(failure)
        console.error(`  FAIL  ${failure.file}`)
        console.error(`        expected: ${failure.expected}`)
        console.error(`        actual:   ${failure.actual}`)
      } else {
        checked++
      }
    }
  }

  console.log()
  console.log(`Checked ${checked} file(s), skipped ${skipped} director${skipped === 1 ? 'y' : 'ies'}, ${failures.length} failure(s).`)

  if (failures.length > 0) {
    console.error()
    console.error('Fix: re-export failing files as RGBA PNG with transparent background.')
    console.error('     All channels must be equal to 4 (RGBA). No solid backgrounds.')
    process.exit(1)
  }

  console.log('All sprite layer files pass validation.')
}

main().catch(err => {
  console.error('validate-sprite-layers error:', err)
  process.exit(1)
})
