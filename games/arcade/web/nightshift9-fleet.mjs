import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {prepareRig} from './nightshift9-motion.mjs';
import {block,merge} from './nightshift8-assets.mjs';

// Two licensed source bodies, six race builds. Vehicle IDs, collision envelopes,
// handling and economy remain with the V8 rules. See the in-game asset credits.
export const FLEET=Object.freeze([
 {body:'sportscar',paint:'#4c7c88',kit:'street',label:'STREET GT'},
 {body:'sportscar',paint:'#c1553c',kit:'drift',label:'DRIFT CLUBSPORT'},
 {body:'sportscar',paint:'#284c67',kit:'grandtour',label:'PURSUIT GT'},
 {body:'concept',paint:'#e2ded3',kit:'aero',label:'AERO COUPE'},
 {body:'concept',paint:'#508f91',kit:'electric',label:'ELECTRIC GT'},
 {body:'concept',paint:'#aa3840',kit:'track',label:'TRACK SPECIAL'}
]);

function sourceMaterial(mesh){return Array.isArray(mesh.material)?mesh.material[0]:mesh.material;}
function category(m){return m.name.split('.')[0];}
function cook(root,detail){
 root.updateMatrixWorld(true);const groups=new Map();
 root.traverse(o=>{if(!o.isMesh)return;let parent=o.parent,wheel=null;while(parent){if(/^Wheel_[FR][LR]/.test(parent.name)){wheel=parent;break;}parent=parent.parent;}
  const key=detail&&wheel?wheel.name:'Body';if(!groups.has(key))groups.set(key,{parts:[],wheel,transform:wheel?.matrixWorld.clone()});
  const g=o.geometry.clone(),local=detail&&wheel?wheel.matrixWorld.clone().invert().multiply(o.matrixWorld):o.matrixWorld;
  g.applyMatrix4(local);const geometry=g.index?g.toNonIndexed():g,m=sourceMaterial(o),name=category(m),count=geometry.attributes.position.count;
  for(const key of Object.keys(geometry.attributes))if(!['position','normal'].includes(key))geometry.deleteAttribute(key);
  if(!geometry.attributes.normal)geometry.computeVertexNormals();
  const color=new Float32Array(count*3),surface=new Float32Array(count*4),base=name==='Paint'?new T.Color('#ffffff'):m.color;
  const rearLamp=new T.Color('#df2933');for(let n=0;n<count;n++){const rearSignal=name==='Signal'&&geometry.attributes.position.getZ(n)>0,c=rearSignal?rearLamp:base;color.set([c.r,c.g,c.b],n*3);surface.set([name==='Paint'?.24:m.roughness??.6,name==='Paint'?.72:m.metalness??0,name==='Taillamp'||rearSignal?2:name==='Headlamp'?.9:name==='Signal'?.3:0,name==='Paint'?1:0],n*4);}
  geometry.setAttribute('color',new T.Float32BufferAttribute(color,3));geometry.setAttribute('surface',new T.Float32BufferAttribute(surface,4));groups.get(key).parts.push(geometry);
 });
 return [...groups.entries()].map(([name,g])=>{const geometry=mergeGeometries(g.parts);g.parts.forEach(p=>p.dispose());return{name,geometry,transform:g.transform};});
}
function finish(paint){
 const m=new T.MeshPhysicalMaterial({vertexColors:true,metalness:.6,roughness:.33,clearcoat:.7,clearcoatRoughness:.18,envMapIntensity:.55});
 const tint={value:new T.Color(paint)},brake={value:0};m.userData.brake=brake;
 m.onBeforeCompile=s=>{
  s.uniforms.fleetPaint=tint;s.uniforms.fleetBrake=brake;s.vertexShader='attribute vec4 surface; varying vec4 vSurface;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <color_vertex>','#include <color_vertex>\nvSurface=surface;');
  s.fragmentShader='uniform vec3 fleetPaint; uniform float fleetBrake; varying vec4 vSurface;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(vec3(1.),fleetPaint,vSurface.w);');
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=vSurface.x;');
  s.fragmentShader=s.fragmentShader.replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=vSurface.y;');
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*(vSurface.z>1.5?1.1+fleetBrake*3.5:vSurface.z);');
  s.fragmentShader=s.fragmentShader.replace('#include <lights_physical_fragment>',T.ShaderChunk.lights_physical_fragment.replace('material.clearcoat = clearcoat;','material.clearcoat = clearcoat*vSurface.w;'));
 };
 m.customProgramCacheKey=()=>'fleet-surface-v91';return m;
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

export async function loadFleet(manager){
 const loader=new GLTFLoader(manager),cache=new Map();
 await Promise.all(['sportscar','concept'].flatMap(body=>[false,true].map(async detail=>{
  const gltf=await loader.loadAsync(`/arcade/art/nightshift/cars/${body}-${detail?'hero':'race'}.glb`);cache.set(body+detail,cook(gltf.scene,detail));
 })));
 const make=(index,detail=true)=>{
  const spec=FLEET[index],g=new T.Group(),material=finish(spec.paint);g.userData.wheels=[];g.userData.index=index;g.userData.source=spec.body;
  for(const part of cache.get(spec.body+detail)){
   const m=new T.Mesh(part.geometry,material);m.castShadow=detail||part.name==='Body';m.receiveShadow=true;
   if(part.transform){part.transform.decompose(m.position,m.quaternion,m.scale);m.name=part.name;g.userData.wheels.push(m);}
   g.add(m);
  }
  const aero=kit(spec);if(aero)g.add(aero);g.updateMatrixWorld(true);const contacts=g.userData.wheels.length?g.userData.wheels.map(w=>new T.Box3().setFromObject(w).min.y):[new T.Box3().setFromObject(g).min.y];const ground=Math.min(...contacts);for(const child of g.children)child.position.y-=ground;g.updateMatrixWorld(true);g.userData.contactY=g.userData.wheels.map(w=>new T.Box3().setFromObject(w).min.y);prepareRig(g);return g;
 };
 return{cars:FLEET.map((_,i)=>make(i)),rivals:Array.from({length:5},(_,i)=>{const g=make(i+1,true);g.userData.far=make(i+1,false);g.add(g.userData.far);g.userData.far.visible=false;return g;}),traffic:Array.from({length:16},(_,i)=>make(i%6,false)),pursuer:make(2,false),sources:2,meshesPerRival:cache.get('conceptfalse').length};
}
