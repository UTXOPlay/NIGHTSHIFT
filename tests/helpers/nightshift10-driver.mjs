import {roadblockThreat} from '../../games/arcade/web/nightshift9-recovery.mjs';
import {EVENTS,contractActive,WEAPON_COST,weaponTargets} from '../../games/arcade/web/nightshift10-rules.mjs';
export function driveInput(g,state={}){
 let bits=0;const e=EVENTS[g.mode],needed=g.rivals.filter(r=>!r.finish&&r.hp>0&&!r.recover&&contractActive(g,r.id)&&!(g.contract_done&(1<<r.id))),pursuing=e.type===3&&needed.length>0,speed=Math.max(1,Math.trunc(g.speed/100)),hazards=g.bodies.filter(b=>[1,8].includes(b.tag)&&b.y>300&&b.y<900),items=g.bodies.filter(b=>b.tag>=2&&b.tag<=10&&b.tag!==8&&b.y>250&&b.y<820);
 for(const r of g.rivals){const gap=r.distance-g.distance;if(Math.abs(gap)<1100&&!r.finish)hazards.push({x:r.x,y:830-gap,vx:Math.max(-30,Math.min(30,r.target-r.x))+(r.side_v||0)/4,vy:Math.floor(r.speed/100),tag:9});}
 const choices=[0,500,1000,1500,2000].map(target=>{let value=-Math.abs(target-g.drift_x)/170;
 for(const b of hazards){const ahead=830-b.y,ticks=ahead/Math.max(1,speed-b.vy);if(b.tag===9&&ahead<0&&ahead> -500&&b.vy>speed&&Math.abs(b.x-target)<470)value-=220;if(ahead> -80&&ahead<500){const x=Math.max(0,Math.min(2000,b.x+b.vx*Math.min(ticks,50)));if(Math.abs(x-target)<620)value-=ahead<200?550:140;}}
 for(const r of g.rivals)if(r.attack_target===-1&&r.windup&&Math.abs(r.attack_x-target)<550)value-=200;
 for(const b of items)if(Math.abs(b.x-target)<380)value+=(b.tag===3&&g.shield<2?50:b.tag===6&&e.type===3?45:b.tag===2?7:12)+(b.y-250)/100;
 if(pursuing){const r=needed.filter(r=>g.gadget===2?r.distance<g.distance-100&&g.distance-r.distance<850:r.distance-g.distance>180&&r.distance-g.distance<850).sort((a,b)=>a.hp-b.hp||Math.abs(a.distance-g.distance)-Math.abs(b.distance-g.distance))[0];if(r&&Math.abs(target-r.x)<250)value+=100;}

 return {target,value};}).sort((a,b)=>b.value-a.value);let target=choices[0].target;
 const roadblock=roadblockThreat(g);if(e.type===1&&roadblock?.opening&&roadblock.distance>0&&roadblock.distance<300)target=roadblock.opening.x;
 if(e.type===2&&g.style<e.style+400){state.target??=1800;if(g.drift_x>1650)state.target=200;if(g.drift_x<350)state.target=1800;if(!hazards.some(b=>b.y>550&&Math.abs(b.x-state.target)<500))target=state.target;bits|=8;}
 if(pursuing&&g.gadget!==2&&needed.some(r=>r.distance<g.distance&&g.distance-r.distance<1800)&&!needed.some(r=>r.distance>g.distance+200&&r.distance<g.distance+850))bits|=8;

 const d=target-g.drift_x-(g.steer_v+(g.side_v||0)/4+(g.yaw||0)*g.speed/4000)*2;if(d>65)bits|=2;else if(d< -65)bits|=1;if(!(bits&3)&&e.type===2)bits&=~8;
 if(g.counter&&!g.counter_cd&&g.rivals.some(r=>r.attack_target===-1&&r.windup>0&&r.windup<12&&Math.abs(r.attack_x-g.drift_x)<500))bits|=64;
 if(g.pulse>=WEAPON_COST[g.gadget]&&g.hull&&!g.weapon_cd&&!g.pulse_lock&&(g.gadget===0?g.lock_ticks>=18&&!g.rivals[g.lock_id].defend:g.gadget===1?weaponTargets(g).length>0:g.rivals.some(r=>!r.stun&&r.hp>0&&r.distance<g.distance-120&&g.distance-r.distance<850&&Math.abs(r.x-g.drift_x)<480)))bits|=32;
 if((e.type!==2||g.style>=e.style)&&(!pursuing||g.gadget===2||!needed.some(r=>r.distance-g.distance>0&&r.distance-g.distance<900))&&(g.charge>=300||g.nitro)&&!g.ability_lock&&!g.ability_ticks&&!hazards.some(b=>b.y>600&&b.y<900&&Math.abs(b.x-g.drift_x)<450))bits|=16;
 const danger=hazards.filter(b=>{const ahead=830-b.y,closing=speed-b.vy;return ahead> -30&&ahead<450&&closing>2&&ahead/closing<30&&Math.abs(b.x-g.drift_x)<650;}).sort((a,b)=>b.y-a.y)[0];
 if(danger){bits|=8;bits&=~16;if(g.speed>900&&(830-danger.y)/Math.max(1,speed-danger.vy)<22)bits&=~3;}
 if(e.type===2&&g.speed<1000)bits&=~8;
 return bits;
}
