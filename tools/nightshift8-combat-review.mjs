import {installDriverRoute} from './browser-driver.mjs';
import assert from'node:assert/strict';import{chromium}from'playwright';import{mkdirSync,writeFileSync,renameSync}from'node:fs';import{step,EVENTS}from'../games/arcade/web/nightshift8-rules.mjs';import{driveInput}from'../tests/helpers/nightshift8-driver.mjs';import{reviewSession}from'./review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:8899',out=process.env.DRIFT_OUT||'artifacts/nightshift-v8/combat-review';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),ctx=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});let logout,page;
const checks=[],errors=[];
function control(g,kind){
 if(kind==='collision'||kind==='wreck'){const d=1000-g.drift_x-g.steer_v*2;return d>50?2:d< -50?1:0;}
 let bits=driveInput(g,{})&~64;
 if(kind==='hit'||kind==='guard'){bits&=~112;const threat=g.rivals.find(r=>r.attack_target===-1&&r.windup>0&&Math.abs(r.distance-g.distance)<1000);if(threat){const d=threat.attack_x-g.drift_x-g.steer_v*2;bits=(d>40?2:d< -40?1:0);if(kind==='guard'&&threat.windup<12&&!g.counter_cd&&g.counter)bits|=64;}}
 return bits;
}
const detect=(kind,a,b)=>kind==='collision'?a.shield<b.shield:kind==='wreck'?a.over&&a.finish_reason===2:kind==='hit'||kind==='guard'?a.stun>b.stun:kind==='rival-hit'?a.attack_hits>b.attack_hits&&a.rivals.some((r,n)=>r.hp<b.rivals[n].hp):a.takedowns>b.takedowns;
try{
 if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(ctx,origin);
 page=await ctx.newPage();await installDriverRoute(page);page.setDefaultNavigationTimeout(60000);page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 const loadStarted=Date.now();await page.goto(origin+'/games/drift-run/?review=1');await page.waitForFunction(()=>__driftReview?.().loaded);const initialLoadMs=Date.now()-loadStarted;
 async function api(path,body){const r=body?await ctx.request.post(origin+'/games/drift-run/api/'+path,{headers:{Origin:origin},data:body}):await ctx.request.get(origin+'/games/drift-run/api/'+path);assert.ok(r.ok(),await r.text());return r.json();}
 async function send(state,action){return api('action',{session_id:state.session.id,expected_block:state.session.block_hash,action});}
 for(const kind of ['collision','hit','guard','rival-hit','disable','wreck']){
  if(await page.evaluate(()=>__driftReview().running))await page.keyboard.press('KeyP');
  await page.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);
  let state=await api('state'),tape,chosen;
  for(let attempt=0;attempt<8;attempt++){
   state=await send(state,{type:'race',mode:kind==='rival-hit'||kind==='disable'?3:0,vehicle:0,gadget:0,difficulty:0});
   const g=structuredClone(state.game),inputs=[];let found=false;
   while(!g.over&&g.tick<10000){const before=structuredClone(g),i=control(g,kind==='guard'?'hit':kind);inputs.push(i);step(g,i);if(detect(kind,g,before)){found=true;break;}}
   if(found){tape=inputs.slice(0,Math.max(0,inputs.length-18));chosen=g.tick;break;}
  }
  assert.ok(tape,kind+' event is reachable through ordinary inputs');
  for(let n=0;n<tape.length;n+=120)state=await send(state,{type:'ticks',inputs:tape.slice(n,n+120)});
  await page.reload();await page.waitForFunction(()=>__driftReview?.().loaded);await page.getByRole('button',{name:'Resume race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);
  await page.evaluate(async({kind,source,events})=>{const rules=await import('./_arcade/nightshift8-rules.mjs');
   const {driveInput}=await import('./__test_driver.mjs');
   const drive=(g)=>{if(kind==='collision'||kind==='wreck'){const d=1000-g.drift_x-g.steer_v*2;return d>50?2:d< -50?1:0;}let bits=driveInput(g,{})&~64;if(kind==='hit'||kind==='guard'){bits&=~112;const threat=g.rivals.find(r=>r.attack_target===-1&&r.windup>0&&Math.abs(r.distance-g.distance)<1000);if(threat){const d=threat.attack_x-g.drift_x-g.steer_v*2;bits=d>40?2:d< -40?1:0;if(kind==='guard'&&threat.windup<12&&!g.counter_cd&&g.counter)bits|=64;}}return bits;};
   let prior=0;window.__combatKeys=()=>{const r=__driftReview();if(!r.running)return;const bits=drive(r.game);for(const [code,bit]of[['ArrowLeft',1],['ArrowRight',2],['KeyS',8],['Space',16],['KeyE',32],['KeyQ',64]])if(!!(bits&bit)!==!!(prior&bit))window.dispatchEvent(new KeyboardEvent(bits&bit?'keydown':'keyup',{code,bubbles:true,cancelable:true}));prior=bits;};window.__combatKeys();window.__combatDriver=setInterval(window.__combatKeys,1000/30);
  },{kind,source:driveInput.toString(),events:EVENTS});
  await page.waitForFunction(kind=>{const r=__driftReview(),f=r.feedback;return kind==='wreck'?r.ending&&f.wreckAge<1:kind==='guard'?r.game.counter_ticks>0&&f.guardAge<1:kind==='hit'||kind==='collision'?f.hitAge<.8:kind==='disable'?f.rivalAges.some(a=>a<.8):f.active>0&&r.game.attack_hits>0;},kind,{timeout:15000});
  const first=await page.evaluate(()=>__driftReview());await page.screenshot({path:out+'/'+kind+'-impact.png'});
  if(kind==='wreck'){
   const tick=first.game.tick;await page.waitForTimeout(300);const middle=await page.evaluate(()=>__driftReview());assert.equal(middle.game.tick,tick);assert.ok(Math.abs(middle.car.rotation[2])>.5);assert.ok(middle.car.position[1]>.2);await page.screenshot({path:out+'/wreck-roll.png'});await page.waitForFunction(()=>__driftReview().view==='result'&&!__driftReview().ending);const end=await page.evaluate(()=>__driftReview());assert.equal(end.game.tick,tick);assert.ok(Math.abs(end.car.rotation[2])>8);assert.equal(end.game.finish_reason,2);await page.screenshot({path:out+'/wreck-result.png'});
  }else if(kind==='guard'){
   const dodges=first.game.dodges;await page.waitForFunction(n=>__driftReview().game.dodges>n,dodges,{timeout:3000});await page.screenshot({path:out+'/guard-success.png'});assert.equal(await page.evaluate(()=>__driftReview().game.stun),0);
  }else await page.waitForTimeout(300);
  await page.evaluate(()=>clearInterval(window.__combatDriver));if(await page.evaluate(()=>__driftReview().running))await page.keyboard.press('KeyP');await page.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);assert.ok((await api('replay',{})).verified);checks.push({kind,triggerTick:chosen,activeSprites:first.feedback.visible,signedReplay:true});console.log(kind+' passed');
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Choose event',exact:true}).click();await page.getByRole('button',{name:'Start selected race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);await page.keyboard.press('KeyQ');await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>__driftReview().feedback.visible),0);await page.keyboard.press('KeyP');checks.push({kind:'reduced-motion',transientSprites:0});
 assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({checks,errors,initialLoadMs},null,2));const video=page.video();await page.close();renameSync(await video.path(),out+'/combat-review.webm');
}finally{if(logout)await logout();await browser.close();}
