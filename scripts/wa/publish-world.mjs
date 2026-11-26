#!/usr/bin/env node
/**
 * Publish a world folder to the WorkAdventure map-storage on the box.
 *
 *   npm run wa:publish -- public/wa/calrunian-dojo
 *   npm run wa:publish -- public/wa/heaven-sect --dir heaven-sect
 *   npm run wa:publish -- public/wa/calrunian-dojo --dry-run
 *
 * The local asset contract runs first. The map-storage upload then runs
 * WorkAdventure's own MapValidator, so a world that reaches the live volume has
 * passed both the art rules and the client's map rules. Publishing replaces the
 * named directory in full; it is not a merge.
 *
 * Credentials:
 *   WA_MAP_STORAGE_TOKEN   the box's MAP_STORAGE_AUTHENTICATION_TOKEN
 *   WA_MAP_STORAGE_URL     default https://world.masteringallyship.com/map-storage
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import archiver from 'archiver'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const DEFAULT_URL = 'https://world.masteringallyship.com/map-storage'

function usage() {
  console.log(`usage: wa:publish -- <world-dir> [--dir <remote-dir>] [--dry-run] [--skip-assets]

  <world-dir>      a folder containing a .tmj or .wam and its tiles
  --dir            remote folder under map-storage (default: basename of world-dir)
  --dry-run        validate and build the archive, do not upload
  --skip-assets    skip the local Python asset contract (map-storage still validates)

env:
  WA_MAP_STORAGE_TOKEN   required to upload
  WA_MAP_STORAGE_URL     default ${DEFAULT_URL}`)
}

function parseArgs(argv) {
  const options = { worldDir: null, remoteDir: null, dryRun: false, skipAssets: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dir') {
      options.remoteDir = argv[++i]
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--skip-assets') {
      options.skipAssets = true
    } else if (arg === '--help' || arg === '-h') {
      usage()
      process.exit(0)
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown option: ${arg}`)
    } else if (!options.worldDir) {
      options.worldDir = arg
    } else {
      throw new Error(`unexpected argument: ${arg}`)
    }
  }
  if (!options.worldDir) throw new Error('a world folder is required')
  return options
}

function findMapFile(worldDir) {
  const entries = fs.readdirSync(worldDir).filter((name) => !name.startsWith('._') && !name.startsWith('.'))
  const maps = entries.filter((name) => name.endsWith('.tmj') || name.endsWith('.wam')).sort()
  if (maps.length === 0) throw new Error(`no .tmj or .wam in ${worldDir}`)
  return maps[0]
}

function verifyAssets(worldDir) {
  const script = path.join(ROOT, 'public', 'wa', 'check_assets.py')
  if (!fs.existsSync(script)) return
  const probe = spawnSync('python3', ['--version'], { encoding: 'utf8' })
  if (probe.error || probe.status !== 0) {
    console.warn('asset contract: python3 is not available, skipping the local check')
    return
  }
  const result = spawnSync('python3', [script, worldDir], { cwd: ROOT, encoding: 'utf8' })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.status !== 0) {
    throw new Error('the local asset contract refused this world; nothing was uploaded')
  }
}

async function zipWorld(worldDir) {
  return await new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks = []
    archive.on('data', (chunk) => chunks.push(chunk))
    archive.on('warning', (error) => {
      if (error.code !== 'ENOENT') reject(error)
    })
    archive.on('error', reject)
    archive.on('end', () => resolve(Buffer.concat(chunks)))

    archive.directory(worldDir, false, (entry) => {
      const name = path.basename(entry.name)
      if (name.startsWith('._') || name === '.DS_Store') return false
      return entry
    })
    archive.finalize().catch(reject)
  })
}

function requireUploadSettings() {
  const token = process.env.WA_MAP_STORAGE_TOKEN || process.env.MAP_STORAGE_AUTHENTICATION_TOKEN
  if (!token) {
    throw new Error(
      'WA_MAP_STORAGE_TOKEN is not set. Read it from the box .env (MAP_STORAGE_AUTHENTICATION_TOKEN), or use --dry-run.',
    )
  }
  const baseUrl = (process.env.WA_MAP_STORAGE_URL || DEFAULT_URL).replace(/\/+$/, '')
  return { token, uploadUrl: `${baseUrl}/upload` }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const worldDir = path.resolve(process.cwd(), options.worldDir)
  if (!fs.existsSync(worldDir) || !fs.statSync(worldDir).isDirectory()) {
    throw new Error(`not a directory: ${worldDir}`)
  }

  const mapFile = findMapFile(worldDir)
  const remoteDir = options.remoteDir || path.basename(worldDir)
  if (remoteDir.includes('..') || remoteDir.startsWith('/')) {
    throw new Error(`remote directory must be a relative path: ${remoteDir}`)
  }

  console.log(`world:  ${path.relative(process.cwd(), worldDir) || worldDir}`)
  console.log(`map:    ${mapFile}`)
  console.log(`remote: ${remoteDir}/`)

  if (!options.skipAssets) verifyAssets(worldDir)

  const archive = await zipWorld(worldDir)
  console.log(`archive: ${(archive.length / 1024).toFixed(1)} KiB`)

  if (options.dryRun) {
    console.log('dry run: nothing uploaded')
    return
  }

  const { token, uploadUrl } = requireUploadSettings()
  const form = new FormData()
  form.append('file', new Blob([archive], { type: 'application/zip' }), `${remoteDir}.zip`)
  form.append('directory', remoteDir)

  console.log(`uploading to ${uploadUrl} …`)
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  const text = await response.text()
  if (!response.ok) {
    console.error(`upload failed: HTTP ${response.status}`)
    try {
      console.error(JSON.stringify(JSON.parse(text), null, 2))
    } catch {
      console.error(text)
    }
    process.exit(1)
  }

  console.log(`published ${remoteDir}/`)
  if (text.trim()) console.log(text.trim())
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
