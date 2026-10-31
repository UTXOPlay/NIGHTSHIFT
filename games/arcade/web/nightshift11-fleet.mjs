import * as T from 'three';
import {authoredCar} from './nightshift11-authored-car.mjs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {prepareRig} from './nightshift9-motion.mjs';
import {block,merge} from './nightshift8-assets.mjs';
import {fleetFinish} from './nightshift141-fleet-surface.mjs';

// Six builds using five licensed bodies; source credits and modifications ship with the game.
export {FLEET} from './nightshift-fleet-specs.mjs';
import {FLEET} from './nightshift-fleet-specs.mjs';

function sourceMaterial(mesh){return Array.isArray(mesh.material)?mesh.material[0]:mesh.material;}
function category(m){return m.name.split('.')[0];}
const texturePixels=new WeakMap();
function pixels(map){if(!map?.image)return null;if(texturePixels.has(map.image))return texturePixels.get(map.image);const i=map.image,c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(i,0,0);const p={data:x.getImageData(0,0,c.width,c.height).data,width:c.width,height:c.height};texturePixels.set(i,p);return p;}
export function cook(root,detail){
 root.updateMatrixWorld(true);const groups=new Map();
 root.traverse(o=>{if(!o.isMesh)return;let parent=o.parent,wheel=null;while(parent){if(/^Wheel_[FR][LR]/.test(parent.name)){wheel=parent;break;}parent=parent.parent;}
  const key=detail&&wheel?wheel.name:'Body';if(!groups.has(key))groups.set(key,{parts:[],wheel,transform:wheel?.matrixWorld.clone()});
  const tex=pixels(sourceMaterial(o).map);const sample=new T.Color();const g=o.geometry.clone(),local=detail&&wheel?wheel.matrixWorld.clone().invert().multiply(o.matrixWorld):o.matrixWorld;
  g.applyMatrix4(local);const geometry=g.index?g.toNonIndexed():g,m=sourceMaterial(o),name=category(m),count=geometry.attributes.position.count,uv=geometry.attributes.uv;
  for(const key of Object.keys(geometry.attributes))if(!['position','normal','uv'].includes(key))geometry.deleteAttribute(key);
  if(!geometry.attributes.normal)geometry.computeVertexNormals();
  const color=new Float32Array(count*3),surface=new Float32Array(count*4),base=name==='Paint'?new T.Color('#ffffff'):m.color;
  const rearLamp=new T.Color('#df2933');for(let n=0;n<count;n++){const rearSignal=name==='Signal'&&geometry.attributes.position.getZ(n)>0,c=rearSignal?rearLamp:base;sample.copy(c);if(tex&&uv&&name!=='Paint'){const tx=Math.max(0,Math.min(tex.width-1,Math.round(uv.getX(n)*(tex.width-1)))),ty=Math.max(0,Math.min(tex.height-1,Math.round((1-uv.getY(n))*(tex.height-1)))),at=(ty*tex.width+tx)*4;sample.setRGB(tex.data[at]/255,tex.data[at+1]/255,tex.data[at+2]/255,T.SRGBColorSpace).multiply(c);}color.set([sample.r,sample.g,sample.b],n*3);surface.set([name==='Paint'?.24:m.roughness??.6,name==='Paint'?.65:m.metalness??0,name==='Taillamp'||rearSignal?2:name==='Headlamp'?.9:name==='Signal'?.3:0,name==='Paint'?1:0],n*4);}
  geometry.deleteAttribute('uv');geometry.setAttribute('color',new T.Float32BufferAttribute(color,3));geometry.setAttribute('surface',new T.Float32BufferAttribute(surface,4));groups.get(key).parts.push(geometry);
 });
 return [...groups.entries()].map(([name,g])=>{const geometry=mergeGeometries(g.parts);g.parts.forEach(p=>p.dispose());return{name,geometry,transform:g.transform};});
}
function restoreGeometry(mesh){
 const geometry=mesh.geometry;
 for(const name of ['position','normal']){const a=geometry.getAttribute(name);if(!a)continue;const values=new Float32Array(a.count*a.itemSize);for(let n=0;n<a.count;n++)for(let k=0;k<a.itemSize;k++)values[n*a.itemSize+k]=a.getComponent(n,k);geometry.setAttribute(name,new T.Float32BufferAttribute(values,a.itemSize));}
 geometry.applyMatrix4(mesh.matrixWorld);return geometry;
}
function kit(spec){
 const g=new T.Group(),carbon=new T.MeshStandardMaterial({color:'#182128',metalness:.6,roughness:.37});
 const rear=spec.body==='sportscar'?1.6:1.35;
 if(['drift','track','aero'].includes(spec.kit)){
  const height=spec.kit==='track'?1.21:spec.kit==='drift'?1.02:.83;
  g.add(block(2.07,.055,.31,carbon,0,height,rear,.018));
  for(const side of [-1,1]){g.add(block(.045,height-.56,.13,carbon,side*.65,(height+.56)/2,rear));g.add(block(.045,.19,.35,carbon,side*1.02,height+.025,rear));}
 }
 if(['drift','track'].includes(spec.kit))for(const side of [-1,1]){g.add(block(.16,.065,2.6,carbon,side*1.01,.2,.08,.022));const canard=block(.33,.035,.24,carbon,side*.9,.28,-1.75,.015);canard.rotation.z=side*.12;g.add(canard);}
 if(spec.kit==='electric')for(const side of [-1,1])g.add(block(.045,.045,2.1,new T.MeshBasicMaterial({color:'#a4e4d9'}),side*1.01,.23,0));
 return g.children.length?merge(g):null;
}

