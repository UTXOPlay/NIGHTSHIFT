import * as T from 'three';

// Rigid wheel motion inside the existing low-detail draw. The chassis remains
// stationary in model space; native simulation/contact geometry is untouched.
const declarations=`attribute vec4 wheelRig;
uniform vec2 fleetWheelMotion;
vec3 fleetWheelRotate(vec3 v){
 float angle=-fleetWheelMotion.x/max(wheelRig.w,.1);
 float c=cos(angle),s=sin(angle);
 v=vec3(v.x,c*v.y-s*v.z,s*v.y+c*v.z);
 float turn=wheelRig.z<0.?fleetWheelMotion.y:0.;c=cos(turn);s=sin(turn);
 return vec3(c*v.x+s*v.z,v.y,-s*v.x+c*v.z);
}
`;

export function wheelShader(shader,motion){
 shader.uniforms.fleetWheelMotion=motion;
 shader.vertexShader=declarations+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nif(wheelRig.w>.1)objectNormal=fleetWheelRotate(objectNormal);');
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nif(wheelRig.w>.1)transformed=wheelRig.xyz+fleetWheelRotate(transformed-wheelRig.xyz);');
}

export function bindWheelMaterial(material,motion){
 if(!material.userData.wheelMotion){
  material.userData.wheelMotion=motion;
  const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
  material.onBeforeCompile=(shader,renderer)=>{previous.call(material,shader,renderer);wheelShader(shader,motion);};
  material.customProgramCacheKey=()=>key+'-wheel-v142';
 }
}
export function installWheelMotion(mesh,material,motion){
 if(!mesh.geometry.getAttribute('wheelRig'))return;
 if(!mesh.geometry.userData.wheelBounds){mesh.geometry.computeBoundingSphere();mesh.geometry.boundingSphere.radius+=.15;mesh.geometry.userData.wheelBounds=true;}
 bindWheelMaterial(material,motion);
 const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking}),distance=new T.MeshDistanceMaterial();
 for(const [shadow,key]of [[depth,'depth'],[distance,'distance']]){
  shadow.onBeforeCompile=shader=>wheelShader(shader,motion);
  shadow.customProgramCacheKey=()=>`fleet-wheel-${key}-v142`;
 }
 mesh.customDepthMaterial=depth;mesh.customDistanceMaterial=distance;
}
