/**
 * Skills the board's MCP server publishes (MCP skills extension, `io.modelcontextprotocol/skills`).
 *
 * A client that reads skills over MCP loads a skill's SKILL.md only when it needs it, so every environment that
 * mounts the board gets the same council skill instead of a copy that drifts. The skills are the repo's own
 * `.claude/skills/<name>/` folders, named in SERVED; next.config.ts traces those folders into the route's bundle.
 *
 * URIs follow the extension: a skill is `skill://<name>/SKILL.md`, a supporting file `skill://<name>/<path>`.
 */
import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

/** The skills this server serves. A name here is a folder under `.claude/skills/`. */
export const SERVED = ['six-faces'] as const

const ROOT = path.join(process.cwd(), '.claude', 'skills')
const MAX_FILES = 512

export type SkillFile = { uri: string; digest: string; size: number }
export type SkillEntry = { uri: string; frontmatter: Record<string, string>; resources: SkillFile[] }

const uriOf = (name: string, rel: string) => `skill://${name}/${rel.split(path.sep).join('/')}`
const digestOf = (bytes: Buffer) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`

/** The flat `key: value` lines of a SKILL.md's YAML frontmatter; folded or nested values are kept as their first line. */
export function frontmatterOf(text: string): Record<string, string> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  const out: Record<string, string> = {}
  if (!m) return out
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '')
  }
  return out
}

async function filesUnder(dir: string, base = dir): Promise<string[]> {
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await filesUnder(full, base))
    else if (entry.isFile()) out.push(path.relative(base, full))
    if (out.length > MAX_FILES) break
  }
  return out.sort()
}

/** One skill's entry, or null when the folder or its SKILL.md is missing from this deployment. */
export async function skillEntry(name: string): Promise<SkillEntry | null> {
  if (!(SERVED as readonly string[]).includes(name)) return null
  const dir = path.join(ROOT, name)
  let skillMd: Buffer
  try {
    skillMd = await readFile(path.join(dir, 'SKILL.md'))
  } catch {
    return null
  }
  const resources: SkillFile[] = []
  for (const rel of (await filesUnder(dir)).slice(0, MAX_FILES)) {
    const bytes = rel === 'SKILL.md' ? skillMd : await readFile(path.join(dir, rel))
    resources.push({ uri: uriOf(name, rel), digest: digestOf(bytes), size: bytes.length })
  }
  return { uri: uriOf(name, 'SKILL.md'), frontmatter: frontmatterOf(skillMd.toString('utf8')), resources }
}

export async function listSkills(): Promise<SkillEntry[]> {
  const entries = await Promise.all(SERVED.map((n) => skillEntry(n)))
  return entries.filter((e): e is SkillEntry => e !== null)
}

/** `skill://<name>/<path>` split into its skill and file, or null for any other URI or a path that leaves the folder. */
export function parseSkillUri(uri: string): { name: string; rel: string } | null {
  const m = /^skill:\/\/([A-Za-z0-9._-]+)\/(.+)$/.exec(uri)
  if (!m) return null
  const rel = path.posix.normalize(m[2])
  if (rel.startsWith('..') || path.posix.isAbsolute(rel)) return null
  return { name: m[1], rel }
}

const MIME: Record<string, string> = {
  '.md': 'text/markdown', '.txt': 'text/plain', '.json': 'application/json', '.yaml': 'application/yaml',
  '.yml': 'application/yaml', '.py': 'text/x-python', '.js': 'text/javascript', '.ts': 'text/typescript',
}

/** A skill file as an MCP resource content, or null when the URI names nothing this server serves. */
export async function readSkillFile(uri: string): Promise<{ uri: string; mimeType: string; text: string } | null> {
  const parsed = parseSkillUri(uri)
  if (!parsed || !(SERVED as readonly string[]).includes(parsed.name)) return null
  const full = path.join(ROOT, parsed.name, parsed.rel)
  if (!full.startsWith(path.join(ROOT, parsed.name) + path.sep)) return null
  try {
    if (!(await stat(full)).isFile()) return null
    const text = await readFile(full, 'utf8')
    return { uri, mimeType: MIME[path.extname(full).toLowerCase()] ?? 'text/plain', text }
  } catch {
    return null
  }
}
