import * as T from 'three';
import COURSES from './nightshift9-courses.json' with {type:'json'};
import {EVENTS,curvature} from './nightshift9-rules.mjs';
import {curvature as legacyCurve} from './nightshift8-rules.mjs';
import {courseTable,courseElevation} from './nightshift9-course-data.mjs';
export {courseTable,courseElevation} from './nightshift9-course-data.mjs';
const STEP=25,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class CircuitFrame {
 constructor(){this.origin={};this.point={};this.euler=new T.Euler(0,0,0,'YXZ');this.quaternion=new T.Quaternion();}
 set(mode,distance,legacy=false){this.mode=mode;this.distance=distance;this.legacy=legacy;this.table=courseTable(mode,legacy);this.sample(distance,this.origin);this.cos=Math.cos(this.origin.heading);this.sin=Math.sin(this.origin.heading);}
 sample(distance,out){
  const t=this.table;if(distance<0){out.x=0;out.y=0;out.z=-distance*.1;out.heading=0;return out;}
  const q=clamp(distance/STEP,0,t.count-.001),n=Math.floor(q),f=q-n;
  for(const k of ['x','y','z','heading'])out[k]=t[k][n]+(t[k][n+1]-t[k][n])*f;return out;
 }
 pose(z,x=0,y=0,out=this.point){
  this.sample(this.distance-z*10,out);const dx=out.x-this.origin.x,dz=out.z-this.origin.z,h=out.heading-this.origin.heading,bank=this.legacy?0:-curvature(Math.max(0,this.distance-z*10),this.mode)*COURSES[this.mode].bank*Math.PI/(12*180),s=Math.sin(h),c=Math.cos(h);
  out.x=this.cos*dx+this.sin*dz+c*x;out.z=-this.sin*dx+this.cos*dz+s*x;out.y=out.y-this.origin.y+y+Math.sin(bank)*x;out.heading=h;out.bank=bank;
  return out;
 }
 unproject(v,out=new T.Vector3()){
  let x=v.x,z=v.z;for(let n=0;n<4;n++){const p=this.pose(z,x),dx=v.x-p.x,dz=v.z-p.z,h=p.heading;x+=dx*Math.cos(h)+dz*Math.sin(h);z+=-dx*Math.sin(h)+dz*Math.cos(h);}const p=this.pose(z,x);return out.set(x,v.y-p.y,z);
 }
 originMatrix(matrix){matrix.makeRotationY(this.origin.heading);matrix.setPosition(-this.cos*this.origin.x-this.sin*this.origin.z,-this.origin.y,this.sin*this.origin.x-this.cos*this.origin.z);return matrix;}
 placeAbsolute(object,distance){const p=this.sample(distance,{});object.position.set(p.x,p.y,p.z);object.rotation.set(0,-p.heading,0);return object;}
 project(v){const p=this.pose(v.z,v.x,v.y);v.set(p.x,p.y,p.z);return v;}
 orient(object,z,{upright=false}={}){
  const p=this.pose(z),d=this.distance-z*10,grade=upright||this.legacy?0:Math.atan2(courseElevation(this.mode,d+25)-courseElevation(this.mode,d-25),5);
  this.euler.set(grade,-p.heading,upright?0:p.bank,'YXZ');this.quaternion.setFromEuler(this.euler);object.quaternion.premultiply(this.quaternion);
 }
 place(object,z,x=0,y=0,{upright=false}={}){object.position.set(x,y,z);this.project(object.position);object.rotation.set(0,0,0);this.orient(object,z,{upright});}
}
// Continuous strips share stations across the entire visible road. No gaps
// between rotated rectangular tiles on tight corners; all buffers are reused.
export class CircuitRoad {
 constructor(scene,materials){
  this.strips=[];this.stations=145;this.stationData=new Float64Array(this.stations*9);
  const add=(material,edges,{height=0,wall=false,dashes=false}={})=>{
   const count=this.stations,position=new Float32Array(count*6),normal=new Float32Array(count*6),uv=new Float32Array(count*4),index=[];
   for(let n=0;n<count-1;n++){const a=n*2;index.push(a,a+1,a+2,a+1,a+3,a+2);}
   if(wall&&edges[0]<0)for(let n=0;n<index.length;n+=3)[index[n+1],index[n+2]]=[index[n+2],index[n+1]];
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(position,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('normal',new T.BufferAttribute(normal,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('uv',new T.BufferAttribute(uv,2).setUsage(T.DynamicDrawUsage));geometry.setIndex(index);
   const mesh=new T.Mesh(geometry,material);mesh.matrixAutoUpdate=false;mesh.frustumCulled=false;mesh.receiveShadow=true;scene.add(mesh);this.strips.push({mesh,edges,height,wall,dashes});
  };
  add(materials.concrete,[-8.5,8.5],{height:-.14});add(materials.road,[-6.2,6.2]);
  for(const x of [-5.8,5.8])add(materials.white,[x-.055,x+.055],{height:.018});
  for(const x of [-2,2])add(materials.white,[x-.05,x+.05],{height:.02,dashes:true});
  const walls=this.wallMaterial=materials.concrete.clone();walls.side=T.DoubleSide;walls.color.multiplyScalar(.6);walls.roughness=.8;for(const x of [-8.1,8.1])add(walls,[x-.16,x+.16],{height:.02,wall:true});
  for(const x of [-8.12,8.12])add(materials.white,[x-.055,x+.055],{height:.98});
  this.vector=new T.Vector3();
 }
 draw(frame,visible=true){
  const key=frame.mode+':'+frame.legacy+':'+frame.distance+':'+visible;if(key===this.bufferKey)return;this.bufferKey=key;
  if(visible)for(let n=0;n<this.stations;n++){const z=30-n*3.5,p=frame.pose(z),at=n*9,h=p.heading,bank=p.bank,grade=frame.legacy?0:Math.atan2(courseElevation(frame.mode,frame.distance-z*10+25)-courseElevation(frame.mode,frame.distance-z*10-25),5),ch=Math.cos(h),sh=Math.sin(h),cb=Math.cos(bank),sb=Math.sin(bank),sg=Math.sin(grade),cg=Math.cos(grade),data=this.stationData;data[at]=p.x;data[at+1]=p.y;data[at+2]=p.z;data[at+3]=ch;data[at+4]=sh;data[at+5]=sb;data[at+6]=-sb*ch-cb*sg*sh;data[at+7]=cb*cg;data[at+8]=-sb*sh+cb*sg*ch;}
  for(const strip of this.strips){strip.mesh.visible=visible;if(!visible)continue;const geometry=strip.mesh.geometry,p=geometry.attributes.position,norm=geometry.attributes.normal,uv=geometry.attributes.uv;
   for(let n=0;n<this.stations;n++){const z=30-n*3.5,absolute=(frame.distance*.1-z),dash=strip.dashes&&((absolute%7+7)%7>3);
    for(let edge=0;edge<2;edge++){let x=strip.edges[edge],y=strip.height;if(strip.wall){x=(strip.edges[0]+strip.edges[1])/2;y=edge?1:.02;}if(dash)y=-.045;
     const station=n*9,data=this.stationData,at=n*2+edge;p.setXYZ(at,data[station]+data[station+3]*x,data[station+1]+y+data[station+5]*x,data[station+2]+data[station+4]*x);if(strip.wall)norm.setXYZ(at,-Math.sign(x)*data[station+3],0,-Math.sign(x)*data[station+4]);else norm.setXYZ(at,data[station+6],data[station+7],data[station+8]);uv.setXY(at,edge,absolute*.13);
    }
   }
   p.needsUpdate=norm.needsUpdate=uv.needsUpdate=true;
  }
 }
}
