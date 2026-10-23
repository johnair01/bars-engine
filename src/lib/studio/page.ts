/** The boat deck page: one self-contained document, the deck's data inlined, drawn on a 2D canvas with plain shapes.
 * Read-only (position ty-order: the paper prototype comes before any move). */
import type { Deck } from './deck'

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

export function studioPage(deck: Deck): string {
  const data = JSON.stringify(deck).replace(/</g, '\\u003c')
  const gates = deck.gates.map(g => `<li class="g ${g.state}" title="${esc(g.does)}"><b>${esc(g.stage)}</b><span>${esc(g.does)}</span></li>`).join('')
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Studio Boat</title>
<style>
:root{--sea:#0d2236;--sea2:#123049;--deck:#b98a5a;--deck2:#8d6440;--ink:#f4ead8;--dim:#a9b7c6;--waiting:#ffb54a;--moving:#7fe0c4;--resting:#9aa9ff;--done:#e9e2ff;--card:#18324a;--line:#2b4a66}
*{box-sizing:border-box}html,body{margin:0;background:var(--sea);color:var(--ink);font:15px/1.4 system-ui,-apple-system,Segoe UI,sans-serif}
header{padding:14px 16px 6px}h1{margin:0;font-size:20px;letter-spacing:.02em}header p{margin:4px 0 0;color:var(--dim);font-size:13px}
.gates{list-style:none;margin:8px 16px 4px;padding:0;display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.g{border-radius:6px;padding:6px 4px;background:var(--card);border:1px solid var(--line);font-size:11px;text-align:center;min-width:0}
.g b{display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.g span{display:none}
.g.passed{background:#2f6b4f;border-color:#58b48a}.g.here{background:#6b4f20;border-color:var(--waiting);box-shadow:0 0 10px #ffb54a66}
.gnote{margin:4px 16px 0;color:var(--dim);font-size:12px}
#wrap{position:relative;margin:8px 0 0}canvas{display:block;width:100%;height:auto;touch-action:manipulation}
.legend{display:flex;flex-wrap:wrap;gap:10px;padding:0 16px;font-size:12px;color:var(--dim)}.legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px}
#card{margin:10px 16px;padding:12px;border-radius:10px;background:var(--card);border:1px solid var(--line);min-height:70px}
#card h2{margin:0 0 4px;font-size:16px}#card .meta{color:var(--dim);font-size:12px;margin-bottom:6px}#card .next{color:var(--waiting);margin:6px 0 0}
h3{margin:16px 16px 6px;font-size:14px;color:var(--dim);font-weight:600}
.crew{display:flex;gap:8px;overflow-x:auto;padding:0 16px 18px;scroll-snap-type:x proximity}
.staff{flex:0 0 150px;scroll-snap-align:start;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px}
.staff b{display:block;font-size:13px;text-transform:capitalize}.staff p{margin:4px 0 6px;font-size:12px;color:var(--dim)}
.wage{display:inline-block;font-size:11px;padding:2px 6px;border-radius:999px;background:#3a2a55;color:#e6d6ff}.wage.sonnet{background:#1f4a44;color:#bff3e6}
.tier{float:right;font-size:10px;color:var(--dim);text-transform:uppercase}
footer{padding:0 16px 24px;color:var(--dim);font-size:11px}
@media(min-width:720px){.g span{display:block;color:var(--dim);font-size:10px}}
</style></head><body>
<header><h1>The studio boat</h1><p>Read-only deck. Each spirit is a real strand from the call sheets; tap one to see where it stands.</p></header>
<ol class="gates" aria-label="Chapter 1 through the seven stages">${gates}</ol>
<p class="gnote">${esc(deck.gateNote)}</p>
<div id="wrap"><canvas id="deck" width="960" height="560" aria-label="The boat deck with strand spirits"></canvas></div>
<div class="legend"><span><i style="background:var(--waiting)"></i>Waiting on you (bow)</span><span><i style="background:var(--moving)"></i>Moving (midship)</span><span><i style="background:var(--resting)"></i>Resting (stern)</span><span><i style="background:var(--done)"></i>Done (by the Everdoor)</span><span>Dimmer = longer untouched (fades at 21 days)</span></div>
<div id="card"><h2>Tap a spirit</h2><div class="meta">The card shows the strand's own line from the call sheet index.</div></div>
<h3>Crew for hire (Claude-Code-Game-Studios roster)</h3>
<div class="crew" id="crew"></div>
<footer>Read from ${esc(deck.source)} at <span id="at"></span>. Wage: Sonnet staff cost about a quarter less than Opus (CLAUDE.md, "Short sessions"); "inherits" staff take the thread's model.</footer>
<script>
const D=${data};
document.getElementById('at').textContent=new Date(D.at).toLocaleString();
const C={waiting:'#ffb54a',moving:'#7fe0c4',resting:'#9aa9ff',done:'#e9e2ff'};
const cv=document.getElementById('deck'),x=cv.getContext('2d'),W=cv.width,H=cv.height;
// Deck zones run bow (left, by your desk) to stern (right, by the Everdoor), each as wide as its crowd.
const ORDER=['waiting','moving','resting','done'],Z={},spots=[];
function hash(s){let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h}
function place(){const by={};for(const m of ORDER)by[m]=[];for(const p of D.passengers)by[p.mood].push(p);
 const ROWS=4,cols=m=>Math.max(1,Math.ceil(by[m].length/ROWS)),total=ORDER.reduce((n,m)=>n+cols(m),0);let a=170;
 for(const m of ORDER){const w=720*cols(m)/total;Z[m]=[a,a+w];const step=w/cols(m);
  by[m].sort((p,q)=>p.days-q.days).forEach((p,i)=>{const c=Math.floor(i/ROWS),r=i%ROWS,jit=(hash(p.strand)%9)-4;
   spots.push({p,x:a+step*(c+.5),y:282+r*48+jit,r:13+(p.loop?3:0)})});a+=w}}
place();
let sel=null,t0=performance.now();
function hull(){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0f2a42');g.addColorStop(1,'#0a1b2b');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.fillStyle='#163a57';for(let i=0;i<9;i++){x.beginPath();x.ellipse((i*137+((performance.now()-t0)/40))%(W+200)-100,H-40+((i%3)*10),70,6,0,0,7);x.fill()}
 x.fillStyle='#5a3a22';x.beginPath();x.moveTo(60,230);x.lineTo(900,230);x.quadraticCurveTo(940,300,880,470);x.lineTo(130,470);x.quadraticCurveTo(40,360,60,230);x.fill();
 x.fillStyle='#b98a5a';x.beginPath();x.moveTo(80,222);x.lineTo(895,222);x.quadraticCurveTo(925,290,868,452);x.lineTo(140,452);x.quadraticCurveTo(62,350,80,222);x.fill();
 x.strokeStyle='#8d6440';x.lineWidth=2;for(let yy=240;yy<450;yy+=26){x.beginPath();x.moveTo(90,yy);x.lineTo(900,yy);x.stroke()}
 // wheelhouse (your desk) at the bow, Everdoor arch at the stern, mast midship
 x.fillStyle='#e8d2a8';x.fillRect(84,120,70,100);x.fillStyle='#3a2a1a';x.fillRect(100,140,38,30);x.fillStyle='#ffd27a';x.fillRect(104,144,30,22);
 x.fillStyle='#6b4a2e';x.fillRect(486,40,8,190);x.fillStyle='#efe4cc';x.beginPath();x.moveTo(494,52);x.lineTo(600,170);x.lineTo(494,190);x.fill();
 const pulse=0.55+0.25*Math.sin((performance.now()-t0)/700);x.strokeStyle='rgba(233,226,255,'+pulse+')';x.lineWidth=8;x.beginPath();x.arc(850,222,52,Math.PI,0);x.stroke();
 x.fillStyle='#f4ead8';x.font='bold 15px system-ui';x.textAlign='center';x.fillText('Your desk',119,112);x.fillText('Everdoor',850,158);
 x.font='12px system-ui';x.fillStyle='#3a2a1a';const lab={waiting:'WAITING ON YOU',moving:'MOVING',resting:'RESTING',done:'DONE'};for(const m of ORDER)if(Z[m])x.fillText(lab[m],(Z[m][0]+Z[m][1])/2,248)}
function spirit(s,now){const p=s.p,col=C[p.mood],a=0.25+0.75*p.glow,bob=Math.sin(now/600+hash(p.strand))*3;
 x.globalAlpha=a;const g=x.createRadialGradient(s.x,s.y+bob-4,2,s.x,s.y+bob,s.r*1.8);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=g;x.beginPath();x.arc(s.x,s.y+bob,s.r*1.8,0,7);x.fill();
 x.fillStyle=col;x.beginPath();x.arc(s.x,s.y+bob-4,s.r*.7,Math.PI,0);x.lineTo(s.x+s.r*.7,s.y+bob+s.r*.6);
 for(let k=3;k>=0;k--)x.lineTo(s.x-s.r*.7+k*(s.r*1.4/3)-(k%2?0:s.r*.12),s.y+bob+s.r*(k%2?.4:.65));x.fill();
 x.fillStyle='#1b2533';x.beginPath();x.arc(s.x-5,s.y+bob-6,2.4,0,7);x.arc(s.x+5,s.y+bob-6,2.4,0,7);x.fill();
 if(p.loop){x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.arc(s.x,s.y+bob-4,s.r+4,-Math.PI/2,-Math.PI/2+6.283*Math.max(.05,Math.min(1,p.loop.ahead/(p.loop.maxAhead||2))));x.stroke()}
 x.globalAlpha=1;if(sel===s){x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.arc(s.x,s.y+bob,s.r*1.5,0,7);x.stroke()}
 x.fillStyle='#21160c';x.font='10px system-ui';x.textAlign='center';x.fillText(p.strand.length>11?p.strand.slice(0,10)+'…':p.strand,s.x,s.y+bob+s.r+12)}
function frame(now){hull();for(const s of spots)spirit(s,now);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
const words={waiting:'Waiting on you',moving:'Moving',resting:'Resting',done:'Done, at the Everdoor'};
function show(s){sel=s;const p=s.p,el=document.getElementById('card');
 const loop=p.loop?'<div class="meta">Loop: '+esc(p.loop.loop)+'. Round '+p.loop.round+' built, your last look round '+p.loop.lastLook+' ('+p.loop.ahead+' of '+p.loop.maxAhead+' rounds ahead allowed).</div>':'';
 el.innerHTML='<h2>'+esc(p.strand)+'</h2><div class="meta">'+words[p.mood]+' · touched '+esc(p.touched)+' ('+p.days+' day'+(p.days==1?'':'s')+' ago)</div>'+loop+'<div>'+esc(p.text)+'</div>'+(p.next?'<p class="next">'+esc(p.next)+'</p>':'')}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect(),px=(e.clientX-r.left)*W/r.width,py=(e.clientY-r.top)*H/r.height;
 let best=null,bd=1e9;for(const s of spots){const d=Math.hypot(s.x-px,s.y-py);if(d<bd){bd=d;best=s}}if(best&&bd<34)show(best)});
const first=new URLSearchParams(location.search).get('strand');const pick=spots.find(s=>s.p.strand===first)||spots.find(s=>s.p.mood==='waiting');if(pick)show(pick);
document.getElementById('crew').innerHTML=D.crew.map(s=>{const w=s.model==='opus'?'Opus wage':s.model==='sonnet'?'Sonnet wage':'Inherits';
 return '<div class="staff"><span class="tier">'+s.tier+'</span><b>'+esc(s.id.replace(/-/g,' '))+'</b><p>'+esc(s.does)+'</p><span class="wage '+s.model+'">'+w+'</span></div>'}).join('');
</script>
</body></html>`
}
