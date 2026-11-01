import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {recoveryTape} from './helpers/nightshift16-recovery-tape.mjs';
import {createGame,applyAction,step} from '../games/arcade/web/nightshift16-rules.mjs';
const out='artifacts/reverse-traffic-v16',tape=recoveryTape(),game=createGame(),samples=[];mkdirSync(out,{recursive:true});applyAction(game,tape.action);
const at=new Map(tape.frames.map(f=>[f.game.tick,f]));
function native(version,inputs){const result=spawnSync('target/release/myelin-nightshift-v'+version,['simulate'],{input:JSON.stringify({kind:'drift-run',actions:[tape.action],inputs}),encoding:'utf8',maxBuffer:8*1024*1024});assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);}
for(let n=0;n<tape.inputs.length;n++){step(game,tape.inputs[n]);const old=at.get(game.tick);if(old){assert.deepEqual(native(16,tape.inputs.slice(0,n+1)),game);samples.push({label:old.label,tick:game.tick,oldSpeed:old.game.speed,newSpeed:game.speed,oldDistance:old.game.distance,newDistance:game.distance,yielding:game.bodies.filter(b=>b.tag===1&&b.life>0).map(b=>({id:b.id,x:b.x,vy:b.vy,lane:b.yield_lane}))});}}
assert.deepEqual(native(15,tape.inputs),tape.frames.at(-1).game);const reverse=samples.find(s=>s.label==='reverse-239');assert.ok(reverse.oldSpeed>0&&reverse.newSpeed<0);assert.ok(reverse.newDistance<reverse.oldDistance-500,'Recovery continues instead of being driven forward');
const result={version:16,oldVersion:15,nativeExactAtEveryCheckpoint:true,originalInputTapeRetained:true,samples};writeFileSync(out+'/recovery-conformance.json',JSON.stringify(result,null,2)+'\n');console.log(result);
