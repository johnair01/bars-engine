#!/usr/bin/env node
/**
 * Build the six WorkAdventure layer parts from the canonical dojo walker.
 *
 *   npm run wa:layers
 *
 * WA's native customizer expects body / eyes / hair / clothes / hat / accessory
 * as separate 96x128 sheets (3 frames x 4 facings, 32px cells). The canonical
 * monk walker already contains those regions as flat colours, so this script
 * partitions each pixel into exactly one layer, then recolours the layers that
 * carry nation / archetype meaning.
 *
 * Output:
 *   public/wa/woka/layers/<part>/<slug>.png
 *   public/wa/woka/layers/catalog.json
 *
 * The art is provisional: replace a layer PNG and re-run `npm run wa:layers`
 * (or edit the catalog) without changing the Admin API.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SOURCE = path.join(ROOT, 'public', 'wa', 'calrunian-dojo', 'sprites', 'monk-woka.png')
const OUT = path.join(ROOT, 'public', 'wa', 'woka', 'layers')

const WIDTH = 96
const HEIGHT = 128

const NATIONS = ['argyra', 'pyrakanth', 'lamenth', 'virelune', 'meridia']
const ARCHETYPES = [
  'bold-heart',
  'danger-walker',
  'decisive-storm',
  'devoted-guardian',
  'joyful-connector',
  'still-point',
  'subtle-influence',
  'truth-seer',
]

/** The flat colours in monk-woka.png, partitioned into exactly six layers. */
const SOURCE_COLOURS = {
  outline: [20, 27, 27],
  skin: [239, 145, 79],
  skinShade: [209, 75, 52],
  eyes: [227, 241, 245],
  hair: [59, 54, 67],
  robe: [78, 72, 74],
  trim: [52, 90, 82],
  headband: [86, 134, 76],
  sash: [211, 162, 192],
}

const LAYER_ORDER = ['body', 'eyes', 'hair', 'clothes', 'hat', 'accessory']

const LAYER_COLOURS = {
  body: ['outline', 'skin', 'skinShade'],
  eyes: ['eyes'],
  hair: ['hair'],
  clothes: ['robe', 'trim'],
  hat: ['headband'],
  accessory: ['sash'],
}

const BODY_TONES = [
  { slug: 'warm', name: 'Warm', skin: [239, 145, 79], shade: [209, 75, 52] },
  { slug: 'light', name: 'Light', skin: [246, 198, 153], shade: [201, 138, 99] },
  { slug: 'deep', name: 'Deep', skin: [138, 75, 47], shade: [94, 47, 31] },
  { slug: 'olive', name: 'Olive', skin: [201, 154, 91], shade: [143, 100, 54] },
]

const EYE_COLOURS = [
  { slug: 'ink', name: 'Ink', colour: [227, 241, 245] },
  { slug: 'amber', name: 'Amber', colour: [232, 170, 60] },
  { slug: 'green', name: 'Green', colour: [110, 190, 140] },
  { slug: 'violet', name: 'Violet', colour: [190, 130, 220] },
]

const HAIR_COLOURS = [
  { slug: 'black', name: 'Black', colour: [59, 54, 67] },
  { slug: 'brown', name: 'Brown', colour: [96, 58, 40] },
  { slug: 'auburn', name: 'Auburn', colour: [132, 54, 38] },
  { slug: 'silver', name: 'Silver', colour: [196, 196, 204] },
]

const NATION_PALETTE = {
  argyra: { primary: [142, 154, 171], secondary: [75, 100, 140] },
  pyrakanth: { primary: [196, 30, 58], secondary: [120, 20, 30] },
  lamenth: { primary: [70, 80, 150], secondary: [35, 40, 90] },
  virelune: { primary: [70, 140, 80], secondary: [35, 90, 55] },
  meridia: { primary: [210, 160, 50], secondary: [140, 95, 25] },
}

const ARCHETYPE_ACCENT = {
  'bold-heart': [196, 30, 58],
  'danger-walker': [230, 120, 40],
  'decisive-storm': [80, 120, 200],
  'devoted-guardian': [90, 150, 110],
  'joyful-connector': [230, 170, 40],
  'still-point': [120, 140, 160],
  'subtle-influence': [150, 90, 170],
  'truth-seer': [230, 220, 180],
}

