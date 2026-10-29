import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Authored, shared geometry. Small fittings have a near-distance budget; main
// silhouettes remain present at every quality. All dimensions are scene metres.
const near=g=>(g.userData.detail=true,g);
function assembly(build){
 const parts=[],m=new T.Matrix4(),q=new T.Quaternion(),p=new T.Vector3(),s=new T.Vector3();
 const box=(x,y,z,w,h,d,rx=0,ry=0,rz=0)=>{const g=new T.BoxGeometry();p.set(x,y,z);s.set(w,h,d);q.setFromEuler(new T.Euler(rx,ry,rz));m.compose(p,q,s);g.applyMatrix4(m);parts.push(g);};
 const beam=(a,b,w=.15,d=w)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),g=new T.BoxGeometry(w,start.distanceTo(end),d);q.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());m.compose(start.add(new T.Vector3(...b)).multiplyScalar(.5),q,new T.Vector3(1,1,1));g.applyMatrix4(m);parts.push(g);};
 build(box,beam);const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());geometry.computeBoundingBox();return geometry;
}
function corrugated(segments){
 const positions=[],uvs=[];
 const quad=(a,b,c,d,uv=[[0,0],[1,0],[1,1],[0,1]])=>{for(const n of [0,1,2,0,2,3]){positions.push(...[a,b,c,d][n]);uvs.push(...uv[n]);}};
 for(const side of [-1,1])for(let k=0;k<segments;k++){
  const z0=k/segments-.5,z1=(k+1)/segments-.5,x0=side*(.5-(k%2)*.014),x1=side*(.5-((k+1)%2)*.014),v=[[x0,-.5,z0],[x0,.5,z0],[x1,.5,z1],[x1,-.5,z1]],uv=[[k/segments,0],[k/segments,1],[(k+1)/segments,1],[(k+1)/segments,0]];
  if(side<0){v.reverse();uv.reverse();}quad(...v,uv);
 }
 for(let k=0;k<12;k++){const x0=k/12-.5,x1=(k+1)/12-.5,y0=.5-(k%2)*.006,y1=.5-((k+1)%2)*.006;quad([x0,y0,-.5],[x0,y0,.5],[x1,y1,.5],[x1,y1,-.5]);}
 quad([-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]);
 quad([-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]);
 quad([.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.computeVertexNormals();g.computeBoundingBox();return g;
}
export const INDUSTRIAL={
 container20:corrugated(24),container40:corrugated(44),
 frame:near(assembly(box=>{
  for(const x of [-.5,.5])for(const z of [-.5,.5]){box(x,0,z,.035,1.02,.025);for(const y of [-.48,.48])box(x,y,z,.075,.08,.045);}
  for(const y of [-.48,.48])for(const x of [-.5,.5])box(x,y,0,.035,.035,1);
  for(const z of [-.51,.51]){for(const y of [-.48,.48])box(0,y,z,1,.035,.018);for(const x of [-.29,.29])box(x,0,z,.018,.87,.014);box(0,0,z,.012,.91,.012);}
 })),
 gantry:assembly((box,beam)=>{
  for(const z of [-4,4])for(const side of [-1,1]){beam([side*7,.3,z],[side*4.5,20,z],.48,.5);box(side*7,.35,z,2.4,.7,1.3);}
  for(const z of [-4,4]){beam([-5,15,z],[5,20,z],.2);beam([5,15,z],[-5,20,z],.2);beam([-7,2,z],[7,2,z],.27);}
  for(const x of [-4.5,4.5]){beam([x,20,-4],[x,20,4],.6);beam([x,9,-4],[x,14,4],.2);}
  for(const z of [-1.35,1.35]){
   beam([-12,20,z],[23,20,z],.22);beam([-12,22.3,z],[23,22.3,z],.2);
   for(let x=-12;x<22;x+=5){beam([x,20,z],[Math.min(x+5,23),22.3,z],.14);beam([x,22.3,z],[Math.min(x+5,23),20,z],.14);}
  }
  for(let x=-12;x<=23;x+=5)beam([x,20,-1.35],[x,20,1.35],.16);
  beam([0,20,0],[1,29,0],.35);beam([1,29,0],[22,22.3,0],.045);beam([1,29,0],[-11,22.3,0],.045);
  box(-9,21,0,3.2,1.7,3.1);box(-4.8,18,0,3,2.2,3);box(6,19.8,0,3,.35,2.5);
  for(const z of [-.8,.8])beam([6,19.6,z],[6,10,z],.045);
  box(6,9.8,0,6,.3,2.8);
 }),
 pier:assembly((box)=>{box(0,-.45,0,18,.8,15);for(const x of [-7,7])for(const z of [-5.5,5.5])box(x,-2.5,z,1.1,4.5,1.1);}),
 roof:assembly((box)=>{for(const side of [-1,1])box(side*.25,.13,0,.58,.015,1.06,0,0,-side*.48);box(0,.27,0,.035,.016,1.08);}),
 // Four repeated bays per floor, with projecting sills and a top cornice.
 floor:near(assembly(box=>{box(0,.45,.065,1,.045,.13);box(0,-.42,.065,1,.045,.13);for(let n=0;n<=4;n++)box(n/4-.5,0,.04,.012,.88,.08);for(let n=0;n<4;n++)box((n+.5)/4-.5,-.36,.11,.22,.06,.22);})),
 detailBox:near(new T.BoxGeometry()),
 stencil:near(new T.PlaneGeometry(1,1))
};

export function harbourDistrict(b,n,random){
 const colors=['#526c75','#a1694e','#697969','#a49b7c','#626871','#7f514a'];
 const add=(mat,x,y,z,w,h,d,geometry,color='#ffffff',ry=0)=>b(mat,x,y,z,w,h,d,0,ry,0,geometry,color);
 for(const side of [-1,1]){
  const zone=(n+(side>0?5:0))%8;
  if(zone<5){
   const columns=zone%2+1;
   for(let k=0;k<columns;k++){
    const height=1+(n+k+(side>0?1:0))%3,depth=(n+k)%3===0?12.2:6.05,x=side*(14+k*4.1),z=depth>8?0:(k%2?3.2:-3.2),color=colors[(n+k+(side>0?2:0))%colors.length];
    for(let level=0;level<height;level++){
     const y=1.3+level*2.62,geometry=depth>8?INDUSTRIAL.container40:INDUSTRIAL.container20;
     add('cargoPaint',x,y,z,2.45,2.6,depth,geometry,color);
     add('structure',x,y,z,2.45,2.6,depth,INDUSTRIAL.frame,color);
     if(level===0&&k===0)add('stencil',x-side*1.235,y+.15,z,.98,.32,1,INDUSTRIAL.stencil,'#d5ded4',-side*Math.PI/2);
    }
   }
  }else if(zone===5||zone===7){
   const x=side*(22+n%3*2),h=5.5+random(31)*2;
   b('warehouse',x,h/2,0,13,h,16);add('structure',x,h,0,13,4,16,INDUSTRIAL.roof,'#64767b');
   for(const z of [-5,0,5]){add('structure',x-side*6.65,h*.47,z,.23,h,.28,INDUSTRIAL.detailBox,'#8a9897');add('structure',x-side*7.3,2.2,z,1.2,.16,4,INDUSTRIAL.detailBox,'#52636b');}
   add('structure',x+side*2,h+.9,3,2.5,1.6,2.2,INDUSTRIAL.detailBox,'#718083');
  }else{
   for(const z of [-5,5]){b('structure',side*12,.65,z,.35,1.3,.35,0,0,0,undefined,'#a7a293');b('structure',side*19,.5,z,2,1,1,0,0,0,undefined,'#7d8b85');}
  }
 }
 if(n%8===0){const side=n%16?1:-1,x=side*36;add('structure',x,0,0,1,1,1,INDUSTRIAL.pier,'#7b898d');add('structure',x,0,0,1,1,1,INDUSTRIAL.gantry,n%16?'#7f806a':'#576e7a',side<0?Math.PI:0);add('glass',x-side*4.8,18.1,1.53,2.5,1.3,.035,INDUSTRIAL.detailBox,'#8dabb0');}
}

export function facadeRelief(b,face,side,x,z,width,height,depth){
 if(!['brick','residence','office','lab'].includes(face))return;
 const step=3,front=x-side*(width/2+.04);
 for(let y=1.5;y<Math.min(height,29);y+=step)b('structure',front,y,z,depth,2.85,.6,0,side>0?-Math.PI/2:Math.PI/2,0,INDUSTRIAL.floor,face==='brick'?'#665c50':face==='residence'?'#716d66':'#435763');
}

export function installCargoPaint(m){
 m.onBeforeCompile=s=>{s.vertexShader='varying vec2 cargoUv;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\ncargoUv=uv;');s.fragmentShader='varying vec2 cargoUv;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  float paintGrain=fract(sin(dot(floor(cargoUv*vec2(93.,41.)),vec2(12.9898,78.233)))*43758.5453);
  vec2 paintPixel=fwidth(cargoUv*vec2(93.,41.));paintGrain=mix(.5,paintGrain,1.-smoothstep(.12,.8,max(paintPixel.x,paintPixel.y)));
  float runoff=(1.-smoothstep(0.,.3,cargoUv.y))*(.09+.06*paintGrain);
  diffuseColor.rgb*=.87+.1*paintGrain-runoff;
 `);};m.customProgramCacheKey=()=>'cargo-paint-v96';m.needsUpdate=true;
}
