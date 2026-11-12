import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const out=process.env.ROBE_STRESS_OUT||'/tmp/robe-stress';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8767/between/cult/motion-review.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__motionReview?.status,{timeout:600000});
  const result=await page.evaluate(()=>window.__motionReview);
  writeFileSync(join(out,'motion-report.json'),JSON.stringify({result,errors},null,2)+'\n');
  if(result.status!=='complete'||errors.length||result.frames.length!==36)throw Error(JSON.stringify({status:result.status,frames:result.frames?.length,errors}));
  const sections=page.locator('section');if(await sections.count()!==6)throw Error('Missing motion sections');
  for(let i=0;i<6;i++)await sections.nth(i).screenshot({path:join(out,`${i<3?'feminine':'masculine'}-${['run','jump','climb'][i%3]}-motion.png`)});
  console.log('Captured 36 authored motion frames on two bodies');
}finally{await browser.close()}
