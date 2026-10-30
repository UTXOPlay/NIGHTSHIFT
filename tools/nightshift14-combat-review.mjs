import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {CLIENT_PROFILE} from '../games/arcade/web/nightshift14-profile.mjs';
import {step} from '../games/arcade/web/nightshift14-rules.mjs';
import {packInput} from '../games/arcade/web/nightshift12-input.mjs';
import {combatInput,combatReached} from '../tests/helpers/nightshift14-combat-driver.mjs';
import {reviewSession} from './review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:18940',out=process.env.DRIFT_OUT||'artifacts/rivals-v14/combat';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),ctx=await browser.newContext({viewport:{width:1280,height:720}}),checks=[],errors=[];ctx.setDefaultTimeout(90000);let logout;
try{
 if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(ctx,origin);
 await ctx.addInitScript(()=>{const pad={index:0,mapping:'standard',connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});window.__setCombatControl=c=>{pad.axes[0]=c.steering/100;const values={7:c.throttle/100,6:c.brake/100,4:c.flags&4?1:0,1:c.flags&8?1:0,0:c.flags&16?1:0,2:c.flags&32?1:0,3:c.flags&64?1:0};for(let n=0;n<17;n++){pad.buttons[n].value=values[n]||0;pad.buttons[n].pressed=pad.buttons[n].value>.5;}};});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'||/GL_INVALID|shader error/i.test(m.text()))errors.push(m.text());});
 for(const[name,file]of[['__combat_driver.mjs','nightshift14-combat-driver.mjs'],['__test_driver.mjs','nightshift14-driver.mjs']])await p.route('**/'+name,r=>r.fulfill({contentType:'text/javascript',body:readFileSync('tests/helpers/'+file,'utf8').replaceAll('../../games/arcade/web/','./_arcade/').replace('./nightshift14-driver.mjs','./__test_driver.mjs')}));
 async function api(endpoint,data){const r=data===undefined?await ctx.request.get(origin+'/games/nightshift/api/'+endpoint):await ctx.request.post(origin+'/games/nightshift/api/'+endpoint,{headers:{Origin:origin},data:{client_profile:CLIENT_PROFILE,...data}});assert.ok(r.ok(),endpoint+' '+r.status()+' '+(await r.text()).slice(0,250));return r.json();}
 const send=(s,action)=>api('action',{session_id:s.session.id,expected_block:s.session.block_hash,action});
 await p.goto(origin+'/games/nightshift/?review=1');await p.waitForFunction(()=>window.__driftReview?.().loaded);await p.locator('utxo-loader').waitFor({state:'detached'});
 for(const kind of ['collision','hit','guard','rival-hit','disable','wreck','recover']){
  let state=await api('state'),tape,triggerTick;
  for(let attempt=0;attempt<10&&!tape;attempt++){
   state=await send(state,{type:'race',mode:0,vehicle:0,gadget:['rival-hit','disable'].includes(kind)?1:0,difficulty:0});const g=structuredClone(state.game),inputs=[];
   while(!g.over&&g.tick<6000){const before=structuredClone(g),input=combatInput(g,kind);inputs.push(input);step(g,input);if(combatReached(kind,g,before)){tape=inputs.slice(0,Math.max(0,inputs.length-12));triggerTick=g.tick;break;}}
  }
  assert.ok(tape,kind+' is reachable through ordinary controls');for(let n=0;n<tape.length;n+=120)state=await send(state,{type:'ticks',inputs:tape.slice(n,n+120)});
  if(!state.game.tick)state=await send(state,{type:'ticks',inputs:[packInput(0,0,0,0)]});
  await p.reload();await p.waitForFunction(()=>__driftReview?.().loaded);await p.locator('utxo-loader').waitFor({state:'detached'});const base=await p.evaluate(()=>__driftReview().game);
  await p.evaluate(async kind=>{const{combatInput}=await import('./__combat_driver.mjs'),{readInput}=await import('./_arcade/nightshift12-input.mjs');window.__combatDriver=setInterval(()=>{const r=__driftReview();if(r.running)__setCombatControl(readInput(combatInput(r.game,kind)));},1000/30);},kind);
  await p.getByRole('button',{name:'Resume race',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);
  await p.waitForFunction(({kind,base})=>{const r=__driftReview(),g=r.game,f=r.feedback;return kind==='collision'?g.shield<base.shield&&f.hitAge<.8:kind==='hit'?g.hull<base.hull&&f.hitAge<.8:kind==='guard'?g.counter_ticks>0&&f.guardAge<.8:kind==='rival-hit'?g.attack_hits>base.attack_hits&&f.active>0:kind==='disable'?g.takedowns>base.takedowns&&f.rivalAges.some(a=>a<.8):kind==='recover'?g.events.some(e=>e.kind==='recover'&&e.target===-1)&&f.active>0:r.ending&&f.wreckAge<.8;},{kind,base},{timeout:18000});
  const impact=await p.evaluate(()=>__driftReview());await p.screenshot({path:out+'/'+kind+'.png'});
  if(kind==='guard'){await p.waitForFunction(n=>__driftReview().game.dodges>n,base.dodges,{timeout:3000});assert.equal(await p.evaluate(()=>__driftReview().game.stun),0);}
  if(kind==='wreck'){await p.waitForTimeout(300);const middle=await p.evaluate(()=>__driftReview());assert.equal(middle.game.tick,impact.game.tick);assert.ok(middle.grounding.bottom>=middle.grounding.floor-.01);assert.ok(middle.car.position.concat(middle.car.rotation.slice(0,3)).every(Number.isFinite));await p.screenshot({path:out+'/wreck-motion.png'});await p.waitForFunction(()=>__driftReview().view==='result'&&!__driftReview().ending);assert.equal(await p.evaluate(()=>__driftReview().game.tick),impact.game.tick);}
  await p.evaluate(()=>{clearInterval(__combatDriver);__setCombatControl({flags:0,steering:0,brake:0,throttle:0});});if(await p.evaluate(()=>__driftReview().running))await p.keyboard.press('p');await p.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);assert.ok((await api('replay',{})).verified);checks.push({kind,triggerTick,renderedTick:impact.game.tick,visibleSprites:impact.feedback.visible,signedReplay:true});console.log(kind+' passed');
 }
 assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({version:JSON.parse(readFileSync('package.json')).version,checks,errors,input:'Ordinary V14 signed pedal inputs plus virtual standard Gamepad API; no game-state injection'},null,2)+'\n');console.log({checks:checks.length,errors});
}finally{await logout?.();await browser.close();}
