import * as THREE from 'three'
import { buildDojo } from './dojo.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { deriveExample, forms, resolveForm } from './grammar.js'

const host = document.getElementById('scene')
const enter = document.getElementById('enter')
const approach = document.getElementById('approach')
const project = document.getElementById('project')
const restart = document.getElementById('restart')
const status = document.getElementById('status')
const instruction = document.getElementById('instruction')
const resume = document.getElementById('resume')
const wallView = document.getElementById('wall-view')
const closeWall = document.getElementById('close-wall')
const choices = [document.getElementById('choose-one'), document.getElementById('choose-two'),document.getElementById('choose-teaching')]
const wallProject = document.getElementById('wall-project')
const placeTriangle=document.getElementById('place-triangle'), liftFloor=document.getElementById('lift-floor'), returnTriangle=document.getElementById('return-triangle')
const reflectionView=document.getElementById('reflection-view'), reflectionChoice=document.getElementById('reflection-choice')
const pickMove=document.getElementById('pick-move')
const nextStation = document.getElementById('next-station')
const useStation = document.getElementById('use-station')
const stationView = document.getElementById('station-view')
const stationClose = document.getElementById('station-close')
const anchorPanel = document.getElementById('anchors-panel')
const loomPanel = document.getElementById('loom-panel')
const previewPanel = document.getElementById('preview-panel')
const anchorResult = document.getElementById('anchor-result')
const loomButton = document.getElementById('to-loom')
const phase = document.getElementById('phase')
const nextStep = document.getElementById('next-step')
const formDetail = document.getElementById('form-detail')
const barDetail = document.getElementById('bar-detail')
let decisions = {wonder:'proposed',poignance:'proposed',joy:'proposed'}
let stationOpen = false, stage = 'wall', arrivingAt = 'wall', carryingTriangle=false, heldEnergy=null, moveDone=false, reflectionOpen=false, moveStart=0

