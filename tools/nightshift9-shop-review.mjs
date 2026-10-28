import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {reviewSession} from './review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:8899',out=process.env.DRIFT_OUT||'artifacts/environment-v81/shop';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({proxy:process.env.DRIFT_PROXY?{server:process.env.DRIFT_PROXY}:undefined,args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),context=await browser.newContext({viewport:{width:1920,height:1080}});let logout;
context.setDefaultNavigationTimeout(90000);
try{
 if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(context,origin);
 const page=await context.newPage(),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 await page.goto(origin+'/games/nightshift/?review=1');await page.waitForFunction(()=>__driftReview?.().loaded);
 await page.getByRole('button',{name:'Garage and upgrades',exact:true}).first().click();
 const fleet=await page.evaluate(()=>__driftReview().environment);assert.equal(fleet.fleetLoaded,true);assert.equal(fleet.fleetSources,2);assert.equal(fleet.fleetBounds.length,6);
 for(const car of fleet.wheelContacts){assert.equal(car.length,4);for(const y of car)assert.ok(Math.abs(y)<.018,'Four tire contacts rest on the service-bay floor');}
 for(const b of fleet.fleetBounds){assert.ok(b.size[0]<2.5&&b.size[2]<5);assert.ok(b.max[1]<1.8&&b.min[1]>-.08,'Vehicle stays grounded and within the visual envelope');}
 for(let n=0;n<6;n++){await page.locator('.car-card').nth(n).click();await page.waitForTimeout(100);assert.equal(await page.locator('.car-card[aria-pressed=true]').count(),1);assert.ok(await page.evaluate(()=>__driftReview().project(0,1,0).y<__driftReview().project(0,0,0).y),'Camera keeps world up above the road for every car');assert.match(await page.locator('.garage-price').innerText(),n?/MORE CREDITS|READY TO ACQUIRE/:/OWNED/);await page.screenshot({path:out+`/vehicle-${n}.png`});}
 checks.push('Two licensed source bodies, six upright race builds, grounded bounds and real thumbnails');
 await page.locator('.car-card').nth(1).click();assert.ok(await page.getByRole('button',{name:'Buy KITE for 1800 credits',exact:true}).isDisabled());assert.match(await page.locator('.garage-price').innerText(),/600 MORE CREDITS/);checks.push('Unaffordable purchase exposes the exact shortfall and cannot debit credits');
 await page.locator('.car-card').nth(0).click();await page.getByRole('button',{name:/Upgrade GRIP:/}).click();await page.waitForFunction(()=>__driftReview().game.career.upgrades[0][1]===1);assert.equal(await page.evaluate(()=>__driftReview().game.career.credits),650);assert.match(await page.locator('#shop-message').innerText(),/GRIP INSTALLED/);await page.reload();await page.waitForFunction(()=>__driftReview?.().loaded);await page.getByRole('button',{name:'Garage and upgrades',exact:true}).first().click();assert.equal(await page.evaluate(()=>__driftReview().game.career.credits),650);assert.equal(await page.locator('#workshop .upgrade').nth(1).locator('button').getAttribute('title'),'Earn 450 more credits');checks.push('Upgrade price, benefit, debit, success feedback and reload persistence');
 for(const [width,height] of [[1920,1080],[2560,1080],[2560,1440],[3840,2160],[844,390]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  const boxes=await page.locator('#cards .car-card,#garage-tools,#menu-actions,#details').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
  for(const b of boxes)assert.ok(b.x>=0&&b.y>=0&&b.x+b.w<=width+1&&b.y+b.h<=height+1,'Shop controls inside '+width+'x'+height);
  await page.screenshot({path:out+`/showroom-${width}x${height}.png`});
 }
 await page.getByRole('button',{name:'Performance tuning',exact:true}).click();assert.ok(await page.locator('#workshop').isVisible());await page.screenshot({path:out+'/tuning-mobile.png'});checks.push('Showroom and tuning layouts at every required landscape resolution');
 await page.getByRole('button',{name:'Vehicle showroom',exact:true}).click();const before=await page.evaluate(()=>__driftReview().car.rotation[1]);await page.mouse.move(600,175);await page.mouse.down();await page.mouse.move(710,175,{steps:5});await page.mouse.up();await page.waitForTimeout(100);assert.ok(Math.abs((await page.evaluate(()=>__driftReview().car.rotation[1]))-before)>.5);await page.getByRole('button',{name:'Reset vehicle view',exact:true}).click();await page.waitForTimeout(100);assert.ok(Math.abs(await page.evaluate(()=>__driftReview().car.rotation[1]))<.01);checks.push('3D preview rotates through actual pointer input and resets');
 assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({checks,errors,fleet},null,2));console.log({checks,errors});
}finally{if(logout)await logout();await browser.close();}
