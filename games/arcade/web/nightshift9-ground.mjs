import * as T from 'three';
const WATER=new Set([4,11]);
// Finite authored backplates are panned inside their edges, never wrapped as 360 imagery.
export function backdropU(screenX,heading){return .5+(screenX-.5)*.76+Math.sin(heading*Math.PI*2)*.105;}
export class CircuitScenery{
 constructor(scene,materials,road){
  this.materials=materials;this.road=road;this.count=road.stations;this.bands=[];
  for(let band=0;band<4;band++){
   const n=this.count,vertices=n*4,geometry=new T.BufferGeometry(),indices=[];
   for(let side=0;side<2;side++)for(let k=0;k<n-1;k++){const a=side*n*2+k*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
   for(const [key,size]of[['position',3],['normal',3],['uv',2]])geometry.setAttribute(key,new T.BufferAttribute(new Float32Array(vertices*size),size).setUsage(T.DynamicDrawUsage));geometry.setIndex(indices);
   const mesh=new T.Mesh(geometry,materials.ground);mesh.frustumCulled=false;mesh.matrixAutoUpdate=false;mesh.receiveShadow=true;scene.add(mesh);this.bands.push({mesh,lo:0,hi:0,height:0});
  }
 }
 draw(frame,visible=true){
  const key=frame.mode+':'+frame.legacy+':'+frame.distance+':'+visible;if(key===this.bufferKey)return;this.bufferKey=key;
  const mode=frame.mode,m=this.materials,relief=[0,7,5,0,0,.7,9,5,1.5,3,0,0][frame.mode],city=mode===3||mode===9||mode===10;
  let layout;
  if(WATER.has(mode))layout=[[8.3,11.2,-.12,m.white],[11.2,145,mode===11?-15:-4,m.water]];
  else if(mode===8)layout=[[8.3,12.5,-.12,m.white],[12.5,21.5,-.7,m.water],[21.5,22.6,-.12,m.white],[22.6,110,-.12,m.ground]];
  else if(mode===0)layout=[[8.3,33,-.12,m.quay||m.steel],[33,145,-2.1,m.water]];
  else layout=[[8.3,18,-.12,city?(m.quay||m.white):m.ground],[18,110,-.12,m.ground]];
  for(let band=0;band<this.bands.length;band++){
   const target=this.bands[band],spec=layout[band];target.mesh.visible=visible&&!!spec;if(!target.mesh.visible)continue;
   const [lo,hi,height,material]=spec;target.mesh.material=material;Object.assign(target,{lo,hi,height});const g=target.mesh.geometry,p=g.attributes.position,normal=g.attributes.normal,uv=g.attributes.uv,data=this.road.stationData;
   for(let side=0;side<2;side++)for(let k=0;k<this.count;k++)for(let edge=0;edge<2;edge++){
    const x=side===0?-(edge?lo:hi):(edge?hi:lo),s=k*9,index=side*this.count*2+k*2+edge,bankX=Math.sign(x)*Math.min(Math.abs(x),12)*Math.max(0,Math.min(1,(28-Math.abs(x))/16));
    const t=Math.max(0,(Math.abs(x)-25)/85),hill=material===m.ground?Math.pow(t,1.4)*relief:0,slope=material===m.ground&&t>0?Math.sign(x)*1.4*Math.pow(t,.4)*relief/85:0;
    p.setXYZ(index,data[s]+data[s+3]*x,data[s+1]+height+data[s+5]*bankX+hill,data[s+2]+data[s+4]*x);const nx=data[s+6]-slope*data[s+3],ny=data[s+7],nz=data[s+8]-slope*data[s+4],length=Math.hypot(nx,ny,nz);normal.setXYZ(index,nx/length,ny/length,nz/length);uv.setXY(index,Math.abs(x)/150,(frame.distance*.1-30+k*3.5)/18);
   }
   p.needsUpdate=normal.needsUpdate=uv.needsUpdate=true;
  }
 }
 snapshot(){return this.bands.filter(b=>b.mesh.visible).map(b=>({lo:b.lo,hi:b.hi,height:b.height}));}
}
