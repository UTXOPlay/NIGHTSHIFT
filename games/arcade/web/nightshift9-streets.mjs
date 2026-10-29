import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export const STREET_VARIANTS=24;
export const GEO={box:new T.BoxGeometry(1,1,1),building:new RoundedBoxGeometry(1,1,1,1,.012),rock:new T.DodecahedronGeometry(1,0),cone:new T.ConeGeometry(1,1,8),cylinder:new T.CylinderGeometry(1,1,1,8),ring:new T.TorusGeometry(.8,.035,5,6),leaf:new T.PlaneGeometry(1,1)};
export const FACADES=[['brick',0,10,9],['residence',1,9,18],['office',2,15,21],['lab',3,12,10],['warehouse',4,14,12],['stonefront',5,12,9],['chalet',6,9,8],['utility',7,7,7]];
const hash=x=>{x=Math.imul(x^(x>>>16),0x45d9f3b);x=Math.imul(x^(x>>>16),0x45d9f3b);return(x^(x>>>16))>>>0;};
const mod=(x,n)=>(x%n+n)%n;
// Adjacent chunks have different parity; repeated blocks cannot form a wall.
export function streetVariant(mode,chunk,sector=0){return(hash(Math.floor(chunk/2)+mode*4099+sector*313)%12)*2+mod(chunk,2);}
export function buildDistrict(w,id,n){
 const out=[],b=(mat,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,geometry=GEO.box,color='#ffffff')=>{if((mat==='ground'||mat==='water')&&sx>=80||['white','steel'].includes(mat)&&Math.abs(sz-18.2)<.15&&sx>=10)return;w.add(out,mat,x,y,z,sx,sy,sz,rx,ry,rz,geometry,color);};
 const random=k=>(hash(n*199+id*1013+k*61)%1000)/1000;
 const tree=(x,z,h,kind='fir',seed=0)=>{const angle=random(seed+37)*Math.PI;for(let k=0;k<2;k++)b(kind,x,h*.48,z,h*(kind==='broadleaf'?.85:.64),h,1,0,angle+k*Math.PI/2,0,GEO.leaf);b('steel',x,.6,z,.13,1.3,.13,0,0,0,GEO.cylinder,'#72796b');};
 const bench=(x,z,side)=>{b('steel',x,.46,z,1.25,.13,2.3,0,0,0,GEO.box,'#928775');b('steel',x+side*.5,.86,z,.12,.9,2.3);for(const dz of [-.8,.8])b('steel',x,.2,z+dz,1.1,.4,.12);};
 const planter=(x,z,side)=>{b('stonefront',x,.35,z,1.6,.7,2);tree(x,z,3.5,'broadleaf',n+side);};
 const shelter=(x,z,s)=>{b('steel',x,2.65,z,2.9,.17,5.2);for(const dz of [-2.2,2.2])b('steel',x+s*1.2,1.3,z+dz,.13,2.6,.13);b('glass',x+s*1.15,1.3,z,.08,2.45,4.4);b('light',x,2.54,z,2.35,.045,.12,0,0,0,GEO.box,'#f1dab6');bench(x,z,s);};
 const roof=(x,z,width,depth,y,side,style)=>{b('steel',x,y+.14,z,width+.35,.26,depth+.35);if(style%3===0)b('utility',x+side*1.2,y+.75,z-1.5,2.7,1.1,2.3);else if(style%3===1){b('steel',x,y+.6,z,width*.5,.18,depth*.5,0,0,side*.14);}};
 const building=(side,z,kind,seed,offset=0,heightScale=1)=>{
  const setback=kind===6?9:kind===7?13:0,x=side*(18+setback+offset+random(seed+1)*6),depth=12+random(seed+2)*4,width=kind===2?11:kind===3?15:12;
  const heights=[11,20,43,29,15,8,6,10],h=heights[kind]*(.82+random(seed+3)*.37)*heightScale,face=['brick','residence','office','lab','residence','stonefront','stonefront','brick'][kind];
  if(kind===6){b('ground',side*21,-.1,z,22,.3,16,0,0,0,GEO.box,'#829783');for(const dz of [-4.5,4.5]){planter(side*22,z+dz,side);bench(side*15,z+dz,side);}b('stonefront',side*36,3,z,8,6,12);return;}
  b(face,x,h/2,z,width,h,depth,0,0,0,GEO.box,['#d3ccba','#a7b3b8','#9aadb8','#afc1bb'][seed%4]);roof(x,z,width,depth,h,side,seed);
  if(kind===0||kind===1||kind===4){b('stonefront',x,1.55,z,width+.5,3.1,depth+.3);b('steel',x-side*(width/2+1),3.35,z,2.2,.18,depth*.75,0,0,-side*.1);b('light',x-side*(width/2+2.05),3.23,z,.055,.08,depth*.7,0,0,0,GEO.box,seed%2?'#d3a783':'#a5d8cf');}
  if(kind===2||kind===3){const by=h*.38;b(face,x+side*2,by/2,z+depth*.15,width+4,by,depth+2);b('steel',x+side*2,by+.18,z+depth*.15,width+4.4,.26,depth+2.4);}
  if(kind===4){for(const dz of [-depth*.35,depth*.35]){b('steel',x-side*(width*.5+.25),h*.55,z+dz,.6,h*.7,2);b('white',x-side*(width*.5+.65),h*.55,z+dz,.12,h*.7,2);}}
  if(kind===5||kind===7){b('glass',x-side*(width*.5+.2),h*.55,z,width*.04,h*.55,depth*.7);if(seed%2)shelter(side*11.8,z,side);}
  if(seed%3===0)planter(side*11.3,z-4.5,side);else if(seed%3===1)bench(side*11.5,z+4,side);
 };
 const chalet=(side,z,h=5)=>{const x=side*(18+random(n+side)*8);b('stonefront',x,1.15,z,10,2.3,11);b('chalet',x,2.3+h/2,z,9,h,10);for(const slope of [-1,1])b('steel',x+slope*2.65,h+3.2,z,6.1,.28,12,0,0,-slope*.43, GEO.box,'#d3e3e8');};
 const cliff=(x,z,height,snow=false)=>{for(let k=0;k<3;k++){const h=height*(1-k*.21);b('stone',x+(k%2?1.5:-.5),h*.5+k*2-1,z+k*.7,18-k*2,h,17-k,0,(n+k)*.27,0,GEO.rock,snow?'#8e9eac':'#c8a186');if(snow&&k===2)b('white',x+1,height*.71,z,13,1.1,12,0,n*.27,0,GEO.rock,'#dce6eb');}};
 if(id===0){
  b('water',0,-2.1,0,220,.12,18.2,0,0,0,GEO.box,'#55737c');
  for(const s of [-1,1]){b('steel',s*21,-1.3,0,25,1.1,18.2);const amount=1+n%3;for(let k=0;k<amount;k++){const stack=(n+k+s+24)%3+1;for(let t=0;t<stack;t++)b('cargo',s*(15+k*6),t*2.6+.2,k*4-4,4.7,2.5,8.5,0,0,0,GEO.box,['#8d9d85','#aa7654','#577b90','#c4b28d'][(n+k+t)%4]);}
   if((n+(s>0?2:0))%4===0){b('warehouse',s*38,4,0,14,8,15);roof(s*38,0,14,15,8,s,n);}else if(n%5===1)for(const z of [-5,5])b('steel',s*12,1.1,z,1.2,2.2,1.2,0,0,0,GEO.cylinder);
   if(n%6===0){for(const z of [-5,5])b('steel',s*31,9,z,.7,22,.7);b('steel',s*24,20,0,30,1,1);b('steel',s*16,13.5,0,.09,12,.09);b('lab',s*21,18,0,3.5,2.6,3.4);b('light',s*24,19.4,0,7,.1,.2,0,0,0,GEO.box,'#edcb8d');}}
 }else if(id===1){
  b('ground',0,-1.8,0,170,.6,18.2,0,0,0,GEO.box,'#d8e6ea');b('water',-42,-1.4,0,32,.1,18.2,0,0,0,GEO.box,'#9bc9d6');
  const s=n%2?1:-1;if(n%4===0)cliff(s*(61+random(4)*8),0,7+random(5)*6,true);else if(n%5===1)chalet(s,0,4+random(8)*3);
  for(const side of [-1,1])for(let k=0;k<2+(n+side+24)%2;k++)tree(side*(13+k*7+random(k)*2),k*5-5,4.5+random(k+10)*5,'snowFir',k+side);
  if(n%6===2){b('white',s*18,11,0,.55,24,.55);b('steel',s*18,22,0,9,.45,.45);b('steel',s*20,22,0,.06,.06,18.2);b('cargo',s*20,18,0,2.3,2.7,2.3,0,0,0,GEO.box,'#bb7560');}
 }else if(id===2){
  b('ground',0,-1.6,0,170,.8,18.2,0,0,0,GEO.box,'#4e6c4b');b('water',-24,-.9,0,10,.1,18.2,0,0,0,GEO.box,'#4a7a70');
  for(const s of [-1,1])for(let k=0;k<2+n%3;k++)tree(s*(13+k*7),k*6-5,7+random(k+s+31)*9,k%3===0?'broadleaf':'fir',k+s);
  if(n%7===0)chalet(1,0,3);else if(n%5===0)cliff(-39,0,10);if(n%4===0)for(const s of [-1,1])b('stone',s*12,.4,3,3,2,4,0,n*.4,0,GEO.rock,'#6b8069');
 }else if(id===3){
  b('ground',0,-1.5,0,120,.4,18.2,0,0,0,GEO.box,'#46505b');for(const s of [-1,1]){b('white',s*15,-.12,0,14,.4,18.2,0,0,0,GEO.box,'#717c7c');const kind=(n*7+(s>0?3:0))%8;building(s,0,kind,n+(s>0?5:0));}
  if(n%8===0){const s=n%16?1:-1;b('office',s*65,26,-3,16,52,15);roof(s*65,-3,16,15,52,s,n);b('light',s*65,53,-3,16,.08,15,0,0,0,GEO.box,'#b9cfca');}
  if(n===7||n===18){b('lab',0,15,0,39,2.2,4);b('steel',0,16.2,0,39,.2,4.3);b('light',0,13.85,2.04,35,.04,.045,0,0,0,GEO.box,'#c2c9b6');}
 }else if(id===4||id===11){
  const sky=id===11;b('water',0,sky?-15:-4,0,280,.1,18.2,0,0,0,GEO.box,sky?'#8f819a':'#6fabb2');
  for(const s of [-1,1]){b('white',s*10,.8,0,.35,2.3,18.2);b('steel',s*10,2.15,0,.14,.14,18.2);if(n%5===0){b('white',s*13,12,0,.8,26,.8,0,0,s*.08);for(const z of [-6,6])b('steel',s*11,11,z,.09,26,.09,z*.06,0,s*.08);}if(n%7===2){b('white',s*19,3,0,10,.5,13);shelter(s*19,0,s);}}
  if(n%8===0){b('white',0,24,0,28,.5,.8);for(const s of [-1,1])b('steel',s*12,12,0,.12,27,.12,0,0,s*.48);}if(sky&&n%4===0)for(const s of [-1,1])b('residence',s*55,18,0,8,38+n,8,0,0,0,GEO.box,'#c3b8bc');
 }else if(id===5){
  b('ground',0,-1.6,0,260,.6,18.2,0,0,0,GEO.box,'#d9bb92');for(const s of [-1,1]){for(let k=0;k<1+n%3;k++){const x=s*(17+k*9);b('steel',x,1.1,k*4-4,.3,2.5,.3);b('glass',x,2.5,k*4-4,6,.15,5,0,0,s*.22,GEO.box,'#647b87');}tree(s*12,3,2.8,'scrub',s);if(n%6===0){b('utility',s*34,3,0,12,6,13);roof(s*34,0,12,13,6,s,n);}if(n%8===3){b('white',s*45,12,0,.55,27,.55);for(let k=0;k<3;k++)b('white',s*45+Math.sin(k*2.094)*4.3,25+Math.cos(k*2.094)*4.3,0,.35,9,.14,0,0,-k*2.094);}}
 }else if(id===6){
  b('ground',0,-1.7,0,150,.6,18.2,0,0,0,GEO.box,'#c59c77');const side=n%2?1:-1;cliff(side*(30+n%3*5),0,15+n%5*3);if(n%3===0)cliff(-side*53,3,12);for(const s of [-1,1]){if((n+s+24)%3===0)tree(s*13,4,2.3,'scrub',s);b('stone',s*12,.4,-3,2.5,2,4,0,n*.3,0,GEO.rock,'#b6a38a');}if(n%8===1){b('warehouse',side*27,2.3,0,9,4.6,12);roof(side*27,0,9,12,4.6,side,n);}
 }else if(id===7){
  b('ground',0,-2,0,160,.5,18.2,0,0,0,GEO.box,'#4a4249');for(const s of [-1,1]){if(n%3!==0)b('light',s*20,-1.55,0,3,.1,18.2,0,0,0,GEO.box,'#ba6740');for(let k=0;k<2;k++)b('stone',s*(27+k*13),4+k*3,k*5,14,10+random(k)*12,13,0,n*.4,0,GEO.rock,'#655d62');if(n%5===0){b('utility',s*25,3,0,7,6,9);b('steel',s*26,9,0,1.5,12,1.5);b('light',s*26,15.2,0,.2,.2,.2,0,0,0,GEO.box,'#e7a46c');}}
 }else if(id===8){
  b('ground',0,-1.5,0,140,.5,18.2,0,0,0,GEO.box,'#98a58f');for(const s of [-1,1]){b('water',s*17,-.7,0,9,.1,18.2,0,0,0,GEO.box,'#648d85');b('white',s*22,-.45,0,1.2,1.1,18.2);b('white',s*34,-.22,0,24,.4,18.2,0,0,0,GEO.box,'#899586');if((n+(s>0?3:0))%5===0){building(s,0,3,n+4,15,.48);}else if(n%4===0){shelter(s*26,0,s);tree(s*31,4,5,'broadleaf',s);}else{for(const z of [-4,4])tree(s*(26+n%3*2),z,4+random(z+s+11)*3,'broadleaf',z+s);if(n%3===0)bench(s*24,0,s);}if(n%7===1){b('stonefront',s*35,3,0,9,6,12);roof(s*35,0,9,12,6,s,n);}}
 }else if(id===9){
  b('ground',0,-1.8,0,180,.5,18.2,0,0,0,GEO.box,'#c0d2db');for(const s of [-1,1]){if((n+(s>0?2:0))%4!==0){b(n%3===0?'utility':'lab',s*(19+n%2*4),2.4,0,10,5,14);roof(s*(19+n%2*4),0,10,14,5,s,n);b('steel',s*11.5,.8,0,.5,.5,18.2);}else for(let k=0;k<2;k++)tree(s*(14+k*7),k*7-3,4,'snowFir',k+s);if(n%8===0){for(const z of [-1,1])b('steel',s*33,8,z,.25,16,.25);for(const z of [-1.5,1.5])b('white',s*32.6,11,z,.35,4,1.1);b('steel',s*33,17,0,.1,4,.1);b('light',s*33,19.05,0,.2,.2,.2,0,0,0,GEO.box,'#81d8c6');}}
 }else if(id===10){
  b('tunnel',0,11,0,22,1,18.2);for(const s of [-1,1]){b('tunnel',s*10,4.5,0,1,10,18.2);b('steel',s*9.4,5,5+((n*7)%24)/8,.4,10,.4);b('steel',s*7.1,9.6,0,.5,.5,18.2);if(n%3===0){b('utility',s*9.35,2.6,0,.16,4.2,7);b('light',s*9.17,2.5,0,.05,.1,6,0,0,0,GEO.box,'#9ccfb9');}else if(n%4===0)b('glass',s*9.4,6.3,0,.15,3,8);b('light',s*9.4,1.1,0,.08,.15,18.2,0,0,0,GEO.box,n%2?'#d4b581':'#a5c6bd');}if(n%4===1){b('steel',0,10.3,0,20,.4,.5);b('light',0,10.05,0,12,.08,.2,0,0,0,GEO.box,'#e8cfaa');}
 }
 return out;
}
