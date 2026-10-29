import {chromium} from 'playwright';import assert from 'node:assert/strict';import{mkdirSync,writeFileSync}from'node:fs';
const out=process.env.DRIFT_OUT||'artifacts/streets-v93/views',origin=process.env.DRIFT_ORIGIN||'http://127.0.0.1:8899';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],views=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
try{
 await page.route('**/games/nightshift/streets-probe',r=>r.fulfill({contentType:'text/html',body:'<style>html,body{margin:0;overflow:hidden}canvas{width:100vw;height:100vh}</style><canvas></canvas>'}));
 await page.goto(origin+'/games/nightshift/streets-probe');await page.evaluate(async()=>{const {DriftRenderer}=await import('./_arcade/nightshift9-renderer.bundle.mjs'),{createGame}=await import('./_arcade/nightshift9-rules.mjs');window.probe={r:new DriftRenderer(document.querySelector('canvas')),createGame};await probe.r.load();});
 for(let mode=0;mode<12;mode++)for(const distance of [7600,38000]){
  const state=await page.evaluate(async({mode,distance})=>{const {r,createGame}=probe,g=createGame();Object.assign(g,{mode,distance,speed:1600});g.bodies=[];g.rivals.forEach(q=>q.finish=1);await r.prepareRace(g);for(let n=0;n<22;n++)r.draw(g,g,1,1000/30,1,{running:true,reduced:true,low:false});return{mode,distance,engine:r.engineSnapshot(),lighting:r.lighting.snapshot(),draw:{...r.renderer.info.render}};},{mode,distance});
  assert.equal(state.engine.facadeFamilies,8);assert.equal(state.engine.streetVariants,24);assert.equal(state.lighting.physicalLights,2);assert.ok(state.engine.pools<40);views.push(state);await page.screenshot({path:out+`/map-${mode}-${distance}.png`});
 }
 await page.evaluate(()=>probe.r.dispose());assert.deepEqual(errors,[]);writeFileSync(out+'/review.json',JSON.stringify({views,errors},null,2));console.log({views:views.length,errors});
}finally{await browser.close();}
