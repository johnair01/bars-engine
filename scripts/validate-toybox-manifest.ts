#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

const assetTypeSchema = z.enum([
  'avatar_base',
  'nation_skin',
  'class_skin',
  'walkable',
  'tileset',
  'item_bundle',
  'ui',
  'vfx',
  'audio',
  'portrait',
])

const assetFormatSchema = z.enum(['png', 'json', 'tmx', 'tsx', 'ogg', 'mp3', 'wav'])

const assetStatusSchema = z.enum(['planned', 'ready', 'deprecated'])

const scopeSchema = z.enum(['global', 'nation', 'class', 'zone'])

const nationSchema = z.enum(['argyra', 'lamenth', 'meridia', 'pyrakanth', 'virelune'])

const classSchema = z.enum([
  'bold-heart',
  'danger-walker',
  'decisive-storm',
  'devoted-guardian',
  'joyful-connector',
  'still-point',
  'subtle-influence',
  'truth-seer',
])

const licenseSchema = z.object({
  kind: z.enum(['CC0', 'CC-BY-4.0', 'CC-BY-SA-3.0', 'GPL-3.0', 'MIT', 'Proprietary', 'Unknown']),
  attributionRequired: z.boolean(),
})

const frameSizeSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})

const assetSchema = z.object({
  id: z.string().min(3).regex(/^[a-z0-9.-]+$/),
  type: assetTypeSchema,
  scope: scopeSchema,
  status: assetStatusSchema,
  format: assetFormatSchema,
  path: z.string().min(1).optional(),
  frameSize: frameSizeSchema.optional(),
  frames: z.number().int().positive().optional(),
  nationKey: nationSchema.optional(),
  classKey: classSchema.optional(),
  zoneKey: z.string().min(1).optional(),
  variantOf: z.string().min(3).regex(/^[a-z0-9.-]+$/).optional(),
  license: licenseSchema,
  source: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
})

const manifestSchema = z.object({
  manifestVersion: z.literal('toybox-v0'),
  project: z.string().min(1),
  assets: z.array(assetSchema).min(1),
})

type Manifest = z.infer<typeof manifestSchema>

function loadManifest(manifestPath: string): Manifest {
  const raw = fs.readFileSync(manifestPath, 'utf8')
  const parsed = JSON.parse(raw)
  return manifestSchema.parse(parsed)
}

function extFromPath(filePath: string): string {
  return path.extname(filePath).replace('.', '').toLowerCase()
}

function validateManifest(manifest: Manifest, manifestPath: string): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const root = process.cwd()

  for (const asset of manifest.assets) {
    if (ids.has(asset.id)) errors.push(`duplicate id: ${asset.id}`)
    ids.add(asset.id)

    if (asset.scope === 'nation' && !asset.nationKey) {
      errors.push(`${asset.id}: nation scope requires nationKey`)
    }

    if (asset.scope === 'class' && !asset.classKey) {
      errors.push(`${asset.id}: class scope requires classKey`)
    }

    if (asset.scope === 'zone' && !asset.zoneKey) {
      errors.push(`${asset.id}: zone scope requires zoneKey`)
    }

    if (asset.type === 'walkable') {
      if (!asset.frameSize || asset.frameSize.width !== 64 || asset.frameSize.height !== 64) {
        errors.push(`${asset.id}: walkable assets require frameSize 64x64`)
      }
      if (asset.frames !== 8) {
        errors.push(`${asset.id}: walkable assets require frames=8`)
      }
    }

    if (asset.status === 'ready') {
      if (!asset.path) {
        errors.push(`${asset.id}: ready assets require a path`)
      } else {
        const absolute = path.resolve(root, asset.path)
        if (!fs.existsSync(absolute)) {
          errors.push(`${asset.id}: file not found at ${asset.path}`)
        }
      }
    }

    if (asset.path) {
      const ext = extFromPath(asset.path)
      if (ext !== asset.format) {
        errors.push(`${asset.id}: format=${asset.format} but path extension is .${ext || '(none)'}`)
      }
    }

    if (asset.license.kind === 'Unknown' && asset.status === 'ready') {
      errors.push(`${asset.id}: ready asset cannot use Unknown license`)
    }
  }

  for (const asset of manifest.assets) {
    if (asset.variantOf && !ids.has(asset.variantOf)) {
      errors.push(`${asset.id}: variantOf references missing id "${asset.variantOf}"`)
    }
  }

  if (!manifestPath.endsWith('toybox.manifest.v0.json')) {
    errors.push(`manifest path should end with toybox.manifest.v0.json (got: ${manifestPath})`)
  }

  return errors
}

function main(): number {
  const explicitPath = process.argv[2]
  const manifestPath = explicitPath
    ? path.resolve(process.cwd(), explicitPath)
    : path.resolve(process.cwd(), 'content/assets/toybox.manifest.v0.json')

  let manifest: Manifest
  try {
    manifest = loadManifest(manifestPath)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Toybox manifest schema errors:')
      for (const issue of error.issues) {
        const key = issue.path.join('.')
        console.error(`  - ${key}: ${issue.message}`)
      }
      return 1
    }
    console.error(`Failed to load manifest: ${(error as Error).message}`)
    return 1
  }

  const errors = validateManifest(manifest, manifestPath)
  if (errors.length > 0) {
    console.error('Toybox manifest validation failed:')
    for (const err of errors) console.error(`  - ${err}`)
    return 1
  }

  const counts = manifest.assets.reduce<Record<string, number>>((acc, asset) => {
    acc[asset.type] = (acc[asset.type] ?? 0) + 1
    return acc
  }, {})

  console.log(`Toybox manifest OK: ${manifest.assets.length} assets`)
  for (const [type, count] of Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  - ${type}: ${count}`)
  }
  return 0
}

process.exit(main())
