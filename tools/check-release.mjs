import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const expected=JSON.parse(readFileSync('docs/release-integrity.json','utf8'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
for(const version of [7,8]){
 const legacy=JSON.parse(readFileSync(`docs/release-integrity-v${version}.json`,'utf8'));
 for(const [file,hash]of Object.entries(legacy.nativeSources))assert.equal(sha(file),hash,file+` changes the preserved V${version} profile`);
}
for(const [file,hash]of Object.entries(expected.nativeSources))assert.equal(sha(file),hash,file+' changes the V9 profile');
for(const [file,hash]of Object.entries(expected.browserFiles))assert.equal(sha('dist/nightshift/'+file),hash,file+' differs from the verified V9 release');
console.log(`Verified preserved V7/V8 sources, ${Object.keys(expected.nativeSources).length} V9-bound native sources and ${Object.keys(expected.browserFiles).length} browser files.`);
