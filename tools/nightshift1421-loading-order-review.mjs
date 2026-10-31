import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';

const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:19422',out=process.env.DRIFT_OUT||'artifacts/loading-v1421/order',expected=process.env.DRIFT_EXPECT_PRELOAD!=='0';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});context.setDefaultTimeout(180000);
const requests=[],errors=[];
try{
 const page=await context.newPage(),cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
 cdp.on('Network.requestWillBeSent',e=>requests.push({url:e.request.url,time:e.timestamp,type:e.type,priority:e.request.initialPriority,post:e.request.postData}));
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/games/nightshift/?review=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__driftReview?.().loaded);await page.locator('utxo-loader').waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>__driftReview().engine.deferred),true);assert.equal(requests.filter(r=>r.url.includes('nightshift9-renderer.bundle')).length,0,'The initial menu stays deferred');
 await page.getByRole('button',{name:'Start selected race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);
 const bundles=requests.filter(r=>r.url.includes('nightshift9-renderer.bundle')),audio=requests.filter(r=>/\.(wav|ogg)(?:\?|$)/.test(r.url));
 const race=requests.find(r=>r.post&&(()=>{try{return JSON.parse(r.post).action?.type==='race';}catch{return false;}})());
 const links=await page.locator('link[data-nightshift-renderer]').evaluateAll(nodes=>nodes.map(l=>({href:l.href,rel:l.rel,priority:l.fetchPriority,crossOrigin:l.crossOrigin})));
 const state=await page.evaluate(()=>{const r=__driftReview();return{version:r.game.physics_version,running:r.running,tick:r.game.tick,loadingTimings:r.engine.loadingTimings};});
 const report={testRunnerVersion:JSON.parse(readFileSync('package.json')).version,origin,expectedPreload:expected,bundles,audio,race,links,state,errors};writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 assert.equal(bundles.length,1,'Preload/import share exactly one module transfer');assert.ok(audio.length&&race);
 if(expected){assert.equal(links.length,1);assert.equal(links[0].rel,'modulepreload');assert.equal(links[0].priority,'high');assert.equal(links[0].href,bundles[0].url);assert.ok(['High','VeryHigh'].includes(bundles[0].priority));assert.ok(bundles[0].time<=audio[0].time,'Renderer starts before audio');assert.ok(bundles[0].time<=race.time,'Renderer overlaps the native command');}
 else{assert.equal(links.length,0);assert.ok(bundles[0].time>race.time);assert.ok(bundles[0].time>audio[0].time);}
 assert.equal(state.version,14);assert.deepEqual(errors,[]);await page.keyboard.press('p');await page.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);
}finally{await browser.close();}
