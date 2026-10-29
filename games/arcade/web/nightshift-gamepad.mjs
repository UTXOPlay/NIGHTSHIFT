// Standard Gamepad mapping only. Browser objects are sampled afresh every frame.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=n=>typeof n==='number'&&Number.isFinite(n)?n:0;
export function stickAxis(n){n=clamp(finite(n),-1,1);return Math.abs(n)<=.18?0:clamp(Math.sign(n)*(Math.abs(n)-.18)/.82,-1,1);}
const button=(p,n)=>clamp(finite(p.buttons?.[n]?.value),0,1);
function sample(p){
 const x=stickAxis(p.axes?.[0]),y=stickAxis(p.axes?.[1]);
 const buttons=Array.from({length:17},(_,n)=>button(p,n));
 const direction=buttons[12]>.5?'up':buttons[13]>.5?'down':buttons[14]>.5?'left':buttons[15]>.5?'right':Math.abs(x)>.55&&Math.abs(x)>Math.abs(y)?x<0?'left':'right':Math.abs(y)>.55?y<0?'up':'down':null;
 return{x,y,buttons,direction,neutral:x===0&&y===0&&buttons.every(v=>v<.15)};
}
export class GamepadInput{
 constructor(){this.states=new Map();this.index=null;this.active=false;this.direction=null;this.repeatAt=0;}
 suspend(){this.active=false;this.direction=null;for(const s of this.states.values())s.armed=false;}
 poll(pads,{enabled=true,now=0}={}){
  const valid=Array.from(pads||[]).filter(p=>p?.connected&&p.mapping==='standard'&&Number.isInteger(p.index));
  const lost=this.index!==null&&!valid.some(p=>p.index===this.index)&&this.active;
  if(lost)this.suspend();
  if(!valid.some(p=>p.index===this.index)){this.index=null;this.active=false;this.direction=null;}
  for(const n of this.states.keys())if(!valid.some(p=>p.index===n))this.states.delete(n);
  const samples=new Map();
  for(const p of valid){
   const v=sample(p);let state=this.states.get(p.index);
   if(!state){state={armed:false,buttons:v.buttons};this.states.set(p.index,state);}
   if(!enabled)state.armed=false;
   else if(v.neutral)state.armed=true;
   const edges=v.buttons.map((b,n)=>b>.5&&state.buttons[n]<=.5);
   if(enabled&&state.armed&&!v.neutral&&!this.active){this.index=p.index;this.active=true;this.direction=null;}
   samples.set(p.index,{...v,edges,armed:state.armed});state.buttons=v.buttons;
  }
  const s=samples.get(this.index),active=Boolean(enabled&&this.active&&s?.armed);
  const result={active,lost,connected:valid.length>0,index:this.index,x:0,brake:0,reverse:false,drift:false,boost:false,fire:false,counter:false,pause:false,confirm:false,back:false,direction:null};
  if(!active)return result;
  Object.assign(result,{x:s.x,brake:s.buttons[6],reverse:s.buttons[4]>.5,drift:s.buttons[1]>.5,boost:s.buttons[7]>.5,fire:s.buttons[2]>.5,counter:s.buttons[3]>.5,pause:s.edges[9],confirm:s.edges[0],back:s.edges[1]});
  if(s.direction!==this.direction){this.direction=s.direction;this.repeatAt=now+400;result.direction=s.direction;}
  else if(s.direction&&now>=this.repeatAt){result.direction=s.direction;this.repeatAt=now+150;}
  return result;
 }
}
// The V8–V10 rules have automatic throttle. Preserve their seven-bit tapes.
// Steering uses feedback against the actual native steering velocity.
export function gamepadBits(sample,g,turn){
 if(!sample?.active)return 0;
 let bits=0;const target=sample.x*turn*(g.speed<0?-1:1),delta=target-g.steer_v;
 if(delta>6)bits|=2;else if(delta< -6)bits|=1;
 if(sample.brake>.2||sample.drift)bits|=8;
 if(sample.reverse)bits|=4;
 if(sample.boost)bits|=16;if(sample.fire)bits|=32;if(sample.counter)bits|=64;
 return bits;
}
export const GAMEPAD_KEYS=Object.freeze({8:'LT / B',16:'RT',32:'X',64:'Y'});
// Spatial menu navigation keeps thumbnail grids, modal dialogs and upgrades usable.
export function focusTarget(rects,current,direction){
 if(!rects.length)return -1;if(current<0||current>=rects.length)return 0;
 const from=rects[current],vertical=direction==='up'||direction==='down',sign=direction==='up'||direction==='left'?-1:1;
 let best=-1,score=Infinity;
 for(let n=0;n<rects.length;n++){
  if(n===current)continue;const r=rects[n],dx=(r.left+r.right-from.left-from.right)/2,dy=(r.top+r.bottom-from.top-from.bottom)/2;
  const along=(vertical?dy:dx)*sign,across=Math.abs(vertical?dx:dy);if(along<=2)continue;
  const value=along+across*2+across*across/Math.max(20,along);
  if(value<score){score=value;best=n;}
 }
 return best<0?current:best;
}
