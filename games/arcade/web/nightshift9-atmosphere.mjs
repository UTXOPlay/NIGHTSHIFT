import * as T from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {CIRCUIT_LOOKS,GARAGE_LOOK} from './nightshift9-look.mjs';
export function loadStreetRadiance(manager){return Promise.all(['sunset','daylight','night'].map(n=>new HDRLoader(manager).setDataType(T.FloatType).loadAsync('/arcade/art/nightshift/pbr/'+n+'.hdr')));}
export class StreetAtmosphere{
 constructor(renderer,scene,road){
  this.renderer=renderer;this.scene=scene;this.probes=[];this.frame=0;this.mode=-1;this.matrix=new T.Matrix4();this.inverse=new T.Matrix4();this.point=new T.Vector3();this.normal=new T.Vector3();
  this.mirror=new Reflector(new T.PlaneGeometry(1,1),{textureWidth:512,textureHeight:256,multisample:0,clipBias:.005});this.mirror.visible=false;scene.add(this.mirror);this.strength={value:0};this.textureMatrix={value:this.matrix};
  const previous=road.onBeforeCompile;road.onBeforeCompile=shader=>{previous?.(shader);shader.uniforms.streetReflection={value:this.mirror.getRenderTarget().texture};shader.uniforms.streetReflectionMatrix=this.textureMatrix;shader.uniforms.streetReflectionStrength=this.strength;
   shader.vertexShader='uniform mat4 streetReflectionMatrix; varying vec4 vStreetReflection;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvStreetReflection=streetReflectionMatrix*modelMatrix*vec4(transformed,1.);');
   shader.fragmentShader='uniform sampler2D streetReflection;uniform float streetReflectionStrength;varying vec4 vStreetReflection;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`vec2 reflectionUv=vStreetReflection.xy/max(vStreetReflection.w,.001);reflectionUv+=normal.xz*.002;float reflectionEdge=step(0.,reflectionUv.x)*step(reflectionUv.x,1.)*step(0.,reflectionUv.y)*step(reflectionUv.y,1.)*step(0.,vStreetReflection.w);vec3 streetLight=texture2D(streetReflection,clamp(reflectionUv,.001,.999)).rgb;float grazing=pow(1.-abs(dot(normal,geometryViewDir)),3.);outgoingLight=mix(outgoingLight,streetLight,streetReflectionStrength*reflectionEdge*roadWater*(.03+.55*grazing));\n#include <opaque_fragment>`);
  };road.customProgramCacheKey=()=>'measured-wet-reflection-v95';road.needsUpdate=true;
  const geometry=new T.PlaneGeometry(1,1),material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0},strength:{value:0}},vertexShader:'varying vec2 tex;void main(){tex=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 tex;uniform float strength;void main(){float r=length((tex-.5)*2.);float a=(1.-smoothstep(.045,.12,abs(r-.67)))*(1.-smoothstep(.7,1.,r));gl_FragColor=vec4(.55,.7,.78,a*strength);}'});this.splashes=new T.InstancedMesh(geometry,material,40);this.splashes.frustumCulled=false;scene.add(this.splashes);this.dummy=new T.Object3D();this.clock=0;this.splashSites=[];
 }
 async load(manager,mapsPromise=loadStreetRadiance(manager)){
  const maps=await mapsPromise,pm=new T.PMREMGenerator(this.renderer);
  // The authored key supplies direct sunlight. Bound captured sun/lamp peaks
  // before convolution so a tiny HDR disc does not become a second giant key.
  for(const t of maps){const a=t.image.data;for(let n=0;n<a.length;n+=4){const scale=Math.min(1,16/Math.max(a[n],a[n+1],a[n+2],.0001));a[n]*=scale;a[n+1]*=scale;a[n+2]*=scale;}t.needsUpdate=true;}
  try{
   this.probes.push(pm.fromEquirectangular(maps[0]),pm.fromEquirectangular(maps[1]));
   for(const tunnel of [false,true]){
    const s=new T.Scene();maps[2].mapping=T.EquirectangularReflectionMapping;s.background=maps[2];
    for(const side of [-1,1])for(let n=0;n<6;n++){
     const color=new T.Color(tunnel?'#ffd1a0':n%3?'#accddd':'#ffc792').multiplyScalar(tunnel?2:1.7);
     const card=new T.Mesh(new T.PlaneGeometry(tunnel?7:1.4,tunnel?1:8+n%3*3),new T.MeshBasicMaterial({color,side:T.DoubleSide}));card.position.set(side*12,tunnel?8:9,(n-3)*11);card.rotation.y=side*Math.PI/2;s.add(card);
    }
    this.probes.push(pm.fromScene(s,.08,.1,100,{size:128}));s.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
   }
  }finally{pm.dispose();maps.forEach(t=>t.dispose());}
 }
 update(mode,preview){const p=preview?GARAGE_LOOK:CIRCUIT_LOOKS[mode];this.scene.environment=this.probes[p.probe].texture;this.scene.environmentIntensity=preview?1.1:mode===0?.65:mode===3?.9:mode===10?.85:1;}
 draw(g,frame,dt,{low,preview,map,reduced,running,backdrop,camera,reflection=true}){
  this.clock+=dt;const wet=[0,3,8].includes(g.mode);this.splashes.visible=wet&&running&&!preview&&!map&&!reduced;this.splashes.count=low?16:40;const d=this.dummy;
  if(this.splashes.visible){for(let n=0;n<this.splashes.count;n++){const phase=(this.clock*1.6+n*.618)%1,cycle=Math.floor(this.clock*1.6+n*.618);let p=this.splashSites[n];if(!p||p.cycle!==cycle)p=this.splashSites[n]={cycle,x:Math.sin(n*17.37+cycle*12.8)*5.4,at:frame.distance+40+(n*29%300)};d.position.set(p.x,.025,(frame.distance-p.at)*.1);d.rotation.set(-Math.PI/2,0,0);frame.project(d.position);frame.orient(d,(frame.distance-p.at)*.1);d.scale.setScalar(.06+phase*.48);d.updateMatrix();this.splashes.setMatrixAt(n,d.matrix);}this.splashes.instanceMatrix.needsUpdate=true;}this.splashes.material.uniforms.strength.value=.16;
  this.strength.value=0;if(low||preview||map||!wet||!reflection)return;
  const z=-16,origin=frame.pose(z);this.mirror.position.set(origin.x,origin.y+.012,origin.z);this.mirror.rotation.set(-Math.PI/2,0,0);frame.orient(this.mirror,z);this.mirror.updateMatrixWorld(true);this.normal.set(0,0,1).applyQuaternion(this.mirror.quaternion);let error=0;
  for(const station of [-4,-24,-42])for(const x of [-5,5]){const p=frame.pose(station,x);this.point.set(p.x,p.y,p.z).sub(this.mirror.position);error=Math.max(error,Math.abs(this.point.dot(this.normal)));}
  if(error>.18)return;this.strength.value=.55;
  if(this.frame++%4===0){const old=backdrop?.visible;if(backdrop)backdrop.visible=false;this.splashes.visible=false;this.mirror.onBeforeRender(this.renderer,this.scene,camera);this.mirror.visible=false;if(backdrop)backdrop.visible=old;this.splashes.visible=wet&&running&&!reduced;this.inverse.copy(this.mirror.matrixWorld).invert();this.matrix.copy(this.mirror.material.uniforms.textureMatrix.value).multiply(this.inverse);}
 }
 dispose(){for(const p of this.probes)p.dispose();this.scene.remove(this.mirror,this.splashes);this.splashes.dispose();this.splashes.geometry.dispose();this.splashes.material.dispose();this.mirror.geometry.dispose();this.mirror.dispose();}
}
