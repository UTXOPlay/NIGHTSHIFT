import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {spring,prepareRig,animateRig,groundRig} from '../games/arcade/web/nightshift9-motion.mjs';
import {ContactTrail} from '../games/arcade/web/nightshift9-trails.mjs';
import {CircuitFrame} from '../games/arcade/web/nightshift9-course.mjs';

test('damped presentation has the same response across rendering cadences',()=>{
 const states=[30,60,120].map(hz=>{const s={value:0,velocity:2};for(let n=0;n<hz;n++)spring(s,.08,9,1/hz);return s;});
 for(const s of states){assert.ok(Math.abs(s.value-states[0].value)<1e-12);assert.ok(Math.abs(s.velocity-states[0].velocity)<1e-12);}
});
test('ribbon density and positions follow distance, independent of frames',()=>{
 const runs=[30,60,120].map(hz=>{const trail=new ContactTrail(.8),segments=[];for(let n=0;n<=hz*2;n++)trail.sample({x:n/hz,at:n/hz*500},(a,b)=>segments.push({a,b}));return segments;});
 for(const r of runs){assert.equal(r.length,runs[0].length);for(let n=0;n<r.length;n++){assert.ok(Math.abs(r[n].b.x-runs[0][n].b.x)<1e-9);assert.ok(Math.abs(r[n].b.at-runs[0][n].b.at)<1e-8);}}
 const t=new ContactTrail();t.sample({x:0,at:0},()=>{});t.sample({x:0,at:20},()=>{});t.reset();assert.equal(t.anchor,null);let count=0;t.sample({x:0,at:20000},()=>count++);assert.equal(count,0);
});
test('moving chassis can roll while every tire stays on a banked and graded road',()=>{
 const car=new T.Group();car.add(new T.Mesh(new T.BoxGeometry(2,.6,4)));car.userData.wheels=[];
 for(const x of [-.9,.9])for(const z of [-1.4,1.4]){const w=new T.Mesh(new T.CylinderGeometry(.33,.33,.22,20).rotateZ(Math.PI/2));w.position.set(x,.33,z);car.add(w);car.userData.wheels.push(w);}prepareRig(car);
 const frame=new CircuitFrame();for(const mode of [0,3,6,8,11])for(const distance of [0,7000,27000]){
  frame.set(mode,distance);const g={speed:1600,steer_v:70,side_v:600,drifting:1,distance};car.position.set(1,0,0);car.rotation.set(0,.17,0);animateRig(car,g,1/30,{distance});frame.project(car.position);frame.orient(car,0);groundRig(car,frame);assert.equal(car.userData.rig.contacts.length,4);
  car.updateMatrixWorld(true);for(const w of car.userData.wheels){const p=new T.Vector3(),r=new T.Vector3(),attr=w.geometry.attributes.position;let min=Infinity;for(let n=0;n<attr.count;n++){p.fromBufferAttribute(attr,n).applyMatrix4(w.matrixWorld);frame.unproject(p,r);min=Math.min(min,r.y);}assert.ok(Math.abs(min)<.015,`mode ${mode}, distance ${distance}: ${min}`);}
 }assert.ok(Math.abs(car.userData.rig.body.rotation.z)>.01);
});
test('body weight transfers outward in a turn and rearward under acceleration',()=>{
 const car=new T.Group();car.add(new T.Mesh(new T.BoxGeometry(2,1,4)));const wheel=new T.Mesh(new T.BoxGeometry(.2,.6,.6));wheel.position.set(1,.3,-1);car.add(wheel);car.userData.wheels=[wheel];prepareRig(car);const g={speed:1000,steer_v:60,side_v:300,distance:0};animateRig(car,g,1/30);g.speed=1100;for(let n=0;n<6;n++)animateRig(car,g,1/30);assert.ok(car.userData.rig.body.rotation.z>0,'right turn rolls the roof outward to the left');assert.ok(car.userData.rig.body.rotation.x>0,'acceleration raises the -Z nose');g.speed=600;for(let n=0;n<6;n++)animateRig(car,g,1/30);assert.ok(car.userData.rig.body.rotation.x<0,'braking lowers the nose');
});
test('cached road stations preserve the rendered course geometry',async()=>{
 const {CircuitRoad}=await import('../games/arcade/web/nightshift9-course.mjs'),scene=new T.Scene(),material=new T.MeshBasicMaterial(),road=new CircuitRoad(scene,{road:material,concrete:material,white:material}),frame=new CircuitFrame(),expected=new T.Vector3();
 for(const mode of [0,3,6,11]){frame.set(mode,17350);road.draw(frame);for(const strip of road.strips)for(const n of [0,5,60,144])for(let edge=0;edge<2;edge++){const z=30-n*3.5,absolute=frame.distance*.1-z;let x=strip.edges[edge],y=strip.height;if(strip.wall){x=(strip.edges[0]+strip.edges[1])/2;y=edge?1:.02;}if(strip.dashes&&((absolute%7+7)%7>3))y=-.045;expected.set(x,y,z);frame.project(expected);const p=strip.mesh.geometry.attributes.position,i=n*2+edge;assert.ok(Math.hypot(p.getX(i)-expected.x,p.getY(i)-expected.y,p.getZ(i)-expected.z)<.00004);}}
});
test('contact bursts use lever arms and advance through distinct animation frames',async()=>{
 const {CombatEffects}=await import('../games/arcade/web/nightshift9-combat.mjs'),fx=new CombatEffects(new T.Scene(),new T.PerspectiveCamera()),atlas=new T.Texture();fx.load(atlas);await fx.loadSequence({loadAsync:async()=>atlas});const g={drift_x:1000,distance:500,impact_x:1100,impact_z:2100,impact_nx:-1,impact_nz:0,impact_force:900,counter_ticks:0};fx.emit('collision',g,g);const event=fx.events.find(e=>e.sequence===0);assert.equal(event.x,1.1);assert.equal(event.z,-2.1);const road=()=>0;road.project=()=>{};const frames=new Set();for(let n=0;n<8;n++){fx.draw(g,.075,false,road);frames.add(fx.sprites[event.slot].material.map);}assert.ok(frames.size>=7,'impact evolves over time rather than scaling a single image');
});
test('strong side crashes remain finite and bounded at all supported render rates',async()=>{
 const {CombatEffects}=await import('../games/arcade/web/nightshift9-combat.mjs');for(const hz of [30,60,120]){const fx=new CombatEffects(new T.Scene(),new T.PerspectiveCamera()),g={drift_x:1000,distance:0,impact_x:900,impact_z:0,impact_nx:1,impact_nz:0,impact_force:1800,over:true,finish_reason:2},car=new T.Group();fx.emit('wreck',g,g);for(let n=0;n<hz*2;n++){car.position.set(0,0,0);car.rotation.set(0,0,0);fx.posePlayer(car,g,false,1/hz);assert.ok(car.position.toArray().concat(car.rotation.toArray().slice(0,3)).every(Number.isFinite));assert.ok(car.position.length()<4);assert.ok(Math.abs(car.rotation.z)<8);}car.position.set(0,0,0);car.rotation.set(0,0,0);fx.posePlayer(car,g,true,1/hz);assert.equal(car.position.length(),0);assert.equal(car.rotation.z,0);}
});
test('combat HUD projects world positions once, including on curved roads',async()=>{
 const {DriftRenderer}=await import('../games/arcade/web/nightshift9-renderer.mjs'),camera=new T.PerspectiveCamera(60,2,.1,500);camera.position.set(4,3,10);camera.lookAt(4,3,0);camera.updateMatrixWorld();const renderer={camera,width:800,height:400,course:{project(){throw Error('World point must not be projected through the road again');}}},p=DriftRenderer.prototype.projectWorld.call(renderer,4,3,0);assert.ok(Math.abs(p.x-400)<1e-9);assert.ok(Math.abs(p.y-200)<1e-9);
});
test('road barriers have inward vertical-face lighting normals',async()=>{
 const {CircuitRoad}=await import('../games/arcade/web/nightshift9-course.mjs'),m=new T.MeshBasicMaterial(),r=new CircuitRoad(new T.Scene(),{road:m,concrete:m,white:m}),frame=new CircuitFrame();frame.set(3,14000);r.draw(frame);for(const s of r.strips.filter(s=>s.wall)){const n=s.mesh.geometry.attributes.normal,positions=s.mesh.geometry.attributes.position,indices=s.mesh.geometry.index,a=new T.Vector3().fromBufferAttribute(positions,indices.getX(0)),b=new T.Vector3().fromBufferAttribute(positions,indices.getX(1)),c=new T.Vector3().fromBufferAttribute(positions,indices.getX(2)),face=b.sub(a).cross(c.sub(a)).normalize();assert.ok(face.dot(new T.Vector3().fromBufferAttribute(n,0))>.99,'wall winding agrees with the inward normal');for(const station of [0,25,80]){assert.equal(n.getY(station*2),0);assert.ok(Math.abs(Math.hypot(n.getX(station*2),n.getZ(station*2))-1)<1e-6);const side=Math.sign(s.edges[0]),h=frame.pose(30-station*3.5).heading;assert.ok(n.getX(station*2)*Math.cos(h)*side+n.getZ(station*2)*Math.sin(h)*side< -.99);}}
});
