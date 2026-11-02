/* Lantern Hall route planner: NAV (visibility graph around inflated circles, Catmull-Rom smoothed, arc-length)
   and PATH (reverse, facing, toWorld, travel). Split from the v6 reel's rig.js (six-faces-council
   artifacts/lantern-hall/v6, council #745), brief "Lantern Hall, portable kit". Pure functions, no drawing.
   PATH.reverse is the fix for his note "They didn't walk the same path back to the table": the walk back is the walk
   out reversed, point for point. Piece card: six-faces-council council/parts/lantern-route-planner.md. */
const TAU=Math.PI*2;
const cl=(x,a,b)=>Math.max(a,Math.min(b,x)), lp=(a,b,k)=>a+(b-a)*k;
/* ---------- NAV: visibility graph around inflated circles, Catmull-Rom smoothed, arc-length ---------- */
function segClear(a,b,obs){ for(const o of obs){ const dx=b.x-a.x,dz=b.z-a.z,L2=dx*dx+dz*dz; let t=L2?((o.x-a.x)*dx+(o.z-a.z)*dz)/L2:0; t=cl(t,0,1); const px=a.x+dx*t-o.x, pz=a.z+dz*t-o.z; if(px*px+pz*pz<o.rr*o.rr-1e-6) return false; } return true; }
function plan(from,to,obstacles,opt){
  opt=opt||{}; const clear=opt.clear==null?.35:opt.clear, B=opt.bounds||{xmin:-4.8,xmax:4.8,zmin:-3,zmax:43};
  const obs=obstacles.map(o=>({x:o.x,z:o.z,rr:(o.r||1.3)+clear}));
  const inB=p=>p.x>=B.xmin&&p.x<=B.xmax&&p.z>=B.zmin&&p.z<=B.zmax, free=p=>obs.every(o=>Math.hypot(p.x-o.x,p.z-o.z)>=o.rr-1e-6);
  const nodes=[{x:from.x,z:from.z},{x:to.x,z:to.z}];
  obs.forEach(o=>{ for(let i=0;i<12;i++){ const a=i*TAU/12+.13; const p={x:o.x+Math.cos(a)*o.rr*1.06,z:o.z+Math.sin(a)*o.rr*1.06}; if(inB(p)&&free(p)) nodes.push(p);} });
  const n=nodes.length, dist=Array(n).fill(Infinity), prev=Array(n).fill(-1), done=Array(n).fill(false); dist[0]=0;
  for(let it=0;it<n;it++){ let u=-1; for(let i=0;i<n;i++) if(!done[i]&&(u<0||dist[i]<dist[u])) u=i; if(u<0||dist[u]===Infinity) break; done[u]=true; if(u===1) break;
    for(let v=0;v<n;v++){ if(done[v]) continue; const w=Math.hypot(nodes[u].x-nodes[v].x,nodes[u].z-nodes[v].z); if(dist[u]+w<dist[v]&&segClear(nodes[u],nodes[v],obs)){ dist[v]=dist[u]+w; prev[v]=u; } } }
  const way=[]; for(let v=1;v>=0;v=prev[v]) { way.unshift(nodes[v]); if(v===0) break; }
  if(way[0]!==nodes[0]) way.unshift(nodes[0]);
  // Catmull-Rom (centripetal-ish via uniform with doubled ends), dense
  const P=[way[0],...way,way[way.length-1]], dense=[];
  for(let i=1;i<P.length-2;i++){ const p0=P[i-1],p1=P[i],p2=P[i+1],p3=P[i+2]; const segL=Math.hypot(p2.x-p1.x,p2.z-p1.z), N=Math.max(4,Math.ceil(segL/.08));
    for(let j=0;j<N;j++){ const t=j/N,t2=t*t,t3=t2*t; const f=(a,b,c_,d)=>.5*((2*b)+(-a+c_)*t+(2*a-5*b+4*c_-d)*t2+(-a+3*b-3*c_+d)*t3); dense.push({x:f(p0.x,p1.x,p2.x,p3.x),z:f(p0.z,p1.z,p2.z,p3.z)}); } }
  dense.push({x:to.x,z:to.z});
  // push out of inflated circles, then relax lightly (keeping ends)
  for(let pass=0;pass<4;pass++){
    for(let i=1;i<dense.length-1;i++){ const p=dense[i]; obs.forEach(o=>{ const dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz); if(d<o.rr){ p.x=o.x+dx/d*o.rr; p.z=o.z+dz/d*o.rr; } }); }
    if(pass<3) for(let i=1;i<dense.length-1;i++){ const a=dense[i-1],b=dense[i+1],p=dense[i]; p.x=lp(p.x,(a.x+b.x)/2,.35); p.z=lp(p.z,(a.z+b.z)/2,.35); }
  }
  return build(dense,{waypoints:way,obs});
}
function build(pts,extra){ const cum=[0]; for(let i=1;i<pts.length;i++) cum.push(cum[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z)); return Object.assign({pts,cum,len:cum[cum.length-1]},extra||{}); }
function sample(path,s){ const {pts,cum,len}=path;
  if(s<=0){ const a=pts[0],b=pts[1], d=Math.hypot(b.x-a.x,b.z-a.z)||1, dx=(b.x-a.x)/d, dz=(b.z-a.z)/d; return {x:a.x+dx*s,z:a.z+dz*s,heading:Math.atan2(dx,dz),dx,dz}; }
  if(s>=len){ const a=pts[pts.length-2],b=pts[pts.length-1], d=Math.hypot(b.x-a.x,b.z-a.z)||1, dx=(b.x-a.x)/d, dz=(b.z-a.z)/d; return {x:b.x+dx*(s-len),z:b.z+dz*(s-len),heading:Math.atan2(dx,dz),dx,dz}; }
  let lo=0,hi=cum.length-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(cum[m]<=s) lo=m; else hi=m; }
  const a=pts[lo],b=pts[hi], k=(s-cum[lo])/((cum[hi]-cum[lo])||1);
  // heading from a short centred chord, for smooth turns
  const A=at(path,s-.25), Bp=at(path,s+.25); const dx0=Bp.x-A.x, dz0=Bp.z-A.z, dd=Math.hypot(dx0,dz0)||1;
  return {x:lp(a.x,b.x,k),z:lp(a.z,b.z,k),heading:Math.atan2(dx0,dz0),dx:dx0/dd,dz:dz0/dd}; }
