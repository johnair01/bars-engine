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

const main = readFileSync(join(root, 'js', 'main.js'), 'utf8')
if (!main.includes('window.innerGardenGame')) fail('game instance is not exposed for same-origin control smoke reads')

const timeSystem = readFileSync(join(root, 'js', 'systems', 'TimeSystem.js'), 'utf8')
if (!timeSystem.includes('mvpLightingDisabled = true')) fail('MVP lighting override is not enabled')
if (!timeSystem.includes('if (this.mvpLightingDisabled) return 1')) fail('ambient dimming can still darken MVP screenshots')

const menu = readFileSync(join(root, 'js', 'ui', 'Menu.js'), 'utf8')
if (menu.includes("ctx.fillText('Source: Casey's")) fail("Menu.js still contains the unescaped Casey's string")

const client = readFileSync(join(process.cwd(), 'src', 'app', 'inner-garden', 'play', 'InnerGardenPlayClient.tsx'), 'utf8')
for (const label of ['A', 'B', 'Start', 'Select', 'Back', 'Meditate']) {
  if (!client.includes(label)) fail(`mobile dock missing ${label} control`)
}
if (!client.includes('inner-garden-control.v1')) fail('v1 raw-key compatibility was removed too early')
if (!client.includes('inner-garden-control.v2')) fail('mobile dock is not wired through semantic controls')

const input = readFileSync(join(root, 'js', 'core', 'Input.js'), 'utf8')
if (!input.includes('virtualTapQueue')) fail('virtual taps are not queued durably')
if (!input.includes('beginFrame()')) fail('queued virtual taps are not consumed by the game frame')

const game = readFileSync(join(root, 'js', 'core', 'Game.js'), 'utf8')
if (!game.includes('inner-garden-control.v2')) fail('game runtime does not accept semantic controls')
if (!game.includes("back: 'Escape'")) fail('semantic Back control is not mapped to Escape')
if (!game.includes('this.input.beginFrame()')) fail('game update does not promote queued virtual taps')

console.log(`Inner Garden smoke passed: ${collectJs(join(root, 'js')).length} game scripts parsed`)
