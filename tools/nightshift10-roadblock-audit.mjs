import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createGame,applyAction,step,readableRoadblockSite} from '../games/arcade/web/nightshift10-rules.mjs';
import {driveInput} from '../tests/helpers/nightshift10-driver.mjs';
const out=process.env.DRIFT_OUT||'artifacts/roadblocks-v10/encounters',bin=process.env.ARCADE_BIN||'target/release/myelin-nightshift-v10';
mkdirSync(out,{recursive:true});const runs=[];let ticks=0,rows=0,nativeCases=0,crossings=0,minLead=Infinity;const patterns=new Set();
for(const mode of [1,5,9])for(let difficulty=0;difficulty<3;difficulty++)for(let seed=1;seed<=3;seed++){
 const g=createGame(),actions=[],inputs=[],controller={};
 for(let n=0;n<seed;n++){const action={type:'race',mode,vehicle:0,gadget:1,difficulty};applyAction(g,action);actions.push(action);}
 let count=0;
 while(!g.over){
  const old=g.rivals.map(r=>({id:r.id,x:r.x,distance:r.distance})),barriers=g.bodies.filter(b=>b.tag===8).map(b=>({id:b.id,x:b.x,distance:g.distance+830-b.y})),seq=g.roadblock_seq;
  const input=driveInput(g,controller);inputs.push(input);step(g,input);ticks++;
  if(g.roadblock_seq!==seq){
   const lead=g.roadblock_distance-Math.max(g.distance,...g.rivals.filter(r=>!r.finish).map(r=>r.distance));
   assert.ok(lead>=3000);assert.ok(readableRoadblockSite(g.roadblock_distance,mode));minLead=Math.min(minLead,lead);rows++;count++;
   patterns.add(g.bodies.filter(b=>b.tag===8&&Math.abs(g.distance+830-b.y-g.roadblock_distance)<1).length);
  }
  for(const b of barriers)for(const r of g.rivals){
   const p=old[r.id];if(p.distance>=b.distance||r.distance<b.distance||r.distance===p.distance)continue;
   const t=(b.distance-p.distance)/(r.distance-p.distance),x=p.x+(r.x-p.x)*t;
   if(Math.abs(x-b.x)<715)crossings++;
  }
 }
 assert.ok(count>0,'Every pursuit trial encounters a readable closure');
 if(seed===1){const n=spawnSync(bin,['simulate'],{input:JSON.stringify({kind:'drift-run',actions,inputs}),encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(n.status,0,n.stderr);assert.deepEqual(JSON.parse(n.stdout),g);nativeCases++;}
 runs.push({mode,difficulty,seed,rows:count,seconds:g.tick/30,won:g.won,reason:g.finish_reason,armor:g.shield});
}
assert.equal(crossings,0,'No rival centre may cross intact concrete');assert.deepEqual([...patterns].sort(),[1,2]);
const report={runs:runs.length,activeTicks:ticks,rows,minLeadMetres:minLead*.1,observedClosureSizes:[...patterns].sort(),uninterruptedRivalBarrierCrossings:crossings,nativeFullRaces:nativeCases,details:runs,limitations:['One deterministic ordinary-input controller, stock VANTA and three race IDs; not human win rates.','Crossing diagnostics test the actor centre at the barrier plane, not every possible mesh contact; separate swept-envelope fixtures cover collision width and recovery.']};
writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.log({...report,details:undefined});
