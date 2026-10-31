import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const require=createRequire(process.env.ASSET_TOOLS_PACKAGE||new URL('./asset-tools/package.json',import.meta.url));
const {NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions'),{meshopt,dedup,prune,getBounds}=require('@gltf-transform/functions'),{MeshoptEncoder,MeshoptDecoder}=require('meshoptimizer');
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder}),hash=data=>createHash('sha256').update(data).digest('hex');
const triangleCount=d=>d.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((n,p)=>n+(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3,0),0);
const images=d=>[...new Set(d.getRoot().listTextures().filter(t=>t.listParents().some(p=>p.propertyType!=='Root')).map(t=>hash(t.getImage())))].sort();
mkdirSync('games/arcade/web/art/nightshift/fleet-v141',{recursive:true});const rows=[];
for(const file of ['concept.glb','concept-race.glb']){
 const source='games/arcade/web/art/nightshift/fleet-v131/'+file,output='games/arcade/web/art/nightshift/fleet-v141/'+file,doc=await io.read(source),before={triangles:triangleCount(doc),bounds:getBounds(doc.getRoot().listScenes()[0]),images:images(doc),nodes:doc.getRoot().listNodes().map(n=>n.getName()).sort()};
 // Remove retained intermediate accessors before re-encoding the same geometry.
 // No simplification or texture resize/re-encode. Unreferenced image streams
 // may be pruned; every stream referenced by a material/extension must survive.
 await doc.transform(dedup(),prune({keepLeaves:true}),meshopt({encoder:MeshoptEncoder,level:'high',quantizePosition:16,quantizeNormal:12,quantizeTexcoord:16,cleanup:false}));await io.write(output,doc);
 const check=await io.read(output),bounds=getBounds(check.getRoot().listScenes()[0]);assert.equal(triangleCount(check),before.triangles);assert.deepEqual(images(check),before.images,'Every referenced texture byte stream retained');assert.deepEqual(check.getRoot().listNodes().map(n=>n.getName()).sort(),before.nodes,'Original hierarchy retained');
 const maxBoundsDelta=Math.max(...['min','max'].flatMap(k=>before.bounds[k].map((v,n)=>Math.abs(v-bounds[k][n]))));assert.ok(maxBoundsDelta<.001);
 rows.push({source,output,sourceSha256:hash(readFileSync(source)),outputSha256:hash(readFileSync(output)),sourceBytes:readFileSync(source).length,bytes:readFileSync(output).length,triangles:before.triangles,textureStreams:before.images.length,texturesByteIdentical:true,maxBoundsDelta});
}
writeFileSync('games/arcade/web/art/nightshift/fleet-v141/vanta-provenance.json',JSON.stringify({description:'Pruned unused intermediate accessors and unreferenced image streams, then Meshopt re-encoded the published authored source. Every referenced texture image byte stream, triangle count and named hierarchy is retained; bounds differ by less than one millimetre.',assets:rows},null,2)+'\n');console.log(rows);
