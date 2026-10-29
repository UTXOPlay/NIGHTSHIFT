import * as T from 'three';
import {facadeAtlas,loadStructureTexture} from './nightshift9-architecture.mjs';
import {GEO,FACADES,STREET_VARIANTS,buildDistrict,streetVariant} from './nightshift9-streets.mjs';
import {DISTRICTS,routeSector} from './nightshift9-world-route.mjs';
const material=(color,roughness=.65,metalness=.15)=>new T.MeshStandardMaterial({color,roughness,metalness});
export class RouteWorld{
 constructor(scene){
  this.scene=scene;this.environmentRoot=new T.Group();this.environmentRoot.name='Stationary street instances';this.environmentRoot.matrixAutoUpdate=false;scene.add(this.environmentRoot);this.uploadKey=null;this.originDistance=null;this.matrixWrites=0;this.colorWrites=0;this.pools=new Map();this.temp=new T.Object3D();this.root=new T.Object3D();this.matrix=new T.Matrix4();this.color=new T.Color();
  this.m={stone:material('#b8b7b4',.95),cell:material('#d6ded8',.4,.45),cargo:material('#aebbc1',.7,.35),tunnel:material('#a1aeaf',.65,.3),steel:material('#74848d',.5,.65),white:material('#dce8e7',.55,.25),ground:material('#bcc4c4',.95),water:material('#5f9ca7',.23,.65),leaves:material('#709676',.95),glass:material('#82acae',.23,.65),light:new T.MeshBasicMaterial({color:'#fff4e4',toneMapped:false})};
  for(const [name] of FACADES)this.m[name]=material('#dce1e5',name==='office'?.4:.82,name==='office'?.12:.02);
  this.facadeNight={value:1};this.terrainRegion={value:new T.Vector2(0,.5)};for(const name of ['fir','snowFir','scrub','broadleaf'])this.m[name]=new T.MeshStandardMaterial({color:'#ffffff',roughness:.95,metalness:0,side:T.DoubleSide,alphaTest:.4});
  this.templates=DISTRICTS.map((_,id)=>Array.from({length:STREET_VARIANTS},(_,n)=>this.template(id,n)));
  this.gateParts=[];for(const s of [-1,1]){this.add(this.gateParts,'steel',s*8.6,4.3,0,.4,8.6,.4);this.add(this.gateParts,'light',s*8.37,4.3,.22,.06,8.5,.06);}this.add(this.gateParts,'steel',0,8.6,0,17.6,.4,.4);
  for(const p of this.pools.values()){p.mesh=new T.InstancedMesh(p.geometry,p.material,1600);p.mesh.matrixAutoUpdate=false;p.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);p.mesh.frustumCulled=false;p.mesh.count=0;p.mesh.castShadow=[...FACADES.map(f=>f[0]),'steel','white'].some(k=>p.material===this.m[k]);p.mesh.receiveShadow=true;this.environmentRoot.add(p.mesh);}
  this.signMaterials=DISTRICTS.map(d=>d.zones.map((z,n)=>this.sign(d,z,n)));
  this.signs=Array.from({length:5},()=>{const s=new T.Mesh(new T.PlaneGeometry(6,1.8),this.signMaterials[0][0]);scene.add(s);return s;});
  this.gates=Array.from({length:3},()=>{const s=new T.Mesh(new T.PlaneGeometry(9.2,2.1),this.signMaterials[0][0]);scene.add(s);return s;});
  this.current=0;this.sector=0;this.fog=new T.Color();this.light=new T.Color();this.sky=0;this.rain=0;
 }
 add(out,mat,x,y,z,w,h,d,rx=0,ry=0,rz=0,geometry=GEO.box,color='#ffffff'){
  if(geometry===GEO.box&&w>=4&&h>=3&&d>=3&&FACADES.some(f=>f[0]===mat))geometry=GEO.building;
  if(FACADES.some(f=>f[0]===mat)&&h>=2&&Math.abs(y-h/2)<.02){y-=.2;h+=.4;}
  const material=this.m[mat],key=geometry.uuid+'/'+material.uuid;if(!this.pools.has(key))this.pools.set(key,{geometry,material,index:0});
  this.temp.position.set(x,y,z);this.temp.rotation.set(rx,ry,rz);this.temp.scale.set(w,h,d);this.temp.updateMatrix();out.push({pool:this.pools.get(key),matrix:this.temp.matrix.clone(),color:new T.Color(color)});
 }
 template(id,n){return buildDistrict(this,id,n);}
 sign(d,zone,n){
  const c=document.createElement('canvas');c.width=768;c.height=256;const x=c.getContext('2d');x.fillStyle='#10232be8';x.fillRect(0,0,768,256);x.strokeStyle=d.color;x.lineWidth=5;x.strokeRect(7,7,754,242);x.fillStyle=d.color;x.font='700 22px Arial';x.fillText(d.name.startsWith('NERVOS ')?d.name:'NERVOS / '+d.name,28,52);x.font='800 48px Arial';x.fillStyle='#eff7ee';x.fillText(zone.toUpperCase(),28,127);x.font='23px Arial';x.fillStyle=d.color;x.fillText('SECTOR 0'+(n+1)+'   /   KEEP THE RELAY MOVING',28,193);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map:texture});
 }
 async load(loader){
  const [atlas,foliage,terrain,facades,structures]=await Promise.all([loader.loadAsync('/arcade/art/nightshift/relay-materials.webp'),loader.loadAsync('/arcade/art/nightshift/world-foliage.webp'),loader.loadAsync('/arcade/art/nightshift/world-terrain.webp'),loader.loadAsync('/arcade/art/nightshift/architecture-v93.webp'),loadStructureTexture(loader)]);facades.colorSpace=T.SRGBColorSpace;facades.anisotropy=4;FACADES.forEach(([key,tile,w,h])=>facadeAtlas(this.m[key],facades,tile,w,h,{columns:4,rows:2,variation:true,night:this.facadeNight}));foliage.colorSpace=terrain.colorSpace=T.SRGBColorSpace;terrain.anisotropy=4;atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=4;
  for(const [key,u,v,repeat]of[['stone',0,.5,2],['cell',.5,.5,2],['cargo',0,0,1],['tunnel',.5,0,2]]){const m=this.m[key];m.map=atlas;m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D( map, vec2('+(u+.003)+','+(v+.003)+')+fract(vMapUv*'+repeat+'.0)*.494 )'));};m.customProgramCacheKey=()=>'world7-'+key;m.needsUpdate=true;}
  structures.colorSpace=T.SRGBColorSpace;structures.anisotropy=4;[['steel',0],['white',1],['tunnel',3]].forEach(([key,tile])=>facadeAtlas(this.m[key],structures,tile,5,5,{emission:0,roof:false}));
  ['fir','snowFir','scrub','broadleaf'].forEach((name,n)=>{const t=foliage.clone();t.repeat.set(.498,n<2?.543:.449);t.offset.set((n%2)*.5+.001,n<2?.456:.001);t.needsUpdate=true;this.m[name].map=t;this.m[name].needsUpdate=true;});
  for(const name of ['ground','stone']){const m=this.m[name];m.map=terrain;m.onBeforeCompile=shader=>{shader.uniforms.terrainRegion=this.terrainRegion;shader.fragmentShader='uniform vec2 terrainRegion;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2DGradEXT( map, terrainRegion + vec2(.003) + abs(fract(vMapUv*vec2('+(name==='ground'?'28.,4.':'2.,2.')+')*.5)*2.-1.)*.494, dFdx(vMapUv)*vec2('+(name==='ground'?'28.,4.':'2.,2.')+')*.494, dFdy(vMapUv)*vec2('+(name==='ground'?'28.,4.':'2.,2.')+')*.494 )'));};m.customProgramCacheKey=()=>'terrain7-'+name;m.needsUpdate=true;}
 }
 snapshot(){return{mode:'stationary-instancing',matrixWrites:this.matrixWrites,colorWrites:this.colorWrites,pools:this.pools.size,streetVariants:STREET_VARIANTS,facadeFamilies:FACADES.length};}
 dispose(){}
 draw(distance,mode,total,roadX){
  const travel=distance*.1,map=DISTRICTS[mode];this.current=mode;this.facadeNight.value=[3,10].includes(mode)?1:[0,9,11].includes(mode)?.6:mode===8?.24:.08;this.sector=routeSector(distance,total);const region=[3,0,1,3,2,2,2,3,1,0,3,0][mode];this.terrainRegion.value.set((region%2)*.5,region<2?.5:0);
  const stationary=!!roadX.fixedFrame,gateMask=Array.from({length:3},(_,n)=>{const z=travel-total*.1*(n+1)/4;return z<15&&z>-380?1:0;}).join(''),key=mode+':'+(roadX.profileKey?.()||0)+':'+Math.floor(travel/18)+':'+gateMask,rebuild=!stationary||key!==this.uploadKey;
  this.matrixWrites=this.colorWrites=0;
  if(stationary){if(this.originDistance!==distance||rebuild){roadX.originMatrix(this.environmentRoot.matrix);this.environmentRoot.matrixWorldNeedsUpdate=true;this.originDistance=distance;}}else this.environmentRoot.matrix.identity();
  if(rebuild){
   this.uploadKey=key;for(const p of this.pools.values())p.index=0;
   for(let n=0;n<25;n++){const absolute=(Math.floor(travel/18)-2+n)*18,z=travel-absolute,sector=routeSector(absolute*10,total),variant=streetVariant(mode,Math.floor(absolute/18),sector);
    if(stationary)roadX.fixedFrame(absolute*10,this.root);else{this.root.position.set(roadX(z),0,z);this.root.rotation.set(0,0,0);roadX.frame?.(z,this.root);}this.root.updateMatrix();
    for(const part of this.templates[mode][variant]){const p=part.pool;if(p.index>=1600)throw Error('World instance budget exceeded');this.matrix.multiplyMatrices(this.root.matrix,part.matrix);p.mesh.setMatrixAt(p.index,this.matrix);p.mesh.setColorAt(p.index++,part.color);this.matrixWrites++;this.colorWrites++;}
   }
   for(let n=0;n<3;n++)if(gateMask[n]==='1'){const absolute=total*(n+1)/4,z=travel-absolute*.1;if(stationary)roadX.fixedFrame(absolute,this.root);else{this.root.position.set(roadX(z),0,z);this.root.rotation.set(0,0,0);roadX.frame?.(z,this.root);}this.root.updateMatrix();for(const part of this.gateParts){const p=part.pool;this.matrix.multiplyMatrices(this.root.matrix,part.matrix);p.mesh.setMatrixAt(p.index,this.matrix);p.mesh.setColorAt(p.index++,part.color);this.matrixWrites++;this.colorWrites++;}}
   for(const p of this.pools.values()){p.mesh.count=p.index;p.mesh.visible=p.index>0;if(p.index){p.mesh.instanceMatrix.clearUpdateRanges();p.mesh.instanceMatrix.addUpdateRange(0,p.index*16);p.mesh.instanceMatrix.needsUpdate=true;if(p.mesh.instanceColor){p.mesh.instanceColor.clearUpdateRanges();p.mesh.instanceColor.addUpdateRange(0,p.index*3);p.mesh.instanceColor.needsUpdate=true;}}}
  }
  this.signs.forEach((s,n)=>{const absolute=(Math.floor(travel/90)-1+n)*90,z=travel-absolute,zone=routeSector(absolute*10,total);s.material=this.signMaterials[mode][zone];s.position.set(roadX(z)+(n%2?12:-12),5,z);s.rotation.set(0,n%2?-.15:.15,0);roadX.transform?.(s,true);s.visible=mode!==10;});
  this.gates.forEach((s,n)=>{const z=travel-total*.1*(n+1)/4;s.material=this.signMaterials[mode][n+1];s.position.set(roadX(z),7.4,z);s.rotation.set(0,0,0);roadX.transform?.(s,true);s.visible=gateMask[n]==='1';});
  this.fog.set(map.fog);this.light.set(map.color);this.rain=map.rain;this.sky=map.sky;
 }
}
