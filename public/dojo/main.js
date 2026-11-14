import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildDojo } from './dojo.js'

const D2R = Math.PI / 180

const params = new URLSearchParams(location.search)
const still = params.get('still') === '1'
const startView = Math.min(3, Math.max(0, parseInt(params.get('view') || '1', 10) - 1))
const startWalking = params.get('walk') === '1' && !still
if (still) document.body.classList.add('still')

const app = document.getElementById('app')
const hintEl = document.getElementById('hint')

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
  powerPreference: 'high-performance',
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.95
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
app.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a0f07)

const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 120)

const dojo = buildDojo(scene)
const nav = dojo.nav

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.06
controls.minDistance = 1.2
controls.maxDistance = 13
controls.maxPolarAngle = Math.PI * 0.52
controls.target.set(0, 1.2, -0.4)
controls.enabled = !still

let currentView = startView

function applyPreset(i) {
  const v = dojo.views[i]
  camera.fov = v.fov
  camera.position.set(...v.pos)
  controls.target.set(...v.target)
  camera.lookAt(controls.target)
  camera.updateProjectionMatrix()
  controls.update()
  document
    .querySelectorAll('#views button[data-view]')
    .forEach((b) => b.classList.toggle('on', Number(b.dataset.view) === i))
}

/* ---------------------------------------------------------------- views --- */
const bar = document.getElementById('views')
dojo.views.forEach((v, i) => {
  const btn = document.createElement('button')
  btn.dataset.view = String(i)
  btn.textContent = v.label.replace(' — ', ' · ')
  btn.addEventListener('click', () => applyView(i))
  bar.appendChild(btn)
})

const walkBtn = document.createElement('button')
walkBtn.className = 'walk'
walkBtn.addEventListener('click', () => (walk.active ? exitWalk() : enterWalk()))
bar.appendChild(walkBtn)

/* ----------------------------------------------------------------- walk ---
   First-person mode. Movement is clamped to the room, and to the corridor
   strip that runs out through the doorway, so the doorway is the only way
   in or out. Drag to look, or click to capture the pointer. */
const walk = {
  active: false,
  yaw: nav.spawnYaw,
  pitch: 0,
  pos: new THREE.Vector3(nav.spawn[0], 0, nav.spawn[1]),
  dragging: false,
  lastX: 0,
  lastY: 0,
}

const keys = new Set()
const MOVE_CODES = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
])
const WALK_SPEED = 2.5
const TURN_SPEED = 1.7
const LOOK_SENSITIVITY = 0.0026
const WALK_SUBSTEP = 0.02
const WALK_MAX_DT = 0.16

/* Keep the walker inside the room, or inside the corridor strip when aligned
   with the doorway. Those two regions touch, so the opening is walkable: the
   lateral limit never binds while the walker is still inside the room. A
   third clamp holds them off the centre furniture. */
function clampWalk(p) {
  const doorA = nav.doorDeg * D2R
  const axisX = Math.sin(doorA)
  const axisZ = Math.cos(doorA)
  const sideX = Math.cos(doorA)
  const sideZ = -Math.sin(doorA)

  const r = Math.hypot(p.x, p.z)
  if (r < 1e-4) return p

  let dAng = Math.atan2(p.x, p.z) - doorA
  while (dAng > Math.PI) dAng -= Math.PI * 2
  while (dAng < -Math.PI) dAng += Math.PI * 2

  const aligned = Math.abs(dAng) < nav.doorHalfAngleDeg * D2R
  if (aligned) {
    const depth = Math.min(r, nav.corridorEnd)
    const lateral = Math.max(
      -nav.corridorHalfWidth,
      Math.min(nav.corridorHalfWidth, depth * Math.sin(dAng))
    )
    p.x = axisX * depth + sideX * lateral
    p.z = axisZ * depth + sideZ * lateral
  } else if (r > nav.roomRadius) {
    const k = nav.roomRadius / r
    p.x *= k
    p.z *= k
  }

  // Push out of the centre ring rather than blocking entry to it: a radial
  // push keeps the walker's angle, so the doorway alignment above still holds.
  const inner = Math.hypot(p.x, p.z)
  if (inner < nav.centreRadius) {
    const k = nav.centreRadius / Math.max(inner, 1e-4)
    p.x *= k
    p.z *= k
  }
  return p
}

