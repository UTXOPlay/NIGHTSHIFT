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
  this.strips=[];this.stations=145;
  const add=(material,edges,{height=0,wall=false,dashes=false}={})=>{
   const count=this.stations,position=new Float32Array(count*6),normal=new Float32Array(count*6),uv=new Float32Array(count*4),index=[];
   for(let n=0;n<count-1;n++){const a=n*2;index.push(a,a+1,a+2,a+1,a+3,a+2);}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(position,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('normal',new T.BufferAttribute(normal,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('uv',new T.BufferAttribute(uv,2).setUsage(T.DynamicDrawUsage));geometry.setIndex(index);
   const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;mesh.receiveShadow=true;scene.add(mesh);this.strips.push({mesh,edges,height,wall,dashes});
  };
  add(materials.concrete,[-8.5,8.5],{height:-.14});add(materials.road,[-6.2,6.2]);
  for(const x of [-5.8,5.8])add(materials.white,[x-.055,x+.055],{height:.018});
  for(const x of [-2,2])add(materials.white,[x-.05,x+.05],{height:.02,dashes:true});
  const walls=materials.concrete.clone();walls.side=T.DoubleSide;walls.color.multiplyScalar(.6);walls.roughness=.8;for(const x of [-8.1,8.1])add(walls,[x-.16,x+.16],{height:.02,wall:true});
  for(const x of [-8.12,8.12])add(materials.white,[x-.055,x+.055],{height:.98});
  this.vector=new T.Vector3();
 }
 draw(frame,visible=true){
  for(const strip of this.strips){strip.mesh.visible=visible;if(!visible)continue;const geometry=strip.mesh.geometry,p=geometry.attributes.position,norm=geometry.attributes.normal,uv=geometry.attributes.uv;
   for(let n=0;n<this.stations;n++){const z=30-n*3.5,absolute=(frame.distance*.1-z),dash=strip.dashes&&((absolute%7+7)%7>3),bank=frame.pose(z).bank;
    for(let edge=0;edge<2;edge++){let x=strip.edges[edge],y=strip.height;if(strip.wall){x=(strip.edges[0]+strip.edges[1])/2;y=edge?1:.02;}if(dash)y=-.045;
     this.vector.set(x,y,z);frame.project(this.vector);const at=n*2+edge;p.setXYZ(at,this.vector.x,this.vector.y,this.vector.z);norm.setXYZ(at,Math.sin(-bank),Math.cos(bank),0);uv.setXY(at,edge,absolute*.13);
    }
   }
   p.needsUpdate=norm.needsUpdate=uv.needsUpdate=true;
  }
 }
}
