// One two-step run cycle contains two identical contact-to-contact intervals.
// Heights are metres relative to foot strike. The velocity at both ends of
// an interval matches, so looping does not add a vertical velocity jump.
const keys=[
  [0,0,-.32],       // strike: body is still descending
  [.18,-.04,0],     // leg compression
  [.40,0,.50],      // toe-off: rising quickly
  [.70,.09,0],      // flight apex
  [1,0,-.32],      // next strike
];

export function sampleRunDynamics(phase,{compression=1,flight=1}={}){
  const u=((phase*2)%1+1)%1;
  let i=0;while(i<keys.length-2&&keys[i+1][0]<u)i++;
  const [ta,ya,ma]=keys[i],[tb,yb,mb]=keys[i+1],span=tb-ta,t=(u-ta)/span;
  const h00=2*t*t*t-3*t*t+1,h10=t*t*t-2*t*t+t,h01=-2*t*t*t+3*t*t,h11=t*t*t-t*t;
  const height=h00*ya+h10*span*ma+h01*yb+h11*span*mb;
  return {height:height*(height<0?compression:flight),phase:u,
    stage:u<.18?'compression':u<.4?'push-off':u<.7?'rising flight':'landing flight'};
}
