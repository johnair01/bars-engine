import * as THREE from 'three';
import {makeWalker} from './walker.js';
import {sampleMotion,motionSpec,applyMotion} from './motion.js';
import {loadMocapReference,poseMocap,alignMocapFacing,retargetRunDirections,loadJumpReference,poseJumpReference} from './mocap-reference.js';
import {poseMotionCloth} from './motion-cloth.js';
import {sampleRunDynamics} from './run-dynamics.js';
import * as FG from './make/figure.js';

const $=id=>document.getElementById(id), canvas=$('stage');
const settings=[['speed','Playback speed',.5,1.6,1,.05],['stride','Stride reach',.55,1.45,1,.05],['arm','Arm swing',.5,1.6,1,.05],['lean','Torso lean',.4,1.7,1,.05],['clearance','Both arms clear torso',0,.65,.5,.025],['compression','Run compression',.4,1.8,1,.05],['lift','Run flight',.2,1.8,1,.05],['jump','Jump height',.4,1.6,1,.05]];
const poseDefaults={shoulderOutL:.1};
const saved=JSON.parse(localStorage.getItem('cult-motion-lab')||'{}'), values={};
for(const [key,name,min,max,def,step] of settings){
  const label=document.createElement('label'),input=document.createElement('input'),read=document.createElement('span');
  input.type='range';input.id=key;input.min=min;input.max=max;input.step=step;input.value=saved[key]??def;
  label.textContent=name;label.append(read);$('sliders').append(label,input);
  values[key]=+input.value;read.textContent=values[key].toFixed(2);
  input.oninput=()=>{values[key]=+input.value;read.textContent=values[key].toFixed(2);localStorage.setItem('cult-motion-lab',JSON.stringify(values));renderPose()};
}
const poseKeys=[['shoulderOutL','Left upper arm: out'],['shoulderForwardL','Left upper arm: forward'],['elbowOutL','Left forearm: out'],['elbowForwardL','Left forearm: forward'],['shoulderOutR','Right upper arm: out'],['shoulderForwardR','Right upper arm: forward'],['elbowOutR','Right forearm: out'],['elbowForwardR','Right forearm: forward']];
const poseSaved=JSON.parse(localStorage.getItem('cult-motion-pose')||'{}'),poseValues={};
for(const [key,name] of poseKeys){const label=document.createElement('label'),input=document.createElement('input'),read=document.createElement('span');
  input.type='range';input.min=-.6;input.max=.6;input.step=.025;input.value=poseSaved[key]??poseDefaults[key]??0;input.id=key;
  label.textContent=name;label.append(read);$('poseSliders').append(label,input);
  poseValues[key]=+input.value;read.textContent=poseValues[key].toFixed(2);
  input.oninput=()=>{poseValues[key]=+input.value;read.textContent=poseValues[key].toFixed(2);localStorage.setItem('cult-motion-pose',JSON.stringify(poseValues));renderPose()};}
let followRoot=false;
let W=null,ref=null,jumpRef=null,ledge=null,maskedIndex=null,who='f',buildKey='average',bodyHeight=1.66,heightEdited=false,buildSerial=0,soleMeshes=[],refFit=null,motion='walk',playing=true,clock=0,previous=0,groundY=0,standingFootY=0;
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
function duration(){return motion==='walk'?1.2:motion==='pose'?motionSpec('run').duration:motionSpec(motion).duration}
// Ground contact (spec FR-004/FR-005). The lowest vertex of the soles (boots; the body where a build has none) is the
// contact point. Contact phases solve the root height so that point stands on y = 0; flight phases keep the authored lift.
// The stance weight is 1 on a planted foot and fades over `ramp` so there is no step when a foot leaves or lands.
// ?legacy=1 restores the pre-solve behaviour (ball-joint grounding, 25% strike correction, unscaled references) so a
// 'before' frame can be reproduced from the same code.
const LEGACY=new URLSearchParams(location.search).has('legacy');
const sstep=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const runContact=h=>Math.min(1,1-sstep(.30,.44,h)+sstep(.84,1,h));                       // h: half-cycle phase, stance 0-.40
const jumpContact=t=>Math.min(1,1-sstep(.26,.30,t)+sstep(.90,.96,t));                      // grounded, preload; then landing, recovery
function lowestY(){const F=W.X.F,t=new THREE.Vector3();let m=Infinity;F.mesh.skeleton.update();
  for(const mesh of (soleMeshes.length?soleMeshes:[F.mesh])){mesh.updateWorldMatrix(true,false);const n=mesh.geometry.attributes.position.count;
    for(let i=0;i<n;i++){mesh.getVertexPosition(i,t).applyMatrix4(mesh.matrixWorld);if(t.y<m)m=t.y}}
  return m}
