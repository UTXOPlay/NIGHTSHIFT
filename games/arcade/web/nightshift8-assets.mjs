import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {VEHICLES} from './nightshift8-rules.mjs';
const geos=new Map();
export function block(w,h,d,mat,x=0,y=0,z=0,r=0){const k=[w,h,d,r].join();if(!geos.has(k))geos.set(k,r?new RoundedBoxGeometry(w,h,d,3,r):new T.BoxGeometry(w,h,d));const m=new T.Mesh(geos.get(k),mat);m.position.set(x,y,z);return m;}
export function merge(group){group.updateMatrixWorld(true);const buckets=new Map();group.traverse(o=>{if(!o.isMesh)return;const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{material:o.material,geometry:[]});const g=o.geometry.clone().applyMatrix4(o.matrixWorld);buckets.get(key).geometry.push(g.index?g.toNonIndexed():g);});const result=new T.Group();for(const {material,geometry}of buckets.values()){const m=new T.Mesh(mergeGeometries(geometry),material);m.castShadow=true;m.receiveShadow=true;result.add(m);geometry.forEach(g=>g.dispose());}return result;}
function loft(sections,mat){const p=[],uv=[],ix=[],ring=24;for(let j=0;j<sections.length;j++){const [z,y,w,h]=sections[j];for(let n=0;n<ring;n++){const a=n/ring*Math.PI*2,c=Math.cos(a),s=Math.sin(a);p.push(w*Math.sign(c)*Math.pow(Math.abs(c),.56),y+h*Math.sign(s)*Math.pow(Math.abs(s),.65),z);uv.push(n/ring,j/(sections.length-1));if(j&&n<ring){const a0=j*ring+n,b=j*ring+(n+1)%ring;ix.push(a0,b,a0-ring,b,b-ring,a0-ring);}}}for(const j of [0,sections.length-1])for(let n=1;n<ring-1;n++)j===0?ix.push(j*ring,j*ring+n,j*ring+n+1):ix.push(j*ring,j*ring+n+1,j*ring+n);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));for(let n=0;n<ix.length;n+=3){const t=ix[n+1];ix[n+1]=ix[n+2];ix[n+2]=t;}g.setIndex(ix);g.computeVertexNormals();return new T.Mesh(g,mat);}
const wraps=new Map();
function wrapTexture(index){if(wraps.has(index))return wraps.get(index);const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,512,256);x.fillStyle='#dae0e6';x.fillRect(50,0,3,256);x.fillRect(459,0,3,256);x.fillStyle='#eeeeee';for(let n=0;n<8;n++){x.fillRect(62+n*4,180+n*3,2,20);x.fillRect(438-n*4,180+n*3,2,20);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;wraps.set(index,t);return t;}
export function carModel(index=0,traffic=false){
 const spec=VEHICLES[index],rally=index===1,gt=index===2||index===5,proto=index===3||index===4;
 const paint=new T.MeshPhysicalMaterial({color:spec.color,metalness:.68,roughness:.25,clearcoat:1,clearcoatRoughness:.12,map:wrapTexture(index)}),trim=new T.MeshStandardMaterial({color:'#111820',roughness:.62,metalness:.4}),glass=new T.MeshPhysicalMaterial({color:'#101e2a',metalness:.65,roughness:.1,clearcoat:1}),silver=new T.MeshStandardMaterial({color:'#a4b4c2',metalness:.85,roughness:.24}),rubber=new T.MeshStandardMaterial({color:'#101215',roughness:.85}),tail=new T.MeshBasicMaterial({color:'#ff3726',toneMapped:false}),head=new T.MeshBasicMaterial({color:'#bee6ff',toneMapped:false});
 const body=new T.Group(),length=proto?4.65:rally?3.9:gt?4.6:4.4,w=proto?1.02:gt?1:.95,h=rally?.61:gt?.58:.49;
 body.add(loft([[-length/2,.47,w*.73,.12],[-length*.43,.5,w*.92,.2],[-length*.30,h,w,.25],[-length*.05,h+.01,w,.26],[length*.18,h+.03,w,.28],[length*.39,h,w,.25],[length/2,.5,w*.81,.17]],paint));
 body.add(block(w*2,.12,length*.86,trim,0,.23,0,.04));
 const top=proto?1.12:rally?1.48:gt?1.4:1.32;
 body.add(loft([[-1.12,.86,.70,.05],[-.54,(top+.82)/2,.69,(top-.82)/2],[.52,(top+.82)/2,.69,(top-.82)/2],[rally?1.03:1.3,.90,.74,.05]],glass));
 body.add(loft([[-.53,top,.60,.035],[-.25,top+.025,.65,.04],[.45,top+.01,.63,.04],[.57,top-.03,.59,.035]],paint));
 for(const s of [-1,1]){
  const pillar=block(.055,Math.hypot(top-.86,.58),.055,paint,s*.68,(top+.86)/2,-.83,.014);pillar.rotation.x=Math.atan2(.58,top-.86);body.add(pillar);
  body.add(block(.055,top-.82,.07,paint,s*.71,(top+.82)/2,.44,.014));body.add(block(.085,.075,1.8,silver,s*.76,.89,.13,.02));
  body.add(block(.24,.12,.20,paint,s*(w+.05),1,-.65,.055));body.add(block(.3,.08,.05,glass,s*(w+.05),1,-.54,.02));
  body.add(block(.13,.09,length*.73,paint,s*w,.34,.1,.03));body.add(block(.5,.10,.055,head,s*.58,.58,-length/2-.006,.02));
  body.add(block(.68,.065,.07,tail,s*.55,.67,length/2-.02,.022));body.add(block(.12,.11,.24,silver,s*.63,.28,length/2,.035));
  body.add(block(.22,.025,.045,silver,s*.97,.85,.23,.01));
 }
 body.add(block(w*1.4,.19,.07,trim,0,.39,-length/2+.01,.025));for(let n=0;n<7;n++)body.add(block(.04,.15,.04,silver,(n-3)*.14,.39,-length/2-.03));
 body.add(block(w*1.65,.075,.13,trim,0,.25,-length/2-.09,.025));
 body.add(block(.36,.13,.04,new T.MeshBasicMaterial({color:'#d4d3c4'}),0,.49,length/2+.02,.015));
 if(index!==2){const z=length*.40;body.add(block(w*1.9,.07,.29,trim,0,proto?1.05:.99,z,.035));for(const s of [-1,1])body.add(block(.045,.26,.07,trim,s*.57,.87,z));}
 for(const s of [-1,1]){const vent=block(.33,.035,.48,trim,s*.46,.79,-1.30,.025);vent.rotation.x=.06;body.add(vent);}
 if(index===4){body.add(block(1.8,.045,.05,head,0,.68,-length/2-.03));body.add(block(1.8,.045,.05,tail,0,.72,length/2+.03));}
 if(index===5){for(const side of [-1,1]){body.add(block(.22,.28,3.2,paint,side*1.01,.48,0,.06));body.add(block(.06,.04,3,head,side*1.06,.29,0));}body.add(block(2.3,.08,.38,trim,0,1.15,length*.40,.04));}
 const result=merge(body);result.userData.wheels=[];
 const wheelZ=length*.30;
 for(const side of [-1,1])for(const z of [-wheelZ,wheelZ]){
  const wheel=new T.Group(),tire=new T.Mesh(new T.CylinderGeometry(.37,.37,.27,24,1),rubber);tire.rotation.z=Math.PI/2;wheel.add(tire);
  const rim=new T.Mesh(new T.CylinderGeometry(.275,.275,.282,24,1),silver);rim.rotation.z=Math.PI/2;wheel.add(rim);
  const center=new T.Mesh(new T.CylinderGeometry(.23,.23,.288,24,1),trim);center.rotation.z=Math.PI/2;wheel.add(center);
  for(let n=0;n<6;n++){const spoke=block(.297,.043,.44,silver);spoke.rotation.x=n*Math.PI/3;wheel.add(spoke);}
  const hub=new T.Mesh(new T.CylinderGeometry(.07,.07,.31,12),silver);hub.rotation.z=Math.PI/2;wheel.add(hub);
  const cooked=merge(wheel);cooked.position.set(side*(w-.035),.39,z);result.add(cooked);result.userData.wheels.push(cooked);
 }
 result.userData.index=index;result.userData.tail=tail;return traffic?merge(result):result;
}
export async function loadCars(){return VEHICLES.map((_,i)=>carModel(i));}