function nearWall(p) {
  return Math.hypot(p.x, p.z) <= nav.roomRadius + 1e-6
}

function stepWalk(dt) {
  const forwardX = -Math.sin(walk.yaw)
  const forwardZ = -Math.cos(walk.yaw)
  const rightX = Math.cos(walk.yaw)
  const rightZ = -Math.sin(walk.yaw)

  let mx = 0
  let mz = 0
  if (keys.has('KeyW') || keys.has('ArrowUp')) {
    mx += forwardX
    mz += forwardZ
  }
  if (keys.has('KeyS') || keys.has('ArrowDown')) {
    mx -= forwardX
    mz -= forwardZ
  }
  if (keys.has('KeyD')) {
    mx += rightX
    mz += rightZ
  }
  if (keys.has('KeyA')) {
    mx -= rightX
    mz -= rightZ
  }
  if (keys.has('ArrowLeft')) walk.yaw += TURN_SPEED * dt
  if (keys.has('ArrowRight')) walk.yaw -= TURN_SPEED * dt

  const len = Math.hypot(mx, mz)
  if (len > 0) {
    const step = (WALK_SPEED * dt) / len
    walk.pos.x += mx * step
    walk.pos.z += mz * step
    clampWalk(walk.pos)
  }
}

/* Movement integrates in fixed sub-steps. One rendered frame can be a hundred
   milliseconds or more on a slow machine, and treating that as a single step
   would make the walk slow down with the frame rate; splitting it keeps the
   pace the same in real time and never steps far enough to skip a clamp. */
function updateWalk(dt) {
  const span = Math.min(dt, WALK_MAX_DT)
  const count = Math.max(1, Math.min(8, Math.ceil(span / WALK_SUBSTEP)))
  for (let i = 0; i < count; i++) stepWalk(span / count)

  camera.position.set(walk.pos.x, nav.eyeHeight, walk.pos.z)
  camera.rotation.order = 'YXZ'
  camera.rotation.set(walk.pitch, walk.yaw, 0)
}

function enterWalk() {
  walk.active = true
  walk.pos.set(nav.spawn[0], 0, nav.spawn[1])
  walk.yaw = nav.spawnYaw
  walk.pitch = 0
  keys.clear()
  document.body.classList.add('walking')
  controls.enabled = false
  camera.fov = 72
  camera.updateProjectionMatrix()
  updateHint()
}

function exitWalk() {
  if (!walk.active) return
  walk.active = false
  keys.clear()
  document.body.classList.remove('walking')
  controls.enabled = true
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock()
  applyPreset(currentView)
  updateHint()
}

function applyView(i) {
  exitWalk()
  currentView = i
  applyPreset(i)
}

function updateHint() {
  walkBtn.textContent = walk.active ? 'Exit walk' : 'Walk in through the doorway'
  walkBtn.classList.toggle('on', walk.active)
  hintEl.textContent = walk.active
    ? 'W A S D to move · drag to look · esc to exit'
    : 'drag to orbit · scroll to move · walk in to explore'
}

/* ------------------------------------------------------------- controls --- */
function tryPointerLock() {
  const el = renderer.domElement
  if (!el.requestPointerLock || document.pointerLockElement === el) return
  try {
    const maybe = el.requestPointerLock()
    if (maybe && typeof maybe.catch === 'function') maybe.catch(() => {})
  } catch {
    /* pointer lock is unavailable (for example inside a sandboxed preview);
       drag-to-look below still works */
  }
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!walk.active) return
  walk.dragging = true
  walk.lastX = e.clientX
  walk.lastY = e.clientY
  tryPointerLock()
})

window.addEventListener('pointerup', () => {
  walk.dragging = false
})

window.addEventListener('pointermove', (e) => {
  if (!walk.active) return
  let dx
  let dy
  if (document.pointerLockElement === renderer.domElement) {
    dx = e.movementX
    dy = e.movementY
  } else if (walk.dragging) {
    dx = e.clientX - walk.lastX
    dy = e.clientY - walk.lastY
    walk.lastX = e.clientX
    walk.lastY = e.clientY
  } else {
    return
  }
  walk.yaw -= dx * LOOK_SENSITIVITY
  walk.pitch = Math.max(-1.2, Math.min(1.2, walk.pitch - dy * LOOK_SENSITIVITY))
})

