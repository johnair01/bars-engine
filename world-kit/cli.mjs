#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { load } from 'js-yaml'

export async function validate(directory) {
  const findings = []
  const add = (id, file, message) => findings.push({ id, kind: 'error', file, message })
  for (const file of ['world.yaml', 'conditions.yaml', 'obstacles.yaml', 'npcs.yaml', 'world.md']) {
    let content
    try { content = await readFile(join(directory, file), 'utf8') } catch (error) {
      add('missing-file', file, `Cannot read ${file}: ${error.code || error.message}`)
      continue
    }
    if (!content.trim()) {
      add('empty-file', file, `${file} is empty`)
      continue
    }
    if (file.endsWith('.yaml')) {
      try { load(content) } catch (error) { add('invalid-yaml', file, error.message) }
    }
  }
  try {
    if (!(await stat(join(directory, 'portraits'))).isDirectory()) add('missing-directory', 'portraits/', 'portraits must be a directory')
  } catch { add('missing-directory', 'portraits/', 'portraits directory is missing') }
  return { valid: findings.length === 0, findings }
}

const KIT_FILES = ['world.yaml', 'world.md', 'conditions.yaml', 'obstacles.yaml', 'npcs.yaml']

export async function readKit(directory) {
  const files = {}
  for (const file of KIT_FILES) {
    try { files[file] = await readFile(join(directory, file), 'utf8') } catch { /* the engine reports it */ }
  }
  let portraits
  try {
    portraits = []
    for (const name of (await readdir(join(directory, 'portraits'))).sort()) {
      portraits.push({ name, base64: (await readFile(join(directory, 'portraits', name))).toString('base64') })
    }
  } catch { /* the engine reports a missing portraits/ */ }
  return { files, portraits }
}

/** Send the kit through the engine's gate. The token comes from WORLD_KIT_TOKEN, never from the kit folder. */
export async function publish(directory, { engine, token, dryRun = false, fetchImpl = fetch }) {
  const url = new URL('/api/world-kit/publish', engine)
  if (dryRun) url.searchParams.set('dryRun', '1')
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(await readKit(directory)),
  })
  const text = await response.text()
  let body
  try { body = JSON.parse(text) } catch { body = { error: text.slice(0, 200) } }
  return { status: response.status, body }
}

export async function main(args, env = process.env) {
  const [command, directory, ...options] = args
  const flags = { json: false, dry: false, engine: env.WORLD_KIT_ENGINE || 'http://localhost:3000' }
  for (let i = 0; i < options.length; i++) {
    if (options[i] === '--json') flags.json = true
    else if (options[i] === '--dry') flags.dry = true
    else if (options[i] === '--engine' && options[i + 1]) flags.engine = options[++i]
    else { command && console.error(`Unknown option ${options[i]}`); return 2 }
  }
  if (!['validate', 'publish'].includes(command) || !directory || (command === 'validate' && (flags.dry || args.includes('--engine')))) {
    console.error('Usage: world-kit validate <kit-directory> [--json]\n       world-kit publish <kit-directory> [--engine <url>] [--dry] [--json]   (token in WORLD_KIT_TOKEN)')
    return 2
  }
  if (command === 'validate') {
    const result = await validate(directory)
    if (flags.json) console.log(JSON.stringify(result))
    else if (result.valid) console.log('Kit files pass offline checks.')
    else for (const finding of result.findings) console.error(`${finding.id} ${finding.kind} ${finding.file}: ${finding.message}`)
    return result.valid ? 0 : 1
  }
  if (!env.WORLD_KIT_TOKEN) { console.error('Set WORLD_KIT_TOKEN to your engine API token. It never goes in the kit folder.'); return 2 }
  let result
  try { result = await publish(directory, { engine: flags.engine, token: env.WORLD_KIT_TOKEN, dryRun: flags.dry }) } catch (error) {
    console.error(`Cannot reach ${flags.engine}: ${error.cause?.code || error.message}`); return 3
  }
  const { status, body } = result
  if (flags.json) console.log(JSON.stringify(body))
  else {
    for (const f of body.findings || []) (f.kind === 'error' ? console.error : console.warn)(`${f.id} ${f.kind} ${f.file}: ${f.message}`)
    if (body.error) console.error(`Engine refused: ${status} ${body.error}`)
    else if (body.outcome === 'checked') console.log('Engine gate: kit passes (dry run, nothing stored).')
    else if (body.ok) console.log(`Published ${body.kit.kitId} v${body.kit.version}: ${body.outcome}. Visible to its author only.`)
    else console.error('Engine gate rejected the kit. Nothing was published.')
  }
  return status >= 200 && status < 300 && body.ok ? 0 : 1
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) process.exitCode = await main(process.argv.slice(2))
