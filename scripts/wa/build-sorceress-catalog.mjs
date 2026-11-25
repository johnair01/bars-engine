#!/usr/bin/env node
/**
 * Fold the sorceress-generated layers into the WOKA layer catalog.
 *
 *   npm run wa:sorceress-catalog
 *
 * - recolors the gray topknot master into the four hair colors (in code —
 *   one master, N colors, per the sprite plan)
 * - appends the pilot layers as catalog entries under /wa/woka/sorceress/
 * - repoints the provisional Bold Heart sash at the generated art (same id,
 *   so saved player selections keep resolving)
 * - stamps catalog.frameHeight (the generated sheets are 96x256, fh=64)
 *
 * Idempotent: entries with a /sorceress/ path are removed before re-adding.
 * Run AFTER `npm run wa:assets` (which regenerates the catalog from the
 * monk walker and would otherwise wipe these entries).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SORC = path.join(ROOT, 'public', 'wa', 'woka', 'sorceress')
const CATALOG = path.join(ROOT, 'public', 'wa', 'woka', 'layers', 'catalog.json')

const HAIR_COLORS = [
  ['black', 'Topknot · Black', '151318'],
  ['brown', 'Topknot · Brown', '6b4a2f'],
  ['auburn', 'Topknot · Auburn', '8a4a2a'],
  ['silver', 'Topknot · Silver', 'c9ccd4'],
]

async function recolorMaster(src, out, hex) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const R = parseInt(hex.slice(0, 2), 16), G = parseInt(hex.slice(2, 4), 16), B = parseInt(hex.slice(4, 6), 16)
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    data[i] = R; data[i + 1] = G; data[i + 2] = B; data[i + 3] = 255
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ palette: true, colors: 4, dither: 0 })
    .toFile(out)
}

async function main() {
  const master = path.join(SORC, 'hair-masculine-topknot.png')
  if (!fs.existsSync(master)) {
    console.error(`hair master missing at ${master} — run wa:import-sorceress first`)
    process.exit(1)
  }
  for (const [slug, , hex] of HAIR_COLORS) {
    await recolorMaster(master, path.join(SORC, `hair-topknot-${slug}.png`), hex)
  }
  console.log(`wrote ${HAIR_COLORS.length} recolored hair sheets`)

  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'))

  // drop previous sorceress entries (idempotent re-runs)
  for (const part of Object.keys(catalog.parts)) {
    catalog.parts[part] = catalog.parts[part].filter((it) => !String(it.path).includes('/sorceress/'))
  }

  const entry = (id, name, part, file, extra = {}) => ({
    id, name, path: `/wa/woka/sorceress/${file}`, part, ...extra,
  })

  const additions = [
    entry('wa:body:masculine-tan', 'Tan · Sorceress', 'body', 'base-masculine-tan.png', { tone: 'tan' }),
    ...HAIR_COLORS.map(([slug, name]) =>
      entry(`wa:hair:topknot-${slug}`, name, 'hair', `hair-topknot-${slug}.png`)),
    entry('wa:clothes:argyra:ceremonial', 'Argyra · Ceremonial Robe', 'clothes', 'robe-argyra-ceremonial.png', { nationKey: 'argyra' }),
    entry('wa:accessory:bold-heart-sorceress', 'Bold Heart Sash (pilot art)', 'accessory', 'accessory-bold-heart.png', { archetypeKey: 'bold-heart' }),
  ]

  for (const it of additions) {
    catalog.parts[it.part].push(it)
  }

  catalog.frameHeight = 64

  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n')
  const counts = Object.entries(catalog.parts).map(([k, v]) => `${k}=${v.length}`).join(' ')
  console.log(`catalog updated: ${counts}, frameHeight=${catalog.frameHeight}`)
  console.log('accessory note: the original wa:accessory:bold-heart (monk-partition sash) stays; the pilot art is its own entry until sign-off.')
}

main().catch((e) => { console.error(e); process.exit(1) })
