import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {reviewSession} from './review-session.mjs';
import {recoveryTape} from '../tests/helpers/nightshift16-recovery-tape.mjs';
import {createGame,applyAction} from '../games/arcade/web/nightshift16-rules.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:19428',out=process.env.DRIFT_OUT||'artifacts/reverse-traffic-v16/browser';mkdirSync(out,{recursive:true});
const profile=JSON.parse(readFileSync('games/nightshift-v16/host.json')).clientProfile,tape=recoveryTape(),prefix=tape.inputs.slice(0,tape.collisionTick);
const proxy=process.env.DRIFT_PROXY||(!origin.startsWith('http://127.0.0.1')&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY));
const browser=await chromium.launch({...(proxy?{proxy:{server:proxy}}:{}),args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const cases=[],errors=[];let page;
async function prime(context){
 if(process.env.DRIFT_AUTH==='1')await reviewSession(context,origin);
 else{const r=await context.request.post(origin+'/games/nightshift/api/guest',{headers:{Origin:origin},data:{}});assert.ok(r.ok());}
 const call=async(path,body)=>{const r=body===undefined?await context.request.get(origin+'/games/nightshift/api/'+path):await context.request.post(origin+'/games/nightshift/api/'+path,{headers:{Origin:origin},data:{...body,client_profile:profile}});assert.ok(r.ok(),path+': '+await r.text());return r.json();};
 let state=await call('state');
 const act=async action=>{state=await call('action',{session_id:state.session.id,expected_block:state.session.block_hash,action});};
 await act(tape.action);const expected=createGame();applyAction(expected,tape.action);for(let n=0;n<prefix.length;n+=120){const action={type:'ticks',inputs:prefix.slice(n,n+120)};applyAction(expected,action);await act(action);assert.deepEqual(state.game,expected);}
 assert.equal(state.game.physics_version,16);assert.equal(state.session.profile,profile);assert.ok(state.game.speed<0);assert.ok(state.game.bodies.some(b=>b.tag===8&&Math.abs(b.y-830)<=26));return call;
}
try{
 for(const kind of ['keyboard','touch']){
  const context=await browser.newContext(kind==='touch'?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1920,height:1080}});context.setDefaultTimeout(180000);
  try{
   const call=await prime(context);page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/games/nightshift/?review=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__driftReview?.().loaded);await page.locator('utxo-loader').waitFor({state:'detached'});await page.getByRole('button',{name:'Resume race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);
   const before=await page.evaluate(()=>__driftReview().game);let release;
   if(kind==='keyboard'){
    await page.keyboard.down('z');await page.keyboard.down('a');await page.waitForFunction(()=>__driftReview().game.drift_x>=1800);await page.keyboard.up('a');release=()=>page.keyboard.up('z');
   }else{
    const cdp=await context.newCDPSession(page),rect=await page.locator('#joystick').boundingBox();assert.ok(rect);const point=(x,y)=>({x:rect.x+rect.width/2+x*rect.width*.35,y:rect.y+rect.height/2+y*rect.width*.35,id:1,radiusX:2,radiusY:2,force:1});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(-.6,.8)]});await page.waitForFunction(()=>__driftReview().game.drift_x>=1800);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(0,1)]});release=()=>cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }
   await page.waitForFunction(tick=>__driftReview().game.tick>=tick,before.tick+240);const r=await page.evaluate(()=>__driftReview());await release();assert.ok(!r.game.over);assert.ok(r.game.distance<before.distance-600,'Reverse clears the row instead of being pushed forward');assert.ok(r.game.speed<=0);assert.ok(r.game.bodies.some(b=>b.tag===1&&b.life>0),'Actual rear traffic uses the yield behavior');assert.equal(r.engine.vehicleMotion.pursuer,null);assert.equal(r.engine.vehicleMotion.ghost.visible,false);
   await page.screenshot({path:out+'/'+kind+'-recovery.png'});await page.keyboard.press('p');await page.waitForFunction(()=>!__driftReview().running&&!__driftReview().pending&&!__driftReview().sending);const state=await call('state');assert.deepEqual(state.game,await page.evaluate(()=>__driftReview().game));assert.equal((await call('replay',{})).verified,true);
   cases.push({kind,collisionTick:before.tick,reverseTick:r.game.tick,metresBack:(before.distance-r.game.distance)/10,speed:r.game.speed,yielding:r.game.bodies.filter(b=>b.tag===1&&b.life>0).map(b=>({id:b.id,x:b.x,velocity:b.vy,lane:b.yield_lane})),sameBrowserNativeState:true,signedReplay:true});
  }finally{await context.close();}
 }
 assert.deepEqual(errors,[]);const report={version:16,origin,profile,cases,errors,fixture:'Ordinary signed race/tick commands reach the actual barrier collision. Recovery uses ordinary browser keyboard and CDP touch input. No player-state injection or writable game hooks.',physicalDevices:false};writeFileSync(out+'/review.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}catch(error){if(page&&!page.isClosed())await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw error;}
finally{await browser.close();}
