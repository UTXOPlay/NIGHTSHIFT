import {careerMigration} from './career-migration.mjs';
import {readFileSync,existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {createGameHost} from './server.mjs';
const config=JSON.parse(readFileSync(new URL('../games/nightshift-v12/host.json',import.meta.url)));
const port=Number(process.env.WEB_PORT||config.port),runtimePort=Number(process.env.RUNTIME_PORT||config.runtimePort);
const origin=process.env.GAME_ORIGIN||`http://127.0.0.1:${port}`;
const runtimeUrl=process.env.RUNTIME_URL||`http://127.0.0.1:${runtimePort}`;
const runtimeToken=process.env.RUNTIME_TOKEN;
if(!runtimeToken||runtimeToken.length<32)throw Error('Set a stable RUNTIME_TOKEN of at least 32 characters.');
let child,service,server,stopping=false;
const extraChildren=[];
const install=config.plugin?(await import(new URL(config.plugin,import.meta.url))).install:undefined;
const legacyDir=process.env.LEGACY_DATA_DIR,legacyUrl=process.env.LEGACY_RUNTIME_URL||'http://127.0.0.1:8797';
const previousDir=process.env.PREVIOUS_DATA_DIR,previousUrl=process.env.PREVIOUS_RUNTIME_URL||'http://127.0.0.1:8796';
const oldMigration=legacyDir?careerMigration({runtimeUrl:previousUrl,legacyUrl,legacyDataDir:legacyDir}):fetch;
const roadblockDir=process.env.ROADBLOCK_DATA_DIR,roadblockUrl=process.env.ROADBLOCK_RUNTIME_URL||'http://127.0.0.1:8795';
const circuitMigration=previousDir?careerMigration({runtimeUrl:roadblockDir?roadblockUrl:runtimeUrl,legacyUrl:previousUrl,legacyDataDir:previousDir,legacyFetch:oldMigration,migrationPath:'migrate-legacy',hasLegacy:account=>[previousDir,legacyDir].filter(Boolean).some(dir=>existsSync(path.join(dir,account+'-drift-run','active')))}):fetch;
const gripDir=process.env.GRIP_DATA_DIR,gripUrl=process.env.GRIP_RUNTIME_URL||'http://127.0.0.1:8794';
const gripMigration=roadblockDir?careerMigration({runtimeUrl:gripDir?gripUrl:runtimeUrl,legacyUrl:roadblockUrl,legacyDataDir:roadblockDir,legacyFetch:circuitMigration,migrationPath:'migrate-legacy',hasLegacy:account=>[roadblockDir,previousDir,legacyDir].filter(Boolean).some(dir=>existsSync(path.join(dir,account+'-drift-run','active')))}):circuitMigration;
const migrate=gripDir?careerMigration({runtimeUrl,legacyUrl:gripUrl,legacyDataDir:gripDir,legacyFetch:gripMigration,migrationPath:'migrate-legacy',hasLegacy:account=>[gripDir,roadblockDir,previousDir,legacyDir].filter(Boolean).some(dir=>existsSync(path.join(dir,account+'-drift-run','active')))}):gripMigration;
service=createGameHost({config,origin,runtimeUrl,runtimeToken,fetchImpl:migrate,sessionSecret:process.env.SESSION_SECRET||runtimeToken,install});
server=service.app.listen(port,process.env.BIND||'127.0.0.1',()=>console.log(`${config.name}: ${origin}`));
service.attachSockets(server);
if(!process.env.RUNTIME_URL){
 const [command,...args]=config.runtimeCommand;
 child=spawn(process.env.RUNTIME_BINARY||command,args,{stdio:'inherit',env:{...process.env,DATA_DIR:process.env.DATA_DIR||'data/nightshift-v12',PORT:String(runtimePort),BIND:'127.0.0.1'}});
 child.on('error',error=>{console.error(error);stop(1);});
 child.on('exit',code=>{if(!stopping)stop(code||1);});
}
if(legacyDir&&!process.env.LEGACY_RUNTIME_URL){const worker=spawn(process.env.LEGACY_BINARY||'target/release/myelin-nightshift-v8',[],{stdio:'inherit',env:{...process.env,PORT:'8797',BIND:'127.0.0.1',DATA_DIR:legacyDir}});extraChildren.push(worker);worker.on('error',error=>{console.error(error);stop(1);});worker.on('exit',code=>{if(!stopping)stop(code||1);});}
if(previousDir&&!process.env.PREVIOUS_RUNTIME_URL){const worker=spawn(process.env.PREVIOUS_BINARY||'target/release/myelin-nightshift-v9',[],{stdio:'inherit',env:{...process.env,PORT:'8796',BIND:'127.0.0.1',DATA_DIR:previousDir}});extraChildren.push(worker);worker.on('error',error=>{console.error(error);stop(1);});worker.on('exit',code=>{if(!stopping)stop(code||1);});}
if(roadblockDir&&!process.env.ROADBLOCK_RUNTIME_URL){const worker=spawn(process.env.ROADBLOCK_BINARY||'target/release/myelin-nightshift-v10',[],{stdio:'inherit',env:{...process.env,PORT:'8795',BIND:'127.0.0.1',DATA_DIR:roadblockDir}});extraChildren.push(worker);worker.on('error',error=>{console.error(error);stop(1);});worker.on('exit',code=>{if(!stopping)stop(code||1);});}
if(gripDir&&!process.env.GRIP_RUNTIME_URL){const worker=spawn(process.env.GRIP_BINARY||'target/release/myelin-nightshift-v11',[],{stdio:'inherit',env:{...process.env,PORT:'8794',BIND:'127.0.0.1',DATA_DIR:gripDir}});extraChildren.push(worker);worker.on('error',error=>{console.error(error);stop(1);});worker.on('exit',code=>{if(!stopping)stop(code||1);});}
// Versioned games own their rules/data while legacy arcade profiles keep their
// original executable and storage. Extra runtimes are private loopback services.
for(const runtime of config.extraRuntimes||[]){
 const [command,...args]=runtime.command;
 const worker=spawn(command,args,{stdio:'inherit',env:{...process.env,PORT:String(runtime.port),BIND:'127.0.0.1',DATA_DIR:path.join(process.env.DATA_DIR||'data',runtime.dataDirectory)}});
 extraChildren.push(worker);
 worker.on('error',error=>{console.error(error);stop(1);});
 worker.on('exit',code=>{if(!stopping)stop(code||1);});
}
server.on('error',error=>{console.error(error);stop(1);});
function stop(code=0){if(stopping)return;stopping=true;child?.kill('SIGTERM');for(const worker of extraChildren)worker.kill('SIGTERM');service?.close();server?.close(()=>process.exit(code));setTimeout(()=>{child?.kill('SIGKILL');for(const worker of extraChildren)worker.kill('SIGKILL');process.exit(code);},3000).unref();}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop());
