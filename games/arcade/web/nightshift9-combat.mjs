import * as T from 'three';

function softMaterial(opacity=0){
 const m=new T.SpriteMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity});m.userData.cell={value:new T.Vector4(0,0,1,1)};
 m.onBeforeCompile=shader=>{shader.vertexShader='varying vec2 effectUv;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\neffectUv=uv;');shader.fragmentShader='varying vec2 effectUv;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat effectEdge=length((effectUv-.5)*2.);diffuseColor.a*=1.-smoothstep(.55,.98,effectEdge);');};m.customProgramCacheKey=()=>'combat-soft-circle-v2';return m;
}
// Presentation only: deterministic game state remains untouched. All effects are
// bounded, reused, and driven by transitions observed after the 30 Hz rules step.
export class CombatEffects {
 constructor(scene,camera){
  this.scene=scene;this.camera=camera;this.time=0;this.wreckStart=-100;this.hitStart=-100;this.guardStart=-100;this.rivalStarts=Array(5).fill(-100);this.events=[];this.cursor=0;
  this.beams=Array.from({length:4},()=>{const m=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false}));m.visible=false;scene.add(m);return m;});this.beamStart=new T.Vector3();this.beamEnd=new T.Vector3();this.beamAxis=new T.Vector3();this.beamSide=new T.Vector3();this.beamEye=new T.Vector3();this.beamNormal=new T.Vector3();this.beamMatrix=new T.Matrix4();this.beamEvents=[];this.beamCursor=0;
  this.sprites=Array.from({length:24},()=>{const s=new T.Sprite(softMaterial(0));s.visible=false;scene.add(s);return s;});
  this.groundRings=Array.from({length:4},()=>{const m=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}));m.rotation.x=-Math.PI/2;m.visible=false;scene.add(m);return m;});
  this.guard=new T.Sprite(softMaterial(.5));this.guard.visible=false;scene.add(this.guard);
 }
 load(atlas){atlas.colorSpace=T.SRGBColorSpace;this.textures=Array.from({length:8},(_,n)=>{const t=atlas.clone();t.repeat.set(.248,.496);t.offset.set((n%4)*.25+.001,n<4?.502:.002);t.needsUpdate=true;return t;});for(let n=0;n<24;n++){const t=this.textures[n%8],m=this.sprites[n].material;m.map=t;m.userData.cell.value.set(t.offset.x,t.offset.y,t.repeat.x,t.repeat.y);m.needsUpdate=true;}for(const m of this.groundRings){m.material.map=this.textures[7];m.material.needsUpdate=true;}for(const b of this.beams){b.material.map=this.textures[4];b.material.needsUpdate=true;}this.guard.material.map=this.textures[2];this.guard.material.userData.cell.value.set(this.textures[2].offset.x,this.textures[2].offset.y,.248,.496);this.guard.material.needsUpdate=true;}
 reset(){this.events.length=0;this.beamEvents.length=0;for(const b of [...this.beams,...this.groundRings])b.visible=false;this.wreckStart=this.hitStart=this.guardStart=-100;this.rivalStarts.fill(-100);for(const s of this.sprites)s.visible=false;}
 burst(tile,x,z,size,life,distance,extra={}){if(!this.textures)return;const slot=this.cursor++%24;this.events=this.events.filter(e=>e.slot!==slot);this.events.push({slot,tile,x,z,y:.8,size,life,age:0,distance,...extra});const s=this.sprites[slot];s.material.map=this.textures[tile];s.material.userData.cell.value.set(this.textures[tile].offset.x,this.textures[tile].offset.y,.248,.496);s.material.blending=tile===1||tile===5||tile===6?T.NormalBlending:T.AdditiveBlending;s.material.rotation=0;s.material.needsUpdate=true;}
 emit(kind,g,previous,id=-1,target=-1){
  const x=(g.drift_x/1000-1)*4,d=g.distance;
  if(kind==='scrape'){this.burst(0,x-(g.impact_nx||0),0,2.3,.38,d);this.hitStart=this.time;}
  if(kind==='collision'||kind==='wreck'){this.hitStart=this.time;this.burst(0,x,-1,5,.55,d);if(kind==='collision')this.burst(g.shield?2:3,x,0,4.8,.8,d);this.burst(5,x,1,4,1,d);}
  if(kind==='wreck'){this.wreckStart=this.time;this.burst(1,x,0,2.8,.55,d);this.burst(6,x,2,4.5,1.4,d);this.burst(0,x,1,3.8,.45,d,{delay:.45});}
  if(kind==='hit'){this.hitStart=this.time;this.burst(4,x,0,3.6,.42,d);this.burst(0,x,-1,2.8,.35,d);this.burst(6,x,2,3,.7,d);}
  if(kind==='guard'||kind==='counter'){this.guardStart=this.time;this.burst(2,x,0,3.8,.5,d);if(kind==='counter')this.burst(7,x,0,4.6,.55,d);}
  if(kind==='shield-break'){this.burst(3,x,0,6,.85,d);}
  if(kind==='pulse'&&g.gadget===0&&target>=0){const r=g.rivals[target];const slot=this.beamCursor++%4;this.beamEvents=this.beamEvents.filter(e=>e.slot!==slot);this.beamEvents.push({slot,x,z:-1,endX:(r.x/1000-1)*4,endZ:-(r.distance-d)*.1,age:0,distance:d});}
  if(kind==='pulse'&&g.gadget===1)this.burst(7,x,-1,3,.55,d,{ground:true});
  if(id>=0){const r=g.rivals[id],rx=(r.x/1000-1)*4,rz=-(r.distance-d)*.1;
   if(kind==='rival-hit'||kind==='rival-block'||kind==='disable'){this.burst(kind==='rival-block'?2:0,rx,rz,kind==='disable'?5:3.2,.7,d);if(kind==='disable'){this.rivalStarts[id]=this.time;this.burst(4,rx,rz,2.8,.4,d);this.burst(6,rx,rz,3.4,.9,d);}else if(kind==='rival-hit')this.burst(4,rx,rz,3,.4,d);}
   if(kind==='rival-shot'){const victim=target>=0?g.rivals[target]:null;this.burst(4,rx,rz,1.3,.16,d,{endX:((victim?.x??g.drift_x)/1000-1)*4,endZ:victim?-(victim.distance-d)*.1:0,projectile:true});}
  }
 }
 posePlayer(car,g,reduced){
  const age=this.time-this.wreckStart,hitAge=this.time-this.hitStart;car.rotation.x=0;
  if(age>=0&&g.over&&g.finish_reason===2&&!reduced){const t=Math.min(1,age/1.45),ease=1-(1-t)**3,energy=Math.max(.25,Math.min(1.2,(g.impact_force||950)/1800)),side=g.impact_nx||Math.sign(g.impact_x||1),roll=Math.abs(g.impact_nx||0)>0&&(g.impact_force||0)>1400;car.position.x+=side*ease*.8*energy;car.position.z-=(g.impact_nz||-1)*ease*1.4*energy;car.position.y+=Math.sin(Math.PI*t)*(roll?.8:.16)*energy;car.rotation.x=Math.sin(t*Math.PI)*.3*energy;car.rotation.z=roll?side*Math.PI*ease:side*Math.sin(t*Math.PI)*.25*energy;car.rotation.y+=side*ease*(.25+Math.abs(g.impact_x||0)/1600);}
  else if(!reduced&&hitAge>=0&&hitAge<.5){const t=hitAge/.5;car.position.y+=Math.sin(t*Math.PI)*.025;car.rotation.z+=Math.sin(t*Math.PI*3)*(1-t)*.075;}

 }
 poseRival(car,id,reduced){const age=this.time-this.rivalStarts[id];car.rotation.x=0;car.rotation.z=0;if(!reduced&&age>=0&&age<1.4){const t=age/1.4;car.rotation.y+=Math.sin(t*Math.PI)*2.4;car.rotation.z=Math.sin(t*Math.PI*2)*(1-t)*.22;car.position.y+=Math.sin(t*Math.PI)*.35;}}
 draw(g,dt,reduced,roadX,visible=true){
  this.time+=dt;
  for(const s of this.sprites)s.visible=false;for(const b of [...this.beams,...this.groundRings])b.visible=false;
  for(const e of this.beamEvents){e.age+=dt;if(e.age>.18)continue;const shift=(g.distance-e.distance)*.1,z=e.z+shift,ez=e.endZ+shift,b=this.beams[e.slot];this.beamStart.set(e.x+roadX(z),.8,z);this.beamEnd.set(e.endX+roadX(ez),.85,ez);roadX.project?.(this.beamStart);roadX.project?.(this.beamEnd);this.beamAxis.subVectors(this.beamEnd,this.beamStart);const length=this.beamAxis.length();this.beamAxis.normalize();b.position.copy(this.beamStart).add(this.beamEnd).multiplyScalar(.5);this.beamEye.subVectors(this.camera.position,b.position).normalize();this.beamSide.crossVectors(this.beamAxis,this.beamEye).normalize();this.beamNormal.crossVectors(this.beamAxis,this.beamSide);this.beamMatrix.makeBasis(this.beamAxis,this.beamSide,this.beamNormal);b.quaternion.setFromRotationMatrix(this.beamMatrix);b.scale.set(length,.5+e.age*2,1);b.material.opacity=(1-e.age/.18)*.85;b.visible=visible&&!reduced;}this.beamEvents=this.beamEvents.filter(e=>e.age<.18);
  for(const e of this.events){e.age+=dt;const age=e.age-(e.delay||0);if(age<0||age>=e.life)continue;const t=age/e.life,s=e.ground?this.groundRings[e.slot%4]:this.sprites[e.slot],z=e.projectile?e.z+(e.endZ-e.z)*t:e.z+(g.distance-e.distance)*.1,x=e.projectile?e.x+(e.endX-e.x)*t:e.x;s.visible=visible&&!reduced;s.position.set(x+roadX(z),(e.ground?.055:e.y)+(e.tile===1||e.tile===6?t*1.6:0),z);roadX.project?.(s.position);if(e.ground){s.rotation.set(-Math.PI/2,0,0);const zLocal=z;this._frameObject??=new T.Object3D();this._frameObject.position.set(0,0,zLocal);this._frameObject.quaternion.copy(s.quaternion);roadX.transform?.(this._frameObject);s.quaternion.copy(this._frameObject.quaternion);}const size=e.size*(e.projectile?1:.55+t*(e.ground?3:1));s.scale.set(size,size*(e.tile===0?.5:e.tile===5||e.tile===6?.7:1),1);s.material.opacity=Math.min(1,(1-t)*1.7)*(e.tile===6?.7:e.tile===2||e.tile===7?.65:1);s.material.rotation=e.tile===0?t*.6:0;}
  this.events=this.events.filter(e=>e.age<e.life+(e.delay||0));this.guard.visible=visible&&g.counter_ticks>0;this.guard.position.set((g.drift_x/1000-1)*4,1,0);roadX.project?.(this.guard.position);this.guard.scale.set(3.2,2.65,1);this.guard.material.opacity=reduced?.22:.36;
 }
 snapshot(){return{time:this.time,wreckAge:this.time-this.wreckStart,hitAge:this.time-this.hitStart,guardAge:this.time-this.guardStart,rivalAges:this.rivalStarts.map(t=>this.time-t),active:this.events.length,visible:this.sprites.filter(s=>s.visible).length};}
}
