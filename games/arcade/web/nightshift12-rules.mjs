import {drive} from './nightshift12-drive.mjs';
import {validInput,readInput} from './nightshift12-input.mjs';
import {resolveObstacleActors,guideTraffic} from './nightshift10-roadblocks.mjs';
import {resolveContacts,resolveRail} from './nightshift11-contact.mjs';
import COURSES from './nightshift9-courses.json' with {type:'json'};
// Version 12: deterministic integer 30 Hz career/racing rules. Mirrored in native/src/game.rs.
export const VEHICLES=[
{name:'VANTA',model:'RS / STREET',color:'#b8d1dc',role:'Balanced street coupe',price:0,speed:1660,turn:70},
{name:'KITE',model:'RX / DRIFT',color:'#e9a340',role:'Agile drift specialist',price:1800,speed:1600,turn:86},
{name:'ATLAS',model:'GT / PURSUIT',color:'#638f91',role:'Armored grand tourer',price:2600,speed:1570,turn:62},
{name:'VELA',model:'R / HYPER',color:'#d65852',role:'High-speed interceptor',price:4200,speed:1810,turn:72},
{name:'ION',model:'EV / CIRCUIT',color:'#90e8bd',role:'Instant torque, precise grip',price:3200,speed:1720,turn:78},
{name:'ONYX',model:'RX / WIDEBODY',color:'#b49de3',role:'Heavy combat coupe',price:3800,speed:1690,turn:68}
];
export const RIVALS=['MICA','ROOK','JINX','ECHO','SABLE'];
export const GADGETS=[{name:'LOCK EMP',detail:'Track a racer ahead. Lock for 0.6 s, then fire. An unguarded hit disables. Costs two ammo.'},{name:'SHOCKWAVE',detail:'Disrupt up to two nearby racers within 18 m. Costs two ammo. Seven-second cooldown.'},{name:'REAR MINE',detail:'Arm a rear trap in 0.3 s. Lasts 12 s. A clean hit disables; a guard absorbs it.'}];
export const UPGRADES=[{name:'POWER',detail:'+70 top speed per tier',cost:650},{name:'GRIP',detail:'Sharper steering and less corner slip',cost:550},{name:'CAPACITOR',detail:'Longer boost and faster weapon recharge',cost:600}];
export const EVENTS=[
 {
  "name": "CELL EXPRESS",
  "tag": "01 / RACE",
  "detail": "13.5 km \u00b7 3\u20137 min \u00b7 Podium finish",
  "distance": 135000,
  "type": 0,
  "style": 0,
  "rivals": 0,
  "brief": "Race five crews for the next relay contract. Finish in the top three."
 },
 {
  "name": "COLD SIGNAL",
  "tag": "02 / ESCAPE",
  "detail": "14 km \u00b7 3\u20137 min \u00b7 Escape pursuit",
  "distance": 140000,
  "type": 1,
  "style": 0,
  "rivals": 0,
  "brief": "Deliver the cell cargo while pursuit closes in. Break line of attack."
 },
 {
  "name": "GREEN LINE",
  "tag": "03 / STYLE",
  "detail": "13.5 km \u00b7 3\u20137 min \u00b7 Four drift sectors",
  "distance": 135000,
  "type": 2,
  "style": 1200,
  "rivals": 0,
  "brief": "Build clean drift chains, then spend that charge to stay with the field."
 },
 {
  "name": "NIGHT INTERCEPT",
  "tag": "04 / INTERCEPT",
  "detail": "14 km \u00b7 3\u20137 min \u00b7 2 disables",
  "distance": 140000,
  "type": 3,
  "style": 0,
  "rivals": 2,
  "brief": "Secure each amber target after its route gate. EMP and Shockwave suit interception; rear mines suit defensive racing."
 },
 {
  "name": "DOCKSIDE RUN",
  "tag": "05 / RACE",
  "detail": "15 km \u00b7 3\u20137 min \u00b7 Podium finish",
  "distance": 150000,
  "type": 0,
  "style": 0,
  "rivals": 0,
  "brief": "Race five crews for the next relay contract. Finish in the top three."
 },
 {
  "name": "GHOST FREQUENCY",
  "tag": "06 / ESCAPE",
  "detail": "15.5 km \u00b7 3\u20137 min \u00b7 Escape pursuit",
  "distance": 155000,
  "type": 1,
  "style": 0,
  "rivals": 0,
  "brief": "Deliver the cell cargo while pursuit closes in. Break line of attack."
 },
 {
  "name": "RIDGE SLIDE",
  "tag": "07 / STYLE",
  "detail": "14 km \u00b7 3\u20137 min \u00b7 Four drift sectors",
  "distance": 140000,
  "type": 2,
  "style": 1600,
  "rivals": 0,
  "brief": "Build clean drift chains, then spend that charge to stay with the field."
 },
 {
  "name": "DEAD DROP",
  "tag": "08 / INTERCEPT",
  "detail": "15.5 km \u00b7 3\u20137 min \u00b7 3 disables",
  "distance": 155000,
  "type": 3,
  "style": 0,
  "rivals": 3,
  "brief": "Secure each amber target after its route gate. EMP and Shockwave suit interception; rear mines suit defensive racing."
 },
 {
  "name": "OPEN COMMONS",
  "tag": "09 / RACE",
  "detail": "16.5 km \u00b7 3\u20137 min \u00b7 Podium finish",
  "distance": 165000,
  "type": 0,
  "style": 0,
  "rivals": 0,
  "brief": "Race five crews for the next relay contract. Finish in the top three."
 },
 {
  "name": "LAST TRANSMISSION",
  "tag": "10 / ESCAPE",
  "detail": "17 km \u00b7 3\u20137 min \u00b7 Escape pursuit",
  "distance": 170000,
  "type": 1,
  "style": 0,
  "rivals": 0,
  "brief": "Deliver the cell cargo while pursuit closes in. Break line of attack."
 },
 {
  "name": "CIRCUIT BREAKER",
  "tag": "11 / STYLE",
  "detail": "14.5 km \u00b7 3\u20137 min \u00b7 Four drift sectors",
  "distance": 145000,
  "type": 2,
  "style": 1600,
  "rivals": 0,
  "brief": "Build clean drift chains, then spend that charge to stay with the field."
 },
 {
  "name": "DAWN RELAY",
  "tag": "12 / INTERCEPT",
  "detail": "17.5 km \u00b7 3\u20137 min \u00b7 4 disables",
  "distance": 175000,
  "type": 3,
  "style": 0,
  "rivals": 4,
  "brief": "Secure each amber target after its route gate. EMP and Shockwave suit interception; rear mines suit defensive racing."
 }
];
export const ENCOUNTERS=['SLIPSTREAM','CROSS TRAFFIC','DRIFT ZONE','BOOST STRIP'];
export const PICKUPS={2:{name:'CHARGE',glyph:'+',color:'#ffd26c'},3:{name:'SHIELD',glyph:'S',color:'#45e9ff'},4:{name:'MAGNET',glyph:'M',color:'#bf86ff'},5:{name:'NITRO',glyph:'N',color:'#6affb7'},6:{name:'AMMO',glyph:'E',color:'#ff779e'},7:{name:'DOUBLE',glyph:'2x',color:'#ffd24c'},10:{name:'BOOST',glyph:'>>',color:'#7cfff3'},11:{name:'MINE',glyph:'!',color:'#ff9966'}};
export const SECTOR_GOALS=[400,500,600];
export const sectorIndex=g=>Math.min(3,Math.floor(g.distance/EVENTS[g.mode].distance*4));
export const styleGoal=g=>Math.floor(EVENTS[g.mode].style/4);
export const styleComplete=g=>!EVENTS[g.mode].style||g.style_sectors.every(n=>n>=styleGoal(g));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),trunc=x=>Math.trunc(x)||0;
export const TRACK_CURVES=COURSES.map(c=>c.curves);
export const curvature=(d,mode=0)=>{const q=clamp(Math.trunc(Math.max(0,d)*96*1024/EVENTS[mode].distance),0,96*1024-1),n=Math.floor(q/1024),f=q%1024,a=TRACK_CURVES[mode][n],b=TRACK_CURVES[mode][Math.min(95,n+1)];return trunc((a*(1024-f)+b*f)/1024);};
export function readableRoadblockSite(distance,mode){
 const elevation=d=>{const q=clamp(trunc(Math.max(0,d)*96*1024/EVENTS[mode].distance),0,96*1024-1),n=Math.floor(q/1024),f=q%1024,a=COURSES[mode].elevation;return trunc((a[n]*(1024-f)+a[Math.min(95,n+1)]*f)/1024);};
 const a=elevation(distance-1600),b=elevation(distance-800),c=elevation(distance);
 return [distance-1600,distance-800,distance].every(d=>Math.abs(curvature(d,mode))<=8)&&!(b>a+2&&b>c+2);
}
export const WEAPON_COST=[2,2,1],WEAPON_COOLDOWN=[120,210,180],LOCK_TICKS=18;
export const countBits=n=>{let count=0;for(;n;n>>=1)count+=n&1;return count;};
export function contractActive(g,id){const count=EVENTS[g.mode].rivals;if(!count)return false;for(let rank=0;rank<count;rank++)if((rank+g.mode+g.race_id)%5===id)return g.distance*5>=EVENTS[g.mode].distance*rank;return false;}
export function weaponTargets(g){return g.rivals.filter(r=>!r.finish&&r.hp>0&&!r.recover&&(g.gadget===0?r.id===g.lock_id&&g.lock_ticks>=LOCK_TICKS:g.gadget===1?Math.abs(r.distance-g.distance)<180&&Math.abs(r.x-g.drift_x)<=1000:r.distance<g.distance&&g.distance-r.distance<900&&Math.abs(r.x-g.drift_x)<650));}
function emit(g,kind,actor=-1,target=-1,weapon=-1){g.event_seq++;g.events.push({id:g.event_seq,tick:g.tick,kind,actor,target,weapon});if(g.events.length>32)g.events.shift();}
function cancelAttack(g,r){if(r.windup){r.windup=0;r.cooldown=Math.max(r.cooldown,90);emit(g,'cancel',r.id,r.attack_target);}}
function hitRival(g,id,actor,weapon,power=1){const r=g.rivals[id];if(r.finish||r.hp<=0||r.recover)return false;if(r.defend){r.defend=0;emit(g,'block',actor,id,weapon);return false;}r.hp=Math.max(0,r.hp-power);r.stun=Math.max(r.stun,r.hp?18:75);cancelAttack(g,r);emit(g,r.hp?'hit':'disable',actor,id,weapon);
 if(actor===-1){g.attack_hits++;g.pursuit=Math.max(0,g.pursuit-40);g.score+=80*(g.double_ticks?2:1);if(!r.hp){const bit=1<<id;if(!(g.disabled_mask&bit)){g.disabled_mask|=bit;g.takedowns++;g.score+=250*(g.double_ticks?2:1);}if((g.contract_mask&bit)&&contractActive(g,id)&&!(g.contract_done&bit)){g.contract_done|=bit;emit(g,'contract',actor,id,weapon);}}}return true;}
