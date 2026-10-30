import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,applyAction,step,contractGate} from '../games/arcade/web/nightshift14-rules.mjs';
import {createRival,planRival,updateRivals,trafficSpawnPoint} from '../games/arcade/web/nightshift14-rivals.mjs';
import {drive,steer} from '../games/arcade/web/nightshift14-drive.mjs';
import {combatActor,clearShot,forwardShot} from '../games/arcade/web/nightshift14-weapons.mjs';
import {packInput} from '../games/arcade/web/nightshift12-input.mjs';
const flat=()=>0;
const bodyAt=(g,x,distance,tag=8,id=1)=>({id,tag,x,y:g.distance+830-distance,vx:0,vy:0,age:0,life:0,contact_cd:0});
function isolated(id=0){
 const g=createGame();g.distance=-10000;g.rivals.forEach(r=>r.finish=1);
 const r=g.rivals[id];r.finish=0;r.distance=0;r.x=1000;r.speed=1500;r.cooldown=10000;
 return {g,r};
}
test('a distant human cannot alter a rival drivetrain or teleport it back into the pack',()=>{
 const {g,r}=isolated();const other=structuredClone(g);other.distance=-80000;other.speed=2400;
 for(let n=0;n<180;n++){g.tick++;other.tick++;const before=r.distance;updateRivals(g,flat,135000);updateRivals(other,flat,135000);assert.deepEqual(r,other.rivals[0]);assert.equal(r.distance-before,Math.trunc(r.speed/100));}
});
test('all six AI bodies obey the same pedals and lateral integration as the player',()=>{
 for(let vehicle=0;vehicle<6;vehicle++){
  const {g,r}=isolated();Object.assign(r,{vehicle,upgrades:[1,1,1],plan_wait:100,desired_speed:900,target:400,lateral_v:8,steer_v:20,heading:30,side_v:16});
  const before=structuredClone(r);g.tick=1;updateRivals(g,flat,135000);const expected={...before,side_v:Math.trunc(before.side_v*.88)};
  const feed={steering:Math.max(-100,Math.min(100,Math.trunc((r.target-expected.x-expected.lateral_v*4-Math.trunc(expected.side_v/4)*3)*.32))),throttle:r.throttle,brake:r.brake};
  expected.x+=steer(expected,feed,0,r.upgrades,0);drive(expected,feed,0,r.upgrades);
  assert.ok(r.brake>0);assert.equal(r.throttle,0);for(const key of ['speed','drive_remainder','x','heading','lateral_v','steer_v','slip_angle'])assert.equal(r[key],expected[key],`${vehicle}: ${key}`);
 }
});
test('unobstructed racing lines are continuous rather than three lane centers',()=>{
 const {g,r}=isolated();const p=planRival(g,r,()=>3);assert.ok(![0,1000,2000].includes(p.line));assert.ok(p.line>=0&&p.line<=2000);
});
test('a committed pass keeps its side until clear, while safety can override it',()=>{
 const {g,r}=isolated();const front=g.rivals[1];Object.assign(front,{finish:0,x:1000,distance:450,speed:900});
 Object.assign(r,{x:0,target:0,brain:2,intent_ticks:45,pass_side:-1,pass_target:front.id});
 assert.ok(planRival(g,r,flat).line<front.x);
 g.bodies=[bodyAt(g,0,200)];
 const safe=planRival(g,r,flat);assert.ok(safe.line>0||safe.speed<r.speed,'cover forces an avoidance line or braking');
});
test('a defender holds one early move, then yields the overlapping car and keeps its cooldown',()=>{
 const {g,r}=isolated(1);g.difficulty=1;g.distance=-500;g.speed=1800;g.drift_x=300;
 g.tick=1;updateRivals(g,flat,135000);assert.equal(r.brain,3);const committed=r.target;
 for(let n=0;n<20;n++){g.tick++;g.distance=r.distance-500;updateRivals(g,flat,135000);assert.equal(r.brain,3);assert.equal(r.target,committed);}
 g.distance=r.distance-100;g.tick++;updateRivals(g,flat,135000);assert.notEqual(r.brain,3);assert.ok(r.defense_cd>200);
});
test('an unavoidable visible row triggers braking and a stop before physical contact',()=>{
 const {g,r}=isolated();g.bodies=[0,1000,2000].map((x,id)=>bodyAt(g,x,1000,8,id));let brakes=0;
 for(let n=0;n<220;n++){g.tick++;updateRivals(g,flat,135000);brakes+=r.brake>0;assert.ok(r.distance<975,'AI crossed a solid row');}
 assert.ok(brakes>30);assert.ok(r.speed<35);
});
test('nitrous cannot appear on the former timer and each activation spends charge',()=>{
 const {g,r}=isolated();Object.assign(r,{charge:0,plan_wait:100,brain:0,desired_speed:1700});g.tick=540;updateRivals(g,flat,135000);assert.equal(r.boost,0);
 Object.assign(r,{charge:300,plan_wait:100,brain:2,desired_speed:1700,speed:1500});g.tick++;updateRivals(g,flat,135000);assert.ok(r.boost>0);assert.equal(r.charge,0);assert.equal(r.boost_wait,150);
});
test('traffic streams ahead of separated leaders and stays under its explicit population budget',()=>{
 const {g,r}=isolated();g.distance=0;g.speed=0;r.distance=10000;r.speed=1500;g.tick=136;
 assert.equal(trafficSpawnPoint(g,135),13000);
 g.bodies=Array.from({length:32},()=>({tag:1}));assert.equal(trafficSpawnPoint(g,135),null);
});
test('a stretched chain of racers cannot merge every occupied road section into the leader section',()=>{
 const {g,r}=isolated();g.distance=0;g.speed=1500;r.distance=2000;r.speed=1500;
 Object.assign(g.rivals[1],{finish:0,distance:4000,speed:1500});g.tick=1;assert.equal(trafficSpawnPoint(g,135),5000);
 g.tick=136;assert.equal(trafficSpawnPoint(g,135),7000);
});
test('the player and AI cannot acquire EMP through a vehicle or solid roadblock',()=>{
 const {g,r}=isolated();g.distance=10000;g.drift_x=1000;r.distance=10400;
 const source=combatActor(g,-1);assert.ok(forwardShot(g,source,r));
 for(const tag of [1,8]){g.bodies=[{id:1,tag,x:1000,y:830-200,vx:0,vy:0}];assert.equal(clearShot(g,source,r),false);assert.equal(forwardShot(g,source,r),false);g.bodies[0].x=0;assert.ok(forwardShot(g,source,r));}
 g.bodies=[];Object.assign(g.rivals[2],{finish:0,x:1000,distance:10200});assert.equal(clearShot(g,source,r),false);
});
test('forward EMP cannot lock backwards; cover interrupts a windup without damaging the player',()=>{
 const {g,r}=isolated();g.distance=10400;g.drift_x=1000;g.tick=181;r.distance=10000;r.speed=0;r.cooldown=0;r.ammo=4;
 const idle=packInput(0,0,0,0);step(g,idle);assert.equal(r.windup,42);assert.equal(r.ammo,2);
 g.bodies=[bodyAt(g,1000,10200)];
 step(g,idle);assert.equal(r.windup,0);assert.equal(g.hull,2);assert.ok(g.events.some(e=>e.kind==='cancel'));
 g.bodies=[];r.distance=g.distance+400;r.cooldown=0;step(g,idle);assert.equal(r.windup,0);assert.equal(r.ammo,2);
});
test('a stock opening race configures bounded distinct car builds',()=>{
 const g=createGame();applyAction(g,{type:'race',mode:0,vehicle:0,gadget:0,difficulty:0});assert.deepEqual(g.rivals.map(r=>r.vehicle),[1,2,3,4,5]);assert.ok(g.rivals.every(r=>r.upgrades.reduce((a,b)=>a+b,0)<=6));assert.equal('pace' in g,false);assert.deepEqual(createRival(0).upgrades,[0,0,0]);
});
test('interception targets occupy fixed gates and launch under power without relocation',()=>{
 const g=createGame();applyAction(g,{type:'race',mode:3,vehicle:0,gadget:0,difficulty:0});
 for(let rank=0;rank<2;rank++){
  const r=g.rivals[(rank+g.mode+g.race_id)%5],gate=contractGate(g,rank),distance=r.distance;
  assert.equal(distance,gate-500);assert.equal(r.release_at,gate-3000);assert.equal(r.staged,1);assert.equal(r.brain,6);
  g.distance=r.release_at-1;updateRivals(g,flat,140000);assert.equal(r.staged,1);assert.equal(r.distance,distance);assert.equal(r.throttle,0);
  g.distance=r.release_at;const launches=[];updateRivals(g,flat,140000,id=>launches.push(id));assert.equal(r.staged,0);assert.equal(r.distance,distance);assert.ok(r.speed>0&&r.speed<20);assert.ok(launches.includes(r.id));
 }
});
test('courier cruise limits are fixed by event difficulty, never by the human speed',()=>{
 const {g,r}=isolated();g.mode=11;r.release_at=151000;
 for(let difficulty=0;difficulty<3;difficulty++){
  g.difficulty=difficulty;g.speed=0;const slow=planRival(g,r,flat);g.speed=2500;const fast=planRival(g,r,flat);
  assert.equal(slow.speed,fast.speed);assert.ok(slow.speed<=[1540,1680,1820][difficulty]);
 }
});
