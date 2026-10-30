import {step} from './nightshift13-rules.mjs';
import {validInput} from './nightshift12-input.mjs';
// Personal, device-local reference. It never participates in live contacts or rewards.
export class PersonalGhost{
 constructor(profile,storage){this.profile=profile;this.storage=storage;this.best=this.read('best');this.capture=null;this.runner=null;this.cursor=0;}
 key(kind){return 'nightshift:ghost:'+this.profile+':'+kind;}
 read(kind){try{const r=JSON.parse(this.storage.getItem(this.key(kind)));return r?.profile===this.profile&&r.initial?.physics_version===13&&r.initial.spec===1&&r.initial.tick===0&&Array.isArray(r.inputs)&&r.inputs.length<=12600&&r.inputs.every(validInput)?r:null;}catch{return null;}}
 write(kind,value){try{this.storage.setItem(this.key(kind),JSON.stringify(value));}catch{}}
 begin(g,session){if(!g.spec||g.physics_version!==13){this.capture=this.runner=null;return;}const prior=this.read('pending');this.capture=!g.tick?{profile:this.profile,initial:structuredClone(g),session,inputs:[]}:prior&&prior.session===session&&prior.initial.race_id===g.race_id&&prior.inputs.length>=g.tick?{...prior,inputs:prior.inputs.slice(0,g.tick)}:null;this.runner=this.best?structuredClone(this.best.initial):null;this.cursor=0;}
 record(input,g){if(!this.capture)return;if(g.tick<=this.capture.inputs.length)this.capture.inputs.length=g.tick-1;if(g.tick!==this.capture.inputs.length+1){this.capture=null;return;}this.capture.inputs.push(input);}
 persist(g){if(this.capture&&g.spec){this.capture.inputs.length=Math.min(this.capture.inputs.length,g.tick);this.write('pending',this.capture);}}
 advance(g){if(!g.spec||!this.runner||!this.best)return null;if(this.cursor>g.tick){this.runner=structuredClone(this.best.initial);this.cursor=0;}const until=Math.min(g.tick,this.best.inputs.length);let budget=120;while(this.cursor<until&&budget--)step(this.runner,this.best.inputs[this.cursor++]);return this.cursor===until?this.runner:null;}
 complete(g,verified,capture=this.capture){if(!verified||!g.spec||!g.won||!capture||capture.inputs.length!==g.tick)return false;if(this.best&&this.best.inputs.length<=g.tick)return false;this.best={...capture};this.write('best',this.best);return true;}
 snapshot(){return{available:!!this.best,bestTicks:this.best?.inputs.length||0,recordingTicks:this.capture?.inputs.length||0,playbackTick:this.cursor};}
}
