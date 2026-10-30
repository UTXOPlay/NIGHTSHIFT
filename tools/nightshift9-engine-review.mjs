import {installReviewProfile} from './client-profile.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {reviewSession} from './review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:8899',out=process.env.DRIFT_OUT||'artifacts/engine-v92/runtime';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({proxy:process.env.DRIFT_PROXY?{server:process.env.DRIFT_PROXY}:undefined,args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const ctx=await browser.newContext({viewport:{width:1920,height:1080}}),errors=[],checks=[];ctx.setDefaultTimeout(Number(process.env.DRIFT_LOAD_TIMEOUT||90000));ctx.setDefaultNavigationTimeout(Number(process.env.DRIFT_LOAD_TIMEOUT||90000));let logout;
try{
 installReviewProfile(ctx);if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(ctx,origin);
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(origin+'/games/nightshift/?review=1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>__driftReview?.().loaded);
 const loaded=await p.evaluate(()=>__driftReview().engine);assert.equal(loaded.errors,0);assert.ok(loaded.preparedModes.includes(0));checks.push('Assets and initial shader variants finish before loading completes');
 assert.equal(await p.locator('#drive-keys,#weapon-status,.ability-caption').count(),0);
 await p.getByRole('button',{name:'Controls and settings',exact:true}).click();assert.equal(await p.getByRole('button',{name:'Verify signed career replay',exact:true}).count(),1);await p.getByRole('button',{name:'Close keyboard settings',exact:true}).click();
 await p.locator('.stage-card').nth(3).click();await p.getByRole('button',{name:'Start selected race',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);assert.ok((await p.evaluate(()=>__driftReview().engine.preparedModes)).includes(3));
 const writes=await p.evaluate(()=>new Promise(resolve=>{const rows=[],end=performance.now()+3500;function sample(){rows.push(__driftReview().engine.matrixWrites);if(performance.now()<end)requestAnimationFrame(sample);else resolve(rows);}requestAnimationFrame(sample);}));
 const untouched=writes.filter(n=>n===0).length/writes.length;assert.ok(untouched>.45,'Stationary scenery should skip uploads on most frames');checks.push('Street buffers skip uploads between chunk boundaries');
 await p.keyboard.press('KeyP');await p.waitForFunction(()=>!__driftReview().running&&!__driftReview().sending);
 await p.screenshot({path:out+'/clean-hud.png'});checks.push('Single settings entry with contextual keyboard hints');
 await p.evaluate(()=>{window.__lostExtension=document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');if(!__lostExtension)throw Error('Context-loss test extension unavailable');__lostExtension.loseContext();});
 await p.waitForFunction(()=>!__driftReview().running&&!__driftReview().sending);await p.waitForTimeout(300);
 const before=await(await ctx.request.get(origin+'/games/nightshift/api/state')).json();
 await p.evaluate(()=>__lostExtension.restoreContext());await p.waitForEvent('domcontentloaded');await p.waitForFunction(()=>__driftReview?.().loaded);
 const after=await(await ctx.request.get(origin+'/games/nightshift/api/state')).json();assert.deepEqual(after,before);assert.equal(await p.evaluate(()=>__driftReview().running),false);checks.push('WebGL context recovery reloads the identical signed career without resuming held input');
 assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({checks,unchangedStreetFrameFraction:untouched,loaded,restored:await p.evaluate(()=>__driftReview().engine),errors},null,2));console.log({checks,unchangedStreetFrameFraction:untouched,errors});
}finally{if(logout)await logout();await browser.close();}
