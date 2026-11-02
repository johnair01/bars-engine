import * as THREE from 'three'
import { buildDojo } from './dojo.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const host = document.getElementById('scene')
const enter = document.getElementById('enter')
const approach = document.getElementById('approach')
const project = document.getElementById('project')
const restart = document.getElementById('restart')
const status = document.getElementById('status')
const instruction = document.getElementById('instruction')
let renderer
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.setSize(innerWidth, innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  host.append(renderer.domElement)
} catch {
  instruction.textContent = 'The 3D room is unavailable on this device. You can still use the button below.'
}
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x1a0f07)
const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 120)
camera.position.set(0, 3.0, 5.1)
camera.fov = 65
camera.updateProjectionMatrix()
camera.lookAt(0, 0.9, -1)
const dojo = renderer ? buildDojo(scene) : null
const wall = new THREE.Group()
wall.name = 'constellation-wall'
// A single example is deliberately authored rather than inferred from the player.
const points = [new THREE.Vector3(0, 2.8, -4.5), new THREE.Vector3(-1.05, 1.4, -4.5), new THREE.Vector3(1.05, 1.4, -4.5)]
const material = new THREE.LineBasicMaterial({ color: 0x85f4de })
wall.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material))
const hit = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }))
hit.position.set(0, 2.1, -4.46); wall.add(hit)
points.forEach(p => { const sphere = new THREE.Mesh(new THREE.SphereGeometry(.105, 16, 12), new THREE.MeshBasicMaterial({ color: 0xb2ffeb })); sphere.position.copy(p); wall.add(sphere) })
const labelCanvas = document.createElement('canvas')
labelCanvas.width = 1024; labelCanvas.height = 128
const labelContext = labelCanvas.getContext('2d')
labelContext.fillStyle = '#e7fff5'; labelContext.font = 'bold 54px sans-serif'; labelContext.textAlign = 'center'
labelContext.fillText('excitement  ·  possibility  ·  hope', 512, 78)
const label = new THREE.Mesh(new THREE.PlaneGeometry(3.2, .4), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(labelCanvas), transparent:true, side:THREE.DoubleSide, depthWrite:false}))
label.position.set(0, 1.06, -4.44); wall.add(label)
scene.add(wall)
const floor = new THREE.Group(); floor.name = 'floor-triangle'; floor.visible = false
const floorPoints = [new THREE.Vector3(0,.035,1.75),new THREE.Vector3(-.75,.035,3.15),new THREE.Vector3(.75,.035,3.15)]
floor.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(floorPoints), new THREE.LineBasicMaterial({color:0xffcf81})))
floorPoints.forEach(p=>{const disc=new THREE.Mesh(new THREE.CircleGeometry(.15,24),new THREE.MeshBasicMaterial({color:0xffd79c,side:THREE.DoubleSide}));disc.rotation.x=-Math.PI/2;disc.position.copy(p);floor.add(disc)})
scene.add(floor)
// The traveller uses the Between's lightweight player model and Walk clip. It is
// a temporary default figure; personal wardrobe and player data do not enter this lab.
const player = new THREE.Group()
player.name = 'lab-player'
player.position.set(1.25, 0.04, -2)
scene.add(player)
const placeholder = new THREE.Group()
const body = new THREE.Mesh(new THREE.CapsuleGeometry(.25,.8,4,8), new THREE.MeshStandardMaterial({color:0x70caba}))
body.position.y = .85; placeholder.add(body)
const head = new THREE.Mesh(new THREE.SphereGeometry(.22,12,8), new THREE.MeshStandardMaterial({color:0xf1d4af}))
head.position.y = 1.58; placeholder.add(head); player.add(placeholder)
let mixer, walkAction
new GLTFLoader().load('/between/m/player.glb', gltf => {
  const figure = gltf.scene
  figure.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(figure)
  const height = box.getSize(new THREE.Vector3()).y
  if (!(height > 0)) return
  const scale = 1.55 / height
  figure.scale.setScalar(scale); figure.position.y = -box.min.y * scale
  figure.traverse(o => { if (o.isMesh) o.frustumCulled = false })
  player.remove(placeholder); player.add(figure)
  mixer = new THREE.AnimationMixer(figure)
  const clip = gltf.animations.find(a => /walk/i.test(a.name))
  if (clip) { walkAction = mixer.clipAction(clip); walkAction.play(); walkAction.paused = true }
}, undefined, () => { status.textContent = 'Using a simple traveller while the character model is unavailable.' })

