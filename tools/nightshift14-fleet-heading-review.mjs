import express from 'express';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='artifacts/rivals-v14/fleet-heading';mkdirSync(out,{recursive:true});
const app=express();app.use('/arcade',express.static('games/arcade/web'));app.use('/modules',express.static('games/arcade/web'));app.use('/node_modules',express.static('node_modules'));
app.get('/',(_q,r)=>r.send('<style>body{margin:0;background:#202b32}canvas{width:768px;height:432px;display:block}</style><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><canvas></canvas>'));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
try{
 const p=await browser.newPage({viewport:{width:768,height:432}});await p.goto('http://127.0.0.1:'+server.address().port);
 await p.evaluate(async()=>{window.T=await import('three');const{DriftRenderer}=await import('/modules/nightshift9-renderer.mjs');window.r=new DriftRenderer(document.querySelector('canvas'));await r.loadGarage(2);r.renderer.setPixelRatio(1);r.renderer.setSize(768,432,false);window.scene=new T.Scene();scene.background=new T.Color('#202b32');scene.environment=r.garageProbe.texture;scene.environmentIntensity=1;const h=new T.HemisphereLight('#d5e6eb','#41414d',.5),key=new T.DirectionalLight('#fff0df',2.3);key.position.set(-2,6,4);scene.add(h,key);window.camera=new T.PerspectiveCamera(28,768/432,.1,40);});
 const rows=[];
 for(const detail of [false,true])for(const side of [-1,1]){
  const sample=await p.evaluate(async({detail,side})=>{if(window.car)scene.remove(car);window.car=detail?await r.fleet.detail(2,'heading-audit'):r.fleet.make(2);scene.add(car);camera.position.set(side*4.1,2.2,side*5.6);camera.lookAt(0,.6,0);r.renderer.render(scene,camera);const box=new T.Box3().setFromObject(car);return{detail,viewFromZ:side,size:box.getSize(new T.Vector3()).toArray(),wheelContacts:car.userData.contactY,glError:r.renderer.getContext().getError()};},{detail,side});
  const file=`atlas-${detail?'hero':'race'}-${side<0?'front':'rear'}.png`;await p.screenshot({path:out+'/'+file});rows.push({...sample,file});
 }
 writeFileSync(out+'/review.json',JSON.stringify({note:'Asset inspection views from canonical -Z front and +Z rear, without simulation or state edits.',rows},null,2));console.log(rows);
}finally{await browser.close();await new Promise(r=>server.close(r));}
