import * as THREE from 'three';
import {makeWalker} from './walker.js';
import {sampleMotion,motionSpec,applyMotion} from './motion.js';
import {loadMocapReference,poseMocap,retargetRunDirections,loadJumpReference,poseJumpReference} from './mocap-reference.js';

const $=id=>document.getElementById(id), canvas=$('stage');
const settings=[['speed','Playback speed',.5,1.6,1,.05],['stride','Stride reach',.55,1.45,1,.05],['arm','Arm swing',.5,1.6,1,.05],['lean','Torso lean',.4,1.7,1,.05],['lift','Run flight',.2,1.8,1,.05],['jump','Jump height',.4,1.6,1,.05]];
const saved=JSON.parse(localStorage.getItem('cult-motion-lab')||'{}'), values={};
for(const [key,name,min,max,def,step] of settings){
  const label=document.createElement('label'),input=document.createElement('input'),read=document.createElement('span');
  input.type='range';input.id=key;input.min=min;input.max=max;input.step=step;input.value=saved[key]??def;
  label.textContent=name;label.append(read);$('sliders').append(label,input);
  values[key]=+input.value;read.textContent=values[key].toFixed(2);
  input.oninput=()=>{values[key]=+input.value;read.textContent=values[key].toFixed(2);localStorage.setItem('cult-motion-lab',JSON.stringify(values));renderPose()};
}
let W=null,ref=null,jumpRef=null,ledge=null,who='f',motion='walk',playing=true,clock=0,previous=0,groundY=0;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
const camera=new THREE.PerspectiveCamera(25,1,.05,40);
let orbitYaw=0,orbitPitch=.03,orbitZoom=1,drag=null;
canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,yaw:orbitYaw,pitch:orbitPitch};canvas.setPointerCapture(e.pointerId)};
canvas.onpointermove=e=>{if(!drag)return;orbitYaw=drag.yaw+(e.clientX-drag.x)*.008;orbitPitch=THREE.MathUtils.clamp(drag.pitch+(e.clientY-drag.y)*.006,-.6,.75);renderPose()};
canvas.onpointerup=()=>{drag=null};
canvas.onwheel=e=>{e.preventDefault();orbitZoom=THREE.MathUtils.clamp(orbitZoom*Math.exp(e.deltaY*.001),.65,1.8);renderPose()};
function size(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
addEventListener('resize',size);size();
function duration(){return motion==='walk'?1.2:motionSpec(motion).duration}
function renderPose(){if(!W)return;
  const F=W.X.F;
  W.holder.position.set(0,0,0);
  if(motion==='walk'){
    W.previewWalk(clock/duration()*Math.PI*2,values.stride);
    $('contact').textContent='Existing procedural walk · review cadence and foot travel';
  }else if(motion==='run'&&ref){
    const source=ref.run;poseMocap(ref,'run',clock/duration()*source.length/source.fps);
    retargetRunDirections(F,ref,{stride:values.stride,arm:values.arm,lean:values.lean,groundY});
    const draft=sampleMotion('run',clock);F.root.position.y+=draft.rootUp*values.lift;
    $('contact').textContent=`CMU run directions on cultivator · source travel ${source.travel.toFixed(2)} m/cycle`;
  }else{
    const s=sampleMotion(motion,clock);
    s.legs=s.legs.map(x=>x*values.stride);s.knees=s.knees.map(x=>x*values.stride);
    s.arms=s.arms.map(x=>x*values.arm);s.elbows=s.elbows.map(x=>x*values.arm);
    s.lean*=values.lean;s.rootUp*=motion==='jump'?values.jump:values.lift;
    applyMotion(F,s,groundY);$('contact').textContent=`Contact intent: ${s.contact} · travel ${s.rootForward.toFixed(2)} m`;
    if(motion==='climb')W.holder.position.copy(F.fr.f).multiplyScalar(s.rootForward);
  }
  if(ledge)ledge.visible=motion==='climb';
  F.root.updateMatrixWorld(true);
  const comparing=!!(ref&&['walk','run','jump'].includes(motion)),target=F.fr.f.clone().multiplyScalar(comparing?.62:0).add(new THREE.Vector3(0,.92,0));
  const orbit=F.fr.l.clone().applyAxisAngle(new THREE.Vector3(0,1,0),orbitYaw).multiplyScalar(Math.cos(orbitPitch));
  orbit.y=Math.sin(orbitPitch);
  camera.position.copy(orbit).multiplyScalar((comparing?7.2:4.6)*orbitZoom).add(target);camera.lookAt(target);
  if(ref){ref.group.visible=ref.helper.visible=motion==='walk'||motion==='run';
    if(ref.group.visible){const source=motion==='run'?ref.run:ref.walk;poseMocap(ref,motion,clock/duration()*source.length/source.fps)}}
  if(jumpRef){jumpRef.group.visible=jumpRef.helper.visible=motion==='jump';if(jumpRef.group.visible)poseJumpReference(jumpRef,clock/duration()*jumpRef.clip.duration)}
  renderer.render(W.X.scene,camera);$('clock').textContent=`${motion} · ${clock.toFixed(2)} / ${duration().toFixed(2)} seconds`;
  $('time').value=Math.round((clock/duration())*1000);$('timeValue').textContent=clock.toFixed(2)+'s';
}
async function build(){if(W){if(ref)W.X.scene.remove(ref.group,ref.helper);if(jumpRef)W.X.scene.remove(jumpRef.group,jumpRef.helper);W.dispose()}
  W=await makeWalker({who,outfit:'B2'});W.X.scene.add(W.holder);groundY=W.X.F.root.position.y;
  if(!ref){ref=await loadMocapReference();ref.group.position.copy(W.X.F.fr.f).multiplyScalar(1.25);W.X.scene.add(ref.group,ref.helper)}
  else W.X.scene.add(ref.group,ref.helper);
  if(!jumpRef){jumpRef=await loadJumpReference();jumpRef.group.position.copy(W.X.F.fr.f).multiplyScalar(1.25);W.X.scene.add(jumpRef.group,jumpRef.helper)}
  else W.X.scene.add(jumpRef.group,jumpRef.helper);
  ledge=new THREE.Mesh(new THREE.BoxGeometry(1.15,.72,1.05),new THREE.MeshStandardMaterial({color:0x77746c,roughness:.95}));
  ledge.position.copy(W.X.F.fr.f).multiplyScalar(.92);ledge.position.y=.36;W.X.scene.add(ledge);
  clock=0;renderPose()}
function frame(now){const dt=Math.min(.05,(now-previous)/1000||0);previous=now;if(playing&&W){clock+=dt*values.speed;if(clock>duration())clock=motion==='jump'||motion==='climb'?0:clock%duration();renderPose()}requestAnimationFrame(frame)}
requestAnimationFrame(frame);
for(const button of document.querySelectorAll('[data-motion]'))button.onclick=()=>{motion=button.dataset.motion;clock=0;for(const b of document.querySelectorAll('[data-motion]'))b.setAttribute('aria-pressed',String(b===button));renderPose()};
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'Pause':'Play'};
$('time').oninput=()=>{playing=false;$('play').textContent='Play';clock=(+$('time').value/1000)*duration();renderPose()};
$('body').onchange=async()=>{who=$('body').value;await build()};
$('reset').onclick=()=>{for(const [key,, , ,def] of settings){$(key).value=def;$(key).dispatchEvent(new Event('input'))}};
async function showNotes(){
  try{const text=await (await fetch('./review-notes.jsonl?at='+Date.now())).text(),notes=text.trim().split('\n').filter(Boolean).map(JSON.parse);
    $('savedNotes').replaceChildren();for(const item of notes.slice(-12).reverse()){
      const p=document.createElement('p');p.textContent=`${item.motion}${item.time_seconds!=null?' · '+item.time_seconds+'s':''}: ${item.note}`;$('savedNotes').append(p)}
  }catch(e){$('noteStatus').textContent='Could not load saved notes: '+e.message}
}
$('saveNote').onclick=async()=>{
  const note=$('note').value.trim();if(!note){$('noteStatus').textContent='Write a note first.';return}
  const body={motion,time_seconds:clock,settings:{...values,body:who,view:{yaw:orbitYaw,pitch:orbitPitch,zoom:orbitZoom}},note};
  try{const response=await fetch('/api/motion-notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!response.ok)throw Error(`server returned ${response.status}`);
    $('note').value='';$('noteStatus').textContent='Saved to the repo with this frame and settings.';await showNotes();
  }catch(e){$('noteStatus').textContent='Could not save to repo. Open the lab through the local motion lab server. '+e.message}
};
showNotes();
build().catch(e=>{$('error').textContent='Could not build character: '+e.message});
