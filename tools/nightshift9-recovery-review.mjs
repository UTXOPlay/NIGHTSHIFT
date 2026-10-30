import {chromium} from 'playwright';import assert from 'node:assert/strict';import{mkdirSync,writeFileSync}from'node:fs';import{step}from'../games/arcade/web/nightshift9-rules.mjs';import{driveInput}from'../tests/helpers/nightshift9-driver.mjs';import{reviewSession}from'./review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:8899',out=process.env.DRIFT_OUT||'artifacts/streets-v93/recovery';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({proxy:process.env.DRIFT_PROXY?{server:process.env.DRIFT_PROXY}:undefined,args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),ctx=await browser.newContext({viewport:{width:1280,height:720}});let logout;
try{
 if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(ctx,origin);else await ctx.request.get(origin+'/games/nightshift/');
 const call=async(path,body)=>{const r=await ctx.request[body?'post':'get'](origin+'/games/nightshift/api/'+path,body?{headers:{Origin:origin},data:body}:{});assert.ok(r.ok(),await r.text());return r.json();};
 let state=await call('state');const send=async action=>state=await call('action',{session_id:state.session.id,expected_block:state.session.block_hash,action});await send({type:'race',mode:1,vehicle:0,gadget:0,difficulty:0});
 const g=structuredClone(state.game),driver={},tape=[];let target=null,stopped=false;
 for(let n=0;n<11000&&!g.over;n++){
  if(!target){const b=g.bodies.filter(b=>b.tag===8&&b.y>100&&b.y<750).sort((a,b)=>b.y-a.y)[0];if(b)target=b.id;}
  const b=g.bodies.find(b=>b.id===target);let bits=driveInput(g,driver);
  if(b){bits=0;const desired=Math.max(-55,Math.min(55,(b.x-g.drift_x)*.1)),error=desired-g.steer_v;if(error>4)bits|=2;else if(error< -4)bits|=1;if(830-b.y<=g.speed*g.speed/6400+60)bits|=8;if(Math.abs(g.speed)<60&&b.y>750&&b.y<840&&Math.abs(b.x-g.drift_x)<500){stopped=true;break;}}
  step(g,bits);tape.push(bits);
 }
 assert.ok(stopped,'Ordinary inputs reach a stopped roadblock approach');for(let n=0;n<tape.length;n+=120)await send({type:'ticks',inputs:tape.slice(n,n+120)});assert.deepEqual(state.game,g);
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(origin+'/games/nightshift/?review=1',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>__driftReview?.().loaded);await p.getByRole('button',{name:'Resume race',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);await p.keyboard.down('ArrowDown');await p.waitForFunction(()=>document.querySelector('#notice').textContent.includes('TO REVERSE'));await p.screenshot({path:out+'/roadblock-guidance.png'});
 const before=await p.evaluate(()=>__driftReview().game.distance);await p.keyboard.down('z');await p.waitForTimeout(1000);await p.keyboard.up('z');await p.keyboard.press('KeyP');await p.keyboard.up('ArrowDown');await p.waitForFunction(()=>!__driftReview().sending);const after=await p.evaluate(()=>__driftReview().game.distance);assert.ok(after<before);assert.equal(Boolean(await p.evaluate(()=>__driftReview().game.over)),false);assert.ok((await call('replay',{})).verified);assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({ordinaryInputTicks:tape.length,hintUsesBoundReverseKey:true,reverseDistance:before-after,nativeReplayVerified:true,errors},null,2));console.log({ordinaryInputTicks:tape.length,reverseDistance:before-after,errors});
}finally{if(logout)await logout();await browser.close();}
