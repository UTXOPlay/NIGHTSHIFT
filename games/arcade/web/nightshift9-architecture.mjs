import * as T from 'three';
import {block,merge} from './nightshift8-assets.mjs';

let structureTexture;
export function loadStructureTexture(loader){return structureTexture??=(loader.loadAsync('/arcade/art/nightshift/structures-v8.webp').then(t=>{t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}));}

// One shared atlas, sampled in building metres instead of stretching one floor
// over a tower. Derivatives stay continuous across repeats to avoid mip shimmer.
export function facadeAtlas(material,texture,tile,width,height,{emission=.9,roof=true,columns=2,rows=2,variation=false,night={value:1}}={}){
 material.map=texture;
 material.onBeforeCompile=shader=>{
  shader.uniforms.facadeNight=night;
  shader.vertexShader='varying vec2 vFacadeUv; varying float vFacadeRoof; varying float vFacadeSeed;varying float vFacadeHeight;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
   vec3 facadeScale=vec3(1.);vFacadeSeed=.37;
   #ifdef USE_INSTANCING
    vFacadeSeed=fract(sin(dot(instanceMatrix[3].xz,vec2(.137,.073)))*43758.5453);
    facadeScale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
   #endif
   vFacadeRoof=abs(normal.y);
   vFacadeHeight=(position.y+.5)*facadeScale.y;
   vFacadeUv=uv*vec2(abs(normal.x)>.5?facadeScale.z:facadeScale.x,abs(normal.y)>.5?facadeScale.z:facadeScale.y)/vec2(${width.toFixed(1)},${height.toFixed(1)});
  `);
  shader.fragmentShader='uniform float facadeNight;varying vec2 vFacadeUv; varying float vFacadeRoof;varying float vFacadeSeed;varying float vFacadeHeight;\n'+shader.fragmentShader;
  const origin=[(tile%columns)/columns,(rows-1-Math.floor(tile/columns))/rows],span=[1/columns-.006,1/rows-.006];
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   vec2 facadeCoord=vec2(${origin[0]+.003},${origin[1]+.003})+fract(vFacadeUv)*vec2(${span[0]},${span[1]});
   vec4 facadeTexel=texture2DGradEXT(map,facadeCoord,dFdx(vFacadeUv)*vec2(${span[0]},${span[1]}),dFdy(vFacadeUv)*vec2(${span[0]},${span[1]}));
   facadeTexel.rgb=mix(facadeTexel.rgb,vec3(.055,.067,.078),step(.5,vFacadeRoof)*${roof?'1.':'0.'});
   float facadeLight=smoothstep(.15,.65,max(facadeTexel.r,facadeTexel.g))*smoothstep(.025,.18,abs(facadeTexel.r-facadeTexel.b)+max(0.,facadeTexel.g-facadeTexel.r));
   float roomSeed=fract(sin(dot(floor(vFacadeUv*vec2(4.,4.))+vFacadeSeed*41.,vec2(12.9898,78.233)))*43758.5453);
   float occupied=${variation?'smoothstep(.24,.42,roomSeed)':'1.'};
   facadeTexel.rgb*=mix(1.,mix(.42,1.,occupied),facadeLight*.7);
   diffuseColor*=facadeTexel;
   diffuseColor.rgb*=mix(.63,1.,smoothstep(0.,2.6,vFacadeHeight));
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance += facadeTexel.rgb*facadeLight*occupied*facadeNight*'+emission.toFixed(2)+';');
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=clamp(roughnessFactor-facadeLight*.3,.22,.92);');
 };
 material.customProgramCacheKey=()=>`facade-v95-${tile}-${width}-${height}-${emission}-${roof}-${columns}-${rows}-${variation}`;
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
  this.kinds=['swan-neck','slim-led','lantern','tunnel'];
  this.fixtures=this.kinds.map((name,kind)=>{
   const fixture=new T.Group(),add=(...v)=>fixture.add(block(...v));
   let tip;
   if(kind===0){
    const shaft=new T.Mesh(new T.CylinderGeometry(.068,.13,7.4,8),graphite);shaft.position.y=3.75;fixture.add(shaft);
    fixture.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0,6.8,0),new T.Vector3(.3,7.5,0),new T.Vector3(1.4,7.8,0),new T.Vector3(3.1,7.8,0)]),8,.065,5,false),graphite));
    add(1.35,.15,.52,graphite,3.2,7.76,0,.04);add(1.25,.03,.43,this.diffuser,3.2,7.66,0);tip=[3.2,7.65,0];
   }else if(kind===1){
    add(.14,6.7,.18,graphite,0,3.35,0);add(1.8,.14,.25,aluminum,.8,6.65,0);add(.9,.04,.3,this.diffuser,1.35,6.55,0);tip=[1.35,6.52,0];
   }else if(kind===2){
    add(.14,4.6,.14,graphite,0,2.3,0);add(.62,.13,.62,graphite,0,5.25,0);add(.4,.62,.4,this.diffuser,0,4.86,0);for(const x of [-.24,.24])add(.06,.8,.06,graphite,x,4.9,0);tip=[0,4.85,0];
   }else{
    add(2.2,.16,.6,graphite,1,9.4,0);add(1.9,.035,.44,this.diffuser,1,9.29,0);add(.12,.8,.12,aluminum,1,9.8,0);tip=[1,9.27,0];
   }
   if(kind!==3)add(.32,.3,.32,graphite,0,.15,0,.025);
   const template=merge(fixture),batches=template.children.map(part=>{const m=new T.InstancedMesh(part.geometry,part.material,LAMP_COUNT);m.frustumCulled=false;m.castShadow=false;m.receiveShadow=true;m.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(m);return m;});
   return{name,batches,tip};
  });
  this.batches=this.fixtures.flatMap(f=>f.batches);
  const glowMaterial=()=>new T.MeshBasicMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.4,toneMapped:false});
  this.halos=[0,1].map(()=>{const m=new T.InstancedMesh(new T.PlaneGeometry(1,1),glowMaterial(),LAMP_COUNT);m.frustumCulled=false;scene.add(m);return m;});
  this.pools=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{strength:{value:.02}},vertexShader:'varying vec2 poolUv;varying vec3 poolTint;varying float poolDepth;void main(){poolUv=uv;poolTint=instanceColor;vec4 p=modelViewMatrix*instanceMatrix*vec4(position,1.);poolDepth=-p.z;gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec2 poolUv;varying vec3 poolTint;varying float poolDepth;uniform float strength;void main(){vec2 p=poolUv*2.-1.;float r=dot(p,p);float a=exp(-r*3.8)*(1.-smoothstep(.5,1.,r))*(1.-smoothstep(18.,160.,poolDepth));gl_FragColor=vec4(poolTint,a*strength);}'}),LAMP_COUNT);this.pools.frustumCulled=false;scene.add(this.pools);
  // Only two moving physical lights; every other fixture uses instanced light
  // cards. No per-lamp shadow maps or extra scene render for each fixture.
  this.lights=Array.from({length:2},()=>{const l=new T.PointLight('#ffd9a4',0,27,2);scene.add(l);return l;});
  this.positions=Array.from({length:LAMP_COUNT},()=>new T.Vector3());this.loaded=false;
 }
 async load(loader){
  const structure=await loadStructureTexture(loader);for(const batch of this.batches)if(batch.material.isMeshStandardMaterial){const m=batch.material;m.map=structure;m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )','texture2D( map, vec2(.003,.003)+fract(vMapUv)*.494 )'));};m.customProgramCacheKey=()=>'lamp-metal-v81';m.needsUpdate=true;}
  const texture=await loader.loadAsync('/arcade/art/nightshift/street-lighting-v8.webp');texture.colorSpace=T.SRGBColorSpace;
  this.diffuser.map=atlasCell(texture,0);this.diffuser.map.repeat.set(.465,.18);this.diffuser.map.offset.set(.018,.645);this.diffuser.needsUpdate=true;
  this.halos.forEach((m,n)=>{m.material.map=atlasCell(texture,n+1);m.material.needsUpdate=true;});
  this.pools.material.needsUpdate=true;this.loaded=true;
 }
 draw(distance,mode,roadX,camera,low,preview){
  const enabled=LIT_MAPS.has(mode)&&!preview,travel=distance*.1,d=this.dummy,pitch=mode===3?34:mode===8?46:mode===10?32:48;
  for(const batch of this.batches){batch.count=0;batch.visible=enabled;}
  for(const halo of this.halos){halo.count=0;halo.visible=enabled;}this.pools.visible=enabled;this.used=new Set();
  if(!enabled){this.lights.forEach(l=>l.intensity=0);return;}
  const order=[],counts=[0,0,0,0],palette=[0,3,10].includes(mode)?this.warm:this.cool;
  for(let n=0;n<LAMP_COUNT;n++){
   const chunk=Math.floor(travel/pitch)-1+Math.floor(n/2),z=travel-chunk*pitch,side=n%2?1:-1,kind=mode===10?3:mode===3?(Math.floor(chunk/3)%2+2)%2:mode===8||mode===4?(Math.abs(chunk+side)%4===0?2:1):Math.abs(chunk)%5===0?0:1;
   const fixture=this.fixtures[kind],index=counts[kind]++,x=roadX(z)+side*(mode===10?7.4:8.3);this.used.add(fixture.name);
   d.position.set(x,0,z);d.rotation.set(0,side>0?Math.PI:0,0);d.scale.set(1,1,1);roadX.transform?.(d,true);d.updateMatrix();for(const batch of fixture.batches)batch.setMatrixAt(index,d.matrix);
   const p=this.positions[n];p.set(x-side*fixture.tip[0],fixture.tip[1],z);order.push({n,z,side,kind});
   const warm=kind===2||[0,3,10].includes(mode)&&chunk%4!==0,halo=this.halos[warm?0:1],h=halo.count++;
   d.position.copy(p);d.quaternion.copy(camera.quaternion);d.scale.setScalar(low?.85:kind===2?1.15:1.55);roadX.project?.(d.position);d.updateMatrix();halo.setMatrixAt(h,d.matrix);this.tint??=new T.Color();this.tint.copy(warm?this.warm:this.cool).multiplyScalar(Math.max(.03,1-Math.abs(z)/340));halo.setColorAt(h,this.tint);
   d.position.set(p.x,.035,z);d.rotation.set(-Math.PI/2,0,0);d.scale.set(kind===2?4.5:6.1,WET_MAPS.has(mode)?12.5:8.5,1);roadX.transform?.(d);d.updateMatrix();this.pools.setMatrixAt(n,d.matrix);this.tint.copy(warm?this.warm:palette).multiplyScalar(.72+((Math.abs(chunk*7+n)%9)/30));this.pools.setColorAt(n,this.tint);
  }
  for(let k=0;k<this.fixtures.length;k++)for(const b of this.fixtures[k].batches){b.count=counts[k];b.visible=enabled&&b.count>0;if(b.count)b.instanceMatrix.needsUpdate=true;}
  for(const halo of this.halos)if(halo.count){halo.instanceMatrix.needsUpdate=true;halo.instanceColor.needsUpdate=true;}
  this.pools.instanceMatrix.needsUpdate=true;this.pools.instanceColor.needsUpdate=true;this.pools.material.uniforms.strength.value=mode===3?.028:mode===10?.024:mode===8?.009:.014;
  order.sort((a,b)=>Math.abs(a.z)-Math.abs(b.z));const first=order[0],second=order.find(p=>p.side!==first.side)||order[1];
  this.lights.forEach((l,n)=>{const p=n?second:first;l.position.copy(this.positions[p.n]);roadX.project?.(l.position);l.color.copy(p.kind===2?this.warm:palette);l.intensity=low?0:mode===3?110:mode===8?28:80;});
 }
 snapshot(){return{loaded:this.loaded,families:[...(this.used||[])],fixtures:LAMP_COUNT,physicalLights:this.lights.length,activeLights:this.lights.filter(l=>l.intensity>0).length};}
}
