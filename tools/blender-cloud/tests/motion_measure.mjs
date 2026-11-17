// Body-size motion measurement + same-frame captures for the cultivator motion lab (skill cultivator-motion-review).
// Usage (server running: python3 tools/blender-cloud/tests/motion_lab_server.py):
//   MOTION_OUT=/tmp/motion-measure [MOTION_CELLS=all|first] [MOTION_SHOTS=1] node tools/blender-cloud/tests/motion_measure.mjs
// Playwright must resolve from the script's folder or NODE_PATH; copy this file next to a Playwright install if needed.
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {execSync} from 'node:child_process';
const out=process.env.MOTION_OUT||'/tmp/motion-measure',shots=process.env.MOTION_SHOTS==='1',base=process.env.MOTION_BASE||'http://127.0.0.1:8767',query=process.env.MOTION_QUERY||'';
// the spec's first cheap matrix: slight 1.50, slight 1.95, average default, broad 1.50, broad 1.95, on both bases
const isCheap=c=>(c.build==='average'?c.height===DEFAULT_H[c.who]:true);
mkdirSync(out,{recursive:true});
const DEFAULT_H={f:1.66,m:1.75};
const cells=[];for(const who of ['f','m'])for(const build of ['slight','average','broad'])for(const h of (build==='average'?[1.50,DEFAULT_H[who],1.95]:[1.50,1.95]))cells.push({who,build,height:h});
const use=process.env.MOTION_CELLS==='first'?cells.slice(0,1):cells;
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const report={query,schema:'calrunia.cult_motion_measure.v1',source:execSync('git rev-parse HEAD',{encoding:'utf8'}).trim(),dirty:execSync('git status --porcelain',{encoding:'utf8'}).trim().split('\n').filter(Boolean),cells:[]};
try{
  const page=await browser.newPage({viewport:{width:900,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(`${base}/between/cult/motion-lab.html${query}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__motionLabControl?.walker&&window.__motionLabControl.jumpRef&&window.__motionLabControl.ref&&(window.__motionLabControl.refFit||new URLSearchParams(location.search).has('legacy')),{timeout:600000});
  for(const cell of use){
    await page.evaluate(c=>window.__motionLabControl.rebuild(c),cell);
    const rec=process.env.MOTION_SHOTS_ONLY==='1'?{}:await page.evaluate(async()=>{
      const M=await import('/between/cult/motion-measure.js'),c=window.__motionLabControl,o={size:M.referenceSize(c),run:[],jump:[],walk:[],ref:[],sweeps:{}};
      for(const [n,t] of M.RUN_PHASES)o.run.push({phase:n,...M.measureFrame(c,'pose',t)});
      for(const [n,t] of M.JUMP_PHASES)o.jump.push({phase:n,...M.measureFrame(c,'jump',t)});
      for(const [n,t] of M.WALK_PHASES)o.walk.push({phase:n,...M.measureFrame(c,'walk',t)});
      for(const [n,t] of M.RUN_PHASES)o.ref.push({phase:n,...M.referenceFrame(c,'pose',t)});
      for(const m of ['walk','pose','jump'])o.sweeps[m]=M.sweep(c,m);
      return o;});
    report.cells.push({...cell,...rec});
    if(shots&&isCheap(cell)){ // same frames, fixed camera, body-only then robe
      const tag=`${cell.who}-${cell.build}-${cell.height.toFixed(2)}`;
      for(const [mode,motion,phases,tScale] of [['run','pose',[['strike',0],['compression',.09],['flight',.35]],.64],['jump','jump',[['preload',.18],['apex',.58],['landing',.96]],1],['walk','walk',[['pass-L',0],['forward-L',.25]],1.2]])
        for(const only of [true,false])for(const [pn,t] of phases){
          await page.evaluate(([o,m,s])=>{const c=window.__motionLabControl;c.follow(m==='jump');c.bodyOnly(o);c.set(m,s)},[only,motion,mode==='jump'?t:t*tScale]);
          await page.locator('#stage').screenshot({path:join(out,`${tag}-${mode}-${pn}-${only?'body':'robe'}.png`)});
        }
    }
  }
  report.errors=errors;
}finally{await browser.close()}
writeFileSync(join(out,'motion-measure.json'),JSON.stringify(report,null,1)+'\n');
console.log('cells',report.cells.length,'errors',report.errors.length);
