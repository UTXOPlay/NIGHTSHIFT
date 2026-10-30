import {test}from'node:test';import assert from'node:assert/strict';
import {drive}from'../games/arcade/web/nightshift12-drive.mjs';
import {packInput,readInput,validInput}from'../games/arcade/web/nightshift12-input.mjs';
import {keyboardConfig,keyboardAction,keyboardPreset}from'../games/arcade/web/nightshift12-keyboard.mjs';
import {DrivingCoach}from'../games/arcade/web/nightshift12-driving-coach.mjs';
import {GamepadInput}from'../games/arcade/web/nightshift12-gamepad.mjs';
const state=(vehicle=0,speed=0)=>({vehicle,speed,throttle:0,brake:0,drive_remainder:0,stun:0,hull:2,ability_ticks:0});
const pedal=(g,gas=0,brake=0,flags=0,ticks=1)=>{for(let n=0;n<ticks;n++)drive(g,{throttle:gas,brake},flags,[0,0,0]);return g;};
test('V12 tape is disjoint, lossless for pedals and rejects reserved or malformed bits',()=>{
 for(const n of [0,127,1<<22,4207104,2**31,-1,1.4])assert.equal(validInput(n),false);
 for(let steer=-100;steer<=100;steer+=5)for(let gas=0;gas<=100;gas+=5)for(let brake=0;brake<=100;brake+=10){const n=packInput(127,steer,brake,gas);assert.ok(validInput(n));assert.deepEqual(readInput(n),{flags:127,steering:steer,brake,throttle:gas});assert.ok(!validInput(n|(1<<22)));}
 assert.ok(!validInput((1<<30)|(127<<23)));assert.ok(!validInput((1<<30)|(201<<7)));
});
test('all cars need gas, accelerate, coast smoothly and brake without changing direction',()=>{
 const launches=[];for(let car=0;car<6;car++){const g=state(car);pedal(g,0,0,0,300);assert.equal(g.speed,0);let ticks=0;while(g.speed<926&&ticks++<600)pedal(g,100);assert.ok(ticks>60&&ticks<240);launches.push(ticks);const speed=g.speed;pedal(g);const coast=g.speed;assert.ok(coast<speed&&coast>speed-5);pedal(g,0,100,0,180);assert.equal(g.speed,0);assert.equal(g.drive_remainder,0);}
 assert.ok(launches[4]<launches[2],'EV launches faster than armored GT');
});
test('fractional pedals move the car, both pedals favor braking, reverse shifts through rest',()=>{
 const slow=pedal(state(),10,0,0,60);assert.ok(slow.speed>0);
 const g=state(0,1200);pedal(g,100,100,0,30);assert.ok(g.speed<900);
 const signs=[];for(let n=0;n<200;n++){pedal(g,100,0,4);signs.push(Math.sign(g.speed));}assert.equal(g.speed,-350);assert.ok(signs.includes(0));
 const start=g.speed;pedal(g,100);assert.ok(g.speed>start);assert.ok(g.speed<=0);pedal(g,100,0,0,200);assert.ok(g.speed>0);
});
test('boost cancellation coasts down, braking and incapacitation never accelerate a car',()=>{
 const g=state(3,2300);pedal(g,0);assert.ok(g.speed>2250&&g.speed<2300,'no abrupt top-speed clamp');
 const stalled=state();stalled.stun=60;stalled.ability_ticks=60;pedal(stalled,100,0,0,60);assert.equal(stalled.speed,0);
 const h=state(0,1000);pedal(h,0,0,8,30);assert.ok(h.speed<900);
});
test('Colemak, arrow pedals and existing custom bindings survive the version change',()=>{
 const c=keyboardPreset('colemak');assert.equal(keyboardAction(c,{key:'r'})[0],'brake');assert.equal(keyboardAction(c,{key:'s'})[0],'right');assert.equal(keyboardAction(c,{key:'ArrowUp'})[0],'throttle');
 const old={preset:'colemak',custom:true,bindings:{left:'a',right:'s',drift:'r',reverse:'z',fire:'f',counter:'q',boost:'Space',pause:'p'}};
 const next=keyboardConfig(null,JSON.stringify(old));assert.equal(next.bindings.brake,'r');assert.equal(next.bindings.fire,'f');assert.equal(new Set(Object.values(next.bindings)).size,10);
});
test('driving practice starts with meaningful acceleration and requires actual brake and boost effects',()=>{
 const coach=new DrivingCoach();assert.equal(coach.hint({}).action,'throttle');for(let n=0;n<25;n++)coach.observe({tick:n,speed:n},{tick:n+1,speed:n+1,drift_x:0},packInput(0,0,0,100));assert.equal(coach.stage,1);
 for(let n=0;n<20;n++)coach.observe({tick:n,speed:800,drift_x:0},{tick:n+1,speed:800,drift_x:1},packInput(0,50,0,100));assert.equal(coach.stage,2);
 for(let n=0;n<10;n++)coach.observe({tick:n,speed:800},{tick:n+1,speed:790},packInput(0,0,100,0));assert.equal(coach.stage,3);
 coach.observe({tick:1,ability_ticks:0},{tick:2,ability_ticks:70},packInput(16,0,0,100));assert.equal(coach.stage,4);
});
