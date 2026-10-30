import express from 'express';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(process.env.ASSET_TOOLS_PACKAGE||new URL('./asset-tools/package.json',import.meta.url)),sharp=require('sharp');
const maps=process.argv.includes('--map'),out='games/arcade/web/art/nightshift/'+(maps?'maps-v141':'fleet-v141'),captures='artifacts/presentation-v141/'+(maps?'map-captures':'fleet-captures');mkdirSync(out,{recursive:true});mkdirSync(captures,{recursive:true});
const app=express();app.use('/arcade',express.static('games/arcade/web'));app.use('/node_modules',express.static('node_modules'));
app.get('/',(_q,r)=>r.send('<style>html,body{margin:0;background:transparent}canvas{display:block;width:100vw;height:100vh}</style><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><canvas></canvas>'));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),errors=[];
try{
 const p=await browser.newPage({viewport:maps?{width:2560,height:1440}:{width:768,height:384}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.goto('http://127.0.0.1:'+server.address().port);
 await p.evaluate(async maps=>{
  window.T=await import('three');const {DriftRenderer}=await import('/arcade/nightshift9-renderer.mjs');window.r=new DriftRenderer(document.querySelector('canvas'),{alpha:!maps});
  if(maps){const {createGame}=await import('/arcade/nightshift14-rules.mjs');window.game=createGame();await r.load(0,0);r.previewMode=false;r.mapMode=0;await r.prepareRace(game);r.mapMode=0;r.draw(game,game,1,0,1,{running:false,reduced:true,low:false});r.car.visible=false;r.shadows.count=0;r.garageContacts.visible=false;r.post.render(r.scene,r.camera,{low:false,tier:0,bloom:r.activeLook.bloom});return;}
  await r.loadGarage(0);r.renderer.setPixelRatio(1);r.renderer.setSize(768,384,false);window.scene=new T.Scene();scene.environment=r.garageProbe.texture;scene.environmentIntensity=1.1;scene.environmentRotation.y=1.5;
  const hemi=new T.HemisphereLight('#c8d8e0','#30343c',.45),key=new T.DirectionalLight('#fff0df',2.2),fill=new T.DirectionalLight('#9bbacf',.35);key.position.set(-4,6,5);fill.position.set(5,3,-3);scene.add(hemi,key,fill);
  window.camera=new T.PerspectiveCamera(26,2,.1,30);camera.position.set(3.6,2.2,4.1);camera.lookAt(0,.55,0);r.renderer.setClearColor(0,0);
 },maps);
 if(maps){
  const file=captures+'/map-01.png';await p.screenshot({path:file});for(const width of [384,768,1280,2560])await sharp(file).resize(width,Math.round(width*9/16)).webp({quality:82,effort:6}).toFile(out+'/map-01-'+width+'.webp');
 }else for(let n=0;n<6;n++){
  await p.evaluate(async n=>{if(window.car)scene.remove(car);window.car=await r.fleet.detail(n,'thumbnail');scene.add(car);r.renderer.info.reset();r.renderer.render(scene,camera);},n);
  const file=captures+'/car-'+n+'.png';await p.screenshot({path:file,omitBackground:true});await sharp(file).resize(512,256).webp({quality:90,effort:6}).toFile(out+'/car-'+n+'.webp');
 }
 if(await p.evaluate(()=>r.renderer.getContext().getError()))throw Error('Preview WebGL error');if(errors.length)throw Error(errors.join('\n'));
 writeFileSync(out+'/'+(maps?'provenance.json':'thumbnails.json'),JSON.stringify({version:'14.1.0',source:maps?'Actual Nervos Harbour route preview render with the generated logistics atlas; other eleven route captures stay unchanged.':'Actual six runtime vehicles with authored UVs and rebuilt physical tire sites; transparent WebGL captures.',dimensions:maps?[2560,1440]:[512,256],count:maps?1:6,errors},null,2)+'\n');console.log({out,count:maps?1:6,errors});
}finally{await browser.close();await new Promise(r=>server.close(r));}
