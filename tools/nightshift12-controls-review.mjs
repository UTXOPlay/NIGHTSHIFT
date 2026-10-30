import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {installReviewProfile} from './client-profile.mjs';
import {reviewSession} from './review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:18940',out=process.env.DRIFT_OUT||'artifacts/driving-v12/browser';
mkdirSync(out,{recursive:true});const checks=[],errors=[],runs=[];
const browser=await chromium.launch({proxy:process.env.DRIFT_PROXY?{server:process.env.DRIFT_PROXY}:undefined,args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
try{
 for(const touch of [false,true]){
  const ctx=await browser.newContext({viewport:touch?{width:844,height:390}:{width:1920,height:1080},hasTouch:touch,isMobile:touch});ctx.setDefaultTimeout(60000);
  let logout;
  try{
   installReviewProfile(ctx);if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(ctx,origin);
   await ctx.addInitScript(()=>{
    localStorage.setItem('utxoplay:quality','low');localStorage.setItem('nightshift:keyboard',JSON.stringify({preset:'colemak'}));localStorage.removeItem('nightshift:practice:v12');localStorage.removeItem('nightshift:keyboard:v12');
    const p={index:0,connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};
    Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>p.connected?[p]:[]});
    globalThis.__pad=(buttons={},x=0,connected=true)=>{p.connected=connected;p.axes[0]=x;for(let n=0;n<17;n++){p.buttons[n].value=buttons[n]||0;p.buttons[n].pressed=p.buttons[n].value>.5;}};
   });
   const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+'/games/nightshift/?review=1');await p.waitForFunction(()=>__driftReview?.().loaded);
   const set=async(buttons={},x=0,connected=true)=>p.evaluate(({buttons,x,connected})=>__pad(buttons,x,connected),{buttons,x,connected});
   const press=async n=>{await set({[n]:1});await p.waitForTimeout(250);await set();await p.waitForTimeout(250);};
   const call=async(path,data)=>{const r=data===undefined?await ctx.request.get(origin+'/games/nightshift/api/'+path):await ctx.request.post(origin+'/games/nightshift/api/'+path,{headers:{Origin:origin},data});assert.ok(r.ok(),'Native '+path+' HTTP '+r.status());return r.json();};
   // Use the existing career primary button through controller polling, not a state edit.
   await p.waitForFunction(()=>!document.querySelector('#menu-actions .primary').disabled);await p.waitForTimeout(250);await press(0);try{await p.waitForFunction(()=>__driftReview().running);}catch(error){writeFileSync(out+'/start-diagnostic.json',JSON.stringify(await p.evaluate(()=>({review:__driftReview(),status:document.querySelector('#status').textContent,menu:document.querySelector('#menu-actions').innerHTML,focused:document.activeElement?.outerHTML})),null,2));await p.screenshot({path:out+'/start-diagnostic.png'});throw error;}
   await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>__driftReview().game.speed),0);await set({7:1});await p.waitForFunction(()=>__driftReview().controls.practice.stage===1);await set({7:1},-.55);await p.waitForFunction(()=>__driftReview().controls.practice.stage===2);await set({7:1});
   await p.waitForFunction(()=>!document.querySelector('#drive-coach').hidden);await p.waitForFunction(()=>document.querySelector('#drive-coach b')?.textContent==='BRAKE');await p.screenshot({path:out+(touch?'/touch-practice.png':'/desktop-practice.png')});
   await set({6:.9});await p.waitForFunction(()=>__driftReview().controls.practice.stage===3);await set();await p.waitForTimeout(200);
   assert.ok((await p.evaluate(()=>__driftReview().game.charge))>=100,'Normal initial charge supports a first boost');
   await set({7:1,0:1});await p.waitForFunction(()=>__driftReview().controls.practice.stage===4);await set();assert.equal(await p.locator('#abilities [data-input="32"] .ability-key').textContent(),'X');checks.push('Observed acceleration, steering, braking and native boost complete interactive practice');
   await set({9:1});await p.waitForFunction(()=>!__driftReview().running&&!__driftReview().countdown&&!__driftReview().pending&&!__driftReview().sending);const paused=await p.evaluate(()=>__driftReview().game.tick);await p.waitForTimeout(650);assert.equal(await p.evaluate(()=>__driftReview().game.tick),paused);await set();await p.waitForTimeout(200);await press(9);await p.waitForFunction(()=>__driftReview().running);checks.push('Held pause does not repeatedly toggle or auto-resume');
   await set({},-.6);await p.waitForFunction(()=>__driftReview().controls.active);await p.keyboard.down('s');await p.waitForTimeout(250);assert.equal(await p.evaluate(()=>__driftReview().controls.source),'keyboard');assert.equal(await p.evaluate(()=>__driftReview().controls.active),false);await p.keyboard.up('s');await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>__driftReview().controls.active),false);assert.equal(await p.locator('#abilities [data-input="32"] .ability-key').textContent(),'F');await set();await p.waitForTimeout(150);checks.push('Colemak takeover cancels a held controller until neutral');
   if(touch){
    await set({},.4);await p.waitForFunction(()=>__driftReview().controls.active);await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>!__driftReview().running&&!__driftReview().controls.active);const tick=await p.evaluate(()=>__driftReview().game.tick);await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>__driftReview().game.tick),tick);await set();await p.setViewportSize({width:844,height:390});await p.waitForTimeout(200);await press(9);await p.waitForFunction(()=>__driftReview().running);checks.push('Portrait gate pauses controller play and clears held input');
   }
   await set({},.4);await p.waitForFunction(()=>__driftReview().controls.active);await set({},0,false);await p.waitForFunction(()=>!__driftReview().running&&!__driftReview().pending&&!__driftReview().sending);const state=await call('state');assert.deepEqual(state.game,await p.evaluate(()=>__driftReview().game));assert.equal((await call('replay',{})).verified,true);checks.push('Controller disconnect pauses and its ordinary-input native replay verifies');
   await set({},0,true);await p.waitForTimeout(200);
   // Navigate from pause to garage entirely through the controller.
   await p.locator('#menu-actions button').first().focus();for(let n=0;n<5&&(await p.evaluate(()=>document.activeElement?.getAttribute('aria-label')))!=='Inspect garage';n++)await press(15);const focused=await p.evaluate(()=>document.activeElement?.getAttribute('aria-label'));assert.equal(focused,'Inspect garage');await press(0);await p.waitForFunction(()=>__driftReview().view==='garage');await press(1);await p.waitForFunction(()=>__driftReview().view==='career');checks.push('Controller spatial menu navigation opens garage and returns');
   for(const [width,height] of [[1920,1080],[2560,1080],[2560,1440],[3840,2160],[844,390]]){await p.setViewportSize({width,height});await p.waitForTimeout(150);const metrics=await p.evaluate(()=>({w:innerWidth,h:innerHeight,buffer:__driftReview().buffer,overflow:document.documentElement.scrollWidth>innerWidth}));assert.ok(metrics.buffer.width*metrics.buffer.height<=3686400);assert.equal(metrics.overflow,false);}
   runs.push({touch,practiceStage:4,nativeReplay:true,pausedTick:paused,inputSource:'virtual standard Gamepad API readings',physicalController:false});
  }finally{if(logout)await logout();await ctx.close();}
 }
 assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({checks,runs,errors},null,2));console.log(JSON.stringify({checks,runs,errors}));
}finally{await browser.close();}
