import express from 'express';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const out=process.env.OUT_DIR||'artifacts/presentation-v141/fleet';mkdirSync(out,{recursive:true});
const vehicles=process.env.VEHICLES?process.env.VEHICLES.split(',').map(Number):process.env.ALL_CARS==='1'?[0,1,2,3,4,5]:[2];
const app=express();app.use('/arcade',express.static('games/arcade/web'));app.use('/node_modules',express.static('node_modules'));
app.get('/',(_q,r)=>r.send('<style>body{margin:0;background:#202b32}canvas{display:block}</style><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><canvas></canvas>'));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
try{
 const p=await browser.newPage({viewport:{width:960,height:540}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.goto('http://127.0.0.1:'+server.address().port);
 await p.evaluate(async()=>{
  window.T=await import('three');const {DriftRenderer}=await import('/arcade/nightshift9-renderer.mjs');const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
  window.r=new DriftRenderer(document.querySelector('canvas'));await r.loadGarage(2);r.renderer.setPixelRatio(1);r.renderer.setSize(960,540,false);
  window.sourceLoader=new GLTFLoader();window.scene=new T.Scene();scene.background=new T.Color('#202b32');scene.environment=r.garageProbe.texture;scene.environmentIntensity=1;
  const h=new T.HemisphereLight('#d5e6eb','#41414d',.5),key=new T.DirectionalLight('#fff0df',2.3);key.position.set(-2,6,4);scene.add(h,key);
  window.camera=new T.PerspectiveCamera(28,960/540,.1,40);
 });
 const rows=[];
 for(const vehicle of vehicles)for(const kind of ['source','player','traffic'])for(const side of [-1,1]){
  const sample=await p.evaluate(async({vehicle,kind,side})=>{
   if(window.car)scene.remove(car);
   const {FLEET}=await import('/arcade/nightshift-fleet-specs.mjs');
   if(kind==='source'){
    if(vehicle===0)return {skipped:true};
    car=(await sourceLoader.loadAsync('/arcade/art/nightshift/fleet-v11/'+FLEET[vehicle].body+'-hero.glb')).scene;
   }else{await r.fleet.prepareVehicle(vehicle);car=kind==='player'?await r.fleet.detail(vehicle,'material-review'):r.fleet.make(vehicle);}
   scene.add(car);camera.position.set(side*4.1,2.2,side*5.6);camera.lookAt(0,.6,0);r.renderer.info.reset();r.renderer.render(scene,camera);
   const box=new T.Box3().setFromObject(car),materials=new Set(),maps=new Set();let triangles=0,uvVertices=0;car.traverse(o=>{if(!o.isMesh)return;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;uvVertices+=o.geometry.attributes.uv?.count||0;for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m.uuid);if(m.map)maps.add(m.map.uuid);}});
   const wheelAnatomy=(car.userData.rig?.wheels||[]).map(w=>{const b=w.mesh.geometry.boundingBox,detail=w.mesh.geometry.attributes.materialDetail;let lamps=0;if(detail)for(let n=0;n<detail.count;n++)if(detail.getY(n)>.5)lamps++;return {center:w.rest.toArray(),radius:w.radius,span:b.getSize(new T.Vector3()).toArray(),lamps};});
   return {vehicle,kind,viewFromZ:side,size:box.getSize(new T.Vector3()).toArray(),minY:box.min.y,wheelCount:car.userData.wheels?.length||0,wheelContacts:car.userData.contactY,wheelAnatomy,materials:materials.size,maps:maps.size,uvVertices,triangles,drawCalls:r.renderer.info.render.calls,glError:r.renderer.getContext().getError()};
  },{vehicle,kind,side});if(sample.skipped)continue;
  const file=`car-${vehicle}-${kind}-${side<0?'front':'rear'}.png`;await p.screenshot({path:out+'/'+file});rows.push({...sample,file});
 }
 for(const row of rows){assert.equal(row.glError,0);if(row.kind==='player'){assert.equal(row.wheelCount,4);for(const wheel of row.wheelAnatomy){assert.ok(wheel.radius>.24&&wheel.radius<.43,'Actual tire radius');assert.ok(Math.abs(wheel.center[2])>.8&&Math.abs(wheel.center[2])<1.6,'Axle lies inside the body, away from lamps');assert.ok(wheel.span[2]<.9,'Wheel assembly excludes remote body pieces');assert.equal(wheel.lamps,0,'Lights never rotate with tires');}}}
 const motion=[];
 for(const vehicle of vehicles){
  const sample=await p.evaluate(async vehicle=>{
   if(window.car)scene.remove(car);car=await r.fleet.detail(vehicle,'material-review');scene.add(car);camera.position.set(4.1,2.2,5.6);camera.lookAt(0,.6,0);
   const {animateRig,resetRig}=await import('/arcade/nightshift9-motion.mjs'),rig=car.userData.rig;
   const score=()=>{r.renderer.info.reset();r.renderer.render(scene,camera);const gl=r.renderer.getContext(),pixels=new Uint8Array(960*540*4);gl.readPixels(0,0,960,540,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let red=0;for(let i=0;i<pixels.length;i+=4)red+=Math.max(0,pixels[i]-Math.max(pixels[i+1],pixels[i+2]));return {red,pixels};};
   resetRig(car);const released=score();for(let n=0;n<120;n++)animateRig(car,{speed:0,brake:100,steer_v:0,distance:0},1/60,{active:true});const pressed=score();
   let lensBrightnessGain=0,lensPixels=0;for(let i=0;i<released.pixels.length;i+=4){const a=released.pixels,b=pressed.pixels;if(a[i]>40&&a[i]>a[i+1]*1.25&&a[i]>a[i+2]*1.25){lensPixels++;lensBrightnessGain+=b[i]+b[i+1]+b[i+2]-a[i]-a[i+1]-a[i+2];}}
   const brake=rig.material?.userData.brake.value??car.userData.brakeMaterials?.[0]?.emissiveIntensity;
   // 0.7 m avoids a complete wheel revolution across the accepted tire radii.
   const wheels=car.userData.wheels.map(w=>w.quaternion.clone());resetRig(car);animateRig(car,{speed:1000,brake:0,steer_v:0,distance:7},1/60,{active:true});
   const rotations=car.userData.wheels.map((w,n)=>1-Math.abs(w.quaternion.dot(wheels[n])));resetRig(car);r.renderer.render(scene,camera);
   return {vehicle,releasedRed:released.red,pressedRed:pressed.red,lensPixels,lensBrightnessGain,brake,rotations,glError:r.renderer.getContext().getError()};
  },vehicle);
  await p.screenshot({path:out+'/car-'+vehicle+'-brake.png'});motion.push(sample);writeFileSync(out+'/motion-observations.json',JSON.stringify(motion,null,2));assert.equal(sample.glError,0);assert.ok(sample.lensPixels>5&&sample.lensBrightnessGain>100,'Rear lamp pixels visibly brighten at standstill: '+vehicle);assert.ok(sample.rotations.every(n=>n>.01),'Four actual wheels rotate: '+vehicle);
 }
 assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({note:'Canonical front/rear source/runtime renders, physical tire sites, no spinning lamps, visible stationary brake response and four rotating tires; no gameplay state edits.',rows,motion,errors},null,2)+'\n');console.log(JSON.stringify({out,renders:rows.length,physicalTiresVerified:true,stationaryBrakeResponse:motion,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
