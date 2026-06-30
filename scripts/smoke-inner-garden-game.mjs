import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(process.cwd(), 'public', 'inner-garden-game')

function fail(message) {
  console.error(`Inner Garden smoke failed: ${message}`)
  process.exit(1)
}

function collectJs(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) collectJs(full, files)
    if (stat.isFile() && full.endsWith('.js')) files.push(full)
  }
  return files
}

if (!existsSync(join(root, 'index.html'))) fail('missing static game index')
if (!existsSync(join(root, 'js', 'main.js'))) fail('missing game boot module')

for (const file of collectJs(join(root, 'js'))) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
}

const index = readFileSync(join(root, 'index.html'), 'utf8')
if (!index.includes('loading-screen')) fail('loading screen markup missing')
if (!index.includes('game-canvas')) fail('game canvas markup missing')

const timeSystem = readFileSync(join(root, 'js', 'systems', 'TimeSystem.js'), 'utf8')
if (!timeSystem.includes('mvpLightingDisabled = true')) fail('MVP lighting override is not enabled')
if (!timeSystem.includes('if (this.mvpLightingDisabled) return 1')) fail('ambient dimming can still darken MVP screenshots')

const menu = readFileSync(join(root, 'js', 'ui', 'Menu.js'), 'utf8')
if (menu.includes("ctx.fillText('Source: Casey's")) fail("Menu.js still contains the unescaped Casey's string")

const client = readFileSync(join(process.cwd(), 'src', 'app', 'inner-garden', 'play', 'InnerGardenPlayClient.tsx'), 'utf8')
for (const label of ['Interact', 'Act', 'BAR', 'Meditate', 'Menu']) {
  if (!client.includes(label)) fail(`mobile dock missing ${label} control`)
}
if (!client.includes('inner-garden-control.v1')) fail('mobile dock is not wired through the bridge control schema')

console.log(`Inner Garden smoke passed: ${collectJs(join(root, 'js')).length} game scripts parsed`)