let selection = 0, wallOpen = false
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
// A framed screen gives the constellation a stable place above the room.
const frame = new THREE.Mesh(new THREE.BoxGeometry(3.9, 2.05, .13), new THREE.MeshStandardMaterial({color:0x785538, roughness:.8}))
frame.position.set(0,2.18,-4.62); wall.add(frame)
const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.68,1.84), new THREE.MeshBasicMaterial({color:0x0c2927,side:THREE.DoubleSide}))
screen.position.set(0,2.18,-4.54); wall.add(screen)
// A single example is deliberately authored rather than inferred from the player.
const wallSide = 1.02, wallHeight = wallSide * Math.sqrt(3) / 2, wallMid = 2.17
const points = [new THREE.Vector3(0, wallMid + wallHeight, -4.5), new THREE.Vector3(-wallSide/2, wallMid, -4.5), new THREE.Vector3(wallSide/2, wallMid, -4.5)]
const material = new THREE.LineBasicMaterial({ color: 0x85f4de })
wall.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material))
const lowerPoint = new THREE.Vector3(0,wallMid-wallHeight,-4.5)
const wallLower=new THREE.Line(new THREE.BufferGeometry().setFromPoints([points[1],lowerPoint,points[2]]),new THREE.LineBasicMaterial({color:0xddbf83}));wall.add(wallLower)
const wallMarkers={}
;[['wonder',0,1,0xd9e5ff],['poignance',2,0,0x72c9ff],['joy',1,2,0x83e1a3]].forEach(([id,a,b,color])=>{
  const marker=new THREE.Mesh(new THREE.SphereGeometry(.07,12,10),new THREE.MeshBasicMaterial({color}))
  marker.position.copy(points[a]).add(points[b]).multiplyScalar(.5);marker.position.z=-4.43;marker.visible=false;wall.add(marker);wallMarkers[id]=marker
})
const hit = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }))
hit.position.set(0, 2.1, -4.46); wall.add(hit)
points.forEach(p => { const sphere = new THREE.Mesh(new THREE.SphereGeometry(.105, 16, 12), new THREE.MeshBasicMaterial({ color: 0xb2ffeb })); sphere.position.copy(p); wall.add(sphere) })
const labelCanvas = document.createElement('canvas')
labelCanvas.width = 1024; labelCanvas.height = 128
const labelContext = labelCanvas.getContext('2d')
labelContext.fillStyle = '#e7fff5'; labelContext.font = 'bold 54px sans-serif'; labelContext.textAlign = 'center'
labelContext.fillText('TAP TO EXPLORE', 512, 78)
const label = new THREE.Mesh(new THREE.PlaneGeometry(3.2, .4), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(labelCanvas), transparent:true, side:THREE.DoubleSide, depthWrite:false}))
label.scale.set(.42,.75,1);label.position.set(1.12, 1.48, -4.44); wall.add(label)
scene.add(wall)
const floor = new THREE.Group(); floor.name = 'floor-triangle'; floor.visible = false
const floorSide=1.5, floorHeight=floorSide*Math.sqrt(3)/2
const floorPoints = [new THREE.Vector3(0,.035,3.15-floorHeight),new THREE.Vector3(-floorSide/2,.035,3.15),new THREE.Vector3(floorSide/2,.035,3.15)]
const edgePairs=[[0,1],[1,2],[2,0]]
const edgeHits=[]
edgePairs.forEach(([a,b],i)=>{
  const dir=floorPoints[b].clone().sub(floorPoints[a]), hitLine=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,dir.length(),8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}))
  hitLine.position.copy(floorPoints[a]).add(floorPoints[b]).multiplyScalar(.5);hitLine.position.y=.1
  hitLine.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());hitLine.userData.edge=i;floor.add(hitLine);edgeHits.push(hitLine)
})
floor.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(floorPoints), new THREE.LineBasicMaterial({color:0xffcf81})))
floorPoints.forEach(p=>{const disc=new THREE.Mesh(new THREE.CircleGeometry(.15,24),new THREE.MeshBasicMaterial({color:0xffd79c,side:THREE.DoubleSide}));disc.rotation.x=-Math.PI/2;disc.position.copy(p);floor.add(disc)})
const teachingOverlay=new THREE.Group();teachingOverlay.name='ea-teaching-overlay';teachingOverlay.visible=false
const overlayPoints=floorPoints.map(p=>p.clone().add(new THREE.Vector3(0,.025,0)))
;[[0,1,0xc5d5f4],[1,2,0x8ae1a0],[2,0,0x74c2f6]].forEach(([a,b,color])=>teachingOverlay.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([overlayPoints[a],overlayPoints[b]]),new THREE.LineBasicMaterial({color}))))
floor.add(teachingOverlay)
const anchorMarkers={}
;['wonder','poignance','joy'].forEach((id,i)=>{
  const marker=new THREE.Mesh(new THREE.SphereGeometry(.095,16,12),new THREE.MeshBasicMaterial({color:[0xd9e5ff,0x72c9ff,0x83e1a3][i]}))
  const edge=edgePairs[[0,2,1][i]]
  marker.position.copy(floorPoints[edge[0]]).add(floorPoints[edge[1]]).multiplyScalar(.5);marker.position.y=.14;marker.visible=false
  floor.add(marker);anchorMarkers[id]=marker
})
const moveSpark=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),new THREE.MeshBasicMaterial({color:0xffd98d}));moveSpark.visible=false;floor.add(moveSpark)
const lineLabels=[]
edgePairs.forEach(([a,b])=>{
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=100
  const texture=new THREE.CanvasTexture(canvas)
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}))
  sprite.position.copy(floorPoints[a]).add(floorPoints[b]).multiplyScalar(.5);sprite.position.y=.23;sprite.scale.set(1.15,.23,1);floor.add(sprite);lineLabels.push({canvas,texture})
})
function updateLineLabels() {
  const words=selection===2?['wonder','joy','poignance']:selection===1?['wonder','hope','poignance']:['excitement','hope','possibility']
  lineLabels.forEach(({canvas,texture},i)=>{const ctx=canvas.getContext('2d');ctx.clearRect(0,0,512,100);ctx.fillStyle='#fff7dc';ctx.font='bold 52px sans-serif';ctx.textAlign='center';ctx.fillText(words[i],256,65);texture.needsUpdate=true})
}
scene.add(floor)
function buildStation(name,x,z,color) {
  const table = new THREE.Group(); table.name=name
  const material=new THREE.MeshStandardMaterial({color:0x604531,roughness:.8})
  const top=new THREE.Mesh(new THREE.BoxGeometry(1.1,.12,.68),material);top.position.y=.86;table.add(top)
  for (const side of [-.42,.42]) {const leg=new THREE.Mesh(new THREE.BoxGeometry(.12,.82,.5),material);leg.position.set(side,.41,0);table.add(leg)}
  const mark=new THREE.Mesh(new THREE.BoxGeometry(.65,.07,.35),new THREE.MeshBasicMaterial({color}));mark.position.y=.96;table.add(mark)
  const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=100
  const signCtx=signCanvas.getContext('2d');signCtx.fillStyle='#f8edcf';signCtx.font='bold 36px sans-serif';signCtx.textAlign='center'
  signCtx.fillText(name==='anchor-table'?'ANCHOR TABLE':'ACTION LOOM',256,62)
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.31),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(signCanvas),transparent:true,depthWrite:false,side:THREE.DoubleSide}))
  sign.position.set(0,1.38,0);table.add(sign)
  table.position.set(x,0,z);scene.add(table);return table
}
const anchorTable=buildStation('anchor-table',-3,-.8,0x70d4c4)
const actionLoom=buildStation('action-loom',3,-.8,0xe8bc75)
const tableOrbs=[]
;[['wonder',0xd9e5ff,-.34],['poignance',0x72c9ff,0],['joy',0x83e1a3,.34],['move',0xffd98d,0]].forEach(([id,color,x])=>{
  const orb=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),new THREE.MeshBasicMaterial({color}))
  orb.position.set(x,id==='move'?1.28:1.1,id==='move'?.22:0);orb.userData.energy=id;orb.visible=id!=='move'
  anchorTable.add(orb);tableOrbs.push(orb)
})
// The traveller uses the Between's lightweight player model and Walk clip. It is
// a temporary default figure; personal wardrobe and player data do not enter this lab.
const player = new THREE.Group()
player.name = 'lab-player'
player.position.set(1.25, 0.04, -2)
scene.add(player)
const carriedTriangle=new THREE.Group();carriedTriangle.visible=false;carriedTriangle.position.y=-.3
carriedTriangle.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,1.09+.76*Math.sqrt(3)/2,.35),new THREE.Vector3(-.38,1.09,.35),new THREE.Vector3(.38,1.09,.35)]),new THREE.LineBasicMaterial({color:0x9aedd5})))
player.add(carriedTriangle)
const carriedOrb=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),new THREE.MeshBasicMaterial({color:0xffffff}));carriedOrb.position.set(.34,1.2,.25);carriedOrb.visible=false;player.add(carriedOrb)
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

