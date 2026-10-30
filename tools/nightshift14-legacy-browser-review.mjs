import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {createServer} from 'node:net';
import {randomBytes} from 'node:crypto';
import {mkdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {createNightshift14} from '../host/nightshift14.mjs';
import {SAVED_PROFILES} from '../games/arcade/web/nightshift14-session-rules.mjs';
import {step as step13} from '../games/arcade/web/nightshift13-rules.mjs';
import {step as step14} from '../games/arcade/web/nightshift14-rules.mjs';
import {packInput} from '../games/arcade/web/nightshift12-input.mjs';

const out=process.env.DRIFT_OUT||'artifacts/rivals-v14/legacy-browser';mkdirSync(out,{recursive:true});
const data=path.resolve(mkdtempSync(out+'/data-')),token=randomBytes(32).toString('hex'),account=randomBytes(32).toString('hex');
const reserved=[];for(let n=0;n<3;n++){const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));reserved.push(server);}
const [web,career,current]=reserved.map(s=>s.address().port);await Promise.all(reserved.map(s=>new Promise(r=>s.close(r))));
const origin='http://127.0.0.1:'+web,headers={'X-Runtime-Token':token,'X-UTXOPlay-Account':account,'Content-Type':'application/json'};
const host=createNightshift14({env:{RUNTIME_TOKEN:token,WEB_PORT:String(web),GAME_ORIGIN:origin,DATA_DIR:path.join(data,'v14'),RUNTIME_PORT:String(current),CAREER_DATA_DIR:path.join(data,'v13'),CAREER_RUNTIME_PORT:String(career)}});
const server=host.service.app.listen(web,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({args:['--no-sandbox','--use-angle=gl','--enable-webgl','--ignore-gpu-blocklist']});
const errors=[],tapes=[],checks={};let page;
const command=(s,action)=>({session_id:s.session.id,expected_block:s.session.block_hash,action});
async function raw13(endpoint,body){const r=await host.pool.fetch('http://127.0.0.1:'+career+'/drift-run/api/'+endpoint,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();}
try{
 let seed=await raw13('state');seed=await raw13('action',command(seed,{type:'upgrade',vehicle:0,choice:1}));seed=await raw13('action',command(seed,{type:'tune',vehicle:0,levels:[0,0,0]}));seed=await raw13('action',command(seed,{type:'ticks',inputs:Array(45).fill(packInput(0,0,0,100))}));
 const ctx=await browser.newContext({viewport:{width:1920,height:1080},extraHTTPHeaders:headers});ctx.setDefaultTimeout(90000);page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.method()==='POST'&&r.url().endsWith('/api/action')){const body=r.postDataJSON();if(body.action?.type==='ticks')tapes.push(...body.action.inputs);}});
 await page.goto(origin+'/games/nightshift/?review=1');await page.waitForFunction(()=>window.__driftReview?.().loaded);await page.locator('utxo-loader').waitFor({state:'detached'});
 assert.deepEqual(await page.evaluate(()=>__driftReview().game),seed.game);assert.equal(await page.evaluate(()=>__driftReview().view),'pause');
 const canvas=await page.$('canvas');assert.ok(canvas);checks.originalV13LoadedExactly=true;
 await page.getByRole('button',{name:'Resume race',exact:true}).click();await page.waitForFunction(()=>__driftReview().running);await page.keyboard.down('w');await page.keyboard.down('d');await page.waitForTimeout(500);await page.keyboard.up('d');await page.keyboard.up('w');await page.keyboard.press('p');await page.waitForFunction(()=>!__driftReview().running&&!__driftReview().pending&&!__driftReview().sending);
 const continued=await(await ctx.request.get(origin+'/games/nightshift/api/state')).json(),expected=structuredClone(seed.game);for(const i of tapes)step13(expected,i);
 assert.ok(tapes.length>0);assert.deepEqual(continued.game,expected);assert.deepEqual(await page.evaluate(()=>__driftReview().game),expected);assert.equal(continued.session.profile,SAVED_PROFILES[13]);assert.ok(expected.drift_x>seed.game.drift_x);assert.equal((await raw13('replay',{})).verified,true);checks.originalV13PedalsAndReplay=true;
 const proof=await raw13('export'),careerBefore=structuredClone(continued.game.career);await page.screenshot({path:out+'/v13-resumed.png'});
 await page.getByRole('button',{name:'Choose another event',exact:true}).click();await page.locator('[data-mode="0"]').click();tapes.length=0;await page.getByRole('button',{name:'Start selected race and forfeit current run',exact:true}).click();
 await page.waitForFunction(()=>__driftReview().game.physics_version===14&&__driftReview().countdown>0);const start=await(await ctx.request.get(origin+'/games/nightshift/api/state')).json();assert.equal(start.session.profile,SAVED_PROFILES[14]);assert.equal(start.game.tick,0);
 for(const k of ['credits','earned','spent','rep','owned','upgrades','tunes','unlocked','medals','races','wins'])assert.deepEqual(start.game.career[k],careerBefore[k],k+' survives explicit migration');
 await page.waitForFunction(()=>__driftReview().running);await page.keyboard.down('w');await page.keyboard.down('a');await page.waitForTimeout(400);await page.keyboard.up('a');await page.keyboard.up('w');await page.keyboard.press('p');await page.waitForFunction(()=>!__driftReview().running&&!__driftReview().pending&&!__driftReview().sending);
 const finish=await(await ctx.request.get(origin+'/games/nightshift/api/state')).json(),newExpected=structuredClone(start.game);for(const i of tapes)step14(newExpected,i);assert.ok(tapes.length>0);assert.deepEqual(finish.game,newExpected);assert.deepEqual(await page.evaluate(()=>__driftReview().game),newExpected);assert.ok(newExpected.drift_x<start.game.drift_x);assert.equal(await canvas.evaluate(el=>el===document.querySelector('canvas')),true);
 const replay=await ctx.request.post(origin+'/games/nightshift/api/replay',{headers:{Origin:origin},data:{}});assert.equal((await replay.json()).verified,true);const exported=await(await ctx.request.get(origin+'/games/nightshift/api/export')).json();assert.deepEqual(exported.origin,proof);assert.deepEqual(await raw13('export'),proof);checks.explicitV14MigrationAndReplay=true;checks.inactivePartsAndCareerRetained=true;checks.originalSignedProofRetained=true;checks.sameCanvasWithoutReload=true;
 await page.screenshot({path:out+'/v14-migrated.png'});assert.deepEqual(errors,[]);const report={version:14,profile:SAVED_PROFILES[14],checks,errors,oldTick:continued.game.tick,newTick:finish.game.tick,input:'Ordinary browser keyboard events and signed host commands; no game-state injection',physicalDevices:false};writeFileSync(out+'/review.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}catch(error){if(page){writeFileSync(out+'/failure.json',JSON.stringify({error:String(error),review:await page.evaluate(()=>window.__driftReview?.()).catch(()=>null)},null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});}throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));await host.close();}
