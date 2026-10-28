import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const expected=JSON.parse(readFileSync('docs/release-integrity.json','utf8'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
for(const [file,hash] of Object.entries(expected.nativeSources))assert.equal(sha(file),hash,file+' changes the native profile');
for(const [file,hash] of Object.entries(expected.browserFiles))assert.equal(sha('dist/drift-run/'+file),hash,file+' differs from the verified V7 release');
console.log(`Verified ${Object.keys(expected.nativeSources).length} native source hashes and ${Object.keys(expected.browserFiles).length} deployed browser files.`);
