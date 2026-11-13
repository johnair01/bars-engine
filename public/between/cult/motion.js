// First authored movement vocabulary for the cultivator rig. Coordinates are
// metres in the character frame: forward is F.fr.f, left is F.fr.l, up is Y.
// Each clip owns its root trajectory and named contact events. The locomotion
// controller can consume the same samples that the garment review uses.
import * as THREE from 'three';
import * as FG from './make/figure.js';

const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const ease = x => x*x*(3-2*x);
const hermite=(a,b,va,vb,u,span)=>{const t=Math.max(0,Math.min(1,u));return (2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*span*va+(-2*t**3+3*t*t)*b+(t**3-t*t)*span*vb};
// Takeoff at .28 s; gravity gives an apex near .60 s and lands at .96 s.
// Horizontal speed stays continuous through flight instead of easing to zero
// at each pose key. Landing absorbs vertical velocity before recovery.
function jumpTrajectory(t,z,y){
  const gravity=9.81,air=.68,takeoffY=.04,landingY=-.09;
  const vy=(landingY-takeoffY+.5*gravity*air*air)/air,vx=(1.48-.25)/air;
  if(t>=.18&&t<.28){const u=(t-.18)/.10;return {z:hermite(.08,.25,.5,vx,u,.10),y:hermite(-.11,takeoffY,0,vy,u,.10)}}
  if(t>=.28&&t<=.96){const dt=t-.28;return {z:.25+vx*dt,y:takeoffY+vy*dt-.5*gravity*dt*dt}}
  if(t>.96){const u=(t-.96)/.16;return {z:hermite(1.48,1.68,vx,0,u,.16),y:hermite(landingY,0,0,0,u,.16)}}
  return {z,y};
}
const KEYS = {
  run: {duration:0.64, loop:true, keys:[
    {t:0, z:0, y:0, lean:.12, legs:[.60,-.48], knees:[-.55,-.12], arms:[-.58,.55], elbows:[.43,.35], contact:'left foot strike'},
    {t:.16, z:.48, y:.075, lean:.16, legs:[-.10,.22], knees:[-.78,-.62], arms:[.18,-.22], elbows:[.55,.48], contact:'flight'},
    {t:.32, z:.96, y:0, lean:.12, legs:[-.48,.60], knees:[-.12,-.55], arms:[.55,-.58], elbows:[.35,.43], contact:'right foot strike'},
    {t:.48, z:1.44, y:.075, lean:.16, legs:[.22,-.10], knees:[-.62,-.78], arms:[-.22,.18], elbows:[.48,.55], contact:'flight'},
    {t:.64, z:1.92, y:0, lean:.12, legs:[.60,-.48], knees:[-.55,-.12], arms:[-.58,.55], elbows:[.43,.35], contact:'left foot strike'},
  ]},
  jump: {duration:1.12, loop:false, keys:[
    {t:0,z:0,y:0,lean:0,legs:[0,0],knees:[0,0],arms:[0,0],elbows:[.2,.2],contact:'grounded'},
    {t:.18,z:.08,y:-.11,lean:.16,legs:[.36,.36],knees:[-.8,-.8],arms:[-.42,-.42],elbows:[.7,.7],contact:'loaded crouch'},
    {t:.28,z:.25,y:.04,lean:-.08,legs:[-.16,-.16],knees:[-.08,-.08],arms:[.45,.45],elbows:[.55,.55],contact:'takeoff'},
    {t:.58,z:.82,y:.52,lean:.05,legs:[.32,-.12],knees:[-.58,-.45],arms:[.24,.24],elbows:[.72,.72],contact:'apex'},
    {t:.86,z:1.37,y:.12,lean:.17,legs:[.38,.24],knees:[-.74,-.7],arms:[-.28,-.28],elbows:[.7,.7],contact:'descent'},
    {t:.96,z:1.48,y:-.09,lean:.22,legs:[.40,.38],knees:[-.86,-.82],arms:[-.52,-.52],elbows:[.64,.64],contact:'landing'},
    {t:1.12,z:1.68,y:0,lean:0,legs:[0,0],knees:[0,0],arms:[0,0],elbows:[.2,.2],contact:'recovered'},
  ]},
  climb: {duration:1.8, loop:false, ledgeHeight:.72, keys:[
    {t:0,z:0,y:0,lean:0,legs:[0,0],knees:[0,0],arms:[0,0],elbows:[.2,.2],contact:'approach'},
    {t:.30,z:.08,y:0,lean:.25,legs:[.10,-.1],knees:[-.25,-.10],arms:[1.5,1.5],elbows:[1.25,1.25],contact:'both hands on ledge'},
    {t:.62,z:.17,y:.06,lean:.32,legs:[1.0,-.36],knees:[-1.15,-.4],arms:[1.45,1.45],elbows:[.85,.85],contact:'left foot on ledge'},
    {t:1.02,z:.47,y:.42,lean:.43,legs:[.82,.28],knees:[-.86,-.9],arms:[1.05,1.05],elbows:[.58,.58],contact:'push and pull'},
    {t:1.42,z:.88,y:.72,lean:.22,legs:[.32,.45],knees:[-.38,-.72],arms:[.48,.48],elbows:[.44,.44],contact:'right foot on ledge'},
    {t:1.8,z:1.18,y:.72,lean:0,legs:[0,0],knees:[0,0],arms:[0,0],elbows:[.2,.2],contact:'standing above ledge'},
  ]},
};

export const MOTIONS = Object.freeze(Object.keys(KEYS));
export const motionSpec = name => KEYS[name];
export function sampleMotion(name, seconds) {
  const clip=KEYS[name]; if(!clip) throw new Error(`Unknown motion: ${name}`);
  const cycle=clip.loop ? Math.max(0,Math.ceil(seconds/clip.duration)-1) : 0;
  const t=clip.loop ? Math.max(0,seconds-cycle*clip.duration) : Math.max(0,Math.min(seconds,clip.duration));
  const keys=clip.keys; let i=0; while(i<keys.length-2 && keys[i+1].t<t) i++;
  const a=keys[i],b=keys[i+1],u=ease((t-a.t)/(b.t-a.t));
  const scalar=k=>a[k]+(b[k]-a[k])*u;
  const pair=k=>a[k].map((v,j)=>v+(b[k][j]-v)*u);
  const path=name==='jump'?jumpTrajectory(t,scalar('z'),scalar('y')):{z:scalar('z'),y:scalar('y')};
  return {name,t,seconds,rootForward:path.z+cycle*keys.at(-1).z,rootUp:path.y,lean:scalar('lean'),
    legs:pair('legs'),knees:pair('knees'),arms:pair('arms'),elbows:pair('elbows'),contact:u<.5?a.contact:b.contact};
}

// Pose only the rig. The returned root trajectory belongs to the caller, so
// gameplay can run collision/ledge resolution before applying displacement.
export function applyMotion(F, sample, groundY=0) {
  FG.resetPose(F);
  const {f,l}=F.fr, down=V(0,-1,0);
  F.bones.hips.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(l,sample.lean));
  for(const [j,s,sg] of [[0,'L',1],[1,'R',-1]]) {
    FG.aim(F,'hip'+s,'knee'+s,down.clone().addScaledVector(l,sg*.045).addScaledVector(f,sample.legs[j]));
    FG.aim(F,'knee'+s,'ankle'+s,down.clone().addScaledVector(l,sg*.03).addScaledVector(f,sample.knees[j]));
    FG.aim(F,'shoulder'+s,'elbow'+s,down.clone().addScaledVector(l,sg*.28).addScaledVector(f,sample.arms[j]));
    FG.aim(F,'elbow'+s,'wrist'+s,down.clone().addScaledVector(l,sg*.13).addScaledVector(f,sample.elbows[j]));
  }
  F.root.position.y=groundY+sample.rootUp;
  F.root.updateMatrixWorld(true); F.mesh.skeleton.update(); F.poseName=sample.name;
}
