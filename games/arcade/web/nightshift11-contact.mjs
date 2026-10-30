// Integer road-space rigid-body contacts. Distances are millimetres and the
// fixed step is 1/30 s. Mirrored in the profile-bound native game.rs.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),trunc=x=>Math.trunc(x)||0,S=65536;
export const VEHICLE_MASS=[1450,1180,1840,1320,1610,1740];
export function sweepContact(x0,z0,x1,z1,hx,hz){
 const dx=x1-x0,dz=z1-z0;let enter=0,exit=S,axis=0,normal=0;
 for(const [start,delta,half,a]of [[x0,dx,hx,1],[z0,dz,hz,2]]){
  if(!delta){if(Math.abs(start)>half)return null;continue;}
  const near=delta>0?-half:half,far=-near;
  const aTime=Math.ceil((near-start)*S/delta),bTime=Math.floor((far-start)*S/delta);
  if(aTime>enter){enter=aTime;axis=a;normal=Math.sign(delta);}exit=Math.min(exit,bTime);
  if(enter>exit)return null;
 }
 if(exit<0||enter>S)return null;
 if(!axis){axis=hx-Math.abs(x0)<hz-Math.abs(z0)?1:2;const start=axis===1?x0:z0,delta=axis===1?dx:dz;normal=start?-Math.sign(start):Math.sign(delta)||-1;}
 return{nx:axis===1?normal:0,nz:axis===2?normal:0,time:Math.max(0,enter),depth:Math.max(0,(axis===1?x1:z1)*normal+(axis===1?hx:hz)+3)};
}
export function contactImpulse(nx,nz,vx,vz,playerMass,otherMass,staticBody=false){
 const closing=Math.max(0,-nx*vx-nz*vz),share=staticBody?1000:Math.floor(otherMass*1000/(playerMass+otherMass));
 const normal=trunc(closing*112*share/100000),tangent=nx?vz:vx;
 const friction=Math.min(Math.abs(trunc(tangent*share/1000)),Math.floor(normal*(staticBody?28:18)/100));
 return{closing,share,normal,tx:nz?-Math.sign(tangent)*friction:0,tz:nx?-Math.sign(tangent)*friction:0};
}
export function resolveRail(g,emit,crash){
 if(g.drift_x>=-650&&g.drift_x<=2650)return;
 const nx=g.drift_x< -650?1:-1,vx=g.lateral_v*4+g.side_v+trunc(g.yaw*g.speed/1000);
 const impulse=contactImpulse(nx,0,vx,g.speed,VEHICLE_MASS[g.vehicle],0,true);
 g.drift_x=clamp(g.drift_x,-650,2650);g.side_v=clamp(g.side_v+nx*impulse.normal,-1200,1200);g.speed=clamp(g.speed+impulse.tz,-350,2500);
 if(impulse.closing&&!g.rail_cd){g.rail_cd=20;g.impact_nx=nx;g.impact_nz=0;g.impact_force=impulse.closing;g.impact_x=-nx*1050;g.impact_z=0;g.contact_seq++;if(impulse.closing>=700)crash();else emit('scrape',-1);}
}
export function resolveContacts(g,before,emit,crash){
 const mass=VEHICLE_MASS[g.vehicle],contacts=[];
 for(let n=0;n<g.rivals.length;n++){const r=g.rivals[n];if(!r.finish)contacts.push({body:r,old:before.rivals[n],rival:n,staticBody:false,mass:VEHICLE_MASS[(n+1)%6]});}
 for(const b of g.bodies)if(b.tag===1||b.tag===8)contacts.push({body:b,old:before.bodies.get(b),rival:-1,staticBody:b.tag===8,mass:1700});
 for(const entry of contacts){
  const b=entry.body,rival=entry.rival>=0,old=entry.old;const bx=b.x,bd=rival?b.distance:g.distance+830-b.y;
  const ox=old?.x??bx,od=old?.distance??bd,halfX=entry.staticBody?2860:2080,halfZ=entry.staticBody?2520:4280;
  const hit=sweepContact((ox-before.x)*4,(od-before.distance)*100,(bx-g.drift_x)*4,(bd-g.distance)*100,halfX,halfZ);if(!hit)continue;
  const playerVx=g.lateral_v*4+g.side_v+trunc(g.yaw*g.speed/1000),otherVx=rival?trunc((b.x-ox)*4):b.vx*4,otherVz=entry.staticBody?0:rival?b.speed:b.vy*100;
  const impulse=contactImpulse(hit.nx,hit.nz,playerVx-otherVx,g.speed-otherVz,mass,entry.mass,entry.staticBody);
  const move=trunc(hit.depth*impulse.share/1000),otherMove=hit.depth-move;
  g.drift_x=clamp(g.drift_x+trunc(hit.nx*move/4),-650,2650);
  const dz=trunc(hit.nz*move/100);if(dz){g.distance=Math.max(0,g.distance+dz);for(const body of g.bodies)body.y+=dz;}
  if(!entry.staticBody){b.x-=trunc(hit.nx*otherMove/4);if(rival)b.distance-=trunc(hit.nz*otherMove/100);else b.y+=trunc(hit.nz*otherMove/100);}
  if(!impulse.normal)continue;
  const ix=hit.nx*impulse.normal+impulse.tx,iz=hit.nz*impulse.normal+impulse.tz;
  g.side_v=clamp(g.side_v+ix,-1200,1200);g.speed=clamp(g.speed+iz,-350,2500);
  const armX=clamp((bx-g.drift_x)*4,-1100,1100),armZ=clamp((bd-g.distance)*100,-2100,2100);
  g.yaw_v=clamp(g.yaw_v+trunc((hit.nz*armX-hit.nx*armZ)*impulse.normal/40000),-90,90);
  if(!entry.staticBody){const ratio=Math.floor(mass*1000/entry.mass);if(rival){b.side_v=clamp(b.side_v-trunc(ix*ratio/1000),-1000,1000);b.speed=clamp(b.speed-trunc(iz*ratio/1000),-350,2500);}else{b.vx=clamp(b.vx-trunc(ix*ratio/4000),-80,80);b.vy=clamp(b.vy-trunc(iz*ratio/100000),-3,25);}}
  if(b.contact_cd)continue;b.contact_cd=24;
  g.impact_nx=hit.nx;g.impact_nz=hit.nz;g.impact_force=impulse.closing;g.impact_x=armX;g.impact_z=armZ;g.contact_seq++;
  const hard=hit.nz<0&&impulse.closing>=(entry.staticBody?450:650)||Math.abs(hit.nx)>0&&impulse.closing>=700;
  if(hard){if(rival&&g.ability_ticks&&g.shield)emit('ram',entry.rival);crash();}else if(impulse.closing>25)emit('scrape',entry.rival);
 }
 if(g.drift_x< -650||g.drift_x>2650)g.drift_x=clamp(g.drift_x,-650,2650);
}
