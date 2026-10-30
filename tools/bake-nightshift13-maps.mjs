import express from 'express';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

// Offline captures of the actual rendered courses. No account, save or API mutation.
const out='games/arcade/web/art/nightshift/maps-v131',captures='artifacts/presentation-v13/map-captures';
mkdirSync(out,{recursive:true});mkdirSync(captures,{recursive:true});
const app=express();app.use('/arcade',express.static('games/arcade/web'));app.use('/modules',express.static('games/arcade/web'));app.use('/node_modules',express.static('node_modules'));
app.get('/',(_req,res)=>res.type('html').send('<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}canvas{width:100%;height:100%;display:block}</style><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><canvas></canvas>'));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),errors=[],maps=[];
try{
 const p=await browser.newPage({viewport:{width:2560,height:1440}});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.error(m.text());}else if(m.type()==='warning')console.warn(m.text());});
 await p.goto('http://127.0.0.1:'+server.address().port);
 await p.evaluate(async()=>{const {DriftRenderer}=await import('/modules/nightshift9-renderer.mjs'),{createGame}=await import('/modules/nightshift13-rules.mjs');window.renderer=new DriftRenderer(document.querySelector('canvas'));window.game=createGame();await renderer.load(0,0);const gl=renderer.renderer.getContext(),code=gl.getError();if(code)throw Error("load: "+code);});
 for(let mode=0;mode<12;mode++){
  const report=await p.evaluate(async mode=>{game.mode=mode;renderer.previewMode=false;renderer.mapMode=mode;await renderer.prepareRace(game);const prepareError=renderer.renderer.getContext().getError();if(prepareError)throw Error("prepare: "+prepareError);renderer.mapMode=mode;renderer.draw(game,game,1,0,1,{running:false,reduced:true,low:false});const drawError=renderer.renderer.getContext().getError();if(drawError)throw Error("draw: "+drawError);renderer.car.visible=false;renderer.shadows.count=0;renderer.garageContacts.visible=false;renderer.post.render(renderer.scene,renderer.camera,{low:false,tier:0,bloom:renderer.activeLook.bloom});const gl=renderer.renderer.getContext();const glError=gl.getError();if(glError)throw Error('WebGL error '+glError+' on route '+mode);return{mode,engine:renderer.engineSnapshot(),calls:renderer.renderer.info.render.calls};},mode);
  const name='map-'+String(mode+1).padStart(2,'0');await p.screenshot({path:captures+'/'+name+'.png'});maps.push(report);console.log({mode,calls:report.calls,instances:report.engine.instanceCount});
 }
 if(errors.length)throw Error(errors.join('\n'));
 const packed=spawnSync('python',['-c',`from PIL import Image\nfrom pathlib import Path\nfor p in Path('${captures}').glob('map-*.png'):\n im=Image.open(p).convert('RGB')\n for w in [384,768,1280,2560]:\n  im.resize((w,round(w*9/16)),Image.Resampling.LANCZOS).save(Path('${out}')/(p.stem+'-'+str(w)+'.webp'),quality=82,method=6)\n`],{stdio:'inherit'});if(packed.status)throw Error('Map packing failed');
 writeFileSync(out+'/provenance.json',JSON.stringify({version:'13.1.0',source:'Actual NIGHTSHIFT route render, 2560 × 1440, presentation-only capture at route preview station 7600; no fabricated route art',variants:[384,768,1280,2560],maps,errors},null,2)+'\n');
}finally{await browser.close();server.close();}
