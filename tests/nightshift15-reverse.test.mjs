import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drive,REVERSE_LIMIT} from '../games/arcade/web/nightshift15-drive.mjs';
import {drive as oldDrive} from '../games/arcade/web/nightshift14-drive.mjs';
import {createGame,step} from '../games/arcade/web/nightshift15-rules.mjs';
import {packInput} from '../games/arcade/web/nightshift12-input.mjs';

test('all six cars back away at once and clear two metres in half a second',()=>{
 for(let vehicle=0;vehicle<6;vehicle++){
  const g=createGame();g.vehicle=vehicle;g.distance=10000;g.rivals.forEach(r=>r.finish=1);
  for(let tick=1;tick<=30;tick++){
   step(g,packInput(4,0,0,100));
   if(tick===3)assert.ok(g.distance<10000,'Creep starts within 100 ms');
   if(tick===15)assert.ok(10000-g.distance>=20,'Two metres by 500 ms, including the heavy car');
  }
  assert.ok(10000-g.distance>=70);assert.ok(g.speed>=-REVERSE_LIMIT);
 }
});
test('ordinary forward pedals retain the exact published V14 drivetrain',()=>{
 for(let vehicle=0;vehicle<6;vehicle++)for(const up of [[0,0,0],[3,0,3],[0,3,3]]){
  const a={vehicle,speed:0,drive_remainder:0,hull:2,stun:0,ability_ticks:0},b={...a};let seed=17;
  for(let n=0;n<900;n++){
   seed=seed*16807%2147483647;const control={throttle:seed%101,brake:n%80<5?100:0},flags=n%60<4?8:0;
   drive(a,control,flags,up);oldDrive(b,control,flags,up);assert.deepEqual(a,b);
  }
 }
});
test('changing direction brakes to zero and then pulls forward without a reverse launch exploit',()=>{
 for(let vehicle=0;vehicle<6;vehicle++){
  const g={vehicle,speed:-REVERSE_LIMIT,drive_remainder:0,hull:2,stun:0,ability_ticks:90};
  let stopped=-1;for(let tick=0;tick<30;tick++){drive(g,{throttle:100,brake:0},0,[0,0,0]);if(g.speed===0){stopped=tick;break;}assert.ok(g.speed<0);}
  assert.ok(stopped>=0&&stopped<30);g.ability_ticks=0;drive(g,{throttle:100,brake:0},0,[0,0,0]);assert.ok(g.speed>0);
  for(let tick=0;tick<180;tick++)drive(g,{throttle:100,brake:0},4|16,[3,0,3]);assert.equal(g.speed,-REVERSE_LIMIT);
 }
});
test('brake/handbrake/disable still inhibit reverse torque and the start line does not accumulate backward debt',()=>{
 for(const extra of [{control:{throttle:100,brake:100},flags:4},{control:{throttle:100,brake:0},flags:12},{control:{throttle:100,brake:0},flags:4,stun:30}]){
  const g={vehicle:0,speed:0,drive_remainder:0,hull:2,ability_ticks:0,stun:extra.stun||0};drive(g,extra.control,extra.flags,[0,0,0]);assert.equal(g.speed,0);
 }
 const g=createGame();g.rivals.forEach(r=>r.finish=1);for(let n=0;n<60;n++)step(g,packInput(4,0,0,100));assert.equal(g.distance,0);assert.equal(g.reverse_remainder,0);
});
test('a stopped car can back away, steer into the adjacent gap and pass a fixed barricade',()=>{
 const g=createGame();g.distance=10000;g.shield=1;g.rivals.forEach(r=>r.finish=1);g.body_seq=1;
 g.bodies=[{id:1,tag:8,x:1000,y:804,vx:0,vy:0,age:0,life:0,contact_cd:0}];
 const station=10026,advance=(flags,steering)=>{step(g,packInput(flags,steering,0,100));const obstacle=g.bodies.find(b=>b.id===1);assert.ok(obstacle);assert.equal(g.distance+830-obstacle.y,station,'The barricade never follows the car');assert.equal(g.over,false);};
 for(let n=0;n<15;n++)advance(4,0);assert.ok(g.distance<=9980);
 let ticks=0;while(g.drift_x>150&&ticks++<100)advance(4,Math.max(-100,Math.min(100,Math.round((g.drift_x+g.lateral_v*4)*.32))));
 assert.ok(g.drift_x<=150);ticks=0;while(g.distance<station+100&&ticks++<300)advance(0,Math.max(-100,Math.min(100,Math.round((-g.drift_x-g.lateral_v*4)*.32))));
 assert.ok(g.distance>=station+100);assert.equal(g.shield,1,'Escaping does not consume more armor or pass through the wall');
});
