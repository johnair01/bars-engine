#!/usr/bin/env node
/**
 * Build the WorkAdventure woka catalog from Calrunian walker sheets.
 *
 *   npm run wa:woka
 *
 * A woka texture is 96x128 (3 frames x 4 facings, 32px cells). The source sheets
 * are the two CC0 dojo walkers; each nation x archetype pair is a palette
 * variant of one of them, so the face shelf is coherent with the five nations
 * and eight archetypes bars-engine already uses.
 *
 * These are deliberately provisional: when real layered ARDS walk sheets exist,
 * drop them in `public/wa/woka/sheets/<nation>/<archetype>.png` and re-run this
 * script's catalog step (or edit `catalog.json`) without touching the Admin API.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const WORLD = path.join(ROOT, 'public', 'wa', 'calrunian-dojo', 'sprites')
const OUT = path.join(ROOT, 'public', 'wa', 'woka')
const SHEETS = path.join(OUT, 'sheets')

const NATIONS = [
  'argyra',
  'pyrakanth',
  'lamenth',
  'virelune',
  'meridia',
]

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

/**
 * Nation palette. Only the blue/cyan cloth band is recoloured, so skin, hair
 * and the drawn shading survive; the target hue is the nation's element frame.
 */
const NATION_PALETTE = {
  argyra: { hue: 210, saturation: 0.16 },
  pyrakanth: { hue: 6, saturation: 0.68 },
  lamenth: { hue: 218, saturation: 0.52 },
  virelune: { hue: 118, saturation: 0.46 },
  meridia: { hue: 28, saturation: 0.62 },
}

function rgbToHsl(r, g, b) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return { h: h * 360, s, l }
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360 / 360
  if (s === 0) {
    const value = Math.round(l * 255)
    return [value, value, value]
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const channel = (t) => {
    let value = t
    if (value < 0) value += 1
    if (value > 1) value -= 1
    if (value < 1 / 6) return p + (q - p) * 6 * value
    if (value < 1 / 2) return q
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6
    return p
  }
  return [
    Math.round(channel(hue + 1 / 3) * 255),
    Math.round(channel(hue) * 255),
    Math.round(channel(hue - 1 / 3) * 255),
  ]
}

function recolourCloth(data, palette, archetypeIndex) {
  const targetHue = palette.hue + ((archetypeIndex % 3) - 1) * 6
  const targetSaturation = Math.min(
    0.9,
    Math.max(0.08, palette.saturation * (0.9 + (archetypeIndex % 4) * 0.06)),
  )
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2])
    // Shift the character's colour, not its shading: grey/black line work
    // and transparent pixels stay put, so the silhouette and darks survive.
    if (s < 0.2) continue
    const [r, g, b] = hslToRgb(targetHue, targetSaturation, l)
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
}

const SOURCES = ['monk-woka.png', 'yun-woka.png']

function titleCase(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function pngSize(buffer) {
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('not a PNG')
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

async function generateSheet(nation, archetype, index) {
  const source = SOURCES[index % SOURCES.length]
  const input = await sharp(path.join(WORLD, source)).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  })
  recolourCloth(input.data, NATION_PALETTE[nation], index)

  const output = await sharp(input.data, {
    raw: { width: input.info.width, height: input.info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer()

  const size = pngSize(output)
  if (size.width !== 96 || size.height !== 128) {
    throw new Error(`${nation}/${archetype}: expected 96x128, got ${size.width}x${size.height}`)
  }

  const dir = path.join(SHEETS, nation)
  fs.mkdirSync(dir, { recursive: true })
  const target = path.join(dir, `${archetype}.png`)
  fs.writeFileSync(target, output)
  return { source, target }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  const textures = []
  let index = 0
  for (const nation of NATIONS) {
    for (const archetype of ARCHETYPES) {
      await generateSheet(nation, archetype, index)
      textures.push({
        id: `wa:${nation}:${archetype}`,
        name: `${titleCase(nation)} · ${titleCase(archetype)}`,
        path: `/wa/woka/sheets/${nation}/${archetype}.png`,
        nationKey: nation,
        archetypeKey: archetype,
        genderKey: 'default',
        provisional: true,
      })
      index += 1
    }
  }

  const catalog = {
    version: 1,
    collection: 'Calrunia',
    about:
      'Provisional palette variants of the CC0 dojo walkers, one per nation x archetype. ' +
      'Replace a sheet in public/wa/woka/sheets and re-run the catalog validation when real ARDS walkers land.',
    source: 'public/wa/calrunian-dojo/sprites/{monk,yun}-woka.png',
    license: 'CC0',
    textures,
  }

  fs.writeFileSync(path.join(OUT, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`)
  fs.copyFileSync(
    path.join(ROOT, 'public', 'wa', 'calrunian-dojo', 'src16', 'LICENSE-CC0.txt'),
    path.join(OUT, 'LICENSE-CC0.txt'),
  )
  console.log(`wa:woka wrote ${textures.length} sheets and catalog.json`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
