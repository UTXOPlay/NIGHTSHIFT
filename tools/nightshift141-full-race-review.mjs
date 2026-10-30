import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {reviewSession} from './review-session.mjs';

const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:19410',out=process.env.DRIFT_OUT||'artifacts/presentation-v141/full-race';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),ctx=await browser.newContext({viewport:{width:1920,height:1080}});ctx.setDefaultTimeout(180000);
const errors=[],samples=[];let logout;
try{
 if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(ctx,origin);
 await ctx.addInitScript(()=>{
  const pad={index:0,mapping:'standard',connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};
  Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});
  window.__setDriver=control=>{pad.axes[0]=control.steering/100;const buttons={7:control.throttle/100,6:control.brake/100,4:control.flags&4?1:0,1:control.flags&8?1:0,0:control.flags&16?1:0,2:control.flags&32?1:0,3:control.flags&64?1:0};for(let n=0;n<17;n++){pad.buttons[n].value=buttons[n]||0;pad.buttons[n].pressed=pad.buttons[n].value>.5;}};
 });
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||/GL_INVALID|shader error/i.test(m.text()))errors.push(m.text());});
 await page.route('**/games/nightshift/__test_driver.mjs',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('tests/helpers/nightshift14-driver.mjs','utf8').replaceAll('../../games/arcade/web/','./_arcade/')}));
 await page.goto(origin+'/games/nightshift/?review=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__driftReview?.().loaded);
 await page.getByRole('button',{name:'Start selected race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);
 await page.evaluate(async()=>{const {driveInput}=await import('./__test_driver.mjs'),{readInput}=await import('./_arcade/nightshift12-input.mjs'),state={};window.__driver=setInterval(()=>{const r=__driftReview();if(r.running)__setDriver(readInput(driveInput(r.game,state)));},1000/30);});
 const start=Date.now();let nextLog=30,finish;
 while(Date.now()-start<480000){
  const sample=await page.evaluate(()=>{const r=__driftReview();return {running:r.running,tick:r.game.tick,distance:r.game.distance,over:r.game.over,won:r.game.won,pending:r.pending,fps:+document.documentElement.dataset.renderFps,cpu:+document.documentElement.dataset.renderMs,gpu:r.motion.gpuMs,scale:+document.documentElement.dataset.renderScale,buffer:r.buffer,calls:r.draw.calls};});
  const elapsed=(Date.now()-start)/1000;if(elapsed>4)samples.push(sample);
  if(elapsed>=nextLog){console.log(JSON.stringify({seconds:Math.round(elapsed),tick:sample.tick,distance:sample.distance,fps:sample.fps,pending:sample.pending}));nextLog+=30;}
  if(sample.over){finish=sample;break;}
  assert.ok(sample.running,'Race must not silently stop before the result');await page.waitForTimeout(250);
 }
 const wallSeconds=(Date.now()-start)/1000;
 await page.evaluate(()=>{clearInterval(__driver);__setDriver({flags:0,steering:0,brake:0,throttle:0});});
 await page.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);
 const final=await page.evaluate(async()=>{const r=__driftReview(),response=await fetch('/games/nightshift/api/replay',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});return {game:r.game,engine:r.engine,audio:r.audio,replay:await response.json(),replayStatus:response.status};});
 const percentile=(key,q)=>{const values=samples.map(s=>s[key]).filter(Number.isFinite).sort((a,b)=>a-b);return values[Math.floor((values.length-1)*q)];};
 const report={version:JSON.parse(readFileSync('package.json')).version,origin,input:'Ordinary standard Gamepad API inputs from the existing V14 driver; no writable simulation hooks',wallSeconds,simulationSeconds:final.game.tick/30,mode:final.game.mode,distance:final.game.distance,won:!!final.game.won,over:final.game.over,medianFps:percentile('fps',.5),p10Fps:percentile('fps',.1),medianCpuMs:percentile('cpu',.5),medianGpuMs:percentile('gpu',.5),maxPending:Math.max(...samples.map(s=>s.pending)),maxBackingPixels:Math.max(...samples.map(s=>s.buffer.width*s.buffer.height)),scales:[...new Set(samples.map(s=>s.scale))],replay:final.replay,replayStatus:final.replayStatus,engine:final.engine,audio:final.audio,errors,limits:'One full stock-car Harbour event on this desktop/browser. Automated completion does not prove human difficulty, physical-device performance or all-route sustained performance.'};
 writeFileSync(out+'/review.json',JSON.stringify(report,null,2)+'\n');await page.screenshot({path:out+'/result.png'});console.log(JSON.stringify(report));
 assert.ok(finish,'An event must end within the observation window');assert.ok(report.over&&report.won,'The stock-car event must finish successfully');assert.ok(report.simulationSeconds>=180&&report.simulationSeconds<=420,'Successful event remains within 3–7 minutes');assert.ok(report.simulationSeconds>=wallSeconds*.9);assert.ok(report.medianFps>=45);assert.ok(report.maxBackingPixels<=3686400);assert.equal(final.replayStatus,200);assert.equal(final.replay.verified,true);assert.deepEqual(errors,[]);
}finally{await logout?.();await browser.close();}
