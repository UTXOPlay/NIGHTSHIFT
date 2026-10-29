import {installReviewProfile} from './client-profile.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {reviewSession} from './review-session.mjs';
import {installDriverRoute} from './browser-driver9.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:18923',out=process.env.DRIFT_OUT||'artifacts/feel-v1001/play',profile=JSON.parse(readFileSync('docs/release-integrity.json')).profile;
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),ctx=await browser.newContext({viewport:{width:1920,height:1080}}),errors=[],samples=[],sizes=[];
let logout;
try{
 installReviewProfile(ctx);logout=await reviewSession(ctx,origin);const page=await ctx.newPage();await installDriverRoute(page);page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/games/nightshift/?review=1');await page.waitForFunction(()=>globalThis.__driftReview?.().loaded);
 if(await page.getByRole('button',{name:'Career events',exact:true}).isVisible())await page.getByRole('button',{name:'Career events',exact:true}).click();
 await page.locator('.stage-card').nth(0).click();await page.getByRole('button',{name:'Start selected race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);
 await page.evaluate(async()=>{
  const{driveInput}=await import('./__test_driver.mjs');const state={};let prior=0;
  globalThis.cameraDriver=setInterval(()=>{const r=__driftReview();if(!r.running)return;const bits=driveInput(r.game,state);for(const[code,bit]of[['ArrowLeft',1],['ArrowRight',2],['ArrowDown',8],['Space',16],['KeyE',32],['KeyQ',64]])if(Boolean(bits&bit)!==Boolean(prior&bit))window.dispatchEvent(new KeyboardEvent(bits&bit?'keydown':'keyup',{code,key:code,bubbles:true,cancelable:true}));prior=bits;},1000/30);
 });
 const start=Date.now();
 while(Date.now()-start<16000){
  const sample=await page.evaluate(()=>{const r=__driftReview(),p=r.project((r.game.drift_x/1000-1)*4,.65,0);return{tick:r.game.tick,running:r.running,over:r.game.over,car:{x:p.x/innerWidth,y:p.y/innerHeight},buffer:r.buffer,audio:r.audio};});
  if(!sample.running||sample.over){writeFileSync(out+'/failure.json',JSON.stringify(await page.evaluate(()=>__driftReview()),null,2));} assert.equal(sample.running,true);assert.equal(sample.over,false);assert.ok(sample.car.x>.05&&sample.car.x<.95);assert.ok(sample.car.y>.45&&sample.car.y<.9);samples.push(sample);await page.waitForTimeout(250);
 }
 await page.evaluate(()=>clearInterval(globalThis.cameraDriver));for(const key of ['ArrowLeft','ArrowRight','ArrowDown','Space','KeyE','KeyQ'])await page.keyboard.up(key);
 await page.keyboard.press('KeyP');await page.waitForFunction(()=>!__driftReview().running&&!__driftReview().pending&&!__driftReview().sending);
 assert.ok(samples.at(-1).tick>samples[0].tick+150);assert.ok(samples.some(s=>s.audio?.recordings===3&&s.audio.state==='running'&&s.audio.levels.engine>.01),'real driving has decoded engine output');assert.ok(samples.some(s=>s.audio?.mix.boost===1),'normal driver activates a real boost');await page.waitForFunction(()=>Object.values(__driftReview().audio.levels).every(v=>v<.0001));console.log('Normal keyboard driving keeps the car framed through live motion');
 const paused=await page.evaluate(()=>JSON.stringify(__driftReview().game));
 for(const[width,height]of[[1920,1080],[2560,1080],[2560,1440],[3840,2160],[844,390],[390,844]]){
  await page.setViewportSize({width,height});await page.waitForFunction(()=>document.querySelector('#game > canvas').width>0);await page.waitForTimeout(150);
  const state=await page.evaluate(()=>{const r=__driftReview(),p=r.project(2,0,0),input=r.pointer(p.x,p.y),c=document.querySelector('#game > canvas').getBoundingClientRect();return{width:c.width,height:c.height,input,buffer:r.buffer,game:JSON.stringify(r.game)};});
  assert.equal(state.width,width);assert.equal(state.height,height);assert.ok(state.buffer.width*state.buffer.height<=3686400+10);assert.ok(Math.abs(state.input.x-1000)<.01);assert.ok(Math.abs(state.input.y-500)<.01);assert.equal(state.game,paused);delete state.game;sizes.push(state);
 }
 await page.setViewportSize({width:1920,height:1080});await page.screenshot({path:out+'/desktop.png'});
 const response=await ctx.request.post(origin+'/games/nightshift/api/replay',{headers:{Origin:origin},data:{}});assert.ok(response.ok());const replay=await response.json();assert.equal(replay.verified,true);
 const stored=await(await ctx.request.get(origin+'/games/nightshift/api/state')).json();assert.equal(stored.session.profile,profile);
 await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Resume race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);await page.waitForTimeout(500);await page.keyboard.press('KeyP');await page.waitForFunction(()=>!__driftReview().running&&!__driftReview().pending&&!__driftReview().sending);
 assert.deepEqual(errors,[]);await page.screenshot({path:out+'/reduced-motion.png'});
 const login=await ctx.storageState();await page.close();
 const touch=await browser.newContext({storageState:login,viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:3}),phone=await touch.newPage();phone.setDefaultTimeout(90000);phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto(origin+'/games/nightshift/?review=1');await phone.waitForFunction(()=>globalThis.__driftReview?.().loaded&&document.documentElement.dataset.orientationBlocked==='true');await phone.screenshot({path:out+'/portrait-gate.png'});
 await phone.setViewportSize({width:844,height:390});await phone.waitForFunction(()=>document.documentElement.dataset.orientationBlocked==='false');await phone.getByRole('button',{name:'Resume race',exact:true}).click();await phone.waitForFunction(()=>__driftReview().running);await phone.waitForTimeout(400);
 const mobile=await phone.evaluate(()=>{const r=__driftReview(),p=r.project(2,0,0);return{input:r.pointer(p.x,p.y),buffer:r.buffer};});assert.ok(Math.abs(mobile.input.x-1000)<.01);assert.ok(Math.abs(mobile.input.y-500)<.01);assert.ok(mobile.buffer.width*mobile.buffer.height<=3686400+10);await phone.screenshot({path:out+'/touch-landscape.png'});
 await phone.keyboard.down('ArrowRight');await phone.setViewportSize({width:390,height:844});await phone.waitForFunction(()=>document.documentElement.dataset.orientationBlocked==='true'&&!__driftReview().running);const frozen=await phone.evaluate(()=>__driftReview().game.tick);await phone.waitForTimeout(350);assert.equal(await phone.evaluate(()=>__driftReview().game.tick),frozen);await phone.keyboard.up('ArrowRight');await phone.close();await touch.close();
 assert.deepEqual(errors,[]);
 writeFileSync(out+'/review.json',JSON.stringify({scope:'Ordinary keyboard driving, paused resize/input mapping, touch-emulated rotation and unchanged native signed replay; no physical-phone benchmark',profile,replay,samples,sizes,mobile,rotationPaused:true,errors},null,2));
 console.log({profile,driveSamples:samples.length,sizes:sizes.length,verifiedReplay:replay.verified,errors});
}finally{if(logout)await logout().catch(()=>{});await browser.close();}
