/* Lantern Hall motion module: RIG (the procedural walker, prototyping body) and PROJ (camera-aware projection).
   Split from the v6 reel's rig.js (six-faces-council artifacts/lantern-hall/v6, council #745) by the brief
   "Lantern Hall, portable kit" (council/callsheets/lantern-hall.md). Ruling lh-two-bodies: this is the prototyping body,
   with no asset files; it runs in a plain 2D canvas in any route or environment. Shipped 3D uses the Average Dusk
   mocap walker instead. Plain ES module: no window, no storage, no claude.ai calls.

   Figure-local units: height h = 1. Axes: f = forward, l = figure's left, u = up. Ground u = 0.
   World: x right, z into the hall. Heading 0 = facing +z. Figure's left in world = (-cos h, sin h).
   Camera: {x,z,h,yaw}; yaw 0 looks along +z, yaw PI looks along -z.
   Piece cards: six-faces-council council/parts/lantern-walker.md and lantern-eight-view.md. */
const TAU=Math.PI*2;
const cl=(x,a,b)=>Math.max(a,Math.min(b,x)), lp=(a,b,k)=>a+(b-a)*k;
const sstep=x=>{x=cl(x,0,1);return x*x*(3-2*x);};
const hexA=c=>{const n=parseInt(c.slice(1),16);return [n>>16&255,n>>8&255,n&255];};
const shade=(c,k)=>{const a=hexA(c);return `rgb(${a.map(v=>Math.round(cl(v*k,0,255))).join(',')})`;};

const D={thigh:.262,shin:.255,ankleH:.046,heelBack:.035,toeFwd:.118,hipW:.068,footW:.06,pelvisU:.56,
  stance:.62,stride:.74,heelPitch:.32,toePitch:.62,lift:.05,
  shW:.128,upper:.172,fore:.158,armSwing:.34};

/* ---------- gait: one foot ---------- */
function rotFU(v,a){ const c=Math.cos(a),s=Math.sin(a); return [v[0]*c-v[1]*s, v[0]*s+v[1]*c]; }
function stanceFoot(u,k){ // u in [0,1] of stance
  const S=D.stance*D.stride*k, p=S/2-u*S; let pitch=0, ank;
  if(u<.14){ pitch=D.heelPitch*k*(1-sstep(u/.14)); const heel=[p-D.heelBack,0]; const r=rotFU([D.heelBack,D.ankleH],pitch); ank=[heel[0]+r[0],heel[1]+r[1]]; }
  else if(u>.6){ pitch=-D.toePitch*k*sstep((u-.6)/.4); const toe=[p+D.toeFwd,0]; const r=rotFU([-D.toeFwd,D.ankleH],pitch); ank=[toe[0]+r[0],toe[1]+r[1]]; }
  else ank=[p,D.ankleH];
  return {f:ank[0],u:ank[1],pitch,plant:true};
}
function footAt(phi,k){
  if(phi<D.stance) return stanceFoot(phi/D.stance,k);
  const v=(phi-D.stance)/(1-D.stance), a=stanceFoot(1,k), b=stanceFoot(0,k);
  const e=.5-.5*Math.cos(Math.PI*v);
  const lift=D.lift*k*Math.sin(Math.PI*Math.pow(v,.6));
  return {f:lp(a.f,b.f,e),u:lp(a.u,b.u,e)+lift,pitch:lp(a.pitch,b.pitch,sstep(v)),plant:false};
}
function footPts(ank,l){ const h=rotFU([-D.heelBack,-D.ankleH],ank.pitch), t=rotFU([D.toeFwd,-D.ankleH],ank.pitch);
  return {ankle:{f:ank.f,l,u:ank.u}, heel:{f:ank.f+h[0],l,u:ank.u+h[1]}, toe:{f:ank.f+t[0],l,u:ank.u+t[1]}, pitch:ank.pitch, plant:ank.plant}; }
function ik2(hip,ank,A,B){ // two-bone IK, knee bends forward (+f). Kit fix: solved in 3D (the plane through hip and
  // ankle that holds the forward axis), so thigh and shin keep their exact lengths when hip and ankle sit at different l.
  const df=ank.f-hip.f, dl=ank.l-hip.l, du=ank.u-hip.u, d=Math.hypot(df,dl,du)||1e-9, dm=Math.min(d,(A+B)*.9995);
  const nf=df/d, nl=dl/d, nu=du/d;
  const a=(A*A+dm*dm-B*B)/(2*dm), r=Math.sqrt(Math.max(0,A*A-a*a));
  let pf=1-nf*nf, pl=-nf*nl, pu=-nf*nu; const pn=Math.hypot(pf,pl,pu)||1; pf/=pn; pl/=pn; pu/=pn;
  return {f:hip.f+nf*a+pf*r,l:hip.l+nl*a+pl*r,u:hip.u+nu*a+pu*r};
}
const softmin=(xs,k)=>{ const m=Math.min(...xs); return m-k*Math.log(xs.reduce((s,x)=>s+Math.exp(-(x-m)/k),0)); };

