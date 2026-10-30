import test from 'node:test';
import assert from 'node:assert/strict';
import {createRuntimePool} from './runtime-pool.mjs';
const deferred=()=>{let resolve;return {promise:new Promise(r=>resolve=r),resolve:v=>resolve(v)};};
const tick=()=>new Promise(r=>setImmediate(r));
function fixture(t,options={}){
 const active=new Set(),log=[];let maximum=0;
 const runtimes=[8,9,10,11,12,13,14].map(version=>({version,url:'http://v'+version,command:['unused'],dataDir:'/unused'}));
 const pool=createRuntimePool({runtimes,token:'test',maxWorkers:2,idleMs:60000,startRuntime:async r=>{active.add(r.version);maximum=Math.max(maximum,active.size);log.push(['start',r.version]);return {alive:()=>active.has(r.version),stop:async()=>{active.delete(r.version);log.push(['stop',r.version]);}};},fetchImpl:async(url)=>{const version=Number(new URL(url).hostname.slice(1));assert.ok(active.has(version),'request used an evicted executor');return Response.json({version});},...options});
 t.after(()=>pool.close());return {pool,active,log,get maximum(){return maximum;}};
}
test('seven rule generations retain their identities with at most two native process caches',async t=>{
 const f=fixture(t);assert.equal(f.active.size,0);
 for(const version of [8,9,10,11,12,13,14,8])assert.equal((await(await f.pool.fetch('http://v'+version+'/drift-run/api/state')).json()).version,version);
 assert.equal(f.maximum,2);assert.equal(f.active.size,2);assert.equal(f.log.filter(([e,v])=>e==='start'&&v===8).length,2);
});
test('a native response is drained before its process can be evicted',async t=>{
 const body=deferred(),started=deferred(),calls=[];
 const f=fixture(t,{maxWorkers:1,fetchImpl:async url=>{calls.push(url);if(url.startsWith('http://v8/'))return new Response(new ReadableStream({start(c){started.resolve();void body.promise.then(()=>{c.enqueue(new TextEncoder().encode('{"ok":true}'));c.close();});}}));return Response.json({ok:true});}});
 const first=f.pool.fetch('http://v8/drift-run/api/export');await started.promise;const second=f.pool.fetch('http://v14/drift-run/api/state');await tick();
 assert.equal(calls.length,1);assert.ok(f.active.has(8));assert.equal(f.log.some(([e,v])=>e==='stop'&&v===8),false);
 body.resolve();assert.deepEqual(await(await first).json(),{ok:true});await second;assert.ok(f.active.has(14));assert.equal(f.maximum,1);
});
test('a disconnected browser does not make a still-committing executor eligible for eviction',async t=>{
 const gate=deferred(),entered=deferred(),abort=new AbortController();let nativeSignal;
 const f=fixture(t,{maxWorkers:1,fetchImpl:async(url,options)=>{nativeSignal=options.signal;if(url.startsWith('http://v8/')){entered.resolve();await gate.promise;assert.equal(options.signal.aborted,false);}return Response.json({committed:true});}});
 const action=f.pool.fetch('http://v8/drift-run/api/action',{method:'POST',signal:abort.signal});await entered.promise;abort.abort();const next=f.pool.fetch('http://v14/drift-run/api/state');await tick();assert.equal(nativeSignal.aborted,false);assert.ok(f.active.has(8));gate.resolve();assert.equal((await(await action).json()).committed,true);await next;assert.ok(f.active.has(14));
});
test('queued aborted requests are removed without a backend start or queue deadlock',async t=>{
 const gate=deferred(),entered=deferred();const f=fixture(t,{maxWorkers:1,fetchImpl:async url=>{if(url.startsWith('http://v8/')){entered.resolve();await gate.promise;}return Response.json({ok:true});}});
 const first=f.pool.fetch('http://v8/drift-run/api/state');await entered.promise;const abort=new AbortController(),queued=f.pool.fetch('http://v9/drift-run/api/state',{signal:abort.signal});abort.abort();await assert.rejects(queued);const third=f.pool.fetch('http://v14/drift-run/api/state');gate.resolve();await first;await third;assert.equal(f.log.some(([e,v])=>e==='start'&&v===9),false);
});
test('migration waits for active native work and releases other process caches',async t=>{
 const gate=deferred(),entered=deferred();const f=fixture(t,{fetchImpl:async url=>{if(url.includes('/action')){entered.resolve();await gate.promise;}if(url.includes('/migrate-legacy'))assert.equal(f.active.size,1);return Response.json({ok:true});}});
 await f.pool.fetch('http://v8/drift-run/api/state');const action=f.pool.fetch('http://v8/drift-run/api/action');await entered.promise;const migration=f.pool.fetch('http://v14/drift-run/api/migrate-legacy');await tick();assert.ok(f.active.has(8));gate.resolve();await action;await migration;assert.deepEqual([...f.active],[14]);
});
test('a startup failure releases the scheduler and never retries a possibly committed action',async t=>{
 let starts=0,calls=0;const f=fixture(t,{maxWorkers:1,startRuntime:async r=>{starts++;if(r.version===8)throw Error('missing binary');return {alive:()=>true,stop:async()=>{}};},fetchImpl:async()=>{calls++;throw Error('response lost');}});
 await assert.rejects(f.pool.fetch('http://v8/drift-run/api/state'),/missing binary/);await assert.rejects(f.pool.fetch('http://v14/drift-run/api/action'),/response lost/);assert.equal(starts,2);assert.equal(calls,1);assert.equal(f.pool.snapshot().running,0);
});
