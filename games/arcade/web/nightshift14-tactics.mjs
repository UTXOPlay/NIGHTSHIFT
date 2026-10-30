import {tacticalReadout as legacyReadout,raceDebrief as priorDebrief} from './nightshift13-tactics.mjs';
import {combatHud} from './nightshift14-feedback.mjs';
import {sectorIndex,styleGoal,styleComplete} from './nightshift14-rules.mjs';
import {raceDebrief as legacyDebrief} from './nightshift9-tactics.mjs';
import {EVENTS,VEHICLES,curvature,contractActive,countBits,WEAPON_COST,LOCK_TICKS,contractGate} from './nightshift14-rules.mjs';
// Read-only event discovery and race engineering. All rules and outcomes stay in the bound native executor.
export const DISCIPLINES=Object.freeze([
 {name:'STREET CIRCUIT',icon:'flag',goal:'Finish in the top three',loop:'Draft for charge. Brake into bends. Boost onto the next straight.',cars:[4,3,0,1,5,2],gadget:0},
 {name:'SIGNAL RUNNER',icon:'police',goal:'Finish before heat reaches 100%',loop:'Keep moving to shed heat. Save boost for escapes and armor for traffic.',cars:[2,5,4,0,3,1],gadget:2},
 {name:'SLIDE SESSIONS',icon:'drift',goal:'Four sector targets and a final clean exit',loop:'Link clean drifts through bends. Straighten for clean-exit bonuses. Boost between corners.',cars:[1,4,0,3,5,2],gadget:1},
 {name:'BOUNTY GRID',icon:'target',goal:'Secure the targets and finish on the podium',loop:'Loaded couriers stage at fixed relay gates. Follow their launch, wait for activation and use a clear forward EMP. Secure every target, then finish on the podium.',cars:[5,2,3,4,0,1],gadget:0}
]);
export function eventModes(type=-1){return EVENTS.flatMap((e,n)=>type<0||e.type===type?[n]:[]);}
export function recommendedSetup(career,mode){const discipline=DISCIPLINES[EVENTS[mode].type],vehicle=discipline.cars.find(n=>career.owned&(1<<n));return{vehicle:vehicle??0,gadget:discipline.gadget,discipline};}
const intelCache=new Map();
export function routeIntel(mode){if(intelCache.has(mode))return intelCache.get(mode);const total=EVENTS[mode].distance,sections=Array.from({length:4},(_,sector)=>{let peak=0,changes=0,previous=0;for(let n=0;n<24;n++){const bend=curvature(total*(sector/4+n/96),mode),sign=Math.abs(bend)>=3?Math.sign(bend):0;peak=Math.max(peak,Math.abs(bend));if(sign&&previous&&sign!==previous)changes++;if(sign)previous=sign;}return{sector,startKm:total*sector/40000,endKm:total*(sector+1)/40000,peak,changes,character:changes>=2?'LINKED BENDS':peak>=10?'TIGHT CORNERS':peak>=5?'SWEEPING TURNS':'FAST SECTION'};});intelCache.set(mode,sections);return sections;}
export function tacticalReadout(g){
 if(g.physics_version!==14)return legacyReadout(g);
 const e=EVENTS[g.mode],left=Math.max(0,e.distance-g.distance),unit=(icon,title,detail)=>({icon,title,detail});
 if(g.over||g.physics_version<11)return null;if(g.spec)return unit('flag','STOCK TIME ATTACK','Your personal ghost has no collisions');if(e.type===2&&g.physics_version>=13&&g.distance*100>=e.distance*90&&!g.finale)return unit('drift','FINAL CLEAN EXIT','Link a drift, then straighten before the line');if(e.type===2)return unit('drift','SECTOR '+(sectorIndex(g)+1)+' / 4',Math.min(styleGoal(g),g.style_sectors[sectorIndex(g)])+' / '+styleGoal(g)+' STYLE · clean corners score');
 if(!g.hull||g.recover)return unit('wrench','SYSTEMS RECOVERING','Keep clear of traffic');
 const incoming=g.rivals.filter(r=>r.windup>0&&r.attack_target===-1&&r.hp>0&&!r.stun&&Math.abs(r.distance-g.distance)<900);
 if(incoming.length)return unit('jammer',g.counter>0&&!g.counter_cd?'JAM OR CHANGE LINE':'CHANGE LINE','Incoming energy attack');
 if(!g.shield)return unit('shield','NO COLLISION ARMOR','Next heavy impact is fatal');
 const feedback=combatHud(g);
 if(feedback.lineBlocked)return unit('emp','LINE BLOCKED','Move past traffic or cover to acquire the target');
 if(e.type===3){
  const courier=g.rivals.filter(r=>(g.contract_mask&(1<<r.id))&&!(g.contract_done&(1<<r.id))).sort((a,b)=>Math.abs(a.distance-g.distance)-Math.abs(b.distance-g.distance)||a.id-b.id)[0];
  if(courier&&Math.abs(courier.distance-g.distance)<3600){
   const limit=Math.round(([1500,1640,1780][g.difficulty]+Math.floor(g.mode/4)*20)*.108);
   if(courier.staged)return unit('target','COURIER AT THE RELAY','Launch ahead · cargo cruise limit '+limit+' KM/H');
   if(!contractActive(g,courier.id))return unit('target','COURIER ON THE MOVE','Gate ahead · hold fire until amber');
   if(courier.distance<g.distance-300)return unit('target','TARGET BEHIND','Ease off; let the courier enter your forward lock');
  }
 }
 const curve=curvature(g.distance,g.mode),ahead=curvature(g.distance+900,g.mode);
 if(e.type===3){const active=g.rivals.filter(r=>(g.contract_mask&(1<<r.id))&&!(g.contract_done&(1<<r.id))&&contractActive(g,r.id));const marked=active.find(r=>r.id===g.lock_id)||active.find(r=>Math.abs(r.distance-g.distance)<250);
  if(marked&&g.gadget===0&&g.lock_id===marked.id&&g.lock_ticks>=LOCK_TICKS&&g.pulse>=2&&!g.weapon_cd)return unit('emp',marked.defend?'GUARD ACTIVE / HOLD FIRE':'MARKED TARGET / EMP READY',marked.defend?'Let the guard expire':'Two ammo · clean hit disables');
  if(!active.length&&countBits(g.contract_done)<e.rivals){const ranks=Array.from({length:e.rivals},(_,rank)=>rank).filter(rank=>{const id=(rank+g.mode+g.race_id)%5;return !(g.contract_done&(1<<id));});const gate=Math.min(...ranks.map(rank=>contractGate(g,rank)));if(gate>g.distance)return unit('target','NEXT TARGET GATE',Math.ceil((gate-g.distance)/10)+' M · keep racing');}
 }
 const close=g.rivals.filter(r=>!r.finish&&r.hp>0&&!r.recover&&Math.abs(r.distance-g.distance)<180&&Math.abs(r.x-g.drift_x)<=1000);
 if(g.gadget===1&&close.length>=2&&!g.weapon_cd&&g.pulse>=WEAPON_COST[1])return unit('wave','TWO RIVALS IN RANGE','Shockwave can hit both · two ammo');
 if(g.gadget===2&&!g.weapon_cd&&g.pulse>=1&&g.rivals.some(r=>!r.finish&&r.hp>0&&!r.recover&&r.distance<g.distance&&g.distance-r.distance<900&&Math.abs(r.x-g.drift_x)<650))return unit('mine','TRAILING RIVAL','Mine arms after 0.3s · one ammo');
 if(e.type===1&&g.pursuit>=600)return unit('police','HEAT '+Math.round(g.pursuit/10)+'%',g.charge>=300||g.nitro?'Boost to shed heat':'Keep speed up; avoid impacts');
 if(g.drifting&&Math.abs(g.steer_v)>28)return unit('drift',(g.encounter===2?'DOUBLE STYLE / ':'')+'CHAIN '+(1+Math.floor(g.combo/3))+'×',Math.round(g.charge/9)+'% boost charge');
 if(g.draft_ticks>=12)return unit('car','SLIPSTREAM / CHARGING','Leave room; pull out before contact');
 if(g.charge>=300&&!g.ability_ticks&&Math.abs(curve)<=3&&Math.abs(ahead)<=4)return unit('bolt','STRAIGHT / BOOST READY',e.type===2&&g.style<e.style?'Bank style before the next bend':'Spend charge to overtake');
 if(Math.abs(ahead)>=8&&Math.abs(ahead)>Math.abs(curve)+2)return unit('grip','TIGHT BEND AHEAD','Brake before turn-in; boost on exit');
 if(e.type===2)return unit('drift',Math.max(0,e.style-g.style).toLocaleString()+' STYLE TO TARGET',g.encounter===2?'Drift zone · double drift style':'Link drifts and close passes');
 return unit(DISCIPLINES[e.type].icon,DISCIPLINES[e.type].name,(left/10000).toFixed(1)+' KM TO FINISH');
}
export function raceDebrief(g){if(g.physics_version!==14)return priorDebrief(g);if(g.physics_version<11)return legacyDebrief(g);if(g.spec)return{icon:'flag',title:g.won?'PERSONAL TIME RECORDED':'FINISH THE STOCK RUN',detail:'Identical stock Vanta, fixed traffic seed and device-local personal ghost.'};if(EVENTS[g.mode].type===2)return{icon:'drift',title:styleComplete(g)&&(g.physics_version<13||g.finale)?'FOUR SECTORS / CLEAN FINALE':g.physics_version>=13&&!g.finale?'FINAL CLEAN EXIT MISSED':'SECTOR TARGET MISSED',detail:g.style_sectors.map((n,i)=>'S'+(i+1)+': '+n+'/'+styleGoal(g)).join(' · ')+(g.physics_version<13?'':g.finale?' · CLEAN EXIT BANKED':' · Drift after 90%, then straighten')};const e=EVENTS[g.mode],d=DISCIPLINES[e.type];if(g.finish_reason===2)return{icon:'shield',title:'PROTECT YOUR RUN',detail:'Brake before blocked lanes. A quarter-route relay restores one armor; reverse if trapped.'};if(e.type===2&&g.style<e.style)return{icon:'drift',title:(e.style-g.style).toLocaleString()+' STYLE SHORT',detail:'Hold drift while steering. Link chains within five seconds and use double-style zones.'};if(e.type===3&&countBits(g.contract_done)<e.rivals)return{icon:'target',title:countBits(g.contract_done)+' / '+e.rivals+' TARGETS SECURED',detail:g.gadget===2?'Rear mines defend a lead. Try EMP for forward interception; wait until the target is amber.':'Keep the target ahead and clear traffic from your beam. Wait for the amber gate, then bait its guard before firing.'};if(g.finish_reason===4)return{icon:'police',title:'HEAT REACHED THE LIMIT',detail:'Boost sheds heat. Fast clean driving lowers pursuit; impacts and slow driving build it.'};return{icon:d.icon,title:g.won?'CONTRACT BANKED':'TRY ANOTHER LINE',detail:d.loop};}
