#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises'
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

export async function main(args) {
  const [command, directory, ...options] = args
  if (command !== 'validate' || !directory || options.some(option => option !== '--json')) {
    console.error('Usage: world-kit validate <kit-directory> [--json]')
    return 2
  }
  const result = await validate(directory)
  if (options.includes('--json')) console.log(JSON.stringify(result))
  else if (result.valid) console.log('Kit files pass offline checks.')
  else for (const finding of result.findings) console.error(`${finding.id} ${finding.kind} ${finding.file}: ${finding.message}`)
  return result.valid ? 0 : 1
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) process.exitCode = await main(process.argv.slice(2))
