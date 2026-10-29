export class DrivingCoach{
 constructor(saved){this.stage=Number.isInteger(saved?.stage)?Math.max(0,Math.min(3,saved.stage)):0;this.dismissed=Boolean(saved?.dismissed);this.ticks=0;}
 reset(){this.stage=0;this.dismissed=false;this.ticks=0;}
 dismiss(){this.dismissed=true;}
 observe(before,after,input){
  if(this.dismissed||this.stage===3||after.tick<=before.tick||after.over)return false;
  const moved=Math.abs(after.drift_x-before.drift_x)>0;
  if(this.stage===0){if((input&3)&&moved&&after.speed>500)this.ticks++;if(this.ticks>=20){this.stage=1;this.ticks=0;return true;}}
  else if(this.stage===1){if((input&8)&&before.speed>500&&after.speed<before.speed)this.ticks++;if(this.ticks>=10){this.stage=2;this.ticks=0;return true;}}
  else if((input&16)&&before.ability_ticks===0&&after.ability_ticks>0){this.stage=3;return true;}
  return false;
 }
 snapshot(){return{stage:this.stage,dismissed:this.dismissed};}
 hint(g){return this.stage===0?{icon:'grip',label:'STEER',action:'steer'}:this.stage===1?{icon:'drift',label:'BRAKE',action:'drift'}:g.charge>=100?{icon:'bolt',label:'BOOST',action:'boost'}:{icon:'drift',label:'DRIFT / DRAFT',action:'drift'};}
}
