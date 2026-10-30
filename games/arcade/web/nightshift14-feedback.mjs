import {combatHud as legacyHud,combatFeedback} from './nightshift13-feedback.mjs';
import {combatActor,clearShot} from './nightshift14-weapons.mjs';
import {weaponTargets,contractActive,countBits,LOCK_TICKS,WEAPON_COST,WEAPON_COOLDOWN,RIVALS} from './nightshift14-rules.mjs';
export {combatFeedback};
export function rivalReadout(g,r){
 const marked=!!(g.contract_mask&(1<<r.id)),done=!!(g.contract_done&(1<<r.id));
 const phase=done?'secured':r.staged?'staged':!r.hp?'disabled':r.recover?'recovering':r.defend?'guarded':marked&&!contractActive(g,r.id)?'gate-closed':marked?'active':'racing';
 const labels={secured:'BOUNTY SECURED',staged:'RELAY STANDBY',disabled:'SYSTEMS DISABLED',recovering:'REBOOTING',guarded:'GUARD ACTIVE','gate-closed':'GATE CLOSED',active:'BOUNTY ACTIVE',racing:'RIVAL'};
 return {id:r.id,marked,done,active:contractActive(g,r.id),phase,label:labels[phase],name:RIVALS[r.id],loadLimit:r.release_at>0?Math.round(([1500,1640,1780][g.difficulty]+Math.floor(g.mode/4)*20)*.108):null};
}
export function combatHud(g){
 if(g.physics_version!==14)return legacyHud(g);
 const source=combatActor(g,-1),targets=weaponTargets(g),warnings=g.rivals.filter(r=>r.windup>0&&r.attack_target===-1&&r.hp>0&&!r.stun);
 const blocked=g.gadget===0&&g.lock_id<0?g.rivals.filter(r=>!r.finish&&!r.staged&&r.hp>0&&!r.stun&&!r.recover&&r.distance-g.distance>30&&r.distance-g.distance<900&&Math.abs(r.x-g.drift_x)<480&&!clearShot(g,source,r)).sort((a,b)=>a.distance-b.distance||a.id-b.id)[0]:null;
 const aim=g.lock_id>=0?g.rivals[g.lock_id]:blocked,targetHud=aim?{...rivalReadout(g,aim),blocked:!!blocked}:null;
 if(targetHud?.blocked){targetHud.phase='blocked';targetHud.label='LINE BLOCKED';}
 else if(targetHud&&g.lock_id>=0&&aim.hp>0&&!aim.recover&&!aim.defend&&!aim.staged&&!targetHud.done&&(!targetHud.marked||targetHud.active)){targetHud.phase=g.lock_ticks>=LOCK_TICKS?'locked':'locking';targetHud.label=g.lock_ticks>=LOCK_TICKS?'EMP LOCKED':'ACQUIRING';}
 const weaponStatus=!g.hull?'SYSTEMS RECOVERING':g.weapon_cd?'RECHARGING '+(g.weapon_cd/30).toFixed(1)+'s':g.pulse<WEAPON_COST[g.gadget]?'NEED '+WEAPON_COST[g.gadget]+' AMMO':blocked?'LINE BLOCKED / CHANGE POSITION':g.gadget===0?(g.lock_id<0?'ALIGN WITH A RIVAL AHEAD':aim.defend?'GUARD ACTIVE / HOLD FIRE':targetHud.marked&&!targetHud.active?'GATE CLOSED / HOLD FIRE':g.lock_ticks<LOCK_TICKS?'HOLD LINE / LOCKING':'LOCKED / READY TO FIRE'):g.gadget===1?(targets.length?'RIVALS IN RANGE':'SHOCKWAVE / 18 m RANGE'):'MINE READY / DROPS BEHIND';
 return {weaponStatus,targetHud,lineBlocked:!!blocked,lockProgress:Math.min(1,g.lock_ticks/LOCK_TICKS),weaponReady:g.hull>0&&g.pulse>=WEAPON_COST[g.gadget]&&!g.weapon_cd&&(g.gadget!==0||g.lock_ticks>=LOCK_TICKS),targetOpportunity:targets.some(r=>!r.defend&&(!(g.contract_mask&(1<<r.id))||contractActive(g,r.id))),counterReady:g.hull>0&&g.counter>0&&!g.counter_cd,weaponCooldown:g.weapon_cd/(WEAPON_COOLDOWN[g.gadget]-(g.spec?0:g.career.tunes[g.vehicle][2])*10),counterCooldown:g.counter_cd/210,warnings,completed:countBits(g.contract_done),targets:g.rivals.map(r=>rivalReadout(g,r))};
}
