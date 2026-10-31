import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

function wheelSites(root){
 const sites=new Map(),box=new T.Box3(),size=new T.Vector3(),center=new T.Vector3();
 root.traverse(o=>{
  if(!o.isMesh)return;const m=Array.isArray(o.material)?o.material[0]:o.material;if(!/^(Rubber|Trim)/.test(m.name))return;
  box.copy(o.geometry.boundingBox||((o.geometry.computeBoundingBox()),o.geometry.boundingBox)).applyMatrix4(o.matrixWorld);box.getSize(size);box.getCenter(center);
  if(size.y<.43||size.y>.86||size.z<.43||size.z>.9||size.x<.08||size.x>.5||box.min.y>.15||Math.abs(center.x)<.5) return;
  const name='Wheel_'+(center.z<0?'F':'R')+(center.x<0?'L':'R'),old=sites.get(name);
  if(!old||size.y>old.radius*2)sites.set(name,{name,center:center.clone(),radius:size.y/2,width:size.x});
 });
 if(sites.size!==4)throw Error('Four physical tire sites required; found '+sites.size);return [...sites.values()];
}

function wheelForMesh(o,sites){
 const m=Array.isArray(o.material)?o.material[0]:o.material;if(/^(Paint|Glass|Interior|Headlamp|Taillamp|Signal)/.test(m.name))return null;
 const p=o.geometry.attributes.position,v=new T.Vector3();
 for(const site of sites){let inside=true;
  for(let n=0;n<p.count;n++){v.fromBufferAttribute(p,n).applyMatrix4(o.matrixWorld);if(Math.abs(v.x-site.center.x)>Math.max(.24,site.width/2+.07)||Math.hypot(v.y-site.center.y,v.z-site.center.z)>site.radius*1.12){inside=false;break;}}
  if(inside)return site;
 }
 return null;
}

// Presentation only. The normalized -Z nose, wheel transforms and rule envelope
// are unchanged. Keep authored UVs; a one-material batch masks untextured parts.
export function prepareFleetSurface(root,detail,body){
 root.updateMatrixWorld(true);const groups=new Map(),textures=new Set(),position=new T.Vector3(),sites=detail?wheelSites(root):[];
 root.traverse(o=>{
  if(!o.isMesh)return;const m=Array.isArray(o.material)?o.material[0]:o.material,name=m.name.split('.')[0];
  if(m.map)textures.add(m.map);const site=detail?wheelForMesh(o,sites):null,transform=site?new T.Matrix4().makeTranslation(...site.center.toArray()):null;
  const key=site?site.name:'Body';if(!groups.has(key))groups.set(key,{parts:[],transform});
  const local=site?transform.clone().invert().multiply(o.matrixWorld):o.matrixWorld,g=o.geometry.clone();g.applyMatrix4(local);
  const geometry=g.index?g.toNonIndexed():g;if(g!==geometry)g.dispose();
  for(const key of Object.keys(geometry.attributes))if(!['position','normal','uv'].includes(key))geometry.deleteAttribute(key);
  if(!geometry.attributes.normal)geometry.computeVertexNormals();const count=geometry.attributes.position.count;
  if(!geometry.attributes.uv)geometry.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(count*2),2));
  const color=new Float32Array(count*3),surface=new Float32Array(count*4),sampling=new Float32Array(count*2),base=name==='Paint'?new T.Color('#ffffff'):m.color.clone();
  for(let n=0;n<count;n++){
   position.fromBufferAttribute(geometry.attributes.position,n);if(site)position.applyMatrix4(transform);
   let lamp=name==='Taillamp'?1:name==='Headlamp'&&position.z< -1.3?2:0,emission=0,c=base;
   // Explicit source roles verified in the front/rear asset review. The BMW's
   // atlas also contains rims and badges; neither should emit or turn red.
   if(body==='bmw-320i'&&m.name==='Metal.008')lamp=1;
   if(body==='bmw-320i'&&m.name==='Metal.007')lamp=2;
   if(body==='nissan-s14'&&['Metal.001','Metal.002'].includes(m.name))lamp=position.z>1.45?1:position.z< -1.45?2:0;
   if(body==='nissan-s14'&&m.name==='Trim.002'&&position.z>1.45&&Math.abs(position.x)>.23)lamp=1;
   if(['audi-tt','porsche-911-gt3'].includes(body)&&name==='Glass'&&position.y<1.05&&Math.abs(position.x)>.4)lamp=position.z>1.45?1:position.z< -1.45?2:0;
   if(name==='Headlamp'&&position.z>1.45)lamp=1;
   if(lamp===1&&!m.map)c=new T.Color('#781923');
   if(lamp===2&&!m.map)c=new T.Color('#b5c5cf');
   if(lamp)emission=lamp===1?.45:.18;
   if(name==='Signal'){lamp=position.z>0?1:2;c=new T.Color(position.z>0?'#b92d32':'#e6b16a');emission=.25;}
   color.set([c.r,c.g,c.b],n*3);surface.set([lamp?.26:name==='Paint'?.27:m.roughness??.6,lamp?.08:name==='Paint'?.65:m.metalness??0,emission,name==='Paint'?1:0],n*4);
   sampling.set([m.map?1:0,lamp],n*2);
  }
  geometry.setAttribute('color',new T.Float32BufferAttribute(color,3));geometry.setAttribute('surface',new T.Float32BufferAttribute(surface,4));geometry.setAttribute('materialDetail',new T.Float32BufferAttribute(sampling,2));groups.get(key).parts.push(geometry);
 });
 if(textures.size>1)throw Error('Fleet surface needs an authored texture atlas: '+body);
 const texture=[...textures][0]||null;
 return {texture,wheelSites:sites.map(s=>({name:s.name,center:s.center.toArray(),radius:s.radius,width:s.width})),parts:[...groups].map(([name,g])=>{const geometry=mergeGeometries(g.parts);g.parts.forEach(p=>p.dispose());return {name,geometry,transform:g.transform};})};
}

