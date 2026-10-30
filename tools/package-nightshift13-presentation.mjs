import {readFileSync,writeFileSync,mkdirSync,rmSync,copyFileSync,existsSync} from 'node:fs';
import path from 'node:path';import {spawnSync} from 'node:child_process';
const root='artifacts/presentation-v13/release',payload=root+'/payload',current=JSON.parse(readFileSync('docs/release-integrity.json')),before=JSON.parse(readFileSync(process.env.DRIFT_BASE_MANIFEST||'docs/release-integrity-v13.json'));
rmSync(payload,{recursive:true,force:true});mkdirSync(payload,{recursive:true});const inflate=[],changed=[];
function copy(source,target){const dest=payload+'/'+target;mkdirSync(path.dirname(dest),{recursive:true});copyFileSync(source,dest);}
for(const[file,hash]of Object.entries(current.browserFiles)){
 if(before.browserFiles[file]===hash)continue;const source='dist/nightshift/'+file,target='dist/nightshift/'+file;changed.push(file);
 if(/\.(?:glb|pmrem)$/.test(file)&&existsSync(source+'.br')){copy(source+'.br',target+'.br');inflate.push(target);}
 else{copy(source,target);for(const ext of['.br','.gz'])if(existsSync(source+ext))copy(source+ext,target+ext);}
}
for(const file of Object.keys(current.presentationHostFiles))copy(file,file);
for(const file of['package.json','package-lock.json','docs/release-integrity.json','docs/release-integrity-v13.json','docs/release-integrity-v13.1.json','docs/presentation-v131-assets.json','docs/presentation-v131-prompts.json'])copy(file,file);
for(const file of['deploy/release-presentation-v13.py','deploy/verify-loading.py'])copyFileSync(file,root+'/'+path.basename(file));
writeFileSync(payload+'/inflate.json',JSON.stringify(inflate)+'\n');writeFileSync(root+'/delta.json',JSON.stringify({version:current.version,baseVersion:before.version,changed,inflate},null,2)+'\n');
const result=spawnSync('tar',['-czf',path.resolve(root,'payload.tar.gz'),'-C',path.resolve(root),'payload'],{stdio:'inherit'});if(result.status)process.exit(result.status);console.log({version:current.version,changed:changed.length,compressedBinaryAssets:inflate.length});