window.addEventListener('keydown', (e) => {
  if (!walk.active) return
  if (e.code === 'Escape') {
    exitWalk()
    return
  }
  if (MOVE_CODES.has(e.code)) {
    keys.add(e.code)
    e.preventDefault()
  }
})

window.addEventListener('keyup', (e) => keys.delete(e.code))
window.addEventListener('blur', () => keys.clear())

/* --------------------------------------------------------------- render --- */
const clock = new THREE.Clock()
let lastTime = performance.now()
let frames = 0

function frame() {
  const now = performance.now()
  const dt = Math.min((now - lastTime) / 1000, WALK_MAX_DT)
  lastTime = now

  dojo.update(clock.getElapsedTime())
  if (walk.active) updateWalk(dt)
  else controls.update()

  renderer.render(scene, camera)
  frames += 1
  window.__frameCount = frames
}

function loop() {
  requestAnimationFrame(loop)
  frame()
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

updateHint()
applyPreset(currentView)
window.__sceneStats = dojo.stats

if (still) {
  // Stills render on demand: exactly one frame per camera change, instead of a
  // continuous loop, which is far cheaper under software WebGL.
  frame()
  window.__sceneReady = true
  window.__setView = (i) => {
    applyView(i)
    frame()
  }
} else {
  window.__sceneReady = true
  window.__setView = (i) => applyView(i)
  if (startWalking) enterWalk()
  loop()
}

/* Diagnostics: state for the walk test, texture colours, and frame sampling. */
window.__dojo = dojo
window.__walk = walk
window.__nav = nav
window.__walkKeys = () => Array.from(keys)
window.__nearWall = nearWall
window.__walkState = () => ({
  active: walk.active,
  x: walk.pos.x,
  z: walk.pos.z,
  r: Math.hypot(walk.pos.x, walk.pos.z),
  yaw: walk.yaw,
  pixels: (() => {
    const c = document.createElement('canvas')
    c.width = 8
    c.height = 8
    const ctx = c.getContext('2d')
    ctx.drawImage(renderer.domElement, 0, 0, 8, 8)
    return Array.from(ctx.getImageData(0, 0, 8, 8).data.slice(0, 12))
  })(),
})

window.__textureAverage = (meshName) => {
  const mesh = scene.getObjectByName(meshName)
  const map = mesh?.material?.map
  if (!map?.image) return null
  const c = document.createElement('canvas')
  c.width = 48
  c.height = 48
  const ctx = c.getContext('2d')
  ctx.drawImage(map.image, 0, 0, 48, 48)
  const d = ctx.getImageData(0, 0, 48, 48).data
  let r = 0
  let g = 0
  let b = 0
  for (let i = 0; i < d.length; i += 4) {
    r += d[i]
    g += d[i + 1]
    b += d[i + 2]
  }
  const n = d.length / 4
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
}

window.__sampleGrid = (cols = 8, rows = 8) => {
  const c = document.createElement('canvas')
  c.width = cols
  c.height = rows
  const ctx = c.getContext('2d')
  ctx.drawImage(renderer.domElement, 0, 0, cols, rows)
  const d = ctx.getImageData(0, 0, cols, rows).data
  const out = []
  for (let i = 0; i < d.length; i += 4) {
    out.push(
      '#' +
        [d[i], d[i + 1], d[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')
    )
  }
  return out
}

/* Pixel check so an automated still can prove the canvas is not blank. */
window.__sampleCanvas = () => {
  const src = renderer.domElement
  const c = document.createElement('canvas')
  c.width = 160
  c.height = 90
  const ctx = c.getContext('2d')
  ctx.drawImage(src, 0, 0, c.width, c.height)
  const data = ctx.getImageData(0, 0, c.width, c.height).data
  let sum = 0
  let sumSq = 0
  let n = 0
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    sum += lum
    sumSq += lum * lum
    n += 1
  }
  const mean = sum / n
  const variance = Math.max(0, sumSq / n - mean * mean)
  return { mean, stddev: Math.sqrt(variance), samples: n }
}
