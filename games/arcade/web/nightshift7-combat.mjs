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
  this.sprites=Array.from({length:24},()=>{const s=new T.Sprite(softMaterial(0));s.visible=false;scene.add(s);return s;});
  this.guard=new T.Sprite(softMaterial(.5));this.guard.visible=false;scene.add(this.guard);
 }
 load(atlas){atlas.colorSpace=T.SRGBColorSpace;this.textures=Array.from({length:8},(_,n)=>{const t=atlas.clone();t.repeat.set(.248,.496);t.offset.set((n%4)*.25+.001,n<4?.502:.002);t.needsUpdate=true;return t;});for(let n=0;n<24;n++){const t=this.textures[n%8],m=this.sprites[n].material;m.map=t;m.userData.cell.value.set(t.offset.x,t.offset.y,t.repeat.x,t.repeat.y);m.needsUpdate=true;}this.guard.material.map=this.textures[2];this.guard.material.userData.cell.value.set(this.textures[2].offset.x,this.textures[2].offset.y,.248,.496);this.guard.material.needsUpdate=true;}
 reset(){this.events.length=0;this.wreckStart=this.hitStart=this.guardStart=-100;this.rivalStarts.fill(-100);for(const s of this.sprites)s.visible=false;}
 burst(tile,x,z,size,life,distance,extra={}){if(!this.textures)return;const slot=this.cursor++%24;this.events=this.events.filter(e=>e.slot!==slot);this.events.push({slot,tile,x,z,y:.8,size,life,age:0,distance,...extra});const s=this.sprites[slot];s.material.map=this.textures[tile];s.material.userData.cell.value.set(this.textures[tile].offset.x,this.textures[tile].offset.y,.248,.496);s.material.blending=tile===1||tile===5||tile===6?T.NormalBlending:T.AdditiveBlending;s.material.rotation=0;s.material.needsUpdate=true;}
 emit(kind,g,previous,id=-1){
  const x=(g.drift_x/1000-1)*4,d=g.distance;
  if(kind==='collision'||kind==='wreck'){this.hitStart=this.time;this.burst(0,x,-1,5,.55,d);if(kind==='collision')this.burst(g.shield?2:3,x,0,4.8,.8,d);this.burst(5,x,1,4,1,d);}
  if(kind==='wreck'){this.wreckStart=this.time;this.burst(1,x,0,5.5,1.3,d);this.burst(6,x,2,6,2,d);this.burst(0,x,1,6,.8,d,{delay:.55});}
  if(kind==='hit'){this.hitStart=this.time;this.burst(4,x,0,3.6,.42,d);this.burst(0,x,-1,2.8,.35,d);this.burst(6,x,2,3,.7,d);}
  if(kind==='guard'||kind==='counter'){this.guardStart=this.time;this.burst(2,x,0,5.5,.7,d);if(kind==='counter')this.burst(7,x,0,7.5,.85,d);}
  if(kind==='shield-break'){this.burst(3,x,0,6,.85,d);}
  if(id>=0){const r=g.rivals[id],rx=(r.x/1000-1)*4,rz=-(r.distance-d)*.1;
   if(kind==='rival-hit'||kind==='rival-block'||kind==='disable'){this.burst(kind==='rival-block'?2:0,rx,rz,kind==='disable'?5:3.2,.7,d);if(kind==='disable'){this.rivalStarts[id]=this.time;this.burst(1,rx,rz,4.5,.8,d);this.burst(6,rx,rz,5,1.6,d);}else if(kind==='rival-hit')this.burst(4,rx,rz,3,.4,d);}
   if(kind==='rival-shot')this.burst(4,rx,rz,1.3,.22,d,{endX:(r.attack_x/1000-1)*4,endZ:0,projectile:true});
  }
 }
 posePlayer(car,g,reduced){
  const age=this.time-this.wreckStart,hitAge=this.time-this.hitStart;car.rotation.x=0;
  if(age>=0&&g.over&&g.finish_reason===2&&!reduced){const t=Math.min(1,age/1.45),ease=1-(1-t)**3;car.position.y=Math.sin(Math.PI*t)*2.5+.3*ease;car.position.x+=Math.sin(t*Math.PI*.7)*2.1;car.position.z+=ease*3.4;car.rotation.x=-Math.sin(t*Math.PI)*.55;car.rotation.z=ease*Math.PI*3;car.rotation.y+=ease*.85;}
  else if(!reduced&&hitAge>=0&&hitAge<.5){const t=hitAge/.5;car.position.y+=Math.sin(t*Math.PI)*.13;car.rotation.z+=Math.sin(t*Math.PI*3)*(1-t)*.13;}
 }
 poseRival(car,id,reduced){const age=this.time-this.rivalStarts[id];car.rotation.z=0;if(!reduced&&age>=0&&age<1.4){const t=age/1.4;car.rotation.y+=Math.sin(t*Math.PI)*2.4;car.rotation.z=Math.sin(t*Math.PI*2)*(1-t)*.22;car.position.y+=Math.sin(t*Math.PI)*.35;}}
 draw(g,dt,reduced,roadX,visible=true){
  this.time+=dt;
  for(const s of this.sprites)s.visible=false;
  for(const e of this.events){e.age+=dt;const age=e.age-(e.delay||0);if(age<0||age>=e.life)continue;const t=age/e.life,s=this.sprites[e.slot],z=e.projectile?e.z+(e.endZ-e.z)*t:e.z+(g.distance-e.distance)*.1,x=e.projectile?e.x+(e.endX-e.x)*t:e.x;s.visible=visible&&!reduced;s.position.set(x+roadX(z),e.y+(e.tile===1||e.tile===6?t*1.6:0),z);s.scale.setScalar(e.size*(e.projectile?1:.45+t*1.2));s.material.opacity=Math.min(1,(1-t)*1.7)*(e.tile===6?.7:e.tile===2||e.tile===7?.65:1);s.material.rotation=e.tile===0?t*.6:0;}
  this.events=this.events.filter(e=>e.age<e.life+(e.delay||0));this.guard.visible=visible&&g.counter_ticks>0;this.guard.position.set((g.drift_x/1000-1)*4,1,0);this.guard.scale.setScalar(reduced?4.2:4.3+Math.sin(this.time*5)*.12);this.guard.material.opacity=reduced?.24:.35;
 }
 snapshot(){return{time:this.time,wreckAge:this.time-this.wreckStart,hitAge:this.time-this.hitStart,guardAge:this.time-this.guardStart,rivalAges:this.rivalStarts.map(t=>this.time-t),active:this.events.length,visible:this.sprites.filter(s=>s.visible).length};}
}
