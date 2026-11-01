import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const base=JSON.parse(readFileSync('docs/release-integrity-v14.2.1.json'));
for(let version=7;version<=14;version++)for(const [file,hash] of Object.entries(JSON.parse(readFileSync(`docs/release-integrity-v${version}.json`)).nativeSources))assert.equal(sha(file),hash,'Frozen V'+version+': '+file);
if(existsSync('docs/release-integrity-v15.json'))for(const [file,hash] of Object.entries(JSON.parse(readFileSync('docs/release-integrity-v15.json')).nativeSources))assert.equal(sha(file),hash,'Frozen V15: '+file);
const config=JSON.parse(readFileSync('games/nightshift-v15/host.json'));
const native=spawnSync('cargo',['run','--release','--locked','--offline','--manifest-path','games/nightshift-v15/native/Cargo.toml','--target-dir','target','--example','profile'],{encoding:'utf8'});
assert.equal(native.status,0,native.stderr);assert.equal(native.stdout.trim(),config.clientProfile);
assert.ok(readFileSync('games/arcade/web/nightshift15-profile.mjs','utf8').includes(config.clientProfile));
assert.ok(readFileSync('games/arcade/web/nightshift15-session-rules.mjs','utf8').includes(config.clientProfile));
const build=spawnSync('npm',['run','build'],{stdio:'inherit',env:{...process.env,DRIFT_BUILD_ROOT:process.env.DRIFT_BUILD_ROOT||'artifacts/reverse-v15/site'}});assert.equal(build.status,0);
const browserFiles={};
function walk(dir){for(const file of readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,file.name);if(file.isDirectory())walk(p);else if(!/\.(br|gz)$/.test(p))browserFiles[path.relative('dist/nightshift',p).split(path.sep).join('/')]=sha(p);}}
walk('dist/nightshift');
const nativeSources={...base.nativeSources};
for(const file of ['src/game.rs','src/driver.rs','src/rivals.rs','src/weapons.rs','src/session.rs','src/main.rs','src/lib.rs','Cargo.lock','Cargo.toml']){const p='games/nightshift-v15/native/'+file;nativeSources[p]=sha(p);}
const nativeBinaries={...base.nativeBinaries};
if(existsSync('docs/release-integrity.json')){const prior=JSON.parse(readFileSync('docs/release-integrity.json'));if(prior.rulesVersion===15&&prior.profile===config.clientProfile&&Object.entries(nativeSources).every(([p,h])=>prior.nativeSources[p]===h)&&/^[a-f0-9]{64}$/.test(prior.nativeBinaries?.['15']))nativeBinaries['15']=prior.nativeBinaries['15'];}
const hostFiles=new Set([...Object.keys(base.presentationHostFiles),'host/nightshift15.mjs','games/nightshift-v15/host.json']);
const result={version:JSON.parse(readFileSync('package.json')).version,rulesVersion:15,profile:config.clientProfile,nativeSources,presentationHostFiles:Object.fromEntries([...hostFiles].map(p=>[p,sha(p)])),browserFiles,nativeBinaries,deliveryStatus:nativeBinaries['15']?'Bookworm V15 executable measured; deployment acceptance recorded separately.':'V15 reverse fix in development; Bookworm executable and deployment acceptance pending.',notes:'V15 adds responsive reverse and fractional reverse travel. V7–V14 inputs remain frozen; unfinished historical races use their original executor. Career migration is explicit. Myelin is off-chain host replay, not CKB settlement.'};
writeFileSync('docs/release-integrity.json',JSON.stringify(result,null,2)+'\n');console.log({version:result.version,profile:result.profile,nativeSources:Object.keys(nativeSources).length,browserFiles:Object.keys(browserFiles).length});
