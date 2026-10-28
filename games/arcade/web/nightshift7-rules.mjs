// Version 7: deterministic integer 30 Hz career/racing rules. Mirrored in native/src/game.rs.
export const VEHICLES=[
{name:'VANTA',model:'RS / STREET',color:'#b8d1dc',role:'Balanced street coupe',price:0,speed:1660,turn:70},
{name:'KITE',model:'RX / DRIFT',color:'#e9a340',role:'Agile drift specialist',price:1800,speed:1600,turn:86},
{name:'ATLAS',model:'GT / PURSUIT',color:'#638f91',role:'Armored grand tourer',price:2600,speed:1570,turn:62},
{name:'VELA',model:'R / HYPER',color:'#d65852',role:'High-speed interceptor',price:4200,speed:1810,turn:72},
{name:'ION',model:'EV / CIRCUIT',color:'#90e8bd',role:'Instant torque, precise grip',price:3200,speed:1720,turn:78},
{name:'ONYX',model:'RX / WIDEBODY',color:'#b49de3',role:'Heavy combat coupe',price:3800,speed:1690,turn:68}
];
export const RIVALS=['MICA','ROOK','JINX','ECHO','SABLE'];
export const GADGETS=[{name:'LOCK EMP',detail:'Track a racer ahead. Lock for 0.6 s, then fire. Two hits disable a rival.'},{name:'SHOCKWAVE',detail:'Hit every racer within 36 m. No lock required. One damage.'},{name:'REAR MINE',detail:'Drop a visible trap behind. One damage; three seconds of disruption.'}];
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
  "detail": "13.5 km \u00b7 3\u20137 min \u00b7 3,500 style",
  "distance": 135000,
  "type": 2,
  "style": 3500,
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
  "brief": "Disable marked racers with timed attacks. Their defenses leave openings."
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
  "detail": "14 km \u00b7 3\u20137 min \u00b7 5,000 style",
  "distance": 140000,
  "type": 2,
  "style": 5000,
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
  "brief": "Disable marked racers with timed attacks. Their defenses leave openings."
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
  "detail": "14.5 km \u00b7 3\u20137 min \u00b7 6,500 style",
  "distance": 145000,
  "type": 2,
  "style": 6500,
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
  "brief": "Disable marked racers with timed attacks. Their defenses leave openings."
 }
];
export const ENCOUNTERS=['SLIPSTREAM','CROSS TRAFFIC','DRIFT ZONE','BOOST STRIP'];
export const PICKUPS={2:{name:'CHARGE',glyph:'+',color:'#ffd26c'},3:{name:'SHIELD',glyph:'S',color:'#45e9ff'},4:{name:'MAGNET',glyph:'M',color:'#bf86ff'},5:{name:'NITRO',glyph:'N',color:'#6affb7'},6:{name:'AMMO',glyph:'E',color:'#ff779e'},7:{name:'DOUBLE',glyph:'2x',color:'#ffd24c'},10:{name:'BOOST',glyph:'>>',color:'#7cfff3'},11:{name:'MINE',glyph:'!',color:'#ff9966'}};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),trunc=Math.trunc;
export const TRACK_CURVES=[[0,0,1,1,2,2,1,0,0,-1,-2,-2,-1,0,0,1,2,2,1,0,-1,-1,0,0,1,1,0,-1,-1,0,0,0],[0,1,2,4,4,2,0,-1,-3,-4,-4,-2,0,1,3,3,1,0,-2,-4,-3,-1,0,2,4,3,1,0,-2,-2,0,0],[0,1,2,2,1,-1,-2,-2,-1,1,3,2,0,-2,-3,-1,1,2,1,-1,-2,-1,1,3,2,0,-2,-2,-1,0,0,0],[0,0,0,3,3,0,0,0,-3,-3,0,0,2,2,0,0,-2,-2,0,0,4,2,0,0,-4,-2,0,0,1,1,0,0],[0,0,0,1,1,1,0,0,0,-1,-1,-1,0,0,1,1,1,1,0,0,0,-1,-1,-1,-1,0,0,1,1,0,0,0],[0,0,1,2,2,2,1,0,0,0,-1,-2,-2,-2,-1,0,0,0,1,1,2,2,1,0,0,-1,-2,-1,0,0,0,0],[0,2,4,4,2,-1,-3,-4,-3,-1,2,4,4,2,0,-2,-4,-4,-2,0,2,3,3,1,-1,-3,-3,-1,1,1,0,0],[0,-1,-2,-3,-1,0,2,3,4,2,0,-2,-3,-1,0,2,2,1,-1,-3,-4,-2,0,1,3,2,0,-1,-1,0,0,0],[0,0,1,1,0,0,-2,-2,0,0,2,2,0,0,1,1,0,0,-1,-1,0,0,-2,-2,0,0,2,2,0,0,0,0],[0,0,-1,-1,-2,-2,-1,0,2,3,2,0,-1,-2,-1,0,0,1,2,3,2,0,-1,-3,-2,0,1,1,0,0,0,0],[0,2,2,2,0,-2,-2,-2,0,3,3,0,-3,-3,0,2,2,0,-2,-2,0,3,3,0,-3,-3,0,2,1,0,0,0],[0,0,1,2,1,0,-1,-2,-1,0,0,2,3,2,0,0,-2,-3,-2,0,0,1,2,1,0,-1,-2,-1,0,0,0,0]];
export const curvature=(d,mode=0)=>TRACK_CURVES[mode][Math.max(0,Math.min(31,Math.floor(d*32/EVENTS[mode].distance)))];
export function createGame(kind='drift-run'){
 if(kind!=='drift-run')throw Error('Unknown game');
 const g={kind,tick:0,score:0,lives:1,level:1,over:false,x:1,y:750,vx:7,vy:-10,dir:1,next_dir:1,cooldown:0,combo:0,rng:73129,energy:0,ability_ticks:0,ability_lock:0,specials:0,echo_lane:1,echo_ticks:0,loop_area:0,bodies:[],trail:[],cells:[],vehicle:0,drift_x:1000,shield:1,magnet_ticks:0,nitro:0,double_ticks:0,damage_ticks:0,distance:0,pickups:0,mode:0,speed:1000,steer_v:0,drifting:0,charge:300,chain_ticks:0,style:0,draft_ticks:0,checkpoint:0,time_left:12600,pursuit:0,warning_ticks:0,gap_lane:1,won:0,near_misses:0,pulse:2,pulse_ticks:0,pulse_lock:0,takedowns:0,encounter:0,finish_reason:0,gadget:0,weapon_cd:0,lock_id:-1,lock_ticks:0,counter:2,counter_ticks:0,counter_cd:0,counter_lock:0,attack_hits:0,dodges:0,stun:0,position:6,sector_best:0,clean_ticks:0,reward:0,race_id:0,difficulty:0,career:{credits:1200,earned:0,spent:0,rep:0,owned:1,upgrades:Array.from({length:6},()=>[0,0,0]),medals:Array(12).fill(0),races:0,wins:0},rivals:[]};
 initRivals(g);return g;
}
function initRivals(g){g.rivals=Array.from({length:5},(_,id)=>({id,x:(id%3)*1000,distance:60+id*80,speed:1000,hp:2,stun:0,cooldown:450+id*150,windup:0,attack_x:0,defend:0,target:(id%3)*1000,finish:0,boost:0,brain:0}));}
export function applyAction(g,a){
 const exact=(...keys)=>Object.keys(a).length===keys.length&&keys.every(k=>Object.hasOwn(a,k));
 const choice=(max)=>Number.isInteger(a.choice)&&a.choice>=0&&a.choice<max;
 if(a.type==='ticks'){if(!exact('type','inputs')||!Array.isArray(a.inputs)||a.inputs.length<1||a.inputs.length>120||a.inputs.some(i=>!Number.isInteger(i)||i<0||i>127))throw Error('Invalid input tape');for(const i of a.inputs)step(g,i);return;}
 if(a.type==='race'){if(!exact('type','mode','vehicle','gadget','difficulty')||![a.mode,a.vehicle,a.gadget,a.difficulty].every(Number.isInteger)||a.mode<0||a.mode>=12||a.vehicle<0||a.vehicle>=6||a.gadget<0||a.gadget>=3||a.difficulty<0||a.difficulty>2||!(g.career.owned&(1<<a.vehicle)))throw Error('Invalid race setup');const career=g.career,id=g.race_id+1;Object.assign(g,createGame());g.career=career;g.race_id=id;g.mode=a.mode;g.vehicle=a.vehicle;g.gadget=a.gadget;g.difficulty=a.difficulty;g.rng=73129+id*97%100000;g.shield=a.vehicle===2||a.vehicle===5?2:1;g.pursuit=a.mode%4===1?160:0;return;}
 if(a.type==='buy'){if(!exact('type','choice')||!choice(6)||g.tick&&!g.over)throw Error('Purchase unavailable');const price=VEHICLES[a.choice].price;if(g.career.owned&(1<<a.choice)||g.career.credits<price)throw Error('Car already owned or insufficient credits');g.career.credits-=price;g.career.spent+=price;g.career.owned|=1<<a.choice;return;}
 if(a.type==='upgrade'){if(!exact('type','vehicle','choice')||!choice(3)||!Number.isInteger(a.vehicle)||a.vehicle<0||a.vehicle>=6||!(g.career.owned&(1<<a.vehicle))||g.tick&&!g.over)throw Error('Upgrade unavailable');const level=g.career.upgrades[a.vehicle][a.choice],price=UPGRADES[a.choice].cost*(level+1);if(level>=3||g.career.credits<price)throw Error('Upgrade capped or insufficient credits');g.career.credits-=price;g.career.spent+=price;g.career.upgrades[a.vehicle][a.choice]++;return;}
 throw Error('Unknown action');
}
export function step(g,i){
 if(g.over)return;g.tick++;
 const stage=EVENTS[g.mode],type=stage.type,car=VEHICLES[g.vehicle],up=g.career.upgrades[g.vehicle],rand=()=>g.rng=g.rng*16807%2147483647;
 const award=n=>g.score+=n*(g.double_ticks?2:1),body=(x,y,vx,vy,tag)=>g.bodies.push({x,y,vx,vy,tag});
 for(const f of ['ability_ticks','echo_ticks','magnet_ticks','double_ticks','damage_ticks','chain_ticks','pulse_ticks','weapon_cd','counter_ticks','counter_cd','stun'])g[f]=Math.max(0,g[f]-1);
 g.time_left--;if(!g.chain_ticks)g.combo=0;
 if((i&64)&&!g.counter_lock&&!g.counter_cd&&g.counter){g.counter--;g.counter_ticks=45;g.counter_cd=210;}g.counter_lock=i&64?1:0;
 let target=-1,best=901;for(const r of g.rivals){const gap=r.distance-g.distance;if(!r.finish&&!r.stun&&gap>30&&gap<best&&Math.abs(r.x-g.drift_x)<480){target=r.id;best=gap;}}
 g.lock_ticks=target>=0?(target===g.lock_id?Math.min(30,g.lock_ticks+1):1):0;g.lock_id=target;
 if((i&32)&&!g.pulse_lock&&!g.weapon_cd&&g.pulse&&(g.gadget!==0||g.lock_ticks>=18)){
  g.pulse--;g.pulse_ticks=24;g.weapon_cd=150-up[2]*20;
  for(const r of g.rivals){const gap=r.distance-g.distance,hit=g.gadget===0?r.id===g.lock_id:g.gadget===1?Math.abs(gap)<360:false;if(!hit||r.finish)continue;if(r.defend){r.defend=0;continue;}r.hp--;r.stun=Math.max(r.stun,18);g.attack_hits++;award(80);if(r.hp<=0){r.stun=210;r.hp=2;g.takedowns++;award(250);}}
  if(g.gadget===2)body(g.drift_x,900,0,0,11);
  g.pursuit=Math.max(0,g.pursuit-80);
 }g.pulse_lock=i&32?1:0;
 if(g.tick%(900-up[2]*90)===0)g.pulse=Math.min(3,g.pulse+1);
 if((i&16)&&!g.ability_lock&&!g.ability_ticks&&(g.charge>=300||g.nitro)){let tier=3;if(g.nitro)g.nitro--;else{tier=Math.floor(g.charge/300);g.charge-=tier*300;}g.ability_ticks=24+tier*18+up[2]*6+(g.vehicle===3?10:0);g.specials++;}g.ability_lock=i&16?1:0;
 const dir=(i&1)&&!(i&2)?-1:(i&2)&&!(i&1)?1:0,brake=Boolean(i&8),curve=curvature(g.distance,g.mode);g.drifting=brake&&(dir!==0||Math.abs(g.steer_v)>20)&&g.speed>=900?1:0;
 const maxTurn=car.turn+up[1]*3+(g.drifting?12:0);g.steer_v=dir?clamp(g.steer_v+dir*(g.drifting?15:11),-maxTurn,maxTurn):(trunc(g.steer_v*65/100)||0);
 const slip=trunc(curve*Math.max(0,g.speed-1250)/(110+up[1]*35+(g.drifting?120:0)));g.drift_x+=g.steer_v+slip;
 if(g.drift_x< -340||g.drift_x>2340){g.drift_x=clamp(g.drift_x,-340,2340);g.steer_v=0;g.speed=Math.max(500,g.speed-65);g.combo=0;g.chain_ticks=0;g.drifting=0;}
 const old=g.x;g.x=clamp(Math.floor((g.drift_x+500)/1000),0,2);if(old!==g.x){g.echo_lane=old;g.echo_ticks=20;}
 const speedTarget=(g.stun?900:brake?(g.drifting?1280:750):car.speed+up[0]*70)+(g.ability_ticks?800:0),acc=g.ability_ticks?55:brake?32:g.vehicle===4?30:20;
 g.speed=clamp(g.speed+clamp(speedTarget-g.speed,-acc,acc),500,2500);const advance=Math.floor(g.speed/100);g.distance+=advance;g.level=1+Math.floor(g.distance/(stage.distance/4));g.encounter=Math.floor(g.distance/9000)%4;
 if(g.drifting&&Math.abs(g.steer_v)>28){g.chain_ticks=150;g.charge=Math.min(900,g.charge+(g.vehicle===1?8:6));if(g.tick%3===0){const n=4*(1+Math.floor(g.combo/3))*(g.encounter===2?2:1);g.style+=n;award(n);}if(g.tick%24===0)g.combo=Math.min(12,g.combo+1);}
 const drafting=g.rivals.some(r=>r.distance-g.distance>60&&r.distance-g.distance<700&&Math.abs(r.x-g.drift_x)<360)||g.bodies.some(b=>b.tag===1&&b.y>250&&b.y<725&&Math.abs(b.x-g.drift_x)<300);g.draft_ticks=drafting?Math.min(90,g.draft_ticks+1):Math.max(0,g.draft_ticks-3);if(g.draft_ticks>=12)g.charge=Math.min(900,g.charge+3);
 g.clean_ticks++;if(g.tick%30===0)g.charge=Math.min(900,g.charge+12);
 for(let n=0;n<g.rivals.length;n++){
  const r=g.rivals[n];if(r.finish)continue;for(const f of ['stun','cooldown','defend','boost'])r[f]=Math.max(0,r[f]-1);
  const gap=r.distance-g.distance;
  if(r.windup){r.windup--;if(!r.windup){if(g.counter_ticks||Math.abs(g.drift_x-r.attack_x)>430||Math.abs(gap)>1000){g.dodges++;g.charge=Math.min(900,g.charge+140);r.stun=g.counter_ticks?60:r.stun;}else{g.stun=45;g.charge=Math.max(0,g.charge-140);g.damage_ticks=9;}r.cooldown=450+n*60-g.difficulty*60;}}
  if(!r.stun&&!r.cooldown&&!r.windup&&Math.abs(gap)<800&&g.tick>360){r.windup=42;r.attack_x=g.drift_x;}
  if(g.lock_id===n&&g.lock_ticks===12&&!r.stun&&(g.tick+n*31)%3===0)r.defend=30;
  if(g.tick%15===n*3&&!r.stun){let bestCost=1e9;for(let lane=0;lane<3;lane++){const x=lane*1000;let cost=Math.abs(r.x-x)*3+Math.abs(curvature(r.distance,g.mode)*120+1000-x);
   for(const b of g.bodies)if(b.tag===1||b.tag===8){const absolute=g.distance+830-b.y,d=absolute-r.distance;if(d>0&&d<600)cost+=Math.max(0,650-Math.abs(b.x-x))*120;}
   for(const other of g.rivals)if(other.id!==n&&other.distance-r.distance>0&&other.distance-r.distance<500)cost+=Math.max(0,550-Math.abs(other.x-x))*60;
   if(gap<0&&gap> -700)cost+=Math.max(0,600-Math.abs(g.drift_x-x))*60;
   if(n===1&&gap>150&&gap<650)cost-=Math.max(0,400-Math.abs(g.drift_x-x))*20;
   if(cost<bestCost){bestCost=cost;r.target=x;}}
   r.brain=gap<0?1:n===1?2:0;
  }
  r.x+=clamp(r.target-r.x,-(r.stun?5:18+n*2),r.stun?5:18+n*2);
  if(!r.stun&&g.tick%(540+n*37)===n*23)r.boost=60;
  let desired=r.stun?650:1520+n*70+g.difficulty*120+(r.boost?320:0)-Math.abs(curvature(r.distance,g.mode))*32;
  if(gap<0&&gap> -600&&Math.abs(r.x-g.drift_x)<450)desired=Math.min(desired,Math.max(650,g.speed-50));
  for(const b of g.bodies)if(b.tag===1||b.tag===8){const d=g.distance+830-b.y-r.distance;if(d>0&&d<200&&Math.abs(b.x-r.x)<360)desired=Math.min(desired,900);}
  r.speed+=clamp(desired-r.speed,-32,18);r.distance+=Math.max(5,Math.floor(r.speed/100));
  if(Math.abs(r.distance-g.distance)<38&&Math.abs(r.x-g.drift_x)<330&&!r.stun){if(g.shield&&g.ability_ticks){r.hp--;r.stun=90;g.attack_hits++;if(r.hp<=0){r.hp=2;r.stun=210;g.takedowns++;}}if(Math.abs(r.speed-g.speed)>420||g.ability_ticks)crash(g);else g.speed=Math.max(500,g.speed-80);r.stun=Math.max(r.stun,20);r.x=clamp(r.x+(r.x>=g.drift_x?160:-160),0,2000);}
  if(r.distance>=stage.distance){r.distance=stage.distance;r.finish=g.tick;}
 }
 if(type===1&&g.tick%3===0)g.pursuit=clamp(g.pursuit+(g.ability_ticks?-5:g.speed<1100?3:g.speed>=1700?-2:1),0,1000);
 const phase=g.tick%600;if(type===1&&phase===200){g.gap_lane=rand()%3;g.warning_ticks=60;}else if(g.warning_ticks&&!--g.warning_ticks)for(let l=0;l<3;l++)if(l!==g.gap_lane)body(l*1000,0,0,0,8);
 if(g.tick%135===1){const lane=rand()%3;body(lane*1000,-100,g.encounter===1?(lane===2?-5:5):0,6,1);for(let j=0;j<3;j++)body(((lane+1)%3)*1000,-200-j*80,0,0,2);}
 if(g.tick%135===55)body((rand()%3)*1000,0,0,0,3+Math.floor(g.tick/135)%5);
 if(g.tick%240===100)body((rand()%3)*1000,0,0,0,10);
 for(const b of g.bodies){if(!b.tag)continue;const oldY=b.y;b.x+=b.vx;if(b.x<0||b.x>2000){b.x=clamp(b.x,0,2000);b.vx=-b.vx;}b.y+=Math.max(3,advance-b.vy);const lateral=Math.abs(b.x-g.drift_x),aligned=lateral<320;
  if(b.tag===11){for(const r of g.rivals)if(!r.finish&&Math.abs(g.distance+830-b.y-r.distance)<70&&Math.abs(r.x-b.x)<420){if(!r.defend){r.hp--;r.stun=90;g.attack_hits++;if(r.hp<=0){r.hp=2;r.stun=210;g.takedowns++;}}b.tag=0;break;}continue;}
  if(b.tag===1&&oldY<830&&b.y>=830&&lateral>=320&&lateral<=900){g.charge=Math.min(900,g.charge+100);g.combo=Math.min(12,g.combo+1);g.chain_ticks=150;g.near_misses++;const n=35*(1+Math.floor(g.combo/3));g.style+=n;award(n);g.pursuit=Math.max(0,g.pursuit-45);}
  if(Math.abs(b.y-830)>=42)continue;
  if((b.tag===1||b.tag===8)&&aligned){b.tag=0;crash(g);}
  else if(b.tag===2&&(aligned||g.magnet_ticks)){award(25);g.charge=Math.min(900,g.charge+55);g.pickups++;b.tag=0;}
  else if(b.tag>=3&&b.tag<=7&&aligned){if(b.tag===3)g.shield=Math.min(2,g.shield+1);if(b.tag===4)g.magnet_ticks=180;if(b.tag===5)g.nitro=Math.min(2,g.nitro+1);if(b.tag===6){g.pulse=Math.min(3,g.pulse+1);g.counter=Math.min(3,g.counter+1);}if(b.tag===7)g.double_ticks=180;award(40);g.pickups++;b.tag=0;}
  else if(b.tag===10&&lateral<550){g.charge=Math.min(900,g.charge+250);g.ability_ticks=Math.max(g.ability_ticks,30);g.specials++;g.pickups++;b.tag=0;award(75);}
 }
 g.bodies=g.bodies.filter(b=>b.tag&&b.y<(b.tag===11?2300:1100));const cp=Math.min(3,Math.floor(g.distance/(stage.distance/4)));if(!g.over&&cp>g.checkpoint){g.checkpoint=cp;g.shield=Math.min(2,g.shield+1);g.pulse=Math.min(3,g.pulse+1);g.counter=Math.min(3,g.counter+1);g.charge=Math.min(900,g.charge+300);award(100);}
 g.position=1+g.rivals.filter(r=>r.finish||r.distance>g.distance).length;g.energy=Math.floor(g.charge/300);if(g.tick%15===0)award(1);
 if(!g.over&&(!g.time_left||g.pursuit>=1000)){g.over=true;g.finish_reason=g.time_left?4:3;}
 if(!g.over&&g.distance>=stage.distance){g.won=(type!==0||g.position<=3)&&(type!==2||g.style>=stage.style)&&(type!==3||g.takedowns>=stage.rivals)?1:0;g.over=true;g.finish_reason=g.won?1:type===0?7:type===2?5:6;if(g.won)award(500+Math.floor(g.time_left/3));}
 if(g.over&&!g.reward){const finished=g.distance>=stage.distance,reward=finished?400+(7-g.position)*140+g.won*300+Math.min(300,Math.floor(g.style/40))+g.takedowns*60:Math.min(180,Math.floor(g.distance/300));g.reward=Math.max(1,Math.floor(reward*(100+g.difficulty*25)/100));g.career.credits+=g.reward;g.career.earned+=g.reward;g.career.races++;g.career.rep+=g.won?100:finished?40:5;if(g.won){g.career.wins++;g.career.medals[g.mode]=Math.max(g.career.medals[g.mode],g.position===1?3:g.position<=3?2:1);}}
}
function crash(g){if(g.over)return;g.damage_ticks=15;g.clean_ticks=0;if(g.shield){g.shield--;g.speed=Math.max(500,Math.floor(g.speed*65/100));g.combo=0;g.chain_ticks=0;g.pursuit=Math.min(1000,g.pursuit+100);}else{g.lives=0;g.over=true;g.finish_reason=2;}}
