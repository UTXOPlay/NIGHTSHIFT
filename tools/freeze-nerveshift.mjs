// Presentation-only release: published V16 and all historical native inputs stay frozen.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const base=JSON.parse(readFileSync('docs/release-integrity-v16.json'));
for(let v=7;v<=16;v++)for(const [p,h] of Object.entries(JSON.parse(readFileSync(`docs/release-integrity-v${v}.json`)).nativeSources))assert.equal(sha(p),h,p);
const browserFiles={};
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(!/\.(br|gz)$/.test(p))browserFiles[path.relative('dist/nightshift',p).split(path.sep).join('/')]=sha(p);}}
walk('dist/nightshift');
const allowed=new Set(['host/server.mjs','host/nightshift-routes.mjs','games/nightshift-v16/host.json']);
for(const [p,h] of Object.entries(base.presentationHostFiles))if(!allowed.has(p))assert.equal(sha(p),h,p);
const config=JSON.parse(readFileSync('games/nightshift-v16/host.json'));
assert.equal(config.clientProfile,base.profile);assert.equal(config.sessionName,'myelin-nightshift-v8');
const hostFiles=new Set(Object.keys(base.presentationHostFiles));
const visited=new Set();
function bindHostModule(file){
 if(visited.has(file)||!file.startsWith('host/')||!file.endsWith('.mjs'))return;
 visited.add(file);hostFiles.add(file);
 for(const match of readFileSync(file,'utf8').matchAll(/(?:from\s*|import\s*\()\s*['"](\.[^'"]+)['"]/g))bindHostModule(path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1])));
}
for(const file of [...hostFiles])bindHostModule(file);
const result={...base,version:JSON.parse(readFileSync('package.json')).version,presentationHostFiles:Object.fromEntries([...hostFiles].map(p=>[p,sha(p)])),browserFiles,deliveryStatus:'Presentation-only NerveShift rename. All nine published executables are inherited unchanged; deployment acceptance recorded separately.',notes:'NerveShift replaces the public NIGHTSHIFT name, cover and URL. Replay/application profile, native sources, signed saves, stable account ID and session namespace are unchanged. Myelin is off-chain host replay, not CKB settlement.'};
writeFileSync('docs/release-integrity.json',JSON.stringify(result,null,2)+'\n');
writeFileSync(`docs/release-integrity-v${result.version}.json`,JSON.stringify(result,null,2)+'\n');
console.log({version:result.version,profile:result.profile,browserFiles:Object.keys(browserFiles).length,nativeExecutables:Object.keys(base.nativeBinaries).length});
