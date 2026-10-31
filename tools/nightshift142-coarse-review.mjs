import express from 'express';
import {chromium} from 'playwright';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const out=process.env.DRIFT_OUT||'artifacts/fleet-v142/coarse';mkdirSync(out,{recursive:true});
const provenance=JSON.parse(readFileSync('games/arcade/web/art/nightshift/fleet-ready-v142/provenance.json'));
const app=express();app.use('/arcade',express.static('games/arcade/web'));app.use('/node_modules',express.static('node_modules'));
app.get('/',(_q,r)=>r.send('<style>body{margin:0;background:#202b32}canvas{display:block}</style><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><canvas></canvas>'));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),rows=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:960,height:540}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(async()=>{
  window.T=await import('three');const {loadFleet}=await import('/arcade/nightshift11-fleet.mjs');window.motion=await import('/arcade/nightshift9-motion.mjs');
  window.fleet=await loadFleet(new T.LoadingManager());await fleet.racing();
  window.renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:false});renderer.setPixelRatio(1);renderer.setSize(960,540,false);renderer.toneMapping=T.AgXToneMapping;renderer.outputColorSpace=T.SRGBColorSpace;
  window.scene=new T.Scene();scene.background=new T.Color('#202b32');scene.add(new T.HemisphereLight('#d5e6eb','#41414d',1.4));
  window.sun=new T.DirectionalLight('#fff0df',3);sun.position.set(4,6,3);sun.castShadow=true;scene.add(sun);
  window.camera=new T.PerspectiveCamera(35,960/540,.1,30);
  window.read=()=>{renderer.info.reset();renderer.render(scene,camera);const gl=renderer.getContext(),pixels=new Uint8Array(960*540*4);gl.readPixels(0,0,960,540,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;};
 });
 for(let vehicle=0;vehicle<6;vehicle++){
  const row=await page.evaluate(async({vehicle,provenance})=>{
   if(window.car)scene.remove(car);car=fleet.make(vehicle);scene.add(car);
   const body=car.userData.source,source=provenance.assets.find(s=>s.body===body),sides=[];
   for(const side of [-1,1]){
    camera.position.set(side*4.8,1.7,0);camera.lookAt(0,.65,0);camera.updateMatrixWorld(true);
    motion.resetRig(car);const before=read();motion.animateRig(car,Object.freeze({speed:1000,brake:0,distance:7}),1/60,{active:true,steer:0});const after=read();
    const changed=(cx,cy,radius)=>{let count=0;for(let y=Math.max(0,Math.floor(cy-radius));y<Math.min(540,cy+radius);y++)for(let x=Math.max(0,Math.floor(cx-radius));x<Math.min(960,cx+radius);x++){const n=(y*960+x)*4;if(Math.abs(before[n]-after[n])+Math.abs(before[n+1]-after[n+1])+Math.abs(before[n+2]-after[n+2])>5)count++;}return count;};
    const tires=source.sites.filter(s=>s.center[0]*side>0).map(s=>{const p=new T.Vector3(...s.center).project(camera),radius=s.radius*540/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*4.5)+5;return {name:s.name,changedPixels:changed((p.x+1)*480,(p.y+1)*270,radius)};});
    const center=new T.Vector3(0,.85,0).project(camera);sides.push({side,tires,bodyChangedPixels:changed((center.x+1)*480,(center.y+1)*270,12)});
   }
   camera.position.set(4.1,2.2,5.6);camera.lookAt(0,.6,0);motion.resetRig(car);const released=read();
   for(let n=0;n<120;n++)motion.animateRig(car,{speed:0,brake:100,distance:0},1/60,{active:true});const pressed=read();let lensPixels=0,brightnessGain=0;
   for(let n=0;n<released.length;n+=4)if(released[n]>40&&released[n]>released[n+1]*1.25&&released[n]>released[n+2]*1.25){lensPixels++;brightnessGain+=pressed[n]+pressed[n+1]+pressed[n+2]-released[n]-released[n+1]-released[n+2];}
   renderer.shadowMap.enabled=true;read();const shadowError=renderer.getContext().getError();renderer.shadowMap.enabled=false;
   const point=new T.PointLight('#ffffff',10,20);point.position.set(4,5,3);point.castShadow=true;scene.add(point);renderer.shadowMap.enabled=true;read();const distanceError=renderer.getContext().getError();renderer.shadowMap.enabled=false;scene.remove(point);point.shadow.dispose();
   const calls=renderer.info.render.calls;read();return {vehicle,body,sides,lensPixels,brightnessGain,brake:car.userData.brakeMaterial.userData.brake.value,coarseDraws:renderer.info.render.calls,shadowError,distanceError,glError:renderer.getContext().getError(),source};
  },{vehicle,provenance});
  rows.push(row);writeFileSync(out+'/observations.json',JSON.stringify({rows,errors},null,2));await page.screenshot({path:out+'/car-'+vehicle+'-brake.png'});
  assert.equal(row.coarseDraws,1,'One normal draw per coarse car');assert.equal(row.glError,0);assert.equal(row.shadowError,0);assert.equal(row.distanceError,0);
  assert.ok(row.lensPixels>5&&row.brightnessGain>100,'Visible coarse brake response '+vehicle);
  for(const side of row.sides){assert.equal(side.bodyChangedPixels,0,'Chassis stays fixed');for(const wheel of side.tires)assert.ok(wheel.changedPixels>5,'Actual tire pixels rotate: '+vehicle+' '+wheel.name);}
 }
 const ghost=await page.evaluate(async()=>{
  scene.remove(car);car=fleet.make(0);scene.add(car);const {bindWheelMaterial}=await import('/arcade/nightshift142-wheel-surface.mjs');
  car.traverse(mesh=>{if(!mesh.isMesh)return;mesh.material.dispose();mesh.material=new T.MeshStandardMaterial({color:'#99d5ce',emissive:'#255650',emissiveIntensity:.2,transparent:true,opacity:.25,depthWrite:false,roughness:.45,metalness:.15});bindWheelMaterial(mesh.material,car.userData.wheelMotion);mesh.castShadow=false;});car.userData.brakeMaterial=null;
  camera.position.set(4.8,1.7,0);camera.lookAt(0,.65,0);motion.resetRig(car);const before=read();motion.animateRig(car,{speed:1000,distance:7},1/60);const after=read();let changedPixels=0;
  for(let n=0;n<before.length;n+=4)if(Math.abs(before[n]-after[n])+Math.abs(before[n+1]-after[n+1])+Math.abs(before[n+2]-after[n+2])>5)changedPixels++;
  return {changedPixels,draws:renderer.info.render.calls,glError:renderer.getContext().getError()};
 });assert.ok(ghost.changedPixels>5);assert.equal(ghost.draws,1);assert.equal(ghost.glError,0);
 assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({version:JSON.parse(readFileSync('package.json')).version,rows,ghost,errors},null,2));console.log(JSON.stringify({cars:rows.length,oneDrawPerCoarseCar:true,allFourTirePixelChanges:true,coarseBrakeResponse:true,shadowPaths:true,ghost,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
