const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Observe completed native ticks. These cues grant no charge, score or power.
export function driveFeedback(before,after){
 if(after.tick<=before.tick||after.race_id!==before.race_id)return[];
 const cues=[];
 if(after.specials>before.specials&&after.ability_ticks>before.ability_ticks)cues.push({type:'boost',strength:1});
 if(before.ability_ticks>0&&!after.ability_ticks)cues.push({type:'boostEnd',strength:.6});
 if(after.near_misses>before.near_misses){
  const traffic=before.bodies.filter(b=>b.tag===1).sort((a,b)=>Math.abs(a.y-830)-Math.abs(b.y-830))[0];
  cues.push({type:'pass',strength:clamp(Math.abs(after.speed)/2200,.3,1),pan:traffic?clamp((traffic.x-before.drift_x)/900,-.8,.8):0});
 }
 const previous=Math.floor(before.charge/300),ready=Math.floor(after.charge/300);
 if(ready>previous)cues.push({type:'ready',tier:Math.min(3,ready),strength:.45});
 if(before.drifting&&!after.drifting&&!after.stun&&!after.over)cues.push({type:'grip',strength:clamp(Math.abs(before.steer_v)/86,.2,1)});
 return cues;
}

export function driveMix(g,previous){
 const ticks=previous?g.tick-previous.tick:0;
 const acceleration=ticks>0&&ticks<15?clamp(((g.speed||0)-previous.speed)*30/ticks/900,-1,1):0;
 return{
  speed:clamp(Math.abs(g.speed||0)/2500,0,1),
  load:g.physics_version>=12?clamp((g.throttle||0)/100*.8+Math.max(0,acceleration)*.2,.06,1):clamp(.4+acceleration*.55,.1,1),
  slip:g.drifting?clamp(g.physics_version>=11?Math.abs(g.slip_angle||0)/280:Math.abs(g.steer_v||0)/85+Math.abs(g.side_v||0)/3000,.15,1):0,
  boost:g.ability_ticks>0&&!g.stun?1:0,
  draft:clamp((g.draft_ticks||0)/90,0,1),
 };
}
