import {existsSync} from 'node:fs';
import path from 'node:path';

// Serializes the transition per authenticated account. An unfinished event
// stays on its exact V8 executor until finished or explicitly replaced.
export function careerMigration({runtimeUrl,legacyUrl,legacyDataDir,fetchImpl=fetch,hasLegacy=account=>existsSync(path.join(legacyDataDir,account+'-drift-run','active'))}){
 const queues=new Map(),resolved=new Set();
 async function dispatch(url,options){
  const account=options.headers['X-UTXOPlay-Account'];
  if(!/^[a-f0-9]{64}$/.test(account||''))throw Error('Invalid migration account');
  const suffix=new URL(url).pathname,legacy=legacyUrl+suffix;
  if(resolved.has(account))return fetchImpl(url,options);
  const read=async base=>{const r=await fetchImpl(base+'/drift-run/api/state',{headers:options.headers,signal:options.signal});if(!r.ok)throw Error('Career state unavailable');return r.json();};
  const current=await read(runtimeUrl);
  if(current.session.career_migrated||current.session.actions>0||!hasLegacy(account)){resolved.add(account);return fetchImpl(url,options);}
  const old=await read(legacyUrl),action=options.body?JSON.parse(options.body):null,playing=old.game.tick>0&&!old.game.over;
  if(playing&&action?.action?.type!=='race'||action?.action?.type==='ticks')return fetchImpl(legacy,options);
  if(action?.action&&(action.session_id!==old.session.id||action.expected_block!==old.session.block_hash))return Response.json({error:'Stale session. Refresh and try again.'},{status:409});
  const response=await fetchImpl(legacyUrl+'/drift-run/api/export',{headers:options.headers,signal:options.signal});if(!response.ok)throw Error('Previous signed career unavailable');
  const proof=await response.json();
  const carried=await fetchImpl(runtimeUrl+'/drift-run/api/migrate-v8',{method:'POST',headers:options.headers,body:JSON.stringify(proof),signal:options.signal});if(!carried.ok)throw Error('Previous career verification failed; your original save is retained.');
  const migrated=await carried.json();resolved.add(account);
  const request=action?.action?{...options,body:JSON.stringify({...action,session_id:migrated.session.id,expected_block:migrated.session.block_hash})}:options;
  return fetchImpl(url,request);
 }
 return async(url,options)=>{
  const account=options.headers['X-UTXOPlay-Account'],previous=queues.get(account)||Promise.resolve();
  const task=previous.catch(()=>{}).then(()=>dispatch(url,options));const settled=task.then(()=>{},()=>{});queues.set(account,settled);
  try{return await task;}finally{if(queues.get(account)===settled)queues.delete(account);}
 };
}
