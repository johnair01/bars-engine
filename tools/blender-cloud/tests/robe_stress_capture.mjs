// Run from a folder with playwright installed; see robe-motion-stress.yml.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out=process.env.ROBE_STRESS_OUT || '/tmp/robe-stress';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',error=>errors.push(String(error)));
page.on('console',message=>{if(message.type()==='error') errors.push(message.text());});
try {
  await page.goto('http://127.0.0.1:8767/between/cult/robe-stress.html',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.__robeStress?.status==='complete'||window.__robeStress?.status==='failed',null,{timeout:600000});
  const result=await page.evaluate(()=>window.__robeStress);
  writeFileSync(join(out,'report.json'),JSON.stringify({result,errors},null,2)+'\n');
  if(result.status!=='complete'||errors.length) throw new Error(JSON.stringify({result:result.status,errors}));
  const sections=page.locator('section');
  if(await sections.count()!==2||result.frames.length!==22||result.motions.length!==6) throw new Error('missing body or motion samples');
  await sections.nth(0).screenshot({path:join(out,'feminine-b2-stress.png')});
  await sections.nth(1).screenshot({path:join(out,'masculine-b2-stress.png')});
  console.log(`Captured ${result.frames.length} synthetic poses across two bodies. Diagnostic report: ${out}`);
} finally { await browser.close(); }
