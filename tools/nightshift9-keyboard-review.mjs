import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const out=process.env.DRIFT_OUT||'artifacts/circuit-v9/keyboard',origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:8899';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
try{
 const context=await browser.newContext({viewport:{width:1920,height:1080}});
 await context.addInitScript(()=>{Object.defineProperty(navigator,'keyboard',{value:{getLayoutMap:async()=>new Map([['KeyD','s'],['KeyE','f']])},configurable:true});});
 const p=await context.newPage(),errors=[],checks=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(origin+'/games/nightshift/?review=1');await p.waitForFunction(()=>__driftReview?.().loaded&&__driftReview().keyboard.preset==='colemak');checks.push('Colemak layout detection');
 await p.getByRole('button',{name:'Controls and settings',exact:true}).click();
 for(const [w,h]of [[1920,1080],[2560,1080],[2560,1440],[3840,2160],[844,390]]){await p.setViewportSize({width:w,height:h});const r=await p.locator('#keybinds').boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=w+1&&r.y+r.height<=h+1);await p.getByRole('button',{name:'Rebind pause',exact:true}).scrollIntoViewIfNeeded();}checks.push('Keyboard panel reachable at all required landscape sizes');
 await p.setViewportSize({width:1920,height:1080});
 await p.getByRole('button',{name:'Rebind fire',exact:true}).click();await p.keyboard.press('q');assert.match(await p.locator('#key-message').innerText(),/Already bound/);await p.keyboard.press('j');
 assert.equal(await p.evaluate(()=>__driftReview().keyboard.bindings.fire),'j');await p.getByRole('button',{name:'Close keyboard settings',exact:true}).click();await p.reload();await p.waitForFunction(()=>__driftReview?.().loaded);assert.equal(await p.evaluate(()=>__driftReview().keyboard.bindings.fire),'j');checks.push('Conflict rejected and custom key survives reload');
 await p.getByRole('button',{name:'Controls and settings',exact:true}).click();await p.getByRole('button',{name:'Reset selected keyboard preset',exact:true}).click();await p.getByRole('button',{name:'Close keyboard settings',exact:true}).click();
 await p.getByRole('button',{name:'Garage and upgrades',exact:true}).first().click();await p.getByRole('button',{name:'Performance tuning',exact:true}).click();await p.getByRole('button',{name:/^SHOCKWAVE/}).click();await p.getByRole('button',{name:'Race with VANTA',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);
 assert.equal(await p.locator('#abilities [data-input="32"] kbd').innerText(),'F');assert.equal(await p.locator('#abilities [data-input="8"] kbd').innerText(),'R');
 const cdp=await context.newCDPSession(p);const key=async(type,key,code)=>cdp.send('Input.dispatchKeyEvent',{type,key,code});
 const x=await p.evaluate(()=>__driftReview().game.drift_x);await key('keyDown','s','KeyD');await p.waitForTimeout(220);await key('keyUp','s','KeyD');assert.ok(await p.evaluate(x=>__driftReview().game.drift_x>x+15,x));
 await key('keyDown','f','KeyE');await key('keyUp','f','KeyE');await p.waitForFunction(()=>__driftReview().game.weapon_cd>0);await key('keyDown','q','KeyQ');await key('keyUp','q','KeyQ');await p.waitForFunction(()=>__driftReview().game.counter_ticks>0);checks.push('Physical Colemak S/F/Q reach steering, fire and counter with matching HUD');
 await key('keyDown','s','KeyD');await p.getByRole('button',{name:'Controls and settings',exact:true}).click();await p.waitForFunction(()=>!__driftReview().running&&!__driftReview().sending);const tick=await p.evaluate(()=>__driftReview().game.tick);await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>__driftReview().game.tick),tick);await key('keyUp','s','KeyD');checks.push('Opening settings releases held inputs and pauses simulation');
 await p.screenshot({path:out+'/colemak.png'});assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({checks,errors},null,2));console.log({checks,errors});
}finally{await browser.close();}
