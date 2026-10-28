import * as T from 'three';
import {DISTRICTS,routeSector} from './nightshift8-world-route.mjs';
const material=(color,roughness=.65,metalness=.15)=>new T.MeshStandardMaterial({color,roughness,metalness});
const box=new T.BoxGeometry(1,1,1),rock=new T.DodecahedronGeometry(1,1),cone=new T.ConeGeometry(1,1,8),cylinder=new T.CylinderGeometry(1,1,1,10),dome=new T.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2),ring=new T.TorusGeometry(1,.08,6,24),leafPlane=new T.PlaneGeometry(1,1);
export class RouteWorld{
 constructor(scene){
  this.scene=scene;this.pools=new Map();this.temp=new T.Object3D();this.root=new T.Object3D();this.matrix=new T.Matrix4();this.color=new T.Color();
  this.m={stone:material('#b8b7b4',.95),cell:material('#d6ded8',.4,.45),cargo:material('#aebbc1',.7,.35),tunnel:material('#a1aeaf',.65,.3),steel:material('#74848d',.5,.65),white:material('#dce8e7',.55,.25),ground:material('#bcc4c4',.95),water:material('#5f9ca7',.23,.65),leaves:material('#709676',.95),glass:material('#82acae',.23,.65),light:new T.MeshBasicMaterial({color:'#fff4e4',toneMapped:false})};
  this.terrainRegion={value:new T.Vector2(0,.5)};for(const name of ['fir','snowFir','scrub','broadleaf'])this.m[name]=new T.MeshStandardMaterial({color:'#ffffff',roughness:.95,metalness:0,side:T.DoubleSide,alphaTest:.4});
  this.templates=DISTRICTS.map((_,id)=>Array.from({length:6},(_,n)=>this.template(id,n)));
  this.gateParts=[];for(const s of [-1,1]){this.add(this.gateParts,'steel',s*8.6,4.3,0,.4,8.6,.4);this.add(this.gateParts,'light',s*8.37,4.3,.22,.06,8.5,.06);}this.add(this.gateParts,'steel',0,8.6,0,17.6,.4,.4);
  for(const p of this.pools.values()){p.mesh=new T.InstancedMesh(p.geometry,p.material,1600);p.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);p.mesh.frustumCulled=false;p.mesh.count=0;scene.add(p.mesh);}
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
    if(n%3===0){for(const z of [-5,5])b('steel',s*29,9,z,.8,22,.8);b('steel',s*23,20,0,29,1.2,1.3);b('steel',s*29,18,0,.7,.7,12);b('steel',s*16,13.5,0,.09,12,.09);b('cargo',s*16,7.4,0,3,.5,5);b('light',s*24,20.7,0,4,.13,.15,0,0,0,box,'#ffcb87');}
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
   for(const s of [-1,1]){const h=28+n*6;b('cell',s*(17+n%2*4),h/2-1.8,0,11,h,16,0,0,0,box,'#667189');for(let y=4;y<h;y+=7){b('light',s*(17+n%2*4),y,8.05,10,.12,.1,0,0,0,box,n%2?'#4cceec':'#ee6fbd');b('steel',s*(17+n%2*4),y+1,0,11.7,.3,16.4);}b('light',s*10,5,2,.15,5.8,2.5,0,0,0,box,s>0?'#da71e8':'#78e7dc');}
   if(n%3===0){b('glass',0,14,0,38,2,5,0,0,0,box,'#6377b0');b('light',0,12.9,2.55,34,.12,.1,0,0,0,box,'#e686da');}
  }else if(id===4){
   b('water',0,-4,0,300,.1,18.2,0,0,0,box,'#5cb4c4');
   for(const s of [-1,1]){b('white',s*9.8,2,0,.4,5,18.1);b('white',s*9,4.5,0,.2,.2,18.1);
    if(n%3===0){b('white',s*11,12,0,1,28,1,0,0,s*.08);b('white',0,24,0,23,.6,.8);for(const q of [-1,1])b('white',s*11,12,q*8,.12,26,.12,q*.65,0,0);}
    if(n===4)b('stone',s*70,-2,0,30,12,28,0,n*.7,0,rock,'#a4baa3');
   }
  }else if(id===5){
   b('ground',0,-1.6,0,260,.6,18.2,0,0,0,box,'#e5c69e');
   for(const s of [-1,1]){for(let k=0;k<3;k++){const x=s*(17+k*8);b('steel',x,1.4,k*4-4,.4,3,.4);b('glass',x,3.1,k*4-4,6,.15,5,0,0,s*.28,box,'#456079');if(k===1)tree(s*11,2,2,false,'scrub');b('white',x,3.15,k*4-4,6,.08,.07,0,0,s*.28);}
    if(n%3===0){b('white',s*45,11,0,.65,25,.65);b('white',s*45,24,0,1.5,1.5,1.5,0,0,0,rock);for(let k=0;k<3;k++)b('white',s*45+Math.sin(k*2.094)*5,24+Math.cos(k*2.094)*5,.1,.4,11,.16,0,0,-k*2.094);}
   }
  }else if(id===6){
   b('ground',0,-1.7,0,150,.6,18.2,0,0,0,box,'#ac704e');
   for(const s of [-1,1]){b('stone',s*(24+n%2*3),11,0,16,28+n*2,16,0,n*.6,0,rock,n%2?'#b8afa0':'#cbbca8');b('stone',s*45,14,-3,20,35,18,0,n*.3,0,rock,'#a69c91');b('stone',s*12,2,4,3,7+n,3,0,n*.6,0,rock,'#c8bbac');}
   if(n===0){for(const s of [-1,1])b('stone',s*9,8,0,3,18,7,0,0,0,rock,'#c7bdae');b('stone',0,17,0,24,4,6,0,0,0,rock,'#baad9a');}
  }else if(id===7){
   b('ground',0,-2,0,180,.5,18.2,0,0,0,box,'#353139');
   for(const s of [-1,1]){b('light',s*17,-1.6,0,5,.1,18.2,0,0,0,box,'#f87f37');b('stone',s*(28+n%3*3),5,0,15,13+n,14,0,n*.7,0,rock,'#3c3b4a');b('stone',s*11,.3,0,2,3,7,0,n*.5,0,rock,'#38343c');for(let k=0;k<2;k++)b('stone',s*(43+k*7),6,k*6,4,18+n,4,0,n*.2,0,cylinder,'#48434e');if(n%3===0){b('steel',s*22,3,0,7,6,8);b('light',s*22,3,4.05,5,.2,.1,0,0,0,box,'#fc9c52');}}
  }else if(id===8){
   b('ground',0,-1.5,0,140,.5,18.2,0,0,0,box,'#86a489');
   for(const s of [-1,1]){b('water',s*16,-.7,0,8,.1,18.2,0,0,0,box,'#4ca295');b('white',s*22,.2,0,3,2,18.1);for(let k=0;k<2;k++){b('white',s*24,2,k*9-5,3,3,3);tree(s*24,k*9-5,7,false,'broadleaf');}if(n%3===0){b('glass',s*36,0,0,13,13,13,0,0,0,dome,'#a1dcd0');b('white',s*36,.2,0,27,.7,27);b('light',s*36,12.8,0,.7,.7,.7,0,0,0,box,'#b0f9b4');}}
  }else if(id===9){
   b('ground',0,-1.8,0,180,.5,18.2,0,0,0,box,'#9fc1d5');
   for(const s of [-1,1]){b('tunnel',s*18,2,0,10,7,16,0,0,0,box,'#689ba9');b('light',s*12.9,3.5,0,.1,.25,13,0,0,0,box,'#72e7dd');b('steel',s*10.5,1,0,.6,18.2,.6,Math.PI/2);if(n%3===0){b('steel',s*34,5,0,1,12,1);b('white',s*34,11,0,9,3,9,0,0,.3*s,dome,'#c2e3ee');b('steel',s*34,15,0,.15,8,.15,0,0,s*.3);b('light',s*34,19,0,.6,.6,.6,0,0,0,box,'#81ffdf');}}
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
  const [atlas,foliage,terrain]=await Promise.all([loader.loadAsync('/arcade/art/nightshift/relay-materials.webp'),loader.loadAsync('/arcade/art/nightshift/world-foliage.webp'),loader.loadAsync('/arcade/art/nightshift/world-terrain.webp')]);foliage.colorSpace=terrain.colorSpace=T.SRGBColorSpace;terrain.anisotropy=4;atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=4;
  for(const [key,u,v,repeat]of[['stone',0,.5,2],['cell',.5,.5,2],['cargo',0,0,1],['tunnel',.5,0,2]]){const m=this.m[key];m.map=atlas;m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D( map, vec2('+(u+.003)+','+(v+.003)+')+fract(vMapUv*'+repeat+'.0)*.494 )'));};m.customProgramCacheKey=()=>'world7-'+key;m.needsUpdate=true;}
  ['fir','snowFir','scrub','broadleaf'].forEach((name,n)=>{const t=foliage.clone();t.repeat.set(.498,n<2?.543:.449);t.offset.set((n%2)*.5+.001,n<2?.456:.001);t.needsUpdate=true;this.m[name].map=t;this.m[name].needsUpdate=true;});
  for(const name of ['ground','stone']){const m=this.m[name];m.map=terrain;m.onBeforeCompile=shader=>{shader.uniforms.terrainRegion=this.terrainRegion;shader.fragmentShader='uniform vec2 terrainRegion;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2DGradEXT( map, terrainRegion + vec2(.003) + abs(fract(vMapUv*vec2('+(name==='ground'?'28.,4.':'2.,2.')+')*.5)*2.-1.)*.494, dFdx(vMapUv)*vec2('+(name==='ground'?'28.,4.':'2.,2.')+')*.494, dFdy(vMapUv)*vec2('+(name==='ground'?'28.,4.':'2.,2.')+')*.494 )'));};m.customProgramCacheKey=()=>'terrain7-'+name;m.needsUpdate=true;}
 }
 draw(distance,mode,total,roadX){
  const travel=distance*.1,map=DISTRICTS[mode];this.current=mode;this.sector=routeSector(distance,total);const region=[3,0,1,3,2,2,2,3,1,0,3,0][mode];this.terrainRegion.value.set((region%2)*.5,region<2?.5:0);
  for(const p of this.pools.values())p.index=0;
  for(let n=0;n<25;n++){const absolute=(Math.floor(travel/18)-2+n)*18,z=travel-absolute,sector=routeSector(absolute*10,total),variant=((Math.floor(absolute/18)+sector*2)%6+6)%6;this.root.position.set(roadX(z),0,z);this.root.rotation.y=Math.atan2(roadX(z+1)-roadX(z-1),2);this.root.updateMatrix();
   for(const part of this.templates[mode][variant]){const p=part.pool;if(p.index>=1600)throw Error('World instance budget exceeded');this.matrix.multiplyMatrices(this.root.matrix,part.matrix);p.mesh.setMatrixAt(p.index,this.matrix);p.mesh.setColorAt(p.index++,part.color);}
  }
  this.signs.forEach((s,n)=>{const absolute=(Math.floor(travel/90)-1+n)*90,z=travel-absolute,zone=routeSector(absolute*10,total);s.material=this.signMaterials[mode][zone];s.position.set(roadX(z)+(n%2?12:-12),5,z);s.rotation.y=n%2?-.15:.15;s.visible=mode!==10;});
  this.gates.forEach((s,n)=>{const z=travel-total*.1*(n+1)/4;s.material=this.signMaterials[mode][n+1];s.position.set(roadX(z),7.4,z);s.visible=z<15&&z>-380;if(s.visible){this.root.position.set(roadX(z),0,z);this.root.rotation.set(0,0,0);this.root.updateMatrix();for(const part of this.gateParts){const p=part.pool;this.matrix.multiplyMatrices(this.root.matrix,part.matrix);p.mesh.setMatrixAt(p.index,this.matrix);p.mesh.setColorAt(p.index++,part.color);}}});
  for(const p of this.pools.values()){p.mesh.count=p.index;p.mesh.visible=p.index>0;if(p.index){p.mesh.instanceMatrix.needsUpdate=true;if(p.mesh.instanceColor)p.mesh.instanceColor.needsUpdate=true;}}
  this.fog.set(map.fog);this.light.set(map.color);this.rain=map.rain;this.sky=map.sky;
 }
}
