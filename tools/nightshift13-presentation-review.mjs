import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {reviewSession} from './review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:18940',out=process.env.DRIFT_OUT||'artifacts/presentation-v13/browser';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),errors=[],checks={},layouts=[],cars=[];let logout;
try{
 const ctx=await browser.newContext({viewport:{width:1920,height:1080}});ctx.setDefaultTimeout(Number(process.env.DRIFT_TIMEOUT)||90000);if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(ctx,origin);
 const p=await ctx.newPage(),requests=[];p.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'||/GL_INVALID|shader error/i.test(m.text()))errors.push(m.text());});
 await p.goto(origin+'/games/nightshift/?review=1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__driftReview?.().loaded);await p.locator('utxo-loader').waitFor({state:'detached'});
 assert.equal(await p.evaluate(()=>__driftReview().engine.deferred),true);
 assert.equal(requests.filter(s=>/\.glb|\.hdr|\.pmrem|renderer\.bundle/.test(s)).length,0);checks.menuHasNoWebGLOrRaceAssets=true;
 for(let n=0;n<12;n++){
  await p.locator('[data-mode="'+n+'"]').click();await p.waitForFunction(n=>{const i=document.querySelector('#route-preview');return Number(i.dataset.route)===n&&i.complete&&i.naturalWidth>0;},n);
  assert.equal(await p.locator('.stage-card[aria-pressed="true"]').count(),1);
 }
 await p.locator('[data-mode="0"]').click();await p.screenshot({path:out+'/menu-desktop.png'});checks.twelveActualRoutePreviews=true;
 await p.getByRole('button',{name:'Garage and upgrades',exact:true}).click();await p.waitForFunction(()=>__driftReview().engine.ready&&!__driftReview().engine.worldReady);
 await p.waitForFunction(()=>__driftReview().engine.detailVehicles.includes(0));
 assert.equal(requests.some(s=>/foliage|world-terrain|combat-vfx|impact-sequence/.test(s)),false);checks.garageLoadsOnlyItsAssets=true;await p.waitForFunction(()=>{const images=[...document.querySelectorAll('.car-image')];return images.length===6&&images.every(i=>i.complete&&i.naturalWidth===512&&i.src.includes('/fleet-v131/car-'));});checks.actualFleetThumbnails=true;
 await p.getByRole('button',{name:'Vehicle showroom',exact:true}).click();
 for(let n=0;n<6;n++){
  await p.locator('[data-vehicle="'+n+'"]').click();await p.waitForFunction(n=>__driftReview().engine.detailVehicles.includes(n),n);await p.waitForTimeout(200);
  const state=await p.evaluate(n=>{const r=__driftReview();return{vehicle:n,bounds:r.environment.fleetBounds[n],contacts:r.environment.wheelContacts[n],pose:r.car};},n);
  writeFileSync(out+'/garage-'+n+'.json',JSON.stringify(state,null,2));await p.screenshot({path:out+'/garage-'+n+'.png'});assert.ok(state.bounds.size.every(Number.isFinite));assert.ok(state.bounds.size[0]>1.5&&state.bounds.size[0]<3);assert.ok(state.bounds.size[2]>3.4&&state.bounds.size[2]<5.5);assert.ok(state.contacts.length===4&&state.contacts.every(v=>Math.abs(v)<.005));cars.push(state);
  await p.screenshot({path:out+'/garage-'+n+'.png'});
 }
 checks.sixGroundedVehicles=true;
 await p.locator('[data-vehicle="0"]').click();await p.getByRole('button',{name:'Career events',exact:true}).click();await p.locator('[data-mode="0"]').click();await p.getByRole('button',{name:'Start selected race',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);
 const raceId=await p.evaluate(()=>__driftReview().game.race_id);
 for(const[width,height]of[[1920,1080],[2560,1080],[2560,1440],[3840,2160],[844,390]]){
  if(!(await p.evaluate(()=>__driftReview().running))){await p.getByRole('button',{name:'Resume race',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);}
  await p.setViewportSize({width,height});await p.keyboard.down('w');await p.waitForTimeout(650);await p.keyboard.up('w');
  const sample=await p.evaluate(()=>{const r=__driftReview(),a=r.project(2,0,0),inverse=r.pointer(a.x,a.y);return{running:r.running,raceId:r.game.race_id,buffer:r.buffer,inverse,tick:r.game.tick,distance:r.game.distance,overflow:document.documentElement.scrollWidth>innerWidth};});
  assert.equal(sample.running,true,'Each resized driving sample is active');assert.equal(sample.raceId,raceId,'Resizing and resuming preserve the race');
  assert.ok(sample.buffer.width*sample.buffer.height<=3686400);assert.ok(Math.abs(sample.inverse.x-1000)<.01&&Math.abs(sample.inverse.y-500)<.01);assert.equal(sample.overflow,false);layouts.push({width,height,...sample});
  await p.screenshot({path:out+'/race-'+width+'x'+height+'.png'});
  // Confirm this moving sample before the next one. A slow private preview
  // transport can otherwise reach the game's bounded pending-input pause.
  await p.keyboard.press('p');await p.waitForFunction(()=>!__driftReview().running&&!__driftReview().pending&&!__driftReview().sending);
 }
 assert.ok(layouts.at(-1).distance>layouts[0].distance);checks.movingResizeAndInverseInput=true;
 await p.getByRole('button',{name:'Resume race',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);
 assert.equal(await p.locator('.map-rival').count(),5);const follow=await p.locator('#minimap svg').getAttribute('viewBox');assert.notEqual(follow,'0 0 160 160');await p.locator('#minimap').click();assert.equal(await p.locator('#minimap svg').getAttribute('viewBox'),'0 0 160 160');await p.locator('#minimap').click();assert.notEqual(await p.locator('#minimap svg').getAttribute('viewBox'),'0 0 160 160');checks.minimapActorsAndOverview=true;
 await p.keyboard.press('p');await p.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);const tick=await p.evaluate(()=>__driftReview().game.tick);await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>__driftReview().game.tick),tick);checks.pausedReducedMotionPreservesRules=true;
 const touch=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});touch.setDefaultTimeout(Number(process.env.DRIFT_TIMEOUT)||90000);const mobile=await touch.newPage();mobile.on('pageerror',e=>errors.push(e.message));let exit;if(process.env.DRIFT_AUTH==='1')exit=await reviewSession(touch,origin);
 try{await mobile.goto(origin+'/games/nightshift/?review=1');await mobile.waitForFunction(()=>window.__driftReview?.().loaded);await mobile.locator('utxo-loader').waitFor({state:'detached'});await mobile.getByRole('button',{name:'Start selected race',exact:true}).click();await mobile.waitForFunction(()=>__driftReview().running);await mobile.keyboard.down('w');await mobile.waitForTimeout(200);await mobile.setViewportSize({width:390,height:844});await mobile.waitForFunction(()=>document.documentElement.dataset.orientationBlocked==='true'&&!__driftReview().running);const paused=await mobile.evaluate(()=>__driftReview().game.tick);await mobile.waitForTimeout(250);assert.equal(await mobile.evaluate(()=>__driftReview().game.tick),paused);await mobile.screenshot({path:out+'/portrait-gate.png'});checks.touchPortraitPausesAndClears=true;}finally{await exit?.();await touch.close();}
 assert.deepEqual(errors,[]);const report={version:JSON.parse(readFileSync('package.json')).version,checks,layouts,cars,errors,physicalDevices:false};writeFileSync(out+'/review.json',JSON.stringify(report,null,2)+'\n');console.log({checks,layouts:layouts.length,cars:cars.length,errors});
}catch(error){const p=browser.contexts()[0]?.pages()[0];if(p){const diagnostic=await p.evaluate(()=>({status:document.querySelector('#status')?.textContent,review:globalThis.__driftReview?.()})).catch(()=>null);writeFileSync(out+'/failure.json',JSON.stringify({message:error.message,diagnostic,errors},null,2));await p.screenshot({path:out+'/failure.png'}).catch(()=>{});}throw error;}finally{await logout?.();await browser.close();}
