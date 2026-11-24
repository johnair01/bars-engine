import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url))
test('validates kit paths and YAML syntax, reporting broken input', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'world-kit-'))
  try {
    await mkdir(join(dir, 'portraits'))
    for (const file of ['world.yaml', 'conditions.yaml', 'obstacles.yaml', 'npcs.yaml']) await writeFile(join(dir, file), 'name: example\n')
    await writeFile(join(dir, 'world.md'), '# World\n')
    const good = JSON.parse(execFileSync(process.execPath, [cli, 'validate', dir, '--json'], { encoding: 'utf8' }))
    assert.deepEqual(good, { valid: true, findings: [] })
    await writeFile(join(dir, 'npcs.yaml'), 'bad: [\n')
    await rm(join(dir, 'world.md'))
    const bad = spawnSync(process.execPath, [cli, 'validate', dir, '--json'], { encoding: 'utf8' })
    assert.equal(bad.status, 1)
    assert.deepEqual(JSON.parse(bad.stdout).findings.map(({ id, file }) => [id, file]), [['missing-file', 'world.md'], ['invalid-yaml', 'npcs.yaml']].sort((a,b) => ['world.yaml','conditions.yaml','obstacles.yaml','npcs.yaml','world.md'].indexOf(a[1]) - ['world.yaml','conditions.yaml','obstacles.yaml','npcs.yaml','world.md'].indexOf(b[1])))
  } finally { await rm(dir, { recursive: true, force: true }) }
})
