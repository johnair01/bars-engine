// Read the compact CMU walk/run channels baked for the earlier cave player.
// Kept separate from the cultivator rig so it serves as a motion reference.
import * as THREE from 'three';
import {BVHLoader} from 'three/addons/loaders/BVHLoader.js';
import * as FG from './make/figure.js';
export const RUN_RIG_MAP={
  frame:{left:['upper_arm.R','upper_arm.L'],forward:['foot.L','toe.L','foot.R','toe.R'],up:'+Y'},
  torso:['spine','spine.003','hips','spine01'],
  L:[['thigh.L','shin.L','hipL','kneeL'],['shin.L','foot.L','kneeL','ankleL'],['upper_arm.L','forearm.L','shoulderL','elbowL'],['forearm.L','hand.L','elbowL','wristL']],
  R:[['thigh.R','shin.R','hipR','kneeR'],['shin.R','foot.R','kneeR','ankleR'],['upper_arm.R','forearm.R','shoulderR','elbowR'],['forearm.R','hand.R','elbowR','wristR']],
};
export async function loadMocapReference(){
  const buf=await (await fetch('./reference-cmu-walk-run.glb')).arrayBuffer(),dv=new DataView(buf),jl=dv.getUint32(12,true);
  const j=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,20,jl))),bin=20+jl+8,rig=j.nodes[0].extras;
  function view(i,C){const v=j.bufferViews[i];return new C(buf.slice(bin+(v.byteOffset||0),bin+(v.byteOffset||0)+v.byteLength))}
  function clip(info){const frames=view(info.frames,Uint16Array),values=view(info.values,Int16Array);let fi=0,vi=0;
    return {fps:info.fps,length:info.length,travel:info.travel,channels:info.channels.map(([joint,path,n])=>{
      const width=path==='r'?4:3,ks=[];
      for(let k=0;k<n;k++)ks.push({f:frames[fi++],v:Array.from({length:width},()=>values[vi++]/32767)});
      return {joint,path,keys:ks};
    })};
  }
  const bones=rig.joints.map(([name,,pos,rot])=>{const b=new THREE.Bone();b.name=name;b.position.fromArray(pos);b.quaternion.fromArray(rot);return b});
  rig.joints.forEach((row,i)=>{if(row[1]>=0)bones[row[1]].add(bones[i])});
  const group=new THREE.Group();rig.joints.forEach((row,i)=>{if(row[1]<0)group.add(bones[i])});
  const helper=new THREE.SkeletonHelper(group);helper.material.vertexColors=false;helper.material.color.set(0xc75a35);helper.material.depthTest=false;
  const walk=clip(rig.walk),run=clip(rig.run);
  const hipY=run.channels.find(ch=>ch.joint===0&&ch.path==='t').keys.map(k=>k.v[1]);
  return {group,helper,bones,walk,run,runHipMin:Math.min(...hipY),runHipMax:Math.max(...hipY)};
}
const qa=new THREE.Quaternion(),qb=new THREE.Quaternion();
function at(ch,f){const keys=ch.keys;let i=0;while(i<keys.length-2&&keys[i+1].f<f)i++;
  const a=keys[i],b=keys[i+1],u=Math.max(0,Math.min(1,(f-a.f)/(b.f-a.f||1)));
  if(ch.path==='r')return qa.fromArray(a.v).slerp(qb.fromArray(b.v),u).clone();
  return new THREE.Vector3().fromArray(a.v).lerp(new THREE.Vector3().fromArray(b.v),u);
}
export function poseMocap(ref,name,t){const clip=name==='run'?ref.run:ref.walk;if(!clip)return;
  const f=(t*clip.fps)%clip.length;
  for(const ch of clip.channels){const b=ref.bones[ch.joint],v=at(ch,f);if(ch.path==='r')b.quaternion.copy(v);else b.position.copy(v)}
  ref.group.updateMatrixWorld(true);ref.helper.updateMatrixWorld(true);
}
export function alignMocapFacing(ref,targetForward){
  ref.group.rotation.y=0;poseMocap(ref,'run',0);
  const P=n=>ref.bones.find(b=>b.name===n).getWorldPosition(new THREE.Vector3());
  const a=P('toe.L').sub(P('foot.L')).add(P('toe.R').sub(P('foot.R'))).setY(0).normalize();
  const b=targetForward.clone().setY(0).normalize();
  const yaw=Math.atan2(a.z*b.x-a.x*b.z,a.x*b.x+a.z*b.z);
  ref.group.rotation.y=yaw;ref.group.updateMatrixWorld(true);
  return yaw;
}
export async function loadJumpReference(){
  const source=await (await fetch('./reference-cmu-16-05-jump.bvh')).text();
  const {skeleton,clip}=new BVHLoader().parse(source),group=new THREE.Group();group.add(skeleton.bones[0]);
  group.scale.setScalar(.05);
  const helper=new THREE.SkeletonHelper(group);helper.material.vertexColors=false;helper.material.color.set(0xc75a35);helper.material.depthTest=false;
  const mixer=new THREE.AnimationMixer(group),action=mixer.clipAction(clip);action.play();
  return {group,helper,mixer,clip};
}
export function poseJumpReference(ref,t){ref.mixer.setTime(Math.min(t,ref.clip.duration));ref.group.updateMatrixWorld(true);ref.helper.updateMatrixWorld(true)}

