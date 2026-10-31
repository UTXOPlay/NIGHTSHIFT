import * as T from 'three';
import {circuitFacade,structureSurface} from './nightshift13-architecture.mjs';
import {facadeAtlas,loadStructureTexture} from './nightshift9-architecture.mjs';
import {GEO,FACADES,STREET_VARIANTS,buildDistrict,streetVariant} from './nightshift9-streets.mjs';
import {DISTRICTS,routeSector} from './nightshift9-world-route.mjs';
import {installCargoPaint} from './nightshift9-industrial.mjs';
import {harbourFacade} from './nightshift141-harbour.mjs';
const material=(color,roughness=.65,metalness=.15)=>new T.MeshStandardMaterial({color,roughness,metalness});
export class RouteWorld{
 constructor(scene){
  this.scene=scene;this.environmentRoot=new T.Group();this.environmentRoot.name='Stationary street instances';this.environmentRoot.matrixAutoUpdate=false;scene.add(this.environmentRoot);this.uploadKey=null;this.originDistance=null;this.matrixWrites=0;this.colorWrites=0;this.pools=new Map();this.temp=new T.Object3D();this.root=new T.Object3D();this.matrix=new T.Matrix4();this.color=new T.Color();
  this.m={stone:material('#b8b7b4',.95),cell:material('#d6ded8',.4,.45),cargo:material('#aebbc1',.7,.35),tunnel:material('#a1aeaf',.65,.3),steel:material('#74848d',.5,.65),white:material('#dce8e7',.55,.25),ground:material('#bcc4c4',.95),water:material('#5f9ca7',.23,.65),leaves:material('#709676',.95),glass:material('#82acae',.23,.65),light:new T.MeshBasicMaterial({color:'#fff4e4',toneMapped:false})};
  this.m.structure=material('#ffffff',.72,.25);this.m.cargoPaint=material('#ffffff',.78,.12);installCargoPaint(this.m.cargoPaint);this.m.quay=material('#a2aaa8',.94,0);
  const stamp=document.createElement('canvas');stamp.width=512;stamp.height=128;const ink=stamp.getContext('2d');ink.fillStyle='#e0e6dc';ink.font='700 64px Arial';ink.fillText('NERVOS',4,61);ink.font='700 23px Arial';ink.fillText('RELAY FREIGHT / CKB',5,105);const paint=new T.CanvasTexture(stamp);paint.colorSpace=T.SRGBColorSpace;this.m.stencil=new T.MeshBasicMaterial({map:paint,alphaTest:.35,depthWrite:false});
  this.waterTime={value:0};this.m.water.color.set('#345968');this.m.water.metalness=0;this.m.water.roughness=.2;
  this.m.water.onBeforeCompile=s=>{s.uniforms.waterTime=this.waterTime;s.vertexShader='varying vec2 waterUv;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nwaterUv=uv*vec2(150.,18.);');s.fragmentShader='varying vec2 waterUv;uniform float waterTime;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec2 ripples=vec2(sin(waterUv.x*1.9+waterUv.y*.7+waterTime*.65),cos(waterUv.y*2.1-waterUv.x*.4+waterTime*.48));
   normal=normalize(normal+mat3(viewMatrix)*vec3(ripples.x*.055,0.,ripples.y*.055));
  `);};this.m.water.customProgramCacheKey=()=>'water-ripples-v96';
  for(const [name] of FACADES)this.m[name]=material('#dce1e5',name==='office'?.4:.82,name==='office'?.12:.02);
  this.m.harbour=material('#ffffff',.83,.04);
  this.facadeNight={value:1};this.terrainRegion={value:new T.Vector2(0,.5)};for(const name of ['fir','snowFir','scrub','broadleaf'])this.m[name]=new T.MeshStandardMaterial({color:'#ffffff',roughness:.95,metalness:0,side:T.DoubleSide,alphaTest:.4});
  this.templates=Array(12).fill(null);this.modeTasks=new Map();
  this.gateParts=[];for(const s of [-1,1]){this.add(this.gateParts,'steel',s*8.6,4.3,0,.4,8.6,.4);this.add(this.gateParts,'light',s*8.37,4.3,.22,.06,8.5,.06);}this.add(this.gateParts,'steel',0,8.6,0,17.6,.4,.4);

  this.signMaterials=Array(12).fill(null);this.m.signPlaceholder=new T.MeshBasicMaterial({color:'#10232b'});
  this.signs=Array.from({length:5},()=>{const s=new T.Mesh(new T.PlaneGeometry(6,1.8),this.m.signPlaceholder);s.visible=false;scene.add(s);return s;});
  this.gates=Array.from({length:3},()=>{const s=new T.Mesh(new T.PlaneGeometry(9.2,2.1),this.m.signPlaceholder);s.visible=false;scene.add(s);return s;});
  this.current=0;this.sector=0;this.fog=new T.Color();this.light=new T.Color();this.sky=0;this.rain=0;
 }
 add(out,mat,x,y,z,w,h,d,rx=0,ry=0,rz=0,geometry=GEO.box,color='#ffffff'){
  if(geometry===GEO.box&&w>=4&&h>=3&&d>=3&&(mat==='harbour'||FACADES.some(f=>f[0]===mat)))geometry=GEO.building;
  if((mat==='harbour'||FACADES.some(f=>f[0]===mat))&&h>=2&&Math.abs(y-h/2)<.02){y-=.2;h+=.4;}
  const material=this.m[mat],key=geometry.uuid+'/'+material.uuid;if(!this.pools.has(key)){
   const mesh=new T.InstancedMesh(geometry,material,1600);mesh.matrixAutoUpdate=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;mesh.visible=false;mesh.receiveShadow=true;mesh.castShadow=[...FACADES.map(f=>f[0]),'harbour','steel','white','structure','cargoPaint','quay','fir','snowFir','scrub','broadleaf'].some(k=>material===this.m[k]);this.environmentRoot.add(mesh);this.pools.set(key,{geometry,material,index:0,mesh});
  }
  this.temp.position.set(x,y,z);this.temp.rotation.set(rx,ry,rz);this.temp.scale.set(w,h,d);this.temp.updateMatrix();out.push({pool:this.pools.get(key),matrix:this.temp.matrix.clone(),color:new T.Color(color),detail:!!geometry.userData.detail,roadAnchor:!!geometry.userData.roadAnchor});
 }
 async prepare(mode){
  if(this.modeTasks.has(mode))return this.modeTasks.get(mode);
  this.signMaterials[mode]??=DISTRICTS[mode].zones.map((zone,n)=>this.sign(DISTRICTS[mode],zone,n));
  const task=(async()=>{const templates=[];for(let n=0;n<STREET_VARIANTS;n++){templates.push(this.template(mode,n));if(n%3===2)await new Promise(r=>setTimeout(r,0));}this.templates[mode]=templates;})();this.modeTasks.set(mode,task);return task;
 }
 template(id,n){return buildDistrict(this,id,n);}
 sign(d,zone,n){
  const c=document.createElement('canvas');c.width=768;c.height=256;const x=c.getContext('2d');x.fillStyle='#10232be8';x.fillRect(0,0,768,256);x.strokeStyle=d.color;x.lineWidth=5;x.strokeRect(7,7,754,242);x.fillStyle=d.color;x.font='700 22px Arial';x.fillText(d.name.startsWith('NERVOS ')?d.name:'NERVOS / '+d.name,28,52);x.font='800 48px Arial';x.fillStyle='#eff7ee';x.fillText(zone.toUpperCase(),28,127);x.font='23px Arial';x.fillStyle=d.color;x.fillText('SECTOR 0'+(n+1)+'   /   KEEP THE RELAY MOVING',28,193);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map:texture});
 }
 async load(loader,mode=0){
  this.baseTask??=this.loadBase(loader).catch(e=>{this.baseTask=null;throw e;});const tasks=[this.baseTask];
  if(mode===0){this.harbourTask??=loader.loadAsync('/arcade/art/nightshift/harbour-facades-v141.webp').then(texture=>{texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;harbourFacade(this.m.harbour,texture,this.facadeNight);}).catch(e=>{this.harbourTask=null;throw e;});tasks.push(this.harbourTask);}
  else if(mode!==4){this.facadeTask??=loader.loadAsync('/arcade/art/nightshift/architecture-v131.webp').then(texture=>{texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;FACADES.forEach(([key,tile,w,h])=>circuitFacade(this.m[key],texture,tile,w,h,this.facadeNight));}).catch(e=>{this.facadeTask=null;throw e;});tasks.push(this.facadeTask);}
  if([1,2,3,5,6,8,9].includes(mode)){this.foliageTask??=loader.loadAsync('/arcade/art/nightshift/world-foliage-v131.webp').then(async foliage=>{await this.baseTask;foliage.colorSpace=T.SRGBColorSpace;['fir','snowFir','scrub','broadleaf'].forEach((name,n)=>{const t=foliage.clone();t.repeat.set(.498,n<2?.543:.449);t.offset.set((n%2)*.5+.001,n<2?.456:.001);t.needsUpdate=true;this.m[name].map=t;this.m[name].needsUpdate=true;});}).catch(e=>{this.foliageTask=null;throw e;});tasks.push(this.foliageTask);}
  if([1,2,5,6,7,8,9].includes(mode)){this.terrainTask??=loader.loadAsync('/arcade/art/nightshift/world-terrain-v131.webp').then(async terrain=>{await this.baseTask;terrain.colorSpace=T.SRGBColorSpace;terrain.anisotropy=4;
   for(const name of ['ground','stone']){const m=this.m[name];m.map=terrain;m.onBeforeCompile=shader=>{shader.uniforms.terrainRegion=this.terrainRegion;shader.fragmentShader='uniform vec2 terrainRegion;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2DGradEXT(map,terrainRegion+vec2(.003)+abs(fract(vMapUv*vec2('+(name==='ground'?'28.,4.':'2.,2.')+')*.5)*2.-1.)*.494,dFdx(vMapUv)*vec2('+(name==='ground'?'28.,4.':'2.,2.')+')*.494,dFdy(vMapUv)*vec2('+(name==='ground'?'28.,4.':'2.,2.')+')*.494)'));};m.customProgramCacheKey=()=>'terrain7-'+name;m.needsUpdate=true;}
  }).catch(e=>{this.terrainTask=null;throw e;});tasks.push(this.terrainTask);}
  await Promise.all(tasks);
 }
 async loadBase(loader){
  const [atlas,structures]=await Promise.all([loader.loadAsync('/arcade/art/nightshift/relay-materials-v131.webp'),loadStructureTexture(loader)]);
  atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=4;
  for(const [key,u,v,repeat]of[['stone',0,.5,2],['cell',.5,.5,2],['cargo',0,0,1],['tunnel',.5,0,2]]){const m=this.m[key];m.map=atlas;m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D(map,vec2('+(u+.003)+','+(v+.003)+')+fract(vMapUv*'+repeat+'.0)*.494)'));};m.customProgramCacheKey=()=>'world7-'+key;m.needsUpdate=true;}
  for(const [key,tile]of[['steel',0],['white',1],['tunnel',3],['structure',0],['quay',1]])structureSurface(this.m[key],structures,tile);
  this.m.white.metalness=0;this.m.quay.metalness=0;this.m.structure.roughness=.56;this.m.structure.metalness=.4;
 }

 snapshot(){return{mode:'stationary-instancing',matrixWrites:this.matrixWrites,colorWrites:this.colorWrites,pools:this.pools.size,streetVariants:STREET_VARIANTS,facadeFamilies:FACADES.length,nearDetailInstances:this.detailCount||0,detailRange:this.detailRange||0,instanceCount:[...this.pools.values()].reduce((n,p)=>n+p.mesh.count,0),maxPoolCount:Math.max(...[...this.pools.values()].map(p=>p.mesh.count))};}
 dispose(){}
 draw(distance,mode,total,roadX,qualityTier=0){
  if(!this.templates[mode])return;const travel=distance*.1,map=DISTRICTS[mode];this.current=mode;this.facadeNight.value=[3,10].includes(mode)?1:[0,9,11].includes(mode)?.6:mode===8?.24:.08;this.sector=routeSector(distance,total);const region=[3,0,1,3,2,2,2,3,1,0,3,0][mode];this.terrainRegion.value.set((region%2)*.5,region<2?.5:0);
  this.detailRange=qualityTier>=2?0:qualityTier===1?64:110;
  const stationary=!!roadX.fixedFrame,gateMask=Array.from({length:3},(_,n)=>{const z=travel-total*.1*(n+1)/4;return z<15&&z>-380?1:0;}).join(''),key=mode+':'+(roadX.profileKey?.()||0)+':'+Math.floor(travel/18)+':'+gateMask+':'+qualityTier,rebuild=!stationary||key!==this.uploadKey;
  this.matrixWrites=this.colorWrites=0;
  if(stationary){if(this.originDistance!==distance||rebuild){roadX.originMatrix(this.environmentRoot.matrix);this.environmentRoot.matrixWorldNeedsUpdate=true;this.originDistance=distance;}}else this.environmentRoot.matrix.identity();
  if(rebuild){
   this.uploadKey=key;this.detailCount=0;for(const p of this.pools.values())p.index=0;
   for(let n=0;n<25;n++){const absolute=(Math.floor(travel/18)-2+n)*18,z=travel-absolute,sector=routeSector(absolute*10,total),variant=streetVariant(mode,Math.floor(absolute/18),sector);
    if(stationary)roadX.fixedFrame(absolute*10,this.root);else{this.root.position.set(roadX(z),0,z);this.root.rotation.set(0,0,0);roadX.frame?.(z,this.root);}this.root.updateMatrix();
    for(const part of this.templates[mode][variant]){if(part.detail&&(!this.detailRange||z>25||z< -this.detailRange))continue;const p=part.pool;if(p.index>=1600)throw Error('World instance budget exceeded');if(part.roadAnchor&&roadX.fixedRoadFrame){part.matrix.decompose(this.temp.position,this.temp.quaternion,this.temp.scale);const {x,y,z:offset}=this.temp.position;roadX.fixedRoadFrame((absolute-offset)*10,x,y,this.temp);this.temp.updateMatrix();this.matrix.copy(this.temp.matrix);}else this.matrix.multiplyMatrices(this.root.matrix,part.matrix);p.mesh.setMatrixAt(p.index,this.matrix);p.mesh.setColorAt(p.index++,part.color);if(part.detail)this.detailCount++;this.matrixWrites++;this.colorWrites++;}
   }
   for(let n=0;n<3;n++)if(gateMask[n]==='1'){const absolute=total*(n+1)/4,z=travel-absolute*.1;if(stationary)roadX.fixedFrame(absolute,this.root);else{this.root.position.set(roadX(z),0,z);this.root.rotation.set(0,0,0);roadX.frame?.(z,this.root);}this.root.updateMatrix();for(const part of this.gateParts){const p=part.pool;this.matrix.multiplyMatrices(this.root.matrix,part.matrix);p.mesh.setMatrixAt(p.index,this.matrix);p.mesh.setColorAt(p.index++,part.color);this.matrixWrites++;this.colorWrites++;}}
   for(const p of this.pools.values()){p.mesh.count=p.index;p.mesh.visible=p.index>0;if(p.index){p.mesh.instanceMatrix.clearUpdateRanges();p.mesh.instanceMatrix.addUpdateRange(0,p.index*16);p.mesh.instanceMatrix.needsUpdate=true;if(p.mesh.instanceColor){p.mesh.instanceColor.clearUpdateRanges();p.mesh.instanceColor.addUpdateRange(0,p.index*3);p.mesh.instanceColor.needsUpdate=true;}}}
  }
  this.signs.forEach((s,n)=>{const absolute=(Math.floor(travel/90)-1+n)*90,z=travel-absolute,zone=routeSector(absolute*10,total);s.material=this.signMaterials[mode][zone];s.position.set(roadX(z)+(n%2?12:-12),5,z);s.rotation.set(0,n%2?-.15:.15,0);roadX.transform?.(s,true);s.visible=mode!==10;});
  this.gates.forEach((s,n)=>{const z=travel-total*.1*(n+1)/4;s.material=this.signMaterials[mode][n+1];s.position.set(roadX(z),7.4,z);s.rotation.set(0,0,0);roadX.transform?.(s,true);s.visible=gateMask[n]==='1';});
  this.fog.set(map.fog);this.light.set(map.color);this.rain=map.rain;this.sky=map.sky;
 }
}
