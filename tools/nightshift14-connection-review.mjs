import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {reviewSession} from './review-session.mjs';

const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:18940';
const out=process.env.DRIFT_OUT||'artifacts/rivals-v14/connection';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1280,height:720}});context.setDefaultTimeout(Number(process.env.DRIFT_TIMEOUT)||90000);
const errors=[],batches=[];let logout,release,hold,armed=false,held=false;
try{
 if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(context,origin);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 function arm(){held=false;armed=true;hold=new Promise(resolve=>release=resolve);}
 await page.route('**/api/action',async route=>{
  const action=route.request().postDataJSON()?.action;
  if(action?.type==='ticks'){
   batches.push(action.inputs.length);
   if(armed){armed=false;held=true;await hold;}
  }
  await route.continue();
 });
 await page.goto(origin+'/games/nightshift/?review=1');await page.waitForFunction(()=>window.__driftReview?.().loaded);
 arm();await page.getByRole('button',{name:'Start selected race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);
 await page.keyboard.down('w');
 // More than four seconds of unconfirmed input previously stopped the race.
 await page.waitForFunction(()=>__driftReview().running&&__driftReview().pending>=120);
 assert.equal(held,true);const jitterTick=await page.evaluate(()=>__driftReview().game.tick);release();await page.keyboard.up('w');await page.keyboard.press('p');
 await page.waitForFunction(()=>!__driftReview().running&&!__driftReview().pending&&!__driftReview().sending);
 let saved=await(await context.request.get(origin+'/games/nightshift/api/state')).json();assert.deepEqual(saved.game,await page.evaluate(()=>__driftReview().game));
 // Begin a new, stationary race so a longer network outage is isolated from
 // driving hazards. This is an ordinary signed race action, with no state edit.
 await page.getByRole('button',{name:'Choose another event',exact:true}).click();arm();
 await page.getByRole('button',{name:/^Start selected race/}).click();await page.waitForFunction(()=>__driftReview().running);
 const initial=await page.evaluate(()=>__driftReview().game.race_id);
 await page.waitForFunction(()=>__driftReview().view==='pause'&&!__driftReview().running&&__driftReview().pending>=300);
 const stopped=await page.evaluate(()=>__driftReview().game.tick);
 await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>__driftReview().game.tick),stopped,'Long outages still freeze solo simulation at the bound');
 release();await page.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending&&document.querySelector('#status').textContent.includes('Connection restored'));
 saved=await(await context.request.get(origin+'/games/nightshift/api/state')).json();
 assert.deepEqual(saved.game,await page.evaluate(()=>__driftReview().game),'Every queued input is confirmed exactly');await page.screenshot({path:out+'/saved-pause.png'});
 await page.getByRole('button',{name:'Resume race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);
 assert.equal(await page.evaluate(()=>__driftReview().game.race_id),initial);assert.ok(await page.evaluate(()=>__driftReview().game.tick)>=stopped);
 await page.keyboard.press('p');await page.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);
 const response=await context.request.post(origin+'/games/nightshift/api/replay',{headers:{Origin:origin},data:{}});
 assert.equal(response.status(),200);assert.equal((await response.json()).verified,true);assert.ok(batches.includes(120));assert.ok(batches.every(n=>n>0&&n<=120));assert.deepEqual(errors,[]);
 const report={version:'14.0.0',jitterTick,toleratesFourSecondSaveLatency:true,pausedAtTick:stopped,boundedPendingPause:true,nativeBatchLimitRespected:true,allInputsConfirmedExactly:true,sameRaceResumed:true,nativeReplayVerified:true,errors};
 writeFileSync(out+'/review.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{release?.();await logout?.();await browser.close();}