let entered = false, projected = false, arriving = false, target = null, route = [], orbitActive = false, viewingProjection = false
const wallTarget = new THREE.Vector3(1.5, 0, -3.1)
const stationTargets = { wall:wallTarget, anchors:new THREE.Vector3(-2.45,0,-1.15), loom:new THREE.Vector3(2.45,0,-1.15) }
const keys = new Set()
const floorPlane = new THREE.Plane(new THREE.Vector3(0,1,0),0)
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const tmp = new THREE.Vector3()
function clearKeys() { keys.clear(); target = null; arriving = false; route = [] }
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
function goTo(place) {
  if (!entered || wallOpen || stationOpen || reflectionOpen) return
  resumeRoom(); clearKeys(); orbitActive=false; arrivingAt=place
  const floorCenter=new THREE.Vector3(floor.position.x,0,floor.position.z+3.15-floorHeight/3)
  const dest=place==='floor' ? destination(floorCenter.clone().add(new THREE.Vector3(1.1,0,.35))) : stationTargets[place].clone()
  if(!dest) return
  // Cross behind the central furniture instead of oscillating against its boundary.
  if (player.position.x * dest.x < 0) {
    const side=Math.sign(player.position.x)
    route=[new THREE.Vector3(side*2.35,0,-2.35),new THREE.Vector3(-side*2.35,0,-2.35)]
  }
  route.push(dest);target=route.shift();arriving=true
  if(place==='floor') {
    const p=floorCenter.clone().add(new THREE.Vector3(1.5,2.7,3))
    const r=Math.hypot(p.x,p.z);if(r>5.2){p.x*=5.2/r;p.z*=5.2/r}
    camera.position.copy(p);camera.lookAt(floorCenter)
  }
  else if(place!=='wall') camera.lookAt(place==='anchors'?-3:3,1,-.8)
  approach.disabled=true; nextStation.disabled=true
  instruction.textContent = place === 'wall' ? 'Walking to the wall…' : place === 'anchors' ? 'Walking to the anchor table…' : place === 'floor' ? 'Carrying this to the triangle…' : 'Walking to the action loom…'
}
function goToWall() { goTo('wall') }
function setProjected(value) {
  clearKeys(); projected = value; floor.visible = value
  orbitActive=false;viewingProjection=value
  document.body.classList.toggle('projected', value)
  project.hidden = true; project.disabled = false
  approach.hidden = value; approach.disabled = false
  restart.hidden = !value
  resume.hidden = !value
  nextStation.hidden = !value || selection!==2; nextStation.disabled = false
  liftFloor.hidden=!value;placeTriangle.hidden=true;returnTriangle.hidden=true
  if (value) { stage='anchors'; nextStation.textContent='Go to the anchor table' }
  camera.position.set(0, value ? 2.8 : 3, value ? 5.2 : 5.1)
  if(value) camera.lookAt(floor.position.x,0,floor.position.z+3.15-floorHeight/3)
  else camera.lookAt(0,.9,-1)
  instruction.textContent = value ? 'The triangle is on the floor. Drag to look around your character.' : 'Tap the floor to walk. Drag to look around your character.'
  status.textContent = value ? `${selection === 0 ? 'Excitement · possibility · hope' : selection === 1 ? 'Wonder · poignance · hope' : 'Wonder · poignance · joy'}. ${selection===2?'Take an energy from the anchor table.':'Choose the Wonder · Poignance · Joy practice triangle to try EA anchors.'} Nothing is saved.` : ''
}
function resumeRoom() {
  if (wallOpen) return
  document.body.classList.remove('projected')
  if(viewingProjection) {camera.position.set(0,3,5.1);camera.lookAt(0,.9,-1);viewingProjection=false;orbitActive=false}
  if (projected) {
    instruction.textContent = 'Tap the floor to walk. Drag to look around your character.'
    status.textContent = 'The projected triangle remains on the floor. Nothing is saved.'
    approach.hidden = false; approach.disabled = false; resume.hidden = true
    nextStation.hidden = selection!==2; nextStation.disabled = false
  }
}
function openWall() {
  clearKeys(); wallOpen = true; nextStation.hidden=true; useStation.hidden=true
  wallView.hidden = false; wallView.setAttribute('aria-hidden','false')
  document.body.classList.add('wall-open')
  closeWall.focus()
}
function hideWall() {
  wallOpen = false; wallView.hidden = true; wallView.setAttribute('aria-hidden','true')
  document.body.classList.remove('wall-open')
  project.focus()
  if (projected && selection===2) {nextStation.hidden=false;nextStation.disabled=false}
}
const anchorInfo = [
  ['wonder','Wonder','Fear · Metal · satisfied (Wonder–Excitement)'],
  ['poignance','Poignance','Sadness · Water · satisfied'],
  ['joy','Joy','Joy · Wood · satisfied (Bliss)'],
]
const readDefaults={wonder:[3,'supportive'],poignance:[2,'mixed'],joy:[2,'supportive']}
const readFields={}
for(const [id,word] of anchorInfo) {
  const row=document.createElement('div');row.className='read-row'
  const label=document.createElement('label');label.textContent=word+' activation (0–3)'
  const output=document.createElement('output');output.textContent=String(readDefaults[id][0]);label.append(output)
  const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='3';slider.value=String(readDefaults[id][0]);slider.setAttribute('aria-label',word+' activation')
  slider.addEventListener('input',()=>{output.textContent=slider.value})
  const orientLabel=document.createElement('label');orientLabel.textContent=word+' orientation'
  const select=document.createElement('select');select.setAttribute('aria-label',word+' orientation')
  for(const v of ['unread','constricting','supportive','mixed']) {const o=document.createElement('option');o.value=v;o.textContent=v;select.append(o)}
  select.value=readDefaults[id][1];row.append(label,slider,orientLabel,select);document.getElementById('word-reads').append(row)
  readFields[id]={slider,select,output}
}
function renderAnchors() {
  const list=document.getElementById('anchor-list'); list.replaceChildren()
  for (const [id,word,reading] of anchorInfo) {
    const card=document.createElement('div');card.className='anchor-card'
    const title=document.createElement('h3');title.textContent=word
    const text=document.createElement('p');text.textContent='Proposed: '+reading
    const buttons=document.createElement('div');buttons.className='anchor-buttons'
    const options=decisions[id]==='confirmed' ? [['remove','Remove anchor']] : [['pickup','Pick up'],['declined','Not this'],['proposed','Leave unread']]
    for (const [value,label] of options) {
      const b=document.createElement('button');b.type='button';b.textContent=label
      b.setAttribute('aria-label',label+' '+word);b.setAttribute('aria-pressed',String(decisions[id]===value))
      b.addEventListener('click',()=>{
        if(value==='pickup') {pickUpEnergy(id);return}
        decisions[id]=value==='remove'?'proposed':value
        if(value==='remove') moveDone=false
        renderAnchors()
      });buttons.append(b)
    }
    card.append(title,text,buttons);list.append(card)
  }
  const triad=deriveExample(decisions)
  teachingOverlay.visible=selection===2 && Boolean(triad)
  tableOrbs.find(orb=>orb.userData.energy==='move').visible=Boolean(triad)
  for(const id of Object.keys(anchorMarkers)) anchorMarkers[id].visible=selection===2 && decisions[id]==='confirmed'
  if (triad) {
    anchorResult.textContent=`Confirmed teaching triangle: Wonder–Excitement / Metal → ${triad.shengEdges[0].moveName} → Poignance / Water → ${triad.shengEdges[1].moveName} → Bliss / Wood. ${triad.keClosingEdge.moveName} connects Metal to Wood. These are practice options, not a diagnosis.`
    pickMove.hidden=false;loomButton.hidden=!moveDone
  } else {
    const missing=anchorInfo.filter(([id])=>decisions[id]!=='confirmed').map(([,word])=>word)
    anchorResult.textContent='The optional teaching triangle needs confirmation of: '+missing.join(', ')+'. You can change any decision or return to the room.'
    pickMove.hidden=true;loomButton.hidden=true
  }
}
function pickUpEnergy(id) {
  heldEnergy=id;carriedOrb.material.color.setHex(id==='wonder'?0xd9e5ff:id==='poignance'?0x72c9ff:id==='joy'?0x83e1a3:0xffd98d)
  carriedOrb.visible=true;hideStation();useStation.hidden=true;stage='floor';nextStation.hidden=false;nextStation.disabled=false
  nextStation.textContent='Carry it to the triangle'
  instruction.textContent=id==='move'?'Carrying Deepen Value. Bring it to the triangle.':`Carrying ${id==='wonder'?'Metal':id==='poignance'?'Water':'Wood'}. Bring it to the ${id} line.`
}
pickMove.addEventListener('click',()=>{if(deriveExample(decisions)) pickUpEnergy('move')})
function applyMove() {
  if(heldEnergy!=='move' || !deriveExample(decisions)) return
  heldEnergy=null;carriedOrb.visible=false;useStation.hidden=true;clearKeys()
  moveStart=performance.now();moveSpark.visible=true;reflectionOpen=true;restart.hidden=true;liftFloor.hidden=true
  instruction.textContent='Watch Deepen Value travel from Wonder toward Poignance.'
  status.textContent='The animation is an invitation; it does not change your thought.'
  setTimeout(()=>{
    if(!reflectionOpen) return
    reflectionView.hidden=false;reflectionView.setAttribute('aria-hidden','false');document.body.classList.add('reflection-open')
    reflectionChoice.value='unchanged';document.getElementById('reflection-save').focus()
  },2300)
}
function finishReflection(accept) {
  const line=document.getElementById('reflection-line').value
  if(accept && reflectionChoice.value!=='unchanged') readFields[line].select.value=reflectionChoice.value
  moveDone=true;reflectionOpen=false;reflectionView.hidden=true;reflectionView.setAttribute('aria-hidden','true');document.body.classList.remove('reflection-open')
  restart.hidden=false;liftFloor.hidden=false
  stage='anchors';nextStation.hidden=false;nextStation.disabled=false;nextStation.textContent='Return to the anchor table'
  instruction.textContent='Your choice is held for this visit. Return to the table, or carry the triangle back to the wall.'
  status.textContent='Nothing is saved automatically.';nextStation.focus()
}
document.getElementById('reflection-save').addEventListener('click',()=>finishReflection(true))
document.getElementById('reflection-cancel').addEventListener('click',()=>finishReflection(false))
function renderForm(reset=true) {
  const form=resolveForm(phase.value); if (!form) return
  formDetail.replaceChildren()
  const heading=document.createElement('h3');heading.textContent=form.title
  const prompt=document.createElement('p');prompt.textContent=form.prompt
  const condition=document.createElement('p');condition.textContent='Complete when: '+form.condition
  formDetail.append(heading,prompt,condition)
  if(reset) nextStep.value=form.prompt
}
forms.forEach(form=>{const option=document.createElement('option');option.value=form.id;option.textContent=form.label;phase.append(option)})
phase.addEventListener('change',()=>renderForm())
function openStation(which) {
  if (which==='loom' && (!deriveExample(decisions) || !moveDone)) {stage='anchors';which='anchors'}
  clearKeys();wallOpen=false;stationOpen=true;stage=which;stationView.hidden=false;stationView.setAttribute('aria-hidden','false');document.body.classList.add('station-open')
  anchorPanel.hidden=which!=='anchors';loomPanel.hidden=which!=='loom';previewPanel.hidden=true
  document.getElementById('station-eyebrow').textContent=which==='anchors'?'ANCHOR TABLE':'ACTION LOOM'
  document.getElementById('station-title').textContent=which==='anchors'?'Try the connections':'Choose a next move'
  if(which==='anchors') renderAnchors(); else renderForm(false)
  stationClose.focus()
}
function hideStation() {
  stationOpen=false;stationView.hidden=true;stationView.setAttribute('aria-hidden','true');document.body.classList.remove('station-open')
  useStation.hidden=false;useStation.focus()
}
stationClose.addEventListener('click',hideStation)
document.getElementById('revise-wall').addEventListener('click',hideStation)
loomButton.addEventListener('click',()=>{hideStation();stage='loom';useStation.hidden=true;nextStation.hidden=false;nextStation.disabled=false;nextStation.textContent='Go to the action loom';instruction.textContent='Your connections are ready. Walk to the amber action loom.'})
document.getElementById('back-to-anchors').addEventListener('click',()=>{hideStation();stage='anchors';useStation.hidden=true;nextStation.hidden=false;nextStation.disabled=false;nextStation.textContent='Return to the anchor table';instruction.textContent='Return to the teal anchor table to revisit your choices.'})
document.getElementById('preview').addEventListener('click',()=>{
  const form=resolveForm(phase.value);if(!form || !deriveExample(decisions)) return
  const lines=[form.title, 'Life lens: Career', 'Container: Small dojo gathering', 'Current work and personal move: '+form.label, 'EA move: Activate Hope', 'Next step: '+nextStep.value, 'Complete when: '+form.condition]
  barDetail.replaceChildren();lines.forEach(line=>{const p=document.createElement('p');p.textContent=line;barDetail.append(p)})
  loomPanel.hidden=true;previewPanel.hidden=false;document.getElementById('station-eyebrow').textContent='BAR PREVIEW';document.getElementById('station-title').textContent='A possible next step'
})
document.getElementById('another-phase').addEventListener('click',()=>{previewPanel.hidden=true;loomPanel.hidden=false;document.getElementById('station-eyebrow').textContent='ACTION LOOM';document.getElementById('station-title').textContent='Choose a next move'})
document.getElementById('finish').addEventListener('click',hideStation)
renderForm()
choices.forEach((button,index)=>button.addEventListener('click',()=>{
  selection=index
  wallView.dataset.selected = String(index)
  choices.forEach((choice,i)=>choice.setAttribute('aria-pressed',String(i===index)))
  document.getElementById('constellation-art').hidden=index===2
  document.getElementById('teaching-art').hidden=index!==2
  updateLineLabels()
  if(index!==2) {teachingOverlay.visible=false;Object.values(anchorMarkers).forEach(m=>{m.visible=false})}
  else renderAnchors()
}))
document.getElementById('triangle-one').addEventListener('click',()=>choices[0].click())
document.getElementById('triangle-two').addEventListener('click',()=>choices[1].click())
choices[2].click()
closeWall.addEventListener('click',hideWall)
wallProject.addEventListener('click',()=>{
  hideWall();clearKeys();projected=false;floor.visible=false;carryingTriangle=true;carriedTriangle.visible=true
  project.hidden=true;approach.hidden=false;nextStation.hidden=true;useStation.hidden=true;resume.hidden=true;restart.hidden=false;liftFloor.hidden=true;returnTriangle.hidden=true;placeTriangle.hidden=false
  approach.textContent='Walk to the wall'
  instruction.textContent='You are carrying the triangle. Walk to a place in the room, then set it down.'
  status.textContent='Tap the floor to walk; drag to look around. Nothing is saved.';placeTriangle.focus()
})
placeTriangle.addEventListener('click',()=>{
  if(!carryingTriangle) return
  carryingTriangle=false;carriedTriangle.visible=false
  approach.textContent='Walk to the constellation'
  floor.position.set(player.position.x,0,player.position.z-(3.15-floorHeight/3))
  updateLineLabels();setProjected(true);renderAnchors();resume.focus()
})
liftFloor.addEventListener('click',()=>{
  if(!projected || heldEnergy) return
  carryingTriangle=true;carriedTriangle.visible=true;floor.visible=false;projected=false
  liftFloor.hidden=true;nextStation.hidden=true;resume.hidden=true;placeTriangle.hidden=false;approach.hidden=false
  approach.textContent='Walk to the wall'
  instruction.textContent='Carrying the triangle. Walk to the wall to return it, or place it somewhere else.'
})
returnTriangle.addEventListener('click',()=>{
  if(!carryingTriangle) return
  carryingTriangle=false;carriedTriangle.visible=false;returnTriangle.hidden=true;placeTriangle.hidden=true;project.hidden=false
  instruction.textContent='The triangle is back at the wall. Your confirmed choices stay for this visit.'
  wallLower.visible=selection!==2
  for(const id of Object.keys(wallMarkers)) wallMarkers[id].visible=selection===2 && decisions[id]==='confirmed'
  document.querySelector('.wall-note').textContent=selection===2?`This visit: Wonder ${readFields.wonder.select.value} · Poignance ${readFields.poignance.select.value} · Joy ${readFields.joy.select.value}. Confirmed anchors remain. Nothing is saved.`:'This example remains only for this visit. Nothing is saved.'
})
resume.addEventListener('click',resumeRoom)
nextStation.addEventListener('click',()=>goTo(stage === 'loom' ? 'loom' : stage === 'floor' ? 'floor' : 'anchors'))
useStation.addEventListener('click',()=>{
  if(stage!=='floor') {openStation(stage === 'loom' ? 'loom' : 'anchors');return}
  if(!heldEnergy || !projected) return
  if(heldEnergy==='move') {applyMove();return}
  decisions[heldEnergy]='confirmed';heldEnergy=null;carriedOrb.visible=false;useStation.hidden=true;stage='anchors'
  renderAnchors();nextStation.hidden=false;nextStation.textContent='Return to the anchor table';nextStation.disabled=false
  instruction.textContent=deriveExample(decisions)?'All three anchors are placed. Return to the table for a move.':'Anchor placed. Return to the table to pick up another energy.'
})
enter.addEventListener('click',()=>{
  entered = true; document.body.classList.add('entered'); enter.hidden = true
  approach.hidden = false
  instruction.textContent = 'Tap the floor to walk. Drag to look around your character. Tap the screen to approach it.'
})
approach.addEventListener('click',goToWall)
project.addEventListener('click',()=>{ if (entered && !project.disabled) openWall() })
restart.addEventListener('click',()=>{
  decisions={wonder:'proposed',poignance:'proposed',joy:'proposed'};teachingOverlay.visible=false;moveDone=false;carryingTriangle=false;heldEnergy=null;carriedTriangle.visible=false;carriedOrb.visible=false;moveSpark.visible=false
  Object.values(anchorMarkers).forEach(m=>{m.visible=false});Object.values(wallMarkers).forEach(m=>{m.visible=false});wallLower.visible=true;document.querySelector('.wall-note').textContent='These are examples. Nothing is saved.'
  for(const id of Object.keys(readFields)){const f=readFields[id];f.slider.value=String(readDefaults[id][0]);f.output.textContent=f.slider.value;f.select.value=readDefaults[id][1]}
  choices[2].click()
  phase.value=forms[0].id;renderForm();stage='wall';useStation.hidden=true;setProjected(false);player.position.set(1.25,.04,-2);approach.hidden=false
})
addEventListener('keydown', e=>{
  if (e.code === 'Escape' && reflectionOpen) { finishReflection(false); return }
  if (e.code === 'Escape' && stationOpen) { hideStation(); return }
  if (e.code === 'Escape' && wallOpen) { hideWall(); return }
  if (!entered || wallOpen || stationOpen || reflectionOpen || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return
  if (projected) resumeRoom()
  if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) { e.preventDefault(); target=null;route=[];arriving=false;approach.hidden=false;approach.disabled=false;project.hidden=true;keys.add(e.code) }
})
addEventListener('keyup',e=>keys.delete(e.code))
addEventListener('blur',clearKeys)
window.__dojoLabState = () => ({ x: player.position.x, z: player.position.z, entered, projected, carryingTriangle, heldEnergy, decisions:{...decisions},moveDone, walking: Boolean(target) || keys.size > 0, camera:camera.position.toArray(), floorSides:floorPoints.map((p,i)=>p.distanceTo(floorPoints[(i+1)%3])), wallSides:points.map((p,i)=>p.distanceTo(points[(i+1)%3])), lowerSides:[points[1].distanceTo(points[2]),points[1].distanceTo(lowerPoint),points[2].distanceTo(lowerPoint)] })
if (renderer) {
  const canvas=renderer.domElement
  let gesture=null
  canvas.addEventListener('pointerdown', e=>{
    if(!entered || wallOpen || stationOpen || reflectionOpen || gesture) return
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,dragged:false}
    canvas.setPointerCapture(e.pointerId)
  })
  canvas.addEventListener('pointermove', e=>{
    if(!gesture || gesture.id!==e.pointerId) return
    const dx=e.clientX-gesture.lastX,dy=e.clientY-gesture.lastY
    if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>8) gesture.dragged=true
    gesture.lastX=e.clientX;gesture.lastY=e.clientY
    if(!gesture.dragged) return
    const focus=player.position.clone().add(new THREE.Vector3(0,.7,0))
    const orbit=new THREE.Spherical().setFromVector3(camera.position.clone().sub(focus))
    orbit.radius=THREE.MathUtils.clamp(orbit.radius,2.5,7)
    orbit.theta-=dx*.008;orbit.phi=THREE.MathUtils.clamp(orbit.phi+dy*.006,.35,1.42)
    const next=focus.clone().add(new THREE.Vector3().setFromSpherical(orbit))
    const r=Math.hypot(next.x,next.z)
    if(r>5.3){next.x*=5.3/r;next.z*=5.3/r}
    next.y=THREE.MathUtils.clamp(next.y,1.1,4)
    camera.position.copy(next);camera.lookAt(focus);orbitActive=true;viewingProjection=false
  })
  canvas.addEventListener('pointercancel',()=>{gesture=null})
  renderer.domElement.addEventListener('pointerup', e=>{
    const dragged=gesture?.id===e.pointerId && gesture.dragged
    gesture=null
    if(dragged) return
    if (!entered || wallOpen || stationOpen || reflectionOpen) return
    if (projected && viewingProjection) resumeRoom()
    pointer.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1)
    raycaster.setFromCamera(pointer,camera)
    const pickedOrb=projected && selection===2 && !heldEnergy ? raycaster.intersectObjects(tableOrbs.filter(orb=>orb.visible))[0] : null
    if(pickedOrb) {
      const id=pickedOrb.object.userData.energy
      if(player.position.distanceTo(stationTargets.anchors)<1 && (id==='move'?Boolean(deriveExample(decisions)):decisions[id]!=='confirmed')) pickUpEnergy(id)
      else goTo('anchors')
      return
    }
    const edge=projected ? raycaster.intersectObjects(edgeHits)[0] : null
    if(edge) {
      const names=selection===2?['Wonder','Joy','Poignance']:selection===1?['Wonder','Hope','Poignance']:['Excitement','Hope','Possibility']
      const name=names[edge.object.userData.edge]
      instruction.textContent=heldEnergy && heldEnergy!=='move' ? `${name} line selected. Bring your energy to its named line and confirm before placing.` : `${name} is a player word. Select an energy at the table, or keep exploring.`
      return
    }
    if (raycaster.intersectObject(anchorTable,true).length && projected) { goTo('anchors'); return }
    if (raycaster.intersectObject(actionLoom,true).length && deriveExample(decisions) && moveDone) { stage='loom'; goTo('loom'); return }
    if (raycaster.intersectObject(hit).length) { if (!project.hidden && !project.disabled) openWall(); else goToWall(); return }
    if (raycaster.ray.intersectPlane(floorPlane,tmp)) {
      target = destination(tmp); route=[]; arriving = false; keys.clear()
      approach.disabled = false; project.hidden = true
      instruction.textContent = 'Tap the floor to walk. Drag to look around your character.'
    }
  })
  addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight) })
  const clock = new THREE.Clock()
  renderer.setAnimationLoop(()=>{
    const dt = Math.min(clock.getDelta(),.05)
    let dx = 0, dz = 0
    if (entered && !wallOpen && !stationOpen && !reflectionOpen) {
      dx = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'))
      dz = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'))
      if (target) {
        const delta = target.clone().sub(player.position); delta.y=0
        if (delta.length() < .12) {
          target = route.shift() ?? null
          if (!target && arriving) {
            arriving=false;approach.disabled=false;nextStation.disabled=false
            if (arrivingAt === 'wall') {
              approach.hidden=true;project.disabled=false
              if(carryingTriangle){project.hidden=true;returnTriangle.hidden=false;instruction.textContent='You are at the wall. Return your triangle or place it elsewhere.'}
              else {project.hidden=false;instruction.textContent='You are at the wall. Open the constellation to choose a triangle.'}
            } else if(arrivingAt==='floor') {
              stage='floor';useStation.hidden=false;nextStation.hidden=true
              useStation.textContent=heldEnergy==='move'?'Apply Deepen Value':`Confirm and place ${heldEnergy==='wonder'?'Metal on Wonder':heldEnergy==='poignance'?'Water on Poignance':'Wood on Joy'}`
              instruction.textContent='You are beside the triangle. Choose whether to apply what you carry.'
            } else { stage=arrivingAt;useStation.hidden=false;useStation.textContent=stage==='anchors'?'Use the anchor table':'Use the action loom';nextStation.hidden=true;instruction.textContent=stage==='anchors'?'Tap an energy orb, or use the table for named choices.':'You are at the action loom.' }
          }
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
      if (inRoom(next)) {
        if(orbitActive) camera.position.add(next.clone().sub(player.position))
        player.position.copy(next)
        if(orbitActive) camera.lookAt(player.position.clone().add(new THREE.Vector3(0,.7,0)))
      }
      player.rotation.y=Math.atan2(dx,dz)
    }
    if (walkAction) walkAction.paused = !moving
    if (mixer) mixer.update(dt)
    if(moveSpark.visible){const t=Math.min((performance.now()-moveStart)/2200,1);moveSpark.position.lerpVectors(anchorMarkers.wonder.position,anchorMarkers.poignance.position,t);moveSpark.position.y=.2+Math.sin(t*Math.PI)*.22;if(t>=1)moveSpark.visible=false}
    dojo.update(clock.elapsedTime); renderer.render(scene,camera)
  })
}
