import * as THREE from 'three';
import * as M from './make/mix.js';
import * as FG from './make/figure.js';
import {MOTIONS,motionSpec,sampleMotion,applyMotion} from './motion.js';

const V=()=>new THREE.Vector3();
async function run(){
  const reg=await (await fetch('./make/parts.json')).json(), output=document.querySelector('#frames'), frames=[];
  for(const who of ['f','m']){
    const X=await M.build({gender:who,build:'average',skin:who==='f'?4:3,height:who==='f'?1.66:1.75,direction:'B',outfit:'B2'},reg),F=X.F;
    FG.pose(F,'stand'); const groundY=F.root.position.y;
    for(const name of MOTIONS){
      const section=document.createElement('section');section.innerHTML=`<h2>${who==='f'?'Feminine':'Masculine'} · ${name}</h2>`;output.append(section);
      for(const key of motionSpec(name).keys){
        const sample=sampleMotion(name,key.t);applyMotion(F,sample,groundY);
        const figure=document.createElement('figure'),im=document.createElement('img'),cap=document.createElement('figcaption');
        im.src=M.shoot(X,'side',320,460,{dist:7.5,fov:24});im.alt=`${name} at ${key.t}s`;
        cap.textContent=`${key.t.toFixed(2)}s · ${key.contact} · forward ${sample.rootForward.toFixed(2)}m · up ${sample.rootUp.toFixed(2)}m`;
        figure.append(im,cap);section.append(figure);
        frames.push({body:who,motion:name,time:key.t,contact:key.contact,forward:sample.rootForward,up:sample.rootUp});
      }
    }
    M.dispose(X);
  }
  const result={status:'complete',schema:'calrunia.cult_motion.v1',frames};
  document.querySelector('#report').textContent=JSON.stringify(result,null,2);window.__motionReview=result;
  document.querySelector('#loading').remove();
}
run().catch(error=>{window.__motionReview={status:'failed',error:String(error)};document.querySelector('#loading').textContent=String(error)});
