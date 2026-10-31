import {build} from 'esbuild';
import express from 'express';
import {chromium} from 'playwright';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const destination='games/arcade/web/art/nightshift/fleet-ready-v142',scratch='artifacts/fleet-v142/raw';
mkdirSync(destination,{recursive:true});mkdirSync(scratch,{recursive:true});
const entry=`
 import * as T from 'three';
 import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
 import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
 import {prepareFleetSurface,wheelSites} from './games/arcade/web/nightshift141-fleet-surface.mjs';
 import {FLEET} from './games/arcade/web/nightshift-fleet-specs.mjs';
 globalThis.bake=async()=>{
  const loader=new GLTFLoader(),rows=[];
  for(const body of new Set(FLEET.map(s=>s.body))){
   const hero=(await loader.loadAsync('/arcade/art/nightshift/fleet-v11/'+body+'-hero.glb')).scene;hero.updateMatrixWorld(true);
   const sites=wheelSites(hero),source=(await loader.loadAsync('/arcade/art/nightshift/fleet-v11/'+body+'-race.glb')).scene;
   const prepared=prepareFleetSurface(source,false,body,{coarseWheelSites:sites}),group=new T.Group();
   for(const part of prepared.parts){const mesh=new T.Mesh(part.geometry,new T.MeshBasicMaterial({vertexColors:true,map:prepared.texture}));mesh.name=part.name;group.add(mesh);}
   const bytes=new Uint8Array(await new GLTFExporter().parseAsync(group,{binary:true,onlyVisible:false}));
   let binary='';for(let n=0;n<bytes.length;n+=32768)binary+=String.fromCharCode(...bytes.subarray(n,n+32768));
   rows.push({body,sites:sites.map(s=>({name:s.name,center:s.center.toArray(),radius:s.radius,width:s.width})),data:btoa(binary)});
  }return rows;
 };
`;
const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',target:'es2022'});
const app=express();app.get('/',(_q,r)=>r.type('html').send('<script type="module" src="/bake.mjs"></script>'));
app.get('/bake.mjs',(_q,r)=>r.type('js').send(bundle.outputFiles[0].text));app.use('/arcade',express.static('games/arcade/web'));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({args:['--no-sandbox']});let rows;
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof bake==='function');
 rows=await page.evaluate(()=>bake());for(const row of rows){writeFileSync(scratch+'/'+row.body+'.glb',Buffer.from(row.data,'base64'));delete row.data;}
}finally{await browser.close();await new Promise(r=>server.close(r));}

const require=createRequire(process.env.ASSET_TOOLS_PACKAGE||new URL('./asset-tools/package.json',import.meta.url));
const {NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {meshopt,getBounds,weld}=require('@gltf-transform/functions'),{MeshoptEncoder,MeshoptDecoder}=require('meshoptimizer');
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const triangles=doc=>doc.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((sum,p)=>sum+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0),0);
for(const row of rows){
 const file=row.body+'-race.glb',doc=await io.read(scratch+'/'+row.body+'.glb'),published=await io.read('games/arcade/web/art/nightshift/fleet-ready-v141/'+file);
 const count=triangles(doc),bounds=getBounds(doc.getRoot().listScenes()[0]);assert.equal(count,triangles(published));
 const textures=doc.getRoot().listTextures(),originals=published.getRoot().listTextures();assert.equal(textures.length,originals.length);
 for(let n=0;n<textures.length;n++){textures[n].setImage(originals[n].getImage()).setMimeType(originals[n].getMimeType());}
 await doc.transform(weld(),meshopt({encoder:MeshoptEncoder,level:'high',quantizePosition:16,quantizeNormal:12,quantizeTexcoord:16,cleanup:false}));
 const output=destination+'/'+file;await io.write(output,doc);const check=await io.read(output),after=getBounds(check.getRoot().listScenes()[0]);
 assert.equal(triangles(check),count);assert.equal(check.getRoot().listMeshes().length,1,'Keep one coarse draw');
 row.maxBoundsDelta=Math.max(...['min','max'].flatMap(k=>bounds[k].map((v,n)=>Math.abs(v-after[k][n]))));assert.ok(row.maxBoundsDelta<.001);
 const primitive=check.getRoot().listMeshes()[0].listPrimitives()[0],wheel=primitive.getAttribute('_WHEELRIG'),detail=primitive.getAttribute('_MATERIALDETAIL'),surface=primitive.getAttribute('_SURFACE');
 assert.ok(wheel&&detail&&surface);const counts=[0,0,0,0];let movingVertices=0;
 for(let n=0;n<wheel.getCount();n++){
  const v=wheel.getElement(n,[]);if(v[3]<=.1)continue;movingVertices++;
  assert.ok(detail.getElement(n,[])[1]<.5,'Lamps never rotate');assert.ok(surface.getElement(n,[])[3]<.5,'Painted panels never rotate');
  const site=row.sites.findIndex(s=>Math.hypot(...s.center.map((p,k)=>p-v[k]))<.001);assert.ok(site>=0,'Authored wheel center retained');counts[site]++;
 }
 assert.ok(counts.every(n=>n>=12),'Four physical wheels have geometry');
 row.wheelVertices=counts;row.movingVertices=movingVertices;row.triangles=count;row.bytes=readFileSync(output).length;row.sha256=sha(readFileSync(output));
 row.texturesByteIdentical=check.getRoot().listTextures().every((t,n)=>sha(t.getImage())===sha(originals[n].getImage()));assert.ok(row.texturesByteIdentical);
 console.log(JSON.stringify(row));
}
writeFileSync(destination+'/provenance.json',JSON.stringify({description:'One-draw low-detail fleet with real tire pivots from the corresponding source hero. Only unpainted wheel triangles rotate. Every published texture stream and triangle is retained; native driving/contact rules are unchanged.',assets:rows},null,2)+'\n');
