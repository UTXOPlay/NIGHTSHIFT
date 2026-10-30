// Synthetic WebAudio fixtures, separate from signed ordinary-driving acceptance.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:18924',out=process.env.DRIFT_OUT||'artifacts/feel-v1001/audio';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox']}),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.route('**/games/nightshift/audio-probe',r=>r.fulfill({contentType:'text/html',body:'<button>Enable driving audio</button>'}));
 await page.goto(origin+'/games/nightshift/audio-probe');
 await page.evaluate(async()=>{const{ArcadeAudio}=await import('./_arcade/nightshift9-audio.mjs');globalThis.audio=new ArcadeAudio();audio.enabled=true;document.querySelector('button').onclick=()=>audio.unlock();});
 await page.getByRole('button').click();await page.waitForFunction(()=>audio.loaded===3&&audio.context.state==='running');
 const decoded=await page.evaluate(()=>({snapshot:audio.snapshot(),durations:Object.fromEntries(Object.entries(audio.buffers).map(([k,b])=>[k,b.duration])),sources:[audio.engine,audio.tyres,audio.wind,audio.pressure].filter(x=>x.source).length}));assert.equal(decoded.sources,4);assert.deepEqual(decoded.snapshot.errors,[]);assert.ok(decoded.durations.engine>3.9);assert.ok(decoded.durations.tyres>.9);
 await page.evaluate(()=>{globalThis.g={tick:1,race_id:1,speed:1800,vehicle:0,charge:299,steer_v:0,side_v:0,drifting:0,ability_ticks:0,stun:0,over:0};audio.drive(g,true);globalThis.meter=audio.context.createAnalyser();meter.fftSize=2048;audio.master.connect(meter);});
 await page.waitForTimeout(500);
 const cruise=await page.evaluate(()=>{const data=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(data);return{...audio.snapshot(),rms:Math.sqrt(data.reduce((s,x)=>s+x*x,0)/data.length)};});assert.ok(cruise.rms>.001,'decoded recordings produce output');assert.ok(cruise.levels.engine>.08);assert.equal(cruise.levels.tyres,0);
 await page.evaluate(()=>{const before={...g,specials:0,near_misses:0,bodies:[]};Object.assign(g,{tick:2,speed:2500,drifting:1,steer_v:80,ability_ticks:60,specials:1,near_misses:1,charge:300});audio.feedback(before,g);audio.drive(g,true);});
 await page.waitForTimeout(350);const boost=await page.evaluate(()=>audio.snapshot());assert.equal(boost.mix.boost,1);assert.ok(boost.levels.boost>.15);assert.ok(boost.levels.tyres>.08);assert.equal(boost.cues,3);
 await page.evaluate(()=>{audio.play('damage',{impact_force:1800,impact_nx:1});audio.drive(g,false);});await page.waitForTimeout(1600);
 const paused=await page.evaluate(()=>{const data=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(data);return{...audio.snapshot(),rms:Math.sqrt(data.reduce((s,x)=>s+x*x,0)/data.length)};});assert.equal(paused.voices,0);assert.ok(paused.rms<.0001);assert.ok(Object.values(paused.levels).every(x=>x<.0001));
 await page.evaluate(()=>{audio.enabled=false;globalThis.mutedStarted=audio.started;audio.play('pulse');audio.drive(g,true);});await page.waitForTimeout(300);const muted=await page.evaluate(()=>({snapshot:audio.snapshot(),noNewVoice:audio.started===mutedStarted}));assert.equal(muted.noNewVoice,true);assert.ok(muted.snapshot.master<.0001);
 const burst=await page.evaluate(()=>{audio.enabled=true;for(let n=0;n<100;n++)audio.play(n%2?'ready':'pass',{strength:1,pan:.8});return audio.snapshot();});assert.ok(burst.voices<=12);await page.waitForTimeout(650);assert.equal(await page.evaluate(()=>audio.voices.length),0);
 assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({scope:'Actual Chromium WebAudio decode, output RMS, synthetic native-state mixing, pause/mute and bounded voice stress; not a listening-panel or physical-device test',decoded,cruise,boost,paused,muted,burst,errors},null,2));console.log({recordings:decoded.snapshot.recordings,cruiseRms:cruise.rms,pausedRms:paused.rms,boostLevel:boost.levels.boost,maxRetainedVoices:burst.voices,errors});
}finally{await page.evaluate(()=>audio?.context?.close()).catch(()=>{});await browser.close();}
