import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,applyAction,step,readableRoadblockSite} from '../games/arcade/web/nightshift10-rules.mjs';
import {resolveObstacleActors} from '../games/arcade/web/nightshift10-roadblocks.mjs';
import {roadblockOpening,roadblockThreat,joystickDrive} from '../games/arcade/web/nightshift9-recovery.mjs';
const block=(x,y=800,id=x+1)=>({id,x,y,vx:0,vy:0,tag:8,age:0,life:0,contact_cd:0});
const fixture=()=>{const g=createGame();g.distance=10000;g.speed=0;g.rivals.forEach(r=>r.finish=1);return g;};

test('each roadblock is committed ahead of all actors on a readable site and never follows the player',()=>{
 for(const mode of [1,5,9]){
  const g=createGame();applyAction(g,{type:'race',mode,vehicle:0,gadget:0,difficulty:0});
  let spawned=false;
  for(let n=0;n<1800&&!spawned;n++){
   const previous=g.roadblock_seq;step(g,0);
   if(previous===g.roadblock_seq)continue;
   const row=g.bodies.filter(b=>b.tag===8),front=Math.max(g.distance,...g.rivals.filter(r=>!r.finish).map(r=>r.distance));
   assert.ok(g.roadblock_distance-front>=3000);
   assert.ok(readableRoadblockSite(g.roadblock_distance,mode));
   assert.ok(row.every(b=>g.distance+830-b.y===g.roadblock_distance));
   assert.ok(row.every(b=>Math.abs(b.x-g.gap_lane*1000)>=1000));
   const absolute=g.roadblock_distance;
   for(let j=0;j<60;j++)step(g,4);
   assert.ok(row.every(b=>g.distance+830-b.y===absolute));spawned=true;
  }
  assert.ok(spawned,'Pursuit mode '+mode+' offers a roadblock');
 }
});

test('every generated opening clears the full static-contact vehicle envelope',()=>{
 for(let lane=0;lane<3;lane++){
  const g=fixture();g.drift_x=lane*1000;g.bodies=[0,1000,2000].filter(x=>x!==lane*1000).map(x=>block(x));
  const gap=roadblockOpening(g);assert.ok(gap);assert.ok(gap.width>200);
  for(const b of g.bodies)assert.ok(Math.abs(gap.x-b.x)>715);
  const copy=structuredClone(g);assert.equal(roadblockThreat(g).lanes[lane],true);assert.deepEqual(g,copy);
 }
 const g=fixture();g.bodies=[0,1000,2000].map(x=>block(x));assert.equal(roadblockOpening(g),null);assert.equal(roadblockThreat(g).phase,'blocked');
});

test('rivals and traffic cannot tunnel through a static barrier, including during recovery',()=>{
 for(const recovering of [0,45]){
  const g=fixture();const r=g.rivals[0];Object.assign(r,{finish:0,x:1000,distance:10050,speed:2500,recover:recovering,side_v:0});
  g.bodies=[block(1000,790)];const before={rivals:[{x:1000,distance:10000}],bodies:new Map()};let damage=0;
  resolveObstacleActors(g,before,()=>damage++);
  assert.ok(r.distance<=10015);assert.ok(r.speed<0);assert.equal(damage,1);
 }
 const g=fixture(),car={...block(1000,780,7),tag:1,vy:25};g.bodies=[block(1000,790),car];
 resolveObstacleActors(g,{rivals:[],bodies:new Map([[car,{x:1000,distance:10000}]])},()=>{});
 assert.ok(g.distance+830-car.y<=10015);assert.ok(car.vy<=0);
});

test('rows remain physical for trailing rivals after the player has passed',()=>{
 const g=fixture();g.distance=10500;const r=g.rivals[0];Object.assign(r,{finish:0,x:1000,target:1000,distance:10000,speed:1600});
 g.bodies=[block(1000,1290)];step(g,8);assert.equal(g.bodies.filter(b=>b.tag===8).length,1);
 assert.ok(r.distance<=10015);
});

test('a straight-down reverse latch survives steering and clears on release',()=>{
 let d=joystickDrive({x:0,y:.95,speed:0,steer:0,turn:58});assert.equal(d.reverse,true);assert.equal(d.bits&4,4);
 d=joystickDrive({x:-.8,y:.6,speed:-200,steer:0,turn:58,reverse:d.reverse});assert.equal(d.reverse,true);assert.equal(d.bits&7,6);
 d=joystickDrive({x:-.8,y:0,speed:-200,steer:0,turn:58,reverse:d.reverse});assert.equal(d.reverse,false);assert.equal(d.bits&4,0);
 assert.equal(joystickDrive({x:.8,y:.95,speed:0,steer:0,turn:58}).reverse,false);
});

test('ordinary touch-equivalent inputs reverse, steer out and drive beyond an intact roadblock',()=>{
 const g=fixture();g.bodies=[block(1000),block(2000)];const rowDistance=10030;let reverse=false;
 assert.equal(roadblockThreat(g).phase,'reverse');
 for(let n=0;n<115;n++){const d=joystickDrive({x:n<35?0:-.8,y:.95,speed:g.speed,steer:g.steer_v,turn:58,reverse});reverse=d.reverse;step(g,d.bits);}
 assert.ok(g.drift_x<200);assert.ok(g.distance<9900);assert.equal(g.over,false);
 for(let n=0;n<250&&!g.over&&g.distance<rowDistance+100;n++){
  const gap=roadblockOpening(g),target=gap?.x??g.drift_x,delta=target-g.drift_x-g.steer_v*2;
  step(g,delta>45?2:delta< -45?1:0);
 }
 assert.equal(g.over,false);assert.ok(g.distance>rowDistance+50);assert.equal(g.shield,1);
});
