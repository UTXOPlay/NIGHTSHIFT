import * as T from 'three';
import {facadeAtlas,loadStructureTexture} from './nightshift9-architecture.mjs';
import {DISTRICTS,routeSector} from './nightshift9-world-route.mjs';
const material=(color,roughness=.65,metalness=.15)=>new T.MeshStandardMaterial({color,roughness,metalness});
const box=new T.BoxGeometry(1,1,1),rock=new T.DodecahedronGeometry(1,1),cone=new T.ConeGeometry(1,1,8),cylinder=new T.CylinderGeometry(1,1,1,10),ring=new T.TorusGeometry(1,.08,6,24),leafPlane=new T.PlaneGeometry(1,1),cellRing=new T.TorusGeometry(.8,.035,5,6);
export class RouteWorld{
 constructor(scene){
  this.scene=scene;this.pools=new Map();this.temp=new T.Object3D();this.root=new T.Object3D();this.matrix=new T.Matrix4();this.color=new T.Color();
  this.m={stone:material('#b8b7b4',.95),cell:material('#d6ded8',.4,.45),cargo:material('#aebbc1',.7,.35),tunnel:material('#a1aeaf',.65,.3),steel:material('#74848d',.5,.65),white:material('#dce8e7',.55,.25),ground:material('#bcc4c4',.95),water:material('#5f9ca7',.23,.65),leaves:material('#709676',.95),glass:material('#82acae',.23,.65),light:new T.MeshBasicMaterial({color:'#fff4e4',toneMapped:false})};
  for(const name of ['office','lab','warehouse','stonefront'])this.m[name]=material('#e1e6ed',name==='office'?.38:.7,name==='office'?.45:.15);
  this.terrainRegion={value:new T.Vector2(0,.5)};for(const name of ['fir','snowFir','scrub','broadleaf'])this.m[name]=new T.MeshStandardMaterial({color:'#ffffff',roughness:.95,metalness:0,side:T.DoubleSide,alphaTest:.4});
  this.templates=DISTRICTS.map((_,id)=>Array.from({length:6},(_,n)=>this.template(id,n)));
  this.gateParts=[];for(const s of [-1,1]){this.add(this.gateParts,'steel',s*8.6,4.3,0,.4,8.6,.4);this.add(this.gateParts,'light',s*8.37,4.3,.22,.06,8.5,.06);}this.add(this.gateParts,'steel',0,8.6,0,17.6,.4,.4);
  for(const p of this.pools.values()){p.mesh=new T.InstancedMesh(p.geometry,p.material,1600);p.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);p.mesh.frustumCulled=false;p.mesh.count=0;p.mesh.castShadow=['office','lab','warehouse','stonefront','steel','white'].some(k=>p.material===this.m[k]);p.mesh.receiveShadow=true;scene.add(p.mesh);}
  this.signMaterials=DISTRICTS.map(d=>d.zones.map((z,n)=>this.sign(d,z,n)));
  this.signs=Array.from({length:5},()=>{const s=new T.Mesh(new T.PlaneGeometry(6,1.8),this.signMaterials[0][0]);scene.add(s);return s;});
  this.gates=Array.from({length:3},()=>{const s=new T.Mesh(new T.PlaneGeometry(9.2,2.1),this.signMaterials[0][0]);scene.add(s);return s;});
  this.current=0;this.sector=0;this.fog=new T.Color();this.light=new T.Color();this.sky=0;this.rain=0;
 }
 add(out,mat,x,y,z,w,h,d,rx=0,ry=0,rz=0,geometry=box,color='#ffffff'){
  const material=this.m[mat],key=geometry.uuid+'/'+material.uuid;if(!this.pools.has(key))this.pools.set(key,{geometry,material,index:0});
  this.temp.position.set(x,y,z);this.temp.rotation.set(rx,ry,rz);this.temp.scale.set(w,h,d);this.temp.updateMatrix();out.push({pool:this.pools.get(key),matrix:this.temp.matrix.clone(),color:new T.Color(color)});
 }
 template(id,n){
  const out=[],b=(...a)=>this.add(out,...a);
  const tree=(x,z,h,snow=false,kind)=>{const mat=kind||(snow?'snowFir':'fir');for(let k=0;k<2;k++)b(mat,x,h/2-1.2,z,h*.85,h,1,0,n*.37+k*Math.PI/2,0,leafPlane);};
  if(id===0){
   b('water',0,-2.1,0,220,.12,18.1,0,0,0,box,'#455f78');
   for(const s of [-1,1]){b('steel',s*16,-1.3,0,14,1.1,18.1);
    for(let k=0;k<3;k++)for(let t=0;t<1+(n+k)%3;t++)b('cargo',s*(13+k*5),t*2.7+.2,(k%2)*3-2,4.7,2.6,10,0,0,0,box,['#8ba994','#bc7854','#6289a3'][(n+k)%3]);
    if(n%2===0){b('warehouse',s*39,5.2,0,15,12,17);b('steel',s*39,11.4,0,15.6,.4,17.5);b('steel',s*37,12.1,0,3,1.1,5);}
    if(n%3===0){for(const z of [-5,5])b('steel',s*29,9,z,.8,22,.8);b('steel',s*23,20,0,29,1.2,1.3);b('steel',s*29,18,0,.7,.7,12);b('steel',s*16,13.5,0,.09,12,.09);b('cargo',s*16,7.4,0,3,.5,5);for(const z of [-5,5]){b('steel',s*29,8,z,.25,20,.25,0,0,s*.23);b('steel',s*23,20,z*.08,.18,13,.18,0,0,s*1.27);}b('lab',s*19,17.2,0,3.4,2.6,3.2);b('steel',s*19,18.65,0,3.6,.2,3.5);b('steel',s*28,20.9,0,4,1.2,3);b('light',s*24,20.7,0,4,.13,.15,0,0,0,box,'#ffcb87');}
   }
  }else if(id===1){
   b('ground',0,-1.8,0,150,.6,18.2,0,0,0,box,'#d8e8f1');b('water',-43,-1.4,0,35,.12,18.2,0,0,0,box,'#8bccdf');
   for(const s of [-1,1]){b('stone',s*(27+n%2*6),6,0,18,15+n*2,14,0,n*.4,0,rock,'#768896');b('stone',s*(27+n%2*6),14+n,0,17,5,13,0,n*.4,0,rock,'#edf6ff');tree(s*12,2,5+n%3,true);if(n%3===0){b('white',s*14,10,0,.6,22,.6);b('steel',s*14,20,0,8,.5,.5);b('steel',s*17,20,0,.06,.06,18.2);b('cargo',s*17,17,0,2,2.2,2.2,0,0,0,box,'#c3594c');}}
  }else if(id===2){
   b('ground',0,-1.6,0,160,.8,18.2,0,0,0,box,'#4b6644');b('water',-20,-.9,0,12,.1,18.2,0,0,0,box,'#458a7c');
   for(const s of [-1,1]){for(let k=0;k<3;k++)tree(s*(13+k*8),k*5-4,8+(n+k)%4*3);b('stone',s*10,.2,0,2,2,4,0,n*.4,0,rock,'#576858');}
   if(n===0){for(const s of [-1,1])b('stone',s*9,6,0,2,13,3,0,0,0,box,'#8e9d85');b('stone',0,12,0,20,2,3,0,0,0,box,'#8e9d85');}
  }else if(id===3){
   b('ground',0,-1.5,0,100,.4,18.2,0,0,0,box,'#25293d');
   for(const s of [-1,1]){const h=27+n*6,x=s*(18+n%2*4),face=n%3===1?'lab':'office';
    b('stonefront',x,1.8,0,15,7,17.6);b(face,x,h/2+5,0,11,h,15.5);
    b('steel',x,5.4,0,15.5,.35,18);b('steel',x,h+5.2,0,11.5,.35,16);
    if(n%2===0){b(face,x+s*1.2,h+8,0,7,5.5,11);b('steel',x+s*1.2,h+11,0,7.5,.25,11.5);}
    for(const z of [-7.8,7.8])b('steel',x-s*5.55,h/2+5,z,.18,h,.18);
    b('steel',x,h+6,1,3,1.2,4);b('steel',x+2,h+5.8,-3,1.3,.8,2.5);
    b('light',x-s*5.62,h*.45+5,0,.065,.12,12,0,0,0,box,n%2?'#8adbdc':'#e2b5a1');
    b('steel',s*10.4,5.5,2,.12,4.4,.12);for(const dz of [-.65,.65])b('light',s*10,5.5,2+dz,1.25,1.25,1.25,0,Math.PI/2,0,cellRing,s>0?'#d4a0ce':'#a4e1cf');
   }
   if(n%3===0){b('office',0,14,0,38,2.5,5);b('steel',0,15.35,0,38,.18,5.4);b('steel',0,12.65,0,38,.18,5.4);b('light',0,12.77,2.55,34,.045,.045,0,0,0,box,'#e0b9ca');}
  }else if(id===4){
   b('water',0,-4,0,300,.1,18.2,0,0,0,box,'#5cb4c4');
   for(const s of [-1,1]){b('white',s*9.8,2,0,.4,5,18.1);b('white',s*9,4.5,0,.2,.2,18.1);
    if(n%3===0){b('white',s*11,12,0,1,28,1,0,0,s*.08);b('white',0,24,0,23,.6,.8);for(const q of [-1,1])b('white',s*11,12,q*8,.12,26,.12,q*.65,0,0);}
    if(n===4)b('stone',s*70,-2,0,30,12,28,0,n*.7,0,rock,'#a4baa3');
   }
  }else if(id===5){
   b('ground',0,-1.6,0,260,.6,18.2,0,0,0,box,'#e5c69e');
   for(const s of [-1,1]){for(let k=0;k<3;k++){const x=s*(17+k*8);b('steel',x,1.4,k*4-4,.4,3,.4);b('glass',x,3.1,k*4-4,6,.15,5,0,0,s*.28,box,'#456079');if(k===1)tree(s*11,2,2,false,'scrub');b('white',x,3.15,k*4-4,6,.08,.07,0,0,s*.28);}
    if(n===2){b('warehouse',s*35,2.5,0,12,7,15);b('steel',s*35,6.2,0,13,.3,16);}
    if(n%3===0){b('white',s*45,11,0,.65,25,.65);b('white',s*45,24,0,1.5,1.5,1.5,0,0,0,rock);for(let k=0;k<3;k++)b('white',s*45+Math.sin(k*2.094)*5,24+Math.cos(k*2.094)*5,.1,.4,11,.16,0,0,-k*2.094);}
   }
  }else if(id===6){
   b('ground',0,-1.7,0,150,.6,18.2,0,0,0,box,'#ac704e');
   for(const s of [-1,1]){b('stone',s*(24+n%2*3),11,0,16,28+n*2,16,0,n*.6,0,rock,n%2?'#b8afa0':'#cbbca8');b('stone',s*45,14,-3,20,35,18,0,n*.3,0,rock,'#a69c91');b('stone',s*12,2,4,3,7+n,3,0,n*.6,0,rock,'#c8bbac');}
   if(n===0){for(const s of [-1,1])b('stone',s*9,8,0,3,18,7,0,0,0,rock,'#c7bdae');b('stone',0,17,0,24,4,6,0,0,0,rock,'#baad9a');}
  }else if(id===7){
   b('ground',0,-2,0,180,.5,18.2,0,0,0,box,'#353139');
   for(const s of [-1,1]){b('light',s*17,-1.6,0,5,.1,18.2,0,0,0,box,'#f87f37');b('stone',s*(28+n%3*3),5,0,15,13+n,14,0,n*.7,0,rock,'#3c3b4a');b('stone',s*11,.3,0,2,3,7,0,n*.5,0,rock,'#38343c');for(let k=0;k<2;k++)b('stone',s*(43+k*7),6,k*6,4,18+n,4,0,n*.2,0,cylinder,'#48434e');if(n%3===0){b('lab',s*22,3,0,7,6,8);b('steel',s*22,6.2,0,7.4,.3,8.4);b('light',s*22,3,4.05,5,.2,.1,0,0,0,box,'#fc9c52');}}
  }else if(id===8){
   b('ground',0,-1.5,0,140,.5,18.2,0,0,0,box,'#86a489');
   for(const s of [-1,1]){b('water',s*16,-.7,0,8,.1,18.2,0,0,0,box,'#4ca295');b('white',s*22,.2,0,3,2,18.1);for(let k=0;k<2;k++){b('white',s*24,2,k*9-5,3,3,3);tree(s*24,k*9-5,7,false,'broadleaf');}if(n%3===1){b('stonefront',s*42,6,0,13,14,16);b('steel',s*42,13.2,0,14,.3,17);}
    if(n%3===0){
     // Canal research campus: textured lab wings, a public entrance and roof
     // services. Instanced structural parts replace the reflective half-orbs.
     const cx=s*36,h=n===0?12:8;
     b('white',cx,-.05,0,20,.5,16);b('stonefront',cx,1.6,0,16,3.1,13);
     b('lab',cx,h/2+3,1,14,h-3,10.5);b('steel',cx,h+1.7,1,14.7,.32,11.1);
     b('lab',cx+s*8,3,-2,6,6,9);b('steel',cx+s*8,6.2,-2,6.5,.24,9.5);
     for(const z of [-4.35,0,6.35])b('steel',cx-s*7.08,(h+4.5)/2,z,.16,h+1.3,.16);
     b('steel',cx-s*8.4,3.35,0,3.3,.22,7);b('white',cx-s*9.5,1.6,-2.8,.2,3.2,.2);
     b('white',cx-s*9.5,1.6,2.8,.2,3.2,.2);b('light',cx-s*8.8,3.22,0,.07,.06,5.6,0,0,0,box,'#dce8ce');
     b('steel',cx+2,h+2.4,-1,3.5,1.3,3);b('steel',cx-2,h+2.2,2,2.1,.9,3.4);
     b('glass',cx+s*3,h+3.05,3,5,.12,3.2,0,0,s*.18,box,'#526b76');
    }}
  }else if(id===9){
   b('ground',0,-1.8,0,180,.5,18.2,0,0,0,box,'#9fc1d5');
   for(const s of [-1,1]){b('lab',s*18,2,0,10,7,16,0,0,0,box,'#c0d6dd');b('light',s*12.9,3.5,0,.1,.25,13,0,0,0,box,'#72e7dd');b('steel',s*10.5,1,0,.6,18.2,.6,Math.PI/2);if(n%3===0){
     // Exposed polar communications tower with directional panel arrays.
     b('white',s*34,.1,0,5,.6,5);for(const dz of [-1.2,1.2]){b('steel',s*34,8,dz,.26,16,.26);b('steel',s*34,7,dz,.14,13,.14,0,0,s*.16);}
     for(const y of [5,9,13])b('steel',s*34,y,0,.3,.18,3.2);
     for(const dz of [-1.5,1.5]){b('white',s*33.55,11,dz,.35,4.7,1.15);b('steel',s*33.85,11,dz,.22,5.1,1.4);}
     b('steel',s*34,17,0,.11,4,.11);b('light',s*34,19.05,0,.18,.18,.18,0,0,0,box,'#81ffdf');
    }}
  }else if(id===10){
   b('tunnel',0,11,0,22,1,18.2,0,0,0,box,'#66726c');
   for(const s of [-1,1]){b('tunnel',s*10,4.5,0,1,10,18.2,0,0,0,box,'#6a7770');b('steel',s*9.35,4.8,7,.7,10,.7);b('light',s*9.42,1.2,0,.1,.2,18.2,0,0,0,box,'#eec875');b('steel',s*7.2,9.6,0,.65,18.2,.65,Math.PI/2);if(n%2===0){b('light',s*9.4,5.5,0,2.6,2.6,1,0,Math.PI/2,0,ring,'#ffad4c');b('glass',s*9.7,5.5,0,3.6,3.6,.5,0,Math.PI/2,0,cylinder,'#97a96b');}}
   b('steel',0,10.35,7,20,.7,.7);b('light',0,10.4,0,.25,.1,18.2,0,0,0,box,'#f6ca79');
  }else{
   b('water',0,-15,0,280,.1,18.2,0,0,0,box,'#947d9b');
   for(const s of [-1,1]){b('white',s*10.3,1.8,0,.3,4.4,18.1);b('light',s*10,.5,0,.12,.12,18.1,0,0,0,box,'#ffcbaa');if(n%3===0){b('white',s*16,12,0,.8,29,.8,0,0,s*.18);b('glass',s*19,16,0,6,.15,12,0,0,s*.6,box,'#c9a3b6');b('white',s*37,9,0,5,39+n*4,5,0,0,0,cone,'#ded2d0');b('light',s*37,27+n*2,0,.45,.45,.45,0,0,0,box,'#ffcea8');}}
  }
  return out;
 }
 sign(d,zone,n){
  const c=document.createElement('canvas');c.width=768;c.height=256;const x=c.getContext('2d');x.fillStyle='#10232be8';x.fillRect(0,0,768,256);x.strokeStyle=d.color;x.lineWidth=5;x.strokeRect(7,7,754,242);x.fillStyle=d.color;x.font='700 22px Arial';x.fillText('NERVOS / '+d.name,28,52);x.font='800 48px Arial';x.fillStyle='#eff7ee';x.fillText(zone.toUpperCase(),28,127);x.font='23px Arial';x.fillStyle=d.color;x.fillText('SECTOR 0'+(n+1)+'   /   KEEP THE RELAY MOVING',28,193);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return new T.MeshBasicMaterial({map:texture});
 }
 async load(loader){
  const [atlas,foliage,terrain,facades,structures]=await Promise.all([loader.loadAsync('/arcade/art/nightshift/relay-materials.webp'),loader.loadAsync('/arcade/art/nightshift/world-foliage.webp'),loader.loadAsync('/arcade/art/nightshift/world-terrain.webp'),loader.loadAsync('/arcade/art/nightshift/architecture-v8.webp'),loadStructureTexture(loader)]);facades.colorSpace=T.SRGBColorSpace;facades.anisotropy=4;[['office',0,18,24],['lab',1,9,7],['warehouse',2,12,10],['stonefront',3,10,12]].forEach(([key,tile,w,h])=>facadeAtlas(this.m[key],facades,tile,w,h));foliage.colorSpace=terrain.colorSpace=T.SRGBColorSpace;terrain.anisotropy=4;atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=4;
  for(const [key,u,v,repeat]of[['stone',0,.5,2],['cell',.5,.5,2],['cargo',0,0,1],['tunnel',.5,0,2]]){const m=this.m[key];m.map=atlas;m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D( map, vec2('+(u+.003)+','+(v+.003)+')+fract(vMapUv*'+repeat+'.0)*.494 )'));};m.customProgramCacheKey=()=>'world7-'+key;m.needsUpdate=true;}
  structures.colorSpace=T.SRGBColorSpace;structures.anisotropy=4;[['steel',0],['white',1],['tunnel',3]].forEach(([key,tile])=>facadeAtlas(this.m[key],structures,tile,5,5,{emission:0,roof:false}));
  ['fir','snowFir','scrub','broadleaf'].forEach((name,n)=>{const t=foliage.clone();t.repeat.set(.498,n<2?.543:.449);t.offset.set((n%2)*.5+.001,n<2?.456:.001);t.needsUpdate=true;this.m[name].map=t;this.m[name].needsUpdate=true;});
  for(const name of ['ground','stone']){const m=this.m[name];m.map=terrain;m.onBeforeCompile=shader=>{shader.uniforms.terrainRegion=this.terrainRegion;shader.fragmentShader='uniform vec2 terrainRegion;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2DGradEXT( map, terrainRegion + vec2(.003) + abs(fract(vMapUv*vec2('+(name==='ground'?'28.,4.':'2.,2.')+')*.5)*2.-1.)*.494, dFdx(vMapUv)*vec2('+(name==='ground'?'28.,4.':'2.,2.')+')*.494, dFdy(vMapUv)*vec2('+(name==='ground'?'28.,4.':'2.,2.')+')*.494 )'));};m.customProgramCacheKey=()=>'terrain7-'+name;m.needsUpdate=true;}
 }
 draw(distance,mode,total,roadX){
  const travel=distance*.1,map=DISTRICTS[mode];this.current=mode;this.sector=routeSector(distance,total);const region=[3,0,1,3,2,2,2,3,1,0,3,0][mode];this.terrainRegion.value.set((region%2)*.5,region<2?.5:0);
  for(const p of this.pools.values())p.index=0;
  for(let n=0;n<25;n++){const absolute=(Math.floor(travel/18)-2+n)*18,z=travel-absolute,sector=routeSector(absolute*10,total),variant=((Math.floor(absolute/18)+sector*2)%6+6)%6;this.root.position.set(roadX(z),0,z);this.root.rotation.y=Math.atan2(roadX(z+1)-roadX(z-1),2);roadX.frame?.(z,this.root);this.root.updateMatrix();
   for(const part of this.templates[mode][variant]){const p=part.pool;if(p.index>=1600)throw Error('World instance budget exceeded');this.matrix.multiplyMatrices(this.root.matrix,part.matrix);p.mesh.setMatrixAt(p.index,this.matrix);p.mesh.setColorAt(p.index++,part.color);}
  }
  this.signs.forEach((s,n)=>{const absolute=(Math.floor(travel/90)-1+n)*90,z=travel-absolute,zone=routeSector(absolute*10,total);s.material=this.signMaterials[mode][zone];s.position.set(roadX(z)+(n%2?12:-12),5,z);s.rotation.set(0,n%2?-.15:.15,0);roadX.transform?.(s,true);s.visible=mode!==10;});
  this.gates.forEach((s,n)=>{const z=travel-total*.1*(n+1)/4;s.material=this.signMaterials[mode][n+1];s.position.set(roadX(z),7.4,z);s.rotation.set(0,0,0);roadX.transform?.(s,true);s.visible=z<15&&z>-380;if(s.visible){this.root.position.set(roadX(z),0,z);this.root.rotation.set(0,0,0);roadX.frame?.(z,this.root);this.root.updateMatrix();for(const part of this.gateParts){const p=part.pool;this.matrix.multiplyMatrices(this.root.matrix,part.matrix);p.mesh.setMatrixAt(p.index,this.matrix);p.mesh.setColorAt(p.index++,part.color);}}});
  for(const p of this.pools.values()){p.mesh.count=p.index;p.mesh.visible=p.index>0;if(p.index){p.mesh.instanceMatrix.needsUpdate=true;if(p.mesh.instanceColor)p.mesh.instanceColor.needsUpdate=true;}}
  this.fog.set(map.fog);this.light.set(map.color);this.rain=map.rain;this.sky=map.sky;
 }
}