export async function loadFleet(manager,initialVehicle=0){
 const loader=new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder),cache=new Map(),tasks=new Map(),authored=new Map(),authoredTasks=new Map(),textures=new Map(),timings={};
 const ensure=(body,detail)=>{
  const key=body+detail;if(tasks.has(key))return tasks.get(key);const start=performance.now();
  const task=loader.loadAsync(`/arcade/art/nightshift/fleet-ready-v141/${body}-${detail?'hero':'race'}.glb`).then(gltf=>{
   const fetched=performance.now(),parts=[];gltf.scene.updateMatrixWorld(true);
   gltf.scene.traverse(mesh=>{
    if(!mesh.isMesh)return;const geometry=restoreGeometry(mesh),surface=geometry.getAttribute('_surface'),sampling=geometry.getAttribute('_materialdetail');
    if(!surface||!sampling||!geometry.attributes.uv)throw Error('Invalid authored fleet attributes');
    geometry.setAttribute('surface',surface);geometry.deleteAttribute('_surface');geometry.setAttribute('materialDetail',sampling);geometry.deleteAttribute('_materialdetail');
    const map=mesh.material.map;if(map){if(!textures.has(body))textures.set(body,map);else if(textures.get(body)!==map)map.dispose();}
    parts.push({name:mesh.name,geometry,transform:mesh.userData.wheelTransform?new T.Matrix4().fromArray(mesh.userData.wheelTransform):null});mesh.material.dispose();
   });
   timings[key]={fetchDecodeMs:fetched-start,restoreMs:performance.now()-fetched};cache.set(key,parts);
  }).catch(e=>{tasks.delete(key);throw e;});tasks.set(key,task);return task;
 };
 await ensure(FLEET[initialVehicle].body,false);
 const make=(index,detail=false,variant="hero")=>{
  const spec=FLEET[index];if(!detail&&!cache.has(spec.body+false)){const empty=new T.Group();empty.userData.wheels=[];empty.userData.pending=true;return empty;}if(index===0&&detail)return authoredCar(authored.get(variant).scene,spec.paint);const g=new T.Group(),material=fleetFinish(spec.paint,textures.get(spec.body)||null);g.userData.wheels=[];g.userData.index=index;g.userData.source=spec.body;
  for(const part of cache.get(spec.body+detail)){
   const m=new T.Mesh(part.geometry,material);m.castShadow=detail||part.name==='Body';m.receiveShadow=true;
   if(part.transform){part.transform.decompose(m.position,m.quaternion,m.scale);m.name=part.name;g.userData.wheels.push(m);}
   g.add(m);
  }
  g.updateMatrixWorld(true);const ground=new T.Box3().setFromObject(g).min.y;for(const child of g.children)child.position.y-=ground;g.updateMatrixWorld(true);for(const wheel of g.userData.wheels){wheel.position.y-=new T.Box3().setFromObject(wheel).min.y;wheel.updateMatrixWorld(true);}g.updateMatrixWorld(true);g.userData.contactY=g.userData.wheels.map(w=>new T.Box3().setFromObject(w).min.y);prepareRig(g);return g;
 };
 const detailed=new Map();
 const detail=async(index,role='player',variant='hero')=>{const key=index+':'+role+':'+variant;if(detailed.has(key))return detailed.get(key);const task=(async()=>{await ensure(FLEET[index].body,false);if(index===0){if(!authoredTasks.has(variant))authoredTasks.set(variant,loader.loadAsync('/arcade/art/nightshift/fleet-v141/'+(variant==='race'?'concept-race.glb':'concept.glb')).then(model=>authored.set(variant,model)).catch(e=>{authoredTasks.delete(variant);throw e;}));await authoredTasks.get(variant);}else await ensure(FLEET[index].body,true);const g=make(index,true,variant);if(index!==0){g.userData.far=make(index,false);g.userData.far.visible=false;g.add(g.userData.far);}return g;})().catch(e=>{detailed.delete(key);throw e;});detailed.set(key,task);return task;};
 const racing=async()=>{await Promise.all([...new Set(FLEET.map(s=>s.body))].map(body=>ensure(body,false)));return{rivals:Array.from({length:5},(_,i)=>make(i+1)),traffic:Array.from({length:16},(_,i)=>make(i%6)),pursuer:make(2),ghost:make(0)};};
 return{racing,prepareVehicle:index=>ensure(FLEET[index].body,false),cars:FLEET.map((_,i)=>make(i)),rivals:Array.from({length:5},(_,i)=>make(i+1)),traffic:Array.from({length:16},(_,i)=>make(i%6)),pursuer:make(2),ghost:make(0),detail,make,timings,sources:new Set(FLEET.map(s=>s.body)).size};
}
