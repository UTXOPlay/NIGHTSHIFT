import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {reviewSession} from './review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'https://store.utxoplay.io',out=process.env.DRIFT_OUT||'artifacts/nightshift-v7/production-loading';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),context=await browser.newContext({viewport:{width:1920,height:1080}});
let logout;
try{
 logout=await reviewSession(context,origin);
 const page=await context.newPage(),errors=[],runs=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
 for(const cache of ['cold','warm']){
  const started=Date.now();
  await page.goto(origin+'/games/drift-run/?review=1',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>__driftReview?.().loaded,null,{timeout:60000});
  const readyMs=Date.now()-started;
  const timings=await page.evaluate(()=>({navigation:performance.getEntriesByType('navigation')[0].toJSON(),resources:performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,duration:r.duration,start:r.startTime,end:r.responseEnd,transferBytes:r.transferSize,bodyBytes:r.encodedBodySize})).sort((a,b)=>b.duration-a.duration)}));
  runs.push({cache,readyMs,...timings});console.log({cache,readyMs,slowest:timings.resources.slice(0,4)});
 }
 assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({runs,errors},null,2));
}finally{if(logout)await logout();await browser.close();}
