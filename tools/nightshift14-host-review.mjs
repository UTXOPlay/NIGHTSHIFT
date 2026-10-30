import assert from 'node:assert/strict';
import {createServer} from 'node:net';
import {randomBytes} from 'node:crypto';
import {mkdirSync,mkdtempSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {createNightshift14} from '../host/nightshift14.mjs';
// The production image contains frozen release manifests and bundled browser
// files, not browser source imports. Check against those independent bindings.
const SAVED_PROFILES=Object.fromEntries(Array.from({length:7},(_,n)=>n+8).map(v=>[v,JSON.parse(readFileSync(v===14?'docs/release-integrity.json':`docs/release-integrity-v${v}.json`)).profile]));
const out='artifacts/rivals-v14/host';mkdirSync(out,{recursive:true});
const dir=path.resolve(mkdtempSync(out+'/data-')),token=randomBytes(32).toString('hex');
const prefixes={8:'LEGACY',9:'PREVIOUS',10:'ROADBLOCK',11:'GRIP',12:'PEDAL',13:'CAREER'};
const reservations=[];for(let n=0;n<7;n++){const s=createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));reservations.push(s);}
const ports=reservations.map(s=>s.address().port);await Promise.all(reservations.map(s=>new Promise(r=>s.close(r))));
const env={RUNTIME_TOKEN:token,DATA_DIR:path.join(dir,'v14'),RUNTIME_PORT:String(ports[6]),WEB_PORT:'0',GAME_ORIGIN:'http://127.0.0.1',NATIVE_WORKER_LIMIT:'2'};
for(let v=8;v<=13;v++){assert.ok(existsSync('target/release/myelin-nightshift-v'+v));env[prefixes[v]+'_DATA_DIR']=path.join(dir,'v'+v);env[prefixes[v]+'_RUNTIME_PORT']=String(ports[v-8]);}
let host,server,base,peakRss=0,maxResident=0;const samples=[],checks=[],states=new Map(),accounts=new Map();
function sample(label){
 const children=readFileSync(`/proc/self/task/${process.pid}/children`,'utf8').trim().split(/\s+/).filter(Boolean);let rss=0;
 for(const pid of [process.pid,...children])try{rss+=Number(readFileSync('/proc/'+pid+'/status','utf8').match(/^VmRSS:\s+(\d+)/m)?.[1]||0)*1024;}catch{}
 peakRss=Math.max(peakRss,rss);const pool=host.pool.snapshot(),resident=pool.runtimes.filter(r=>r.running).length;maxResident=Math.max(maxResident,resident);assert.ok(resident<=2);samples.push({label,rss,resident});
}
async function open(){host=createNightshift14({env});server=host.service.app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base='http://127.0.0.1:'+server.address().port+'/games/nightshift/api/';}
async function close(){if(server){await new Promise(r=>server.close(r));server=null;}await host?.close();}
const headers=account=>({'X-Runtime-Token':token,'X-UTXOPlay-Account':account,'Content-Type':'application/json'});
async function raw(v,account,endpoint,body){const response=await host.pool.fetch('http://127.0.0.1:'+ports[v-8]+'/drift-run/api/'+endpoint,{method:body===undefined?'GET':'POST',headers:headers(account),body:body===undefined?undefined:JSON.stringify(body)});assert.equal(response.status,200,await response.clone().text());return response.json();}
async function api(account,endpoint,body,status=200){const response=await fetch(base+endpoint,{method:body===undefined?'GET':'POST',headers:headers(account),body:body===undefined?undefined:JSON.stringify(body)});const result=await response.json();assert.equal(response.status,status,JSON.stringify(result));return result;}
const command=(s,action)=>({session_id:s.session.id,expected_block:s.session.block_hash,action});
const inputs=v=>v>=12?[1912615424,1912615424,1912615424]:v===11?[4207104,4207104,4207104]:[0,0,0];
try{
 await open();const fresh=randomBytes(32).toString('hex'),current=await api(fresh,'state');assert.equal(current.game.physics_version,14);assert.equal(current.session.profile,SAVED_PROFILES[14]);assert.deepEqual(host.pool.snapshot().runtimes.filter(r=>r.starts).map(r=>r.version),[14]);checks.push({freshAccountOnlyStartsCurrent:true});
 // Match the previous six-generation cache experiment with eight accounts per
 // generation, while retaining no more than two native processes.
 for(let v=8;v<=14;v++)for(let n=0;n<8;n++){
  const account=randomBytes(32).toString('hex');let s=await raw(v,account,'state');assert.equal(s.session.profile,SAVED_PROFILES[v]);s=await raw(v,account,'action',command(s,{type:'upgrade',vehicle:0,choice:1}));
  if(v===13)s=await raw(v,account,'action',command(s,{type:'tune',vehicle:0,levels:[0,0,0]}));
  s=await raw(v,account,'action',command(s,{type:'ticks',inputs:inputs(v)}));
  if(n===0){accounts.set(v,account);states.set(v,s);}sample('v'+v+' / '+(n+1));
 }
 for(let v=8;v<=13;v++){
  const account=accounts.get(v),original=states.get(v),read=await api(account,'state');assert.deepEqual(read.game,original.game);assert.equal(read.session.profile,SAVED_PROFILES[v]);
  const currentReceipt=path.join(env.DATA_DIR,account+'-drift-run','active');assert.equal(existsSync(currentReceipt),false,'legacy read created an empty current database');
  const continued=await api(account,'action',{client_profile:SAVED_PROFILES[14],...command(read,{type:'ticks',inputs:inputs(v)})});assert.equal(continued.game.physics_version||8,v);
  const proof=await raw(v,account,'export'),career=structuredClone(continued.game.career);
  let migrated=await api(account,'action',{client_profile:SAVED_PROFILES[14],...command(continued,{type:'race',mode:0,vehicle:0,gadget:0,difficulty:0})});assert.equal(migrated.game.physics_version,14);
  for(const key of ['credits','earned','spent','rep','owned','upgrades','medals','races','wins'])assert.deepEqual(migrated.game.career[key],career[key]);
  if(v===13){assert.deepEqual(migrated.game.career.tunes,career.tunes);assert.equal(migrated.game.career.unlocked,career.unlocked);}else{assert.deepEqual(migrated.game.career.tunes,career.upgrades);assert.equal(migrated.game.career.unlocked,7);}
  migrated=await api(account,'action',{client_profile:SAVED_PROFILES[14],...command(migrated,{type:'ticks',inputs:inputs(14)})});assert.ok(migrated.game.speed>0);
  const verified=await api(account,'replay',{});assert.equal(verified.verified,true);const exported=await api(account,'export');assert.deepEqual(exported.origin,proof);assert.deepEqual(await raw(v,account,'export'),proof);
  await api(account,'action',{client_profile:SAVED_PROFILES[v],...command(migrated,{type:'ticks',inputs:inputs(v)})},426);
  const after=await api(account,'state');assert.deepEqual(after.game,migrated.game);states.set(v,migrated);sample('migrated v'+v);
  checks.push({version:v,originalUnfinishedRaceRetained:true,noEmptyIntermediateSession:true,explicitNewRaceMigrates:true,originalProofUnchanged:true,careerPreserved:true,legacyProfileRejected:true,signedReplay:true});
 }
 const beforeRestart=host.pool.snapshot();await close();await open();
 for(let v=8;v<=13;v++){const state=await api(accounts.get(v),'state');assert.deepEqual(state.game,states.get(v).game);assert.equal(state.session.profile,SAVED_PROFILES[14]);sample('restart / '+v);}
 assert.ok(peakRss<2147483648,'Local process RSS exceeds the existing deployment ceiling');
 let cgroup=null;
 if(process.env.DRIFT_CGROUP_CAPACITY==='1'){
  const read=name=>readFileSync('/sys/fs/cgroup/'+name,'utf8').trim();
  const events=Object.fromEntries(read('memory.events').split('\n').map(row=>row.split(/\s+/)).map(([k,v])=>[k,Number(v)]));
  cgroup={limit:Number(read('memory.max')),swapLimit:Number(read('memory.swap.max')),peak:Number(read('memory.peak')),events};
  assert.equal(cgroup.limit,2147483648);assert.equal(cgroup.swapLimit,0);assert.equal(events.oom_kill,0);assert.ok(cgroup.peak<cgroup.limit);checks.push({isolatedTwoGiBCgroup:true,swapDisabled:true,noOomKills:true});
 }
 const report={version:14,profile:SAVED_PROFILES[14],checks,accountsOpened:57,maxResidentExecutors:maxResident,peakCombinedProcessRss:peakRss,cgroup,samples,beforeRestart,afterRestart:host.pool.snapshot(),restartRecovery:true,limitations:['Process RSS includes the review parent and its native children, not file cache.',...(cgroup?['The isolated container measures seven generations, 57 sequential accounts and migration/restart churn; it is not a real concurrent-user capacity guarantee.']:['A staged container capacity check remains required before deployment.'])]};writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.log({checks:checks.length,accountsOpened:57,maxResident,peakRss,cgroup,restartRecovery:true});
}finally{await close();}
