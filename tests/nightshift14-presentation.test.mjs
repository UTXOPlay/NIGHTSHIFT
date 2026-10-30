import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,applyAction} from '../games/arcade/web/nightshift14-rules.mjs';
import {createGame as game13,step as step13} from '../games/arcade/web/nightshift13-rules.mjs';
import {SAVED_PROFILES,sessionRules} from '../games/arcade/web/nightshift14-session-rules.mjs';
import {combatHud,rivalReadout} from '../games/arcade/web/nightshift14-feedback.mjs';
import {tacticalReadout} from '../games/arcade/web/nightshift14-tactics.mjs';
import {PersonalGhost} from '../games/arcade/web/nightshift14-ghost.mjs';
test('saved sessions choose their exact profile; a future version or mismatched profile never gets optimistic rules',()=>{
 for(let version=8;version<=14;version++){const state={game:{kind:'drift-run',...(version===8?{}:{physics_version:version})},session:{profile:SAVED_PROFILES[version]}};assert.equal(sessionRules(state).version,version);assert.equal(sessionRules(state).legacy,version===8);assert.throws(()=>sessionRules({...state,session:{profile:SAVED_PROFILES[version===14?13:14]}}));}
 assert.equal(sessionRules({game:game13(),session:{profile:SAVED_PROFILES[13]}}).rules.step,step13);
 assert.throws(()=>sessionRules({game:{kind:'drift-run',physics_version:15},session:{profile:SAVED_PROFILES[14]}}));
});
test('cover explains a lost lock rather than presenting a ready shot',()=>{
 const g=createGame();g.distance=10000;g.rivals.forEach(r=>r.finish=1);Object.assign(g.rivals[0],{finish:0,distance:10400,x:1000});g.bodies=[{id:1,tag:1,x:1000,y:630,vx:0,vy:6}];
 const hud=combatHud(g);assert.equal(hud.lineBlocked,true);assert.equal(hud.weaponReady,false);assert.equal(hud.targetHud.id,0);assert.equal(hud.targetHud.label,'LINE BLOCKED');assert.match(tacticalReadout(g).title,/BLOCKED/);
});
test('courier cues distinguish relay standby, a moving closed gate, active bounty and a secured target',()=>{
 const g=createGame();applyAction(g,{type:'race',mode:3,vehicle:0,gadget:0,difficulty:0});const r=g.rivals[4];
 assert.equal(rivalReadout(g,r).phase,'staged');assert.equal(rivalReadout(g,r).loadLimit,162);g.distance=r.release_at;assert.match(tacticalReadout(g).title,/RELAY/);
 r.staged=0;assert.equal(rivalReadout(g,r).phase,'gate-closed');assert.match(tacticalReadout(g).title,/MOVE/);
 g.distance=11200;assert.equal(rivalReadout(g,r).phase,'active');g.contract_done|=1<<r.id;r.hp=0;g.lock_id=r.id;g.lock_ticks=18;assert.equal(combatHud(g).targetHud.phase,'secured');
});
test('energy reboot and collision armor have separate readable consequences',()=>{
 const g=createGame();g.hull=0;assert.equal(combatHud(g).weaponReady,false);assert.match(tacticalReadout(g).title,/RECOVERING/);g.hull=2;g.shield=0;assert.match(tacticalReadout(g).title,/COLLISION ARMOR/);assert.match(tacticalReadout(g).detail,/fatal/);
});
test('V14 personal ghosts cannot reinterpret a stored V13 tape or overwrite its profile key',()=>{
 const storage=new Map(),io={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},ghost=new PersonalGhost(SAVED_PROFILES[14],io),old=game13();old.spec=1;
 io.setItem(ghost.key('best'),JSON.stringify({profile:SAVED_PROFILES[14],initial:old,inputs:[]}));assert.equal(ghost.read('best'),null);ghost.begin(old,'legacy');assert.equal(ghost.capture,null);
 const current=createGame();current.spec=1;ghost.begin(current,'current');assert.ok(ghost.capture);const capture={...ghost.capture,profile:SAVED_PROFILES[13]};current.over=true;current.won=1;assert.equal(ghost.complete(current,true,capture),false);assert.equal(storage.has('nightshift:ghost:'+SAVED_PROFILES[13]+':best'),false);
});
