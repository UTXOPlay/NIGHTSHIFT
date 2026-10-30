import {build} from 'esbuild';
import express from 'express';
import {chromium} from 'playwright';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const destination='games/arcade/web/art/nightshift/fleet-ready-v141',scratch='artifacts/presentation-v141/fleet-raw';mkdirSync(destination,{recursive:true});mkdirSync(scratch,{recursive:true});
const entry=`import * as T from 'three';import{GLTFLoader}from'three/addons/loaders/GLTFLoader.js';import{GLTFExporter}from'three/addons/exporters/GLTFExporter.js';import{prepareFleetSurface}from'./games/arcade/web/nightshift141-fleet-surface.mjs';import{FLEET}from'./games/arcade/web/nightshift-fleet-specs.mjs';globalThis.bake=async()=>{const loader=new GLTFLoader(),rows=[];for(const body of new Set(FLEET.map(x=>x.body)))for(const detail of [false,true]){if(body==='concept-v11'&&detail)continue;const source=await loader.loadAsync('/arcade/art/nightshift/fleet-v11/'+body+'-'+(detail?'hero':'race')+'.glb'),group=new T.Group(),prepared=prepareFleetSurface(source.scene,detail,body),material=new T.MeshBasicMaterial({vertexColors:true,map:prepared.texture});for(const part of prepared.parts){const mesh=new T.Mesh(part.geometry,material);mesh.name=part.name;if(part.transform)mesh.userData.wheelTransform=part.transform.toArray();group.add(mesh);}const bytes=new Uint8Array(await new GLTFExporter().parseAsync(group,{binary:true,onlyVisible:false}));let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));rows.push({name:body+'-'+(detail?'hero':'race')+'.glb',source:body+'-'+(detail?'hero':'race')+'.glb',parts:prepared.parts.length,wheelSites:prepared.wheelSites,texture:!!prepared.texture,data:btoa(binary)});}return rows;};`;
const result=await build({stdin:{contents:entry,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',target:'es2022'}),app=express();
app.get('/',(_q,r)=>r.type('html').send('<script type="module" src="/bake.mjs"></script>'));app.get('/bake.mjs',(_q,r)=>r.type('js').send(result.outputFiles[0].text));app.use('/arcade',express.static('games/arcade/web'));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const browser=await chromium.launch({args:['--no-sandbox']});let rows;
try{const p=await browser.newPage();await p.goto('http://127.0.0.1:'+server.address().port);await p.waitForFunction(()=>typeof bake==='function');rows=await p.evaluate(()=>bake());for(const r of rows){writeFileSync(scratch+'/'+r.name,Buffer.from(r.data,'base64'));delete r.data;}}
finally{await browser.close();await new Promise(r=>server.close(r));}
const require=createRequire(process.env.ASSET_TOOLS_PACKAGE||new URL('./asset-tools/package.json',import.meta.url));
const {NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions'),{meshopt,getBounds,weld,textureCompress}=require('@gltf-transform/functions'),{MeshoptEncoder,MeshoptDecoder}=require('meshoptimizer'),sharp=require('sharp');await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder}),sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
for(const row of rows){
 const input=scratch+'/'+row.name,output=destination+'/'+row.name,doc=await io.read(input),bounds=getBounds(doc.getRoot().listScenes()[0]),triangles=d=>d.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((sum,p)=>sum+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0),0),before=triangles(doc);
 await doc.transform(weld(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:94,effort:85}),meshopt({encoder:MeshoptEncoder,level:'high',quantizePosition:16,quantizeNormal:12,quantizeTexcoord:16,cleanup:false}));await io.write(output,doc);
 const check=await io.read(output),after=getBounds(check.getRoot().listScenes()[0]);row.maxBoundsDelta=Math.max(...['min','max'].flatMap(k=>bounds[k].map((v,n)=>Math.abs(v-after[k][n]))));assert.ok(row.maxBoundsDelta<.001,'Sub-millimetre bounds '+row.name);
 assert.equal(triangles(check),before,'Original triangles retained');for(const mesh of check.getRoot().listMeshes()){const p=mesh.listPrimitives()[0];for(const key of ['POSITION','NORMAL','TEXCOORD_0','COLOR_0','_SURFACE','_MATERIALDETAIL'])assert.ok(p.getAttribute(key),'Retained '+key+' '+row.name);}
 row.bytes=readFileSync(output).length;row.sha256=sha(output);row.sourceSha256=sha('games/arcade/web/art/nightshift/fleet-v11/'+row.source);console.log(JSON.stringify(row));
}
writeFileSync(destination+'/provenance.json',JSON.stringify({description:'Authored UVs and albedo retained; physical tire pivots reconstructed from the actual tire meshes, and one material batch per part. Explicit lamp roles verified in canonical front/rear views. Meshopt storage compression only; no geometry simplification or rules changes. Original model licenses remain unchanged.',assets:rows},null,2)+'\n');
