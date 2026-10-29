import test from 'node:test';import assert from 'node:assert/strict';import {careerMigration} from '../host/career-migration.mjs';
const account='a'.repeat(64),headers={'X-UTXOPlay-Account':account,'X-Runtime-Token':'test'},url='http://v9/drift-run/api/';
function fixture(playing){
 const old={game:{tick:playing?50:0,over:false,career:{credits:650}},session:{id:'v8',block_hash:'old',actions:1}},fresh={game:{physics_version:9,career:{credits:1200}},session:{id:'v9',block_hash:'new',actions:0,career_migrated:false}},calls=[];
 const send=careerMigration({runtimeUrl:'http://v9',legacyUrl:'http://v8',legacyDataDir:'/unused',hasLegacy:()=>true,fetchImpl:async(u,o)=>{calls.push({url:u,options:o});if(u.endsWith('/api/state'))return Response.json(u.startsWith('http://v8')?old:fresh);if(u.endsWith('/api/export'))return Response.json({application:'myelin-nightshift-v8',proof:'signed'});if(u.endsWith('/api/migrate-v8')){fresh.game.career={...old.game.career};fresh.session.career_migrated=true;return Response.json(fresh);}return Response.json({ok:true});}});
 return{old,fresh,calls,send};
}
test('an unfinished event keeps its exact V8 executor until explicitly replaced',async()=>{
 const f=fixture(true);await f.send(url+'state',{headers});assert.equal(f.calls.at(-1).url,'http://v8/drift-run/api/state');assert.ok(!f.calls.some(c=>c.url.endsWith('/migrate-v8')));
 const body={session_id:'v8',expected_block:'old',action:{type:'race',mode:0,vehicle:0,gadget:0,difficulty:0}};await f.send(url+'action',{headers,method:'POST',body:JSON.stringify(body)});
 const sent=JSON.parse(f.calls.at(-1).options.body);assert.equal(sent.session_id,'v9');assert.equal(sent.expected_block,'new');assert.deepEqual(sent.action,body.action);assert.equal(f.fresh.game.career.credits,650);
});
test('concurrent state reads migrate only once and stale commands cannot import a career',async()=>{
 const f=fixture(false);await Promise.all([f.send(url+'state',{headers}),f.send(url+'state',{headers})]);assert.equal(f.calls.filter(c=>c.url.endsWith('/migrate-v8')).length,1);
 const stale=fixture(false),response=await stale.send(url+'action',{headers,method:'POST',body:JSON.stringify({session_id:'wrong',expected_block:'old',action:{type:'upgrade',vehicle:0,choice:0}})});assert.equal(response.status,409);assert.ok(!stale.calls.some(c=>c.url.endsWith('/migrate-v8')));
 await assert.rejects(stale.send(url+'state',{headers:{'X-UTXOPlay-Account':'../other'}}),/Invalid migration account/);
});

test('V10 delegates an unfinished V8 through V9 and migrates only an explicit new event',async()=>{
 const old={game:{tick:50,over:false,career:{credits:650}},session:{id:'v8',block_hash:'old',actions:1}},middle={game:{physics_version:9,tick:0,over:false,career:{credits:1200}},session:{id:'v9',block_hash:'middle',actions:0,career_migrated:false}},current={game:{physics_version:10,tick:0,over:false,career:{credits:1200}},session:{id:'v10',block_hash:'current',actions:0,career_migrated:false}},calls=[];
 const request=async(u,o)=>{
  calls.push({url:u,options:o});
  if(u.endsWith('/api/state'))return Response.json(u.startsWith('http://v8')?old:u.startsWith('http://v9')?middle:current);
  if(u.endsWith('/api/export'))return Response.json({application:'myelin-nightshift-v8',signed:true});
  if(u.endsWith('/api/migrate-legacy')){current.game.career={...old.game.career};current.session.career_migrated=true;return Response.json(current);}
  return Response.json({ok:true});
 };
 const inner=careerMigration({runtimeUrl:'http://v9',legacyUrl:'http://v8',legacyDataDir:'/unused',fetchImpl:request,hasLegacy:()=>true});
 const outer=careerMigration({runtimeUrl:'http://v10',legacyUrl:'http://v9',legacyDataDir:'/unused',fetchImpl:request,legacyFetch:inner,migrationPath:'migrate-legacy',hasLegacy:()=>true});
 const state=await outer('http://v10/drift-run/api/state',{headers});assert.deepEqual(await state.json(),old);assert.ok(!calls.some(c=>c.url.endsWith('/migrate-legacy')));
 await outer('http://v10/drift-run/api/action',{headers,method:'POST',body:JSON.stringify({session_id:'v8',expected_block:'old',action:{type:'ticks',inputs:[0]}})});assert.equal(calls.at(-1).url,'http://v8/drift-run/api/action');
 const action={type:'race',mode:1,vehicle:0,gadget:1,difficulty:0};
 await outer('http://v10/drift-run/api/action',{headers,method:'POST',body:JSON.stringify({session_id:'v8',expected_block:'old',action})});
 assert.equal(calls.filter(c=>c.url.endsWith('/migrate-legacy')).length,1);assert.equal(calls.at(-1).url,'http://v10/drift-run/api/action');assert.deepEqual(JSON.parse(calls.at(-1).options.body),{session_id:'v10',expected_block:'current',action});assert.equal(current.game.career.credits,650);
});
