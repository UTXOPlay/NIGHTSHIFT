import {driveFeedback,driveMix} from './nightshift9-drive-feedback.mjs';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Six mix profiles share one credited engine recording; these are not six recordings.
const VOICES=[{rate:.83,cut:1450,gain:.16},{rate:1,cut:1750,gain:.14},{rate:.71,cut:1100,gain:.19},{rate:1.08,cut:2100,gain:.13},{rate:.9,cut:450,gain:.045},{rate:.66,cut:1250,gain:.19}];
export class ArcadeAudio{
 constructor(){this.context=null;this._enabled=false;this.buffers={};this.voices=[];this.loaded=0;this.errors=[];this.started=0;this.cues=0;this.last=null;this.mix=driveMix({});this.wasRunning=false;}
 get enabled(){return this._enabled;}
 set enabled(value){this._enabled=Boolean(value);if(this.master)this.master.gain.setTargetAtTime(this._enabled?1:0,this.context.currentTime,.025);}
 unlock(){if(!this.enabled)return;try{if(!this.context){this.context=new AudioContext();this.graph();}void this.context.resume().catch(()=>{});this.load();}catch{}}
 graph(){
  const c=this.context;
  this.master=c.createGain();this.master.gain.value=this.enabled?1:0;this.master.connect(c.destination);
  this.bus=c.createDynamicsCompressor();this.bus.threshold.value=-16;this.bus.knee.value=12;this.bus.ratio.value=3;this.bus.attack.value=.004;this.bus.release.value=.12;this.bus.connect(this.master);
  this.noise=c.createBuffer(1,c.sampleRate*2,c.sampleRate);const data=this.noise.getChannelData(0);let seed=9127,v=0;
  for(let n=0;n<data.length;n++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;v=(v+(seed/2147483648-1)*.07)/1.07;data[n]=v*3;}
  this.engine=this.loop('lowpass',1200);this.tyres=this.loop('lowpass',5000);
  this.wind=this.loop('highpass',800,this.noise);this.pressure=this.loop('bandpass',1800,this.noise);this.pressure.filter.Q.value=.65;
  this.motor=c.createOscillator();this.motor.type='sine';this.motorGain=c.createGain();this.motorGain.gain.value=0;this.motor.connect(this.motorGain);this.motorGain.connect(this.bus);this.motor.start();
 }
 loop(type,frequency,buffer){const c=this.context,filter=c.createBiquadFilter(),gain=c.createGain();filter.type=type;filter.frequency.value=frequency;gain.gain.value=0;filter.connect(gain);gain.connect(this.bus);const loop={filter,gain};if(buffer)this.startLoop(loop,buffer);return loop;}
 startLoop(loop,buffer){if(loop.source)return;const source=this.context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(loop.filter);source.start();loop.source=source;}
 load(){
  if(this.loading||this.loaded===3||performance.now()<(this.retryAt||0))return;
  this.loading=Promise.allSettled(['engine','tyres','impact'].map(async name=>{
   if(this.buffers[name])return;
   const r=await fetch('/arcade/audio/nightshift/'+name+'.wav');if(!r.ok)throw Error(name+': '+r.status);
   const buffer=await this.context.decodeAudioData(await r.arrayBuffer());this.buffers[name]=buffer;this.loaded++;
   if(name!=='impact')this.startLoop(this[name],buffer);
  })).then(results=>{this.errors=results.filter(r=>r.status==='rejected').map(r=>String(r.reason));this.loading=null;if(this.errors.length)this.retryAt=performance.now()+5000;});
 }
 drive(g,running){
  const c=this.context;if(!c)return;
  if(this.enabled&&this.loaded<3)this.load();
  if(!this.last||g.tick!==this.last.tick||g.race_id!==this.last.race_id){this.mix=driveMix(g,this.last?.race_id===g.race_id?this.last:null);this.last={tick:g.tick,speed:g.speed,race_id:g.race_id};}
  const t=c.currentTime,m=this.mix,v=VOICES[g.vehicle]||VOICES[0],active=this.enabled&&running&&!g.over;
  if(!active&&this.wasRunning&&!g.over)for(const voice of this.voices)this.release(voice,t);
  this.wasRunning=active;
  const set=(param,value,tau=.08)=>param.setTargetAtTime(value,t,tau);
  set(this.engine.gain.gain,active?v.gain*(.5+m.load*.5)*(g.stun?.35:1):0);
  if(this.engine.source)set(this.engine.source.playbackRate,v.rate*(.62+m.speed*.57+m.load*.09),.12);
  set(this.engine.filter.frequency,v.cut+m.speed*1300+m.load*600+m.boost*850,.12);
  set(this.tyres.gain.gain,active?m.slip*.1:0,m.slip?.055:.12);
  if(this.tyres.source)set(this.tyres.source.playbackRate,.8+m.speed*.35,.15);
  set(this.tyres.filter.frequency,2500+m.slip*2800,.1);
  set(this.wind.gain.gain,active?m.speed*m.speed*(.065+m.draft*.03):0,.2);
  set(this.pressure.gain.gain,active?m.boost*.16:0,m.boost?.035:.13);
  set(this.pressure.filter.frequency,1300+m.speed*1300,.1);
  set(this.motorGain.gain,active&&g.vehicle===4?.025+m.load*.015:0,.12);
  set(this.motor.frequency,90+m.speed*370+m.boost*40,.12);
 }
 feedback(before,after){const cues=driveFeedback(before,after);for(const cue of cues){this.cues++;this.play(cue.type,{...after,...cue});}return cues;}
 release(voice,t=this.context.currentTime){voice.gain.gain.cancelScheduledValues(t);voice.gain.gain.setTargetAtTime(.0001,t,.006);voice.source.stop(t+.025);}
 retain(source,filter,gain,pan){
  if(this.voices.length>=12){const old=this.voices.shift();old.source.stop();old.source.disconnect();old.filter?.disconnect();old.gain.disconnect();old.pan?.disconnect();}
  const voice={source,filter,gain,pan};this.voices.push(voice);this.started++;
  source.onended=()=>{source.disconnect();filter?.disconnect();gain.disconnect();pan?.disconnect();const n=this.voices.indexOf(voice);if(n>=0)this.voices.splice(n,1);};
 }
 voice(buffer,{gain=.1,rate=1,duration=.2,pan=0,frequency=2000,type='lowpass',attack=.008}={}){
  const c=this.context;if(!this.enabled||!buffer||!c||c.state!=='running')return;
  const source=c.createBufferSource(),filter=c.createBiquadFilter(),level=c.createGain(),stereo=c.createStereoPanner(),t=c.currentTime;
  source.buffer=buffer;source.playbackRate.value=rate;filter.type=type;filter.frequency.value=frequency;filter.Q.value=.65;stereo.pan.value=clamp(pan,-.8,.8);
  source.connect(filter);filter.connect(level);level.connect(stereo);stereo.connect(this.bus);
  level.gain.setValueAtTime(.0001,t);level.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+attack);level.gain.exponentialRampToValueAtTime(.0001,t+duration);
  this.retain(source,filter,level,stereo);source.start(t);source.stop(t+duration+.025);
 }
 tone(from,to,duration,gain){
  const c=this.context;if(!this.enabled||!c||c.state!=='running')return;const source=c.createOscillator(),level=c.createGain(),t=c.currentTime;
  source.type='sine';source.frequency.setValueAtTime(from,t);source.frequency.exponentialRampToValueAtTime(to,t+duration);level.gain.setValueAtTime(.0001,t);level.gain.exponentialRampToValueAtTime(gain,t+.008);level.gain.exponentialRampToValueAtTime(.0001,t+duration);source.connect(level);level.connect(this.bus);this.retain(source,null,level,null);source.start(t);source.stop(t+duration+.025);
 }
 play(type,g={}){
  const c=this.context;if(!this.enabled||!c||c.state!=='running')return;
  if(type==='boost')return this.voice(this.noise,{gain:.22,duration:.32,frequency:900,type:'bandpass',attack:.035});
  if(type==='boostEnd')return this.voice(this.noise,{gain:.075,duration:.2,frequency:2100,type:'highpass'});
  if(type==='pass')return this.voice(this.noise,{gain:.15*g.strength,duration:.3,pan:g.pan,frequency:1000+1600*g.strength,type:'bandpass',attack:.045});
  if(type==='grip')return this.voice(this.buffers.tyres,{gain:.025*g.strength,duration:.12,frequency:2400,rate:.85});
  if(type==='damage'||type==='bounce'){const force=clamp((g.impact_force||300)/1800,0,1);return this.voice(this.buffers.impact,{gain:type==='damage'?.12+force*.13:.06,duration:.32,rate:.8+force*.25,pan:-(g.impact_nx||0)*.65,frequency:3200});}
  if(type==='ready')return this.tone(660,880,.1,.022);
  if(type==='guard'||type==='counter'){this.voice(this.noise,{gain:.1,duration:.16,frequency:2700,type:'bandpass'});return this.tone(180,540,.15,.025);}
  if(type==='pulse'||type==='enemy'){this.voice(this.noise,{gain:.12,duration:.23,frequency:1400,type:'bandpass'});return this.tone(type==='pulse'?160:110,45,.22,.03);}
  const sounds={hazard:[680,680,.11,.035],hazardUrgent:[920,620,.18,.04],collect:[640,1160,.12,.025],wave:[400,950,.32,.035],start:[350,920,.2,.03],count:[500,500,.06,.02]};
  if(sounds[type])this.tone(...sounds[type]);
 }
 snapshot(){return{enabled:this.enabled,state:this.context?.state||'locked',recordings:this.loaded,errors:[...this.errors],voices:this.voices.length,started:this.started,cues:this.cues,mix:{...this.mix},master:this.master?.gain.value||0,levels:this.engine?{engine:this.engine.gain.gain.value,tyres:this.tyres.gain.gain.value,wind:this.wind.gain.gain.value,boost:this.pressure.gain.gain.value}:null};}
}
