import * as T from 'three';

// A photographed 3 m surface with matching GL normals and roughness, not a
// colour photograph reused as a height field. UVs remain fixed to road metres.
export async function loadRoadSurface(road,loader,anisotropy){
 const [color,normal,roughness]=await Promise.all(['color','normal','roughness'].map(n=>loader.loadAsync('/arcade/art/nightshift/pbr/asphalt-'+n+'-v131.webp')));
 color.colorSpace=T.SRGBColorSpace;
 for(const t of [color,normal,roughness]){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(12.4/3,1/(.13*3));t.anisotropy=Math.min(8,anisotropy);}
 Object.assign(road,{map:color,normalMap:normal,roughnessMap:roughness,roughness:1,metalness:0,bumpMap:null});road.normalScale.set(.34,.34);
 const wetness=road.userData.wetness={value:0};
 road.onBeforeCompile=shader=>{
  shader.uniforms.roadWetness=wetness;
  shader.fragmentShader=`uniform float roadWetness;
   float roadHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float roadNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(roadHash(i),roadHash(i+vec2(1.,0.)),f.x),mix(roadHash(i+vec2(0.,1.)),roadHash(i+vec2(1.,1.)),f.x),f.y);}
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec2 roadMetres=vMapUv*3.;
   float roadPatch=roadNoise(roadMetres*.28);
   float roadWater=roadWetness*mix(.26,.95,smoothstep(.32,.75,roadPatch));
   float roadWear=.94+.06*sin(roadMetres.x*3.14159);
   diffuseColor.rgb*=roadWear*mix(1.,.52,roadWater);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=mix(clamp(roughnessFactor,.68,.98),.10,roadWater);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   normal=normalize(mix(normal,nonPerturbedNormal,roadWater*.78));
  `);
 };
 road.customProgramCacheKey=()=>'measured-asphalt-v95';road.needsUpdate=true;
 return {source:'Poly Haven Asphalt 02',sizes:[1024,512,512],metres:3,maps:3};
}
