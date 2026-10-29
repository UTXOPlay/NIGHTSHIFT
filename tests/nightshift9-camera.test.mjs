import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {ChaseCamera} from '../games/arcade/web/nightshift9-motion.mjs';
import {CircuitFrame} from '../games/arcade/web/nightshift9-course.mjs';
import {DriftRenderer} from '../games/arcade/web/nightshift9-renderer.mjs';

const options={reduced:false,preview:false,map:false,running:true};
const game=()=>({race_id:1,mode:0,speed:1800,ability_ticks:0,stun:0,side_v:0,tick:0});
function setup(mode=0,distance=0,aspect=16/9){
 const follow=new ChaseCamera(),camera=new T.PerspectiveCamera(56,aspect,.1,900),frame=new CircuitFrame(),g=game();
 camera.position.set(0,4.7,10.8);camera.lookAt(0,.7,-22);g.mode=mode;frame.set(mode,distance);
 return{follow,camera,frame,g};
}
function settle(s,x=0,opts=options,hz=60){for(let n=0;n<hz;n++)s.follow.draw(s.camera,s.frame,s.g,x,1/hz,opts);}

test('chase view keeps the car readable on every course without changing game state',()=>{
 const point=new T.Vector3();
 for(let mode=0;mode<12;mode++)for(const distance of [0,12000,42000,90000])for(const x of [-4,0,4]){
  const s=setup(mode,distance),before=JSON.stringify(s.g);settle(s,x);
  const p=s.frame.pose(0,x,.65);point.set(p.x,p.y,p.z).project(s.camera);
  assert.ok(Math.abs(point.x)<.7,`car horizontal framing ${mode}/${distance}/${x}: ${point.x}`);
  assert.ok(point.y>-.8&&point.y<.1,`car vertical framing ${mode}/${distance}/${x}: ${point.y}`);
  assert.equal(JSON.stringify(s.g),before);assert.ok(s.camera.position.toArray().every(Number.isFinite));
  const right=new T.Vector3(1,0,0).applyQuaternion(s.camera.quaternion);
  assert.ok(Math.abs(right.y)<1e-8,'bank and chassis roll do not tilt the horizon');
 }
});

test('all required sizes preserve inverse pointer mapping with the new follow pose',()=>{
 for(const [width,height]of [[1920,1080],[2560,1080],[2560,1440],[3840,2160],[844,390],[390,844]]){
  const s=setup(6,42000,width/height);settle(s,3.5);
  const car=s.frame.pose(0,3.5,.65),center=new T.Vector3(car.x,car.y,car.z).project(s.camera);assert.ok(Math.abs(center.x)<.7,'narrow-view anticipation keeps the car on screen');
  const r={camera:s.camera,canvas:{getBoundingClientRect:()=>({left:31,top:47,width,height})},course:s.frame,previewMode:false,ray:new T.Raycaster(),inputPlane:new T.Plane(new T.Vector3(0,0,1),0),point:new T.Vector3()};
  for(const x of [-3,0,3]){const p=s.frame.pose(0,x),v=new T.Vector3(p.x,p.y,p.z).project(s.camera),hit=DriftRenderer.prototype.pointer.call(r,31+(v.x+1)*width/2,47+(1-v.y)*height/2);assert.ok(Math.abs(hit.x-(500+x*250))<1e-7);assert.ok(Math.abs(hit.y-500)<1e-7);}
 }
});

test('follow targets and FOV settle consistently at 30, 60 and 120 Hz',()=>{
 const states=[30,60,120].map(hz=>{const s=setup(3,18000);settle(s,4,options,hz);s.g.speed=2400;s.g.ability_ticks=60;for(let n=0;n<hz*3;n++)s.follow.draw(s.camera,s.frame,s.g,4,1/hz,options);return s.camera;});
 for(const camera of states){assert.ok(camera.position.distanceTo(states[0].position)<.003);assert.ok(camera.quaternion.angleTo(states[0].quaternion)<.001);assert.ok(Math.abs(camera.fov-states[0].fov)<.003);assert.ok(camera.fov<65);}
});

test('track changes and restored races clear stale spring velocity',()=>{
 const s=setup();settle(s,-5);s.follow.x.velocity=100;s.follow.y.velocity=-100;s.follow.aimX.velocity=100;
 s.g.race_id++;s.g.mode=11;s.frame.set(11,70000);s.follow.draw(s.camera,s.frame,s.g,4,1/60,options);
 assert.ok(Math.abs(s.follow.x.value-s.follow.eye.x)<1e-9);assert.ok(Math.abs(s.follow.y.value-s.follow.eye.y)<1e-9);assert.equal(s.follow.x.velocity,0);
 s.follow.x.velocity=100;s.frame.set(11,0);s.follow.draw(s.camera,s.frame,s.g,-3,1/60,options);assert.equal(s.follow.x.velocity,0);
});

test('impact recovery is bounded, non-oscillating and suppressed in reduced motion',()=>{
 const s=setup();settle(s);const baseline=s.camera.position.clone();s.follow.impact({impact_nx:1,impact_nz:-1,impact_force:1800});
 let max=0;for(let n=0;n<120;n++){s.follow.draw(s.camera,s.frame,s.g,0,1/60,options);max=Math.max(max,s.camera.position.distanceTo(baseline));assert.ok(s.follow.kickX.value>=0);}
 assert.ok(max>.005&&max<.16);assert.ok(s.camera.position.distanceTo(baseline)<1e-6);
 s.follow.impact({impact_nx:1,impact_force:1800});settle(s,0,{...options,reduced:true});assert.equal(s.follow.kickX.value,0);assert.equal(s.follow.kickX.velocity,0);assert.equal(s.camera.fov,59);
});

test('garage-to-race transitions remain finite after a hitch and an immediate restart',()=>{
 const s=setup();settle(s,0,{...options,preview:true});const start=s.camera.position.clone();s.follow.draw(s.camera,s.frame,s.g,0,1/60,options);assert.ok(s.camera.position.distanceTo(start)<.1);
 s.g.race_id++;s.frame.set(0,0);s.follow.draw(s.camera,s.frame,s.g,0,2,options);
 assert.ok(s.camera.position.toArray().concat(s.camera.quaternion.toArray(),s.camera.fov).every(Number.isFinite));
 settle(s,0,{...options,reduced:true});s.g.ability_ticks=60;settle(s,0,{...options,reduced:true});assert.equal(s.camera.fov,59);
});

test('switchbacks, lane changes and boost do not snap the view',()=>{
 for(const mode of [0,3,6,11])for(const hz of [30,60,120]){
  const s=setup(mode,10000);settle(s);let previous=s.camera.quaternion.clone(),fov=s.camera.fov;
  for(let n=0;n<hz*12;n++){
   const t=n/hz;s.frame.set(mode,10000+t*540);s.g.tick=Math.floor(t*30);s.g.ability_ticks=t>4&&t<7?60:0;
   s.follow.draw(s.camera,s.frame,s.g,Math.sin(t*2)*4,1/hz,options);
   assert.ok(s.camera.quaternion.angleTo(previous)<.08,`angular step ${mode}/${hz}`);
   assert.ok(Math.abs(s.camera.fov-fov)<.5,`FOV step ${mode}/${hz}`);
   previous.copy(s.camera.quaternion);fov=s.camera.fov;
  }
 }
});
