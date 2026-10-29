import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {QualityGovernor,disposeSceneResources} from '../games/arcade/web/nightshift9-engine.mjs';
import {CircuitFrame} from '../games/arcade/web/nightshift9-course.mjs';
import {DriftRenderer} from '../games/arcade/web/nightshift9-renderer.mjs';

test('input reverses the banked control plane after CSS resize and viewport offsets',()=>{
 const camera=new T.PerspectiveCamera(56,16/9,.1,900);camera.position.set(0,4.7,10.8);camera.lookAt(0,.7,-22);camera.updateMatrixWorld();
 const renderer=Object.assign(Object.create(DriftRenderer.prototype),{canvas:{getBoundingClientRect:()=>({left:17,top:31,width:844,height:390})},camera,course:new CircuitFrame(),ray:new T.Raycaster(),inputPlane:new T.Plane(new T.Vector3(0,0,1),0),point:new T.Vector3(),width:1920,height:1080});
 for(const previewMode of [false,true])for(let mode=0;mode<12;mode++){renderer.previewMode=previewMode;renderer.course.set(mode,7600);for(const [x,y] of [[2,0],[-3,.5],[.5,2]]){const p=renderer.project(x,y),v=renderer.pointer(p.x,p.y);assert.ok(Math.abs(v.x-(500+x*250))<1e-7);assert.ok(Math.abs(v.y-(500-y*250))<1e-7);}}
});

test('quality sheds optional work before resolution and uses measured GPU load',()=>{const b=new QualityGovernor(2);assert.equal(b.max,1.5);for(let n=0;n<130;n++)b.sample(16.667,'auto',23);assert.equal(b.tier,1);assert.equal(b.ratio,1.5);assert.equal(b.features.reflection,false);for(let n=0;n<400;n++)b.sample(30,'auto',25);assert.equal(b.tier,2);assert.ok(b.ratio<1.5);assert.equal(b.sample(100,'high'),1.5);assert.equal(b.tier,0);assert.equal(b.sample(100,'low'),1);assert.equal(b.tier,2);});
test('a transient hitch does not lower quality and recovery has hysteresis',()=>{const b=new QualityGovernor(1);b.sample(100);for(let n=0;n<160;n++)b.sample(16.667,'auto',8);assert.equal(b.tier,0);for(let n=0;n<240;n++)b.sample(30,'auto',25);const tier=b.tier;for(let n=0;n<60;n++)b.sample(16.667,'auto',8);assert.equal(b.tier,tier);});
test('resource disposal releases shared geometry/material/texture exactly once',()=>{const g=new T.BoxGeometry(),tex=new T.Texture(),m=new T.MeshBasicMaterial({map:tex}),root=new T.Group();root.add(new T.Mesh(g,m),new T.Mesh(g,m));const hits=[];for(const o of [g,m,tex])o.addEventListener('dispose',()=>hits.push(o));disposeSceneResources([root,root],[tex,m]);assert.equal(hits.length,3);assert.equal(new Set(hits).size,3);});
test('absolute street transforms match the original relative course frame',()=>{
 const frame=new CircuitFrame(),absolute=new T.Object3D(),relative=new T.Object3D(),origin=new T.Matrix4(),combined=new T.Matrix4();for(const mode of [0,3,8,11])for(const distance of [0,17500,90000])for(const z of [-240,-20,20]){frame.set(mode,distance);frame.place(relative,z,0,0,{upright:true});relative.updateMatrix();frame.placeAbsolute(absolute,distance-z*10);absolute.updateMatrix();frame.originMatrix(origin);combined.multiplyMatrices(origin,absolute.matrix);for(let n=0;n<16;n++)assert.ok(Math.abs(combined.elements[n]-relative.matrix.elements[n])<1e-8);}
});