/* ---------- RIG.pose ---------- */
function pose(phase,speed,o){
  o=o||{}; const k=cl(speed==null?1:speed,0,1.3); phase=((phase%1)+1)%1;
  const c=Math.cos(TAU*phase), s=Math.sin(TAU*phase), t=o.t||0;
  let aL=footAt(phase,k), aR=footAt((phase+.5)%1,k);
  if(o.feet){ if(o.feet.L) aL=o.feet.L; if(o.feet.R) aR=o.feet.R; }
  const rot=.024*k*c, shift=.013*k*s+(o.shift||0), lean=.035*k+(o.lean||0);
  const hipL={f:rot,l:D.hipW+shift,u:0}, hipR={f:-rot,l:-D.hipW+shift,u:0};
  const Lm=(D.thigh+D.shin)*.985;
  const reach=(a,hf)=>a.u+Math.sqrt(Math.max(0,Lm*Lm-(a.f-hf)*(a.f-hf)));
  let pu=Math.min(D.pelvisU, softmin([reach(aL,rot),reach(aR,-rot)],.01));
  pu+= (1-k)*.004*Math.sin(t*1.7); // idle breath
  hipL.u=hipR.u=pu;
  const L=footPts(aL,aL.l!=null?aL.l:D.footW), R=footPts(aR,aR.l!=null?aR.l:-D.footW);
  L.hip=hipL; R.hip=hipR; L.knee=ik2(hipL,L.ankle,D.thigh,D.shin); R.knee=ik2(hipR,R.ankle,D.thigh,D.shin);
  const pelvis={f:0,l:shift,u:pu};
  const dU=pu-D.pelvisU;
  const chest={f:lean*.7,l:shift*.6,u:.70+dU}, neck={f:lean,l:shift*.4,u:.85+dU};
  const head={f:lean*1.15+.012,l:shift*.3,u:.922+dU+.004*k*Math.cos(2*TAU*phase)};
  // arms: pendulum swing opposite the legs, forearm follows through (lags), elbow bend grows with speed
  const SW=.116, A=.36*k, lagS=.025, lagE=.1;
  const swing=(side,ph)=>side*A*Math.cos(TAU*(ph)) * -1; // left arm back when left foot forward (phase 0)
  const arm=(side,sw,bend,shF,inward)=>{ const sh={f:lean*.9+shF,l:side*SW+shift*.5,u:.79+dU};
    // Kit fix (bone lengths exact): the sideways offsets come out of the sagittal length, so each bone keeps its length.
    const eo=.018, up=Math.sqrt(D.upper*D.upper-eo*eo), wi=inward||0, fo=Math.sqrt(D.fore*D.fore-wi*wi);
    const e={f:sh.f+Math.sin(sw)*up,l:sh.l+side*eo,u:sh.u-Math.cos(sw)*up};
    const fa=sw+bend; const w={f:e.f+Math.sin(fa)*fo,l:e.l-side*wi,u:e.u-Math.cos(fa)*fo};
    const hand={f:w.f+Math.sin(fa)*.03,l:w.l,u:w.u-Math.cos(fa)*.03};
    return {sh,el:e,wr:w,hand,sw,fa}; };
  const mk=(side,shF)=>{ const sw=swing(side,phase-lagS), swl=swing(side,phase-lagE);
    const fwd=A?Math.max(0,sw/A):0; const bend=Math.max(.06,.1+.22*k+.18*k*fwd+.55*(swl-sw));
    return arm(side,sw,bend,shF,.012*fwd*k); };
  let armL=mk(1,-rot*1.1), armR=mk(-1,rot*1.1);
  if(o.lamp){ const sw=.1+.03*k*Math.sin(TAU*phase*2); armR=arm(-1,sw,1.22,rot*.4,.02); }
  // robe hem follows knees with a little lag
  const kf=[L.knee.f,R.knee.f];
  const hem={fmin:Math.min(...kf)-.075-.015*k, fmax:Math.max(...kf)+.07, u:.15+dU*.6, sway:-.018*k*s};
  const lc=chest.f, lw=pelvis.f+lean*.3;
  const kneeU=(L.knee.u+R.knee.u)/2;
  const rings=[
    {f:neck.f,l:neck.l,u:.845+dU,hf:.042,hl:.046},
    {f:neck.f*.8+lc*.2,l:chest.l,u:.818+dU,hf:.06,hl:.085},
    {f:lc,l:chest.l,u:.785+dU,hf:.07,hl:.118},
    {f:lc,l:chest.l,u:.70+dU,hf:.082,hl:.112},
    {f:lw,l:pelvis.l,u:.57+dU,hf:.078,hl:.104,band:'sash'},
    {f:lw,l:pelvis.l,u:.535+dU,hf:.08,hl:.106},
    {f:pelvis.f,l:pelvis.l,u:.45+dU,hf:.09,hl:.124},
    {f:(Math.min(...kf)+Math.max(...kf))/2-.005,l:pelvis.l,u:kneeU,hf:(Math.max(...kf)-Math.min(...kf))/2+.07,hl:.138},
    {f:(hem.fmin+hem.fmax)/2+hem.sway,l:pelvis.l,u:hem.u,hf:(hem.fmax-hem.fmin)/2,hl:.152},
  ];
  const P={k,phase,pelvis,chest,neck,head,L,R,armL,armR,hem,lean,rings};
  if(o.lamp&&!o._noL) P.lantern=lantern(phase,k,o);
  return P;
}
/* lantern: damped pendulum on a short cord, driven by the hand's acceleration (simulated over the last 1.6 s of gait) */
function lantern(phase,k,o){
  const cad=o.cad||1.15, hM=o.hM||1.7, Lc=.085*hM, g=9.81, w0=Math.sqrt(g/Lc), cdamp=2*.2*w0, dt=1/90, n=Math.round(1.6/dt);
  const hand=ph=>{ const P=pose(ph,k,Object.assign({},o,{_noL:true})); return P.armR.hand; };
  let a=0,av=0,b=0,bv=0; let p0=hand(phase-(n+1)*dt*cad), p1=hand(phase-n*dt*cad);
  for(let i=n-1;i>=0;i--){ const p2=hand(phase-i*dt*cad);
    const af=(p2.f-2*p1.f+p0.f)*hM/(dt*dt), au=(p2.u-2*p1.u+p0.u)*hM/(dt*dt), al=(p2.l-2*p1.l+p0.l)*hM/(dt*dt);
    const aa=-(g+au)/Lc*Math.sin(a)-af/Lc*Math.cos(a)-cdamp*av, ba=-(g+au)/Lc*Math.sin(b)-al/Lc*Math.cos(b)-cdamp*bv;
    av+=aa*dt; a+=av*dt; bv+=ba*dt; b+=bv*dt; a=cl(a,-1,1); b=cl(b,-1,1); p0=p1; p1=p2; }
  const hd=hand(phase), L=.085; return {top:hd, bot:{f:hd.f+Math.sin(a)*L,l:hd.l+Math.sin(b)*L,u:hd.u-Math.cos(a)*Math.cos(b)*L}, a, b};
}

/* ---------- 3D: world joints through the hall camera ---------- */
function hull(ps){ ps=ps.slice().sort((A,B)=>A.sx-B.sx||A.sy-B.sy); if(ps.length<3) return ps; const cr=(o,a,b)=>(a.sx-o.sx)*(b.sy-o.sy)-(a.sy-o.sy)*(b.sx-o.sx); const lo=[],up=[];
  for(const p of ps){ while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0) lo.pop(); lo.push(p); }
  for(let i=ps.length-1;i>=0;i--){ const p=ps[i]; while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0) up.pop(); up.push(p); }
  return lo.slice(0,-1).concat(up.slice(0,-1)); }
