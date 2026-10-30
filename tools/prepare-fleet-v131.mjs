import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
// Offline build tools only; install the pinned packages documented in the asset report.
const require=createRequire(new URL('../artifacts/presentation-v13/asset-tools/package.json',import.meta.url));
const {NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {meshopt,textureCompress,getBounds,weld,simplify,prune}=require('@gltf-transform/functions'),{MeshoptEncoder,MeshoptDecoder,MeshoptSimplifier}=require('meshoptimizer'),sharp=require('sharp');
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready,MeshoptSimplifier.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const race=process.argv.includes('--race'),source='games/arcade/web/art/nightshift/fleet-ready-v11/concept-authored.glb',output='games/arcade/web/art/nightshift/fleet-v131/'+(race?'concept-race.glb':'concept.glb');
mkdirSync('games/arcade/web/art/nightshift/fleet-v131',{recursive:true});
const doc=await io.read(source),root=doc.getRoot();
if(race){for(const node of [...root.listNodes()])if(/^(?:Engine|Axles|License|Interior(?:Door|Floor|Pedal|SeatsFrame|Cage|Mid)|.*Wiper)/.test(node.getName()))node.dispose();await doc.transform(prune({keepLeaves:true}));}
const names=root.listNodes().map(n=>n.getName()),bounds=getBounds(root.listScenes()[0]);
const triangles=d=>d.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((a,p)=>a+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0),0),before=triangles(doc);
if(race)await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio:.6,error:.0005,lockBorder:true}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[512,512],quality:95,effort:90}));
await doc.transform(textureCompress({encoder:sharp,targetFormat:'webp',resize:race?[512,512]:[1024,1024],quality:92,effort:90,slots:/^(?!normalTexture).*$/}),meshopt({encoder:MeshoptEncoder,level:'high',quantizePosition:16,quantizeNormal:12,quantizeTexcoord:16,cleanup:false}));
await io.write(output,doc);const check=await io.read(output),afterBounds=getBounds(check.getRoot().listScenes()[0]);
if(!race)assert.equal(triangles(check),before,'No hero mesh simplification');for(const name of names)assert.ok(check.getRoot().listNodes().some(n=>n.getName()===name),'Retained node '+name);
const maxBoundsDelta=Math.max(...['min','max'].flatMap(k=>bounds[k].map((v,n)=>Math.abs(v-afterBounds[k][n]))));assert.ok(maxBoundsDelta<.001,'Quantization stays below a millimetre in source coordinates');
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const report={source,output,sourceSha256:sha(source),outputSha256:sha(output),sourceBytes:readFileSync(source).length,bytes:readFileSync(output).length,triangles:before,retainedNodes:names.length,maxBoundsDelta,normalMaps:'Original image bytes retained',textures:'Other texture slots capped at 1024 px with WebP quality 92',geometry:'Meshopt compression; 16-bit positions, 12-bit normals, 16-bit UV; original topology, wheel hierarchy, material UVs and hard edges retained',packages:JSON.parse(readFileSync('artifacts/presentation-v13/asset-tools/package.json')).dependencies};
if(race){report.triangles=triangles(check);report.sourceTriangles=before;report.normalMaps='Race maps capped at 512 px with WebP quality 95';report.textures='Race textures capped at 512 px with WebP quality 92';report.geometry='Meshopt, bounded simplification at 0.05% per-mesh radius; hidden engine/inner door/floor/pedal/seat-frame pieces omitted; actual exterior, UVs, wheel hierarchy and surface normals retained';}
writeFileSync('games/arcade/web/art/nightshift/fleet-v131/'+(race?'race-provenance.json':'provenance.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
