// Render-only fixtures exercise actual shaders, resize, input and quality paths.
// They are not gameplay/physics evidence or a physical mobile-device benchmark.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:8899',out=process.env.DRIFT_OUT||'artifacts/lighting-v95/review';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],views=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
try{
 await page.route('**/games/nightshift/lighting-probe',r=>r.fulfill({contentType:'text/html',body:'<style>html,body{margin:0;overflow:hidden;background:#071015}canvas{width:100vw;height:100vh}</style><canvas></canvas>'}));
 await page.goto(origin+'/games/nightshift/lighting-probe');
 await page.evaluate(async()=>{const{DriftRenderer}=await import('./_arcade/nightshift9-renderer.bundle.mjs'),{createGame}=await import('./_arcade/nightshift9-rules.mjs');const r=new DriftRenderer(document.querySelector('canvas'));await r.load();window.probe={r,createGame};});
 const modes=(process.env.DRIFT_MODES||'0,1,2,3,4,5,6,7,8,9,10,11').split(',').map(Number);
 for(const mode of modes){
  const view=await page.evaluate(async mode=>{const {r,createGame}=probe,g=createGame();Object.assign(g,{mode,distance:7600,speed:1600});g.bodies=[];g.rivals.forEach(q=>q.finish=1);const before=JSON.stringify(g);await r.prepareRace(g);for(let n=0;n<12;n++)r.draw(g,g,1,1000/30,1,{running:true,reduced:true,low:false});probe.g=g;return{mode,unchanged:before===JSON.stringify(g),garageVisible:r.garageStage.visible,engine:r.engineSnapshot(),draw:{...r.renderer.info.render},look:r.activeLook};},mode);
  assert.ok(view.unchanged);assert.equal(view.garageVisible,false);assert.equal(view.engine.errors,0);assert.equal(view.engine.lightingProbes,4);assert.equal(view.engine.surface.maps,3);assert.ok(view.engine.pools<40);views.push(view);
  await page.screenshot({path:out+`/map-${mode}.png`});
 }
 const sizes=[];
 for(const [width,height] of [[1920,1080],[2560,1080],[2560,1440],[3840,2160],[844,390],[390,844]]){
  await page.setViewportSize({width,height});
  for(const low of [false,true,false]){
   const state=await page.evaluate(low=>{const {r,g}=probe;for(let n=0;n<3;n++)r.draw(g,g,1,16.667,1.5,{running:true,reduced:true,low,features:{tier:low?2:0,reflection:!low,shadowInterval:2,rainCount:400}});const p=r.project(2,0,0),input=r.pointer(p.x,p.y),buffer=r.renderer.getDrawingBufferSize(r.size??=r.point.clone());return{low,input,buffer:{width:buffer.x,height:buffer.y},post:r.post.snapshot()};},low);
   assert.ok(state.buffer.width*state.buffer.height<=3686400+10);assert.ok(Math.abs(state.input.x-1000)<.01);assert.ok(Math.abs(state.input.y-500)<.01);assert.ok(state.post.scenePixels<=3686400+10);if(low)assert.equal(state.post.active,false);sizes.push({width,height,...state});
  }
 }
 const capabilities=await page.evaluate(()=>{const gl=probe.r.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');return{renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),version:gl.getParameter(gl.VERSION)};});
 await page.evaluate(()=>{probe.r.dispose();probe.r.dispose();});assert.deepEqual(errors,[]);
 writeFileSync(out+'/review.json',JSON.stringify({scope:'Synthetic render-only fixtures; no claims about human play or physical-phone performance',views,sizes,capabilities,errors},null,2));console.log({maps:views.length,resizeAndQualityCases:sizes.length,capabilities,errors});
}finally{await browser.close();}
