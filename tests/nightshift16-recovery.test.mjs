import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,step} from '../games/arcade/web/nightshift16-rules.mjs';
import {createGame as oldGame,step as oldStep} from '../games/arcade/web/nightshift15-rules.mjs';
import {guideTraffic} from '../games/arcade/web/nightshift16-traffic.mjs';
import {guideTraffic as oldGuide} from '../games/arcade/web/nightshift10-roadblocks.mjs';
import {packInput} from '../games/arcade/web/nightshift12-input.mjs';

function fixture(make=createGame,vehicle=0){const g=make();g.vehicle=vehicle;g.distance=10000;g.rivals.forEach(r=>r.finish=1);g.bodies=[{id:1,tag:1,x:1000,y:900,vx:0,vy:6,life:0,age:0,contact_cd:0,yield_lane:-1}];g.body_seq=1;return g;}
test('rear traffic releases motor pressure and leaves a reversing player room to recover',()=>{
 for(let vehicle=0;vehicle<6;vehicle++){
  const g=fixture(createGame,vehicle),old=fixture(oldGame,vehicle),input=packInput(4,0,0,100);
  for(let n=0;n<150;n++){step(g,input);oldStep(old,input);assert.ok(g.speed<=0,'Rear traffic must not propel reverse into forward motion');assert.equal(g.over,false);}
  assert.ok(g.distance<9850);assert.ok(old.speed>100,'The historical rule reproduces persistent rear pushing');
  assert.ok(g.bodies[0].x<250,'Traffic takes a free lane instead of remaining attached to the bumper');
 }
});
test('rear traffic holds when both adjacent lanes are physically occupied',()=>{
 const g=fixture();g.speed=-100;g.bodies.push({id:2,tag:8,x:0,y:900,vx:0,vy:0,life:0,age:0},{id:3,tag:8,x:2000,y:900,vx:0,vy:0,life:0,age:0});
 for(let n=0;n<60;n++){g.tick++;guideTraffic(g,g.bodies[0]);assert.equal(g.bodies[0].vx,0);assert.equal(g.bodies[0].x,1000);assert.ok(g.bodies[0].vy<=0);assert.ok(g.bodies[0].life<=150);}
});
test('normal forward traffic keeps the published guidance exactly',()=>{
 const g=fixture();g.bodies.push({id:2,tag:8,x:1000,y:100,vx:0,vy:0,life:0,age:0});
 for(let tick=0;tick<900;tick++){g.tick=tick;g.speed=tick%1700;const a={...g.bodies[0],life:0,x:tick%2000,y:tick%2400-300,vy:tick%10-2,vx:tick%13-6},b={...a};oldGuide(g,a);guideTraffic(g,b);assert.deepEqual(b,a);}
});
test('yielding traffic resumes cruise gradually once the lane is clear',()=>{
 const g=fixture();g.speed=1000;g.drift_x=0;const car=g.bodies[0];car.life=40;car.vy=0;
 for(let n=1;n<=35;n++){g.tick=n;const before=car.vy;guideTraffic(g,car);assert.ok(car.vy>=before&&car.vy<=before+1);if(n%10)assert.equal(car.vy,before);}
 assert.equal(car.vy,3);assert.ok(car.life>=0);
});
