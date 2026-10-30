import {installReviewProfile} from './client-profile.mjs';
// Optional QA transport: exact verified assets are cached; HTML/API requests stay remote.
import {chromium} from 'playwright';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve('dist/nightshift'),manifest=JSON.parse(readFileSync('docs/release-integrity.json')),target=process.argv[2];
assert.match(target||'',/^tools\/nightshift(?:9-[a-z-]+|-controls-review)\.mjs$/);
for(const [file,hash] of Object.entries(manifest.browserFiles))assert.equal(createHash('sha256').update(readFileSync(path.join(root,file))).digest('hex'),hash,file);
const launch=chromium.launch.bind(chromium),types={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.txt':'text/plain','.glb':'model/gltf-binary','.wav':'audio/wav','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
chromium.launch=async options=>{
 const browser=await launch(options),newContext=browser.newContext.bind(browser);
 browser.newContext=async options=>{
  const ctx=await newContext(options);installReviewProfile(ctx);
  await ctx.route('**/games/nightshift/**',route=>{
   const u=new URL(route.request().url()),relative=decodeURIComponent(u.pathname.split('/games/nightshift/')[1]||''),file=path.resolve(root,relative);
   if(u.origin!==(process.env.DRIFT_ORIGIN||'http://127.0.0.1:8899')||route.request().isNavigationRequest()||!Object.hasOwn(manifest.browserFiles,relative)||!file.startsWith(root+path.sep)||!existsSync(file))return route.continue();
   return route.fulfill({path:file,contentType:types[path.extname(file)]||'application/octet-stream'});
  });return ctx;
 };return browser;
};
console.log('QA uses verified local asset bytes. Navigation, authentication, native API and save requests use the configured remote origin.');
await import(pathToFileURL(path.resolve(target)));
