import {LOCK_TICKS,WEAPON_COST,WEAPON_COOLDOWN,weaponTargets,contractActive,countBits} from './nightshift8-rules.mjs';
// Derived presentation only: the native executor owns every outcome and event ID.
export function combatHud(g){
 const targets=weaponTargets(g),warnings=g.rivals.filter(r=>r.windup>0&&r.attack_target===-1&&r.hp>0&&!r.stun&&Math.abs(r.distance-g.distance)<900);
 return {lockProgress:Math.min(1,g.lock_ticks/LOCK_TICKS),weaponReady:g.hull>0&&g.pulse>=WEAPON_COST[g.gadget]&&!g.weapon_cd&&(g.gadget!==0||g.lock_ticks>=LOCK_TICKS),targetOpportunity:targets.length>0,counterReady:g.hull>0&&g.counter>0&&!g.counter_cd,weaponCooldown:g.weapon_cd/(WEAPON_COOLDOWN[g.gadget]-g.career.upgrades[g.vehicle][2]*10),counterCooldown:g.counter_cd/210,warnings,completed:countBits(g.contract_done),targets:g.rivals.map(r=>({id:r.id,marked:!!(g.contract_mask&(1<<r.id)),active:contractActive(g,r.id),done:!!(g.contract_done&(1<<r.id))}))};
}
export function combatFeedback(before,after){return after.events.filter(e=>e.id>before.event_seq);}