function at(path,s){ const {pts,cum,len}=path; s=cl(s,0,len); let lo=0,hi=cum.length-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(cum[m]<=s) lo=m; else hi=m; } const k=(s-cum[lo])/((cum[hi]-cum[lo])||1); return {x:lp(pts[lo].x,pts[hi].x,k),z:lp(pts[lo].z,pts[hi].z,k)}; }

/* ---------- PATH helpers ---------- */
const PATH={
  reverse:p=>build(p.pts.slice().reverse().map(q=>({x:q.x,z:q.z})),{waypoints:(p.waypoints||[]).slice().reverse(),obs:p.obs}),
  // world→figure: facing angle relative to the camera ray (0 = toward camera, PI = away, +PI/2 = toward screen right)
  facing:(heading,fx,fz,cam)=>{ const ray=Math.atan2(fx-cam.x,fz-cam.z); return Math.PI-(heading-ray); },
  // world position of a figure-local point (f,l) for a figure at (x,z) with heading, scaled by height
  toWorld:(x,z,heading,f,l,h)=>({x:x+(Math.sin(heading)*f-Math.cos(heading)*l)*h, z:z+(Math.cos(heading)*f+Math.sin(heading)*l)*h}),
  // trapezoid speed profile: distance travelled at time t over a path of length len
  travel:(t,len,v,acc)=>{ acc=acc||.7; const ta=Math.min(acc,len/v); const da=v*ta/2; const tc=Math.max(0,(len-2*da)/v), T=2*ta+tc;
    if(t<=0) return {s:0,v:0,done:false,T}; if(t>=T) return {s:len,v:0,done:true,T};
    if(t<ta) return {s:v*t*t/(2*ta),v:v*t/ta,done:false,T}; if(t<ta+tc) return {s:da+v*(t-ta),v,done:false,T};
    const r=T-t; return {s:len-v*r*r/(2*ta),v:v*r/ta,done:false,T}; },
};

export const NAV={plan,sample,at,segClear,build};
export {PATH};
