/**
 * Behavioural test for the dojo's first-person walk mode.
 *
 * Drives the served page with real key events and checks the movement clamps:
 * walking in through the doorway, being stopped by the wall, being kept out of
 * the centre furniture, getting back out through the doorway, and stopping at
 * the far end of the corridor. Saves eye-level screenshots as evidence.
 *
 * Each step parks the walker close to the boundary it tests and then holds a
 * real key long enough to push well past it, so a missing clamp shows up as an
 * overshoot. Waits stop on the measured distance rather than on a fixed clock,
 * because software WebGL renders this scene at anywhere between one and a
 * hundred frames a second; the deadline is only a backstop.
 *
 *   node scripts/dojo/test-walk.mjs [baseUrl]
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = process.argv[2] || 'http://127.0.0.1:3000/ontology-game/dojo'
const OUT = 'scripts/dojo/renders/walk'
const STEP_DEADLINE_MS = 30000
const FRAME_CEILING = 150

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-proxy-server',
    '--hide-scrollbars',
  ],
})
const page = await browser.newPage({
  viewport: { width: 720, height: 405 },
  deviceScaleFactor: 1,
})
page.setDefaultTimeout(STEP_DEADLINE_MS * 2)
page.on('pageerror', (e) => console.error('[page exception]', e.message))

await mkdir(OUT, { recursive: true })

const state = () => page.evaluate(() => window.__walkState())
const frameCount = () => page.evaluate(() => window.__frameCount ?? 0)

/* Park the walker at a polar angle and radius, then aim it. Forward is -Z at
   yaw 0, so yaw = deg walks inward and deg + 180 walks outward. */
async function park(deg, radius, yawDeg) {
  await page.evaluate(
    ({ d, r, y }) => {
      const a = (d * Math.PI) / 180
      window.__walk.pos.set(Math.sin(a) * r, 0, Math.cos(a) * r)
      window.__walk.pitch = 0
      window.__walk.yaw = (y * Math.PI) / 180
    },
    { d: deg, r: radius, y: yawDeg }
  )
}

/* Hold a key until the predicate passes, or until the frame ceiling or the wall
   clock runs out (whichever comes first). */
async function walk(key, done, frameCeiling = FRAME_CEILING) {
  const f0 = await frameCount()
  const started = Date.now()
  await page.keyboard.down(key)
  let s = await state()
  while (Date.now() - started < STEP_DEADLINE_MS) {
    if ((await frameCount()) - f0 >= frameCeiling) break
    s = await state()
    if (done(s)) break
    await page.waitForTimeout(100)
  }
  await page.keyboard.up(key)
  return { ...s, frames: (await frameCount()) - f0, seconds: (Date.now() - started) / 1000 }
}

/* Wait for the next rendered frame, so a screenshot is not a stale buffer. */
async function shot(name) {
  const f0 = await frameCount()
  await page.waitForFunction((n) => window.__frameCount > n, f0, {
    timeout: STEP_DEADLINE_MS,
  })
  await page.screenshot({ path: `${OUT}/${name}` })
}

let failures = 0
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

function angleOf(s) {
  return (Math.atan2(s.x, s.z) * 180) / Math.PI
}
function angleOff(s, deg) {
  let d = angleOf(s) - deg
  while (d > 180) d -= 360
  while (d < -180) d += 360
  return Math.abs(d)
}

const target = new URL(BASE)
target.searchParams.set('walk', '1')

