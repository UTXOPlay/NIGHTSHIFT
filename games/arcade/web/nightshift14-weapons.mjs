const trunc=n=>Math.trunc(n)||0;
export function combatActor(g,id){return id===-1?{id:-1,x:g.drift_x,distance:g.distance,hp:g.hull,finish:g.over?1:0,recover:g.recover}:g.rivals.find(r=>r.id===id);}
// Beam occlusion is evaluated against the shared world, never the camera.
export function clearShot(g,source,target){
 const gap=target.distance-source.distance;if(!gap)return false;
 const between=d=>(d-source.distance)*Math.sign(gap)>20&&(target.distance-d)*Math.sign(gap)>20;
 const intersects=(x,d,width)=>between(d)&&Math.abs(x-source.x-trunc((target.x-source.x)*(d-source.distance)/gap))<width;
 for(const b of g.bodies)if((b.tag===1||b.tag===8)&&intersects(b.x,g.distance+830-b.y,b.tag===8?480:290))return false;
 for(const r of g.rivals)if(r.id!==source.id&&r.id!==target.id&&!r.finish&&intersects(r.x,r.distance,290))return false;
 if(source.id!==-1&&target.id!==-1&&intersects(g.drift_x,g.distance,290))return false;
 return true;
}
export function forwardShot(g,source,target,range=900){return !!target&&!target.staged&&!target.finish&&target.hp>0&&!target.recover&&target.distance-source.distance>30&&target.distance-source.distance<range&&Math.abs(target.x-source.x)<700&&clearShot(g,source,target);}