const lerp3=(a,b,k)=>a+(b-a)*k;
const rgbS=(a,m,warm,al)=>`rgba(${Math.round(cl(a[0]*m+255*warm,0,255))},${Math.round(cl(a[1]*m+170*warm,0,255))},${Math.round(cl(a[2]*m+80*warm,0,255))},${al==null?1:al})`;
function draw3(c,fig,P,view,o){
  o=o||{}; const PP=(typeof fig.who==='object')?fig.who:(PEOPLE[fig.who]||PEOPLE.you);
  const hM=fig.h||1.7, sh=Math.sin(fig.heading), chh=Math.cos(fig.heading), eye=view.eye, yaw=view.yaw||0;
  const W3=q=>({x:fig.x+(sh*q.f-chh*q.l)*hM, y:q.u*hM, z:fig.z+(chh*q.f+sh*q.l)*hM});
  const S=q=>{ const w=W3(q); const p=view.proj(w.x,w.y,w.z); return {sx:p.sx,sy:p.sy,sc:p.sc,d:p.d,w}; };
  const F={x:sh,y:0,z:chh}, Lft={x:-chh,y:0,z:sh};
  const robe=hexA(PP.robe), sash=hexA(PP.sash), skin=[214,180,148], hair=[44,36,46], dark=[38,30,28], shoe=[20,16,17];
  const light=o.light==null?1:o.light, fade=o.fade==null?1:o.fade;
  const camR={x:Math.cos(yaw),y:0,z:-Math.sin(yaw)};
  const lampW=P.lantern?W3(P.lantern.bot):null;
  const shadeAt=(n,pw)=>{ let vx=eye.x-pw.x,vy=eye.y-pw.y,vz=eye.z-pw.z; const vl=Math.hypot(vx,vy,vz)||1; vx/=vl;vy/=vl;vz/=vl;
    let lx=vx-.55*camR.x, ly=vy+.75, lz=vz-.55*camR.z; const ll=Math.hypot(lx,ly,lz); const lam=Math.max(0,(n.x*lx+n.y*ly+n.z*lz)/ll);
    let m=(.36+.64*lam)*light, warm=0;
    if(lampW){ const dx=lampW.x-pw.x,dy=lampW.y-pw.y,dz=lampW.z-pw.z, dd=Math.hypot(dx,dy,dz)||1; warm=.32*Math.max(0,(n.x*dx+n.y*dy+n.z*dz)/dd)/(1+(dd/.45)*(dd/.45)); }
    if(o.rimFrom!=null) {}
    return {m,warm}; };
  const items=[]; const add=(d,fn)=>{ if(d>.2) items.push({d,fn}); }; const NR=.15;
  c.save(); c.globalAlpha*=fade; c.lineCap='round'; c.lineJoin='round';
  // ground shadow
  { const pts=[]; for(let i=0;i<12;i++){ const a=i*TAU/12; pts.push(S({f:P.pelvis.f+Math.cos(a)*.17,l:Math.sin(a)*.15,u:0})); } if(pts.every(p=>p.d>.15)){ c.fillStyle='rgba(0,0,0,.34)'; c.beginPath(); pts.forEach((p,i)=>i?c.lineTo(p.sx,p.sy):c.moveTo(p.sx,p.sy)); c.closePath(); c.fill(); } }
  // ---- robe loft: shaded, back-face culled panels
  const N=14, R=P.rings, ring=R.map(r=>{ const pts=[]; for(let j=0;j<N;j++){ const a=j*TAU/N; pts.push(S({f:r.f+r.hf*Math.cos(a),l:r.l+r.hl*Math.sin(a),u:r.u})); } return pts; });
  const cen=R.map(r=>W3({f:r.f,l:r.l,u:r.u}));
  for(let i=0;i<R.length-1;i++) for(let j=0;j<N;j++){ const j2=(j+1)%N; const A_=ring[i][j],B_=ring[i][j2],C_=ring[i+1][j2],D_=ring[i+1][j];
    const ux=B_.w.x-A_.w.x,uy=B_.w.y-A_.w.y,uz=B_.w.z-A_.w.z, vx=D_.w.x-A_.w.x,vy=D_.w.y-A_.w.y,vz=D_.w.z-A_.w.z;
    let nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx; const mx=(A_.w.x+B_.w.x+C_.w.x+D_.w.x)/4, my=(A_.w.y+B_.w.y+C_.w.y+D_.w.y)/4, mz=(A_.w.z+B_.w.z+C_.w.z+D_.w.z)/4;
    const ox=mx-(cen[i].x+cen[i+1].x)/2, oz=mz-(cen[i].z+cen[i+1].z)/2; if(nx*ox+nz*oz<0){ nx=-nx;ny=-ny;nz=-nz; } const nl=Math.hypot(nx,ny,nz)||1; nx/=nl;ny/=nl;nz/=nl;
    if(nx*(eye.x-mx)+ny*(eye.y-my)+nz*(eye.z-mz)<=0) continue; if(Math.min(A_.d,B_.d,C_.d,D_.d)<NR) continue;
    const {m,warm}=shadeAt({x:nx,y:ny,z:nz},{x:mx,y:my,z:mz}); const col=rgbS(R[i].band==='sash'?sash:robe,m,warm);
    add((A_.d+B_.d+C_.d+D_.d)/4,()=>{ c.fillStyle=col; c.strokeStyle=col; c.lineWidth=.9; c.beginPath(); c.moveTo(A_.sx,A_.sy); c.lineTo(B_.sx,B_.sy); c.lineTo(C_.sx,C_.sy); c.lineTo(D_.sx,D_.sy); c.closePath(); c.fill(); c.stroke(); }); }
  // cross collar (front) and sash tie, drawn on the front surface
  { const pA=S({f:P.neck.f+.04,l:.035,u:R[0].u-.005}), pB=S({f:R[3].f+R[3].hf*.96,l:-.03,u:R[3].u}), pC=S({f:R[4].f+R[4].hf,l:-.07,u:R[4].u+.005});
    const vis=F.x*(eye.x-pB.w.x)+F.z*(eye.z-pB.w.z); if(vis>0) add(pB.d-.04,()=>{ c.strokeStyle='rgba(226,212,190,.7)'; c.lineWidth=Math.max(1,.013*hM*pB.sc); c.beginPath(); c.moveTo(pA.sx,pA.sy); c.quadraticCurveTo(pB.sx,pB.sy,pC.sx,pC.sy); c.stroke(); });
    const tA=S({f:R[4].f+R[4].hf+.004,l:-.02,u:R[4].u-.01}), tB=S({f:R[4].f+R[4].hf+.01+.02*P.k,l:-.03,u:R[4].u-.14}); if(vis>0) add(tA.d-.03,()=>{ c.strokeStyle=rgbS(sash,light*.9,0); c.lineWidth=Math.max(1.2,.022*hM*tA.sc); c.beginPath(); c.moveTo(tA.sx,tA.sy); c.lineTo(tB.sx,tB.sy); c.stroke(); }); }
  // ---- capsules
  const cap=(a,b,ra,rb,col,bias)=>{ const A_=S(a),B_=S(b); if(Math.min(A_.d,B_.d)<NR) return; add((A_.d+B_.d)/2-(bias||0),()=>{ const r1=ra*hM*A_.sc, r2=rb*hM*B_.sc; const dx=B_.sx-A_.sx, dy=B_.sy-A_.sy, L=Math.hypot(dx,dy)||1e-3, nx=-dy/L, ny=dx/L;
    c.fillStyle=col; c.beginPath(); c.moveTo(A_.sx+nx*r1,A_.sy+ny*r1); c.lineTo(B_.sx+nx*r2,B_.sy+ny*r2); c.arc(B_.sx,B_.sy,r2,Math.atan2(ny,nx),Math.atan2(-ny,-nx),dx*ny-dy*nx>0); c.lineTo(A_.sx-nx*r1,A_.sy-ny*r1); c.arc(A_.sx,A_.sy,r1,Math.atan2(-ny,-nx),Math.atan2(ny,nx),dx*ny-dy*nx>0); c.closePath(); c.fill(); }); };
  const sideShade=(q,base)=>{ const w=W3(q), n={x:w.x-W3({f:P.pelvis.f,l:P.pelvis.l,u:q.u}).x,y:0,z:w.z-W3({f:P.pelvis.f,l:P.pelvis.l,u:q.u}).z}; const nl=Math.hypot(n.x,n.z)||1; n.x/=nl;n.z/=nl; const {m,warm}=shadeAt(n,w); return rgbS(base,m,warm); };
  if(!P.seated) [P.L,P.R].forEach(g=>{ const tc=sideShade(g.knee,dark);
    cap(g.hip,g.knee,.05,.042,tc); cap(g.knee,g.ankle,.04,.03,tc);
    cap(g.heel,g.toe,.026,.022,rgbS(shoe,light,0),-.0); });
  else [P.L,P.R].forEach(g=>{ cap(g.knee,g.ankle,.04,.03,rgbS(dark,light*.8,0)); cap(g.heel,g.toe,.026,.022,rgbS(shoe,light,0)); });
  // ---- arms: sleeve on the upper arm, wide hanging sleeve from the forearm that flares back on the backswing
  [['L',P.armL,1],['R',P.armR,-1]].forEach(([n,g,side])=>{ const col=sideShade(g.el,robe);
    cap({f:g.sh.f,l:g.sh.l,u:g.sh.u-.022},g.el,.036,.044,col,.012);
    const back=Math.max(0,-(g.sw||0))*.25*P.k, drop=.1;
    const fa=g.fa||0, dn={f:-back,u:-drop};
    const q=[]; const mid={f:lerp3(g.el.f,g.wr.f,.6),l:lerp3(g.el.l,g.wr.l,.6),u:lerp3(g.el.u,g.wr.u,.6)};
    [-.032,.032].forEach(dl=>{ q.push({f:g.el.f,l:g.el.l+dl,u:g.el.u+.012}); q.push({f:g.wr.f,l:g.wr.l+dl*.9,u:g.wr.u+.008});
      q.push({f:g.wr.f+dn.f*.7-.008,l:g.wr.l+dl,u:g.wr.u+dn.u*.45}); q.push({f:mid.f+dn.f*.8,l:mid.l+dl*1.25,u:mid.u+dn.u*1.05}); q.push({f:g.el.f+dn.f*.3,l:g.el.l+dl*1.1,u:g.el.u+dn.u*.55}); });
    const Q=q.map(S); const dd=Math.min(...Q.map(p=>p.d))<NR?-1:Q.reduce((s,p)=>s+p.d,0)/Q.length;
    const col2=sideShade(g.wr,robe);
    add(dd-.014,()=>{ const h_=hull(Q); c.fillStyle=col2; c.strokeStyle='rgba(0,0,0,.22)'; c.lineWidth=.8; c.beginPath(); h_.forEach((p,i)=>i?c.lineTo(p.sx,p.sy):c.moveTo(p.sx,p.sy)); c.closePath(); c.fill(); c.stroke(); });
    const Hd=S(g.hand); add(Hd.d-.02,()=>{ c.fillStyle=rgbS(skin,light*.95,0); c.beginPath(); c.arc(Hd.sx,Hd.sy,Math.max(1,.024*hM*Hd.sc),0,TAU); c.fill(); });
  });
  // ---- neck and head
  { const nv=F.x*(eye.x-fig.x)+F.z*(eye.z-fig.z)>0; cap({f:P.neck.f,l:P.neck.l,u:P.neck.u-.03},{f:P.head.f-.005,l:P.head.l,u:P.head.u-.055},.027,.026,rgbS(skin,light*(nv?.85:.4),0),-.06); }
  const hd=S(P.head), hr=.066*hM*Math.abs(hd.sc);
  const hw=hd.w, toEye=F.x*(eye.x-hw.x)+F.z*(eye.z-hw.z), te=toEye/(Math.hypot(eye.x-hw.x,eye.y-hw.y,eye.z-hw.z)||1);
  if(PP.hair==='long'){ const pts=[{f:P.head.f-.04,l:.052,u:P.head.u},{f:P.head.f-.04,l:-.052,u:P.head.u},{f:P.chest.f-.085,l:-.07,u:.69+P.pelvis.u-D.pelvisU},{f:P.chest.f-.085,l:.07,u:.69+P.pelvis.u-D.pelvisU}].map(S);
    add(pts.reduce((s,p)=>s+p.d,0)/4-.01,()=>{ c.fillStyle=rgbS(hair,1,0); c.beginPath(); pts.forEach((p,i)=>i?c.lineTo(p.sx,p.sy):c.moveTo(p.sx,p.sy)); c.closePath(); c.fill(); }); }
  if(PP.hair==='bun'){ const bn=S({f:P.head.f-.03,l:P.head.l,u:P.head.u+.062}), st=S({f:P.head.f-.03,l:P.head.l,u:P.head.u+.115}); add(bn.d,()=>{ c.fillStyle=rgbS(hair,1.2,0); c.beginPath(); c.arc(bn.sx,bn.sy,.034*hM*bn.sc,0,TAU); c.fill(); c.strokeStyle=PP.sash; c.lineWidth=Math.max(1,.012*hM*bn.sc); c.beginPath(); c.moveTo(bn.sx,bn.sy); c.lineTo(st.sx,st.sy); c.stroke(); }); }
  if(hd.d>NR) add(hd.d,()=>{ const hood=PP.hair==='hood';
    if(hood){ c.fillStyle=rgbS(robe,light*.95,0); c.beginPath(); c.arc(hd.sx,hd.sy-hr*.08,hr*1.32,0,TAU); c.fill(); }
    c.save(); c.beginPath(); c.arc(hd.sx,hd.sy,hr,0,TAU); c.fillStyle=hood?'#0d0b0e':rgbS(hair,1,0); c.fill(); c.strokeStyle='rgba(150,130,150,.35)'; c.lineWidth=Math.max(.8,hr*.12); c.stroke(); c.clip();
    if(te>-.5){ const fp=[]; for(let i=0;i<=8;i++) for(let j=0;j<=6;j++){ const az=(-1+i/4)*1.05, el=-.95+j*.2; const r=.065; fp.push(S({f:P.head.f+Math.cos(az)*Math.cos(el)*r,l:P.head.l+Math.sin(az)*Math.cos(el)*r,u:P.head.u+Math.sin(el)*r})); }
      const fh=hull(fp.filter(p=>Math.hypot(p.sx-hd.sx,p.sy-hd.sy)<=hr*1.02)); c.fillStyle=rgbS(skin,light*(hood?.75:1),0); c.beginPath(); fh.forEach((p,i)=>i?c.lineTo(p.sx,p.sy):c.moveTo(p.sx,p.sy)); c.closePath(); c.fill();
      const ns=S({f:P.head.f+.066,l:P.head.l,u:P.head.u-.012}); if(te>.1){ c.fillStyle='rgba(150,105,80,.45)'; c.beginPath(); c.arc(ns.sx,ns.sy,hr*.13,0,TAU); c.fill(); } }
    c.restore();
    if(!hood){ const cp=[]; for(let i=0;i<10;i++) for(let j=0;j<4;j++){ const a=i*TAU/10, e=.25+j*.42; const r=.068; cp.push(S({f:P.head.f+Math.cos(a)*Math.cos(e)*r-.008,l:P.head.l+Math.sin(a)*Math.cos(e)*r,u:P.head.u+.018+Math.sin(e)*r*.92})); }
      const h_=hull(cp); c.fillStyle=rgbS(hair,1.1,0); c.beginPath(); h_.forEach((p,i)=>i?c.lineTo(p.sx,p.sy):c.moveTo(p.sx,p.sy)); c.closePath(); c.fill(); }
  });
  // ---- lantern on its cord
  if(P.lantern){ const T_=S(P.lantern.top), B_=S(P.lantern.bot), lr=.02*hM*B_.sc;
    add(B_.d-.02,()=>{ c.strokeStyle='#2c2420'; c.lineWidth=1; c.beginPath(); c.moveTo(T_.sx,T_.sy); c.lineTo(B_.sx,B_.sy-lr*1.4); c.stroke();
      c.fillStyle='#2a221e'; c.fillRect(B_.sx-lr*1.2,B_.sy-lr*1.7,lr*2.4,lr*.4); c.fillRect(B_.sx-lr*1.2,B_.sy+lr*1.3,lr*2.4,lr*.4);
      c.fillStyle='#ffd9a0'; c.beginPath(); c.ellipse(B_.sx,B_.sy,lr,lr*1.45,0,0,TAU); c.fill(); }); }
  items.sort((a,b)=>b.d-a.d).forEach(it=>it.fn());
  if(P.lantern){ const B_=S(P.lantern.bot), r=.24*hM*B_.sc; c.save(); c.globalCompositeOperation='lighter'; const gg=c.createRadialGradient(B_.sx,B_.sy,0,B_.sx,B_.sy,r); gg.addColorStop(0,'rgba(255,196,110,.38)'); gg.addColorStop(1,'rgba(255,160,60,0)'); c.fillStyle=gg; c.beginPath(); c.arc(B_.sx,B_.sy,r,0,TAU); c.fill(); c.restore(); }
  if(o.bones){ const seg=(a,b,col)=>{ const A_=S(a),B_=S(b); c.strokeStyle=col; c.lineWidth=1.5; c.beginPath(); c.moveTo(A_.sx,A_.sy); c.lineTo(B_.sx,B_.sy); c.stroke(); };
    [['L','#f2b552'],['R','#7fb0e8']].forEach(([n,col])=>{ const g=P[n]; seg(g.hip,g.knee,col); seg(g.knee,g.ankle,col); seg(g.heel,g.toe,col); });
    [['armL','#f2b552'],['armR','#7fb0e8']].forEach(([n,col])=>{ const g=P[n]; seg(g.sh,g.el,col); seg(g.el,g.wr,col); });
    seg(P.pelvis,P.neck,'#e9e0cf'); seg(P.neck,P.head,'#e9e0cf'); }
  c.restore();
}
/* seated at a table: stool-height pelvis, thighs forward under the table, forearms resting on the edge */
function seatPose3(t){ const pu=.29, br=.004*Math.sin(t*1.6);
  const pelvis={f:0,l:0,u:pu}, chest={f:.035,l:0,u:pu+.14+br}, neck={f:.05,l:0,u:pu+.29+br}, head={f:.065,l:0,u:pu+.36+br+.004*Math.sin(t*.7)};
  const leg=side=>{ const hip={f:0,l:side*D.hipW,u:pu}, knee={f:.255,l:side*.075,u:pu+.01}, ankle={f:.27,l:side*.07,u:D.ankleH}; return {hip,knee,ankle,heel:{f:.235,l:side*.07,u:0},toe:{f:.385,l:side*.07,u:0},pitch:0,plant:true}; };
  const arm=side=>{ const sh={f:.055,l:side*.116,u:pu+.23+br}, sw=.42, fa=1.45; const el={f:sh.f+Math.sin(sw)*D.upper,l:side*.13,u:sh.u-Math.cos(sw)*D.upper}; const wr={f:el.f+Math.sin(fa)*D.fore,l:side*.08,u:el.u-Math.cos(fa)*D.fore}; return {sh,el,wr,hand:{f:wr.f+.03,l:wr.l,u:wr.u},sw:0,fa}; };
  const rings=[
    {f:neck.f,l:0,u:pu+.285+br,hf:.042,hl:.046},{f:.05,l:0,u:pu+.258+br,hf:.06,hl:.085},{f:.045,l:0,u:pu+.225+br,hf:.07,hl:.118},
    {f:.035,l:0,u:pu+.14+br,hf:.082,hl:.112},{f:.02,l:0,u:pu+.01,hf:.078,hl:.104,band:'sash'},{f:.015,l:0,u:pu-.025,hf:.08,hl:.108},
    {f:.12,l:0,u:pu-.02,hf:.2,hl:.14},{f:.17,l:0,u:pu-.09,hf:.21,hl:.15},{f:.18,l:0,u:.04,hf:.22,hl:.165}];
  return {k:0,phase:0,seated:true,pelvis,chest,neck,head,L:leg(1),R:leg(-1),armL:arm(1),armR:arm(-1),lean:.04,rings,hem:{fmin:-.04,fmax:.4,u:.04,sway:0}}; }