import {startRenderLoop} from '../games/arcade/web/nightshift9-performance.mjs';
test('Frame scheduler keeps 100 ms of active simulation time and resets hidden-tab gaps',()=>{
 const old={document:globalThis.document,localStorage:globalThis.localStorage,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,addEventListener:globalThis.addEventListener,removeEventListener:globalThis.removeEventListener};
 const listeners={},callbacks=[],deltas=[];globalThis.document={hidden:false,documentElement:{dataset:{}},addEventListener:(n,fn)=>listeners[n]=fn,removeEventListener:()=>{}};globalThis.localStorage={getItem:()=>null};globalThis.requestAnimationFrame=fn=>(callbacks.push(fn),callbacks.length);globalThis.cancelAnimationFrame=()=>{};globalThis.addEventListener=()=>{};globalThis.removeEventListener=()=>{};
 try{const stop=startRenderLoop((_now,delta)=>deltas.push(delta));callbacks.shift()(100);callbacks.shift()(200);callbacks.shift()(1500);assert.equal(deltas[1],100);assert.equal(deltas[2],250);document.hidden=true;listeners.visibilitychange();callbacks.length=0;document.hidden=false;listeners.visibilitychange();callbacks.shift()(20000);assert.ok(deltas.at(-1)<17);stop();}finally{Object.assign(globalThis,old);}
});

import {GpuTimer} from '../games/arcade/web/nightshift9-gpu.mjs';
test('GPU sampling covers all reflection phases and resets cold-start queries',()=>{
 const deleted=[],begins=[],gl={getExtension:()=>({TIME_ELAPSED_EXT:1,GPU_DISJOINT_EXT:2}),getQueryParameter:()=>false,createQuery:()=>({id:begins.length}),beginQuery:(_t,q)=>begins.push(q),endQuery:()=>{},deleteQuery:q=>deleted.push(q)};
 const t=new GpuTimer({getContext:()=>gl});for(let n=0;n<34;n++){t.begin();t.end();}assert.equal(begins.length,4);assert.deepEqual([0,11,22,33].map(n=>n%4),[0,3,2,1]);t.ms=99;t.reset();assert.equal(deleted.length,4);assert.equal(t.ms,null);assert.equal(t.pending.length,0);t.begin();t.dispose();assert.equal(deleted.length,5);
});

import {RouteWorld} from '../games/arcade/web/nightshift9-world.mjs';
test('street buffers remain unchanged within a chunk and refresh across maps and chunk edges',()=>{
 const previous=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{
  const scene=new T.Scene(),world=new RouteWorld(scene),frame=new CircuitFrame();
  const road=z=>frame.pose(z).x;road.fixedFrame=(d,o)=>frame.placeAbsolute(o,d);road.originMatrix=m=>frame.originMatrix(m);road.profileKey=()=>9;
  for(let mode=0;mode<12;mode++){
   frame.set(mode,0);world.draw(0,mode,500000,road);assert.ok(world.matrixWrites>0);
   const versions=[...world.pools.values()].map(p=>p.mesh.instanceMatrix.version);
   frame.set(mode,100);world.draw(100,mode,500000,road);assert.equal(world.matrixWrites,0);assert.equal(world.colorWrites,0);assert.deepEqual([...world.pools.values()].map(p=>p.mesh.instanceMatrix.version),versions);
   frame.set(mode,180);world.draw(180,mode,500000,road);assert.ok(world.matrixWrites>0);
  }
 }finally{globalThis.document=previous;}
});
test('instance buffers and unused material textures are included in teardown',()=>{
 const root=new T.Group(),g=new T.BoxGeometry(),m=new T.MeshBasicMaterial(),instances=new T.InstancedMesh(g,m,3);root.add(instances);const hiddenTexture=new T.Texture(),hiddenMaterial=new T.MeshBasicMaterial({map:hiddenTexture}),hits=[];
 for(const o of [g,m,instances,hiddenTexture,hiddenMaterial])o.addEventListener('dispose',()=>hits.push(o));disposeSceneResources([root],[hiddenMaterial]);assert.equal(hits.length,5);assert.equal(new Set(hits).size,5);
});
