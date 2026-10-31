import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {loadavg,freemem} from 'node:os';

const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:19418',out=process.env.DRIFT_OUT||'artifacts/fleet-v142/traffic';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true});context.setDefaultTimeout(180000);
const errors=[],trafficMoved=new Set(),rivalsMoved=new Set(),identities=new Map(),phases=new Map(),samples=[];let maxTraffic=0,nearSamples=0,formerOverflowSamples=0,lastSample=null;
try{
 await context.addInitScript(()=>{
  const pad={index:0,mapping:'standard',connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};
  Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});
  window.__setDriver=c=>{pad.axes[0]=c.steering?Math.sign(c.steering)*(.18+.82*Math.abs(c.steering)/100):0;const b={7:c.throttle/100,6:c.brake/100,4:c.flags&4?1:0,1:c.flags&8?1:0,0:c.flags&16?1:0,2:c.flags&32?1:0,3:c.flags&64?1:0};for(let n=0;n<17;n++){pad.buttons[n].value=b[n]||0;pad.buttons[n].pressed=pad.buttons[n].value>.5;}};
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||/GL_INVALID|shader error/i.test(m.text()))errors.push(m.text());});
 await page.route('**/games/nightshift/__test_driver.mjs',route=>route.fulfill({contentType:'text/javascript',body:readFileSync('tests/helpers/nightshift14-driver.mjs','utf8').replaceAll('../../games/arcade/web/','./_arcade/')}));
 await page.goto(origin+'/games/nightshift/?review=1',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__driftReview?.().loaded);
 await page.getByRole('button',{name:'Start selected race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);
 await page.evaluate(async()=>{const{driveInput}=await import('./__test_driver.mjs'),{readInput}=await import('./_arcade/nightshift12-input.mjs'),state={};window.__driver=setInterval(()=>{const r=__driftReview(),t=r.game.tick/30;if(r.running)__setDriver(t>60&&t<135?{flags:0,steering:0,brake:100,throttle:0}:readInput(driveInput(r.game,state)));},1000/30);});
 const start=performance.now();let nextLog=30,finished=false,savedOverflow=false,finalGame;
 while(performance.now()-start<480000){
  let timer;const r=await Promise.race([page.evaluate(()=>{const r=__driftReview();return{game:r.game,rendering:r.engine.trafficRendering,motion:r.engine.vehicleMotion,running:r.running,pending:r.pending,fps:+document.documentElement.dataset.renderFps};}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Browser observation exceeded 15 seconds')),15000);})]).finally(()=>clearTimeout(timer));lastSample=r;
  const bodies=r.game.bodies.filter(b=>b.tag===1||b.tag===9);maxTraffic=Math.max(maxTraffic,bodies.length);assert.equal(r.rendering.capacity,32);assert.equal(r.rendering.contactShadowInstances,38);assert.equal(r.rendering.droppedVisible,0);
  if(r.game.over){finished=true;finalGame=r.game;break;}
  assert.ok(r.running,'The stress race must remain active');
  const assignments=new Map(r.rendering.actors.map(a=>[a.id,a]));
  for(let n=0;n<bodies.length;n++){
   const b=bodies[n],a=assignments.get(b.id);assert.ok(a,'All authoritative traffic has a render slot');
   if(identities.has(a.key))assert.equal(a.index,identities.get(a.key),'Surviving IDs retain their model');identities.set(a.key,a.index);
   if(b.y< -5670||b.y>1070)continue;
   const model=r.motion.traffic[a.index];nearSamples++;assert.equal(model.visible,true);assert.equal(model.actorId,b.id);assert.equal(model.actorKey,a.key);assert.ok(model.coarse&&model.shaderMotionBound);assert.ok(Math.abs(model.travel-(r.game.distance+830-b.y)*.1)<2,'Wheel travel follows the traffic actor, within one interpolated tick');
   if(phases.has(a.key)&&Math.abs(model.travel-phases.get(a.key))>.05)trafficMoved.add(a.key);phases.set(a.key,model.travel);
   if(n>=16&&b.y>600&&b.y<1000){formerOverflowSamples++;if(!savedOverflow){await page.screenshot({path:out+'/formerly-invisible-traffic.png'});writeFileSync(out+'/overflow.json',JSON.stringify({game:r.game,rendering:r.rendering,motion:r.motion},null,2));savedOverflow=true;}}
  }
  r.motion.rivals.forEach((model,n)=>{if(!model.visible)return;assert.ok(model.coarse&&model.shaderMotionBound,'Touch rivals use animated coarse models');const key='rival:'+n;if(phases.has(key)&&Math.abs(model.travel-phases.get(key))>.05)rivalsMoved.add(n);phases.set(key,model.travel);});
  if((performance.now()-start)/1000>=nextLog){const row={seconds:Math.round((performance.now()-start)/1000),simulationSeconds:r.game.tick/30,distance:r.game.distance,speed:r.game.speed,pending:r.pending,loadAverage:loadavg(),freeMemoryBytes:freemem(),maxTraffic,nearSamples,formerOverflowSamples,trafficMoving:trafficMoved.size,rivalsMoving:rivalsMoved.size,fps:r.fps};samples.push(row);writeFileSync(out+'/progress.json',JSON.stringify(samples,null,2));console.log(JSON.stringify(row));nextLog+=30;}
  await page.waitForTimeout(250);
 }
 await page.evaluate(()=>{clearInterval(__driver);__setDriver({flags:0,steering:0,brake:0,throttle:0});});await page.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);
 const replay=await page.evaluate(async()=>{const response=await fetch('/games/nightshift/api/replay',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});return{status:response.status,body:await response.json()};});
 const report={version:JSON.parse(readFileSync('package.json')).version,gamepadMapping:'Inverse of the documented 0.18 axial deadzone; the driver steering demand reaches native input unchanged',ordinaryInputStress:'Brake from simulation second 60 to 135, then resume the existing V14 driver; no writable simulation hooks',finished,finalGame,lastSample,maxTraffic,nearSamples,formerOverflowSamples,trafficMoving:trafficMoved.size,rivalsMoving:rivalsMoved.size,replay,samples,errors,limits:'One real WebGL event with emulated touch/gamepad. This verifies render/actor integration, not physical devices or human balance.'};writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 assert.ok(finished);assert.ok(maxTraffic>16);assert.ok(formerOverflowSamples>0);assert.ok(trafficMoved.size>5);assert.ok(rivalsMoved.size>=3);assert.equal(replay.status,200);assert.equal(replay.body.verified,true);assert.deepEqual(errors,[]);
}catch(error){writeFileSync(out+'/failure.json',JSON.stringify({message:error.message,lastSample,loadAverage:loadavg(),freeMemoryBytes:freemem(),maxTraffic,nearSamples,formerOverflowSamples,errors},null,2));throw error;}finally{await browser.close();}
