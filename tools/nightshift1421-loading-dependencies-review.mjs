import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';

const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:19422',out=process.env.DRIFT_OUT||'artifacts/loading-v1421/dependencies',parallel=process.env.DRIFT_EXPECT_PARALLEL!=='0';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});context.setDefaultTimeout(180000);
const requests=new Map(),errors=[];
try{
 const page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
 cdp.on('Network.requestWillBeSent',e=>requests.set(e.requestId,{url:e.request.url,start:e.timestamp,initiator:e.initiator.type,source:e.initiator.url||e.initiator.stack?.callFrames[0]?.url}));
 cdp.on('Network.loadingFinished',e=>{const r=requests.get(e.requestId);if(r)r.end=e.timestamp;});
 page.on('pageerror',e=>errors.push(e.message));
 // Delay real resources, never game state. Independent work must start while
 // these unrelated downloads are still outstanding.
 await page.route(/\/(?:structures-v8-v131\.webp|concept-v11-race\.glb)(?:\?|$)/,async route=>{await new Promise(resolve=>setTimeout(resolve,1200));await route.continue();});
 await page.goto(origin+'/games/nightshift/?review=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__driftReview?.().loaded);await page.locator('utxo-loader').waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>__driftReview().engine.deferred),true);
 await page.getByRole('button',{name:'Start selected race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);
 const find=name=>[...requests.values()].filter(r=>new URL(r.url).pathname.endsWith('/'+name));
 const structure=find('structures-v8-v131.webp'),fixture=find('street-lighting-v8-v131.webp'),fleet=find('concept-v11-race.glb');
 // The HUD's CSS also uses the marker atlas. Routing disables HTTP caching,
 // so retain that independent request separately from the renderer's load.
 const cssMarkers=find('combat-markers-v131.webp').filter(r=>r.source?.includes('.css'));
 const effects=['combat-markers-v131.webp','combat-pickups-v131.webp','combat-vfx-v81-v131.webp','drive-vfx-v81-v131.webp','impact-sequence-v91-v131.webp'].map(name=>({name,requests:find(name).filter(r=>!r.source?.includes('.css'))}));
 const state=await page.evaluate(()=>{const r=__driftReview();return{rules:r.game.physics_version,running:r.running,ready:r.engine.raceAssetsReady,assetErrors:r.engine.errors,programs:r.engine.programs};});
 const report={origin,parallel,delayedResourceMs:1200,structure,fixture,fleet,effects,cssMarkers,state,errors};writeFileSync(out+'/review.json',JSON.stringify(report,null,2));
 for(const list of [structure,fixture,fleet,...effects.map(e=>e.requests)]){assert.equal(list.length,1,'Each resource transfers once');assert.ok(list[0].end,'Each resource completed');}
 if(parallel){assert.ok(fixture[0].start<structure[0].end,'Fixtures do not wait for the structure atlas');for(const e of effects)assert.ok(e.requests[0].start<fleet[0].end,e.name+' does not wait for the selected coarse car');}
 else{assert.ok(fixture[0].start>=structure[0].end);for(const e of effects)assert.ok(e.requests[0].start>=fleet[0].end);}
 assert.equal(state.rules,14);assert.equal(state.ready,true);assert.equal(state.assetErrors,0);assert.deepEqual(errors,[]);
 await page.keyboard.press('p');await page.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);console.log(JSON.stringify({origin,parallel,state,errors}));
}finally{await browser.close();}
