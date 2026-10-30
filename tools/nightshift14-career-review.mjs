import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {CLIENT_PROFILE} from '../games/arcade/web/nightshift14-profile.mjs';
import {createGame,applyAction,step} from '../games/arcade/web/nightshift14-rules.mjs';
import {driveInput} from '../tests/helpers/nightshift14-driver.mjs';
import {reviewSession} from './review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:18940';
const out=process.env.DRIFT_OUT||'artifacts/rivals-v14/career';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const errors=[],layouts=[],checks={};let logout;
try {
 const ctx=await browser.newContext({viewport:{width:1920,height:1080}});ctx.setDefaultTimeout(120000);
 if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(ctx,origin);
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 await p.goto(origin+'/games/nightshift/?review=1');await p.waitForFunction(()=>window.__driftReview?.().loaded);await p.locator('utxo-loader').waitFor({state:'detached'});
 assert.equal(await p.evaluate(()=>__driftReview().game.physics_version),14);
 async function shot(name){await p.waitForTimeout(700);await p.screenshot({path:out+'/'+name+'.png'});}
 // A disabled primary action still permits previews of the real background and route.
 await p.locator('[data-mode="4"]').click();assert.equal(await p.getByRole('button',{name:'Start selected race',exact:true}).isDisabled(),true);assert.ok(await p.locator('#description').innerText().then(s=>s.includes('previous chapter')));checks.lockedPreview=true;
 await p.locator('[data-mode="0"]').click();
 for(const [width,height]of[[1920,1080],[2560,1080],[2560,1440],[3840,2160],[844,390]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(250);
  for(const selector of ['#menu-actions .primary','#cards [data-mode="0"]','#nav button:visible']){
   const el=p.locator(selector).first();await el.scrollIntoViewIfNeeded();const box=await el.boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,selector+' remains reachable at '+width+'x'+height);
  }
  const chapters=await p.locator('.chapter-choice').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('span>*')].filter(x=>getComputedStyle(x).display!=='none').every(x=>{const b=x.getBoundingClientRect();return b.x>=r.x-1&&b.right<=r.right+1&&b.y>=r.y-1&&b.bottom<=r.bottom+1;});}));assert.ok(chapters.length===3&&chapters.every(Boolean),'Chapter captions fit their controls');const r=await p.evaluate(()=>__driftReview());assert.ok(r.buffer.width*r.buffer.height<=3686400);layouts.push({width,height,buffer:r.buffer});await shot('career-'+width+'x'+height);
 }
 await p.setViewportSize({width:1920,height:1080});
 // Real signed career frames, not an injected save or a writable browser review hook.
 let state=await (await ctx.request.get(origin+'/games/nightshift/api/state')).json(),g=createGame();assert.deepEqual(state.game,g);
 async function act(action){
  applyAction(g,action);let response;
  for(let attempt=0;attempt<20;attempt++){
   if(origin.startsWith('https:'))await new Promise(r=>setTimeout(r,900));
   response=await ctx.request.post(origin+'/games/nightshift/api/action',{headers:{Origin:origin},data:{client_profile:CLIENT_PROFILE,session_id:state.session.id,expected_block:state.session.block_hash,action}});
   if(response.status()!==429)break;
   const retry=Number(response.headers()['retry-after']);await new Promise(r=>setTimeout(r,Math.max(2000,(Number.isFinite(retry)?retry:5)*1000)));
  }
  assert.equal(response.status(),200,(await response.text()).slice(0,250));state=await response.json();assert.deepEqual(state.game,g);
 }
 for(const mode of[0,2,3]){let won=false;for(let attempt=0;attempt<12&&!won;attempt++){await act({type:'race',mode,vehicle:0,gadget:mode===3?0:1,difficulty:0});const bot={};while(!g.over){const prediction=structuredClone(g),inputs=[];for(let n=0;n<120&&!prediction.over;n++){const input=driveInput(prediction,bot);inputs.push(input);step(prediction,input);}await act({type:'ticks',inputs});}won=!!g.won;}assert.ok(won);}
 assert.equal(g.career.unlocked,3);await p.reload();await p.waitForFunction(()=>__driftReview?.().loaded);await p.locator('utxo-loader').waitFor({state:'detached'});
 assert.ok((await p.locator('#result .payout').innerText()).includes('Chapter completion'));checks.chapterReceipt=true;await shot('chapter-result');
 await p.getByRole('button',{name:'Choose event',exact:true}).click();await p.locator('[data-mode="4"]').click();assert.equal(await p.getByRole('button',{name:'Start selected race',exact:true}).isEnabled(),true);checks.nativeChapterUnlock=true;
 await p.getByRole('button',{name:'Garage and upgrades',exact:true}).click();await p.getByRole('button',{name:'Performance tuning',exact:true}).click();
 await p.getByRole('button',{name:/^Upgrade POWER:/}).click();await p.waitForFunction(()=>__driftReview().game.career.upgrades[0][0]===1);const before=await p.evaluate(()=>__driftReview().game.career.credits);
 const slider=p.getByRole('slider',{name:'Active POWER tiers'});await slider.fill('0');await slider.dispatchEvent('change');await p.waitForFunction(()=>__driftReview().game.career.tunes[0][0]===0);assert.equal(await p.evaluate(()=>__driftReview().game.career.credits),before);checks.freeAllocation=true;
 for(const [width,height]of[[1920,1080],[844,390]]){await p.setViewportSize({width,height});await slider.scrollIntoViewIfNeeded();assert.ok(await slider.isVisible());await shot('tuning-'+width+'x'+height);}
 await p.setViewportSize({width:1920,height:1080});await p.getByRole('button',{name:'Vehicle showroom',exact:true}).click();await p.locator('[data-vehicle="1"]').click();await p.getByRole('button',{name:/^Buy KITE for/}).click();await p.waitForFunction(()=>Boolean(__driftReview().game.career.owned&2));checks.uiPurchase=true;
 const replay=await ctx.request.post(origin+'/games/nightshift/api/replay',{headers:{Origin:origin},data:{client_profile:CLIENT_PROFILE}});assert.equal((await replay.json()).verified,true);checks.signedReplay=true;
 // Input mapping must be the inverse of the actual render transform after a resize.
 await p.getByRole('button',{name:'Career events',exact:true}).click();await p.locator('[data-mode="0"]').click();await p.getByRole('button',{name:'Start selected race',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);await p.keyboard.down('w');await p.keyboard.down('d');await p.waitForTimeout(350);await p.keyboard.up('d');await p.keyboard.up('w');assert.ok(await p.evaluate(()=>__driftReview().game.drift_x>1000));await p.keyboard.press('p');await p.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);checks.ordinaryPedalsAfterResize=true;
 const touch=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const touchLogout=process.env.DRIFT_AUTH==='1'?await reviewSession(touch,origin):null;const mobile=await touch.newPage();mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(origin+'/games/nightshift/?review=1');await mobile.waitForFunction(()=>window.__driftReview?.().loaded);await mobile.locator('utxo-loader').waitFor({state:'detached'});await mobile.waitForTimeout(700);await mobile.screenshot({path:out+'/touch-career.png'});await mobile.setViewportSize({width:390,height:844});await mobile.waitForFunction(()=>document.documentElement.dataset.orientationBlocked==='true');assert.equal(await mobile.evaluate(()=>__driftReview().running),false);checks.portraitGate=true;await mobile.screenshot({path:out+'/portrait-gate.png'});await touchLogout?.();await touch.close();
 assert.deepEqual(errors,[]);const report={version:JSON.parse(readFileSync('package.json')).version,profile:CLIENT_PROFILE,layouts,checks,errors,physicalDevices:false};writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.log(report);
} finally {await logout?.();await browser.close();}
