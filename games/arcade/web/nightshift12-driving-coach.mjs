import {readInput} from './nightshift12-input.mjs';
export class DrivingCoach{
 constructor(saved){this.stage=Number.isInteger(saved?.stage)?Math.max(0,Math.min(4,saved.stage)):0;this.dismissed=Boolean(saved?.dismissed);this.ticks=0;}
 reset(){this.stage=0;this.dismissed=false;this.ticks=0;}
 dismiss(){this.dismissed=true;}
 observe(before,after,input){
  if(this.dismissed||this.stage===4||after.tick<=before.tick||after.over)return false;
  const intent=readInput(input);const moved=Math.abs(after.drift_x-before.drift_x)>0;
  if(this.stage===0){if(intent.throttle>20&&after.speed>before.speed)this.ticks++;if(this.ticks>=25){this.stage=1;this.ticks=0;return true;}}
  else if(this.stage===1){if((Math.abs(intent.steering)>5)&&moved&&after.speed>500)this.ticks++;if(this.ticks>=20){this.stage=2;this.ticks=0;return true;}}
  else if(this.stage===2){if((intent.brake>20)&&before.speed>500&&after.speed<before.speed)this.ticks++;if(this.ticks>=10){this.stage=3;this.ticks=0;return true;}}
  else if((input&16)&&before.ability_ticks===0&&after.ability_ticks>0){this.stage=4;return true;}
  return false;
 }
 snapshot(){return{stage:this.stage,dismissed:this.dismissed};}
 hint(g){return this.stage===0?{icon:'bolt',label:'ACCELERATE',action:'throttle'}:this.stage===1?{icon:'grip',label:'STEER',action:'steer'}:this.stage===2?{icon:'drift',label:'BRAKE',action:'brake'}:(g.charge>=300||g.nitro>0)?{icon:'bolt',label:'BOOST',action:'boost'}:{icon:'drift',label:'DRIFT / DRAFT',action:'drift'};}
}
