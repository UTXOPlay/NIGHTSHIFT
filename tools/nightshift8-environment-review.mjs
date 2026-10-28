import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {reviewSession} from './review-session.mjs';

const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:8899';
const out=process.env.DRIFT_OUT||'artifacts/environment-v81/after';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1920,height:1080}});
const errors=[],maps=[];let logout;
try{
 if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(context,origin);
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 await page.goto(origin+'/games/nightshift/?review=1');
 await page.waitForFunction(()=>__driftReview?.().loaded);
 await page.getByRole('button',{name:'Career events',exact:true}).click();
 for(let mode=0;mode<12;mode++){
  await page.locator('.stage-card').nth(mode).click();
  await page.waitForTimeout(1100);
  const state=await page.evaluate(()=>{const r=__driftReview();return{mode:r.world.routeMode,draw:r.draw,buffer:r.buffer,environment:r.environment};});
  assert.equal(state.mode,mode);maps.push(state);
  if(process.env.DRIFT_EXPECT_ENV==='1'){
   assert.equal(state.environment.loaded,true);assert.equal(state.environment.fixtures,22);
   assert.equal(state.environment.physicalLights,2);
  }
  if([0,3,8,9].includes(mode)){
   const style=await page.addStyleTag({content:'#game > :not(canvas){visibility:hidden!important}'});
   await page.screenshot({path:out+`/map-${mode}.png`});await style.evaluate(e=>e.remove());
  }
 }
 await page.locator('.stage-card').nth(3).click();
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(1100);
 await page.screenshot({path:out+'/neon-mobile.png'});
 let lowQuality=null;if(process.env.DRIFT_EXPECT_ENV==='1'){await page.getByRole('button',{name:'Driving and combat guide',exact:true}).click();await page.getByRole('button',{name:'Cycle rendering quality',exact:true}).click();await page.getByRole('button',{name:'Close guide',exact:true}).click();await page.waitForFunction(()=>__driftReview().environment.activeLights===0);lowQuality=await page.evaluate(()=>__driftReview().environment);await page.screenshot({path:out+'/neon-mobile-low.png'});}
 assert.deepEqual(errors,[]);
 writeFileSync(out+'/review.json',JSON.stringify({maps,lowQuality,errors},null,2));
 console.log({maps:maps.length,errors});
}finally{if(logout)await logout();await browser.close();}