// The orange references are fixed-size rigs. Scale each to the selected figure by leg length (hip-knee-ankle chain; the
// body's own proportions, not the requested height alone) and lift it so its lowest toe joint over the cycle sits at the
// figure's standing ball-joint height. The jump BVH is authored at .05; its factor multiplies that.
function fitReferences(){
  const F=W.X.F,P=b=>b.getWorldPosition(new THREE.Vector3()),byName=(g,n)=>{let f=null;g.traverse(o=>{if(o.name===n&&!f)f=o});return f};
  W.X.scene.updateMatrixWorld(true);
  const charLeg=P(F.bones.hipL).distanceTo(P(F.bones.kneeL))+P(F.bones.kneeL).distanceTo(P(F.bones.ankleL));
  ref.group.scale.setScalar(1);ref.group.position.y=0;poseMocap(ref,'run',0);
  const leg=(g,a,b,c)=>P(byName(g,a)).distanceTo(P(byName(g,b)))+P(byName(g,b)).distanceTo(P(byName(g,c)));
  const scale=charLeg/leg(ref.group,'thigh.L','shin.L','foot.L'),floor={};
  ref.group.scale.setScalar(scale);
  for(const clip of ['walk','run']){let lo=Infinity;const c=ref[clip],n=36;
    for(let k=0;k<n;k++){poseMocap(ref,clip,k/n*c.length/c.fps);lo=Math.min(lo,P(byName(ref.group,'toe.L')).y,P(byName(ref.group,'toe.R')).y)}
    floor[clip]=standingFootY-lo}
  jumpRef.group.scale.setScalar(.05);jumpRef.group.position.y=0;poseJumpReference(jumpRef,0);
  const jumpScale=charLeg/leg(jumpRef.group,'LeftUpLeg','LeftLeg','LeftFoot');
  jumpRef.group.scale.setScalar(.05*jumpScale);let lo=Infinity;
  for(let k=0;k<=40;k++){poseJumpReference(jumpRef,jumpRef.clip.duration*k/40);lo=Math.min(lo,P(byName(jumpRef.group,'LeftToeBase')).y,P(byName(jumpRef.group,'RightToeBase')).y)}
  refFit={scale,jumpScale,floor,jumpFloor:standingFootY-lo,charLeg};
}
function renderPose(){if(!W)return;
  const F=W.X.F;
  canvas.dataset.runBounce='';
  W.holder.position.set(0,0,0);
  if(refFit){ref.group.scale.setScalar(refFit.scale);ref.group.position.y=refFit.floor[motion==='walk'?'walk':'run'];jumpRef.group.scale.setScalar(.05*refFit.jumpScale);jumpRef.group.position.y=refFit.jumpFloor}
  if(motion==='walk'){
    W.previewWalk(clock/duration()*Math.PI*2,values.stride);
    $('contact').textContent='Existing procedural walk · review cadence and foot travel';
  }else if((motion==='run'||motion==='pose')&&ref){
    const source=ref.run;poseMocap(ref,'run',clock/duration()*source.length/source.fps);
    retargetRunDirections(F,ref,{stride:values.stride,arm:values.arm,lean:values.lean,clearance:values.clearance,pose:poseValues,groundY});
    const bounce=sampleRunDynamics(clock/duration(),{compression:values.compression,flight:values.lift});
    canvas.dataset.runBounce=bounce.height.toFixed(4);
    F.root.position.y+=bounce.height;
    F.root.updateMatrixWorld(true);F.mesh.skeleton.update();
    // contact: the planted foot's sole stands on y = 0 through stance (the compression is the legs folding under it)
    if(LEGACY){const strikeDistance=Math.min(bounce.phase,1-bounce.phase),strikeT=Math.max(0,1-strikeDistance/.08),strike=strikeT*strikeT*(3-2*strikeT);
      const sole=Math.min(F.bones.ballL.getWorldPosition(new THREE.Vector3()).y,F.bones.ballR.getWorldPosition(new THREE.Vector3()).y);F.root.position.y+=(standingFootY-sole)*strike*.25}
    else{F.root.updateMatrixWorld(true);F.root.position.y-=lowestY()*runContact(bounce.phase);F.root.updateMatrixWorld(true);F.mesh.skeleton.update()}
    $('contact').textContent=`CMU limb directions · ${bounce.stage} · vertical ${bounce.height.toFixed(3)} m · source travel ${source.travel.toFixed(2)} m/cycle`;
    const P=n=>F.bones[n].getWorldPosition(new THREE.Vector3()),mid=P('shoulderL').add(P('shoulderR')).multiplyScalar(.5);
    const eL=P('elbowL').sub(mid).dot(F.fr.l),eR=-P('elbowR').sub(mid).dot(F.fr.l);
    $('alignment').textContent=`Elbow lateral position from torso center: left ${eL.toFixed(2)} m · right ${eR.toFixed(2)} m`;
  }else{
    const s=sampleMotion(motion,clock);
    s.legs=s.legs.map(x=>x*values.stride);s.knees=s.knees.map(x=>x*values.stride);
    s.arms=s.arms.map(x=>x*values.arm);s.elbows=s.elbows.map(x=>x*values.arm);
    s.lean*=values.lean;s.rootUp*=motion==='jump'?values.jump:values.lift;
    applyMotion(F,s,groundY);$('contact').textContent=`Contact intent: ${s.contact} · travel ${s.rootForward.toFixed(2)} m`;
    if(motion==='jump'){
      if(clock<=.2||clock>=.94)for(const side of ['L','R'])FG.aim(F,'ankle'+side,'ball'+side,F.fr.f);
      if(LEGACY){if(clock<=.2||clock>=.94){const sole=Math.min(F.bones.ballL.getWorldPosition(new THREE.Vector3()).y,F.bones.ballR.getWorldPosition(new THREE.Vector3()).y);F.root.position.y+=standingFootY-sole}}
      else{F.root.updateMatrixWorld(true);F.root.position.y-=lowestY()*jumpContact(clock);F.root.updateMatrixWorld(true);F.mesh.skeleton.update()}
    }
    if(motion==='jump'||motion==='climb')W.holder.position.copy(F.fr.f).multiplyScalar(s.rootForward);
  }
  if(ledge)ledge.visible=motion==='climb';
  poseMotionCloth(W.X,motion,clock/duration());
  W.holder.updateMatrixWorld(true);
  window.__motionLab={motion,rootForward:W.holder.position.dot(F.fr.f),rootUp:F.root.position.y-groundY};
  canvas.dataset.rootForward=window.__motionLab.rootForward.toFixed(3);
  canvas.dataset.rootUp=window.__motionLab.rootUp.toFixed(4);
  F.root.updateMatrixWorld(true);
  const comparing=!!(ref&&['walk','run','pose','jump'].includes(motion)),target=F.fr.f.clone().multiplyScalar(comparing?.62:0).add(new THREE.Vector3(0,.92,0));
  if(followRoot)target.add(new THREE.Vector3().copy(W.holder.position).projectOnVector(F.fr.f));
  const orbit=F.fr.l.clone().applyAxisAngle(new THREE.Vector3(0,1,0),orbitYaw).multiplyScalar(Math.cos(orbitPitch));
  orbit.y=Math.sin(orbitPitch);
  camera.position.copy(orbit).multiplyScalar((comparing?7.2:4.6)*orbitZoom).add(target);camera.lookAt(target);
  if(ref){ref.group.visible=ref.helper.visible=['walk','run','pose'].includes(motion);
    if(ref.group.visible){const source=motion==='walk'?ref.walk:ref.run;poseMocap(ref,motion==='walk'?'walk':'run',clock/duration()*source.length/source.fps)}}
  if(jumpRef){jumpRef.group.visible=jumpRef.helper.visible=motion==='jump';if(jumpRef.group.visible)poseJumpReference(jumpRef,clock/duration()*jumpRef.clip.duration)}
  renderer.render(W.X.scene,camera);$('clock').textContent=`${motion} · ${clock.toFixed(2)} / ${duration().toFixed(2)} seconds`;
  $('posePanel').hidden=!['run','pose'].includes(motion);
  $('time').value=Math.round((clock/duration())*1000);$('timeValue').textContent=clock.toFixed(2)+'s';
}
async function build(){const serial=++buildSerial,previous=W;W=null;
  if(previous){if(ref)previous.X.scene.remove(ref.group,ref.helper);if(jumpRef)previous.X.scene.remove(jumpRef.group,jumpRef.helper);previous.dispose()}
  const next=await makeWalker({who,build:buildKey,height:bodyHeight,outfit:'B2'});if(serial!==buildSerial){next.dispose();return}
  W=next;W.X.scene.add(W.holder);groundY=W.X.F.root.position.y;
  $('error').textContent='';
  $('mixReadout').textContent=`${who==='f'?'Feminine':'Masculine'} · ${buildKey} · ${W.X.F.stature.toFixed(2)} m`;
  canvas.dataset.body=who;canvas.dataset.build=buildKey;canvas.dataset.height=W.X.F.stature.toFixed(2);
  standingFootY=Math.min(W.X.F.bones.ballL.getWorldPosition(new THREE.Vector3()).y,W.X.F.bones.ballR.getWorldPosition(new THREE.Vector3()).y);
  soleMeshes=W.X.parts.filter(p=>p.mesh&&/^boots/.test(p.name)&&p.mesh.visible).map(p=>p.mesh);
  maskedIndex=W.X.F.mesh.geometry.index.clone();setBodyVisibility();
  if(!ref)ref=await loadMocapReference();
  ref.group.position.copy(W.X.F.fr.f).multiplyScalar(1.25);W.X.scene.add(ref.group,ref.helper);alignMocapFacing(ref,W.X.F.fr.f);
  if(!jumpRef){jumpRef=await loadJumpReference();jumpRef.group.position.copy(W.X.F.fr.f).multiplyScalar(1.25);W.X.scene.add(jumpRef.group,jumpRef.helper)}
  else W.X.scene.add(jumpRef.group,jumpRef.helper);
  if(!LEGACY)fitReferences();
  ledge=new THREE.Mesh(new THREE.BoxGeometry(1.15,.72,1.05),new THREE.MeshStandardMaterial({color:0x77746c,roughness:.95}));
  ledge.position.copy(W.X.F.fr.f).multiplyScalar(.92);ledge.position.y=.36;W.X.scene.add(ledge);
  clock=0;renderPose()}
