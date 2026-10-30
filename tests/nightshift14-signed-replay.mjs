import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:net';
import * as rules14 from '../games/arcade/web/nightshift14-rules.mjs';
import * as rules13 from '../games/arcade/web/nightshift13-rules.mjs';
import {driveInput as driver14} from './helpers/nightshift14-driver.mjs';
import {driveInput as driver13} from './helpers/nightshift13-driver.mjs';

const out='artifacts/rivals-v14';mkdirSync(out,{recursive:true});
const bin='target/release/myelin-nightshift-v14',legacy='target/release/myelin-nightshift-v13';
const data14=mkdtempSync(out+'/signed-v14-'),data13=mkdtempSync(out+'/signed-v13-'),migrated=mkdtempSync(out+'/migrated-v14-');
const token=randomBytes(32).toString('hex'),account=randomBytes(32).toString('hex');
const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
let child,rules,g,state,stderr='';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function stop(){if(child){const c=child;child=null;if(c.exitCode===null){c.kill('SIGTERM');await new Promise(r=>c.once('exit',r));}}}
async function request(path,body){
 for(let n=0;n<80;n++)try{
  const response=await fetch(`http://127.0.0.1:${port}/drift-run/api/${path}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json','X-Runtime-Token':token,'X-UTXOPlay-Account':account},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  return {status:response.status,...await response.json()};
 }catch(error){if(n===79||child?.exitCode!==null)throw Error(String(error)+' '+stderr);await delay(50);}
}
async function launch(executable,storage,simulation){
 await stop();stderr='';child=spawn(executable,[],{env:{...process.env,PORT:String(port),BIND:'127.0.0.1',DATA_DIR:storage,RUNTIME_TOKEN:token},stdio:['ignore','ignore','pipe']});child.stderr.on('data',b=>stderr+=b);
 rules=simulation;state=await request('state');assert.equal(state.status,200,JSON.stringify(state));g=structuredClone(state.game);
}
async function act(action){const before=state;rules.applyAction(g,action);state=await request('action',{session_id:before.session.id,expected_block:before.session.block_hash,action});assert.equal(state.status,200,JSON.stringify(state));assert.deepEqual(state.game,g);return before;}
async function runRace(driver,spec=0){
 await act({type:'race',mode:0,vehicle:0,gadget:spec?0:1,difficulty:0,spec});const memory={};
 while(!g.over){const predicted=structuredClone(g),inputs=[];for(let n=0;n<120&&!predicted.over;n++){const i=driver(predicted,memory);inputs.push(i);rules.step(predicted,i);}await act({type:'ticks',inputs});}
}
async function exportProof(name){const proof=await request('export');delete proof.status;writeFileSync(out+'/'+name,JSON.stringify(proof));return proof;}
function verify(executable,name,accepted=true){const result=spawnSync(executable,['verify',out+'/'+name],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(result.error,undefined);if(accepted)assert.equal(result.status,0,result.stderr);else assert.notEqual(result.status,0);}
try{
 await launch(bin,data14,rules14);assert.deepEqual(g,rules14.createGame());
 const profile=JSON.parse(readFileSync('games/nightshift-v14/host.json')).clientProfile;assert.equal(state.session.profile,profile);
 const before=await act({type:'upgrade',vehicle:0,choice:1});
 const stale=await request('action',{session_id:before.session.id,expected_block:before.session.block_hash,action:{type:'upgrade',vehicle:0,choice:1}});assert.equal(stale.status,400);
 const forged=await request('action',{session_id:state.session.id,expected_block:state.session.block_hash,action:{type:'buy',choice:3,credits:99999}});assert.equal(forged.status,400);
 let attempts=0;do{await runRace(driver14);attempts++;}while(!g.won&&attempts<4);assert.equal(g.won,1);assert.ok(g.tick>=5400&&g.tick<=12600);
 const finished=structuredClone(g),replay=await request('replay',{});assert.equal(replay.verified,true);
 await exportProof('signed-v14-export.json');verify(bin,'signed-v14-export.json');verify(legacy,'signed-v14-export.json',false);
 await launch(bin,data14,rules14);assert.deepEqual(g,finished);const restart=await request('new',{});assert.equal(restart.status,200);assert.deepEqual(restart.game.career,finished.career);

 // A genuine frozen V13 stock record, earned through ordinary signed inputs.
 await launch(legacy,data13,rules13);assert.deepEqual(g,rules13.createGame());await act({type:'upgrade',vehicle:0,choice:1});await act({type:'tune',vehicle:0,levels:[0,0,0]});
 let oldAttempts=0;do{await runRace(driver13,1);oldAttempts++;}while(!g.won&&oldAttempts<4);assert.equal(g.won,1);assert.ok(g.career.spec_best>0);
 const historical=structuredClone(g),origin=await exportProof('signed-v13-origin.json');verify(legacy,'signed-v13-origin.json');verify(bin,'signed-v13-origin.json',false);
 await launch(bin,migrated,rules14);state=await request('migrate-legacy',origin);assert.equal(state.status,200,JSON.stringify(state));
 const expected=structuredClone(historical.career);expected.legacy_spec_best=expected.spec_best;expected.legacy_spec_version=13;expected.spec_best=0;
 assert.deepEqual(state.game.career,expected);assert.equal(state.game.career.unlocked,1);assert.deepEqual(state.game.career.tunes[0],[0,0,0]);g=structuredClone(state.game);
 await act({type:'race',mode:3,vehicle:0,gadget:0,difficulty:0});await act({type:'ticks',inputs:Array(120).fill(1073754624)});
 const migratedState=structuredClone(state.game),proof=await exportProof('signed-v14-migrated.json');assert.deepEqual(proof.origin,origin);verify(bin,'signed-v14-migrated.json');
 const tampered=structuredClone(proof);tampered.origin.authority='00'.repeat(33);writeFileSync(out+'/tampered-origin.json',JSON.stringify(tampered));verify(bin,'tampered-origin.json',false);
 await launch(bin,migrated,rules14);assert.deepEqual(g,migratedState);
 const report={version:14,profile,soloRace:{won:finished.won,seconds:finished.tick/30,attempts,reward:finished.reward},v13SpecPb:historical.career.spec_best,v13Attempts:oldAttempts,browserNativeInputsExact:true,signedReplay:true,staleRejected:true,forgedCurrencyRejected:true,restartRecovery:true,legacyProfileSeparation:true,v13SignedOrigin:true,inactivePurchasedPartsRetained:true,chapterLicenseRetained:true,historicalPbProvenanceRetained:true,nestedOriginTamperingRejected:true,migratedRestartRecovery:true,limitation:'Native HTTP and deterministic browser-rule validation; this is not rendered-browser, physical-device or multiplayer acceptance.'};
 writeFileSync(out+'/signed-replay.json',JSON.stringify(report,null,2));console.log(report);
}finally{await stop();}
