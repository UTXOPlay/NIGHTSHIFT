import * as T from 'three';

// Eight generated elevations share one sampler and one instanced material.
// Module scale follows the actual building, while roof and window response stay
// separate. No additional dynamic lights, scene passes or shadow maps.
export function harbourFacade(material,texture,night){
 material.map=texture;material.roughness=.83;material.metalness=.04;
 material.onBeforeCompile=s=>{
  s.uniforms.harbourNight=night;
  s.vertexShader='varying vec2 harbourUv;varying float harbourSeed;varying float harbourRoof;varying float harbourHeight;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
   vec3 scale=vec3(1.);harbourSeed=.37;
   #ifdef USE_INSTANCING
    scale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
    harbourSeed=fract(sin(dot(instanceMatrix[3].xz,vec2(.137,.073)))*43758.5453);
   #endif
   harbourRoof=abs(normal.y);harbourHeight=(position.y+.5)*scale.y;
   harbourUv=uv*vec2(max(1.,floor((abs(normal.x)>.5?scale.z:scale.x)/12.+.5)),1.);
  `);
  s.fragmentShader='uniform float harbourNight;varying vec2 harbourUv;varying float harbourSeed;varying float harbourRoof;varying float harbourHeight;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
   float tile=floor(harbourSeed*8.);vec2 origin=vec2(mod(tile,4.)*.25,(1.-floor(tile/4.))*.5);
   vec2 coord=origin+vec2(.0015,.003)+fract(harbourUv)*vec2(.247,.494);
   vec4 facade=texture2DGradEXT(map,coord,dFdx(harbourUv)*vec2(.247,.494),dFdy(harbourUv)*vec2(.247,.494));
   float glass=smoothstep(.025,.07,facade.b-facade.r)*(1.-smoothstep(.18,.35,max(facade.r,max(facade.g,facade.b))))*step(.54,fract(harbourUv.y))*(1.-step(.93,fract(harbourUv.y)))*(1.-step(.5,harbourRoof));
   float occupied=step(.58,fract(sin(dot(floor(harbourUv*vec2(4.,2.))+harbourSeed*73.,vec2(12.9898,78.233)))*43758.5453));
   facade.rgb=mix(facade.rgb,vec3(.075,.085,.09),step(.5,harbourRoof));
   diffuseColor*=facade;diffuseColor.rgb*=mix(.8,1.,smoothstep(0.,1.8,harbourHeight));
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.83,.26,glass);');
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.72,.43)*glass*occupied*harbourNight*.065;');
 };
 material.customProgramCacheKey=()=>'harbour-facades-v141';material.needsUpdate=true;
}