function setBodyVisibility(){if(!W)return;const bodyOnly=$('bodyOnly').checked,F=W.X.F;
  F.mesh.geometry.setIndex(bodyOnly?F.idx0:maskedIndex);
  for(const part of W.X.parts){if(part.mesh)part.mesh.visible=!bodyOnly;if(part.back)part.back.visible=!bodyOnly;if(part.static)part.static.visible=false;if(part.staticB)part.staticB.visible=false}
}
$('bodyOnly').onchange=()=>{setBodyVisibility();renderPose()};
function frame(now){const dt=Math.min(.05,(now-previous)/1000||0);previous=now;if(playing&&W){clock+=dt*values.speed;if(clock>duration())clock=motion==='pose'?duration():motion==='jump'||motion==='climb'?0:clock%duration();renderPose()}requestAnimationFrame(frame)}
requestAnimationFrame(frame);
for(const button of document.querySelectorAll('[data-motion]'))button.onclick=()=>{motion=button.dataset.motion;clock=0;if(motion==='pose'){playing=false;$('play').textContent='Play'}for(const b of document.querySelectorAll('[data-motion]'))b.setAttribute('aria-pressed',String(b===button));renderPose()};
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'Pause':'Play'};
$('time').oninput=()=>{playing=false;$('play').textContent='Play';clock=(+$('time').value/1000)*duration();renderPose()};
const rebuild=()=>build().catch(e=>{$('error').textContent='Could not build character: '+e.message});
$('body').onchange=()=>{who=$('body').value;if(!heightEdited){bodyHeight=who==='f'?1.66:1.75;$('height').value=bodyHeight;$('heightValue').textContent=bodyHeight.toFixed(2)+' m'}rebuild()};
$('build').onchange=()=>{buildKey=$('build').value;rebuild()};
let heightTimer=null;
$('height').oninput=()=>{$('heightValue').textContent=(+$('height').value).toFixed(2)+' m';clearTimeout(heightTimer);heightTimer=setTimeout(()=>{bodyHeight=+$('height').value;heightEdited=true;rebuild()},180)};
$('height').onchange=()=>{clearTimeout(heightTimer);if(bodyHeight===+$('height').value)return;bodyHeight=+$('height').value;heightEdited=true;rebuild()};
$('reset').onclick=()=>{for(const [key,, , ,def] of settings){$(key).value=def;$(key).dispatchEvent(new Event('input'))}for(const [key] of poseKeys){$(key).value=poseDefaults[key]??0;$(key).dispatchEvent(new Event('input'))}};
async function showNotes(){
  try{const text=await (await fetch('./review-notes.jsonl?at='+Date.now())).text(),notes=text.trim().split('\n').filter(Boolean).map(JSON.parse);
    $('savedNotes').replaceChildren();for(const item of notes.slice(-12).reverse()){
      const p=document.createElement('p');p.textContent=`${item.motion}${item.time_seconds!=null?' · '+item.time_seconds+'s':''}: ${item.note}`;$('savedNotes').append(p)}
  }catch(e){$('noteStatus').textContent='Could not load saved notes: '+e.message}
}
$('saveNote').onclick=async()=>{
  const note=$('note').value.trim();if(!note){$('noteStatus').textContent='Write a note first.';return}
  const body={motion,time_seconds:clock,settings:{...values,...poseValues,body:who,build:buildKey,height:bodyHeight,view:{yaw:orbitYaw,pitch:orbitPitch,zoom:orbitZoom}},note};
  try{const response=await fetch('/api/motion-notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!response.ok)throw Error(`server returned ${response.status}`);
    $('note').value='';$('noteStatus').textContent='Saved to the repo with this frame and settings.';await showNotes();
  }catch(e){$('noteStatus').textContent='Could not save to repo. Open the lab through the local motion lab server. '+e.message}
};
// Review hook for scripted measurement (tools/blender-cloud/tests/motion_measure.mjs). Read-only handles plus exact
// seconds/phase control; the viewer's own renderPose() still does all the posing, so a measurement sees what a reviewer sees.
window.__motionLabControl={
  get walker(){return W},get ref(){return ref},get jumpRef(){return jumpRef},get groundY(){return groundY},get refFit(){return refFit},get soleMeshes(){return soleMeshes},get standingFootY(){return standingFootY},
  get values(){return values},get duration(){return duration()},
  set(name,seconds){motion=name;playing=false;clock=seconds;for(const b of document.querySelectorAll('[data-motion]'))b.setAttribute('aria-pressed',String(b.dataset.motion===name));renderPose()},
  follow(on){followRoot=on;renderPose()},
  bodyOnly(on){$('bodyOnly').checked=on;setBodyVisibility();renderPose()},
  async rebuild(next){if(next.who)who=next.who;if(next.build)buildKey=next.build;if(next.height)bodyHeight=next.height;heightEdited=true;await build()},
};
showNotes();
build().catch(e=>{$('error').textContent='Could not build character: '+e.message});
