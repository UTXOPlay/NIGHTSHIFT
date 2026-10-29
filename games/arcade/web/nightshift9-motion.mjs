import * as T from 'three';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function damp(value,target,rate,dt){return target+(value-target)*Math.exp(-rate*Math.max(0,dt));}
// Exact critically damped response: stable at 30/60/120 Hz, including a hitch.
export function spring(s,target,frequency,dt){const w=frequency,t=Math.max(0,dt),e=Math.exp(-w*t),d=s.value-target,k=s.velocity+w*d;s.value=target+(d+k*t)*e;s.velocity=(s.velocity-w*k*t)*e;return s.value;}
export function prepareRig(car){
 if(car.userData.rig||!car.userData.wheels?.length)return;
 const body=new T.Group();body.name='Sprung chassis';const wheels=car.userData.wheels;
 for(const child of [...car.children])if(!wheels.includes(child))body.add(child);car.add(body);
 const rig=car.userData.rig={body,roll:{value:0,velocity:0},pitch:{value:0,velocity:0},heave:{value:0,velocity:0},lastSpeed:null,brake:0,contacts:[],exhaust:[],wheels:wheels.map(w=>{w.geometry.computeBoundingBox();const b=w.geometry.boundingBox;return{mesh:w,rest:w.position.clone(),rotation:w.quaternion.clone(),radius:(b.max.y-b.min.y)*w.scale.y/2};})};
 rig.material=body.children.find(o=>o.isMesh&&o.material.userData.brake)?.material;
 rig.point=new T.Vector3();rig.local=new T.Vector3();rig.normal=new T.Vector3();rig.up=new T.Vector3();rig.q=new T.Quaternion();rig.spin=new T.Quaternion();rig.axis=new T.Vector3(1,0,0);rig.yaxis=new T.Vector3(0,1,0);rig.surface=new T.Vector3();rig.a=new T.Vector3();rig.b=new T.Vector3();
}
export function resetRig(car){const r=car.userData.rig;if(!r)return;for(const s of [r.roll,r.pitch,r.heave])s.value=s.velocity=0;r.lastSpeed=null;r.body.position.y=0;r.body.rotation.set(0,0,0);}
export function animateRig(car,g,dt,{reduced=false,active=true,distance=g.distance,steer=g.steer_v||0}={}){
 const r=car.userData.rig;if(!r)return;const speed=(g.speed||0)*.03,acc=r.lastSpeed===null?0:clamp((speed-r.lastSpeed)/Math.max(dt,.001),-16,12);r.lastSpeed=speed;
 r.brake=damp(r.brake,active&&(g.drifting||acc< -1.8)?1:0,14,dt);if(r.material)r.material.userData.brake.value=r.brake;
 const roll=active&&!reduced?clamp(steer*.00055+(g.side_v||0)*.000022,-.085,.085):0,pitch=active&&!reduced?clamp(acc*.0024,-.032,.045):0;
 r.body.rotation.set(spring(r.pitch,pitch,11,dt),0,spring(r.roll,roll,10,dt));r.body.position.y=spring(r.heave,active&&!reduced?-Math.abs(roll)*.12:0,13,dt);
 for(const w of r.wheels){w.mesh.position.copy(w.rest);w.mesh.quaternion.copy(w.rotation);if(w.rest.z<0){r.q.setFromAxisAngle(r.yaxis,active?clamp(-steer*.003,-.3,.3):0);w.mesh.quaternion.premultiply(r.q);}r.spin.setFromAxisAngle(r.axis,-distance*.1/Math.max(.1,w.radius));w.mesh.quaternion.multiply(r.spin);}
 const far=car.userData.far;if(far){const close=car.position.z> -85;r.body.visible=close;for(const w of r.wheels)w.mesh.visible=close;far.visible=!close;}
}
// Keep individual tires on the actual banked/graded course after body orientation.
// This changes presentation only; signed vehicle/contact rules are untouched.
export function groundRig(car,frame,{wreck=false}={}){
 const r=car.userData.rig;if(!r)return;r.contacts.length=0;r.exhaust.length=0;if(wreck)return;
 car.updateMatrixWorld(true);r.up.set(0,1,0).transformDirection(car.matrixWorld);
 for(const w of r.wheels){
  w.mesh.getWorldPosition(r.point);frame.unproject(r.point,r.local);const z=r.local.z,x=r.local.x,p=frame.pose(z,x);r.surface.set(p.x,p.y,p.z);
  const a=frame.pose(z-.1,x);r.a.set(a.x,a.y,a.z);const b=frame.pose(z+.1,x);r.b.set(b.x,b.y,b.z).sub(r.a);const c=frame.pose(z,x+.1);r.a.set(c.x,c.y,c.z).sub(r.surface);r.normal.crossVectors(r.b,r.a).normalize();if(r.normal.y<0)r.normal.negate();
  const pos=w.mesh.geometry.attributes.position,e=w.mesh.matrixWorld.elements;let clearance=Infinity;
  for(let n=0;n<pos.count;n++){const vx=pos.getX(n),vy=pos.getY(n),vz=pos.getZ(n);r.point.set(e[0]*vx+e[4]*vy+e[8]*vz+e[12],e[1]*vx+e[5]*vy+e[9]*vz+e[13],e[2]*vx+e[6]*vy+e[10]*vz+e[14]);clearance=Math.min(clearance,r.point.sub(r.surface).dot(r.normal));}
  w.mesh.position.y-=clearance/Math.max(.2,r.up.dot(r.normal));w.mesh.updateMatrixWorld(true);r.contacts.push({x,z,y:.018,rear:w.rest.z>0,at:frame.distance-z*10});
 }
 const rear=Math.max(...r.wheels.map(w=>w.rest.z))+.5;for(const side of [-1,1]){r.point.set(side*.58,.31,rear).applyMatrix4(car.matrixWorld);frame.unproject(r.point,r.local);r.exhaust.push({x:r.local.x,y:r.local.y,z:r.local.z});}
}
export class ChaseCamera{
 constructor(){this.x={value:0,velocity:0};this.y={value:3.15,velocity:0};this.z={value:8.2,velocity:0};this.look=new T.Vector3();this.previousView=null;this.transition=1;this.fromPosition=new T.Vector3();this.fromRotation=new T.Quaternion();this.fromFov=58;this.hitX=0;this.hitZ=0;this.hitAge=10;this.lastSpeed=0;}
 impact(g){this.hitX=clamp((g.impact_nx||0)*.25,-.3,.3);this.hitZ=clamp((g.impact_nz||-1)*.18,-.25,.25);this.hitAge=0;}
 draw(camera,frame,g,x,dt,{reduced,preview,map,running,ending=false,countdown=0,previewYaw=0}){
  const view=preview?'garage':map?'map':'race';if(this.previousView!==view){this.fromPosition.copy(camera.position);this.fromRotation.copy(camera.quaternion);this.fromFov=camera.fov;this.transition=0;this.previousView=view;}this.transition=Math.min(1,this.transition+dt/(reduced?.001:.5));
  const speed=clamp((g.speed||0)/2400,0,1.3),acc=clamp(((g.speed||0)-this.lastSpeed)/Math.max(dt,.001),-800,800);this.lastSpeed=g.speed||0;this.hitAge+=dt;const hit=reduced?0:Math.exp(-this.hitAge*12)*Math.sin(this.hitAge*34);
  if(preview){camera.position.set(-5,2.5,-6.1);camera.lookAt(1.6,.3,0);camera.fov=51;}
  else if(map){camera.position.set(-3.8,6.4,16);camera.lookAt(1.5,2,-36);camera.fov=62;}
  else{
   const boost=g.ability_ticks>0&&!g.stun,launch=countdown>0?countdown/1800:0;
   camera.position.set(spring(this.x,x*.55-(reduced?0:(g.side_v||0)*.00013),7,dt)+hit*this.hitX,spring(this.y,reduced?3.2:3.0-speed*.28+(boost?-.1:0)+launch*.65,8,dt)+(reduced?0:-acc*.00008),spring(this.z,8.4+(boost?.45:0)+launch*1.8,7,dt)+hit*this.hitZ);
   const ahead=frame.pose(-14-speed*11,x*.45,.85);this.look.set(ahead.x,ahead.y,ahead.z);camera.lookAt(this.look);camera.fov=damp(camera.fov,reduced?58:55+speed*7+(boost?5:0),5,dt);if(!reduced)camera.rotateZ(clamp(-(g.side_v||0)*.000009,-.012,.012));
  }
  if(this.transition<1){const t=this.transition*this.transition*(3-2*this.transition);camera.position.lerp(this.fromPosition,1-t);camera.quaternion.slerp(this.fromRotation,1-t);camera.fov=this.fromFov+(camera.fov-this.fromFov)*t;}
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
 }
}
