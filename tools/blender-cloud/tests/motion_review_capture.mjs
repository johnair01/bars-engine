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
  await page.goto('http://127.0.0.1:8767/between/cult/motion-lab.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#clock')?.textContent?.startsWith('walk ·'),{timeout:600000});
  await page.locator('#actions [data-motion="run"]').click();
  await page.waitForFunction(()=>document.querySelector('#clock')?.textContent?.startsWith('run ·'));
  await page.locator('#play').click();
  await page.screenshot({path:join(out,'motion-lab-run.png')});
  await page.locator('#actions [data-motion="pose"]').click();
  if(+(await page.locator('#clearance').inputValue())!==0.5||+(await page.locator('#shoulderOutL').inputValue())!==0.1)throw Error('shared run calibration defaults did not load');
  const runHeights=[];
  for(const phase of [0,90,350,500]){
    await page.locator('#time').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}))},phase);
    runHeights.push(+(await page.locator('#stage').getAttribute('data-root-up')));
    if(phase===90||phase===350)await page.screenshot({path:join(out,`motion-lab-run-${phase===90?'compression':'flight'}.png`)});
  }
  if(!(runHeights[1]<runHeights[0]-.02&&runHeights[2]>runHeights[0]+.06&&Math.abs(runHeights[3]-runHeights[0])<.02))throw Error(`run lacks compression/release/loop: ${runHeights}`);
  await page.locator('#bodyOnly').check();
  await page.screenshot({path:join(out,'motion-lab-run-default-calibration.png')});
  await page.locator('#shoulderOutL').evaluate(el=>{el.value='0.4';el.dispatchEvent(new Event('input',{bubbles:true}))});
  if(!await page.locator('#posePanel').isVisible()||+(await page.locator('#shoulderOutL').inputValue())!==0.4)throw Error('pose calibration control did not update');
  await page.screenshot({path:join(out,'motion-lab-pose-calibration.png')});
  await page.locator('#note').fill('Cloud pose calibration save check.');
  await page.locator('#saveNote').click();
  await page.getByText('Saved to the repo with this frame and settings.').waitFor();
  await page.locator('#bodyOnly').uncheck();
  await page.locator('#actions [data-motion="jump"]').click();
  await page.waitForFunction(()=>document.querySelector('#clock')?.textContent?.startsWith('jump ·'));
  await page.locator('#play').click();
  const jumpTravel=[];
  for(const phase of [0,500,1000]){
    await page.locator('#time').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}))},phase);
    jumpTravel.push(+(await page.locator('#stage').getAttribute('data-root-forward')));
    if(phase===500)await page.screenshot({path:join(out,'motion-lab-jump-midair.png')});
  }
  if(Math.abs(jumpTravel[0])>.01||jumpTravel[1]<.6||jumpTravel[2]<1.45)throw Error(`jump root did not travel forward: ${jumpTravel}`);
  const flight=[];
  for(const phase of [250,518,786]){
    await page.locator('#time').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}))},phase);
    flight.push([+(await page.locator('#stage').getAttribute('data-root-forward')),+((await page.locator('#stage').getAttribute('data-root-up')))]);
  }
  const first=flight[1][0]-flight[0][0],second=flight[2][0]-flight[1][0];
  if(Math.abs(first-second)>.08||flight[1][1]<flight[0][1]+.25||flight[1][1]<flight[2][1]+.25)throw Error(`jump flight lacks continuous travel and apex: ${JSON.stringify(flight)}`);
  await page.screenshot({path:join(out,'motion-lab-jump.png')});
  await page.locator('#actions [data-motion="climb"]').click();
  await page.locator('#note').fill('Cloud note save check: visible ledge contact.');
  await page.locator('#saveNote').click();
  await page.getByText('Saved to the repo with this frame and settings.').waitFor();
  await page.screenshot({path:join(out,'motion-lab-climb-and-note.png')});
  // First body-size boundary set: both bases and opposing build/height extremes.
  for(const [body,build,height] of [['f','slight',1.50],['f','broad',1.95],['m','slight',1.95],['m','broad',1.50]]){
    await page.locator('#body').selectOption(body);
    await page.waitForFunction(value=>document.querySelector('#stage')?.dataset.body===value,body,{timeout:600000});
    await page.locator('#build').selectOption(build);
    await page.waitForFunction(value=>document.querySelector('#stage')?.dataset.build===value,build,{timeout:600000});
    await page.locator('#height').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))},height);
    await page.waitForFunction(value=>document.querySelector('#stage')?.dataset.height===value,height.toFixed(2),{timeout:600000});
    const stem=`motion-lab-${body}-${build}-${height.toFixed(2)}`;
    await page.locator('#actions [data-motion="pose"]').click();
    await page.locator('#time').evaluate(el=>{el.value='350';el.dispatchEvent(new Event('input',{bubbles:true}))});
    await page.screenshot({path:join(out,`${stem}-run.png`)});
    await page.locator('#actions [data-motion="jump"]').click();
    await page.locator('#time').evaluate(el=>{el.value='518';el.dispatchEvent(new Event('input',{bubbles:true}))});
    await page.screenshot({path:join(out,`${stem}-jump.png`)});
  }
  const error=await page.locator('#error').textContent();if(error?.trim())throw Error(error);
  console.log('Captured authored motion frames and eight body-size boundary frames');
}finally{await browser.close()}