/* ---------- RIG.draw ---------- */
const PEOPLE={you:{robe:'#2a3346',sash:'#c98a3a',hair:'bun'},k1:{robe:'#5a2f2a',sash:'#d8c49a',hair:'long'},k2:{robe:'#2f4a3a',sash:'#b8c4d8',hair:'short'},k3:{robe:'#4a3b5c',sash:'#e0b0a0',hair:'hood'},k4:{robe:'#6b5a3a',sash:'#3a2a1a',hair:'bun'},k5:{robe:'#3a4a55',sash:'#e6d27a',hair:'long'}};
function seatPose(t){ const P=pose(0,0,{t}); const dn=.27;
  ['pelvis','chest','neck','head'].forEach(n=>P[n].u-=dn); ['armL','armR'].forEach(a=>['sh','el','wr'].forEach(j=>P[a][j].u-=dn));
  P.armL.el.f+=.06; P.armL.wr.f+=.16; P.armL.wr.u+=.1; P.armR.el.f+=.06; P.armR.wr.f+=.16; P.armR.wr.u+=.1;
  P.hem={fmin:-.09,fmax:.22,u:.02,sway:0}; P.seated=true; return P; }

function draw(c,x,baseY,h,who,P,o){
  o=o||{}; const PP=(typeof who==='object')?who:(PEOPLE[who]||PEOPLE.you);
  const a=o.facing==null?Math.PI/2:o.facing, sa=Math.sin(a), ca=Math.cos(a), tilt=o.tilt==null?.16:o.tilt;
  const pt=q=>({x:x+(q.f*sa+q.l*ca)*h, y:baseY-q.u*h+(q.f*ca-q.l*sa)*tilt*h, d:q.f*ca-q.l*sa});
  const light=o.light==null?1:o.light;
  c.save(); c.globalAlpha*=(o.fade==null?1:o.fade); c.lineCap='round'; c.lineJoin='round';
  // contact shadow
  c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x+P.pelvis.f*sa*h,baseY,h*.17,h*.17*Math.max(.18,tilt*1.4),0,0,TAU); c.fill();
  const hr=h*.066, pelvisP=pt(P.pelvis);
  // ---- legs (always under the robe; shins and shoes show below the hem)
  const legs=P.seated?[]:[['L',P.L],['R',P.R]].map(([n,g])=>({n,g,d:pt(g.knee).d})).sort((A,B)=>A.d-B.d);
  legs.forEach(({g},i)=>{ const far=i===0&&Math.abs(sa)>.35; const H_=pt(g.hip),K=pt(g.knee),A_=pt(g.ankle),He=pt(g.heel),T_=pt(g.toe);
    c.strokeStyle=far?'#17120f':'#2a221e'; c.lineWidth=Math.max(2,h*.058); c.beginPath(); c.moveTo(H_.x,H_.y); c.lineTo(K.x,K.y); c.stroke();
    c.lineWidth=Math.max(1.8,h*.046); c.beginPath(); c.moveTo(K.x,K.y); c.lineTo(A_.x,A_.y); c.stroke();
    // shoe: heel→toe with an upper; sole shows when seen from behind at toe-off
    const up={x:(He.x+T_.x)/2-(T_.y-He.y)*.0, y:(He.y+T_.y)/2};
    c.fillStyle=far?'#0c0a09':'#141011'; c.beginPath(); c.moveTo(He.x,He.y); c.quadraticCurveTo(A_.x,A_.y-h*.012,T_.x,T_.y); c.lineTo(He.x,He.y); c.fill();
    c.strokeStyle=far?'#0c0a09':'#141011'; c.lineWidth=Math.max(1.6,h*.034); c.beginPath(); c.moveTo(He.x,He.y-h*.008); c.lineTo(T_.x,T_.y-h*.008); c.stroke();
    if(ca<-.3&&g.pitch<-.2){ c.fillStyle='#5a4636'; c.beginPath(); c.ellipse(He.x,He.y-h*.01,h*.03*(.4+.6*Math.abs(ca)),h*.016,0,0,TAU); c.fill(); }
  });
  // ---- arms
  const arms=[['L',P.armL,1],['R',P.armR,-1]].map(([n,g,side])=>({n,g,side,d:pt(g.el).d}));
  const drawArm=(g,front)=>{ const S=pt(g.sh),E=pt(g.el),Wr=pt(g.wr); const drop=h*.105;
    c.strokeStyle=c.fillStyle=front?shade(PP.robe,1.05*light):shade(PP.robe,.62*light);
    c.lineWidth=h*.075; c.beginPath(); c.moveTo(S.x,S.y+h*.02); c.lineTo(E.x,E.y); c.lineTo(Wr.x,Wr.y+h*.01); c.stroke();
    c.beginPath(); c.moveTo(S.x,S.y-h*.012); c.lineTo(E.x,E.y-h*.014); c.lineTo(Wr.x,Wr.y-h*.012);
    c.quadraticCurveTo(Wr.x+(Wr.x-E.x)*.15,Wr.y+drop*.7,Wr.x-(Wr.x-E.x)*.2,Wr.y+drop);
    c.quadraticCurveTo(E.x,E.y+drop*1.15,S.x+(E.x-S.x)*.2,S.y+h*.07); c.closePath(); c.fill();
    c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=Math.max(.7,h*.004); c.beginPath(); c.moveTo(E.x,E.y+h*.01); c.quadraticCurveTo(Wr.x,Wr.y+drop*.5,Wr.x-(Wr.x-E.x)*.2,Wr.y+drop*.95); c.stroke();
    const hx_=Wr.x+(Wr.x-E.x)*.18, hy_=Wr.y+(Wr.y-E.y)*.18+h*.012;
    c.fillStyle=front?'#d6b494':'#a88a70'; c.beginPath(); c.arc(hx_,hy_,h*.022,0,TAU); c.fill();
    return {hx:hx_,hy:hy_}; };
  const backArms=arms.filter(r=>r.d<=0), frontArms=arms.filter(r=>r.d>0);
  const hands={};
  backArms.forEach(r=>{ hands[r.n]=drawArm(r.g,false); });
  // ---- long hair behind body when facing camera
  const head=pt(P.head);
  if(PP.hair==='long'&&ca>=0) longHair(c,head,hr,sa,ca,h,P);
  // ---- robe body
  const dU=P.pelvis.u-D.pelvisU;
  const lev=[
    {f:P.neck.f,l:P.neck.l,u:.835+dU,hf:.045,hl:.05},
    {f:(P.neck.f+P.chest.f)/2,l:P.chest.l,u:.80+dU,hf:.072,hl:.128},
    {f:P.chest.f,l:P.chest.l,u:.70+dU,hf:.085,hl:.118},
    {f:P.pelvis.f+P.lean*.3,l:P.pelvis.l,u:.545+dU,hf:.082,hl:.11},
    {f:P.pelvis.f,l:P.pelvis.l,u:.45+dU,hf:.092,hl:.126},
  ];
  const hm=P.hem, kneeU=(P.L.knee.u+P.R.knee.u)/2;
  lev.push({f:(Math.min(P.L.knee.f,P.R.knee.f)-.06+Math.max(P.L.knee.f,P.R.knee.f)+.06)/2,l:P.pelvis.l,u:P.seated?.22:kneeU,hf:P.seated?.13:(Math.max(P.L.knee.f,P.R.knee.f)-Math.min(P.L.knee.f,P.R.knee.f))/2+.07,hl:.142});
  lev.push({f:(hm.fmin+hm.fmax)/2+hm.sway,l:P.pelvis.l,u:hm.u,hf:(hm.fmax-hm.fmin)/2,hl:.158});
  const SP=lev.map(L_=>{ const cx=x+(L_.f*sa+L_.l*ca)*h, dd=L_.f*ca-L_.l*sa, cy=baseY-L_.u*h+dd*tilt*h; const hw=Math.hypot(L_.hf*sa,L_.hl*ca)*h; const vr=Math.hypot(L_.hf*ca,L_.hl*sa)*tilt*h; return {cx,cy,hw,vr}; });
  const robePath=()=>{ const n=SP.length, e=SP[n-1];
    const Lp=SP.map(p=>[p.cx-p.hw,p.cy]), Rp=SP.map(p=>[p.cx+p.hw,p.cy]).reverse();
    const cr=(pts,first)=>{ if(first) c.moveTo(pts[0][0],pts[0][1]); else c.lineTo(pts[0][0],pts[0][1]);
      for(let i=0;i<pts.length-1;i++){ const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
        c.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,p2[0],p2[1]); } };
    c.beginPath(); cr(Lp,true); c.ellipse(e.cx,e.cy,e.hw,Math.max(1,e.vr),0,Math.PI,0,true); cr(Rp,false); c.closePath(); };
  const minX=Math.min(...SP.map(p=>p.cx-p.hw)), maxX=Math.max(...SP.map(p=>p.cx+p.hw));
  const lg=c.createLinearGradient(minX,0,maxX,0); const lsx=o.lightSide==null?-1:o.lightSide;
  lg.addColorStop(lsx<0?0:1,shade(PP.robe,1.18*light)); lg.addColorStop(.55,shade(PP.robe,.85*light)); lg.addColorStop(lsx<0?1:0,shade(PP.robe,.42*light));
  c.fillStyle=lg; robePath(); c.fill();
  // fold lines from hip to each knee at the hem: the robe follows the legs
  c.strokeStyle='rgba(0,0,0,.3)'; c.lineWidth=Math.max(.8,h*.007);
  if(!P.seated) [P.L,P.R].forEach(g=>{ const top=pt({f:P.pelvis.f,l:g.hip.l*.7,u:P.pelvis.u-.04}); const kn=pt(g.knee); const bot=pt({f:g.knee.f+(hm.sway||0),l:g.knee.l*1.4,u:hm.u+.01});
    c.beginPath(); c.moveTo(top.x,top.y); c.quadraticCurveTo(kn.x,kn.y,bot.x,bot.y); c.stroke(); });
  // sash
  const sw=SP[3]; c.fillStyle=shade(PP.sash,light); c.beginPath(); c.moveTo(sw.cx-sw.hw*1.02,sw.cy-h*.018); c.lineTo(sw.cx+sw.hw*1.02,sw.cy-h*.018); c.lineTo(sw.cx+sw.hw*1.04,sw.cy+h*.018); c.lineTo(sw.cx-sw.hw*1.04,sw.cy+h*.018); c.closePath(); c.fill();
  if(ca>-.2){ const tx=sw.cx+sa*sw.hw*.2+ca*h*.03; c.beginPath(); c.moveTo(tx-h*.012,sw.cy); c.lineTo(tx+sa*h*.01+Math.sin((P.phase||0)*TAU)*h*.01,sw.cy+h*.13); c.lineTo(tx+h*.014,sw.cy); c.fill(); }
  // cross collar (jiaoling youren) when the front shows, seam when the back shows
  const nk=SP[0], ch=SP[2];
  if(ca>.05){ c.strokeStyle=`rgba(225,212,190,${.6*Math.min(1,ca*1.6)})`; c.lineWidth=Math.max(1.2,h*.016); c.beginPath(); c.moveTo(nk.cx+nk.hw*.9,nk.cy); c.quadraticCurveTo(ch.cx,ch.cy-h*.02,sw.cx-sw.hw*.55,sw.cy-h*.02); c.stroke();
    c.strokeStyle=`rgba(0,0,0,.35)`; c.lineWidth=Math.max(.8,h*.006); c.beginPath(); c.moveTo(nk.cx-nk.hw*.9,nk.cy); c.lineTo(ch.cx+ch.hw*.2,ch.cy-h*.04); c.stroke(); }
  else if(ca<-.05){ c.strokeStyle='rgba(0,0,0,.3)'; c.lineWidth=Math.max(.8,h*.006); c.beginPath(); c.moveTo(nk.cx,nk.cy); c.lineTo(sw.cx,sw.cy-h*.02); c.stroke(); }
  // rim light from the lamp side
  if(o.rim){ c.save(); c.strokeStyle=`rgba(255,184,96,${.45*o.rim})`; c.lineWidth=Math.max(1,h*.008); c.beginPath(); for(let i=0;i<SP.length;i++){ const p=SP[i]; const xx=p.cx+lsx*p.hw; i?c.lineTo(xx,p.cy):c.moveTo(xx,p.cy);} c.stroke(); c.restore(); }
  // ---- neck + head
  const nkp=pt(P.neck); c.fillStyle=ca>-.3?'#c9a283':'#8a6e5a'; c.fillRect(nkp.x-hr*.35,nkp.y-h*.03,hr*.7,h*.035);
  drawHead(c,head,hr,sa,ca,PP,P,h);
  frontArms.forEach(r=>{ hands[r.n]=drawArm(r.g,true); });
  if(o.lamp){ const hd=hands.R||hands.L; drawLamp(c,hd.hx,hd.hy,h,P.phase||0,o.t||0); }
  if(o.bones) drawBones(c,P,pt,h);
  c.restore();
}
function longHair(c,head,hr,sa,ca,h,P){ c.fillStyle='#17131a'; c.beginPath(); const bx=head.x-sa*hr*.3; c.moveTo(bx-hr,head.y); c.quadraticCurveTo(bx-hr*1.15,head.y+hr*2.4,bx-hr*.55-sa*hr*.4,head.y+h*.2); c.lineTo(bx+hr*.55-sa*hr*.4,head.y+h*.2); c.quadraticCurveTo(bx+hr*1.15,head.y+hr*2.4,bx+hr,head.y); c.closePath(); c.fill(); }
function drawHead(c,hd,hr,sa,ca,PP,P,h){
  const HAIR='#17131a';
  if(PP.hair==='hood'){ c.fillStyle=shade(PP.robe,.9); c.beginPath(); c.ellipse(hd.x-sa*hr*.15,hd.y-hr*.1,hr*1.32,hr*1.42,0,0,TAU); c.fill();
    if(ca>-.2){ c.fillStyle='#0d0b0e'; c.beginPath(); c.ellipse(hd.x+sa*hr*.45,hd.y+hr*.1,hr*(.45+.35*Math.max(0,ca)),hr*.8,0,0,TAU); c.fill();
      c.fillStyle='rgba(214,180,148,.7)'; c.beginPath(); c.ellipse(hd.x+sa*hr*.55,hd.y+hr*.2,hr*(.32+.28*Math.max(0,ca)),hr*.6,0,0,TAU); c.fill(); }
    return; }
  if(PP.hair==='long'&&ca<0) longHair(c,hd,hr,sa,ca,h,P);
  c.save(); c.beginPath(); c.arc(hd.x,hd.y,hr,0,TAU); c.fillStyle=HAIR; c.fill(); c.clip();
  if(ca>-.45){ const vis=cl((ca+.45)/1.2,0,1); c.fillStyle='#d6b494'; c.beginPath(); c.ellipse(hd.x+sa*hr*.5,hd.y+hr*.22,hr*(.42+.4*Math.max(0,ca))*(.6+.4*vis),hr*.92,0,0,TAU); c.fill();
    c.fillStyle='rgba(120,80,60,.35)'; c.beginPath(); c.ellipse(hd.x+sa*hr*.5-sa*hr*.25,hd.y+hr*.3,hr*.25,hr*.6,0,0,TAU); c.fill(); }
  // hairline cap
  c.fillStyle=HAIR; c.beginPath(); c.ellipse(hd.x-sa*hr*.22,hd.y-hr*.42,hr*1.05,hr*.66,0,0,TAU); c.fill();
  c.restore();
  if(Math.abs(sa)>.5&&ca>-.6){ c.fillStyle='#d6b494'; c.beginPath(); c.moveTo(hd.x+sa*hr*.95,hd.y+hr*.05); c.lineTo(hd.x+sa*hr*1.14,hd.y+hr*.3); c.lineTo(hd.x+sa*hr*.95,hd.y+hr*.4); c.fill(); }
  if(PP.hair==='bun'){ c.fillStyle=HAIR; c.beginPath(); c.ellipse(hd.x-sa*hr*.45,hd.y-hr*1.05,hr*.46,hr*.38,0,0,TAU); c.fill(); c.fillStyle=PP.sash; c.fillRect(hd.x-sa*hr*.45-hr*.06,hd.y-hr*1.55,hr*.12,hr*.55); }
  if(PP.hair==='short'){ c.fillStyle=HAIR; c.beginPath(); c.arc(hd.x-sa*hr*.1,hd.y-hr*.1,hr*1.06,Math.PI*1.02,-.02); c.fill(); }
}
function drawLamp(c,x,y,h,phase,t){ const sw=Math.sin(TAU*phase+1.2)*h*.02, lx=x+sw, ly=y+h*.09;
  c.strokeStyle='#2c2420'; c.lineWidth=1; c.beginPath(); c.moveTo(x,y); c.lineTo(lx,ly-h*.03); c.stroke();
  c.save(); c.globalCompositeOperation='lighter'; const g=c.createRadialGradient(lx,ly,0,lx,ly,h*.32); g.addColorStop(0,'rgba(255,196,110,.5)'); g.addColorStop(1,'rgba(255,160,60,0)'); c.fillStyle=g; c.beginPath(); c.arc(lx,ly,h*.32,0,TAU); c.fill(); c.restore();
  c.fillStyle='#2a221e'; c.fillRect(lx-h*.022,ly-h*.036,h*.044,h*.008); c.fillRect(lx-h*.022,ly+h*.026,h*.044,h*.008);
  c.fillStyle='#ffd9a0'; c.beginPath(); c.ellipse(lx,ly,h*.018,h*.028,0,0,TAU); c.fill(); }
