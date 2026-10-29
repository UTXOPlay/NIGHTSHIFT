// Synthetic rendering fixtures; signed driving is verified separately on the candidate.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:18924',out=process.env.DRIFT_OUT||'artifacts/feel-v1001/render';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],views=[],sizes=[];
page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
try{
 await page.route('**/games/nightshift/camera-probe',r=>r.fulfill({contentType:'text/html',body:'<style>html,body{margin:0;overflow:hidden;background:#071015}canvas{width:100vw;height:100vh}</style><canvas></canvas>'}));
 await page.goto(origin+'/games/nightshift/camera-probe');
 await page.evaluate(async()=>{const{DriftRenderer}=await import('./_arcade/nightshift9-renderer.bundle.mjs'),{createGame}=await import('./_arcade/nightshift9-rules.mjs');const r=new DriftRenderer(document.querySelector('canvas'));await r.load();globalThis.probe={r,createGame};});
 for(const mode of [0,3,6,11]){
  const view=await page.evaluate(async mode=>{
   const {r,createGame}=probe,g=createGame();Object.assign(g,{mode,race_id:mode+1,distance:30000,speed:2000,drift_x:1700});g.bodies=[];g.rivals.forEach(q=>q.finish=1);
   const before=JSON.stringify(g);await r.prepareRace(g);r.draw(g,g,1,16.667,1,{running:true,reduced:false,low:false});
   const x=(g.drift_x/1000-1)*4;for(let n=0;n<90;n++)r.chase.draw(r.camera,r.course,g,x,1/60,{preview:false,map:false,running:true,reduced:false});
   r.draw(g,g,1,16.667,1,{running:true,reduced:false,low:false});probe.g=g;
   const projected=r.project(x,.65,0),input=r.pointer(...Object.values(r.project(2,0,0))),normal=r.camera.position.clone().set(1,0,0).applyQuaternion(r.camera.quaternion);
   return{mode,unchanged:before===JSON.stringify(g),fov:r.camera.fov,position:r.camera.position.toArray(),car:{x:projected.x/innerWidth,y:projected.y/innerHeight},horizonTilt:normal.y,input,errors:r.assetErrors};
  },mode);
  assert.equal(view.unchanged,true);assert.equal(view.errors.length,0);assert.ok(Math.abs(view.horizonTilt)<1e-7);assert.ok(view.car.x>.1&&view.car.x<.9);assert.ok(view.car.y>.5&&view.car.y<.9);assert.ok(Math.abs(view.input.x-1000)<.01);assert.ok(Math.abs(view.input.y-500)<.01);views.push(view);
  await page.screenshot({path:out+`/course-${mode}.png`});
 }
 for(const [width,height]of [[1920,1080],[2560,1080],[2560,1440],[3840,2160],[844,390],[390,844]]){
  await page.setViewportSize({width,height});
  const state=await page.evaluate(()=>{const {r,g}=probe;r.draw(g,g,1,16.667,1.5,{running:true,reduced:false,low:false});const p=r.project(2,0,0),input=r.pointer(p.x,p.y),c=r.canvas.getBoundingClientRect();return{width:c.width,height:c.height,pixels:r.canvas.width*r.canvas.height,input,aspect:r.camera.aspect};});
  assert.equal(state.width,width);assert.equal(state.height,height);assert.equal(state.aspect,width/height);assert.ok(state.pixels<=3686400+10);assert.ok(Math.abs(state.input.x-1000)<.01);assert.ok(Math.abs(state.input.y-500)<.01);sizes.push(state);
 }
 await page.setViewportSize({width:1280,height:720});
 const driving=await page.evaluate(async()=>{
  const{r,createGame}=probe,g=createGame();Object.assign(g,{race_id:50,mode:0,distance:30000,speed:2350,drift_x:1000,drifting:1,steer_v:65,side_v:400,ability_ticks:60});g.bodies=[];g.rivals.forEach(q=>q.finish=1);await r.prepareRace(g);r.reset();
  for(let n=0;n<90;n++){g.distance+=40;g.tick++;r.draw(g,g,1,16.667,1,{running:true,reduced:false,low:false});}probe.g=g;
  return{thrust:r.driveVfx.thrust,smoke:r.driveVfx.particles.length,marks:r.driveVfx.marks.length,calls:r.renderer.info.render.calls};
 });
 assert.ok(driving.thrust>.99);assert.ok(driving.smoke>0&&driving.smoke<=48);assert.ok(driving.marks<=256);
 await page.screenshot({path:out+'/boost-and-tyres.png'});
 const reduced=await page.evaluate(()=>{const {r,g}=probe;r.chase.impact({impact_nx:1,impact_force:1800});g.ability_ticks=60;r.draw(g,g,1,16.667,1,{running:true,reduced:true,low:false});return{fov:r.camera.fov,kick:r.chase.kickX.value,position:r.camera.position.toArray()};});
 assert.equal(reduced.fov,59);assert.equal(reduced.kick,0);assert.deepEqual(errors,[]);
 await page.screenshot({path:out+'/reduced-motion.png'});await page.evaluate(()=>probe.r.dispose());
 writeFileSync(out+'/review.json',JSON.stringify({scope:'Synthetic camera/render fixtures; no physical-device or gameplay benchmark claim',views,sizes,driving,reduced,errors},null,2));
 console.log({courses:views.length,sizes:sizes.length,reduced,errors});
}finally{await browser.close();}
