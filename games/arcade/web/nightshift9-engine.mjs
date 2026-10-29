// Presentation-only runtime. Native/browser rule stepping stays at 30 Hz.
// Windowed thresholds follow drei PerformanceMonitor (MIT); see licenses/drei.txt.
export class QualityGovernor {
 constructor(max=1.5){this.max=Math.min(1.5,Math.max(.75,max));this.ratio=this.max;this.tier=0;this.frames=[];this.windows=[];this.elapsed=0;this.cooldown=0;this.good=0;this.flips=0;this.locked=false;this.gpuMs=null;this.gpuWindow=[];}
 sample(ms,quality='auto',gpuMs=null){
  if(quality!=='auto'){this.tier=quality==='low'?2:0;this.ratio=quality==='low'?Math.min(1,this.max):this.max;this.resetWindows();return this.ratio;}
  if(!Number.isFinite(ms)||ms<=0)return this.ratio;
  this.frames.push(ms);this.elapsed+=ms;if(Number.isFinite(gpuMs)&&gpuMs>0){this.gpuMs=gpuMs;this.gpuWindow.push(gpuMs);}
  if(this.elapsed<250)return this.ratio;
  const average=this.frames.reduce((a,b)=>a+b,0)/this.frames.length,gpu=this.gpuWindow.length?this.gpuWindow.reduce((a,b)=>a+b,0)/this.gpuWindow.length:null;
  this.windows.push({average,gpu});this.frames.length=this.gpuWindow.length=0;this.elapsed=0;
  if(this.windows.length<8)return this.ratio;
  const slow=this.windows.filter(w=>w.average>21||w.gpu>17).length,fast=this.windows.filter(w=>w.average<18&&(w.gpu===null||w.gpu<12)).length;this.windows.length=0;
  if(slow>=6){this.good=0;if(this.tier<2)this.tier++;else this.ratio=Math.max(.75,this.ratio-.25);this.flips++;}
  else if(fast>=7&&!this.locked){if(++this.good>=4){this.good=0;if(this.ratio<this.max)this.ratio=Math.min(this.max,this.ratio+.25);else if(this.tier>0)this.tier--;this.flips++;}}
  else this.good=0;
  if(this.flips>=8)this.locked=true;return this.ratio;
 }
 resetWindows(){this.frames.length=this.windows.length=this.gpuWindow.length=0;this.elapsed=0;this.good=0;}
 reset(){this.resetWindows();this.flips=0;this.locked=false;}
 get features(){return{tier:this.tier,reflection:this.tier===0,shadowInterval:this.tier===0?2:3,rainCount:this.tier===0?1200:this.tier===1?700:400};}
}

export function disposeSceneResources(roots,extras=[]){
 const resources=new Set(),seen=new Set();
 const material=m=>{if(!m||seen.has(m))return;seen.add(m);resources.add(m);for(const v of Object.values(m))if(v?.isTexture)resources.add(v);for(const u of Object.values(m.uniforms||{})){const v=u?.value;if(v?.isTexture)resources.add(v);if(Array.isArray(v))for(const t of v)if(t?.isTexture)resources.add(t);}};
 for(const root of roots)root?.traverse?.(o=>{if(o.isBatchedMesh||o.isInstancedMesh)resources.add(o);if(!o.isBatchedMesh&&o.geometry)resources.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])material(m);});
 for(const e of extras)if(e?.isMaterial)material(e);else if(e)resources.add(e);
 for(const r of resources)r.dispose?.();return resources.size;
}