function hitPlayer(g,actor){if(g.recover||g.energy_grace||!g.hull)return;g.energy_grace=30;g.hull--;g.stun=Math.max(g.stun,g.hull?18:75);g.charge=Math.max(0,g.charge-80);if(!g.hull)g.ability_ticks=0;emit(g,g.hull?'hit':'disable',actor,-1,0);}
function rivalCombat(g,n){const r=g.rivals[n];if(r.finish)return;for(const f of ['stun','cooldown','defend','boost','recover','guard_cd'])r[f]=Math.max(0,r[f]-1);
 if(!r.hp&&!r.stun){r.hp=2;r.recover=45;emit(g,'recover',n,n);}
 if((g.tick+n*37)%600===0)r.ammo=Math.min(3,r.ammo+1);if((g.tick+n*43)%900===0)r.guard=Math.min(1,r.guard+1);
 if(r.stun||!r.hp){cancelAttack(g,r);return;}
 if(r.windup){r.windup--;if(!r.windup){const human=r.attack_target===-1,t=human?null:g.rivals[r.attack_target],x=human?g.drift_x:t?.x,d=human?g.distance:t?.distance,valid=human?!g.over&&g.hull>0:!!t&&!t.finish&&t.hp>0;emit(g,'shot',n,r.attack_target,0);
  if(valid&&Math.abs(d-r.distance)<900){if(Math.abs(x-r.attack_x)>430){if(human){g.dodges++;g.charge=Math.min(900,g.charge+60);emit(g,'dodge',n,-1,0);}}else if(human&&g.counter_ticks){g.dodges++;g.charge=Math.min(900,g.charge+100);r.stun=Math.max(r.stun,30);emit(g,'counter',-1,n,0);}else if(human)hitPlayer(g,n);else hitRival(g,r.attack_target,n,0);}
  r.cooldown=240+n*30-g.difficulty*20;}}
 if(!r.stun&&!r.recover&&!r.cooldown&&!r.windup&&r.ammo&&g.tick>180){let target=-2,best=10000;const actors=[{id:-1,x:g.drift_x,distance:g.distance,hp:g.hull,finish:0,recover:g.recover},...g.rivals];for(const other of actors){const gap=other.distance-r.distance;if(other.id===n||other.finish||!other.hp||other.recover||Math.abs(gap)>700||Math.abs(gap)<40||Math.abs(other.x-r.x)>650)continue;if(other.id===-1&&g.rivals.filter(a=>a.windup&&a.attack_target===-1).length>=(g.difficulty===2?2:1))continue;const cost=Math.abs(gap)+(gap<0?150:0)+(other.id===-1?60:0);if(cost<best){best=cost;target=other.id;}}
  if(target!==-2){r.attack_target=target;r.attack_x=target===-1?g.drift_x:g.rivals[target].x;r.windup=42;r.ammo--;emit(g,'aim',n,target,0);}}
 if(g.lock_id===n&&g.lock_ticks===12&&r.guard&&!r.guard_cd&&!r.stun&&!r.recover){r.guard--;r.guard_cd=240;r.defend=18;emit(g,'guard',n,n);}
}
export function createGame(kind='drift-run'){
 if(kind!=='drift-run')throw Error('Unknown game');
 const g={kind,physics_version:12,throttle:0,brake:0,drive_remainder:0,heading:0,drift_side:0,lateral_v:0,slip_angle:0,drift_chain:0,exit_pending:0,drift_paid_distance:0,style_sectors:[0,0,0,0],spec:0,body_seq:0,side_v:0,yaw:0,yaw_v:0,rail_cd:0,impact_nx:0,impact_nz:0,impact_force:0,impact_x:0,impact_z:0,contact_seq:0,tick:0,score:0,lives:1,level:1,over:false,x:1,y:750,vx:7,vy:-10,dir:1,next_dir:1,cooldown:0,combo:0,rng:73129,energy:0,ability_ticks:0,ability_lock:0,specials:0,echo_lane:1,echo_ticks:0,loop_area:0,bodies:[],trail:[],cells:[],vehicle:0,drift_x:1000,shield:1,magnet_ticks:0,nitro:0,double_ticks:0,damage_ticks:0,distance:0,pickups:0,mode:0,speed:0,steer_v:0,drifting:0,charge:300,chain_ticks:0,style:0,draft_ticks:0,checkpoint:0,time_left:12600,pursuit:0,roadblock_next:5000,roadblock_distance:0,roadblock_seq:0,warning_ticks:0,gap_lane:1,won:0,near_misses:0,pulse:3,pulse_ticks:0,pulse_lock:0,takedowns:0,encounter:0,finish_reason:0,gadget:0,weapon_cd:0,lock_id:-1,lock_ticks:0,counter:2,counter_ticks:0,counter_cd:0,counter_lock:0,attack_hits:0,dodges:0,stun:0,position:6,sector_best:0,clean_ticks:0,reward:0,race_id:0,difficulty:0,hull:2,recover:0,impact_grace:0,energy_grace:0,pace:1660,disabled_mask:0,contract_mask:0,contract_done:0,event_seq:0,events:[],career:{credits:1200,earned:0,spent:0,rep:0,owned:1,upgrades:Array.from({length:6},()=>[0,0,0]),medals:Array(12).fill(0),races:0,wins:0,spec_best:0},rivals:[]};
 initRivals(g);return g;
}
function initRivals(g){g.rivals=Array.from({length:5},(_,id)=>({id,side_v:0,contact_cd:0,x:(id%3)*1000,distance:60+id*45,speed:0,hp:2,stun:0,cooldown:450+id*150,windup:0,attack_x:0,defend:0,target:(id%3)*1000,finish:0,boost:0,brain:0,recover:0,ammo:2,guard:1,guard_cd:0,attack_target:-2}));}
export function applyAction(g,a){
 const exact=(...keys)=>Object.keys(a).length===keys.length&&keys.every(k=>Object.hasOwn(a,k));
 const choice=(max)=>Number.isInteger(a.choice)&&a.choice>=0&&a.choice<max;
 if(a.type==='ticks'){if(!exact('type','inputs')||!Array.isArray(a.inputs)||a.inputs.length<1||a.inputs.length>120||a.inputs.some(i=>!Number.isInteger(i)||!validInput(i)))throw Error('Invalid input tape');for(const i of a.inputs)step(g,i);return;}
 if(a.type==='race'){if(!(exact('type','mode','vehicle','gadget','difficulty')||exact('type','mode','vehicle','gadget','difficulty','spec'))||a.spec!==undefined&&a.spec!==0&&a.spec!==1||![a.mode,a.vehicle,a.gadget,a.difficulty].every(Number.isInteger)||a.mode<0||a.mode>=12||a.vehicle<0||a.vehicle>=6||a.gadget<0||a.gadget>=3||a.difficulty<0||a.difficulty>2||!(g.career.owned&(1<<a.vehicle)))throw Error('Invalid race setup');const career=g.career,id=g.race_id+1;Object.assign(g,createGame());g.career=career;g.race_id=id;g.mode=a.mode;g.vehicle=a.vehicle;g.gadget=a.gadget;g.difficulty=a.difficulty;g.spec=a.spec||0;if(g.spec&&(a.mode!==0||a.vehicle!==0||a.gadget!==0||a.difficulty!==0))throw Error('Spec time attack uses the stock VANTA');g.rng=g.spec?118331:73129+id*97%100000;if(g.spec||a.mode%4===2)for(const r of g.rivals)r.finish=1;g.shield=a.difficulty===0||a.vehicle===2||a.vehicle===5?2:1;g.pursuit=a.mode%4===1?160:0;for(let n=0;n<EVENTS[g.mode].rivals;n++)g.contract_mask|=1<<((n+g.mode+g.race_id)%5);return;}
 if(a.type==='buy'){if(!exact('type','choice')||!choice(6)||g.tick&&!g.over)throw Error('Purchase unavailable');const price=VEHICLES[a.choice].price;if(g.career.owned&(1<<a.choice)||g.career.credits<price)throw Error('Car already owned or insufficient credits');g.career.credits-=price;g.career.spent+=price;g.career.owned|=1<<a.choice;return;}
 if(a.type==='upgrade'){if(!exact('type','vehicle','choice')||!choice(3)||!Number.isInteger(a.vehicle)||a.vehicle<0||a.vehicle>=6||!(g.career.owned&(1<<a.vehicle))||g.tick&&!g.over)throw Error('Upgrade unavailable');const level=g.career.upgrades[a.vehicle][a.choice],price=UPGRADES[a.choice].cost*(level+1);if(level>=3||g.career.credits<price)throw Error('Upgrade capped or insufficient credits');g.career.credits-=price;g.career.spent+=price;g.career.upgrades[a.vehicle][a.choice]++;return;}
 throw Error('Unknown action');
}
export function step(g,i){
 if(g.over)return;const control=readInput(i);i=control.flags;const contactBefore={x:g.drift_x,distance:g.distance,rivals:g.rivals.map(r=>({x:r.x,distance:r.distance})),bodies:new Map(g.bodies.map(b=>[b,{x:b.x,distance:g.distance+830-b.y}]))};g.tick++;g.events=[];g.rail_cd=Math.max(0,g.rail_cd-1);g.side_v=trunc(g.side_v*(g.drifting?96:88)/100);g.yaw_v=trunc(g.yaw_v*72/100);g.yaw=clamp(trunc((g.yaw+g.yaw_v)*90/100),-500,500);
 const stage=EVENTS[g.mode],type=stage.type,car=VEHICLES[g.vehicle],up=g.spec?[0,0,0]:g.career.upgrades[g.vehicle],rand=()=>g.rng=g.rng*16807%2147483647;
 const award=n=>g.score+=n*(g.double_ticks?2:1),body=(x,y,vx,vy,tag)=>g.bodies.push({id:++g.body_seq,x,y,vx,vy,tag,life:tag===11?360:0,age:0,contact_cd:0});
 for(const f of ['ability_ticks','echo_ticks','magnet_ticks','double_ticks','damage_ticks','chain_ticks','pulse_ticks','weapon_cd','counter_ticks','counter_cd','stun','recover','impact_grace','energy_grace'])g[f]=Math.max(0,g[f]-1);
 if(!g.hull&&!g.stun){g.hull=2;g.recover=45;emit(g,'recover');}g.time_left--;if(!g.chain_ticks)g.combo=0;
 if((i&64)&&!g.counter_lock&&!g.counter_cd&&g.counter&&g.hull){g.counter--;g.counter_ticks=45;g.counter_cd=210;emit(g,'guard');}g.counter_lock=i&64?1:0;
 let target=-1,best=901;for(const r of g.rivals){const gap=r.distance-g.distance;if(!r.finish&&r.hp>0&&!r.stun&&!r.recover&&gap>30&&gap<best&&Math.abs(r.x-g.drift_x)<480){target=r.id;best=gap;}}
 g.lock_ticks=target>=0?(target===g.lock_id?Math.min(LOCK_TICKS,g.lock_ticks+1):1):0;g.lock_id=target;
 if((i&32)&&!g.pulse_lock&&!g.weapon_cd&&g.pulse>=WEAPON_COST[g.gadget]&&g.hull&&(g.gadget!==0||g.lock_ticks>=LOCK_TICKS)){
  g.pulse-=WEAPON_COST[g.gadget];g.pulse_ticks=24;g.weapon_cd=WEAPON_COOLDOWN[g.gadget]-up[2]*10;emit(g,'shot',-1,g.gadget===0?g.lock_id:-2,g.gadget);
  if(g.gadget===0)hitRival(g,g.lock_id,-1,0,2);else if(g.gadget===1){const targets=weaponTargets(g).sort((a,b)=>Math.abs(a.distance-g.distance)-Math.abs(b.distance-g.distance)||a.id-b.id).slice(0,2);for(const r of targets)hitRival(g,r.id,-1,1);}else body(g.drift_x,900,0,0,11);
 }g.pulse_lock=i&32?1:0;
 if(g.tick%(360-up[2]*20)===0)g.pulse=Math.min(4,g.pulse+1);
 if((i&12)||control.brake||!control.throttle)g.ability_ticks=0;
 if((i&16)&&!(i&12)&&control.throttle>0&&!control.brake&&!g.ability_lock&&!g.ability_ticks&&g.hull&&(g.charge>=300||g.nitro)){let tier=3;if(g.nitro)g.nitro--;else{tier=Math.floor(g.charge/300);g.charge-=tier*300;}g.ability_ticks=24+tier*18+up[2]*6+(g.vehicle===3?10:0);g.specials++;}g.ability_lock=i&16?1:0;
 const brake=control.brake,curve=curvature(g.distance,g.mode),demand=control.steering,driftIntent=Boolean(i&8)&&Math.abs(demand)>4&&g.speed>=850;
 if(!driftIntent)g.drift_side=0;else if((!g.drift_side||g.drift_side*demand<0&&Math.abs(demand)>65)&&Math.abs(demand)>4)g.drift_side=Math.sign(demand);
 const maxTurn=car.turn+up[1]*3+(driftIntent?12:0),desired=trunc(maxTurn*demand/100),response=g.vehicle===1?38:g.vehicle===2?24:32;
 const delta=desired-g.steer_v;g.steer_v+=Math.sign(delta)*Math.max(0,Math.min(Math.abs(delta),Math.max(1,trunc(Math.abs(delta)*response/100))));
 const aim=g.steer_v*2+(driftIntent?g.drift_side*220:0),hd=aim-g.heading;g.heading+=clamp(hd,-42,42);
 const targetLateral=trunc(g.steer_v*g.speed/2000),grip=driftIntent?18+up[1]*2:43+up[1]*3;
 const lv=targetLateral-g.lateral_v;g.lateral_v+=Math.sign(lv)*Math.min(Math.abs(lv),Math.max(1,trunc(Math.abs(lv)*grip/100)));
 g.slip_angle=g.speed>500?g.heading-trunc(g.lateral_v*4000/g.speed):0;
 g.drifting=g.speed>=850&&Math.abs(g.slip_angle)>=60&&Math.abs(g.heading)>=80?1:0;
 const slip=-trunc(curve*Math.max(0,g.speed-1050)/(260+up[1]*45+(driftIntent?100:0)));
 g.drift_x+=g.lateral_v+slip+trunc(g.side_v/4)+trunc(g.yaw*g.speed/4000);

 const old=g.x;g.x=clamp(Math.floor((g.drift_x+500)/1000),0,2);if(old!==g.x){g.echo_lane=old;g.echo_ticks=20;}
 drive(g,control,i,up);resolveRail(g,(kind)=>emit(g,kind),()=>crash(g));let advance=trunc(g.speed/100);const initialDistance=g.distance;g.distance=Math.max(0,g.distance+advance);advance=g.distance-initialDistance;g.level=1+Math.floor(g.distance/(stage.distance/4));g.encounter=Math.floor(g.distance/9000)%4;
 const controlled=g.drifting&&Math.abs(curve)>=2&&g.heading*curve>0&&Math.abs(g.slip_angle)<=320&&g.clean_ticks>15&&g.distance>g.drift_paid_distance+18;
 const styleAward=n=>{g.style+=n;g.style_sectors[sectorIndex(g)]+=n;award(n);};
 if(controlled){g.drift_chain++;g.exit_pending=60;g.chain_ticks=150;if(g.tick%3===0){g.drift_paid_distance=g.distance;g.charge=Math.min(900,g.charge+(g.vehicle===1?12:9));styleAward(8*(1+Math.floor(g.combo/3)));}if(g.tick%24===0)g.combo=Math.min(12,g.combo+1);}
 else if(g.exit_pending){g.exit_pending--;if(g.drift_chain>=9&&Math.abs(g.slip_angle)<35&&Math.abs(g.heading)<130&&g.clean_ticks>15){styleAward(Math.min(90,35+g.drift_chain));g.charge=Math.min(900,g.charge+35);emit(g,'clean-exit');g.exit_pending=g.drift_chain=0;}else if(!g.exit_pending||g.clean_ticks<=15)g.exit_pending=g.drift_chain=0;}

 const drafting=g.rivals.some(r=>r.distance-g.distance>60&&r.distance-g.distance<700&&Math.abs(r.x-g.drift_x)<360)||g.bodies.some(b=>b.tag===1&&b.y>250&&b.y<725&&Math.abs(b.x-g.drift_x)<300);g.draft_ticks=drafting?Math.min(90,g.draft_ticks+1):Math.max(0,g.draft_ticks-3);if(g.draft_ticks>=12)g.charge=Math.min(900,g.charge+3);
 g.pace=trunc((g.pace*59+clamp(g.speed,1450,2300)+30)/60);g.clean_ticks++;if(g.tick%30===0)g.charge=Math.min(900,g.charge+12);
 for(let n=0;n<g.rivals.length;n++)rivalCombat(g,n);
 for(let n=0;n<g.rivals.length;n++){
  const r=g.rivals[n];if(r.finish)continue;const gap=r.distance-g.distance;
  if(g.tick%15===n*3&&!r.stun){let bestCost=1e9;for(let lane=0;lane<3;lane++){const x=lane*1000;let cost=Math.abs(r.x-x)*3+Math.abs(curvature(r.distance,g.mode)*120+1000-x);
   for(const b of g.bodies)if(b.tag===1||b.tag===8){const absolute=g.distance+830-b.y,d=absolute-r.distance;if(d>0&&d<(b.tag===8?2800:600))cost+=Math.max(0,(b.tag===8?790:650)-Math.abs(b.x-x))*(b.tag===8?500:120);}
   for(const other of g.rivals)if(other.id!==n&&other.distance-r.distance>0&&other.distance-r.distance<500)cost+=Math.max(0,550-Math.abs(other.x-x))*60;
   if(Math.abs(gap)<700&&(gap<0||g.difficulty<2))cost+=Math.max(0,600-Math.abs(g.drift_x-x))*60;
   if(g.difficulty===2&&n===1&&gap>150&&gap<650)cost-=Math.max(0,400-Math.abs(g.drift_x-x))*20;
   if(cost<bestCost){bestCost=cost;r.target=x;}}
   r.brain=gap<0?1:n===1?2:0;
  }
  r.side_v=trunc(r.side_v*88/100);r.contact_cd=Math.max(0,r.contact_cd-1);r.x=clamp(r.x+clamp(r.target-r.x,-(r.stun?5:18+n*2),r.stun?5:18+n*2)+trunc(r.side_v/4),-650,2650);
  if(!r.stun&&g.tick%(540+n*37)===n*23)r.boost=60;
  let desired=r.stun?1100:g.pace-35+n*18+g.difficulty*45+clamp(trunc(-gap/12),-90,90)+(r.boost?220:0)-Math.abs(curvature(r.distance,g.mode))*18;
  if(gap<0&&gap> -600&&Math.abs(r.x-g.drift_x)<450)desired=Math.min(desired,Math.max(650,g.speed-50));
  for(const b of g.bodies)if(b.tag===1||b.tag===8){const d=g.distance+830-b.y-r.distance;if(d>0&&d<(b.tag===8?1000:200)&&Math.abs(b.x-r.x)<(b.tag===8?790:360))desired=Math.min(desired,b.tag===8?Math.max(0,trunc((d-35)*2)):900);}
  const push=Math.max(1,trunc((1200*(100-trunc(r.speed*60/1660))/100-60-trunc(420*r.speed*r.speed/2755600))/100))+(r.boost?5:0);r.speed=r.stun?Math.max(0,r.speed-5):r.speed+clamp(desired-r.speed,-15,push);r.distance=Math.max(0,r.distance+trunc(r.speed/100));

  if(r.distance>=stage.distance){r.distance=stage.distance;r.finish=g.tick;}
 }
 if(type===1&&g.distance>1200&&g.tick%3===0)g.pursuit=clamp(g.pursuit+(g.ability_ticks?-5:g.speed<1100?3:g.speed>=Math.max(1150,car.speed+up[0]*70-Math.abs(curve)*20-120)?-2:1),0,1000);
 // Commit physical rows well ahead of every actor. Their absolute position
 // never follows the player, and a full collision-safe lane stays open.
 if(type===1&&g.distance+3600>=g.roadblock_next&&g.roadblock_next<stage.distance-1800){
  const front=Math.max(g.distance,...g.rivals.filter(r=>!r.finish).map(r=>r.distance));
  let distance=Math.max(g.roadblock_next,front+3000);const base=distance;
  while(distance<=base+2000&&!readableRoadblockSite(distance,g.mode))distance+=200;
  if(distance<=base+2000&&distance<stage.distance-1000){g.gap_lane=(g.gap_lane+1+rand()%2)%3;g.roadblock_distance=distance;g.roadblock_seq++;
   for(let lane=0;lane<3;lane++)if(lane!==g.gap_lane&&(g.roadblock_seq%3!==0||lane===(g.gap_lane+1)%3))body(lane*1000,initialDistance+830-distance,0,0,8);
  }g.roadblock_next=distance+(distance>base+2000?1000:11000);
 }
 g.warning_ticks=type===1&&g.roadblock_distance>g.distance?Math.min(300,trunc((g.roadblock_distance-g.distance)*100/Math.max(350,g.speed))):0;
 if(g.speed>300&&g.tick%(type===2?210:135)===1&&Math.abs(g.roadblock_distance-g.distance)>2500){const lane=rand()%3;body(lane*1000,-100,g.encounter===1?(lane===2?-5:5):0,6,1);for(let j=0;j<3;j++)body(((lane+1)%3)*1000,-200-j*80,0,0,2);}
 if(g.speed>300&&g.tick%135===55&&Math.abs(g.roadblock_distance-g.distance-830)>900)body((rand()%3)*1000,0,0,0,3+Math.floor(g.tick/135)%5);
 if(g.speed>300&&g.tick%240===100&&Math.abs(g.roadblock_distance-g.distance-830)>1400)body((rand()%3)*1000,0,0,0,10);
 for(const b of g.bodies){if(!b.tag)continue;b.contact_cd=Math.max(0,b.contact_cd-1);const oldY=b.y;if(b.tag===1)guideTraffic(g,b);b.x+=b.vx;if(b.tag!==11&&(b.x<0||b.x>2000)){b.x=clamp(b.x,0,2000);b.vx=-b.vx||0;}b.y+=advance-b.vy;const lateral=Math.abs(b.x-g.drift_x),aligned=lateral<320;
  if(b.tag===11){b.age++;b.life--;if(b.age>=9)for(const r of g.rivals)if(!r.finish&&r.hp>0&&!r.recover&&Math.abs(g.distance+830-b.y-r.distance)<90&&Math.abs(r.x-b.x)<480){hitRival(g,r.id,-1,2,2);b.tag=0;break;}continue;}
  if(b.tag===1&&oldY<830&&b.y>=830&&lateral>=320&&lateral<=900){g.charge=Math.min(900,g.charge+100);g.combo=Math.min(12,g.combo+1);g.chain_ticks=150;g.near_misses++;const n=35*(1+Math.floor(g.combo/3));g.style+=n;award(n);g.pursuit=Math.max(0,g.pursuit-45);}
  if(Math.abs(b.y-830)>=42)continue;
  if((b.tag===1||b.tag===8)&&aligned){}
  else if(b.tag===2&&(aligned||g.magnet_ticks)){award(25);g.charge=Math.min(900,g.charge+55);g.pickups++;b.tag=0;}
  else if(b.tag>=3&&b.tag<=7&&aligned){if(b.tag===3)g.shield=Math.min(2,g.shield+1);if(b.tag===4)g.magnet_ticks=180;if(b.tag===5)g.nitro=Math.min(2,g.nitro+1);if(b.tag===6){g.pulse=Math.min(4,g.pulse+1);g.counter=Math.min(3,g.counter+1);}if(b.tag===7)g.double_ticks=180;award(40);g.pickups++;b.tag=0;}
  else if(b.tag===10&&lateral<550){g.charge=Math.min(900,g.charge+250);g.ability_ticks=Math.max(g.ability_ticks,30);g.specials++;g.pickups++;b.tag=0;award(75);}
 }
 const lastActor=Math.min(g.distance,...g.rivals.filter(r=>!r.finish).map(r=>r.distance));g.bodies=g.bodies.filter(b=>b.tag&&(b.tag===11?b.life>0:b.tag===8?g.distance+830-b.y>=lastActor-350:b.y> -2000&&b.y<1100));resolveObstacleActors(g,contactBefore,(id)=>hitRival(g,id,-2,3,1));resolveContacts(g,contactBefore,(kind,id)=>{if(kind==='ram')hitRival(g,id,-1,3);else emit(g,kind,id);},()=>crash(g));resolveObstacleActors(g,contactBefore,(id)=>hitRival(g,id,-2,3,1));const cp=Math.min(3,Math.floor(g.distance/(stage.distance/4)));if(!g.over&&cp>g.checkpoint){g.checkpoint=cp;g.shield=Math.min(2,g.shield+1);g.pulse=Math.min(4,g.pulse+1);g.counter=Math.min(3,g.counter+1);g.charge=Math.min(900,g.charge+300);award(100);}
 g.position=g.spec||type===2?1:1+g.rivals.filter(r=>r.finish||r.distance>g.distance).length;g.energy=Math.floor(g.charge/300);if(g.tick%15===0)award(1);
 if(!g.over&&(!g.time_left||g.pursuit>=1000)){g.over=true;g.finish_reason=g.time_left?4:3;}
 if(!g.over&&g.distance>=stage.distance){g.won=(g.spec||type!==0||g.position<=3)&&(type!==2||styleComplete(g))&&(type!==3||(g.contract_done&g.contract_mask)===g.contract_mask)?1:0;g.over=true;g.finish_reason=g.won?1:type===0?7:type===2?5:6;if(g.won)award(500+Math.floor(g.time_left/3));}
 if(g.over&&!g.reward){if(g.spec&&g.won&&(!g.career.spec_best||g.tick<g.career.spec_best))g.career.spec_best=g.tick;const finished=g.distance>=stage.distance,reward=finished?400+(7-g.position)*140+g.won*300+Math.min(300,Math.floor(g.style/40))+g.takedowns*60:Math.min(180,Math.floor(g.distance/300));g.reward=Math.max(1,Math.floor(reward*(100+g.difficulty*25)/100));g.career.credits+=g.reward;g.career.earned+=g.reward;g.career.races++;g.career.rep+=g.won?100:finished?40:5;if(g.won){g.career.wins++;g.career.medals[g.mode]=Math.max(g.career.medals[g.mode],g.position===1?3:g.position<=3?2:1);}}
}
function crash(g){if(g.over||g.impact_grace)return;g.impact_grace=36;g.damage_ticks=15;g.clean_ticks=0;if(g.shield){g.shield--;emit(g,'collision');if(!g.shield)emit(g,'shield-break');g.combo=0;g.chain_ticks=0;g.drift_chain=g.exit_pending=0;g.pursuit=Math.min(1000,g.pursuit+100);}else{g.lives=0;g.over=true;g.finish_reason=2;emit(g,'wreck');}}
