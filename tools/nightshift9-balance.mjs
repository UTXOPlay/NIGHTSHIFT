// Reproducible automated balance sample; not a human win-rate measurement.
import assert from 'node:assert/strict';import{spawnSync}from'node:child_process';import{mkdirSync,writeFileSync}from'node:fs';
import{createGame,applyAction,step,EVENTS}from'../games/arcade/web/nightshift9-rules.mjs';import{driveInput}from'../tests/helpers/nightshift9-driver.mjs';
const bin=process.env.ARCADE_BIN||'target/release/myelin-nightshift-v9',out='artifacts/nightshift-v9/balance';mkdirSync(out,{recursive:true});
const runs=[];let nativeTapes=0,activeTicks=0;
for(let mode=0;mode<12;mode++)for(const policy of ['no-fire','emp','wave','mine'])for(let seed=1;seed<=3;seed++){
 const g=createGame(),actions=[],inputs=[],state={},gadget=Math.max(0,['emp','wave','mine'].indexOf(policy));
 for(let n=0;n<seed;n++){const a={type:'race',mode,vehicle:0,gadget,difficulty:0};applyAction(g,a);actions.push(a);}
 let shots=0,inRange=0,windups=0,disabledHits=0;const attackedIds=new Set(),disableCounts=Array(5).fill(0);
 while(!g.over){let bits=driveInput(g,state);if(policy==='no-fire')bits&=~32;
  const oldPulse=g.pulse_ticks,oldHits=g.attack_hits,oldDisables=g.takedowns,oldRivals=g.rivals.map(r=>({hp:r.hp,stun:r.stun,windup:r.windup}));
  if(g.rivals.some(r=>!r.finish&&Math.abs(r.distance-g.distance)<900))inRange++;
  step(g,bits);inputs.push(bits);activeTicks++;
  if(g.pulse_ticks>oldPulse)shots++;
  g.rivals.forEach((r,n)=>{if(g.events.some(e=>e.kind==='disable'&&e.actor===-1&&e.target===n))disableCounts[n]++;if(r.windup>oldRivals[n].windup){windups++;attackedIds.add(n);}if(oldRivals[n].stun>0&&g.attack_hits>oldHits&&(r.hp<oldRivals[n].hp||r.stun>=180&&oldRivals[n].stun<180))disabledHits++;});
 }
 if(seed===1){const native=spawnSync(bin,['simulate'],{input:JSON.stringify({kind:'drift-run',actions,inputs}),encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(native.status,0,native.stderr);assert.deepEqual(JSON.parse(native.stdout),g,`${mode}/${policy}`);nativeTapes++;}
 runs.push({mode,map:EVENTS[mode].name,type:EVENTS[mode].type,policy,seed,won:!!g.won,finished:g.distance>=EVENTS[mode].distance,position:g.position,seconds:g.tick/30,reason:g.finish_reason,shots,hits:g.attack_hits,takedowns:g.takedowns,windups,attackers:attackedIds.size,disabledHits,disableCounts,combatRangeFraction:inRange/g.tick,reward:g.reward});
}
const groups=[];
for(const type of [0,1,2,3])for(const policy of ['no-fire','emp','wave','mine']){const rs=runs.filter(r=>r.type===type&&r.policy===policy),avg=k=>+(rs.reduce((s,r)=>s+r[k],0)/rs.length).toFixed(2);groups.push({type,policy,races:rs.length,wins:rs.filter(r=>r.won).length,finishes:rs.filter(r=>r.finished).length,meanPosition:avg('position'),meanSeconds:avg('seconds'),meanShots:avg('shots'),meanHits:avg('hits'),meanTakedowns:avg('takedowns'),meanWindups:avg('windups'),meanCombatRangeFraction:avg('combatRangeFraction')});}
const report={nativeTapes,activeTicks,runs,groups,limitations:['Stock Vanta, Street difficulty, race IDs 1–3 and one heuristic controller; not human win rates.','Interception requires each marked target after its route gate. Mine is a defensive loadout; EMP is recommended for forward interception.','Completed races and failed attempts are reported separately; failed durations are not track records.']};writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({nativeTapes,activeTicks,groups},null,2));
