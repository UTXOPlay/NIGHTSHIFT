import * as T from 'three';
// Two authored albedo variants per family, one sampler and one instanced draw.
// Window light and glass response are separate from masonry colour.
export function circuitFacade(material,texture,family,width,height,night){
 const rows=[3,3,2,2,1,2,3,2][family],columns=family===6?3:4,lit=![4,7].includes(family),emission=family===2||family===3?.10:.07;
 material.map=texture;material.metalness=family===2?.12:.02;material.roughness=.82;
 material.onBeforeCompile=s=>{
  s.uniforms.facadeNight=night;
  s.vertexShader='varying vec2 facadeUv;varying float facadeSeed;varying float facadeRoof;varying float facadeHeight;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
   vec3 scale=vec3(1.);facadeSeed=.37;
   #ifdef USE_INSTANCING
    scale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));facadeSeed=fract(sin(dot(instanceMatrix[3].xz,vec2(.137,.073)))*43758.5453);
   #endif
   facadeRoof=abs(normal.y);facadeHeight=(position.y+.5)*scale.y;
   facadeUv=uv*vec2(abs(normal.x)>.5?scale.z:scale.x,abs(normal.y)>.5?scale.z:scale.y)/vec2(${width.toFixed(1)},${height.toFixed(1)});
  `);
  s.fragmentShader='uniform float facadeNight;varying vec2 facadeUv;varying float facadeSeed;varying float facadeRoof;varying float facadeHeight;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
   float tile=${(family*2).toFixed(1)}+floor(facadeSeed*2.);vec2 origin=vec2(mod(tile,4.),3.-floor(tile/4.))*.25;
   vec2 coord=origin+vec2(.0015)+fract(facadeUv)*.247;
   vec4 albedo=texture2DGradEXT(map,coord,dFdx(facadeUv)*.247,dFdy(facadeUv)*.247);
   vec2 cell=fract(facadeUv*vec2(${columns.toFixed(1)},${rows.toFixed(1)})),edge=fwidth(facadeUv*vec2(${columns.toFixed(1)},${rows.toFixed(1)}));
   vec2 inside=smoothstep(vec2(.18)-edge,vec2(.18)+edge,cell)*(1.-smoothstep(vec2(.82)-edge,vec2(.82)+edge,cell));
   float windowMask=inside.x*inside.y*(1.-step(.5,facadeRoof))*${lit?'1.':'0.'};
   float darkGlass=1.-smoothstep(.055,.18,max(albedo.r,max(albedo.g,albedo.b)));
   float room=fract(sin(dot(floor(facadeUv*vec2(${columns.toFixed(1)},${rows.toFixed(1)}))+facadeSeed*71.,vec2(12.9898,78.233)))*43758.5453);
   float occupied=smoothstep(.47,.55,room),tone=step(.77,room);
   albedo.rgb=mix(albedo.rgb,vec3(.07,.078,.085),step(.5,facadeRoof));
   diffuseColor*=albedo;diffuseColor.rgb*=mix(.78,1.,smoothstep(0.,2.5,facadeHeight));
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=mix(.84,.21,windowMask);roughnessFactor=mix(roughnessFactor,.9,step(.5,facadeRoof));
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   totalEmissiveRadiance+=mix(vec3(1.,.67,.36),vec3(.64,.82,1.),tone)*windowMask*darkGlass*(.28+min(.45,dot(albedo.rgb,vec3(.2126,.7152,.0722))*2.))*occupied*facadeNight*${emission.toFixed(2)};
  `);
 };
 material.customProgramCacheKey=()=>`facade-v131-${family}-${width}-${height}`;material.needsUpdate=true;
}
export function structureSurface(material,texture,tile=0){
 material.map=texture;material.onBeforeCompile=s=>{
  s.vertexShader='varying vec2 structureUv;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
   vec3 scale=vec3(1.);
   #ifdef USE_INSTANCING
    scale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
   #endif
   vec3 p=position*scale;structureUv=abs(normal.y)>.5?p.xz:abs(normal.x)>.5?p.zy:p.xy;
  `);
  s.fragmentShader='varying vec2 structureUv;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`diffuseColor*=texture2DGradEXT(map,vec2(${tile%2?.503:.003},${tile<2?.503:.003})+fract(structureUv/3.)*.494,dFdx(structureUv/3.)*.494,dFdy(structureUv/3.)*.494);`);
 };material.customProgramCacheKey=()=>`structure-v131-${tile}`;material.needsUpdate=true;
}
