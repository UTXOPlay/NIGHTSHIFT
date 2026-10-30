import {drive,steer,SPEED,TURN} from './nightshift14-drive.mjs';
const trunc=n=>Math.trunc(n)||0,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Stable intent IDs are part of the native state, rather than renderer guesses.
export const INTENTS=['RACING','FOLLOWING','OVERTAKING','DEFENDING','AVOIDING','RECOVERING','STAGING'];
export function createRival(id){return{
 id,vehicle:id+1,upgrades:[0,0,0],side_v:0,contact_cd:0,x:(id%3)*1000,distance:60+id*45,speed:0,
 hp:2,stun:0,cooldown:450+id*150,windup:0,attack_x:0,defend:0,target:(id%3)*1000,finish:0,
 boost:0,brain:0,recover:0,ammo:3,guard:1,guard_cd:0,attack_target:-2,
 steer_v:0,heading:0,lateral_v:0,slip_angle:0,drifting:0,drift_side:0,yaw:0,
 throttle:0,brake:0,drive_remainder:0,charge:300,boost_wait:0,plan_wait:0,intent_ticks:0,pass_side:0,pass_target:-2,defense_cd:0,desired_speed:0,staged:0,release_at:0
};}
export function configureRivals(g){const chapter=trunc(g.mode/4);for(const r of g.rivals)r.upgrades=[chapter,chapter?1:0,chapter];}
export function stageInterceptionRivals(g,finish,count){
 for(let rank=0;rank<count;rank++){
  const r=g.rivals[(rank+g.mode+g.race_id)%5],gate=trunc(finish*(count===1?88:8+trunc(80*rank/(count-1)))/100);
  Object.assign(r,{distance:gate-500,x:rank%2?2000:0,target:rank%2?2000:0,release_at:gate-3000,staged:1,brain:6});
 }
}
// Stream traffic around occupied race sections, in shared absolute coordinates.
// A separated leader must encounter the same road hazards as a trailing human.
export function trafficSpawnPoint(g,period){
 if(g.bodies.filter(b=>b.tag===1).length>=32)return null;
 const cars=[{distance:g.distance,speed:g.speed},...g.rivals.filter(r=>!r.finish&&!r.staged)].sort((a,b)=>a.distance-b.distance),groups=[];
 for(const car of cars){const group=groups.at(-1);if(group&&car.distance-group.base<2400){group.distance=car.distance;group.speed=car.speed;}else groups.push({distance:car.distance,speed:car.speed,base:car.distance});}
 const anchor=groups[trunc(g.tick/period)%groups.length];if(anchor.speed<=300)return null;
 const distance=anchor.distance+Math.max(2400,anchor.speed*2);
 return g.roadblock_distance&&Math.abs(distance-g.roadblock_distance)<2500?null:distance;
}
function integerRoot(n){let lo=0,hi=10000;while(lo<hi){const mid=trunc((lo+hi+1)/2);if(mid*mid<=n)lo=mid;else hi=mid-1;}return lo;}
export function roadActors(g,r){
 const a=[{id:-1,x:g.drift_x,distance:g.distance,speed:g.speed,vx:g.lateral_v+trunc(g.side_v/4),wall:false}];
 for(const other of g.rivals)if(other.id!==r.id&&!other.finish)a.push({id:other.id,x:other.x,distance:other.distance,speed:other.speed,vx:other.lateral_v+trunc(other.side_v/4),wall:false});
 for(const b of g.bodies)if(b.tag===1||b.tag===8)a.push({id:100+b.id,x:b.x,distance:g.distance+830-b.y,speed:b.tag===8?0:b.vy*100,vx:b.vx,wall:b.tag===8});
 return a;
}
export function planRival(g,r,curve){
 const up=r.upgrades,look=clamp(trunc(r.speed*9/10),700,1800),bend=curve(r.distance,g.mode),near=curve(r.distance+trunc(look/3),g.mode),far=curve(r.distance+look,g.mode);
 const ideal=clamp(1000+clamp(near*85+(far-near)*45,-700,700)+[-120,80,40,-40,100][r.id],0,2000);
 const actors=roadActors(g,r),front=actors.filter(a=>a.distance>r.distance&&a.distance-r.distance<800&&Math.abs(a.x-r.x)<650).sort((a,b)=>a.distance-b.distance||a.id-b.id)[0];
 const rear=actors.filter(a=>r.distance-a.distance>250&&r.distance-a.distance<700&&a.speed>r.speed+40).sort((a,b)=>b.distance-a.distance||a.id-b.id)[0];
 const overlap=actors.some(a=>Math.abs(a.distance-r.distance)<250),passing=r.intent_ticks&&r.pass_side?actors.find(a=>a.id===r.pass_target&&r.distance-a.distance<180):null;
 let defense=r.brain===3&&r.intent_ticks&&!overlap?r.target:-1;
 // One early defensive move, followed by a cooldown. Never reactively close an overlap.
 if(r.id===1&&g.difficulty>0&&!r.defense_cd&&rear&&!overlap)defense=clamp(rear.x,250,1750);
 let best=1e12,line=ideal;
 const candidates=[ideal,...Array.from({length:11},(_,n)=>n*200)];
 for(const x of candidates){
  let cost=Math.abs(x-ideal)*3+Math.abs(x-r.x)*2+Math.abs(x-r.target);
  if(passing&&Math.sign(x-passing.x)!==r.pass_side)cost+=14000;
  if(defense>=0)cost+=Math.abs(x-defense)*8;
  for(const a of actors){
   const gap=a.distance-r.distance;if(gap< -350||gap>look)continue;
   const ticks=clamp(trunc(Math.max(0,gap)*100/Math.max(200,r.speed-a.speed)),4,60);
   const reachable=r.x+clamp(x-r.x,-ticks*Math.max(8,trunc(r.speed/70)),ticks*Math.max(8,trunc(r.speed/70)));
   const ax=clamp(a.x+a.vx*Math.min(ticks,18),-400,2400),margin=a.wall?785:650;
   const penetration=Math.max(0,margin-Math.abs(reachable-ax));
   if(gap>=0)cost+=penetration*(a.wall?450:100)*Math.max(1,trunc((look-gap)/100));
   else if(a.speed>r.speed||gap> -120)cost+=Math.max(0,margin-Math.abs(x-ax))*100;
  }
  if(cost<best){best=cost;line=x;}
 }
 const peak=Math.max(Math.abs(bend),Math.abs(near),Math.abs(far));
 let speed=Math.max(900,trunc((SPEED[r.vehicle]+up[0]*70)*[94,98,100][g.difficulty]/100)+[-10,-30,0,10,-15][r.id]-peak*(18+(2-g.difficulty)*2));
 // Relay couriers carry a fixed load. This event role has a public speed limit,
 // independent of the human's car, progress, braking or distance to the courier.
 if(r.release_at>0)speed=Math.min(speed,[1500,1640,1780][g.difficulty]+trunc(g.mode/4)*20);
 let danger=false;
 for(const a of actors){
  const gap=a.distance-r.distance;if(gap<=0||gap>look)continue;
  const ticks=clamp(trunc(gap*100/Math.max(200,r.speed-a.speed)),4,60),move=ticks*Math.max(8,trunc(r.speed/70));
  const x=r.x+clamp(line-r.x,-move,move),ax=clamp(a.x+a.vx*Math.min(ticks,18),-400,2400);
  if(Math.abs(x-ax)<(a.wall?785:650)){
   const cap=a.speed+Math.max(0,integerRoot(Math.max(0,gap-120)*160*[13,14,12,15,16,13][r.vehicle])-[13,14,12,15,16,13][r.vehicle]*(8+(2-g.difficulty)*3+r.id%3));speed=Math.min(speed,a.speed===0&&cap<100?0:cap);danger=true;
  }
 }
 let intent=danger?4:0,side=0;
 if(!danger&&front&&!front.wall){intent=Math.abs(line-front.x)>550?2:1;side=intent===2?Math.sign(line-front.x):0;}
 else if(!danger&&passing){intent=2;side=r.pass_side;}
 if(defense>=0&&Math.abs(line-defense)<300&&!danger)intent=3;
 return{line,speed,look,intent,side,passTarget:passing?.id??front?.id??-2};
}
export function updateRivals(g,curve,finish,onLaunch=()=>{}){
 for(const r of g.rivals){
  if(r.finish)continue;
  if(r.staged){
   if(g.distance<r.release_at){r.throttle=0;r.brake=100;r.side_v=trunc(r.side_v*88/100);r.x=clamp(r.x+trunc(r.side_v/4),-650,2650);drive(r,{throttle:0,brake:100},0,r.upgrades);r.distance=Math.max(0,r.distance+trunc(r.speed/100));continue;}
   r.staged=0;r.plan_wait=0;r.brain=0;onLaunch(r.id);
  }
  r.plan_wait=Math.max(0,r.plan_wait-1);r.intent_ticks=Math.max(0,r.intent_ticks-1);r.defense_cd=Math.max(0,r.defense_cd-1);r.boost_wait=Math.max(0,r.boost_wait-1);
  r.side_v=trunc(r.side_v*88/100);r.contact_cd=Math.max(0,r.contact_cd-1);
  if(r.brain===3&&roadActors(g,r).some(a=>Math.abs(a.distance-r.distance)<250)){r.plan_wait=0;r.intent_ticks=0;}
  if(!r.plan_wait&&!r.stun&&r.hp){const p=planRival(g,r,curve);r.target=p.line;r.desired_speed=p.speed;
   if(p.intent===3&&r.brain!==3){r.defense_cd=240;r.intent_ticks=45;r.pass_side=0;}else if(p.intent===2&&!r.intent_ticks){r.intent_ticks=60;r.pass_side=p.side;r.pass_target=p.passTarget;}
   r.brain=p.intent;r.plan_wait=8+(2-g.difficulty)*3+r.id%3;
  }
  if(g.tick%30===0)r.charge=Math.min(900,r.charge+12);
  if(roadActors(g,r).some(a=>!a.wall&&a.distance-r.distance>60&&a.distance-r.distance<700&&Math.abs(a.x-r.x)<360))r.charge=Math.min(900,r.charge+3);
  const bend=curve(r.distance,g.mode);
  if(!r.stun&&!r.recover&&r.hp&&!r.boost&&!r.boost_wait&&r.charge>=300&&r.speed>1100&&r.brain===2&&Math.abs(bend)<=4&&r.desired_speed>=r.speed-100){r.charge-=300;r.boost=42+r.upgrades[2]*6+(r.vehicle===3?10:0);r.boost_wait=150;}
  const target=r.desired_speed+(r.boost?250:0),error=target-r.speed;
  const brake=target===0?100:error< -25?clamp(trunc((-error-20)*2),0,100):0;
  const throttle=brake||r.stun||!r.hp?0:clamp((error+10)*4,0,100);
  const feed=trunc(bend*Math.max(0,r.speed-1050)*200000/((260+r.upgrades[1]*45)*Math.max(1,r.speed)*(TURN[r.vehicle]+r.upgrades[1]*3)));
  const steering=clamp(trunc((r.target-r.x-r.lateral_v*4-trunc(r.side_v/4)*3)*32/100)+feed,-100,100);
  const control={steering:r.stun?0:steering,throttle,brake};
  r.x=clamp(r.x+steer(r,control,0,r.upgrades,bend),-650,2650);
  drive(r,control,0,r.upgrades);r.distance=Math.max(0,r.distance+trunc(r.speed/100));
  if(r.stun||!r.hp||r.recover)r.brain=5;
  if(r.distance>=finish){r.distance=finish;r.finish=g.tick;}
 }
}
