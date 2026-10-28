import * as T from 'three';
import {block,merge} from './nightshift8-assets.mjs';

let structureTexture;
export function loadStructureTexture(loader){return structureTexture??=(loader.loadAsync('/arcade/art/nightshift/structures-v8.webp').then(t=>{t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}));}

// One shared atlas, sampled in building metres instead of stretching one floor
// over a tower. Derivatives stay continuous across repeats to avoid mip shimmer.
export function facadeAtlas(material,texture,tile,width,height,{emission=.9,roof=true}={}){
 material.map=texture;
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec2 vFacadeUv; varying float vFacadeRoof;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
   vec3 facadeScale=vec3(1.);
   #ifdef USE_INSTANCING
    facadeScale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
   #endif
   vFacadeRoof=abs(normal.y);
   vFacadeUv=uv*vec2(abs(normal.x)>.5?facadeScale.z:facadeScale.x,abs(normal.y)>.5?facadeScale.z:facadeScale.y)/vec2(${width.toFixed(1)},${height.toFixed(1)});
  `);
  shader.fragmentShader='varying vec2 vFacadeUv; varying float vFacadeRoof;\n'+shader.fragmentShader;
  const origin=[(tile%2)*.5,tile<2?.5:0];
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   vec2 facadeCoord=vec2(${origin[0]+.003},${origin[1]+.003})+fract(vFacadeUv)*.494;
   vec4 facadeTexel=texture2DGradEXT(map,facadeCoord,dFdx(vFacadeUv)*.494,dFdy(vFacadeUv)*.494);
   facadeTexel.rgb=mix(facadeTexel.rgb,vec3(.055,.067,.078),step(.5,vFacadeRoof)*${roof?'1.':'0.'});
   diffuseColor*=facadeTexel;
   float facadeLight=smoothstep(.15,.65,max(facadeTexel.r,facadeTexel.g))*smoothstep(.025,.18,abs(facadeTexel.r-facadeTexel.b)+max(0.,facadeTexel.g-facadeTexel.r));
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance += facadeTexel.rgb*facadeLight*'+emission.toFixed(2)+';');
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=clamp(roughnessFactor-facadeLight*.18,.22,.85);');
 };
 material.customProgramCacheKey=()=>`facade-v8.1-${tile}-${width}-${height}-${emission}-${roof}`;
 material.needsUpdate=true;
}

function atlasCell(texture,index){
 const t=texture.clone();t.repeat.set(.492,.492);t.offset.set((index%2)*.5+.004,index<2?.504:.004);t.needsUpdate=true;return t;
}
const LAMP_COUNT=22;
const LIT_MAPS=new Set([0,3,4,8,9,10,11]);
const WET_MAPS=new Set([0,3,8]);

export class StreetLighting{
 constructor(scene){
  this.scene=scene;this.dummy=new T.Object3D();this.matrix=new T.Matrix4();this.origin=new T.Vector3();
  this.warm=new T.Color('#ffd9a4');this.cool=new T.Color('#b6edf0');
  const graphite=new T.MeshStandardMaterial({color:'#414e58',metalness:.75,roughness:.36});
  const aluminum=new T.MeshStandardMaterial({color:'#a4b3ba',metalness:.82,roughness:.27});
  this.diffuser=new T.MeshBasicMaterial({color:'#fff1d0',toneMapped:false,side:T.DoubleSide});
  const fixture=new T.Group();
  const shaft=new T.Mesh(new T.CylinderGeometry(.068,.13,7.4,10),graphite);shaft.position.y=3.75;fixture.add(shaft);
  fixture.add(block(.36,.32,.36,graphite,0,.12,0,.045),block(.19,.72,.19,aluminum,0,.62,0,.025));
  const arm=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,6.8,0),new T.Vector3(.25,7.55,0),new T.Vector3(1.3,7.85,0),new T.Vector3(3.15,7.85,0)]),10,.065,6,false),graphite);fixture.add(arm);
  fixture.add(block(1.35,.18,.52,graphite,3.25,7.79,0,.075),block(1.27,.035,.46,aluminum,3.25,7.68,0,.02));
  for(let n=0;n<5;n++)fixture.add(block(.045,.07,.42,aluminum,2.78+n*.23,7.91,0));
  const lens=new T.Mesh(new T.PlaneGeometry(1.22,.44),this.diffuser);lens.rotation.x=Math.PI/2;lens.position.set(3.25,7.65,0);fixture.add(lens);
  const template=merge(fixture);
  this.batches=template.children.map(part=>{
   const m=new T.InstancedMesh(part.geometry,part.material,LAMP_COUNT);m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;m.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(m);return m;
  });
  const glowMaterial=()=>new T.MeshBasicMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.4,toneMapped:false});
  this.halos=[0,1].map(()=>{const m=new T.InstancedMesh(new T.PlaneGeometry(1,1),glowMaterial(),LAMP_COUNT);m.frustumCulled=false;scene.add(m);return m;});
  this.pools=new T.InstancedMesh(new T.PlaneGeometry(1,1),glowMaterial(),LAMP_COUNT);this.pools.material.opacity=.27;this.pools.frustumCulled=false;scene.add(this.pools);
  // Only two moving physical lights; every other fixture uses instanced light
  // cards. No per-lamp shadow maps, postprocessing bloom or extra scene render.
  this.lights=Array.from({length:2},()=>{const l=new T.PointLight('#ffd9a4',0,27,2);scene.add(l);return l;});
  this.positions=Array.from({length:LAMP_COUNT},()=>new T.Vector3());this.loaded=false;
 }
 async load(loader){
  const structure=await loadStructureTexture(loader);for(const batch of this.batches)if(batch.material.isMeshStandardMaterial){const m=batch.material;m.map=structure;m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D( map, vec2(.003,.003)+fract(vMapUv)*.494 )'));};m.customProgramCacheKey=()=>'lamp-metal-v81';m.needsUpdate=true;}
  const texture=await loader.loadAsync('/arcade/art/nightshift/street-lighting-v8.webp');texture.colorSpace=T.SRGBColorSpace;
  this.diffuser.map=atlasCell(texture,0);this.diffuser.map.repeat.set(.465,.18);this.diffuser.map.offset.set(.018,.645);this.diffuser.needsUpdate=true;
  this.halos.forEach((m,n)=>{m.material.map=atlasCell(texture,n+1);m.material.needsUpdate=true;});
  this.pools.material.map=atlasCell(texture,3);this.pools.material.needsUpdate=true;this.loaded=true;
 }
 draw(distance,mode,roadX,camera,low,preview){
  const enabled=LIT_MAPS.has(mode)&&!preview,travel=distance*.1,d=this.dummy;
  const cool=mode===9||mode===4||mode===8,color=cool?this.cool:this.warm;
  for(const batch of this.batches)batch.visible=enabled;
  this.pools.visible=enabled;this.halos.forEach((m,n)=>{m.visible=enabled&&(cool?n===1:n===0);m.count=LAMP_COUNT;});
  // Each halo buffer reserves 22 entries; active warm/cool variants never mix.
  if(!enabled){this.lights.forEach(l=>l.intensity=0);return;}
  const halo=this.halos[cool?1:0];let closest=0,near=Infinity;
  for(let n=0;n<LAMP_COUNT;n++){
   const z=travel-(Math.floor(travel/42)-1+Math.floor(n/2))*42,side=n%2?1:-1,x=roadX(z)+side*8.15;
   d.position.set(x,0,z);d.rotation.set(0,side>0?Math.PI:0,0);d.scale.set(1,1,1);d.updateMatrix();
   for(const batch of this.batches)batch.setMatrixAt(n,d.matrix);
   const p=this.positions[n];p.set(x-side*3.25,7.65,z);
   d.position.copy(p);d.quaternion.copy(camera.quaternion);d.scale.setScalar(low?1.4:2.1);d.updateMatrix();halo.setMatrixAt(n,d.matrix);
   d.position.set(p.x,.037,z);d.rotation.set(-Math.PI/2,0,0);d.scale.set(6.3,WET_MAPS.has(mode)?17:11,1);d.updateMatrix();this.pools.setMatrixAt(n,d.matrix);this.pools.setColorAt(n,color);
   if(n%2===0&&Math.abs(z)<near){near=Math.abs(z);closest=n;}
  }
  for(const b of this.batches)b.instanceMatrix.needsUpdate=true;
  halo.instanceMatrix.needsUpdate=true;this.pools.instanceMatrix.needsUpdate=true;this.pools.instanceColor.needsUpdate=true;
  this.pools.material.opacity=mode===3?.34:mode===10?.3:.17;
  this.lights.forEach((l,n)=>{l.position.copy(this.positions[closest+n]);l.color.copy(color);l.intensity=low?0:(mode===3?100:70);});
 }
 snapshot(){return{loaded:this.loaded,fixtures:LAMP_COUNT,physicalLights:this.lights.length,activeLights:this.lights.filter(l=>l.intensity>0).length};}
}
