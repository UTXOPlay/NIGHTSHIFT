import {courseTable} from './nightshift9-course-data.mjs';
let legacyRoutes=false;export function setLegacyRoutes(value){legacyRoutes=!!value;}
import {EVENTS,curvature} from './nightshift9-rules.mjs';

// Each contract owns its scenery, lighting, landmarks and signed bend sequence.
// Sectors vary local landmark density without replacing the map's identity.
export const DISTRICTS=Object.freeze([
 {name:'CELL HARBOR',short:'HARBOR',color:'#ffc792',fog:'#334852',sky:0,rain:.12,kind:'cargo',zones:['Container Mile','Gantry Reach','Freight Basin','Harbor Relay'],description:'Wet container yards, colossal cranes and the last light over Nervos harbor.'},
 {name:'GLACIER PASS',short:'GLACIER',color:'#e4f5ff',fog:'#9baebd',sky:3,rain:0,kind:'snow',zones:['Blue Ice','Pine Ascent','Glacier Shelf','Summit Relay'],description:'Snow cliffs, frozen lakes and linked hairpins beneath the alpine dawn.'},
 {name:'EMERALD RUN',short:'FOREST',color:'#bceba9',fog:'#315b4a',sky:5,rain:.08,kind:'forest',zones:['Fern Valley','Canopy Bend','River Crossing','Forest Relay'],description:'A winding green corridor through giant conifers, river mist and stone arches.'},
 {name:'NEON WARD',short:'NEON',color:'#e8a5ee',fog:'#29203f',sky:0,rain:.4,kind:'neon',zones:['Market Lights','Skybridge Row','Violet Exchange','Ward Relay'],description:'A rain-soaked city canyon of holographic signs and overhead skybridges.'},
 {name:'AZURE CAUSEWAY',short:'COAST',color:'#c0eaff',fog:'#659ba6',sky:1,rain:0,kind:'coast',zones:['Whitewater','Island Span','Cable Reach','Ocean Relay'],description:'Open ocean, white cable towers and long sweeping island bridges.'},
 {name:'SOLAR WASTES',short:'DESERT',color:'#ffd29b',fog:'#b49478',sky:2,rain:0,kind:'desert',zones:['Salt Flats','Solar Array','Wind Field','Desert Relay'],description:'Sun-bleached salt flats, tilted solar mirrors and distant wind turbines.'},
 {name:'REDLINE CANYON',short:'CANYON',color:'#ffb27c',fog:'#8a5143',sky:2,rain:0,kind:'canyon',zones:['Copper Gate','Needle Bend','Red Narrows','Canyon Relay'],description:'Tight sandstone switchbacks, towering red needles and rock-cut gateways.'},
 {name:'OBSIDIAN RIFT',short:'VOLCANO',color:'#ffad87',fog:'#352c3b',sky:4,rain:0,kind:'volcano',zones:['Ash Fields','Lava Reach','Basalt Lab','Rift Relay'],description:'Black basalt, glowing fissures and an isolated relay station above the lava.'},
 {name:'COMMONS GARDENS',short:'GARDENS',color:'#c9f9d6',fog:'#426c68',sky:5,rain:0,kind:'garden',zones:['Canal Walk','Research Campus','Cell Gardens','Commons Relay'],description:'Broad canal boulevards, planted terraces and layered research buildings.'},
 {name:'POLAR ARRAY',short:'POLAR',color:'#82f0e6',fog:'#163b4d',sky:3,rain:0,kind:'polar',zones:['Frozen Grid','Antenna Ridge','Cryo Station','Polar Relay'],description:'A remote icy datacenter with directional antenna arrays, cooling pipes and teal beacons.'},
 {name:'REACTOR LOOP',short:'REACTOR',color:'#ffcf85',fog:'#302f25',sky:0,rain:0,kind:'reactor',zones:['Service Tube','Core Gallery','Turbine Hall','Reactor Relay'],description:'An enclosed industrial circuit of amber light, heavy ribs and reactor cores.'},
 {name:'DAWN SKYWAY',short:'SKYWAY',color:'#ffe1bc',fog:'#826978',sky:1,rain:0,kind:'skyway',zones:['Cloud Gate','Spire Reach','Solar Bridge','Dawn Relay'],description:'An elevated highway above the clouds, with slender spires and solar sails.'}
]);
export const ROUTES=Object.freeze(DISTRICTS.map((_,i)=>Object.freeze([i,i,i,i])));
export const BRIEFINGS=DISTRICTS.map(d=>d.description);
export const DELIVERIES=['Cell cargo delivered. The Commons stay connected.','Pursuit lost. The relay is back online.','The crew heard you. Your line belongs to the city.','Route cleared. The night relay can move again.'];
export const routeSector=(d,total)=>Math.max(0,Math.min(3,Math.floor(Math.max(0,d)/Math.max(1,total)*4)));
export const districtAt=(mode)=>mode;
export const routeNames=mode=>DISTRICTS[mode].zones.join(' → ');

// Integrates the same bends used by driving and native replay. Cached per map.
export const ROAD_CURVE_RATE=.0001;
const cache=new Map();
export function routeMap(mode){
 const key=mode+':'+legacyRoutes;if(cache.has(key))return cache.get(key);
 const total=EVENTS[mode].distance,points=[],table=courseTable(mode,legacyRoutes);
 for(let n=0;n<=512;n++){const distance=total*n/512,q=distance/25,k=Math.floor(q),f=q-k;points.push({x:table.x[k]+(table.x[k+1]-table.x[k])*f,y:table.z[k]+(table.z[k+1]-table.z[k])*f,distance,heading:table.heading[k]+(table.heading[k+1]-table.heading[k])*f});}
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y),loX=Math.min(...xs),loY=Math.min(...ys),width=Math.max(...xs)-loX,height=Math.max(...ys)-loY,scale=136/Math.max(width,height);
 for(const p of points){p.x=12+(136-width*scale)/2+(p.x-loX)*scale;p.y=12+(136-height*scale)/2+(p.y-loY)*scale;}
 const path=points.map((p,n)=>(n?'L':'M')+p.x.toFixed(2)+','+p.y.toFixed(2)).join(' '),result={points,path,total};cache.set(key,result);return result;
}
export function mapPoint(mode,distance){const {points,total}=routeMap(mode),q=Math.max(0,Math.min(512,distance/total*512)),n=Math.min(511,Math.floor(q)),t=q-n,a=points[n],b=points[n+1];return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,heading:a.heading+(b.heading-a.heading)*t};}
export function routeSvg(mode,className='route-shape') {const {path}=routeMap(mode),a=mapPoint(mode,0),b=mapPoint(mode,EVENTS[mode].distance);return '<svg class="'+className+'" viewBox="0 0 160 160" aria-hidden="true"><path d="'+path+'" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="'+a.x+'" cy="'+a.y+'" r="4" fill="currentColor"/><path d="M'+(b.x-4)+','+(b.y-4)+'h8v8h-8z" fill="currentColor"/></svg>';}
