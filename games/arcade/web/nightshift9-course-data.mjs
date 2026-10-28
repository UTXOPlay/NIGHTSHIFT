import COURSES from './nightshift9-courses.json' with {type:'json'};
import {EVENTS,curvature} from './nightshift9-rules.mjs';
import {curvature as legacyCurve} from './nightshift8-rules.mjs';
const STEP=25,cache=new Map(),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=t=>t*t*(3-2*t);
export function courseElevation(mode,distance,legacy=false){
 if(legacy)return 0;const q=clamp(distance/EVENTS[mode].distance*96,0,96),n=Math.min(95,Math.floor(q)),t=smooth(q-n),e=COURSES[mode].elevation;return e[n]+(e[n+1]-e[n])*t;
}
export function courseTable(mode,legacy=false){
 const key=mode+':'+legacy;if(cache.has(key))return cache.get(key);
 const total=EVENTS[mode].distance,count=Math.ceil(total/STEP)+240,x=new Float64Array(count+1),y=new Float64Array(count+1),z=new Float64Array(count+1),heading=new Float64Array(count+1),curve=legacy?legacyCurve:curvature,rate=legacy?.00044:.001;
 for(let n=1;n<=count;n++){const d=(n-.5)*STEP,turn=curve(Math.min(total,d),mode)*rate*STEP*.1,mid=heading[n-1]+turn/2;heading[n]=heading[n-1]+turn;x[n]=x[n-1]+Math.sin(mid)*STEP*.1;z[n]=z[n-1]-Math.cos(mid)*STEP*.1;y[n]=courseElevation(mode,n*STEP,legacy);}
 const result={x,y,z,heading,count,total};cache.set(key,result);return result;
}
