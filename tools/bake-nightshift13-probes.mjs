import express from 'express';import{chromium}from'playwright';import{mkdirSync,writeFileSync}from'node:fs';import path from'node:path';
const out='games/arcade/web/art/nightshift/pbr/probes-v131';mkdirSync(out,{recursive:true});
const app=express();app.use('/arcade',express.static('games/arcade/web'));app.use('/modules',express.static('games/arcade/web'));app.use('/node_modules',express.static('node_modules'));
app.get('/',(_req,res)=>res.type('html').send('<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script><canvas></canvas>'));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});const reports=[];
try{const p=await browser.newPage();p.on('console',m=>{if(m.type()==='error')throw Error(m.text());});await p.exposeFunction('saveProbe',(name,w,h,base64,stats)=>{const header=Buffer.alloc(16);header.write('NSP1');header.writeUInt32LE(w,4);header.writeUInt32LE(h,8);const pixels=Buffer.from(base64,'base64');if(pixels.length!==w*h*8)throw Error('Invalid probe');const file=out+'/'+name+'.pmrem';writeFileSync(file,Buffer.concat([header,pixels]));reports.push({name,width:w,height:h,bytes:pixels.length+16,...stats});});await p.goto('http://127.0.0.1:'+server.address().port);
 await p.evaluate(async()=>{
  const T=await import('three'),{HDRLoader}=await import('three/addons/loaders/HDRLoader.js');
  const renderer=new T.WebGLRenderer({canvas:document.querySelector('canvas'),antialias:false}),pm=new T.PMREMGenerator(renderer);
  const maps=await Promise.all(['sunset','daylight','night'].map(n=>new HDRLoader().setDataType(T.FloatType).loadAsync('/arcade/art/nightshift/pbr/'+n+'.hdr')));
  // Bake from the original sources, independently of the runtime probe loader.
  for(const t of maps){const a=t.image.data;for(let n=0;n<a.length;n+=4){const scale=Math.min(1,16/Math.max(a[n],a[n+1],a[n+2],.0001));a[n]*=scale;a[n+1]*=scale;a[n+2]*=scale;}t.needsUpdate=true;}
  const probes=[pm.fromEquirectangular(maps[0]),pm.fromEquirectangular(maps[1])];
  for(const tunnel of [false,true]){
   const scene=new T.Scene();maps[2].mapping=T.EquirectangularReflectionMapping;scene.background=maps[2];
   for(const side of [-1,1])for(let n=0;n<6;n++){
    const color=new T.Color(tunnel?'#ffd1a0':n%3?'#accddd':'#ffc792').multiplyScalar(tunnel?2:1.7);
    const card=new T.Mesh(new T.PlaneGeometry(tunnel?7:1.4,tunnel?1:8+n%3*3),new T.MeshBasicMaterial({color,side:T.DoubleSide}));card.position.set(side*12,tunnel?8:9,(n-3)*11);card.rotation.y=side*Math.PI/2;scene.add(card);
   }
   probes.push(pm.fromScene(scene,.08,.1,100,{size:128}));scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  }
  for(const [i,target]of probes.entries()){const w=target.width,h=target.height,pixels=new Uint16Array(w*h*4);renderer.readRenderTargetPixels(target,0,0,w,h,pixels);if(renderer.getContext().getError())throw Error('Probe read failed');let max=0,sum=0;for(let n=0;n<pixels.length;n++){const v=T.DataUtils.fromHalfFloat(pixels[n]);if(!Number.isFinite(v)||v<0)throw Error('Nonfinite radiance');if(n%4!==3){max=Math.max(max,v);sum+=v;}}if(!sum)throw Error('Empty radiance');const bytes=new Uint8Array(pixels.buffer),parts=[];for(let n=0;n<bytes.length;n+=8192)parts.push(String.fromCharCode(...bytes.subarray(n,n+8192)));await window.saveProbe(['sunset','daylight','night','tunnel'][i],w,h,btoa(parts.join('')),{maxRadiance:max,meanRadiance:sum/(w*h*3)});target.dispose();}
  maps.forEach(t=>t.dispose());pm.dispose();renderer.dispose();
 });writeFileSync(out+'/provenance.json',JSON.stringify({format:'NSP1, little-endian RGBA Float16, Three.js r180 CubeUV PMREM, no mip generation at runtime',source:'Existing licensed Poly Haven HDR sources and authored night/tunnel light cards',probes:reports},null,2)+'\n');console.log(reports);
}finally{await browser.close();server.close();}
