import {assetURL} from './nightshift-asset-url.mjs';
import {routeArt,routeArtSet} from './nightshift13-map-art.mjs';
export {FLEET} from './nightshift-fleet-specs.mjs';
const RENDERER_MODULE=typeof __NIGHTSHIFT_RENDERER_MODULE__==='string'?__NIGHTSHIFT_RENDERER_MODULE__:new URL('./nightshift9-renderer.bundle.mjs',import.meta.url).href;
// The menu is a real circuit capture. WebGL, scene textures and vehicles are
// loaded only after the player opens the garage or enters a race.
export function createRendererShell(canvas){
 const options={previewMode:false,mapMode:0,previewVehicle:0,previewEvent:0,previewYaw:0,legacy:false};
 const image=document.createElement('img');image.id='route-preview';image.alt='';image.decoding='async';image.fetchPriority='high';canvas.before(image);canvas.style.opacity='0';
 let engine,task,modulePreload,disposed=false,garageTask,garageVehicle=-1,previewMode=-1,previewWidth=0,previewTask,preparingRace=false;const shellTimings={};
 const vector={toArray:()=>[0,0,0]},world={current:0,sky:0},draw={calls:0,triangles:0,points:0,lines:0};
 const fallback={renderer:{info:{render:draw}},combat:{snapshot:()=>({active:0,visible:0,rivalAges:[],hitAge:-1,guardAge:-1,wreckAge:-1})},lighting:{snapshot:()=>({loaded:false,families:[],fixtures:0,physicalLights:0,activeLights:0})},car:{position:vector,rotation:vector,userData:{}},world,gpu:{ms:null},width:innerWidth,height:innerHeight,thumbnails:Array.from({length:6},(_,n)=>assetURL('/arcade/art/nightshift/fleet-v141/car-'+n+'.webp'))};
 function preview(mode){mode=Math.max(0,Math.min(11,Number(mode)||0));world.current=mode;const width=innerWidth>1400?2560:1280;if(previewMode!==mode||previewWidth!==width){previewMode=mode;previewWidth=width;image.dataset.route=mode;image.sizes='100vw';image.srcset=routeArtSet(mode,width);image.src=routeArt(mode,width);previewTask=image.decode().catch(()=>{}).finally(()=>globalThis.UTXOPlayLoader?.assets(1,1));}return previewTask;}
 // Start only after a valid garage/race gesture. Module preload fetches and
 // compiles the exact import URL; it does not construct WebGL or fetch scenery.
 function preloadEngine(){
  if(disposed||modulePreload)return;
  const link=modulePreload=document.createElement('link');link.rel='modulepreload';link.as='script';link.href=new URL(RENDERER_MODULE,import.meta.url).href;link.crossOrigin='anonymous';link.fetchPriority='high';link.dataset.nightshiftRenderer='';
  link.addEventListener('error',()=>{if(modulePreload===link)modulePreload=null;link.remove();},{once:true});document.head.append(link);
 }
 async function ensure(){
  if(disposed)throw Error('Graphics closed');preloadEngine();
  if(!task)task=(async()=>{const start=performance.now(),{DriftRenderer}=await import('./_arcade/nightshift9-renderer.bundle.mjs');shellTimings.rendererImport=performance.now()-start;if(disposed)throw Error('Graphics closed');const construct=performance.now();engine=new DriftRenderer(canvas);shellTimings.rendererConstruct=performance.now()-construct;Object.assign(engine,options);return engine;})().catch(e=>{task=null;throw e;});return task;
 }
 const methods={
  preview,preloadEngine,
  load:()=>preview(0),
  async prepareRace(g){preparingRace=true;try{const r=await ensure(),base=r.load(g.mode,g.vehicle),fleet=r.installFleet(g.vehicle);await Promise.all([base,r.world.prepare(g.mode),r.loadRaceAssets(g.vehicle),fleet.then(()=>r.fleet.detail(g.vehicle,'player',g.vehicle===0?'race':'hero'))]);await r.prepareRace(g);}finally{preparingRace=false;}},
  async prepareGarage(vehicle){document.dispatchEvent(new CustomEvent('nightshift:graphics-progress',{detail:true}));garageVehicle=vehicle;try{const r=await ensure();await r.loadGarage(vehicle);}finally{document.dispatchEvent(new CustomEvent('nightshift:graphics-progress',{detail:false}));}},
  draw(g,before,alpha,delta,ratio,features){
   const menu=options.mapMode!==null&&options.mapMode!==undefined;
   if(menu){void preview(options.mapMode);canvas.style.opacity='0';return;}
   if(options.previewMode&&garageVehicle!==options.previewVehicle&&!garageTask){garageTask=methods.prepareGarage(options.previewVehicle).catch(e=>{garageVehicle=-1;document.dispatchEvent(new CustomEvent('nightshift:graphics-error',{detail:e.message}));}).finally(()=>garageTask=null);}
   if(preparingRace||!engine?.ready||options.previewMode&&engine.playerCars[options.previewVehicle].userData.pending||!options.previewMode&&!engine.worldReady){canvas.style.opacity='0';return;}
   engine.draw(g,before,alpha,delta,ratio,features);canvas.style.opacity='1';
  },
  event:(...args)=>engine?.event(...args),
  reset:()=>engine?.reset(),
  setVehicle:n=>{options.previewVehicle=n;if(engine)engine.setVehicle(n);},
  engineSnapshot:()=>engine?{deferred:false,...engine.engineSnapshot(),loadingTimings:{...engine.loadingTimings,...shellTimings},fleetTimings:{...engine.fleet?.timings}}:{deferred:true,ready:false,worldReady:false,errors:0,geometries:0,textures:0,programs:0,preparedModes:[]},
  pointer:(...args)=>{if(!engine?.ready)throw Error('Enter a race before mapping road coordinates');return engine.pointer(...args);},
  project:(...args)=>engine?.project(...args),
  projectWorld:(...args)=>engine?.projectWorld(...args),
  dispose(){disposed=true;modulePreload?.remove();engine?.dispose();image.remove();}
 };
 return new Proxy(methods,{get(target,key){if(key in target)return target[key];if(key in options)return options[key];if(engine){const value=engine[key];return typeof value==='function'?value.bind(engine):value;}return fallback[key];},set(_target,key,value){options[key]=value;if(engine)engine[key]=value;return true;}});
}
