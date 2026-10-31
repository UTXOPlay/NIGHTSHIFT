import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {animateRig,resetRig} from '../games/arcade/web/nightshift9-motion.mjs';
import {fleetFinish} from '../games/arcade/web/nightshift141-fleet-surface.mjs';
import {installWheelMotion} from '../games/arcade/web/nightshift142-wheel-surface.mjs';
import {disposeSceneResources} from '../games/arcade/web/nightshift9-engine.mjs';

function coarse(){const car=new T.Group();car.userData.brakeMaterial=fleetFinish('#446677',null);car.userData.wheelMotion={value:new T.Vector2()};return car;}
test('low-detail actors show held brakes and distance-based wheels without modifying driving state',()=>{
 for(const hz of [30,60,120]){
  const car=coarse(),g=Object.freeze({speed:0,brake:100,distance:0,steer_v:0});
  for(let n=0;n<hz;n++)animateRig(car,g,1/hz);
  assert.ok(car.userData.brakeMaterial.userData.brake.value>.999);assert.equal(car.userData.rig,undefined);
  animateRig(car,Object.freeze({speed:1000,brake:0,distance:7,steer_v:50}),1/hz);
  assert.ok(Math.abs(car.userData.wheelMotion.value.x-.7)<1e-9);assert.equal(car.userData.wheelMotion.value.y,-.15);
  assert.deepEqual(car.position.toArray(),[0,0,0]);assert.deepEqual(g,{speed:0,brake:100,distance:0,steer_v:0});
  resetRig(car);assert.equal(car.userData.motionState.lastSpeed,null);assert.equal(car.userData.brakeMaterial.userData.brake.value,0);
 }
});
test('a far LOD keeps the same brake and wheel phase as its active actor',()=>{
 const car=coarse(),far=car.userData.far=coarse();
 animateRig(car,{speed:900,brake:100,distance:213,steer_v:-70},1/30);
 assert.equal(car.userData.brakeMaterial.userData.brake.value,far.userData.brakeMaterial.userData.brake.value);
 assert.deepEqual(car.userData.wheelMotion.value.toArray(),far.userData.wheelMotion.value.toArray());
 resetRig(car);assert.equal(far.userData.brakeMaterial.userData.brake.value,0);assert.deepEqual(far.userData.wheelMotion.value.toArray(),[0,0]);
});
test('wheel-deformed depth and distance materials are released with shared scene resources',()=>{
 const root=new T.Group(),geometry=new T.BoxGeometry(),material=fleetFinish('#446677',null);
 geometry.setAttribute('wheelRig',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*4),4));
 const mesh=new T.Mesh(geometry,material);root.add(mesh);installWheelMotion(mesh,material,{value:new T.Vector2()});
 const released=[];for(const m of [material,mesh.customDepthMaterial,mesh.customDistanceMaterial])m.addEventListener('dispose',()=>released.push(m));
 disposeSceneResources([root,root]);assert.equal(released.length,3);assert.equal(new Set(released).size,3);
});