export function fleetFinish(paint,map){
 const material=new T.MeshPhysicalMaterial({map,vertexColors:true,metalness:.6,roughness:.33,clearcoat:.65,clearcoatRoughness:.14,envMapIntensity:1.05});
 const tint={value:new T.Color(paint)},brake={value:0};material.userData.brake=brake;
 material.onBeforeCompile=s=>{
  s.uniforms.fleetPaint=tint;s.uniforms.fleetBrake=brake;
  s.vertexShader='attribute vec4 surface;attribute vec2 materialDetail;varying vec4 vSurface;varying vec2 vMaterialDetail;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <color_vertex>','#include <color_vertex>\nvSurface=surface;vMaterialDetail=materialDetail;');
  s.fragmentShader='uniform vec3 fleetPaint;uniform float fleetBrake;varying vec4 vSurface;varying vec2 vMaterialDetail;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(vec3(1.),fleetPaint,vSurface.w);');
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec4 fleetTexel=vec4(1.);
   #ifdef USE_MAP
    fleetTexel=texture2D(map,vMapUv);
   #endif
   diffuseColor*=mix(vec4(1.),fleetTexel,vMaterialDetail.x);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=vSurface.x;');
  s.fragmentShader=s.fragmentShader.replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=vSurface.y;');
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   float tail=step(.5,vMaterialDetail.y)*(1.-step(1.5,vMaterialDetail.y));
   float redLens=smoothstep(.06,.2,diffuseColor.r-max(diffuseColor.g,diffuseColor.b));
   float lampMask=mix(1.,redLens,tail);
   totalEmissiveRadiance+=diffuseColor.rgb*(vSurface.z+tail*fleetBrake*3.5)*lampMask;
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <lights_physical_fragment>',T.ShaderChunk.lights_physical_fragment.replace('material.clearcoat = clearcoat;','material.clearcoat = clearcoat*vSurface.w;'));
 };
 material.customProgramCacheKey=()=>'fleet-authored-uv-v141';return material;
}
