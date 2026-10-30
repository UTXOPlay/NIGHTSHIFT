// Both human and AI cars use this integer 30 Hz drivetrain and lateral model.
export const SPEED=[1660,1600,1570,1810,1720,1690],TURN=[70,86,62,72,78,68];
const POWER=[12,13,10,14,16,11],BRAKES=[13,14,12,15,16,13];
const trunc=n=>Math.trunc(n)||0,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function drive(g,control,flags,up){
 const top=SPEED[g.vehicle]+up[0]*70;
 g.throttle=control.throttle;g.brake=control.brake;
 const reverse=!!(flags&4),handbrake=!!(flags&8),speed=g.speed,absolute=Math.abs(speed),direction=reverse?-1:1;
 let brake=g.brake,gas=g.throttle;
 if(speed*direction<0){brake=Math.max(brake,gas);gas=0;}
 if(g.stun||(g.hull??g.hp)===0)gas=0;
 if(brake||handbrake)gas=0;
 const power=POWER[g.vehicle]+up[0],limit=reverse?350:top;
 const motor=trunc(power*gas*Math.max(25,100-trunc(absolute*60/limit))/100)*(reverse?-1:1);
 const drag=absolute?60+trunc((power*40-60)*absolute*absolute/(top*top)):0;
 const boost=(g.ability_ticks??g.boost)&&gas&&!reverse?1100:0;
 const force=motor+boost-Math.sign(speed)*(drag+BRAKES[g.vehicle]*brake+(handbrake?450:0)+(g.stun?350:0));
 g.drive_remainder+=force;const delta=trunc(g.drive_remainder/100);g.drive_remainder-=delta*100;
 const next=speed+delta;g.speed=clamp(next,-350,2500);
 if(speed&&Math.sign(next)!==Math.sign(speed)){g.speed=0;g.drive_remainder=0;}
 if(!g.speed&&(brake||handbrake||!gas))g.drive_remainder=0;
}
// The caller owns its longitudinal/lateral position. This returns lateral travel.
export function steer(g,control,flags,up,bend){
 const demand=control.steering,drift=!!(flags&8)&&Math.abs(demand)>4&&g.speed>=850;
 if(!drift)g.drift_side=0;else if((!g.drift_side||g.drift_side*demand<0&&Math.abs(demand)>65)&&Math.abs(demand)>4)g.drift_side=Math.sign(demand);
 const desired=trunc((TURN[g.vehicle]+up[1]*3+(drift?12:0))*demand/100),response=g.vehicle===1?38:g.vehicle===2?24:32;
 const delta=desired-g.steer_v;g.steer_v+=Math.sign(delta)*Math.min(Math.abs(delta),Math.max(1,trunc(Math.abs(delta)*response/100)));
 g.heading+=clamp(g.steer_v*2+(drift?g.drift_side*220:0)-g.heading,-42,42);
 const lv=trunc(g.steer_v*g.speed/2000)-g.lateral_v,grip=drift?18+up[1]*2:43+up[1]*3;
 g.lateral_v+=Math.sign(lv)*Math.min(Math.abs(lv),Math.max(1,trunc(Math.abs(lv)*grip/100)));
 g.slip_angle=g.speed>500?g.heading-trunc(g.lateral_v*4000/g.speed):0;
 g.drifting=g.speed>=850&&Math.abs(g.slip_angle)>=60&&Math.abs(g.heading)>=80?1:0;
 const slip=-trunc(bend*Math.max(0,g.speed-1050)/(260+up[1]*45+(drift?100:0)));
 return g.lateral_v+slip+trunc(g.side_v/4)+trunc(g.yaw*g.speed/4000);
}
