import {installStageAssets} from './nightshift12-stage-assets.mjs';
import {chromium} from 'playwright';
import {reviewSession} from './review-session.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const origin=process.env.REVIEW_ORIGIN||'http://127.0.0.1:19926',output=process.env.OUTPUT_DIR||'artifacts/mobile-fullscreen/stage';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1,reducedMotion:'reduce'});let logout;const errors=[],checks=[],failures=[];
try{
 await installStageAssets(context,origin);
 logout=await reviewSession(context,origin);
 const account=(await(await context.request.get(origin+'/api/me')).json()).user;
 if(process.env.STAGE_PAID_FIXTURE==='1'){
  assert.equal(origin,'http://127.0.0.1:19926');assert.match(account.id,/^[a-f0-9]{64}$/);
  execFileSync('ssh',['-S','/tmp/mobile-fullscreen-deploy-ssh','root@8.217.101.26','python3 -'],{input:`import sqlite3,time\ndb=sqlite3.connect('/data/utxoplay/releases/20261030-mobile-fullscreen/stage-data/platform.sqlite')\ndb.execute("INSERT OR IGNORE INTO entitlements(account,game,kind,active,created) VALUES(?,?,'fixture-fullscreen',1,?)",('${account.id}','neon-coil',int(time.time()*1000)))\ndb.commit()\n`});
 }
 const games=(await(await context.request.get(origin+'/api/games')).json()).games.filter(g=>process.env.GAME_IDS?process.env.GAME_IDS.split(',').includes(g.id):g.canPlay!==false);
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 for(const game of games){
  try{
   await page.goto(origin+'/games/'+game.id+'/');const entry=page.getByRole('dialog',{name:'Fullscreen game entry'});await entry.waitFor({timeout:25000});assert.equal(await page.locator('iframe.game-frame').evaluate(e=>e.inert),true);if(['chess','botstrike','flashfire'].includes(game.id))await page.screenshot({path:output+'/'+game.id+'-entry.png'});
   await page.getByRole('button',{name:'Enter fullscreen',exact:true}).click();await page.waitForFunction(()=>!!document.fullscreenElement,{},{timeout:10000});await page.locator('.game-stage.is-ready').waitFor({timeout:35000});assert.equal(await page.locator('iframe.game-frame').evaluate(e=>e.inert),false);const rect=await page.locator('iframe.game-frame').boundingBox();assert.equal(rect.width,844);assert.equal(rect.height,390);
   const instance=await page.locator('iframe.game-frame').elementHandle();let navigations=0;const observed=()=>navigations++;page.on('framenavigated',observed);
   await page.evaluate(()=>document.exitFullscreen());await page.getByRole('button',{name:'Enter fullscreen',exact:true}).waitFor({timeout:10000});assert.equal(await page.locator('iframe.game-frame').evaluate(e=>e.inert),true);
   await page.getByRole('button',{name:'Enter fullscreen',exact:true}).click();await page.waitForFunction(()=>!!document.fullscreenElement);assert.equal(await instance.evaluate(e=>e===document.querySelector('iframe.game-frame')),true);assert.equal(navigations,0);page.off('framenavigated',observed);
   const record={id:game.id,pricing:game.pricing||'free',ready:true,fullscreen:true,reentry:true,sameGameInstance:true};checks.push(record);console.log(JSON.stringify(record));
  }catch(error){const failure={id:game.id,error:error.message};failures.push(failure);console.log(JSON.stringify(failure));await page.screenshot({path:output+'/'+game.id+'-failure.png'}).catch(()=>{});}
 }
 await page.goto(origin+'/');assert.equal(await page.locator('.utxo-fullscreen-entry').count(),0);
 const report={origin,checks,failures,errors};writeFileSync(output+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);
}finally{await logout?.();await context.close();await browser.close();}