const runStarted = Date.now()
console.log(`loading ${target.toString()}`)
await page.goto(target.toString(), { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__sceneReady === true, null, {
  timeout: STEP_DEADLINE_MS,
})

const nav = await page.evaluate(() => window.__nav)
console.log(
  `nav: roomRadius=${nav.roomRadius} doorDeg=${nav.doorDeg} ` +
    `halfAngle=${nav.doorHalfAngleDeg}deg corridorEnd=${nav.corridorEnd} ` +
    `centreRadius=${nav.centreRadius} eyeHeight=${nav.eyeHeight}`
)

const start = await state()
check(
  'walk mode starts outside, in the entry corridor',
  start.active === true && start.r > nav.roomRadius,
  `active=${start.active} r=${start.r.toFixed(2)}`
)
await shot('walk-1-entry.png')

/* 1. In through the doorway. */
await park(nav.doorDeg, nav.roomRadius + 0.55, nav.doorDeg)
const inside = await walk('w', (s) => s.r < nav.roomRadius - 0.3)
check(
  'walks in through the doorway',
  inside.r < nav.roomRadius - 0.3,
  `r=${inside.r.toFixed(2)} (past ${(nav.roomRadius - 0.3).toFixed(2)}) in ` +
    `${inside.frames} frames / ${inside.seconds.toFixed(1)}s`
)
await shot('walk-2-inside.png')

/* 2. Straight into the wall, well away from the doorway. */
const wallDeg = nav.doorDeg + 120
await park(wallDeg, nav.roomRadius - 0.15, wallDeg + 180)
const atWall = await walk('w', (s) => s.r >= nav.roomRadius - 0.005 && s.r <= nav.roomRadius + 0.005)
check(
  'stops at the wall and stays inside the room',
  atWall.r <= nav.roomRadius + 0.01 && atWall.r >= nav.roomRadius - 0.02,
  `r=${atWall.r.toFixed(3)} limit=${nav.roomRadius} in ${atWall.frames} frames`
)

/* 3. Back out through the doorway: the region this clamp used to dead-end in. */
await park(nav.doorDeg, nav.roomRadius - 0.45, nav.doorDeg + 180)
const out = await walk('w', (s) => s.r > nav.roomRadius + 0.55 && angleOff(s, nav.doorDeg) < 2)
check(
  'walks back out through the doorway',
  out.r > nav.roomRadius + 0.55 && angleOff(out, nav.doorDeg) < 2,
  `r=${out.r.toFixed(2)} ${angleOff(out, nav.doorDeg).toFixed(1)}deg off the door axis ` +
    `after ${out.frames} frames`
)

/* 4. Keep going: the corridor stops them at its far end. */
await park(nav.doorDeg, nav.corridorEnd - 0.7, nav.doorDeg + 180)
const end = await walk('w', (s) => s.r >= nav.corridorEnd - 0.01)
check(
  'stops at the far end of the corridor',
  end.r <= nav.corridorEnd + 0.01 && end.r >= nav.corridorEnd - 0.01,
  `r=${end.r.toFixed(3)} limit=${nav.corridorEnd} in ${end.frames} frames`
)
await park(nav.doorDeg, Math.min(end.r, nav.corridorEnd), nav.doorDeg)
await shot('walk-3-corridor-facing-room.png')

/* 5. The centre furniture is not walkable. */
await park(0, nav.centreRadius - 0.6, 0)
const centre = await walk('w', () => false, 12)
check(
  'is held off the centre furniture',
  centre.r >= nav.centreRadius - 0.01 && centre.r <= nav.centreRadius + 0.05,
  `r=${centre.r.toFixed(3)} ring=${nav.centreRadius} in ${centre.frames} frames`
)

/* 6. Still drawing while walking. */
check(
  'canvas still rendering during the walk',
  Array.isArray(centre.pixels) && centre.pixels.some((v) => v > 0),
  `first pixels ${centre.pixels.slice(0, 3).join(',')}`
)

/* 7. Escape hands control back to the orbit camera. */
await page.keyboard.press('Escape')
await page.waitForTimeout(1000)
const afterExit = await state()
check('escape exits walk mode', afterExit.active === false, `active=${afterExit.active}`)

const seconds = (Date.now() - runStarted) / 1000
const framesDrawn = await frameCount()
console.log(
  `\nframe rate while testing: ${(framesDrawn / seconds).toFixed(2)} fps ` +
    `(${framesDrawn} frames in ${seconds.toFixed(0)}s)`
)

await browser.close()

console.log(failures === 0 ? '\nAll walk checks passed.' : `\n${failures} walk check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
