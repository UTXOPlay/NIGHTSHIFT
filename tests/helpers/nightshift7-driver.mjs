import {EVENTS} from '../../games/arcade/web/nightshift7-rules.mjs';
export function driveInput(g,state={}){
 let bits=0;const e=EVENTS[g.mode],speed=Math.max(5,Math.floor(g.speed/100)),hazards=g.bodies.filter(b=>[1,8].includes(b.tag)&&b.y>300&&b.y<900),items=g.bodies.filter(b=>b.tag>=2&&b.tag<=10&&b.tag!==8&&b.y>250&&b.y<820);
 for(const r of g.rivals){const gap=r.distance-g.distance;if(Math.abs(gap)<1000&&!r.stun)hazards.push({x:r.x,y:830-gap,vx:0,vy:Math.floor(r.speed/100),tag:9});}
 const choices=[0,500,1000,1500,2000].map(target=>{let value=-Math.abs(target-g.drift_x)/170;
 for(const b of hazards){const ahead=830-b.y,ticks=ahead/Math.max(1,speed-b.vy);if(b.tag===9&&ahead<0&&ahead> -500&&b.vy>speed&&Math.abs(b.x-target)<470)value-=220;if(ahead> -80&&ahead<500){const x=Math.max(0,Math.min(2000,b.x+b.vx*Math.min(ticks,50)));if(Math.abs(x-target)<470)value-=ahead<200?550:140;}}
 for(const r of g.rivals)if(r.windup&&Math.abs(r.attack_x-target)<550)value-=200;
 for(const b of items)if(Math.abs(b.x-target)<380)value+=(b.tag===3&&g.shield<2?50:b.tag===6&&e.type===3?45:b.tag===2?7:12)+(b.y-250)/100;
 if(e.type===3&&g.takedowns<e.rivals){const r=g.rivals.filter(r=>!r.stun&&r.distance-g.distance>150&&r.distance-g.distance<850).sort((a,b)=>a.hp-b.hp)[0];if(r&&Math.abs(target-r.x)<250)value+=65;}
 return {target,value};}).sort((a,b)=>b.value-a.value);let target=choices[0].target;
 if(e.type===2&&g.style<e.style+400){state.target??=1800;if(g.drift_x>1650)state.target=200;if(g.drift_x<350)state.target=1800;if(!hazards.some(b=>b.y>550&&Math.abs(b.x-state.target)<500))target=state.target;bits|=8;}
 if(e.type===3&&g.takedowns<e.rivals&&g.rivals.some(r=>!r.finish&&r.distance<g.distance&&g.distance-r.distance<1200)&&!g.rivals.some(r=>r.distance>g.distance+220&&r.distance<g.distance+850))bits|=8;
 const d=target-g.drift_x-g.steer_v*2;if(d>65)bits|=2;else if(d< -65)bits|=1;if(!(bits&3)&&e.type===2)bits&=~8;
 if(g.counter&&!g.counter_cd&&g.rivals.some(r=>r.windup>0&&r.windup<12&&Math.abs(r.attack_x-g.drift_x)<500))bits|=64;
 if(g.pulse&&!g.weapon_cd&&!g.pulse_lock&&(g.gadget===0?g.lock_ticks>=18:g.gadget===1?g.rivals.some(r=>Math.abs(r.distance-g.distance)<330):g.rivals.some(r=>r.distance<g.distance&&g.distance-r.distance<700)))bits|=32;
 if((e.type!==2||g.style>=e.style)&&(e.type!==3||g.takedowns>=e.rivals||!g.rivals.some(r=>r.distance-g.distance>0&&r.distance-g.distance<900))&&(g.charge>=300||g.nitro)&&!g.ability_lock&&!g.ability_ticks&&!hazards.some(b=>b.y>600&&b.y<900&&Math.abs(b.x-g.drift_x)<450))bits|=16;
 return bits;
}
