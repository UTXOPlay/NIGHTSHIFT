import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {reviewSession} from './review-session.mjs';

const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:19491',out=process.env.DRIFT_OUT||'artifacts/engine-v1411/fullscreen';mkdirSync(out,{recursive:true});
const proxy=process.env.DRIFT_PROXY||(!origin.startsWith('http://127.0.0.1')&&(process.env.HTTPS_PROXY||process.env.HTTP_PROXY));
const browser=await chromium.launch({...(proxy?{proxy:{server:proxy}}:{}),args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),errors=[];let logout;
try{
 logout=await reviewSession(context,origin);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));let framePolicy='';
 page.on('response',response=>{if(response.request().isNavigationRequest()&&response.frame().parentFrame())framePolicy=response.headers()['content-security-policy']||'';});
 await context.addInitScript(()=>{Object.defineProperty(window,'__fullscreenRealm',{value:performance.timeOrigin+':'+Math.random()});});
 await page.goto(origin+'/games/nightshift/');await page.getByRole('dialog',{name:'Fullscreen game entry'}).waitFor();
 const iframe=page.locator('iframe.game-frame');assert.equal(await iframe.evaluate(e=>e.inert),true);
 const sandbox=await iframe.getAttribute('sandbox');
 await page.getByRole('button',{name:'Enter fullscreen',exact:true}).click();await page.waitForFunction(()=>!!document.fullscreenElement);
 await page.locator('.game-stage.is-ready').waitFor({timeout:180000});const handle=await iframe.elementHandle(),frame=await handle.contentFrame();
 for(const directive of ["object-src 'none'","frame-ancestors 'self'","base-uri 'none'"])assert.ok(framePolicy.includes(directive),'Keep the managed-service frame policy');const originalPolicy=framePolicy;
 await frame.getByRole('button',{name:'Start selected race',exact:true}).click();await frame.locator('#game[data-view="race"]').waitFor({timeout:180000});
 await frame.waitForFunction(()=>document.querySelector('canvas').style.opacity==='1'&&document.querySelector('#countdown').hidden,{},{timeout:180000});
 await frame.locator('canvas').press('p');await frame.locator('#game[data-view="pause"]').waitFor();
 const before=await frame.evaluate(()=>{const canvas=document.querySelector('canvas');window.__fullscreenCanary={canvas,context:canvas.getContext('webgl2')};return {realm:__fullscreenRealm,view:document.querySelector('#game').dataset.view};});
 assert.ok(await frame.evaluate(()=>!!__fullscreenCanary.context));let navigations=0;page.on('framenavigated',f=>{if(f===frame)navigations++;});
 const source=await iframe.getAttribute('src');await page.evaluate(()=>document.exitFullscreen());await page.getByRole('button',{name:'Enter fullscreen',exact:true}).waitFor();assert.equal(await iframe.evaluate(e=>e.inert),true);
 await page.getByRole('button',{name:'Enter fullscreen',exact:true}).click();await page.waitForFunction(()=>!!document.fullscreenElement);
 assert.equal(await iframe.evaluate((element,original)=>element===original,handle),true);assert.equal(await iframe.getAttribute('src'),source);assert.equal(await iframe.evaluate(e=>e.inert),false);
 const after=await frame.evaluate(()=>({realm:__fullscreenRealm,view:document.querySelector('#game').dataset.view,sameCanvas:document.querySelector('canvas')===__fullscreenCanary.canvas,sameContext:document.querySelector('canvas').getContext('webgl2')===__fullscreenCanary.context}));
 assert.equal(after.realm,before.realm);assert.equal(after.view,'pause');assert.ok(after.sameCanvas&&after.sameContext);assert.equal(navigations,0);assert.equal(await iframe.getAttribute('sandbox'),sandbox);assert.equal(framePolicy,originalPolicy);assert.deepEqual(errors,[]);
 const report={origin,runtime:'managed-service',fullscreenEntry:true,exitRegatesInput:true,existingFramePolicyPreserved:true,sameIframe:true,sameJavaScriptRealm:true,sameCanvas:true,sameWebGLContext:true,pausedRaceRetained:true,frameNavigations:navigations,errors};
 writeFileSync(out+'/review.json',JSON.stringify(report,null,2));await page.screenshot({path:out+'/reentry.png'});console.log(JSON.stringify(report));
}finally{await logout?.();await context.close();await browser.close();}
