// Distance-sampled ribbon segments, independent of rendering cadence.
export class ContactTrail{
 constructor(spacing=.8){this.spacing=spacing;this.last=null;this.carry=0;this.anchor=null;}
 reset(){this.last=null;this.carry=0;this.anchor=null;}
 sample(point,emit){
  if(!this.last){this.last={...point};return;}
  const previous=this.last,dx=point.x-previous.x,dz=(point.at-previous.at)*.1,length=Math.hypot(dx,dz);
  if(length>12){this.reset();this.last={...point};return;}
  if(length<.000001)return;
  let offset=this.spacing-this.carry;
  while(offset<=length+.000001){const t=offset/length,q={x:previous.x+dx*t,at:previous.at+(point.at-previous.at)*t};if(this.anchor)emit(this.anchor,q);this.anchor=q;offset+=this.spacing;}
  this.carry=(this.carry+length)%this.spacing;this.last={...point};
 }
}