function titleCase(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function colourKey(r, g, b) {
  return `${r},${g},${b}`
}

const sourceByKey = new Map(
  Object.entries(SOURCE_COLOURS).map(([name, [r, g, b]]) => [colourKey(r, g, b), name]),
)

/**
 * Create one 96x128 RGBA sheet by selecting the source pixels that belong to
 * this layer and replacing the named source colours with a target colour.
 */
function layerSheet(source, layer, replacements = {}) {
  const out = Buffer.alloc(WIDTH * HEIGHT * 4)
  const allowed = new Set(LAYER_COLOURS[layer])
  for (let i = 0; i < source.length; i += 4) {
    if (source[i + 3] === 0) continue
    const name = sourceByKey.get(colourKey(source[i], source[i + 1], source[i + 2]))
    if (!name || !allowed.has(name)) continue
    const replacement = replacements[name]
    const [r, g, b] = replacement ?? [source[i], source[i + 1], source[i + 2]]
    out[i] = r
    out[i + 1] = g
    out[i + 2] = b
    out[i + 3] = source[i + 3]
  }
  return out
}

async function writeSheet(part, slug, data) {
  const dir = path.join(OUT, part)
  fs.mkdirSync(dir, { recursive: true })
  const target = path.join(dir, `${slug}.png`)
  await sharp(data, { raw: { width: WIDTH, height: HEIGHT, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(target)
  return `/wa/woka/layers/${part}/${slug}.png`
}

async function main() {
  const { data: source } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  if (source.length !== WIDTH * HEIGHT * 4) {
    throw new Error(`expected ${WIDTH}x${HEIGHT} source, got ${source.length / 4} pixels`)
  }

  fs.rmSync(OUT, { recursive: true, force: true })
  fs.mkdirSync(OUT, { recursive: true })

  const parts = {
    body: [],
    eyes: [],
    hair: [],
    clothes: [],
    hat: [],
    accessory: [],
  }

  // Body tones. The outline stays on every body so hair/clothes sit inside it.
  for (const tone of BODY_TONES) {
    const pathname = await writeSheet(
      'body',
      tone.slug,
      layerSheet(source, 'body', {
        skin: tone.skin,
        skinShade: tone.shade,
      }),
    )
    parts.body.push({
      id: `wa:body:${tone.slug}`,
      name: tone.name,
      path: pathname,
      part: 'body',
      tone: tone.slug,
    })
  }

  // Eyes + hair. `none` is last so WA's customizer starts with a visible choice.
  for (const eye of EYE_COLOURS) {
    const pathname = await writeSheet('eyes', eye.slug, layerSheet(source, 'eyes', { eyes: eye.colour }))
    parts.eyes.push({ id: `wa:eyes:${eye.slug}`, name: eye.name, path: pathname, part: 'eyes' })
  }
  parts.eyes.push({
    id: 'wa:eyes:none',
    name: 'None',
    path: await writeSheet('eyes', 'none', Buffer.alloc(WIDTH * HEIGHT * 4)),
    part: 'eyes',
  })

  for (const hair of HAIR_COLOURS) {
    const pathname = await writeSheet('hair', hair.slug, layerSheet(source, 'hair', { hair: hair.colour }))
    parts.hair.push({ id: `wa:hair:${hair.slug}`, name: hair.name, path: pathname, part: 'hair' })
  }
  parts.hair.push({
    id: 'wa:hair:none',
    name: 'None',
    path: await writeSheet('hair', 'none', Buffer.alloc(WIDTH * HEIGHT * 4)),
    part: 'hair',
  })

  // Clothes carry the nation x archetype pair: robe = nation, trim = secondary,
  // sash = archetype accent. The sash lives in `accessory`, not `clothes`.
  for (const nation of NATIONS) {
    const palette = NATION_PALETTE[nation]
    for (const archetype of ARCHETYPES) {
      const slug = `${nation}-${archetype}`
      const pathname = await writeSheet(
        'clothes',
        slug,
        layerSheet(source, 'clothes', {
          robe: palette.primary,
          trim: palette.secondary,
        }),
      )
      parts.clothes.push({
        id: `wa:clothes:${nation}:${archetype}`,
        name: `${titleCase(nation)} · ${titleCase(archetype)}`,
        path: pathname,
        part: 'clothes',
        nationKey: nation,
        archetypeKey: archetype,
      })
    }
  }

  // Hat = the headband, seeded by nation.
  for (const nation of NATIONS) {
    const palette = NATION_PALETTE[nation]
    const pathname = await writeSheet('hat', nation, layerSheet(source, 'hat', { headband: palette.primary }))
    parts.hat.push({
      id: `wa:hat:${nation}`,
      name: `${titleCase(nation)} Band`,
      path: pathname,
      part: 'hat',
      nationKey: nation,
    })
  }
  parts.hat.push({
    id: 'wa:hat:none',
    name: 'None',
    path: await writeSheet('hat', 'none', Buffer.alloc(WIDTH * HEIGHT * 4)),
    part: 'hat',
  })

  // Accessory = the sash, seeded by archetype.
  for (const archetype of ARCHETYPES) {
    const pathname = await writeSheet(
      'accessory',
      archetype,
      layerSheet(source, 'accessory', { sash: ARCHETYPE_ACCENT[archetype] }),
    )
    parts.accessory.push({
      id: `wa:accessory:${archetype}`,
      name: `${titleCase(archetype)} Sash`,
      path: pathname,
      part: 'accessory',
      archetypeKey: archetype,
    })
  }
  parts.accessory.push({
    id: 'wa:accessory:none',
    name: 'None',
    path: await writeSheet('accessory', 'none', Buffer.alloc(WIDTH * HEIGHT * 4)),
    part: 'accessory',
  })

  const catalog = {
    version: 1,
    collection: 'Calrunia',
    about:
      'Six WorkAdventure layer parts extracted from the CC0 dojo walker. Nation colours the robe/trim/hat; archetype colours the sash. Replace a layer PNG and re-run wa:layers.',
    source: 'public/wa/calrunian-dojo/sprites/monk-woka.png',
    license: 'CC0',
    order: LAYER_ORDER,
    parts,
  }
  fs.writeFileSync(path.join(OUT, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`)
  fs.copyFileSync(
    path.join(ROOT, 'public', 'wa', 'calrunian-dojo', 'src16', 'LICENSE-CC0.txt'),
    path.join(OUT, 'LICENSE-CC0.txt'),
  )

  console.log(
    `wa:layers wrote ${Object.values(parts).reduce((n, list) => n + list.length, 0)} sheets across ${LAYER_ORDER.length} parts`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
