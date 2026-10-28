import * as T from 'three';

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

// Fixed particle pools, no per-frame texture upload and no simulation mutations.
export class DriveVfx{
 constructor(scene){
  this.smoke=flipbook(32,false);this.plumes=flipbook(2,true);scene.add(this.smoke,this.plumes);
  this.particles=[];this.cursor=0;this.accumulator=0;this.time=0;this.dummy=new T.Object3D();this.loaded=false;
 }
 async load(loader){
  const atlas=await loader.loadAsync('/arcade/art/nightshift/drive-vfx-v81.webp');atlas.colorSpace=T.SRGBColorSpace;
  for(const m of [this.smoke,this.plumes]){m.material.map=atlas;m.material.needsUpdate=true;}this.loaded=true;
 }
 reset(){this.particles.length=0;this.accumulator=0;}
 draw(g,distance,dt,camera,roadX,{running,reduced,low}){
  this.time+=dt;const d=this.dummy,x=(g.drift_x/1000-1)*4;
  this.smoke.visible=this.loaded&&running&&!reduced;this.plumes.visible=this.loaded&&running&&!reduced&&g.ability_ticks>0&&!g.stun;
  if(!running||reduced){this.reset();return;}
  this.accumulator+=dt;
  if(g.drifting&&this.accumulator>(low?.095:.045)){
   this.accumulator=0;
   for(const side of [-1,1]){const id=this.cursor++%32;this.particles[id]={x:x+side*.92,distance,age:0,life:.7+(id%4)*.08,side,id};}
  }
  const frames=this.smoke.geometry.attributes.effectFrame,alpha=this.smoke.geometry.attributes.effectAlpha;
  for(let n=0;n<32;n++){
   const p=this.particles[n];if(p)p.age+=dt;
   if(!p||p.age>=p.life){d.position.set(0,-100,0);d.scale.setScalar(0);alpha.setX(n,0);}
   else{const t=p.age/p.life,z=1.1+(distance-p.distance)*.1,size=.8+t*3.7;d.position.set(p.x+roadX(z)+p.side*t*.45,.28+t*.9,z);d.scale.set(size,size*.7,1);d.quaternion.copy(camera.quaternion);frames.setX(n,Math.min(3,Math.floor(t*4)));alpha.setX(n,Math.min(1,t*12)*(1-t)*.48);}
   d.updateMatrix();this.smoke.setMatrixAt(n,d.matrix);
  }
  this.smoke.instanceMatrix.needsUpdate=true;frames.needsUpdate=alpha.needsUpdate=true;
  this.smoke.material.color.set([3,10].includes(g.mode)?'#899da6':'#c6d2d5');
  for(let n=0;n<2;n++){
   d.position.set(x+(n?-.63:.63),.35,3.45);d.rotation.set(Math.PI/2,0,0);d.scale.set(.85,3.3,1);d.updateMatrix();this.plumes.setMatrixAt(n,d.matrix);
   this.plumes.geometry.attributes.effectFrame.setX(n,4+(Math.floor(this.time*18)+n)%4);this.plumes.geometry.attributes.effectAlpha.setX(n,.85);
  }
  this.plumes.instanceMatrix.needsUpdate=true;this.plumes.geometry.attributes.effectFrame.needsUpdate=this.plumes.geometry.attributes.effectAlpha.needsUpdate=true;
 }
}
