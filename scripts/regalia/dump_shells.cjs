/* eslint-disable @typescript-eslint/no-require-imports -- a node script run by hand, not bundled */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const [,,qs,tag]=process.argv;const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});const p=await b.newPage();
p.on('pageerror',e=>console.log('E:',e.message.slice(0,400)));
await p.goto('http://localhost:8766/dump.html?'+qs);await p.waitForFunction('window.ready',{timeout:120000});
const info=await p.evaluate('INFO()');fs.mkdirSync('dump',{recursive:true});
for(let i=0;i<info.length;i++){if(!/shell/.test(info[i].name))continue;const d=await p.evaluate(i=>DUMP(i),i);
 fs.writeFileSync(`dump/${tag}_${info[i].name}.json`,JSON.stringify(d));console.log(tag,info[i].name,d.pos.length/3,d.C);}
await b.close();})();
