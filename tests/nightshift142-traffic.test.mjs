import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TrafficSlots,TRAFFIC_CAPACITY,trafficInView} from '../games/arcade/web/nightshift142-traffic.mjs';
import {createGame,applyAction,step} from '../games/arcade/web/nightshift14-rules.mjs';
import {driveInput} from './helpers/nightshift14-driver.mjs';
import {packInput} from '../games/arcade/web/nightshift12-input.mjs';
const car=(id,y=500)=>Object.freeze({id,tag:1,x:1000,y,vx:0,vy:8});
test('all 32 authoritative traffic actors keep identity after reordering and removal',()=>{
 const slots=new TrafficSlots(),bodies=Array.from({length:TRAFFIC_CAPACITY},(_,id)=>car(id,id<16?-20000:500));
 slots.update(bodies,{version:14,race:1});const identities=new Map(bodies.map(b=>[b.id,slots.get(b).index]));
 assert.equal(slots.snapshot().assigned,32);assert.equal(slots.snapshot().droppedVisible,0);
 const retained=[...bodies].reverse().filter(b=>b.id!==3);
 slots.update(retained,{version:14,race:1,tick:1});for(const b of retained)assert.equal(slots.get(b).index,identities.get(b.id));
 const fresh=car(33);slots.update([...retained,fresh],{version:14,race:1,tick:2});assert.equal(slots.get(fresh).index,identities.get(3));assert.equal(slots.entries.size,32);
});
test('historical actors without IDs retain visible slots through cloned state and motion',()=>{
 const slots=new TrafficSlots(),before=[{tag:1,x:0,y:500,vx:0,vy:8},{tag:1,x:2000,y:600,vx:-1,vy:9}];
 slots.update(before,{distance:1000,tick:100});const keys=before.map(b=>slots.get(b).key);
 const after=before.map(b=>Object.freeze({...b,x:b.x+b.vx*2,y:b.y+30-b.vy*2}));
 slots.update([...after].reverse(),{distance:1030,tick:102});assert.equal(slots.get(after[0]).key,keys[0]);assert.equal(slots.get(after[1]).key,keys[1]);assert.ok(after.every(b=>!Object.hasOwn(b,'id')));
 slots.update([],{distance:1030,tick:102});assert.equal(slots.entries.size,0);
});
test('overflow outside the camera cannot displace nearby traffic and reset cannot retain old bindings',()=>{
 const slots=new TrafficSlots(),bodies=Array.from({length:100},(_,id)=>car(id,id<98?-20000:820));
 slots.update(bodies,{version:14,race:2,tick:100});for(const b of bodies.filter(trafficInView))assert.ok(slots.get(b));assert.equal(slots.snapshot().droppedVisible,0);assert.equal(slots.entries.size,32);
 slots.update([car(500)],{version:14,race:3,tick:0});assert.equal(slots.entries.size,1);assert.equal(slots.snapshot().actors[0].id,500);
});
test('the native-parity audit input no longer loses near traffic or changes surviving actor slots',()=>{
 const g=createGame(),slots=new TrafficSlots();applyAction(g,{type:'race',mode:0,vehicle:0,gadget:1,difficulty:0});
 const state={};let max=0,nearSamples=0,previous=new Map();
 while(!g.over){const seconds=g.tick/30;step(g,seconds>60&&seconds<135?packInput(0,0,100,0):driveInput(g,state));slots.update(g.bodies,{distance:g.distance,tick:g.tick,race:g.race_id,version:g.physics_version});
  const bodies=g.bodies.filter(b=>b.tag===1||b.tag===9),next=new Map();max=Math.max(max,bodies.length);
  for(const b of bodies){const entry=slots.get(b);assert.ok(entry,'Every authoritative traffic actor has a slot');next.set(b.id,entry.index);if(previous.has(b.id))assert.equal(entry.index,previous.get(b.id));if(b.y>300&&b.y<1000){nearSamples++;assert.ok(entry.index<TRAFFIC_CAPACITY);}}
  previous=next;assert.equal(slots.droppedVisible,0);
 }
 assert.ok(max>16);assert.ok(nearSamples>1000);
});
