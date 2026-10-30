import test from 'node:test';
import assert from 'node:assert/strict';
import {GamepadInput,stickAxis,gamepadBits,focusTarget} from '../games/arcade/web/nightshift-gamepad.mjs';
import {DrivingCoach} from '../games/arcade/web/nightshift-driving-coach.mjs';
const pad=(index=0)=>({index,connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({value:0}))});
test('Controller deadzone rejects invalid readings and preserves useful steering range',()=>{
 for(const n of [0,.15,-.18,NaN,undefined,Infinity])assert.equal(stickAxis(n),0);
 assert.equal(stickAxis(1),1);assert.equal(stickAxis(-2),-1);assert.ok(Math.abs(stickAxis(.59)-.5)<1e-12);
});
test('Hot-plugged or suspended held controls require neutral before activation',()=>{
 const input=new GamepadInput(),p=pad();p.buttons[7].value=1;
 assert.equal(input.poll([p]).active,false);p.buttons[7].value=0;input.poll([p]);p.buttons[7].value=1;
 assert.equal(input.poll([p]).boost,true);input.suspend();assert.equal(input.poll([p]).active,false);
 p.buttons[7].value=0;input.poll([p]);p.axes[0]=.7;assert.equal(input.poll([p]).active,true);
});
test('Pause and selection are edges; menu navigation repeats at a bounded cadence',()=>{
 const input=new GamepadInput(),p=pad();input.poll([p]);p.buttons[9].value=1;
 assert.equal(input.poll([p]).pause,true);assert.equal(input.poll([p]).pause,false);p.buttons[9].value=0;input.poll([p]);
 p.axes[0]=1;assert.equal(input.poll([p],{now:1}).direction,'right');assert.equal(input.poll([p],{now:399}).direction,null);assert.equal(input.poll([p],{now:401}).direction,'right');assert.equal(input.poll([p],{now:450}).direction,null);
});
test('A second pad cannot steal control; disconnect reports loss once and clears outputs',()=>{
 const input=new GamepadInput(),a=pad(),b=pad(1);input.poll([a,b]);a.axes[0]=.7;assert.equal(input.poll([a,b]).index,0);b.buttons[7].value=1;assert.equal(input.poll([a,b]).index,0);
 const lost=input.poll([null,b]);assert.equal(lost.lost,true);assert.equal(lost.boost,false);assert.equal(input.poll([null,b]).lost,false);
});
test('Nonstandard pads are ignored and disabled polling cannot send race actions',()=>{
 const input=new GamepadInput(),p=pad();p.mapping='';assert.equal(input.poll([p]).connected,false);p.mapping='standard';input.poll([p]);p.axes[0]=1;
 assert.equal(input.poll([p],{enabled:false}).active,false);assert.equal(input.poll([p]).active,false);
});
test('Controller race controls use valid legacy tapes and direct reverse steering',()=>{
 const sample={active:true,x:-1,brake:1,reverse:true,boost:true,fire:true,counter:true};
 assert.equal(gamepadBits(sample,{steer_v:0,speed:1000},70),125);assert.equal(gamepadBits(sample,{steer_v:0,speed:-200},70),126);
 assert.equal(gamepadBits({...sample,active:false},{steer_v:0,speed:0},70),0);
});
test('Spatial navigation follows thumbnail columns instead of DOM order',()=>{
 const rects=[{left:0,right:40,top:0,bottom:40},{left:60,right:100,top:0,bottom:40},{left:0,right:40,top:60,bottom:100}];
 assert.equal(focusTarget(rects,0,'down'),2);assert.equal(focusTarget(rects,0,'right'),1);assert.equal(focusTarget(rects,0,'up'),0);assert.equal(focusTarget(rects,-1,'down'),0);
});
test('Practice advances through observed driving, braking and a real boost activation',()=>{
 const c=new DrivingCoach();let tick=0;const before=()=>({tick:tick++,speed:1000,drift_x:1000,ability_ticks:0});
 for(let n=0;n<25;n++){const b=before();c.observe(b,{...b,tick:b.tick+1,drift_x:1000},1);}assert.equal(c.stage,0);
 for(let n=0;n<20;n++){const b=before();c.observe(b,{...b,tick:b.tick+1,drift_x:990},1);}assert.equal(c.stage,1);
 for(let n=0;n<10;n++){const b=before();c.observe(b,{...b,tick:b.tick+1,speed:970},8);}assert.equal(c.stage,2);
 let b=before();c.observe(b,{...b,tick:b.tick+1,ability_ticks:40},0);assert.equal(c.stage,2);
 b=before();c.observe(b,{...b,tick:b.tick+1,ability_ticks:40},16);assert.equal(c.stage,3);
 const hint=new DrivingCoach({stage:2});assert.equal(hint.hint({charge:299,nitro:0}).label,'DRIFT / DRAFT');assert.equal(hint.hint({charge:300,nitro:0}).label,'BOOST');assert.equal(hint.hint({charge:0,nitro:1}).label,'BOOST');assert.deepEqual(new DrivingCoach(c.snapshot()).snapshot(),c.snapshot());c.reset();c.dismiss();b=before();c.observe(b,{...b,tick:b.tick+1,drift_x:990},1);assert.equal(c.ticks,0);
});
