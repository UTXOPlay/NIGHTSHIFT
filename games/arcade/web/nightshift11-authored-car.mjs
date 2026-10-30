import * as T from 'three';
import{mergeGeometries}from'three/addons/utils/BufferGeometryUtils.js';
import{prepareRig}from'./nightshift9-motion.mjs';
// Retain the author's PBR textures, normal maps, glass, panel edges and real wheels.
export function authoredCar(source,paint){
 source.updateMatrixWorld(true);const root=new T.Group(),groups=new Map(),materials=new Map(),turn=new T.Matrix4().makeRotationY(Math.PI),brakes=[];
 function material(src){if(materials.has(src))return materials.get(src);const m=src.clone();if(/^Paint 1/.test(m.name)){m.color.set(paint);m.metalness=.65;m.roughness=.32;m.clearcoat=1;m.clearcoatRoughness=.12;}if(/^Paint 2/.test(m.name)){m.color.set('#20252a');m.roughness=.38;}if(m.name==='Glass'){m.transmission=0;m.transparent=true;m.opacity=.38;m.depthWrite=false;m.roughness=.08;}if(m.name==='Brakelight'){m.emissiveIntensity=.7;brakes.push(m);}materials.set(src,m);return m;}
 source.traverse(o=>{if(!o.isMesh)return;if(/Emblem|License|Wiper|Pedal/.test(o.name))return;let parent=o,wheel=null;while(parent){if(/^Wheel(Front|Rear)[LR]$/.test(parent.name)){wheel=parent.name;break;}parent=parent.parent;}
 const src=Array.isArray(o.material)?o.material[0]:o.material,key=wheel||'Body:'+src.uuid,g=o.geometry.clone();g.applyMatrix4(turn.clone().multiply(o.matrixWorld));for(const a of Object.keys(g.attributes))if(!['position','normal','uv'].includes(a))g.deleteAttribute(a);if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));const flat=g.index?g.toNonIndexed():g;if(!flat.attributes.normal)flat.computeVertexNormals();if(!groups.has(key))groups.set(key,[]);groups.get(key).push({g:flat,m:material(src)});
 });
 root.userData.wheels=[];root.userData.brakeMaterials=brakes;
 for(const[key,parts]of groups){const geo=mergeGeometries(parts.map(p=>p.g),!!key.startsWith('Wheel')),m=key.startsWith('Wheel')?parts.map(p=>p.m):parts[0].m,mesh=new T.Mesh(geo,m);parts.forEach(p=>p.g.dispose());mesh.name=key;mesh.castShadow=mesh.receiveShadow=true;if(key.startsWith('Wheel'))root.userData.wheels.push(mesh);root.add(mesh);}
 root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3()),scale=Math.min(4.28/size.z,2.08/size.x),offset=new T.Vector3(-(box.min.x+box.max.x)/2,-box.min.y,-(box.min.z+box.max.z)/2);
 for(const mesh of root.children){mesh.geometry.translate(offset.x,offset.y,offset.z);mesh.geometry.scale(scale,scale,scale);if(root.userData.wheels.includes(mesh)){mesh.geometry.computeBoundingBox();const center=mesh.geometry.boundingBox.getCenter(new T.Vector3());mesh.geometry.translate(-center.x,-center.y,-center.z);mesh.position.copy(center);}}
 root.updateMatrixWorld(true);root.userData.contactY=root.userData.wheels.map(w=>new T.Box3().setFromObject(w).min.y);prepareRig(root);return root;
}
