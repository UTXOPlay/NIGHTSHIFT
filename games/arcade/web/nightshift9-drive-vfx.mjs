import * as T from 'three';
import {ContactTrail} from './nightshift9-trails.mjs';

function flipbook(count,additive){
 const geometry=new T.PlaneGeometry(1,1);
 geometry.setAttribute('effectFrame',new T.InstancedBufferAttribute(new Float32Array(count),1));
 geometry.setAttribute('effectAlpha',new T.InstancedBufferAttribute(new Float32Array(count),1));
 const material=new T.MeshBasicMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:additive?T.AdditiveBlending:T.NormalBlending,toneMapped:!additive});
 material.onBeforeCompile=s=>{
  s.vertexShader='attribute float effectFrame; attribute float effectAlpha; varying float vEffectFrame; varying float vEffectAlpha;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvEffectFrame=effectFrame;vEffectAlpha=effectAlpha;');
  s.fragmentShader='varying float vEffectFrame; varying float vEffectAlpha;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D( map, vec2(mod(vEffectFrame,4.)*.25+.002,vEffectFrame<4.?.502:.002)+vMapUv*vec2(.246,.496) )')+'\ndiffuseColor.a*=vEffectAlpha;');
 };
 material.customProgramCacheKey=()=>`drive-flipbook-v81-${additive}`;
 const mesh=new T.InstancedMesh(geometry,material,count);mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);return mesh;
}

