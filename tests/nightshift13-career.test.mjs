import {test} from 'node:test';import assert from 'node:assert/strict';
import {createGame,applyAction,step,chapterOpen,contractActive,contractGate,EVENTS} from '../games/arcade/web/nightshift13-rules.mjs';
import {driveInput} from './helpers/nightshift13-driver.mjs';import {keyboardConfig} from '../games/arcade/web/nightshift12-keyboard.mjs';import {rewardReceipt,buildClass,buildStats,nextCareerEvent} from '../games/arcade/web/nightshift13-career.mjs';
function finish(g,mode=0){applyAction(g,{type:'race',mode,vehicle:0,gadget:mode%4===3?0:1,difficulty:0});const driver={};while(!g.over)step(g,driveInput(g,driver));return g;}
test('new drivers can choose four disciplines; chapter licenses require distinct medals',()=>{
 const g=createGame(),original=structuredClone(g);assert.ok(chapterOpen(g.career,3));assert.ok(!chapterOpen(g.career,4));assert.throws(()=>applyAction(g,{type:'race',mode:4,vehicle:0,gadget:0,difficulty:0}));assert.deepEqual(g,original);
 finish(g,0);assert.equal(g.won,1);assert.ok(!chapterOpen(g.career,4));const first=g.reward_first;finish(g,0);assert.equal(g.reward_first,0);assert.equal(first,250);assert.equal(g.career.medals.filter(Boolean).length,1);
 finish(g,2);finish(g,3);assert.equal(g.won,1);assert.equal(chapterOpen(g.career,4),true);assert.equal(g.reward_chapter,750);assert.equal(g.career.chapter_claims,1);
 assert.ok(nextCareerEvent(g.career).mode<8);assert.equal(g.career.credits,1200+g.career.earned-g.career.spent);
});
test('workshop gates parts, records purchases and enforces an editable six-point build',()=>{
 const g=createGame();assert.throws(()=>applyAction(g,{type:'buy',choice:1}),/reputation/);applyAction(g,{type:'upgrade',vehicle:0,choice:0});assert.deepEqual(g.career.tunes[0],[1,0,0]);assert.throws(()=>applyAction(g,{type:'upgrade',vehicle:0,choice:0}),/reputation/);
 // Shop fixture isolates allocation validation; full earned-credit purchases run in conformance.
 g.career.rep=700;g.career.earned=30000;g.career.credits=1200+g.career.earned-g.career.spent;
 for(let c=0;c<3;c++)while(g.career.upgrades[0][c]<3)applyAction(g,{type:'upgrade',vehicle:0,choice:c});assert.equal(g.career.tunes[0].reduce((a,b)=>a+b),6);
 assert.throws(()=>applyAction(g,{type:'tune',vehicle:0,levels:[3,3,3]}));const balance=g.career.credits;applyAction(g,{type:'tune',vehicle:0,levels:[3,0,3]});const straight=buildStats(g.career,0);applyAction(g,{type:'tune',vehicle:0,levels:[0,3,3]});const bend=buildStats(g.career,0);assert.ok(straight.speed>bend.speed&&straight.turn<bend.turn);assert.equal(g.career.credits,balance);assert.equal(buildClass(g.career,0).used,6);
 applyAction(g,{type:'race',mode:0,vehicle:0,gadget:0,difficulty:0});step(g,1<<30);assert.throws(()=>applyAction(g,{type:'tune',vehicle:0,levels:[0,0,0]}));
});
test('intercept target gates span the route and final target stays closed until 88%',()=>{
 for(const mode of [3,7,11]){const g=createGame();g.career.unlocked=7;applyAction(g,{type:'race',mode,vehicle:0,gadget:0,difficulty:0});const count=EVENTS[mode].rivals;for(let rank=0;rank<count;rank++){const id=(rank+mode+g.race_id)%5,gate=contractGate(g,rank);g.distance=gate-1;assert.equal(contractActive(g,id),false);g.distance++;assert.equal(contractActive(g,id),true);}assert.equal(contractGate(g,count-1),Math.floor(EVENTS[mode].distance*.88));}
});
test('reward receipt accounts for every credit and one-time bonuses',()=>{const g=finish(createGame());const r=rewardReceipt(g);assert.equal(r.total,g.reward);assert.equal(r.lines.reduce((s,[,n])=>s+n,0),g.reward);assert.ok(r.lines.some(([n])=>n==='Sector contracts'));assert.ok(r.lines.some(([n])=>n==='First district medal'));assert.equal(r.rep,g.reward_rep);
 const legacy={...g,physics_version:12,reward:400+(7-g.position)*140+g.won*300+Math.min(300,Math.floor(g.style/40))+g.takedowns*60,reward_first:0,reward_chapter:0};assert.ok(rewardReceipt(legacy).lines.length>0);
});
test('a full legacy candidate collision preserves every custom binding',()=>{const old={preset:'colemak',custom:true,bindings:{left:'i',right:'u',drift:'7',reverse:'z',fire:'w',counter:'q',boost:'ArrowUp',pause:'p'}},next=keyboardConfig(null,JSON.stringify(old));for(const [action,key]of Object.entries(old.bindings))assert.equal(next.bindings[action==='drift'?'brake':action],key);assert.equal(new Set(Object.values(next.bindings)).size,10);});
