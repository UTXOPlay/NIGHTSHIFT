import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {reviewSession} from './review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:19430',out=process.env.DRIFT_OUT||'artifacts/nerveshift-brand/local-review',base='/games/nerveshift/';mkdirSync(out,{recursive:true});
const proxy=process.env.DRIFT_PROXY||(!origin.startsWith('http://127.0.0.1')&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY));
const browser=await chromium.launch({...(proxy?{proxy:{server:proxy}}:{}),args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),errors=[],layouts=[],checks={};let page,logout;
try{
 const ctx=await browser.newContext({viewport:{width:1920,height:1080},hasTouch:true});ctx.setDefaultTimeout(180000);
 if(process.env.DRIFT_AUTH==='1'){
  logout=await reviewSession(ctx,origin);
  for(const old of ['/games/nightshift/','/games/drift-run/','/play/nightshift','/play/drift-run','/play/nerveshift']){const r=await ctx.request.get(origin+old+'?from=brand',{maxRedirects:0,headers:{Accept:'text/html'}});assert.equal(r.status(),308,old);assert.equal(r.headers().location,base+'?from=brand');}
  page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/');
  const card=page.locator('.game-card.drift-run').first();await card.waitFor();assert.match(await card.innerText(),/NerveShift/);await card.scrollIntoViewIfNeeded();
  await card.locator('img').first().waitFor();await page.waitForFunction(()=>[...document.images].some(i=>i.currentSrc.includes('nerveshift-keyart')&&i.complete&&i.naturalWidth>0));
  checks.storeCardAndResponsiveCover=true;await page.screenshot({path:out+'/store.png'});
  await card.getByRole('button',{name:/^Play (now|again) · NerveShift$/}).click();await page.waitForURL('**/games/nerveshift/');checks.storeLaunchUsesCanonicalPath=true;
 }else await ctx.request.post(origin+base+'api/guest',{headers:{Origin:origin},data:{}});
 const state=async path=>{const r=await ctx.request.get(origin+path+'api/state');assert.ok(r.ok());return r.json();};
 const before=await state('/games/nightshift/');assert.deepEqual(await state(base),before);checks.oldAndNewPathsShareExactState=true;
 if(!page){page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));}
 await page.goto(origin+base+'?review=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__driftReview?.().loaded);await page.locator('utxo-loader').waitFor({state:'detached'});
 assert.match(await page.title(),/^NerveShift/);assert.match(await page.locator('.wordmark').innerText(),/NERVESHIFT/);assert.doesNotMatch(await page.locator('body').innerText(),/NIGHT\s*SHIFT/i);assert.deepEqual(await page.evaluate(()=>__driftReview().game),before.game);checks.newMenuAndExactSavedGame=true;
 for(const[width,height]of[[1920,1080],[2560,1080],[2560,1440],[3840,2160],[844,390]]){
  await page.setViewportSize({width,height});const rect=await page.locator('#game').boundingBox();assert.ok(Math.abs(rect.width-width)<1&&Math.abs(rect.height-height)<1);
  const mark=await page.locator('.wordmark').boundingBox();assert.ok(mark.x>=0&&mark.y>=0&&mark.x+mark.width<=width);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);layouts.push({width,height,fullViewport:true,wordmarkVisible:true,overflow});await page.screenshot({path:out+'/menu-'+width+'x'+height+'.png'});
 }
 await page.setViewportSize({width:1920,height:1080});await page.getByRole('button',{name:/^(Start selected race|Resume race)$/,exact:true}).click();await page.waitForFunction(()=>__driftReview().running);
 await page.keyboard.down('w');await page.waitForTimeout(700);await page.keyboard.up('w');const motion=await page.evaluate(()=>{const r=__driftReview(),p=r.project(2,0,0);return{tick:r.game.tick,profile:r.session?.profile,buffer:r.buffer,inverse:r.pointer(p.x,p.y)};});assert.ok(motion.tick>before.game.tick);assert.ok(motion.buffer.width*motion.buffer.height<=3686400);assert.ok(Math.abs(motion.inverse.x-1000)<.01&&Math.abs(motion.inverse.y-500)<.01);
 await page.keyboard.press('p');await page.waitForFunction(()=>!__driftReview().running&&!__driftReview().pending&&!__driftReview().sending);const finish=await state(base);assert.deepEqual(finish.game,await page.evaluate(()=>__driftReview().game));assert.equal(finish.session.profile,before.session.profile);
 const replay=await ctx.request.post(origin+base+'api/replay',{headers:{Origin:origin},data:{}});assert.equal((await replay.json()).verified,true);checks.sameProfileAndSignedReplay=true;checks.inverseInputAndBoundedRendering=true;
 await page.getByRole('button',{name:'Controls and settings',exact:true}).click();await page.getByRole('tab',{name:'Records settings',exact:true}).click();const [career]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download signed career',exact:true}).click()]);assert.equal(career.suggestedFilename(),'nerveshift-v16-career.json');checks.brandedCareerExport=true;
 await page.setViewportSize({width:390,height:844});await page.getByRole('heading',{name:'Rotate to play',exact:true}).waitFor();assert.equal(await page.evaluate(()=>__driftReview().running),false);await page.screenshot({path:out+'/portrait.png'});checks.portraitGate=true;
 assert.deepEqual(errors,[]);const result={version:'16.0.2',origin,checks,layouts,errors,profile:finish.session.profile,physicalDevices:false};writeFileSync(out+'/review.json',JSON.stringify(result,null,2)+'\n');console.log(result);
}catch(error){if(page&&!page.isClosed()){writeFileSync(out+'/failure.json',JSON.stringify({error:String(error),url:page.url()},null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});}throw error;}
finally{await logout?.();await browser.close();}
