import * as THREE from 'three'
import { buildDojo } from './dojo.js'

const host = document.getElementById('scene')
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
camera.position.set(0, 2.0, 4.5)
camera.lookAt(0, 0.8, -2.5)
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
function setProjected(value) {
  floor.visible = value
  document.body.classList.toggle('projected', value)
  camera.position.set(0, value ? 2.8 : 2, value ? 5.2 : 4.5)
  camera.fov = value ? 65 : 46
  camera.updateProjectionMatrix()
  if (value) camera.lookAt(0, 0, 2.2)
  else camera.lookAt(0, 0.8, -2.5)
  project.hidden = value
  restart.hidden = !value
  instruction.textContent = value ? 'The triangle is on the floor. Its words remain yours.' : 'Start by selecting the glowing triangle on the wall.'
  status.textContent = value ? 'On the floor: excitement, possibility, hope. The next practice is still being built; nothing has been saved.' : ''
}
project.addEventListener('click',()=>setProjected(true))
restart.addEventListener('click',()=>setProjected(false))
if (renderer) {
  renderer.domElement.addEventListener('pointerup', e=>{
    const pos = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)
    const ray = new THREE.Raycaster(); ray.setFromCamera(pos, camera)
    if (ray.intersectObject(hit).length) setProjected(true)
  })
  addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight) })
  const clock = new THREE.Clock()
  renderer.setAnimationLoop(()=>{ dojo.update(clock.getElapsedTime()); renderer.render(scene,camera) })
}
