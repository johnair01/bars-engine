// Read the compact CMU walk/run channels baked for the earlier cave player.
// Kept separate from the cultivator rig so it serves as a motion reference.
import * as THREE from 'three';
import {BVHLoader} from 'three/addons/loaders/BVHLoader.js';
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
  return {group,helper,bones,walk:clip(rig.walk),run:clip(rig.run)};
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
export async function loadJumpReference(){
  const source=await (await fetch('./reference-cmu-16-05-jump.bvh')).text();
  const {skeleton,clip}=new BVHLoader().parse(source),group=new THREE.Group();group.add(skeleton.bones[0]);
  group.scale.setScalar(.05);
  const helper=new THREE.SkeletonHelper(group);helper.material.vertexColors=false;helper.material.color.set(0xc75a35);helper.material.depthTest=false;
  const mixer=new THREE.AnimationMixer(group),action=mixer.clipAction(clip);action.play();
  return {group,helper,mixer,clip};
}
export function poseJumpReference(ref,t){ref.mixer.setTime(Math.min(t,ref.clip.duration));ref.group.updateMatrixWorld(true);ref.helper.updateMatrixWorld(true)}