let entered = false, projected = false, arriving = false, target = null
const wallTarget = new THREE.Vector3(1.5, 0, -3.1)
const keys = new Set()
const floorPlane = new THREE.Plane(new THREE.Vector3(0,1,0),0)
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const tmp = new THREE.Vector3()
function clearKeys() { keys.clear(); target = null; arriving = false }
function inRoom(p) {
  const r = Math.hypot(p.x,p.z)
  return r < 5.1 && r > 1.7
}
function destination(point) {
  const r = Math.hypot(point.x, point.z)
  if (!r) return null
  const k = THREE.MathUtils.clamp(r,1.75,4.8)/r
  return new THREE.Vector3(point.x*k,0,point.z*k)
}
function goToWall() {
  if (!entered || projected) return
  keys.clear(); target = wallTarget.clone(); arriving = true
  approach.disabled = true
  instruction.textContent = 'Walking to the wall…'
}
function setProjected(value) {
  clearKeys(); projected = value; floor.visible = value
  document.body.classList.toggle('projected', value)
  project.hidden = true; project.disabled = true
  approach.hidden = value; approach.disabled = false
  restart.hidden = !value
  camera.position.set(0, value ? 2.8 : 3, value ? 5.2 : 5.1)
  camera.lookAt(0, value ? 0 : .9, value ? 2.2 : -1)
  instruction.textContent = value ? 'The triangle is on the floor. Its words remain yours.' : 'Tap the floor to walk, or tap the glowing triangle to approach it.'
  status.textContent = value ? 'Excitement · possibility · hope. The next practice is still being built; nothing has been saved.' : ''
}
enter.addEventListener('click',()=>{
  entered = true; document.body.classList.add('entered'); enter.hidden = true
  approach.hidden = false
  instruction.textContent = 'Tap the floor to walk, or tap the glowing triangle to approach it.'
})
approach.addEventListener('click',goToWall)
project.addEventListener('click',()=>{ if (entered && !project.disabled) setProjected(true) })
restart.addEventListener('click',()=>{ setProjected(false); player.position.set(1.25,.04,-2); approach.hidden = false })
addEventListener('keydown', e=>{
  if (!entered || projected || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return
  if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) { e.preventDefault(); target=null;arriving=false;approach.hidden=false;approach.disabled=false;project.hidden=true;keys.add(e.code) }
})
addEventListener('keyup',e=>keys.delete(e.code))
addEventListener('blur',clearKeys)
window.__dojoLabState = () => ({ x: player.position.x, z: player.position.z, entered, projected, walking: Boolean(target) || keys.size > 0 })
if (renderer) {
  renderer.domElement.addEventListener('pointerup', e=>{
    if (!entered || projected) return
    pointer.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1)
    raycaster.setFromCamera(pointer,camera)
    if (raycaster.intersectObject(hit).length) { if (!project.hidden && !project.disabled) setProjected(true); else goToWall(); return }
    if (raycaster.ray.intersectPlane(floorPlane,tmp)) {
      target = destination(tmp); arriving = false; keys.clear()
      approach.disabled = false; project.hidden = true
      instruction.textContent = 'Tap the floor to walk, or tap the glowing triangle to approach it.'
    }
  })
  addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight) })
  const clock = new THREE.Clock()
  renderer.setAnimationLoop(()=>{
    const dt = Math.min(clock.getDelta(),.05)
    let dx = 0, dz = 0
    if (entered && !projected) {
      dx = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'))
      dz = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'))
      if (target) {
        const delta = target.clone().sub(player.position); delta.y=0
        if (delta.length() < .12) {
          target = null
          if (arriving) { arriving = false; approach.hidden = true; approach.disabled = false; project.hidden = false; project.disabled = false; instruction.textContent = 'You are at the wall. Bring the triangle to the floor.' }
        } else {
          // Steer tangentially around the bowl if a straight step would enter it.
          const ahead = player.position.clone().addScaledVector(delta.clone().normalize(), .35)
          if (Math.hypot(ahead.x,ahead.z) < 1.8) {
            const side = player.position.x >= 0 ? 1 : -1
            dx = side * Math.abs(player.position.z); dz = -side * player.position.x
            if (dx * delta.x + dz * delta.z < 0) { dx=-dx; dz=-dz }
          } else { dx=delta.x; dz=delta.z }
        }
      }
    }
    const moving = Math.hypot(dx,dz) > .001
    if (moving) {
      const len=Math.hypot(dx,dz), step=1.6*dt
      const next = player.position.clone().add(new THREE.Vector3(dx/len*step,0,dz/len*step))
      if (inRoom(next)) player.position.copy(next)
      player.rotation.y=Math.atan2(dx,dz)
    }
    if (walkAction) walkAction.paused = !moving
    if (mixer) mixer.update(dt)
    dojo.update(clock.elapsedTime); renderer.render(scene,camera)
  })
}
