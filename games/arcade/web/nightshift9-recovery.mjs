// Read-only guidance. These extents include the vehicle; a painted lane is
// never advertised as an opening if its collision envelope does not fit.
export function roadblockOpening(g){
 const blocks=g.bodies.filter(b=>b.tag===8&&b.y> -5200&&b.y<875);if(!blocks.length)return null;
 const nearest=blocks.reduce((a,b)=>a.y>b.y?a:b),row=blocks.filter(b=>Math.abs(b.y-nearest.y)<16).sort((a,b)=>a.x-b.x);
 let intervals=[[-625,2625]];
 for(const b of row){const lo=b.x-740,hi=b.x+740,next=[];for(const [a,c]of intervals){if(hi<=a||lo>=c)next.push([a,c]);else{if(lo>a)next.push([a,lo]);if(hi<c)next.push([hi,c]);}}intervals=next;}
 const lanes=intervals.filter(([a,b])=>b-a>100).map(([a,b])=>({x:(a+b)/2,width:b-a})).sort((a,b)=>Math.abs(a.x-g.drift_x)-Math.abs(b.x-g.drift_x));
 return lanes.length?{id:nearest.id??Math.round((g.distance||0)+830-nearest.y)+':'+Math.round(nearest.x),x:lanes[0].x,z:(nearest.y-830)*.1,width:lanes[0].width}:null;
}

export function roadblockThreat(g){
 if(g.over)return null;
 const blocks=g.bodies.filter(b=>b.tag===8&&b.y> -5200&&b.y<875);
 if(!blocks.length)return null;
 const b=blocks.reduce((a,b)=>a.y>b.y?a:b),row=blocks.filter(o=>Math.abs(o.y-b.y)<16),opening=roadblockOpening(g);
 const distance=(830-b.y)*.1,speed=Math.max(0,g.speed)*.03,eta=distance/Math.max(3,speed);
 const aligned=opening&&Math.abs(opening.x-g.drift_x)<opening.width/2-28;
 const occupied=!!opening&&(g.bodies.some(o=>o.tag===1&&Math.abs(o.y-b.y)<160&&Math.abs(o.x-opening.x)<520)||g.rivals.some(r=>!r.finish&&Math.abs(r.distance-(g.distance+830-b.y))<160&&Math.abs(r.x-opening.x)<520));
 if(distance< -3)return null;
 const stopped=distance>0&&distance<9&&Math.abs(g.speed)<220&&!aligned;
 const phase=!opening?'blocked':stopped?'reverse':(!aligned||occupied)&&eta<2.8?'brake':occupied?'queue':'route';
 return{id:opening?.id??b.id,z:(b.y-830)*.1,distance,eta,opening,aligned:!!aligned,occupied,phase,lanes:[0,1000,2000].map(x=>row.every(o=>Math.abs(o.x-x)>=740)),absolute:g.distance+830-b.y};
}

// The first pull must be straight down. Once reverse engages, steering must
// not release it; the previous touch input made backing around a block fail.
export function joystickDrive({x,y,speed,steer,turn,reverse=false}){
 let bits=0;
 const reversing=y>.35&&(reverse||y>.78&&Math.abs(x)<.25&&speed<180);
 if(y>.35)bits|=8;
 if(reversing)bits|=4;
 const target=(reversing?-x:x)*(turn+(!reversing&&(bits&8)?12:0)),delta=target-steer;
 if(Math.abs(x)>.12){if(delta>5)bits|=2;else if(delta< -5)bits|=1;}
 return{bits,reverse:reversing};
}
