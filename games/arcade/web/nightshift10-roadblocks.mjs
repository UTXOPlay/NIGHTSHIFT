import {sweepContact,contactImpulse,VEHICLE_MASS} from './nightshift9-contact.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),trunc=v=>Math.trunc(v)||0;

export function guideTraffic(g,car){
 const ahead=g.bodies.filter(b=>b.tag===8&&car.y-b.y> -300&&car.y-b.y<1800).sort((a,b)=>b.y-a.y);
 if(!ahead.length)return;
 const nearest=ahead[0],row=ahead.filter(b=>Math.abs(b.y-nearest.y)<16);
 const lanes=[0,1000,2000].filter(x=>row.every(b=>Math.abs(b.x-x)>=790)).sort((a,b)=>Math.abs(a-car.x)-Math.abs(b-car.x)||a-b);
 if(!lanes.length){car.vy=Math.min(car.vy,Math.max(0,trunc((car.y-nearest.y-35)/60)));return;}
 const target=lanes[0],d=car.y-nearest.y;
 car.vx=d< -40?0:clamp(target-car.x,-12,12);
 if(d>0&&d<600&&Math.abs(target-car.x)>200)car.vy=Math.min(car.vy,Math.max(0,trunc((d-35)/60)));
 else if(car.vy<6)car.vy++;
}

// Road-space millimetre envelope matches player/static contacts exactly.
// Always resolve penetration, even while the actor is recovering or on cooldown.
export function resolveObstacleActors(g,before,damage){
 const barriers=g.bodies.filter(b=>b.tag===8);
 if(!barriers.length)return;
 for(let n=0;n<g.rivals.length;n++){
  const r=g.rivals[n];if(r.finish)continue;
  const old=before.rivals[n]||r;
  for(const b of barriers){
   const distance=g.distance+830-b.y;
   const hit=sweepContact((b.x-old.x)*4,(distance-old.distance)*100,(b.x-r.x)*4,(distance-r.distance)*100,2860,2520);
   if(!hit)continue;
   const vx=trunc((r.x-old.x)*4)+r.side_v;
   const impulse=contactImpulse(hit.nx,hit.nz,vx,r.speed,VEHICLE_MASS[(n+1)%6],0,true);
   r.x=clamp(r.x+trunc(hit.nx*hit.depth/4),-650,2650);
   r.distance=Math.max(0,r.distance+trunc(hit.nz*hit.depth/100));
   r.side_v=clamp(r.side_v+hit.nx*impulse.normal+impulse.tx,-1000,1000);
   r.speed=clamp(r.speed+hit.nz*impulse.normal+impulse.tz,-350,2500);
   if(impulse.closing>=450&&!r.contact_cd){r.contact_cd=24;damage(n);}
  }
 }
 for(const car of g.bodies){
  if(car.tag!==1)continue;
  const old=before.bodies.get(car),oldDistance=old?.distance??g.distance+830-car.y,oldX=old?.x??car.x;
  for(const b of barriers){
   const distance=g.distance+830-b.y,at=g.distance+830-car.y;
   const hit=sweepContact((b.x-oldX)*4,(distance-oldDistance)*100,(b.x-car.x)*4,(distance-at)*100,2860,2520);
   if(!hit)continue;
   const impulse=contactImpulse(hit.nx,hit.nz,car.vx*4,car.vy*100,1700,0,true);
   car.x=clamp(car.x+trunc(hit.nx*hit.depth/4),-650,2650);
   car.y-=trunc(hit.nz*hit.depth/100);
   car.vx=clamp(car.vx+trunc((hit.nx*impulse.normal+impulse.tx)/4),-80,80);
   car.vy=clamp(car.vy+trunc((hit.nz*impulse.normal+impulse.tz)/100),-3,25);
   car.contact_cd=Math.max(car.contact_cd,24);
  }
 }
}
