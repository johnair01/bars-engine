import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const out=process.env.OUT;mkdirSync(out,{recursive:true});
const cells=[{who:'f',build:'slight',height:1.5},{who:'f',build:'broad',height:1.95},{who:'m',build:'slight',height:1.95},{who:'m',build:'broad',height:1.5}];
const phases=[['strike',0],['compression',.09],['flight',.35],['flight-2',.85]];
const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:900,height:900}});
await p.goto('http://127.0.0.1:8767/between/cult/motion-lab.html',{waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.__motionLabControl?.walker&&window.__motionLabControl.jumpRef&&window.__motionLabControl.ref&&window.__motionLabControl.refFit,{timeout:600000});
for(const c of cells){await p.evaluate(c=>window.__motionLabControl.rebuild(c),c);
 const tag=`${c.who}-${c.build}-${c.height.toFixed(2)}`;
 for(const [n,t] of phases){await p.evaluate(([s])=>{const k=window.__motionLabControl;k.follow(false);k.bodyOnly(false);k.set('pose',s)},[t*.64]);
  await p.locator('#stage').screenshot({path:`${out}/${tag}-${n}.png`});}}
await b.close();
