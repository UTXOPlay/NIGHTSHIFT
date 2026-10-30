import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {CLIENT_PROFILE} from '../games/arcade/web/nightshift14-profile.mjs';
import {step} from '../games/arcade/web/nightshift14-rules.mjs';
import {combatHud} from '../games/arcade/web/nightshift14-feedback.mjs';
import {tacticalReadout} from '../games/arcade/web/nightshift14-tactics.mjs';
import {driveInput} from '../tests/helpers/nightshift14-driver.mjs';
import {reviewSession} from './review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:18940',out=process.env.DRIFT_OUT||'artifacts/rivals-v14/tactics';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),ctx=await browser.newContext({viewport:{width:1920,height:1080}}),errors=[],checks=[];ctx.setDefaultTimeout(90000);let logout,page;
const reached=(kind,g)=>kind==='blocked'?combatHud(g).lineBlocked&&tacticalReadout(g)?.title==='LINE BLOCKED':kind==='staged'?tacticalReadout(g)?.title==='COURIER AT THE RELAY':kind==='launch'?g.events.some(e=>e.kind==='rival-launch'):combatHud(g).targets.some(r=>r.phase==='active');
try{
 if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(ctx,origin);
 await ctx.addInitScript(()=>{const pad={index:0,mapping:'standard',connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});window.__setTacticalControl=c=>{pad.axes[0]=c.steering/100;const values={7:c.throttle/100,6:c.brake/100,4:c.flags&4?1:0,1:c.flags&8?1:0,0:c.flags&16?1:0,2:c.flags&32?1:0,3:c.flags&64?1:0};for(let n=0;n<17;n++){pad.buttons[n].value=values[n]||0;pad.buttons[n].pressed=pad.buttons[n].value>.5;}};});
 page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||/GL_INVALID|shader error/i.test(m.text()))errors.push(m.text());});
 await page.route('**/__test_driver.mjs',r=>r.fulfill({contentType:'text/javascript',body:readFileSync('tests/helpers/nightshift14-driver.mjs','utf8').replaceAll('../../games/arcade/web/','./_arcade/')}));
 async function api(endpoint,data){const r=data===undefined?await ctx.request.get(origin+'/games/nightshift/api/'+endpoint):await ctx.request.post(origin+'/games/nightshift/api/'+endpoint,{headers:{Origin:origin},data:{client_profile:CLIENT_PROFILE,...data}});assert.equal(r.status(),200,(await r.text()).slice(0,250));return r.json();}
 const send=(s,action)=>api('action',{session_id:s.session.id,expected_block:s.session.block_hash,action});
 await page.goto(origin+'/games/nightshift/?review=1');await page.waitForFunction(()=>window.__driftReview?.().loaded);await page.locator('utxo-loader').waitFor({state:'detached'});
 for(const kind of ['blocked','staged','launch','active']){
  let state=await api('state'),prefix,triggerTick;
  for(let attempt=0;attempt<5&&!prefix;attempt++){
   state=await send(state,{type:'race',mode:3,vehicle:0,gadget:0,difficulty:0});const g=structuredClone(state.game),inputs=[];
   while(!g.over&&g.tick<7000){inputs.push(driveInput(g));step(g,inputs.at(-1));if(g.tick>100&&reached(kind,g)){prefix=inputs.slice(0,Math.max(1,inputs.length-12));triggerTick=g.tick;break;}}
  }
  assert.ok(prefix,kind+' must be reachable through ordinary inputs');for(let n=0;n<prefix.length;n+=120)state=await send(state,{type:'ticks',inputs:prefix.slice(n,n+120)});
  await page.reload();await page.waitForFunction(()=>__driftReview?.().loaded);await page.locator('utxo-loader').waitFor({state:'detached'});await page.getByRole('button',{name:'Resume race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);
  await page.evaluate(async kind=>{const{driveInput}=await import('./__test_driver.mjs'),{readInput}=await import('./_arcade/nightshift12-input.mjs'),{combatHud}=await import('./_arcade/nightshift14-feedback.mjs'),{tacticalReadout}=await import('./_arcade/nightshift14-tactics.mjs');window.__tacticalRead=()=>({hud:combatHud(__driftReview().game),read:tacticalReadout(__driftReview().game)});window.__tacticalDriver=setInterval(()=>{const r=__driftReview();if(r.running)__setTacticalControl(readInput(driveInput(r.game)));},1000/30);},kind);
  await page.waitForFunction(kind=>{const r=__driftReview(),{hud,read}=__tacticalRead();return kind==='blocked'?hud.lineBlocked&&document.querySelector('#target').dataset.phase==='blocked'&&document.querySelector('#target span').textContent==='LINE BLOCKED':kind==='staged'?read?.title==='COURIER AT THE RELAY'&&document.querySelector('#race-engineer')?.textContent.includes('COURIER AT THE RELAY'):kind==='launch'?r.game.events.some(e=>e.kind==='rival-launch')&&r.feedback.active>0:hud.targets.some(t=>t.phase==='active')&&document.querySelectorAll('.map-rival.contract').length>0;},kind,{timeout:12000});
  const sample=await page.evaluate(()=>({review:__driftReview(),tactics:__tacticalRead(),target:document.querySelector('#target')?.textContent,place:document.querySelector('#place')?.getAttribute('aria-label')}));await page.screenshot({path:out+'/'+kind+'.png'});
  if(kind==='blocked'){assert.equal(sample.tactics.hud.weaponReady,false);assert.ok(sample.tactics.hud.targetHud.blocked);}
  if(kind==='staged'){assert.match(sample.tactics.read.detail,/cargo cruise limit/);assert.ok(sample.review.game.rivals.some(r=>r.staged));}
  assert.match(sample.place,/bounties secured/);await page.evaluate(()=>{clearInterval(__tacticalDriver);__setTacticalControl({flags:0,steering:0,brake:0,throttle:0});});if(await page.evaluate(()=>__driftReview().running))await page.keyboard.press('p');await page.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);const saved=await api('state');assert.deepEqual(saved.game,await page.evaluate(()=>__driftReview().game));assert.equal((await api('replay',{})).verified,true);checks.push({kind,triggerTick,renderedTick:sample.review.game.tick,readout:sample.tactics.read,target:sample.tactics.hud.targetHud,signedReplay:true});console.log(kind+' passed');
 }
 assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({version:14,profile:CLIENT_PROFILE,checks,errors,input:'Ordinary signed V14 pedal inputs and virtual standard Gamepad API; no game-state injection',physicalDevices:false},null,2)+'\n');
}catch(error){if(page){writeFileSync(out+'/failure.json',JSON.stringify({error:String(error),review:await page.evaluate(()=>window.__driftReview?.()).catch(()=>null)},null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});}throw error;}
finally{await logout?.();await browser.close();}
