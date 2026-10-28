// Read-only V7 gameplay audit. Synthetic probes describe edge cases; ordinary
// input races below are separately checked against the native executor.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createGame,applyAction,step,EVENTS} from '../games/arcade/web/nightshift7-rules.mjs';
import {driveInput} from '../tests/helpers/nightshift7-driver.mjs';
const out=process.env.AUDIT_OUT||'artifacts/combat-design-audit';
const bin=process.env.ARCADE_BIN||'target/release/myelin-nightshift-v7';
mkdirSync(out,{recursive:true});
const probes=[];
function fixture(){const g=createGame();g.tick=400;g.distance=10000;g.speed=1660;g.bodies=[];g.rivals.forEach(r=>{r.finish=1;});return g;}
function opponent(g,options={}){const r=g.rivals[0];Object.assign(r,{finish:0,distance:g.distance+200,x:g.drift_x,target:g.drift_x,speed:1660,cooldown:300,windup:0,defend:0,hp:2,stun:0},options);return r;}
function probe(id,run){probes.push({id,synthetic:true,...run()});}
probe('disabled-attacker-still-hits',()=>{const g=fixture(),r=opponent(g,{stun:210,windup:1,attack_x:g.drift_x});step(g,0);assert.equal(g.stun,45);assert.equal(g.shield,1);return {playerStun:g.stun,rivalStun:r.stun,shield:g.shield};});
probe('counter-shortens-disable',()=>{const g=fixture(),r=opponent(g,{stun:210,windup:1,attack_x:g.drift_x});step(g,64);assert.equal(r.stun,60);return {disableBefore:210,disableAfter:r.stun,dodges:g.dodges};});
probe('wave-hits-all-lanes',()=>{const g=fixture();g.gadget=1;for(const r of g.rivals)Object.assign(r,{finish:0,distance:g.distance+200+r.id*20,x:r.id%3*1000,target:r.id%3*1000,cooldown:300});step(g,32);assert.equal(g.attack_hits,5);return {hits:g.attack_hits,ammoSpent:1};});
probe('already-disabled-rival-counts-again',()=>{const g=fixture();g.gadget=1;const r=opponent(g,{stun:150,hp:1});g.takedowns=1;step(g,32);assert.equal(g.takedowns,2);assert.equal(r.hp,2);return {sameRivalId:r.id,takedowns:g.takedowns,resetHp:r.hp,disableTicks:r.stun};});
probe('mine-shortens-existing-disable',()=>{const g=fixture();const r=opponent(g,{stun:200,distance:g.distance-70});g.bodies=[{tag:11,x:g.drift_x,y:900,vx:0,vy:0}];step(g,0);assert.equal(r.stun,90);return {disableBefore:200,disableAfter:r.stun,hp:r.hp};});
probe('overlapping-collisions-kill-through-two-shields',()=>{const g=fixture();g.shield=2;g.bodies=Array.from({length:3},()=>({tag:1,x:g.drift_x,y:820,vx:0,vy:6}));step(g,0);assert.equal(g.over,true);assert.equal(g.shield,0);assert.equal(g.finish_reason,2);return {shieldsBefore:2,shieldsAfter:g.shield,over:g.over,elapsedTicks:1};});
probe('empty-wave-clears-pursuit',()=>{const g=fixture();g.gadget=1;g.pursuit=160;step(g,32);assert.equal(g.attack_hits,0);assert.equal(g.pursuit,80);return {hits:0,pursuitBefore:160,pursuitAfter:g.pursuit};});
probe('mine-defense-keeps-shield',()=>{const g=fixture();const r=opponent(g,{defend:30,distance:g.distance-70});g.bodies=[{tag:11,x:g.drift_x,y:900,vx:0,vy:0}];step(g,0);assert.equal(r.hp,2);assert.equal(r.defend,29);assert.ok(!g.bodies.some(b=>b.tag===11));return {hp:r.hp,defenseRemaining:r.defend,mineConsumed:true};});
probe('wave-defense-consumes-shield',()=>{const g=fixture();g.gadget=1;const r=opponent(g,{defend:30});step(g,32);assert.equal(r.hp,2);assert.equal(r.defend,0);return {hp:r.hp,defenseRemaining:r.defend};});
probe('mine-life-depends-on-owner-speed',()=>{const results=[];for(const brake of [false,true]){const g=fixture();g.gadget=2;g.speed=brake?750:1660;step(g,32|(brake?8:0));let ticks=1;while(g.bodies.some(b=>b.tag===11)){g.bodies=g.bodies.filter(b=>b.tag===11);step(g,brake?8:0);ticks++;}results.push({speed:brake?750:1660,seconds:ticks/30});}assert.ok(results[1].seconds>results[0].seconds*2);return {results};});
probe('ai-miss-earns-charge-without-counter',()=>{const g=fixture();opponent(g,{windup:1,attack_x:0});const before=g.charge;step(g,0);assert.equal(g.charge-before,140);return {chargeGain:140,counterSpent:0,dodges:g.dodges};});
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
  g.rivals.forEach((r,n)=>{if(g.takedowns>oldDisables&&oldRivals[n].hp===1&&r.hp===2&&r.stun>=180)disableCounts[n]++;if(r.windup>oldRivals[n].windup){windups++;attackedIds.add(n);}if(oldRivals[n].stun>0&&g.attack_hits>oldHits&&(r.hp<oldRivals[n].hp||r.stun>=180&&oldRivals[n].stun<180))disabledHits++;});
 }
 if(seed===1){const native=spawnSync(bin,['simulate'],{input:JSON.stringify({kind:'drift-run',actions,inputs}),encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(native.status,0,native.stderr);assert.deepEqual(JSON.parse(native.stdout),g,`${mode}/${policy}`);nativeTapes++;}
 runs.push({mode,map:EVENTS[mode].name,type:EVENTS[mode].type,policy,seed,won:!!g.won,finished:g.distance>=EVENTS[mode].distance,position:g.position,seconds:g.tick/30,reason:g.finish_reason,shots,hits:g.attack_hits,takedowns:g.takedowns,windups,attackers:attackedIds.size,disabledHits,disableCounts,combatRangeFraction:inRange/g.tick,reward:g.reward});
}
const groups=[];
for(const type of [0,1,2,3])for(const policy of ['no-fire','emp','wave','mine']){const rs=runs.filter(r=>r.type===type&&r.policy===policy),avg=k=>+(rs.reduce((s,r)=>s+r[k],0)/rs.length).toFixed(2);groups.push({type,policy,races:rs.length,wins:rs.filter(r=>r.won).length,finishes:rs.filter(r=>r.finished).length,meanPosition:avg('position'),meanSeconds:avg('seconds'),meanShots:avg('shots'),meanHits:avg('hits'),meanTakedowns:avg('takedowns'),meanWindups:avg('windups'),meanCombatRangeFraction:avg('combatRangeFraction')});}
const report={version:1,nativeTapes,activeTicks,probes,runs,groups,limitations:['Synthetic probes edit state; they establish local rule behavior, not occurrence frequency.','144 runs use one existing controller, Vanta, stock upgrades, easy difficulty and race IDs 1–3. These are not human win rates.','The controller seeks EMP alignment and brakes for Intercept objectives; it is not separately optimized for each weapon.','48 first-seed complete input tapes match the native full state.']};
writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({probes:probes.length,races:runs.length,nativeTapes,activeTicks,groups},null,2));
