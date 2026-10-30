import {driveInput} from './nightshift14-driver.mjs';
import {packInput,readInput} from '../../games/arcade/web/nightshift12-input.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Ordinary pedal/steering commands for reproducible visual acceptance, no state writes.
export function combatInput(g,kind){
 const input=readInput(driveInput(g));
 if(kind==='collision'||kind==='wreck')return packInput(0,clamp((1000-g.drift_x-g.lateral_v*3)*.45,-100,100),0,100);
 if(['hit','guard','recover'].includes(kind)){
  input.flags&=~(16|32|64);
  const threat=g.rivals.find(r=>r.attack_target===-1&&r.windup&&Math.abs(r.distance-g.distance)<900);
  if(threat){input.steering=clamp((threat.attack_x-g.drift_x-g.lateral_v*3)*.45,-100,100);input.brake=0;input.throttle=100;if(kind==='guard'&&threat.windup<12&&!g.counter_cd&&g.counter)input.flags|=64;}
 }
 return packInput(input.flags,input.steering,input.brake,input.throttle);
}
export function combatReached(kind,a,b){
 if(kind==='collision')return a.shield<b.shield;
 if(kind==='wreck')return a.over&&a.finish_reason===2;
 if(kind==='hit')return a.hull<b.hull;
 if(kind==='guard')return a.counter_ticks>b.counter_ticks;
 if(kind==='recover')return a.hull>b.hull&&a.recover>b.recover;
 if(kind==='rival-hit')return a.attack_hits>b.attack_hits&&a.rivals.some((r,n)=>r.hp<b.rivals[n].hp);
 return a.takedowns>b.takedowns;
}
