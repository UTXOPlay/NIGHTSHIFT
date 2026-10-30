import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const expected=JSON.parse(readFileSync('docs/release-integrity.json','utf8'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
for(const version of [7,8,9,10,11]){
 const legacy=JSON.parse(readFileSync(`docs/release-integrity-v${version}.json`,'utf8'));
 for(const [file,hash]of Object.entries(legacy.nativeSources))assert.equal(sha(file),hash,file+` changes the preserved V${version} profile`);
}
for(const [file,hash]of Object.entries(expected.nativeSources))assert.equal(sha(file),hash,file+' changes the V12 profile');
for(const [file,hash]of Object.entries(expected.presentationHostFiles||{}))assert.equal(sha(file),hash,file+' differs from the presentation host');
for(const [file,hash]of Object.entries(expected.browserFiles))assert.equal(sha('dist/nightshift/'+file),hash,file+' differs from the verified V12 release');
console.log(`Verified preserved V7/V8/V9/V10/V11 sources, ${Object.keys(expected.nativeSources).length} V12-bound native sources and ${Object.keys(expected.browserFiles).length} browser files.`);

const renderer='./_arcade/nightshift9-renderer.bundle.mjs?v='+expected.version;
assert.ok(readFileSync('dist/nightshift/index.html','utf8').includes('href="'+renderer+'"'),'renderer preload must use the release cache key');
assert.ok(readFileSync('dist/nightshift/app.js','utf8').includes(renderer),'entry and renderer preload must share a release cache key');

assert.equal(JSON.parse(readFileSync('games/nightshift-v12/host.json')).clientProfile,expected.profile,'host requires the current client profile');
assert.ok(readFileSync('dist/nightshift/app.js','utf8').includes(expected.profile),'browser advertises the exact current profile');