// Fixed pools, contact anchors and distance-based ribbons; no rule mutation.
export class DriveVfx{
 constructor(scene){
  this.smoke=flipbook(48,false);this.plumes=flipbook(2,true);scene.add(this.smoke,this.plumes);this.particles=[];this.cursor=0;this.accumulator=0;this.time=0;this.dummy=new T.Object3D();this.loaded=false;
  this.trails=[new ContactTrail(),new ContactTrail()];this.marks=[];this.markCursor=0;this.direction=new T.Vector3();this.normal=new T.Vector3();this.side=new T.Vector3();this.start=new T.Vector3();this.end=new T.Vector3();this.basis=new T.Matrix4();
  const geometry=new T.PlaneGeometry(.22,1);geometry.setAttribute('trailAlpha',new T.InstancedBufferAttribute(new Float32Array(256),1));const material=new T.MeshBasicMaterial({color:'#10191e',transparent:true,opacity:.62,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  material.onBeforeCompile=s=>{s.vertexShader='attribute float trailAlpha; varying float vTrailAlpha;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvTrailAlpha=trailAlpha;');s.fragmentShader='varying float vTrailAlpha;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','diffuseColor.a*=vTrailAlpha;\n#include <opaque_fragment>');};material.customProgramCacheKey=()=>'contact-ribbon-v91';
  this.ribbons=new T.InstancedMesh(geometry,material,256);this.ribbons.frustumCulled=false;this.ribbons.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(this.ribbons);
 }
 async load(loader){const atlas=await loader.loadAsync('/arcade/art/nightshift/drive-vfx-v81.webp');atlas.colorSpace=T.SRGBColorSpace;for(const m of [this.smoke,this.plumes]){m.material.map=atlas;m.material.needsUpdate=true;}this.loaded=true;}
 reset(){this.particles.length=0;this.marks.length=0;this.accumulator=0;for(const t of this.trails)t.reset();}
 draw(g,distance,dt,camera,roadX,{running,reduced,low,rig,car,wet=false,visible=true}){
  this.time+=dt;const d=this.dummy;this.smoke.visible=this.loaded&&running&&!reduced;this.plumes.visible=this.loaded&&running&&!reduced&&g.ability_ticks>0&&!g.stun;this.ribbons.visible=visible&&!reduced;
  const rear=rig?.contacts.filter(p=>p.rear)||[],slip=running&&g.drifting&&!g.over,emit=running&&(slip||wet&&g.speed>1000)&&rear.length===2;
  if(reduced){this.reset();this.ribbons.visible=false;return;}
  if(!slip)for(const t of this.trails)t.reset();else rear.forEach((p,n)=>this.trails[n].sample(p,(a,b)=>{this.marks[this.markCursor++%256]={a:{...a},b:{...b},age:0};}));
  this.accumulator+=dt;const cadence=low?.09:.045;
  if(emit)while(this.accumulator>=cadence){this.accumulator-=cadence;for(const p of rear){const id=this.cursor++%48;this.particles[id]={x:p.x,at:p.at,y:p.y,age:this.accumulator,life:slip?.85:.4,id,water:!slip};}}else this.accumulator=0;
  const frames=this.smoke.geometry.attributes.effectFrame,alpha=this.smoke.geometry.attributes.effectAlpha;
  for(let n=0;n<48;n++){
   const p=this.particles[n];if(p)p.age+=dt;if(!p||p.age>=p.life){d.position.set(0,-100,0);d.scale.setScalar(0);alpha.setX(n,0);}
   else{const t=p.age/p.life,z=(distance-p.at)*.1,size=p.water?.35+t*1.4:.4+t*2.5;d.position.set(p.x+Math.sin(n*2.4)*t*.35,p.y+.14+t*(p.water?.25:.75),z);roadX.project?.(d.position);d.scale.set(size,size*(p.water?.3:.72),1);d.quaternion.copy(camera.quaternion);frames.setX(n,Math.min(3,Math.floor(t*4)));alpha.setX(n,Math.min(1,t*10)*(1-t)*(p.water?.22:wet?.32:.5));}
   d.updateMatrix();this.smoke.setMatrixAt(n,d.matrix);
  }
  this.smoke.instanceMatrix.needsUpdate=true;frames.needsUpdate=alpha.needsUpdate=true;this.smoke.material.color.set(wet?'#adbfc9':'#b7b3ab');
  const fades=this.ribbons.geometry.attributes.trailAlpha;
  for(let n=0;n<256;n++){const k=this.marks[n];if(k)k.age+=dt;if(!k||k.age>6){d.position.set(0,-100,0);d.scale.setScalar(0);fades.setX(n,0);}else{
   this.start.set(k.a.x,.018,(distance-k.a.at)*.1);this.end.set(k.b.x,.018,(distance-k.b.at)*.1);roadX.project?.(this.start);roadX.project?.(this.end);this.direction.subVectors(this.end,this.start);const length=this.direction.length();this.direction.normalize();this.normal.set(0,1,0);this.side.crossVectors(this.direction,this.normal).normalize();this.normal.crossVectors(this.side,this.direction).normalize();this.basis.makeBasis(this.side,this.direction,this.normal);d.position.copy(this.start).add(this.end).multiplyScalar(.5);d.quaternion.setFromRotationMatrix(this.basis);d.scale.set(1,length*1.07,1);fades.setX(n,Math.min(1,(6-k.age)*.7));}d.updateMatrix();this.ribbons.setMatrixAt(n,d.matrix);}
  this.ribbons.instanceMatrix.needsUpdate=true;fades.needsUpdate=true;
  for(let n=0;n<2;n++){
   const p=rig?.exhaust[n];if(!p){d.scale.setScalar(0);}else{
    this.start.set(p.x,p.y,p.z);roadX.project?.(this.start);this.direction.set(0,0,1).applyQuaternion(car.quaternion);this.end.copy(this.start).addScaledVector(this.direction,g.ability_ticks?1.8:0);d.position.copy(this.start).add(this.end).multiplyScalar(.5);this.normal.subVectors(camera.position,d.position).normalize();this.side.crossVectors(this.direction,this.normal).normalize();this.normal.crossVectors(this.side,this.direction);this.basis.makeBasis(this.side,this.direction,this.normal);d.quaternion.setFromRotationMatrix(this.basis);d.scale.set(.55,1.9,1);
   }d.updateMatrix();this.plumes.setMatrixAt(n,d.matrix);this.plumes.geometry.attributes.effectFrame.setX(n,4+(Math.floor(this.time*24)+n)%4);this.plumes.geometry.attributes.effectAlpha.setX(n,.8);
  }
  this.plumes.instanceMatrix.needsUpdate=true;this.plumes.geometry.attributes.effectFrame.needsUpdate=this.plumes.geometry.attributes.effectAlpha.needsUpdate=true;
 }
}
