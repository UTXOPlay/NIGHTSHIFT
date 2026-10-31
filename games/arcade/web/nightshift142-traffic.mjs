// Presentation slots must cover V14's complete authoritative traffic budget.
// Keep IDs bound while actors live, including actors outside the camera.
export const TRAFFIC_CAPACITY=32;
const traffic=b=>b.tag===1||b.tag===9;
export const trafficInView=b=>b.y>=-5670&&b.y<=1070;

export class TrafficSlots {
 constructor(capacity=TRAFFIC_CAPACITY){this.capacity=capacity;this.reset();}
 reset(){this.entries=new Map();this.byBody=new Map();this.sequence=0;this.tick=null;this.race=null;this.version=null;this.droppedVisible=0;}
 update(bodies,{distance=0,tick=0,race=0,version=8}={}){
  if(this.tick!==null&&(tick<this.tick||race!==this.race||version!==this.version))this.reset();
  const elapsed=this.tick===null?0:tick-this.tick,used=new Set(),candidates=[];
  for(const body of bodies){
   if(!traffic(body))continue;
   const identified=Number.isSafeInteger(body.id),station=distance+830-body.y;
   // V8 has no signed body IDs. Match visible historical actors by motion,
   // without adding an ID to the historical simulation or retaining far bodies.
   if(!identified&&!trafficInView(body))continue;
   let key=identified?`${version}:${race}:${body.tag}:${body.id}`:null;
   if(!identified){
    let best=Infinity;
    for(const entry of this.entries.values()){
     if(entry.identified||used.has(entry.key)||entry.tag!==body.tag)continue;
     const dz=Math.abs(station-entry.station-entry.vy*elapsed),dx=Math.abs(body.x-entry.x-entry.vx*elapsed);
     if(dz>30+elapsed*2||dx>100+elapsed*2)continue;
     const cost=dz+dx*.1;if(cost<best){best=cost;key=entry.key;}
    }
    key??=`legacy:${++this.sequence}`;
   }
   used.add(key);candidates.push({key,identified,body,station});
  }
  // Current rules never exceed capacity. Retained V8 saves can contain many
  // distant bodies; prioritize the camera/contact region if it is oversubscribed.
  if(candidates.length>this.capacity)candidates.sort((a,b)=>Number(trafficInView(b.body))-Number(trafficInView(a.body))||Math.abs(830-a.body.y)-Math.abs(830-b.body.y));
  this.droppedVisible=candidates.slice(this.capacity).filter(c=>trafficInView(c.body)).length;
  const selected=candidates.slice(0,this.capacity),alive=new Set(selected.map(c=>c.key));
  for(const key of this.entries.keys())if(!alive.has(key))this.entries.delete(key);
  const occupied=new Set([...this.entries.values()].map(e=>e.index));this.byBody.clear();
  for(const c of selected){
   let entry=this.entries.get(c.key);
   if(!entry){let index=0;while(occupied.has(index))index++;occupied.add(index);entry={index,key:c.key};this.entries.set(c.key,entry);}
   Object.assign(entry,{identified:c.identified,tag:c.body.tag,id:c.body.id??null,station:c.station,x:c.body.x,vx:c.body.vx||0,vy:c.body.vy||0});
   this.byBody.set(c.body,entry);
  }
  this.tick=tick;this.race=race;this.version=version;return this;
 }
 get(body){return this.byBody.get(body);}
 snapshot(){return{capacity:this.capacity,assigned:this.entries.size,droppedVisible:this.droppedVisible,actors:[...this.entries.values()].map(e=>({id:e.id,key:e.key,index:e.index,station:e.station}))};}
}
