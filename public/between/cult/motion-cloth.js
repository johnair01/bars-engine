// Small, deterministic review deformation for the B2 skirt. It acts on rest
// vertices before skinning; phase, not frame history, determines the result.
// This is a bounded motion cue, not collision or simulated cloth.
import * as THREE from 'three';

const cache=new WeakMap();
export function poseMotionCloth(X,motion,phase){
  const f=X.F.fr.f,l=X.F.fr.l;
  for(const part of X.parts){
    if(part.name!=='robe')continue;
    const p=part.geo.attributes.position,edge=part.geo.attributes.aEdgeH;
    if(!edge)continue;
    let rest=cache.get(part);
    if(!rest){rest=Float32Array.from(p.array);cache.set(part,rest)}
    const run=motion==='run'||motion==='pose',jump=motion==='jump';
    const trail=run?-.055-.025*Math.sin(4*Math.PI*phase):jump?-.045*Math.sin(Math.PI*phase):0;
    const flare=run?.018+.018*Math.pow(Math.sin(2*Math.PI*phase),2):jump?.045*Math.sin(Math.PI*phase):0;
    for(let i=0;i<p.count;i++){
      const w=THREE.MathUtils.clamp(1-edge.getX(i)/.65,0,1);if(!w)continue;
      const k=w*w,side=Math.sign(rest[i*3]*l.x+rest[i*3+2]*l.z)||1;
      p.setXYZ(i,rest[i*3]+f.x*trail*k+l.x*side*flare*k,rest[i*3+1],rest[i*3+2]+f.z*trail*k+l.z*side*flare*k);
    }
    p.needsUpdate=true;part.geo.computeVertexNormals();
  }
}
