import {installReviewProfile} from './client-profile.mjs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createGame,applyAction,step} from '../games/arcade/web/nightshift10-rules.mjs';
import {driveInput} from '../tests/helpers/nightshift10-driver.mjs';
import {roadblockThreat} from '../games/arcade/web/nightshift9-recovery.mjs';
import {reviewSession} from './review-session.mjs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:8899',out=process.env.DRIFT_OUT||'artifacts/roadblocks-v10/browser';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({proxy:process.env.DRIFT_PROXY?{server:process.env.DRIFT_PROXY}:undefined,args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const checks=[],errors=[],runs=[];
try{
 for(const touch of [false,true]){
  const ctx=await browser.newContext({viewport:touch?{width:844,height:390}:{width:1920,height:1080},hasTouch:touch,isMobile:touch});
  ctx.setDefaultTimeout(90000);ctx.setDefaultNavigationTimeout(90000);
  let logout;
  try{
   installReviewProfile(ctx);if(process.env.DRIFT_AUTH==='1')logout=await reviewSession(ctx,origin);
   await ctx.addInitScript(()=>{localStorage.setItem('utxoplay:quality','low');localStorage.setItem('nightshift:keyboard',JSON.stringify({preset:'colemak'}));});
   const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
   await p.goto(origin+'/games/nightshift/?review=1');await p.waitForFunction(()=>__driftReview?.().loaded);
   const call=async(path,data)=>{const r=data===undefined?await ctx.request.get(origin+'/games/nightshift/api/'+path):await ctx.request.post(origin+'/games/nightshift/api/'+path,{headers:{Origin:origin},data});assert.ok(r.ok(),'Native '+path+' HTTP '+r.status());return r.json();};
   let state=await call('state');
   const command=async action=>{state=await call('action',{session_id:state.session.id,expected_block:state.session.block_hash,action});};
   await command({type:'race',mode:1,vehicle:0,gadget:1,difficulty:0});
   const prediction=createGame();applyAction(prediction,{type:'race',mode:1,vehicle:0,gadget:1,difficulty:0});const driver={},early=[];
   while(prediction.tick<120){const bits=driveInput(prediction,driver);early.push(bits);step(prediction,bits);}
   await command({type:'ticks',inputs:early});assert.deepEqual(state.game,prediction);
   await p.reload();await p.waitForFunction(()=>__driftReview?.().loaded);await p.getByRole('button',{name:'Resume race',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);
   await p.waitForFunction(()=>!document.querySelector('#roadblock-guide').hidden);
   const earlyDistance=await p.evaluate(()=>__driftReview().roadblock.distance);assert.ok(earlyDistance>200);
   const box=await p.locator('#roadblock-guide').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=(touch?844:1920));
   assert.equal(await p.locator('#minimap .map-roadblock').evaluate(e=>e.style.display),'');
   const overlap=await p.evaluate(()=>{const e=document.querySelector('#telegraph'),prior=e.innerHTML,wasHidden=e.hidden;e.hidden=false;e.innerHTML='<span><b>↑</b></span><span><b>↓</b></span>';const b=document.querySelector('#roadblock-guide').getBoundingClientRect(),intersects=[...e.children].some(child=>{const a=child.getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;});e.innerHTML=prior;e.hidden=wasHidden;return intersects;});assert.equal(overlap,false,'Two incoming-attack cues do not overlap the roadblock artwork');
   await p.screenshot({path:out+(touch?'/touch-early.png':'/desktop-early.png')});
   await p.keyboard.press('KeyP');await p.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);state=await call('state');
   const g=structuredClone(state.game),tape=[];
   for(let n=0;n<1200&&!g.over;n++){
    const target=g.gap_lane===1?0:1000,delta=target-g.drift_x-g.steer_v*2;
    let bits=(delta>35?2:delta< -35?1:0)|(driveInput(g,{})&64),v=g.speed,stop=0;
    while(v>0){v=Math.max(0,v-32);stop+=Math.trunc(v/100);}
    if(g.roadblock_distance-g.distance<=stop+65||g.ability_ticks)bits=8|(bits&64);
    tape.push(bits);step(g,bits);
    if(g.speed===0&&roadblockThreat(g)?.phase==='reverse')break;
   }
   assert.equal(g.over,false);assert.equal(roadblockThreat(g)?.phase,'reverse');
   for(let i=0;i<tape.length;i+=120)await command({type:'ticks',inputs:tape.slice(i,i+120)});
   assert.deepEqual(state.game,g);const row=g.roadblock_distance,armor=g.shield;
   await p.reload();await p.waitForFunction(()=>__driftReview?.().loaded);await p.getByRole('button',{name:'Resume race',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);
   await p.keyboard.down('ArrowDown');await p.waitForFunction(()=>document.querySelector('#roadblock-guide').dataset.phase==='reverse');await p.screenshot({path:out+(touch?'/touch-reverse.png':'/desktop-reverse.png')});await p.keyboard.up('ArrowDown');
   const cdp=touch?await ctx.newCDPSession(p):null;
   let pad;
   const touchAt=async(type,x=0,y=.95)=>{if(!pad)pad=await p.locator('#joystick').boundingBox();const radius=pad.width*.35;await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:pad.x+pad.width/2+x*radius,y:pad.y+pad.height/2+y*radius,id:1}]});};
   if(touch){
    await touchAt('touchStart');await p.waitForFunction(()=>__driftReview().stick.reverse);
    await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>!__driftReview().running&&__driftReview().stick.owner===null&&!__driftReview().stick.reverse);
    const tick=await p.evaluate(()=>__driftReview().game.tick);await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>__driftReview().game.tick),tick);await p.screenshot({path:out+'/touch-rotation.png'});
    await touchAt('touchEnd');await p.setViewportSize({width:844,height:390});pad=null;await p.getByRole('button',{name:'Resume race',exact:true}).click();await p.waitForFunction(()=>__driftReview().running);await touchAt('touchStart');
   }else await p.keyboard.down('z');
   await p.waitForFunction(()=>__driftReview().game.speed< -200);
   const opening=roadblockThreat(g).opening,left=opening.x<g.drift_x;
   if(touch)await touchAt('touchMove',left?-.72:.72,.7);else await p.keyboard.down(left?'ArrowRight':'ArrowLeft');
   await p.waitForFunction(({left})=>left?__driftReview().game.drift_x<130:__driftReview().game.drift_x>1870,{left},{timeout:10000});
   if(touch){assert.equal(await p.evaluate(()=>__driftReview().stick.reverse),true);await touchAt('touchEnd');}
   else{await p.keyboard.up('z');await p.keyboard.up(left?'ArrowRight':'ArrowLeft');}
   await p.waitForFunction(()=>__driftReview().game.speed>=0);
   let held='';
   for(let n=0;n<180;n++){
    const s=await p.evaluate(()=>__driftReview());assert.equal(s.game.over,false);
    if(s.game.distance>row+90)break;
    const gap=roadblockThreat(s.game)?.opening,target=gap?.x??s.game.drift_x,d=target-s.game.drift_x-s.game.steer_v*2,key=d>45?'ArrowRight':d< -45?'ArrowLeft':'';
    if(key!==held){if(held)await p.keyboard.up(held);if(key)await p.keyboard.down(key);held=key;}
    await p.waitForTimeout(40);
   }
   if(held)await p.keyboard.up(held);
   const after=await p.evaluate(()=>__driftReview().game);assert.ok(after.distance>row+50);assert.equal(after.shield,armor);assert.equal(after.over,false);
   await p.keyboard.press('KeyP');await p.waitForFunction(()=>!__driftReview().pending&&!__driftReview().sending);
   const native=await call('state');assert.deepEqual(native.game,await p.evaluate(()=>__driftReview().game));assert.equal((await call('replay',{})).verified,true);
   await p.screenshot({path:out+(touch?'/touch-clear.png':'/desktop-clear.png')});
   runs.push({touch,earlyDistanceMetres:earlyDistance,stoppedDistanceMetres:roadblockThreat(g).distance,armorBefore:armor,armorAfter:after.shield,rowDistance:row,finalDistance:after.distance,nativeReplay:true,keyboard:'colemak'});
   checks.push(touch?'Trusted touch reverse/steer, portrait cancellation, clear and native replay':'Colemak keyboard reverse/steer, clear and native replay');
  }finally{if(logout)await logout();await ctx.close();}
 }
 assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({checks,runs,errors},null,2));console.log({checks,runs,errors});
}finally{await browser.close();}
