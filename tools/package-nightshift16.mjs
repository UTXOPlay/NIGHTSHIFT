import assert from 'node:assert/strict';
import {copyFileSync,mkdirSync,readFileSync,rmSync,existsSync,writeFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

const root=path.resolve('artifacts/reverse-traffic-v16/release'),payload=root+'/payload';
const current=JSON.parse(readFileSync('docs/release-integrity.json')),previous=JSON.parse(readFileSync('docs/release-integrity-v15.0.1.json'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
assert.equal(current.rulesVersion,16);assert.notEqual(current.profile,previous.profile);
for(const[p,h]of Object.entries(previous.nativeSources))assert.equal(current.nativeSources[p],h,'Keep published native input '+p);
for(const[v,h]of Object.entries(previous.nativeBinaries))assert.equal(current.nativeBinaries[v],h,'Inherit executable '+v);
for(const[p,h]of Object.entries(previous.presentationHostFiles))assert.equal(current.presentationHostFiles[p],h,'Keep published host '+p);
const measured=JSON.parse(readFileSync('artifacts/reverse-traffic-v16/bookworm-result.json'));assert.equal(measured.complete,true);assert.equal(measured.profile,current.profile);assert.equal(current.nativeBinaries[16],measured.nativeBinarySha256);
assert.deepEqual(Object.keys(previous.browserFiles).filter(p=>!Object.hasOwn(current.browserFiles,p)),[]);
for(const[p,h]of Object.entries(current.browserFiles))assert.equal(sha('dist/nightshift/'+p),h,p);
const git=spawnSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'});assert.equal(git.status,0);assert.equal(git.stdout.trim(),'','Commit source first');
const commit=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim();
rmSync(payload,{recursive:true,force:true});mkdirSync(payload,{recursive:true});
function copy(p){const dest=path.join(payload,p);mkdirSync(path.dirname(dest),{recursive:true});copyFileSync(p,dest);}
const changed=[];
for(const[p,h]of Object.entries(current.browserFiles)){if(previous.browserFiles[p]===h)continue;changed.push(p);copy('dist/nightshift/'+p);for(const suffix of ['.br','.gz'])if(existsSync('dist/nightshift/'+p+suffix))copy('dist/nightshift/'+p+suffix);}
for(const p of [...Object.keys(current.presentationHostFiles),'package.json','package-lock.json','docs/release-integrity.json','docs/release-integrity-v16.json','docs/release-integrity-v15.0.1.json','docs/reverse-traffic-v16.md','deploy/Dockerfile.v16-upgrade'])copy(p);
writeFileSync(root+'/delta.json',JSON.stringify({changed},null,2)+'\n');
assert.equal(spawnSync('tar',['-czf',root+'/payload.tgz','-C',root,'payload']).status,0);
const report={version:current.version,commit,baseVersion:previous.version,baseGameImage:'sha256:88776b87b8c60830ff0d42cc842d8a5c8050aca71334a8687898eb9b33e90363',profile:current.profile,payloadSha256:sha(root+'/payload.tgz'),payloadBytes:statSync(root+'/payload.tgz').size,nativeBinarySha256:current.nativeBinaries[16],nativeSourceSha256:measured.sourceSha256,browserFiles:Object.keys(current.browserFiles).length,changedBrowserFiles:changed.length};
writeFileSync(root+'/source.json',JSON.stringify(report,null,2)+'\n');console.log(report);