function drawBones(c,P,pt,h){ const seg=(a,b,col)=>{ const A=pt(a),B=pt(b); c.strokeStyle=col; c.lineWidth=Math.max(1.4,h*.008); c.beginPath(); c.moveTo(A.x,A.y); c.lineTo(B.x,B.y); c.stroke(); };
  const dot=(a,col)=>{ const A=pt(a); c.fillStyle=col; c.beginPath(); c.arc(A.x,A.y,Math.max(2.2,h*.011),0,TAU); c.fill(); };
  [['L','#f2b552'],['R','#7fb0e8']].forEach(([n,col])=>{ const g=P[n]; seg(g.hip,g.knee,col); seg(g.knee,g.ankle,col); seg(g.heel,g.toe,col); seg(g.ankle,g.heel,col); [g.hip,g.knee,g.ankle,g.heel,g.toe].forEach(j=>dot(j,col)); if(g.plant){ const T=pt(g.toe),He=pt(g.heel); c.fillStyle=col; c.fillRect(Math.min(He.x,T.x),Math.max(He.y,T.y)+3,Math.abs(T.x-He.x),2);} });
  [['armL','#f2b552'],['armR','#7fb0e8']].forEach(([n,col])=>{ const g=P[n]; seg(g.sh,g.el,col); seg(g.el,g.wr,col); [g.sh,g.el,g.wr].forEach(j=>dot(j,col)); });
  seg(P.pelvis,P.chest,'#e9e0cf'); seg(P.chest,P.neck,'#e9e0cf'); seg(P.neck,P.head,'#e9e0cf'); seg(P.L.hip,P.R.hip,'#e9e0cf'); seg(P.armL.sh,P.armR.sh,'#e9e0cf'); [P.pelvis,P.chest,P.neck,P.head].forEach(j=>dot(j,'#e9e0cf')); }

/* camera-aware projection with yaw (generalises v5 proj; dir:-1 == yaw:PI) */
function project(x,y,z,cam,W,H){ const yaw=cam.yaw||0, cy=Math.cos(yaw), sy=Math.sin(yaw); const dx=x-cam.x, dz=z-cam.z;
  const xc=dx*cy-dz*sy, d=dx*sy+dz*cy; const f=W*(cam.fov||.95), hz=H*(cam.hz||.4), ch=cam.h==null?1.55:cam.h; return {d,xc,sx:W*.5+xc*f/d,sy:hz+(ch-y)*f/d,sc:f/d}; }

export const RIG={D,pose,draw,draw3,seatPose,seatPose3,lantern,drawBones,PEOPLE,stride:h=>D.stride*(h||1)};
export const PROJ=project;
export default RIG;
