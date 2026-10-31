import assert from 'node:assert/strict';
import {copyFileSync,mkdirSync,readFileSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

const root=path.resolve(process.env.DRIFT_RELEASE_ROOT||'artifacts/engine-v1411/release'),payload=path.join(root,'payload');
const current=JSON.parse(readFileSync('docs/release-integrity.json'));
const previous=JSON.parse(readFileSync(process.env.DRIFT_BASE_MANIFEST||'docs/release-integrity-v14.1.0.json'));
const baseGameImage=process.env.DRIFT_BASE_IMAGE;
assert.match(baseGameImage||'',/^sha256:[a-f0-9]{64}$/,'Supply the inspected immutable production image');
assert.equal(current.rulesVersion,14);assert.equal(current.profile,previous.profile);
assert.deepEqual(current.nativeSources,previous.nativeSources,'A presentation overlay cannot change native rules');
assert.deepEqual(current.nativeBinaries,previous.nativeBinaries,'Keep every published executable');
assert.deepEqual(current.presentationHostFiles,previous.presentationHostFiles,'This overlay preserves all bound host files');
const additions=Object.keys(current.browserFiles).filter(p=>!Object.hasOwn(previous.browserFiles,p)).sort(),removals=Object.keys(previous.browserFiles).filter(p=>!Object.hasOwn(current.browserFiles,p)).sort();
let policy=null;
if(additions.length||removals.length){
 assert.ok(process.env.DRIFT_ASSET_POLICY,'Asset additions/removals require an explicitly reviewed package policy');
 policy=JSON.parse(readFileSync(process.env.DRIFT_ASSET_POLICY));assert.equal(policy.version,current.version);assert.equal(policy.baseVersion,previous.version);
 assert.deepEqual(additions,[...policy.additions].sort(),'Only the reviewed asset additions');assert.deepEqual(removals,policy.removals);assert.equal(removals.length,0,'Presentation overlays retain historical browser files');
 for(const p of policy.documentation||[])assert.match(p,/^docs\/[a-zA-Z0-9_.-]+\.(?:md|json)$/,'Only explicit repository release documentation');
}
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
for(const[file,hash]of Object.entries(current.browserFiles))assert.equal(sha('dist/nightshift/'+file),hash,file);
const git=spawnSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'});assert.equal(git.status,0);assert.equal(git.stdout.trim(),'','Commit the reviewed source before packaging');
const commit=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim();assert.match(commit,/^[a-f0-9]{40}$/);
rmSync(payload,{recursive:true,force:true});mkdirSync(payload,{recursive:true});
function copy(source,target=source){const dest=path.join(payload,target);assert.ok(dest.startsWith(payload+path.sep));mkdirSync(path.dirname(dest),{recursive:true});copyFileSync(source,dest);}
const changed=[];
for(const[file,hash]of Object.entries(current.browserFiles)){
 if(previous.browserFiles[file]===hash)continue;changed.push(file);copy('dist/nightshift/'+file);
 for(const suffix of ['.br','.gz']){const source='dist/nightshift/'+file+suffix;try{statSync(source);}catch{continue;}copy(source);}
}
for(const file of Object.keys(current.presentationHostFiles))copy(file);
for(const file of ['package.json','package-lock.json','docs/release-integrity.json','docs/release-integrity-v14.1.0.json','docs/engine-v1411.md','docs/single-player-completion.md'])copy(file);
for(const file of policy?.documentation||[])copy(file);
writeFileSync(path.join(root,'delta.json'),JSON.stringify({version:current.version,baseVersion:previous.version,changed},null,2)+'\n');
const packed=spawnSync('tar',['-czf',path.join(root,'payload.tgz'),'-C',root,'payload'],{stdio:'inherit'});assert.equal(packed.status,0);
const result={version:current.version,commit,baseVersion:previous.version,baseGameImage,profile:current.profile,payloadSha256:sha(path.join(root,'payload.tgz')),payloadBytes:statSync(path.join(root,'payload.tgz')).size,changedBrowserFiles:changed.length,browserFiles:Object.keys(current.browserFiles).length};
if(policy)result.assetPolicy={path:process.env.DRIFT_ASSET_POLICY,sha256:sha(process.env.DRIFT_ASSET_POLICY),additions,removals};
writeFileSync(path.join(root,'source.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
