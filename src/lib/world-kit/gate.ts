/**
 * The world-kit gate: the engine's one rule set for a locally authored kit.
 * `world-kit validate` runs a copy offline; the engine's answer is the truth (spec wa-world-kit, rulings 2026-11-23/24).
 *
 * A kit is six paths: world.yaml, world.md, conditions.yaml, obstacles.yaml, npcs.yaml and portraits/.
 * Findings carry a stable id (the rule), a kind (error refuses, warning passes) and the file to open.
 */
import yaml from 'js-yaml'

export const KIT_FILES = ['world.yaml', 'world.md', 'conditions.yaml', 'obstacles.yaml', 'npcs.yaml'] as const
export const MAX_PORTRAITS = 24
export const MAX_PORTRAIT_BYTES = 512 * 1024
export const MAX_FILE_BYTES = 256 * 1024
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47]

export type KitPortrait = { name: string; base64: string }
export type KitInput = { files?: Record<string, unknown>; portraits?: unknown }
export type Finding = { id: string; kind: 'error' | 'warning'; file: string; message: string }
export type KitIdentity = { kitId: string; name: string; version: string }
export type GateResult = {
  verdict: 'accepted' | 'accepted_with_warnings' | 'rejected'
  findings: Finding[]
  identity: KitIdentity | null
}

const SLUG = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/

export function runGate(input: KitInput): GateResult {
  const findings: Finding[] = []
  const add = (id: string, kind: Finding['kind'], file: string, message: string) => findings.push({ id, kind, file, message })
  const files = input.files && typeof input.files === 'object' ? input.files : {}
  const parsed: Record<string, unknown> = {}

  for (const file of KIT_FILES) {
    const body = files[file]
    if (body === undefined) { add('missing-file', 'error', file, `${file} is required`); continue }
    if (typeof body !== 'string') { add('invalid-file', 'error', file, `${file} must be text`); continue }
    if (!body.trim()) { add('empty-file', 'error', file, `${file} is empty`); continue }
    if (Buffer.byteLength(body) > MAX_FILE_BYTES) { add('file-too-large', 'error', file, `${file} is over ${MAX_FILE_BYTES / 1024} KB`); continue }
    if (file.endsWith('.yaml')) {
      try { parsed[file] = yaml.load(body) } catch (e) { add('invalid-yaml', 'error', file, (e as Error).message.split('\n')[0]) }
    }
  }
  for (const key of Object.keys(files)) {
    if (!(KIT_FILES as readonly string[]).includes(key)) add('unknown-file', 'warning', key, `${key} is not part of a kit and is ignored`)
  }

  let identity: KitIdentity | null = null
  if ('world.yaml' in parsed) {
    const w = parsed['world.yaml']
    if (!w || typeof w !== 'object' || Array.isArray(w)) {
      add('world-not-a-map', 'error', 'world.yaml', 'world.yaml must be a map with id, name and version')
    } else {
      const m = w as Record<string, unknown>
      const id = typeof m.id === 'string' ? m.id : ''
      const name = typeof m.name === 'string' ? m.name.trim() : ''
      const version = m.version === undefined ? '' : String(m.version).trim()
      if (!id) add('missing-kit-id', 'error', 'world.yaml', 'world.yaml needs a stable id (lowercase letters, digits and hyphens)')
      else if (!SLUG.test(id)) add('bad-kit-id', 'error', 'world.yaml', `id "${id}" must be 3-64 lowercase letters, digits or hyphens`)
      if (!name) add('missing-name', 'error', 'world.yaml', 'world.yaml needs a name')
      if (!version) add('missing-version', 'error', 'world.yaml', 'world.yaml needs a version')
      if (id && SLUG.test(id) && name && version) identity = { kitId: id, name, version }
    }
  }
  for (const file of ['conditions.yaml', 'obstacles.yaml', 'npcs.yaml'] as const) {
    if (file in parsed && (parsed[file] === null || typeof parsed[file] !== 'object')) {
      add('wrong-shape', 'error', file, `${file} must be a list or a map`)
    }
  }

  const rawPortraits = input.portraits
  if (rawPortraits === undefined) add('missing-directory', 'error', 'portraits/', 'portraits/ is required, even when empty')
  else if (!Array.isArray(rawPortraits)) add('invalid-portraits', 'error', 'portraits/', 'portraits must be a list of {name, base64}')
  else {
    if (rawPortraits.length > MAX_PORTRAITS) add('too-many-portraits', 'error', 'portraits/', `at most ${MAX_PORTRAITS} portraits`)
    if (rawPortraits.length === 0) add('no-portraits', 'warning', 'portraits/', 'portraits/ is empty')
    const seen = new Set<string>()
    for (const p of rawPortraits.slice(0, MAX_PORTRAITS)) {
      const item = (p ?? {}) as Partial<KitPortrait>
      const name = typeof item.name === 'string' ? item.name : ''
      const file = `portraits/${name || '?'}`
      if (!/^[A-Za-z0-9._-]+\.png$/.test(name)) { add('bad-portrait-name', 'error', file, 'portrait names are letters, digits, . _ - and end in .png'); continue }
      if (seen.has(name)) { add('duplicate-portrait', 'error', file, `${name} appears twice`); continue }
      seen.add(name)
      const bytes = typeof item.base64 === 'string' ? Buffer.from(item.base64, 'base64') : Buffer.alloc(0)
      if (bytes.length === 0) { add('empty-portrait', 'error', file, `${name} has no data`); continue }
      if (bytes.length > MAX_PORTRAIT_BYTES) { add('portrait-too-large', 'error', file, `${name} is over ${MAX_PORTRAIT_BYTES / 1024} KB`); continue }
      if (!PNG_MAGIC.every((b, i) => bytes[i] === b)) add('not-a-png', 'error', file, `${name} is not a PNG image`)
    }
  }

  const refused = findings.some(f => f.kind === 'error')
  return {
    verdict: refused ? 'rejected' : findings.length ? 'accepted_with_warnings' : 'accepted',
    findings,
    identity: refused ? null : identity,
  }
}
