import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {reviewSession} from './review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:8899',out=process.env.DRIFT_OUT||'artifacts/environment-v81/controls';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1920,height:1080}});let logout;
try{
 if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(context,origin);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/games/drift-run/?review=1');await page.waitForFunction(()=>__driftReview?.().loaded);
 await page.getByRole('button',{name:'Garage and upgrades',exact:true}).first().click();
 await page.getByRole('button',{name:/^SHOCKWAVE/}).click();await page.getByRole('button',{name:'Race with VANTA',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);
 const fire=page.locator('#abilities [data-input="32"]'),counter=page.locator('#abilities [data-input="64"]');
 assert.equal(await fire.locator('kbd').innerText(),'E');assert.equal(await counter.locator('kbd').innerText(),'Q');
 assert.ok(await page.locator('#drive-keys').isVisible());
 await page.keyboard.press('KeyE');await page.waitForFunction(()=>__driftReview().game.weapon_cd>0);
 await page.waitForFunction(()=>document.querySelector('#abilities [data-input="32"] .ability-value').textContent.endsWith('s'));assert.equal(await fire.locator('kbd').innerText(),'E');assert.match(await fire.locator('.ability-value').innerText(),/s$/);
 await page.keyboard.press('KeyQ');await page.waitForFunction(()=>__driftReview().game.counter_ticks>0);
 await page.waitForFunction(()=>document.querySelector('#abilities [data-input="64"] .ability-value').textContent.endsWith('s'));assert.equal(await counter.locator('kbd').innerText(),'Q');assert.match(await counter.locator('.ability-value').innerText(),/s$/);
 assert.match(await page.locator('#weapon-status').innerText(),/RECHARGING/);
 const boxes=await page.locator('#speed,#weapon-status,#abilities').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
 for(let n=0;n<boxes.length;n++)for(let m=n+1;m<boxes.length;m++){const a=boxes[n],b=boxes[m];assert.ok(!(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y));}
 await page.screenshot({path:out+'/desktop-shortcuts.png'});await page.keyboard.press('KeyP');
 assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({fireKey:'E',counterKey:'Q',keysSurviveCooldown:true,keyboardActionsReachRules:true,weaponReasonVisible:true,noHudOverlap:true,errors},null,2));
 console.log('Keyboard actions and persistent hints passed.');
}finally{if(logout)await logout();await browser.close();}
