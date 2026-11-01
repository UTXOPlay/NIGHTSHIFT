import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {reviewSession} from './review-session.mjs';

const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:19424',out=process.env.DRIFT_OUT||'artifacts/reverse-v15/browser';mkdirSync(out,{recursive:true});
const proxy=process.env.DRIFT_PROXY||(!origin.startsWith('http://127.0.0.1')&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY));
const browser=await chromium.launch({...(proxy?{proxy:{server:proxy}}:{}),args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const cases=[],errors=[];let page;
const state=p=>p.evaluate(()=>{const r=__driftReview();return{tick:r.game.tick,distance:r.game.distance,speed:r.game.speed,x:r.game.drift_x,reverseRemainder:r.game.reverse_remainder,rules:r.game.physics_version,stick:r.stick};});
async function open(context){
 if(process.env.DRIFT_AUTH==='1')await reviewSession(context,origin);
 const p=await context.newPage();page=p;p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(180000);
 await p.goto(origin+'/games/nightshift/?review=1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__driftReview?.().loaded);await p.locator('utxo-loader').waitFor({state:'detached'});
 await p.getByRole('button',{name:'Start selected race',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);assert.equal((await state(p)).rules,15);return p;
}
async function finish(p,kind,before,after){
 const elapsed=(after.tick-before.tick)/30,metres=(before.distance-after.distance)/10;
 assert.ok(elapsed>=.45&&elapsed<=.75,'Bound the actual simulation observation');assert.ok(metres>=1.8,kind+' backs away promptly');assert.ok(after.speed<=-200&&after.speed>=-500);
 await p.screenshot({path:out+'/'+kind+'.png'});await p.keyboard.press('p');await p.waitForFunction(()=>!__driftReview().running&&!__driftReview().pending&&!__driftReview().sending);
 const replay=await p.context().request.post(origin+'/games/nightshift/api/replay',{headers:{Origin:origin},data:{}});assert.equal((await replay.json()).verified,true);
 cases.push({kind,before,after,seconds:elapsed,metres,nativeReplay:true});
}
try{
 for(const kind of ['keyboard-z','keyboard-brake-hold']){
 const keyboard=await browser.newContext({viewport:{width:1920,height:1080}});
 try{
  const p=await open(keyboard);await p.keyboard.down('w');await p.waitForFunction(()=>__driftReview().game.distance>=300);await p.keyboard.up('w');await p.keyboard.down('x');await p.keyboard.down('s');await p.waitForFunction(()=>__driftReview().game.speed===0);await p.keyboard.up('s');await p.keyboard.up('x');
  const key=kind==='keyboard-z'?'z':'s',before=await state(p);await p.keyboard.down(key);await p.waitForFunction(tick=>__driftReview().game.tick>=tick,before.tick+15);await p.keyboard.up(key);const after=await state(p);await finish(p,kind,before,after);
 }finally{await keyboard.close();}
 }
 const controller=await browser.newContext({viewport:{width:1920,height:1080}});
 await controller.addInitScript(()=>{const pad={index:0,mapping:'standard',connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});window.__reversePad=buttons=>{for(let n=0;n<17;n++){pad.buttons[n].value=buttons[n]||0;pad.buttons[n].pressed=pad.buttons[n].value>.5;}};});
 try{
  const p=await open(controller);await p.evaluate(()=>__reversePad({}));await p.waitForTimeout(120);await p.evaluate(()=>__reversePad({8:1}));await p.waitForTimeout(120);await p.evaluate(()=>__reversePad({}));await p.waitForFunction(()=>document.querySelector('#game').dataset.input==='gamepad');
  await p.evaluate(()=>__reversePad({7:1}));await p.waitForFunction(()=>__driftReview().game.distance>=300);
  // Foot brake plus handbrake holds a genuine stop without LT auto-reversing.
  await p.evaluate(()=>__reversePad({6:1,1:1}));await p.waitForFunction(()=>__driftReview().game.speed===0);await p.evaluate(()=>__reversePad({}));
  const before=await state(p);await p.evaluate(()=>__reversePad({6:1}));await p.waitForFunction(tick=>__driftReview().game.tick>=tick,before.tick+15);await p.evaluate(()=>__reversePad({}));const after=await state(p);await finish(p,'controller-lt',before,after);
 }finally{await controller.close();}
 const touch=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 try{
  const p=await open(touch),cdp=await touch.newCDPSession(p),rect=await p.locator('#joystick').boundingBox();assert.ok(rect);
  const point=(x,y)=>({x:rect.x+rect.width/2+x*rect.width*.35,y:rect.y+rect.height/2+y*rect.width*.35,id:1,radiusX:2,radiusY:2,force:1});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(0,-1)]});await p.waitForFunction(()=>__driftReview().game.distance>=300);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(.6,.8)]});await p.waitForFunction(()=>__driftReview().game.speed<=0);
  const before=await state(p);assert.ok(before.stick.x>.4,'Reverse must engage while already steering');
  await p.waitForFunction(tick=>__driftReview().game.tick>=tick,before.tick+15);const after=await state(p);assert.equal(after.stick.reverse,true);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await finish(p,'touch-diagonal',before,after);
 }finally{await touch.close();}
 assert.deepEqual(errors,[]);const report={rulesVersion:15,cases,errors,input:'Ordinary keyboard and CDP touch events; standard Gamepad API emulation only. No game-state writes.',physicalDevices:false};writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){if(page&&!page.isClosed()){writeFileSync(out+'/failure.json',JSON.stringify({message:error.message,review:await page.evaluate(()=>window.__driftReview?.()).catch(()=>null),cases,errors},null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});}throw error;}
finally{await browser.close();}
