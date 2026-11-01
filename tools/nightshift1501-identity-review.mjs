import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {reviewSession} from './review-session.mjs';
import {createGame,applyAction,step} from '../games/arcade/web/nightshift15-rules.mjs';
import {driveInput} from '../tests/helpers/nightshift14-driver.mjs';

const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:19426',out=process.env.DRIFT_OUT||'artifacts/vehicle-identity/browser';mkdirSync(out,{recursive:true});
const profile=JSON.parse(readFileSync('docs/release-integrity.json')).profile;
const spec={type:'race',mode:0,vehicle:0,gadget:0,difficulty:0,spec:1},reference=createGame();applyAction(reference,spec);
const initial=structuredClone(reference),inputs=[],driver={};
while(!reference.over){const input=driveInput(reference,driver);inputs.push(input);step(reference,input);}
assert.ok(reference.won,'The reference must be a completed stock event');
const native=spawnSync('target/release/myelin-nightshift-v15',['simulate'],{input:JSON.stringify({kind:'drift-run',actions:[spec],inputs}),encoding:'utf8',maxBuffer:8*1024*1024});assert.equal(native.status,0,native.stderr);assert.deepEqual(JSON.parse(native.stdout),reference);
const best={profile,initial,session:'isolated-verified-reference-fixture',inputs};
const proxy=process.env.DRIFT_PROXY||(!origin.startsWith('http://127.0.0.1')&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY));
const browser=await chromium.launch({...(proxy?{proxy:{server:proxy}}:{}),args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const checks={},errors=[],samples=[];let page;
function actors(r){
 assert.equal(r.engine.vehicleMotion.pursuer,null,'No unsigned player-tethered pursuer');
 for(const [n,car]of r.engine.vehicleMotion.rivals.entries()){assert.equal(car.actorId,r.game.rivals[n].id);assert.equal(car.role,'rival');}
 const visible=r.engine.vehicleMotion.traffic.filter(c=>c.visible);
 assert.equal(new Set(visible.map(c=>c.actorId)).size,visible.length,'No duplicate traffic body');
 for(const car of visible){assert.equal(car.role,'traffic');assert.ok(r.game.bodies.some(b=>b.id===car.actorId&&[1,9].includes(b.tag)));}
 if(!r.game.spec)assert.equal(r.engine.vehicleMotion.ghost.visible,false,'Personal ghost is exclusive to stock time attack');
 return{tick:r.game.tick,heat:r.game.pursuit,distance:r.game.distance,speed:r.game.speed,rivals:r.engine.vehicleMotion.rivals.filter(c=>c.visible).length,traffic:visible.length,pursuer:r.engine.vehicleMotion.pursuer,ghost:r.engine.vehicleMotion.ghost.visible};
}
async function open(context){
 context.setDefaultTimeout(180000);if(process.env.DRIFT_AUTH==='1')await reviewSession(context,origin);
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/games/nightshift/?review=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__driftReview?.().loaded);await page.locator('utxo-loader').waitFor({state:'detached'});return page;
}
async function replay(p){await p.keyboard.press('p');await p.waitForFunction(()=>!__driftReview().running&&!__driftReview().pending&&!__driftReview().sending);const response=await p.context().request.post(origin+'/games/nightshift/api/replay',{headers:{Origin:origin},data:{}});assert.equal((await response.json()).verified,true);}
try{
 const context=await browser.newContext({viewport:{width:1920,height:1080}});
 try{
  const p=await open(context);await p.locator('[data-mode="1"]').click();await p.getByRole('button',{name:'Start selected race',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);
  samples.push(actors(await p.evaluate(()=>__driftReview())));await p.keyboard.down('w');await p.waitForFunction(()=>__driftReview().game.distance>1400);await p.keyboard.up('w');await p.keyboard.down('s');await p.keyboard.down('x');await p.waitForFunction(()=>__driftReview().game.speed===0);
  await p.waitForFunction(()=>__driftReview().game.pursuit>400&&!__driftReview().game.over);samples.push(actors(await p.evaluate(()=>__driftReview())));await p.screenshot({path:out+'/heat-without-phantom.png'});
  await p.waitForTimeout(1000);samples.push(actors(await p.evaluate(()=>__driftReview())));await p.keyboard.up('s');await p.keyboard.up('x');await replay(p);checks.highHeatHasOnlyAuthoritativeCars=true;checks.normalRaceHasNoPersonalGhost=true;checks.pursuitSignedReplay=true;
 }finally{await context.close();}
 const mobileContext=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 await mobileContext.addInitScript(({key,best})=>localStorage.setItem(key,JSON.stringify(best)),{key:'nightshift:ghost:'+profile+':best',best});
 try{
  const p=await open(mobileContext);await p.getByRole('button',{name:'Spec time attack',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);await p.waitForFunction(()=>__driftReview().game.tick>=30);
  const r=await p.evaluate(()=>__driftReview());assert.equal(r.game.spec,1);assert.equal(r.ghost.available,true);assert.equal(r.engine.vehicleMotion.ghost.visible,true);assert.equal(r.engine.vehicleMotion.ghost.role,'personal-best-ghost');assert.ok(r.engine.vehicleMotion.rivals.every(c=>!c.visible));assert.match(await p.locator('#objective').textContent(),/PB GHOST/);samples.push(actors(r));await p.screenshot({path:out+'/time-attack-pb-ghost.png'});await replay(p);checks.verifiedReferenceReplaysIndependently=true;checks.personalGhostLabelAndSoloVisibility=true;checks.specSignedReplay=true;
 }finally{await mobileContext.close();}
 assert.deepEqual(errors,[]);const report={version:'15.0.1',origin,profile,checks,samples,reference:{ticks:reference.tick,nativeBrowserExact:true,fixture:'Completed stock-event input tape, independently simulated by the native executor. Only the device-local reference is seeded; live player states are never injected.'},errors,physicalDevices:false};writeFileSync(out+'/review.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}catch(error){if(page&&!page.isClosed())await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}
finally{await browser.close();}
