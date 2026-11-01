import {guideTraffic as guideStaticTraffic} from './nightshift10-roadblocks.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// Body.life is a bounded recovery-yield timer for traffic in V16. Mines retain
// their separate lifetime. Historical V8–V15 bodies keep their original rules.
export function guideTraffic(g,car){
 const previousSpeed=car.vy,previousTurn=car.vx;guideStaticTraffic(g,car);
 const gap=car.y-830,aligned=Math.abs(car.x-g.drift_x)<740;
 const close=gap>=-50&&gap<1000&&aligned;
 if(g.speed<0&&close)car.life=150;
 if(!car.life)return;
 car.life--;
 if(close){
  // Release forward motor pressure before the reversing player reaches us.
  // Preserve an actual collision's backward impulse rather than reapplying gas.
  const limit=gap<160?0:previousSpeed-(g.tick%8===0&&previousSpeed>0?1:0);
  car.vy=Math.min(car.vy,previousSpeed,limit);
 }
 const station=g.distance+830-car.y;
  const lanes=[0,1000,2000].filter(x=>g.bodies.every(b=>{
    if(b.id===car.id)return true;
    if(b.tag===8)return Math.abs(b.x-x)>=785||car.y-b.y< -60||car.y-b.y>300;
    return b.tag!==1||Math.abs(b.y-car.y)>=400||Math.abs(b.x-x)>=650;
   })
   &&g.rivals.every(r=>r.finish||Math.abs(r.distance-station)>=500||Math.abs(r.x-x)>=650));
  lanes.sort((a,b)=>Math.abs(a-car.x)-Math.abs(b-car.x)||a-b);
  const committed=car.yield_lane>=0?car.yield_lane*1000:null;
  const target=lanes.includes(committed)&&Math.abs(committed-g.drift_x)>=520?committed:lanes.find(x=>Math.abs(x-g.drift_x)>=800);
  car.yield_lane=target===undefined?-1:target/1000;
  const desired=target===undefined?0:clamp(Math.trunc((target-car.x)/12),-16,16);
  car.vx=previousTurn+clamp(desired-previousTurn,-2,2);
 if(!close){
  // Once the player clears our lane, return to cruise without a velocity jump.
  const cruise=previousSpeed+(g.tick%10===0&&previousSpeed>=0&&previousSpeed<6?1:0),turn=car.vx;
  car.vy=cruise;guideStaticTraffic(g,car);car.vy=Math.min(car.vy,cruise);car.vx=turn;
 }
 if(car.vy<0&&g.tick%8===0)car.vy++;
 if(!car.life){car.yield_lane=-1;car.vx=0;}
}
