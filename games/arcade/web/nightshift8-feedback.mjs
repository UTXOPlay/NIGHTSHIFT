import {LOCK_TICKS,WEAPON_COST,WEAPON_COOLDOWN,weaponTargets,contractActive,countBits} from './nightshift8-rules.mjs';
// Derived presentation only: the native executor owns every outcome and event ID.
export function combatHud(g){
 const targets=weaponTargets(g),warnings=g.rivals.filter(r=>r.windup>0&&r.attack_target===-1&&r.hp>0&&!r.stun&&Math.abs(r.distance-g.distance)<900);
 const weaponStatus=!g.hull?'SYSTEMS RECOVERING':g.weapon_cd?'RECHARGING '+(g.weapon_cd/30).toFixed(1)+'s':g.pulse<WEAPON_COST[g.gadget]?'NEED '+WEAPON_COST[g.gadget]+' AMMO':g.gadget===0?(g.lock_id<0?'ALIGN WITH A RIVAL AHEAD':g.lock_ticks<LOCK_TICKS?'HOLD LINE / LOCKING':g.rivals[g.lock_id]?.defend?'TARGET GUARDED':'LOCKED / READY TO FIRE'):g.gadget===1?(targets.length?'RIVALS IN RANGE':'SHOCKWAVE / 18 m RANGE'):'MINE READY / DROPS BEHIND';
 return {weaponStatus,lockProgress:Math.min(1,g.lock_ticks/LOCK_TICKS),weaponReady:g.hull>0&&g.pulse>=WEAPON_COST[g.gadget]&&!g.weapon_cd&&(g.gadget!==0||g.lock_ticks>=LOCK_TICKS),targetOpportunity:targets.length>0,counterReady:g.hull>0&&g.counter>0&&!g.counter_cd,weaponCooldown:g.weapon_cd/(WEAPON_COOLDOWN[g.gadget]-g.career.upgrades[g.vehicle][2]*10),counterCooldown:g.counter_cd/210,warnings,completed:countBits(g.contract_done),targets:g.rivals.map(r=>({id:r.id,marked:!!(g.contract_mask&(1<<r.id)),active:contractActive(g,r.id),done:!!(g.contract_done&(1<<r.id))}))};
}
export function combatFeedback(before,after){return after.events.filter(e=>e.id>before.event_seq);}
