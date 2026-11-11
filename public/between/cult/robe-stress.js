// Diagnostic poses for the current cultivation robe. These are deliberately
// synthetic until the cultivator has authored run, jump, and climb clips.
import * as THREE from 'three';
import * as M from './make/mix.js';
import * as FG from './make/figure.js';

const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const POSES = [
  ['stand','rest',0,0,0,0,0],
  ['sprint','long stride',0.68,-0.48,-0.22,0.64,0],
  ['sprint','passing step',-0.12,0.18,0.75,-0.38,0],
  ['sprint','hard stop',0.45,-0.26,0.42,-0.18,-0.12],
  ['jump','crouch',0.55,0.55,0.92,0.92,-0.22],
  ['jump','takeoff',0.12,0.12,0.22,0.22,0.16],
  ['jump','apex tuck',0.72,0.72,1.08,1.08,0.5],
  ['jump','landing compression',0.58,0.5,1.02,0.94,-0.2],
  ['climb','high left step',1.15,-0.12,1.35,0.12,0.08],
  ['climb','pull over ledge',0.93,0.35,1.02,0.75,0.34],
  ['climb','high right step',-0.12,1.15,0.12,1.35,0.08],
];

function stressPose(F, row) {
  FG.resetPose(F);
  const [, , left, right, leftShin, rightShin, rise] = row;
  const { f, l } = F.fr, down = V(0,-1,0);
  for (const [s,sg,thigh,shin] of [['L',1,left,leftShin],['R',-1,right,rightShin]]) {
    FG.aim(F,'hip'+s,'knee'+s,down.clone().addScaledVector(l,sg*0.045).addScaledVector(f,thigh));
    FG.aim(F,'knee'+s,'ankle'+s,down.clone().addScaledVector(l,sg*0.03).addScaledVector(f,shin));
    FG.aim(F,'shoulder'+s,'elbow'+s,down.clone().addScaledVector(l,sg*0.29).addScaledVector(f,-thigh*0.2));
    FG.aim(F,'elbow'+s,'wrist'+s,down.clone().addScaledVector(l,sg*0.16).addScaledVector(f,0.24-thigh*0.2));
  }
  F.root.position.y += rise;
  F.root.updateMatrixWorld(true);
  F.mesh.skeleton.update();
  F.poseName = row[0];
}

function addFrame(section, src, label) {
  const f=document.createElement('figure'), im=document.createElement('img'), c=document.createElement('figcaption');
  im.src=src; im.alt=label; c.textContent=label; f.append(im,c); section.append(f);
}

async function run() {
  const reg=await (await fetch('./make/parts.json')).json(), root=document.querySelector('#frames'), report=[];
  for (const who of ['f','m']) {
    const mix={gender:who,build:'average',skin:who==='f'?4:3,height:who==='f'?1.66:1.75,direction:'B',outfit:'B2'};
    const X=await M.build(mix,reg), F=X.F, original=F.mesh.geometry.index.clone();
    const section=document.createElement('section'); section.innerHTML=`<h2>${who==='f'?'Feminine':'Masculine'} body · current B2 robe</h2>`; root.append(section);
    for (const row of POSES) {
      stressPose(F,row);
      // Restore the full body for diagnostics. The shipped walker hides covered
      // triangles, which would make an intersection test falsely reassuring.
      F.mesh.geometry.setIndex(F.idx0);
      const measured=M.pokes(F,X.parts,row[0]+':'+row[1]);
      const label=row[0]+' · '+row[1];
      addFrame(section,M.shoot(X,'front',320,460,{dist:7.5,fov:24}),label+' front');
      addFrame(section,M.shoot(X,'side',320,460,{dist:7.5,fov:24}),label+' side');
      report.push({body:who,scenario:row[0],phase:row[1],synthetic:true,bodyPoke:measured.bodyPoke,layerPoke:measured.layerPoke,bare:measured.bare,where:measured.where});
    }
    F.mesh.geometry.setIndex(original); M.dispose(X);
  }
  document.querySelector('#report').textContent=JSON.stringify({schema:'calrunia.robe_stress.v0',status:'diagnostic_only',frames:report},null,2);
  window.__robeStress={status:'complete',frames:report}; document.body.classList.add('ready');
}
run().catch(error=>{document.querySelector('#loading').textContent='Failed: '+error.message; window.__robeStress={status:'failed',error:String(error)};});
