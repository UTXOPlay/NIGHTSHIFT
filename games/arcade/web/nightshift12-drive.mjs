// Integer 30 Hz powertrain. Centi-force residual retains low pedal precision.
const DRIVE=[12,13,10,14,16,11],BRAKES=[13,14,12,15,16,13],trunc=Math.trunc;
export function drive(g,control,flags,up){
 const top=[1660,1600,1570,1810,1720,1690][g.vehicle]+up[0]*70;
 g.throttle=control.throttle;g.brake=control.brake;
 const reverse=!!(flags&4),handbrake=!!(flags&8),speed=g.speed,absolute=Math.abs(speed),direction=reverse?-1:1;
 let brake=g.brake,gas=g.throttle;
 if(speed*direction<0){brake=Math.max(brake,gas);gas=0;}
 if(g.stun||g.hull===0)gas=0;
 if(brake||handbrake)gas=0;
 const power=DRIVE[g.vehicle]+up[0],limit=reverse?350:top;
 const motor=trunc(power*gas*Math.max(25,100-trunc(absolute*60/limit))/100)*(reverse?-1:1);
 const drag=absolute?60+trunc((power*40-60)*absolute*absolute/(top*top)):0;
 const boost=g.ability_ticks&&gas&&!reverse?1100:0;
 const force=motor+boost-Math.sign(speed)*(drag+BRAKES[g.vehicle]*brake+(handbrake?450:0)+(g.stun?350:0));
 g.drive_remainder+=force;const delta=trunc(g.drive_remainder/100);g.drive_remainder-=delta*100;
 const next=speed+delta;
 g.speed=Math.max(-350,Math.min(2500,next));
 if(speed&&Math.sign(next)!==Math.sign(speed)){g.speed=0;g.drive_remainder=0;}
 if(!g.speed&&(brake||handbrake||!gas))g.drive_remainder=0;
}
