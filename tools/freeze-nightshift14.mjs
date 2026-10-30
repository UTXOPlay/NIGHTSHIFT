import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const previous=JSON.parse(readFileSync('docs/release-integrity-v13.1.1.json'));
for(const [p,h]of Object.entries(previous.nativeSources))assert.equal(sha(p),h,'Frozen old rules: '+p);
const published=existsSync('docs/release-integrity-v14.json')?JSON.parse(readFileSync('docs/release-integrity-v14.json')):null;
if(published)for(const[p,h]of Object.entries(published.nativeSources))assert.equal(sha(p),h,'Published V14 rules are frozen: '+p);
const config=JSON.parse(readFileSync('games/nightshift-v14/host.json')),profile=config.clientProfile;
assert.ok(readFileSync('games/arcade/web/nightshift14-profile.mjs','utf8').includes(profile));
const output=spawnSync('cargo',['run','--release','--locked','--offline','--manifest-path','games/nightshift-v14/native/Cargo.toml','--target-dir','target','--example','profile'],{encoding:'utf8'});assert.equal(output.status,0,output.stderr);assert.equal(output.stdout.trim(),profile,'Exact V14 native profile');
const build=spawnSync('npm',['run','build'],{stdio:'inherit',env:{...process.env,DRIFT_BUILD_ROOT:process.env.DRIFT_BUILD_ROOT||'artifacts/rivals-v14/site'}});assert.equal(build.status,0);
const browserFiles={};function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(!/\.(br|gz)$/.test(p))browserFiles[path.relative('dist/nightshift',p).split(path.sep).join('/')]=sha(p);}}walk('dist/nightshift');
const nativeSources={...previous.nativeSources};for(const p of ['src/game.rs','src/driver.rs','src/rivals.rs','src/weapons.rs','src/session.rs','src/main.rs','src/lib.rs','Cargo.lock','Cargo.toml']){const file='games/nightshift-v14/native/'+p;nativeSources[file]=sha(file);}
const hostFiles=new Set([...Object.keys(previous.presentationHostFiles),'host/nightshift14.mjs','host/runtime-pool.mjs','games/nightshift-v14/host.json']);
const nativeBinaries={...previous.nativeBinaries,...published?.nativeBinaries};
if(published){assert.equal(profile,published.profile,'Published V14 application profile is frozen');for(const[v,h]of Object.entries(previous.nativeBinaries))assert.equal(published.nativeBinaries[v],h,'Published historical executable '+v);}
// A presentation rebuild can retain an already measured Bookworm binary only
// while every bound native input and its application profile remain identical.
try{const prior=JSON.parse(readFileSync('docs/release-integrity.json'));if(!published&&prior.rulesVersion===14&&prior.profile===profile&&Object.entries(nativeSources).every(([p,h])=>prior.nativeSources[p]===h)&&/^[a-f0-9]{64}$/.test(prior.nativeBinaries?.['14']))nativeBinaries['14']=prior.nativeBinaries['14'];}catch{}
const result={version:JSON.parse(readFileSync('package.json')).version,rulesVersion:14,profile,nativeSources,presentationHostFiles:Object.fromEntries([...hostFiles].map(p=>[p,sha(p)])),browserFiles,nativeBinaries,deliveryStatus:nativeBinaries['14']?'Bookworm V14 binary measured; staged and public deployment acceptance recorded separately.':'V14 browser integration in development; not deployed. The published V14 binary hash must be added after the Bookworm image build.',notes:'Preserve V8–V13 executables, application profiles and databases. Old unfinished races retain their original executor. Myelin provides off-chain host replay, not CKB settlement. No multiplayer implementation.'};
writeFileSync('docs/release-integrity.json',JSON.stringify(result,null,2)+'\n');console.log({version:result.version,profile,nativeSources:Object.keys(nativeSources).length,browserFiles:Object.keys(browserFiles).length});
