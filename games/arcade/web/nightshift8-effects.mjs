import * as T from 'three';
import {PICKUPS} from './nightshift8-rules.mjs';
export function setPickupAtlas(items,atlas){
 atlas.colorSpace=T.SRGBColorSpace;const tags=[2,3,4,5,6,7,10,11],textures=tags.map((_,n)=>{const t=atlas.clone();t.repeat.set(.248,.496);t.offset.set((n%4)*.25+.001,n<4?.502:.002);t.needsUpdate=true;return t;});
 for(const item of items){const label=item.userData.label;if(!label)continue;label.material.map=textures[tags.indexOf(item.userData.tag)];label.material.opacity=1;label.material.needsUpdate=true;label.visible=true;}
}
export function pickupModel(tag,glow){const p=PICKUPS[tag],g=new T.Group();const material=new T.MeshBasicMaterial({color:p.color});
 if(tag===11){const mine=new T.Mesh(new T.OctahedronGeometry(.7),material);g.add(mine);g.userData.core=mine;return g;}
 if(tag===2){const ring=new T.Mesh(new T.TorusGeometry(.62,.12,8,20),material);g.add(ring);g.userData.core=ring;const halo=new T.Sprite(new T.SpriteMaterial({map:glow,color:p.color,transparent:true,opacity:.36,depthWrite:false,blending:T.AdditiveBlending}));halo.scale.set(2,2,1);g.add(halo);return g;}
 if(tag===10){for(let i=0;i<3;i++){const shape=new T.Shape();shape.moveTo(-1.5,-.5);shape.lineTo(0,.5);shape.lineTo(1.5,-.5);shape.lineTo(1.5,.1);shape.lineTo(0,1.1);shape.lineTo(-1.5,.1);shape.closePath();const chevron=new T.Mesh(new T.ShapeGeometry(shape),material);chevron.rotation.x=-Math.PI/2;chevron.position.set(0,-1.2,-i*1.6);g.add(chevron);}return g;}
 const core=new T.Mesh(new T.OctahedronGeometry(.55),new T.MeshStandardMaterial({color:p.color,emissive:p.color,emissiveIntensity:2,roughness:.25,metalness:.3}));g.add(core);g.userData.core=core;
 const icon=new T.Sprite(new T.SpriteMaterial({transparent:true,opacity:0,depthWrite:false}));icon.position.y=1.35;icon.scale.set(2.4,2.4,1);g.add(icon);g.userData.label=icon;
 const beam=new T.Mesh(new T.CylinderGeometry(.16,.48,5.5,8,1,true),new T.MeshBasicMaterial({color:p.color,transparent:true,opacity:.12,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));beam.position.y=1.7;g.add(beam);
 const ring=new T.Mesh(new T.RingGeometry(.7,.84,24),material);ring.rotation.x=-Math.PI/2;ring.position.y=-1.2;g.add(ring);return g;}
export class StreetEffects {
 constructor(scene,glow){this.scene=scene;this.age=0;this.shards=[];this.collect=0;this.impact=0;this.burst=0;this.lastDistance=0;this.skidCursor=0;this.skid=[];this.dummy=new T.Object3D();this.cachedColors=new Map();
 this.shardMesh=new T.InstancedMesh(new T.TetrahedronGeometry(.13),new T.MeshBasicMaterial({color:'#ffffff'}),96);this.shardMesh.frustumCulled=false;scene.add(this.shardMesh);
 this.skidMesh=new T.InstancedMesh(new T.PlaneGeometry(.17,1.6),new T.MeshBasicMaterial({color:'#14202a',transparent:true,opacity:.72,depthWrite:false}),128);this.skidMesh.frustumCulled=false;scene.add(this.skidMesh);
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(64*6),3));this.lines=new T.LineSegments(geo,new T.LineBasicMaterial({color:'#87f7ff',transparent:true,opacity:.38,depthWrite:false,blending:T.AdditiveBlending}));this.lines.frustumCulled=false;scene.add(this.lines);
 this.rings=Array.from({length:3},(_,n)=>{const m=new T.Mesh(new T.RingGeometry(.95,1,64),new T.MeshBasicMaterial({color:n?'#a9ffff':'#ff73bc',side:T.DoubleSide,transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending}));m.rotation.x=-Math.PI/2;scene.add(m);return m;});
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');for(let y=0;y<8;y++)for(let z=0;z<8;z++){x.fillStyle=(y+z)%2?'#ecf4ed':'#132a33';x.fillRect(z*32,y*32,32,32);}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;this.finish=new T.Mesh(new T.PlaneGeometry(12,4),new T.MeshBasicMaterial({map:tex}));this.finish.rotation.x=-Math.PI/2;scene.add(this.finish);
 this.zone=new T.InstancedMesh(new T.PlaneGeometry(.12,3.5),new T.MeshBasicMaterial({color:'#e281ff',transparent:true,opacity:.6,depthWrite:false,blending:T.AdditiveBlending}),32);this.zone.frustumCulled=false;scene.add(this.zone);
 }
 effectColor(color){if(!this.cachedColors.has(color))this.cachedColors.set(color,new T.Color(color));return this.cachedColors.get(color);}
 emit(type,g,previous){if(type==='damage'||type==='bounce'){this.impact=type==='damage'?1:.5;this.spray((g.drift_x/1000-1)*4,.7,1,type==='damage'?'#ff9863':'#75f3ff',type==='damage'?44:24);}
 if(type==='collect'){this.collect=.5;this.spray((g.drift_x/1000-1)*4,1,0,'#b3fff4',12);}
 if(type==='enemy')for(const b of previous.bodies)if(b.tag===9&&b.y>280&&b.y<920)this.spray((b.x/1000-1)*4,1,(b.y-830)*.1,'#ff865c',24);
 if(type==='wave'){this.burst=.6;}
 }
 spray(x,y,z,color,count){for(let n=0;n<count;n++){if(this.shards.length>=96)this.shards.shift();this.shards.push({x,y,z,vx:Math.sin(n*2.399)*3,vy:1+n%5*.7,vz:Math.cos(n*2.399)*3,life:.5+n%7*.08,age:0,color});}}
 draw(g,dt,reduced,low,distance,roadX,finishDistance){this.age+=dt;this.collect=Math.max(0,this.collect-dt);this.impact=Math.max(0,this.impact-dt*1.6);this.burst=Math.max(0,this.burst-dt);const travel=Math.max(0,(distance-this.lastDistance)*.1);this.lastDistance=distance;const d=this.dummy,x=(g.drift_x/1000-1)*4;
 if(!reduced&&g.drifting&&!g.over)for(const side of [-1,1]){this.skid[this.skidCursor++%128]={x:x+side*.86,at:distance,age:0};}
 for(let n=0;n<128;n++){const k=this.skid[n];if(k)k.age+=dt;d.position.set(k?k.x:0,k&&k.age<6?.04:-100,k?1.4+(distance-k.at)*.1:0);d.rotation.set(-Math.PI/2,0,0);d.scale.set(1,1,1);d.updateMatrix();this.skidMesh.setMatrixAt(n,d.matrix);}this.skidMesh.instanceMatrix.needsUpdate=true;this.skidMesh.visible=!reduced;
 for(const p of this.shards){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=6*dt;p.z+=p.vz*dt+travel;}this.shards=this.shards.filter(p=>p.age<p.life);for(let n=0;n<96;n++){const p=this.shards[n];d.position.set(p?.x||0,p?.y||-100,p?.z||0);d.rotation.set(this.age+n,this.age*2+n,n);d.scale.setScalar(p?Math.max(0,1-p.age/p.life):0);d.updateMatrix();this.shardMesh.setMatrixAt(n,d.matrix);this.shardMesh.setColorAt(n,this.effectColor(p?.color||'#ffffff'));}this.shardMesh.instanceMatrix.needsUpdate=true;this.shardMesh.instanceColor.needsUpdate=true;this.shardMesh.visible=!reduced;
 const pos=this.lines.geometry.attributes.position;for(let n=0;n<64;n++){const z=10-((n*13+this.age*100)%100),sx=(n%2?-1:1)*(7+n%9),y=.3+n%7*1.3;pos.setXYZ(n*2,sx,y,z);pos.setXYZ(n*2+1,sx,y,z+3+n%5);}pos.needsUpdate=true;this.lines.visible=!reduced&&!low&&g.ability_ticks>0&&!g.over;
 this.rings.forEach((r,n)=>{const emp=g.pulse_ticks/24,active=n===0?emp:this.collect*2;r.visible=!reduced&&active>0;const scale=n===0?(1-emp)*13+1:(1-active)*4+1+n;r.scale.setScalar(scale);r.position.set(x,.09+n*.02,n===0?-9:0);r.material.opacity=active*.65;});
 const z=-(finishDistance-distance)*.1;this.finish.visible=z> -160&&z<20;this.finish.position.set(roadX(z),.045,z);
 for(let n=0;n<32;n++){const z=12-((n*7+distance*.1)%112);d.position.set(roadX(z)+(n%2?5.4:-5.4),.04,z);d.rotation.set(-Math.PI/2,0,0);d.scale.set(1,1,1);d.updateMatrix();this.zone.setMatrixAt(n,d.matrix);}this.zone.instanceMatrix.needsUpdate=true;this.zone.visible=g.encounter===2;
 }
}
