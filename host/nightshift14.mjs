import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createGameHost} from './server.mjs';
import {careerMigration} from './career-migration.mjs';
import {createRuntimePool} from './runtime-pool.mjs';

const generations=[[8,'LEGACY',8797],[9,'PREVIOUS',8796],[10,'ROADBLOCK',8795],[11,'GRIP',8794],[12,'PEDAL',8793],[13,'CAREER',8798]];
export function createNightshift14({env=process.env,fetchImpl=fetch,startRuntime}={}){
 const config=JSON.parse(readFileSync(new URL('../games/nightshift-v14/host.json',import.meta.url))),token=env.RUNTIME_TOKEN;
 if(!token||token.length<32)throw Error('Set a stable RUNTIME_TOKEN of at least 32 characters.');
 const port=Number(env.WEB_PORT||config.port),origin=env.GAME_ORIGIN||`http://127.0.0.1:${port}`;
 const current={version:14,url:env.RUNTIME_URL||`http://127.0.0.1:${Number(env.RUNTIME_PORT||config.runtimePort)}`,dataDir:env.DATA_DIR||'data/nightshift-v14',command:[env.RUNTIME_BINARY||config.runtimeCommand[0],...config.runtimeCommand.slice(1)],external:!!env.RUNTIME_URL};
 const runtimes=generations.filter(([,prefix])=>env[prefix+'_DATA_DIR']).map(([version,prefix,nativePort])=>({version,dataDir:env[prefix+'_DATA_DIR'],url:env[prefix+'_RUNTIME_URL']||`http://127.0.0.1:${Number(env[prefix+'_RUNTIME_PORT']||nativePort)}`,command:[env[prefix+'_BINARY']||`target/release/myelin-nightshift-v${version}`],external:!!env[prefix+'_RUNTIME_URL']}));runtimes.push(current);
 const pool=createRuntimePool({runtimes,token,maxWorkers:Number(env.NATIVE_WORKER_LIMIT||2),fetchImpl,startRuntime});
 const active=(r,account)=>existsSync(path.join(r.dataDir,account+'-drift-run','active'));
 let runtimeFetch=pool.fetch;
 for(let n=1;n<runtimes.length;n++){
  const next=runtimes[n],old=runtimes[n-1],history=runtimes.slice(0,n);
  runtimeFetch=careerMigration({runtimeUrl:next.url,legacyUrl:old.url,legacyDataDir:old.dataDir,fetchImpl:pool.fetch,legacyFetch:runtimeFetch,migrationPath:next.version===9?'migrate-v8':'migrate-legacy',hasCurrent:account=>active(next,account),hasLegacy:account=>history.some(r=>active(r,account))});
 }
 const service=createGameHost({config,origin,runtimeUrl:current.url,runtimeToken:token,sessionSecret:env.SESSION_SECRET||token,fetchImpl:runtimeFetch});
 return {service,pool,config,port,origin,bind:env.BIND||'127.0.0.1',async close(){service.close();await pool.close();}};
}
export function startNightshift14(options){
 const host=createNightshift14(options),server=host.service.app.listen(host.port,host.bind,()=>console.log(`${host.config.name}: ${host.origin}`));host.service.attachSockets(server);
 let stopping=false;const stop=()=>{if(stopping)return;stopping=true;server.close(()=>{void host.close().then(()=>process.exit(0));});setTimeout(()=>{void host.close().finally(()=>process.exit(1));},3000).unref();};
 server.on('error',error=>{console.error(error);stop();});for(const signal of ['SIGINT','SIGTERM'])process.on(signal,stop);
 return {...host,server,stop};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)startNightshift14();