// Transfer the captured joint *directions*, not the source rig's local bone
// rotations. The rigs have different rest axes, so copying quaternions would
// twist the cultivator. Reach and arm controls scale only the forward component.
export function retargetRunDirections(F,ref,{stride=1,arm=1,lean=1,groundY=0,clearance=.2,pose={}}={}){
  FG.resetPose(F);ref.group.updateMatrixWorld(true);
  const byName=Object.fromEntries(ref.bones.map(b=>[b.name,b]));
  const P=n=>byName[n].getWorldPosition(new THREE.Vector3());
  const up=new THREE.Vector3(0,1,0),left=P('upper_arm.L').sub(P('upper_arm.R')).setY(0).normalize();
  const forward=P('toe.L').sub(P('foot.L')).add(P('toe.R').sub(P('foot.R'))).setY(0).normalize();
  const srcForward=forward.lengthSq()>.1?forward:new THREE.Vector3().crossVectors(left,up).normalize();
  const srcLeft=left.addScaledVector(srcForward,-left.dot(srcForward)).normalize();
  const targetDir=(a,b,scale)=>{
    const d=P(b).sub(P(a)).normalize(),lat=d.dot(srcLeft),fw=d.dot(srcForward)*scale;
    return up.clone().multiplyScalar(d.y).addScaledVector(F.fr.l,lat).addScaledVector(F.fr.f,fw).normalize();
  };
  const torso=targetDir('spine','spine.003',lean);
  FG.aim(F,'hips','spine01',torso);
  for(const side of ['L','R']){
    const s=side,[[thigh,knee,hipTarget,kneeTarget],[shin,ankle,shinTarget,ankleTarget],[upperArm,forearm,shoulderTarget,elbowTarget],[lowerArm,hand,forearmTarget,wristTarget]]=RUN_RIG_MAP[s];
    FG.aim(F,hipTarget,kneeTarget,targetDir(thigh,knee,stride));
    FG.aim(F,shinTarget,ankleTarget,targetDir(shin,ankle,stride));
    const sg=s==='L'?1:-1;
    const upper=targetDir(upperArm,forearm,arm)
      .addScaledVector(F.fr.l,sg*(clearance+(pose['shoulderOut'+s]||0)))
      .addScaledVector(F.fr.f,pose['shoulderForward'+s]||0).normalize();
    FG.aim(F,shoulderTarget,elbowTarget,upper);
    const lower=targetDir(lowerArm,hand,arm)
      .addScaledVector(F.fr.l,sg*(clearance*.35+(pose['elbowOut'+s]||0)))
      .addScaledVector(F.fr.f,pose['elbowForward'+s]||0).normalize();
    FG.aim(F,forearmTarget,wristTarget,lower);
  }
  F.root.position.y=groundY;F.root.updateMatrixWorld(true);F.mesh.skeleton.update();F.poseName='run-mocap';
}
