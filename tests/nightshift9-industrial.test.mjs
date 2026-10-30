import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {INDUSTRIAL} from '../games/arcade/web/nightshift9-industrial.mjs';
import {RouteWorld} from '../games/arcade/web/nightshift9-world.mjs';
import {CircuitFrame} from '../games/arcade/web/nightshift9-course.mjs';

test('industrial meshes have finite unit normals, usable UVs and nondegenerate faces',()=>{
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(const [name,g] of Object.entries(INDUSTRIAL)){
  const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,index=g.index;
  assert.ok(p.count<15000,name+' vertex budget');
  for(let k=0;k<p.count;k++){a.fromBufferAttribute(p,k);b.fromBufferAttribute(n,k);assert.ok(a.toArray().every(Number.isFinite),name);assert.ok(Math.abs(b.length()-1)<1e-5,name);assert.ok(Number.isFinite(uv.getX(k))&&Number.isFinite(uv.getY(k)),name);}
  for(let k=0;k<(index?.count||p.count);k+=3){a.fromBufferAttribute(p,index?index.getX(k):k);b.fromBufferAttribute(p,index?index.getX(k+1):k+1);c.fromBufferAttribute(p,index?index.getX(k+2):k+2);assert.ok(b.sub(a).cross(c.sub(a)).length()>1e-9,name+' triangle');}
 }
 for(const g of [INDUSTRIAL.container20,INDUSTRIAL.container40]){g.computeBoundingBox();assert.ok(Math.abs(g.boundingBox.min.x+.5)<1e-6);assert.ok(Math.abs(g.boundingBox.max.z-.5)<1e-6);}
});

test('quality removes only near fittings and restores cached structural instances',async()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{
  const scene=new T.Scene(),world=new RouteWorld(scene),frame=new CircuitFrame(),road=z=>frame.pose(z).x;
  road.fixedFrame=(d,o)=>frame.placeAbsolute(o,d);road.originMatrix=m=>frame.originMatrix(m);road.profileKey=()=>9;
  for(const mode of [0,3,8]){
   await world.prepare(mode);frame.set(mode,7600);world.draw(7600,mode,150000,road,0);const counts=new Map([...world.pools.values()].filter(p=>!p.geometry.userData.detail).map(p=>[p,p.mesh.count]));const detail=world.snapshot().nearDetailInstances;assert.ok(detail>0);assert.ok(world.snapshot().maxPoolCount<1600);
   world.draw(7610,mode,150000,road,0);assert.equal(world.matrixWrites,0);
   world.draw(7610,mode,150000,road,2);assert.equal(world.snapshot().nearDetailInstances,0);for(const [p,n]of counts)assert.equal(p.mesh.count,n,'Structural silhouettes survive low quality');
   world.draw(7620,mode,150000,road,2);assert.equal(world.matrixWrites,0);
   world.draw(7620,mode,150000,road,0);assert.equal(world.snapshot().nearDetailInstances,detail);
  }
 }finally{globalThis.document=old;}
});

test('harbour containers, cranes and warehouses remain outside the drivable corridor',async()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{
  const world=new RouteWorld(new T.Scene()),box=new T.Box3();await world.prepare(0);
  for(const template of world.templates[0])for(const part of template){const g=part.pool.geometry;if(g===INDUSTRIAL.stencil||g===INDUSTRIAL.detailBox)continue;g.computeBoundingBox();box.copy(g.boundingBox).applyMatrix4(part.matrix);assert.ok(box.max.x< -7.4||box.min.x>7.4,'Decorative architecture must not close a driving lane');}
 }finally{globalThis.document=old;}
});

test('container feet and crane footing meet their authored quay and pier levels',async()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{
  const world=new RouteWorld(new T.Scene()),box=new T.Box3();await world.prepare(0);
  for(const template of world.templates[0]){const bottoms=template.filter(p=>p.pool.material===world.m.cargoPaint).map(p=>{const g=p.pool.geometry;g.computeBoundingBox();return box.copy(g.boundingBox).applyMatrix4(p.matrix).min.y;});if(bottoms.length)assert.ok(Math.abs(Math.min(...bottoms)+.12)<1e-6);}
  INDUSTRIAL.gantry.computeBoundingBox();INDUSTRIAL.pier.computeBoundingBox();assert.ok(Math.abs(INDUSTRIAL.gantry.boundingBox.min.y-INDUSTRIAL.pier.boundingBox.max.y)<1e-6);
 }finally{globalThis.document=old;}
});

test('absolute rail feet match the banked, graded road after origin rebasing',()=>{
 const frame=new CircuitFrame(),post=new T.Object3D(),origin=new T.Matrix4(),actual=new T.Vector3();
 for(const mode of [0,1,2,4,5,6,9,11])for(const distance of [179,7600,90000])for(const z of [-76.5,-4.5,4.5])for(const x of [-8.1,8.1]){
  frame.set(mode,distance);frame.anchorRoadAbsolute(post,distance-z*10,x,-.14);frame.originMatrix(origin);actual.copy(post.position).applyMatrix4(origin);const p=frame.pose(z,x,-.14);assert.ok(actual.distanceTo(new T.Vector3(p.x,p.y,p.z))<1e-8);
 }
});
