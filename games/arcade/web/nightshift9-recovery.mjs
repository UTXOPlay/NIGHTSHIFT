// Presentation of existing V9 roadblock collision extents; no rule changes.
export function roadblockOpening(g){
 const blocks=g.bodies.filter(b=>b.tag===8&&b.y>100&&b.y<875);if(!blocks.length)return null;
 const nearest=blocks.reduce((a,b)=>a.y>b.y?a:b),row=blocks.filter(b=>Math.abs(b.y-nearest.y)<16).sort((a,b)=>a.x-b.x);
 let intervals=[[-625,2625]];
 for(const b of row){const lo=b.x-740,hi=b.x+740,next=[];for(const [a,c]of intervals){if(hi<=a||lo>=c)next.push([a,c]);else{if(lo>a)next.push([a,lo]);if(hi<c)next.push([hi,c]);}}intervals=next;}
 const lanes=intervals.filter(([a,b])=>b-a>100).map(([a,b])=>({x:(a+b)/2,width:b-a})).sort((a,b)=>Math.abs(a.x-g.drift_x)-Math.abs(b.x-g.drift_x));
 return lanes.length?{id:nearest.id??Math.round((g.distance||0)+830-nearest.y)+':'+Math.round(nearest.x),x:lanes[0].x,z:(nearest.y-830)*.1,width:lanes[0].width}:null;
}
