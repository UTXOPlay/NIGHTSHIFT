import * as T from 'three';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wheelVertices=new WeakMap();
function contactVertices(geometry){
 let points=wheelVertices.get(geometry);if(points)return points;
 const p=geometry.attributes.position,seen=new Set(),values=[];
 for(let n=0;n<p.count;n++){const x=p.getX(n),y=p.getY(n),z=p.getZ(n),key=x+','+y+','+z;if(!seen.has(key)){seen.add(key);values.push(x,y,z);}}
 points=new Float32Array(values);wheelVertices.set(geometry,points);return points;
}
export function damp(value,target,rate,dt){return target+(value-target)*Math.exp(-rate*Math.max(0,dt));}
// Exact critically damped response: stable at 30/60/120 Hz, including a hitch.
export function spring(s,target,frequency,dt){const w=frequency,t=Math.max(0,dt),e=Math.exp(-w*t),d=s.value-target,k=s.velocity+w*d;s.value=target+(d+k*t)*e;s.velocity=(s.velocity-w*k*t)*e;return s.value;}
export function prepareRig(car){
 if(car.userData.rig||!car.userData.wheels?.length)return;
 const body=new T.Group();body.name='Sprung chassis';const wheels=car.userData.wheels;
 for(const child of [...car.children])if(!wheels.includes(child))body.add(child);car.add(body);
 const rig=car.userData.rig={body,roll:{value:0,velocity:0},pitch:{value:0,velocity:0},heave:{value:0,velocity:0},lastSpeed:null,brake:0,contacts:[],exhaust:[],wheels:wheels.map(w=>{w.geometry.computeBoundingBox();const b=w.geometry.boundingBox;return{mesh:w,rest:w.position.clone(),rotation:w.quaternion.clone(),radius:(b.max.y-b.min.y)*w.scale.y/2,points:contactVertices(w.geometry)};})};
 rig.material=body.children.find(o=>o.isMesh&&o.material?.userData?.brake)?.material;
 rig.point=new T.Vector3();rig.local=new T.Vector3();rig.normal=new T.Vector3();rig.up=new T.Vector3();rig.q=new T.Quaternion();rig.spin=new T.Quaternion();rig.axis=new T.Vector3(1,0,0);rig.yaxis=new T.Vector3(0,1,0);rig.surface=new T.Vector3();rig.a=new T.Vector3();rig.b=new T.Vector3();
}
function surfaceMotion(model,brake,distance,steer){
 if(!model)return;const material=model.userData.brakeMaterial||model.userData.rig?.material;
 if(material)material.userData.brake.value=brake;
 model.userData.wheelMotion?.value.set(distance,steer);
 for(const m of model.userData.brakeMaterials||[])m.emissiveIntensity=.7+brake*3;
}
export function resetRig(car){
 const r=car.userData.rig,state=r||car.userData.motionState;if(state){state.lastSpeed=null;state.brake=0;}
 surfaceMotion(car,0,0,0);surfaceMotion(car.userData.far,0,0,0);
 if(!r)return;for(const s of [r.roll,r.pitch,r.heave])s.value=s.velocity=0;r.body.position.y=0;r.body.rotation.set(0,0,0);
}
export function animateRig(car,g,dt,{reduced=false,active=true,distance=g.distance,steer=g.steer_v||0}={}){
 const r=car.userData.rig,state=r||(car.userData.motionState??={lastSpeed:null,brake:0}),speed=(g.speed||0)*.03,acc=state.lastSpeed===null?0:clamp((speed-state.lastSpeed)/Math.max(dt,.001),-16,12);state.lastSpeed=speed;
 state.brake=damp(state.brake,active&&((g.brake||0)>0||g.drifting||acc< -1.8)?1:0,14,dt);
 const travel=(distance||0)*.1,turn=active?clamp(-steer*.003,-.3,.3):0;
 surfaceMotion(car,state.brake,travel,turn);surfaceMotion(car.userData.far,state.brake,travel,turn);
 if(!r)return;
 const roll=active&&!reduced?clamp(steer*.00055+(g.side_v||0)*.000022,-.085,.085):0,pitch=active&&!reduced?clamp(acc*.0024,-.032,.045):0;
 r.body.rotation.set(spring(r.pitch,pitch,11,dt),0,spring(r.roll,roll,10,dt));r.body.position.y=spring(r.heave,active&&!reduced?-Math.abs(roll)*.12:0,13,dt);
 for(const w of r.wheels){w.mesh.position.copy(w.rest);w.mesh.quaternion.copy(w.rotation);if(w.rest.z<0){r.q.setFromAxisAngle(r.yaxis,active?clamp(-steer*.003,-.3,.3):0);w.mesh.quaternion.premultiply(r.q);}r.spin.setFromAxisAngle(r.axis,-distance*.1/Math.max(.1,w.radius));w.mesh.quaternion.multiply(r.spin);}
 const far=car.userData.far;if(far){const close=!car.userData.forceLow&&car.position.z> -85;r.body.visible=close;for(const w of r.wheels)w.mesh.visible=close;far.visible=!close;}
}
// Keep individual tires on the actual banked/graded course after body orientation.
// This changes presentation only; signed vehicle/contact rules are untouched.
export function groundRig(car,frame,{wreck=false}={}){
 const r=car.userData.rig;if(!r)return;r.contacts.length=0;r.exhaust.length=0;if(wreck)return;
 car.updateMatrixWorld(true);r.up.set(0,1,0).transformDirection(car.matrixWorld);
 for(const w of r.wheels){
  w.mesh.getWorldPosition(r.point);frame.unproject(r.point,r.local);const z=r.local.z,x=r.local.x,p=frame.pose(z,x);r.surface.set(p.x,p.y,p.z);
  const a=frame.pose(z-.1,x);r.a.set(a.x,a.y,a.z);const b=frame.pose(z+.1,x);r.b.set(b.x,b.y,b.z).sub(r.a);const c=frame.pose(z,x+.1);r.a.set(c.x,c.y,c.z).sub(r.surface);r.normal.crossVectors(r.b,r.a).normalize();if(r.normal.y<0)r.normal.negate();
  const points=w.points,e=w.mesh.matrixWorld.elements,nx=r.normal.x,ny=r.normal.y,nz=r.normal.z;
  const ax=e[0]*nx+e[1]*ny+e[2]*nz,ay=e[4]*nx+e[5]*ny+e[6]*nz,az=e[8]*nx+e[9]*ny+e[10]*nz,offset=(e[12]-r.surface.x)*nx+(e[13]-r.surface.y)*ny+(e[14]-r.surface.z)*nz;let clearance=Infinity;
  for(let n=0;n<points.length;n+=3)clearance=Math.min(clearance,ax*points[n]+ay*points[n+1]+az*points[n+2]+offset);
  w.mesh.position.y-=clearance/Math.max(.2,r.up.dot(r.normal));w.mesh.updateMatrixWorld(true);r.contacts.push({x,z,y:.018,rear:w.rest.z>0,at:frame.distance-z*10});
 }
 const rear=Math.max(...r.wheels.map(w=>w.rest.z))+.5;for(const side of [-1,1]){r.point.set(side*.58,.31,rear).applyMatrix4(car.matrixWorld);frame.unproject(r.point,r.local);r.exhaust.push({x:r.local.x,y:r.local.y,z:r.local.z});}
}
export class ChaseCamera{
 constructor(){
  this.x={value:0,velocity:0};this.y={value:3.5,velocity:0};this.z={value:10.2,velocity:0};
  this.aimX={value:0,velocity:0};this.aimY={value:1,velocity:0};this.aimZ={value:-32,velocity:0};
  this.kickX={value:0,velocity:0};this.kickZ={value:0,velocity:0};
  this.look=new T.Vector3();this.eye=new T.Vector3();this.near=new T.Vector3();this.far=new T.Vector3();this.target=new T.Vector3();
  this.previousView=null;this.transition=1;this.fromPosition=new T.Vector3();this.fromRotation=new T.Quaternion();this.fromFov=58;
  this.speed=0;this.boost=0;this.fov=58;this.hitAge=10;this.race=null;this.distance=null;
 }
 impact(g){
  // Repeated scrape events must not restart an oscillating screen shake.
  if(this.hitAge<.09)return;
  const force=clamp((g.impact_force||400)/1800,.12,1);
  this.kickX.velocity=clamp(this.kickX.velocity+(g.impact_nx||0)*force*.75,-.9,.9);
  this.kickZ.velocity=clamp(this.kickZ.velocity+(g.impact_nz||0)*force*.5,-.65,.65);this.hitAge=0;
 }
 resetTargets(){
  for(const [state,target]of [[this.x,this.eye.x],[this.y,this.eye.y],[this.z,this.eye.z],[this.aimX,this.target.x],[this.aimY,this.target.y],[this.aimZ,this.target.z]]){state.value=target;state.velocity=0;}
  for(const state of [this.kickX,this.kickZ])state.value=state.velocity=0;
 }
 draw(camera,frame,g,x,dt,{reduced,preview,map,running,ending=false,countdown=0,previewYaw=0}){
  dt=clamp(Number.isFinite(dt)?dt:0,0,.1);
  const view=preview?'garage':map?'map':'race',changed=this.previousView!==view;
  if(changed){this.fromPosition.copy(camera.position);this.fromRotation.copy(camera.quaternion);this.fromFov=camera.fov;this.transition=0;this.previousView=view;}
  this.transition=reduced?1:Math.min(1,this.transition+dt/.45);this.hitAge+=dt;camera.up.set(0,1,0);
  if(preview){camera.position.set(-5,2.5,-6.1);camera.lookAt(1.6,.3,0);camera.fov=51;}
  else if(map){camera.position.set(-3.8,6.4,16);camera.lookAt(1.5,2,-36);camera.fov=62;}
  else{
   const race=(g.race_id??0)+':'+(g.mode??frame.mode??0),jump=this.distance!==null&&Math.abs(frame.distance-this.distance)>2500,reset=changed||race!==this.race||jump;
   const speed=clamp((g.speed||0)/2400,0,1.1),boost=g.ability_ticks>0&&!g.stun?1:0;
   this.speed=reset?speed:damp(this.speed,speed,5,dt);this.boost=reset?boost:damp(this.boost,boost,4,dt);
   const launch=reduced?0:clamp(countdown/1800,0,1),behind=10.2+(reduced?0:this.speed*.5+this.boost*.45+launch),height=reduced?3.55:3.25+this.speed*.45+launch*.35;
   let p=frame.pose(behind,clamp(x*.86,-5.8,5.8),height);this.eye.set(p.x,p.y,p.z);
   const ahead=reduced?31:25+this.speed*17;
   p=frame.pose(-ahead,x*.55,.95);this.near.set(p.x,p.y,p.z);
   p=frame.pose(-ahead-22,x*.35,1.1);this.far.set(p.x,p.y,p.z);
   this.target.copy(this.near).lerp(this.far,reduced?.12:.25);
   // Anticipate the road without swinging the car toward an edge of the image.
   const depth=Math.max(15,this.eye.z-this.target.z),yaw=Math.min(reduced?.15:.24,.24*camera.aspect*camera.aspect);
   this.target.x=clamp(this.target.x,this.eye.x-depth*yaw,this.eye.x+depth*yaw);
   // Lift over a crest when the road would otherwise hide the next braking zone.
   let lift=0;
   for(const z of [-7,-16,-26]){
    p=frame.pose(z,0,.55);const t=clamp((this.eye.z-p.z)/Math.max(1,this.eye.z-this.target.z),0,.9),line=this.eye.y+(this.target.y-this.eye.y)*t;
    lift=Math.max(lift,(p.y-line)/Math.max(.2,1-t));
   }
   this.eye.y+=clamp(lift,0,1.25);
   const targetFov=reduced?59:57.5+this.speed*4.5+this.boost*1.8;
   if(reset){this.resetTargets();this.fov=targetFov;}
   if(reduced)for(const s of [this.kickX,this.kickZ])s.value=s.velocity=0;
   const kickX=reduced?0:clamp(spring(this.kickX,0,14,dt),-.13,.13),kickZ=reduced?0:clamp(spring(this.kickZ,0,14,dt),-.09,.09);
   camera.position.set(spring(this.x,this.eye.x,10,dt)+kickX,spring(this.y,this.eye.y,8,dt),spring(this.z,this.eye.z,9,dt)+kickZ);
   this.look.set(spring(this.aimX,this.target.x,reduced?5:7,dt),spring(this.aimY,this.target.y,6,dt),spring(this.aimZ,this.target.z,7,dt));
   camera.lookAt(this.look);this.fov=reduced?59:damp(this.fov,targetFov,4,dt);camera.fov=this.fov;
   this.race=race;this.distance=frame.distance;
  }
  if(this.transition<1){const t=this.transition*this.transition*(3-2*this.transition);camera.position.lerp(this.fromPosition,1-t);camera.quaternion.slerp(this.fromRotation,1-t);camera.fov=this.fromFov+(camera.fov-this.fromFov)*t;}
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
 }
}
