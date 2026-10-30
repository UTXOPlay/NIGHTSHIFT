import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {driveFeedback,driveMix} from '../games/arcade/web/nightshift9-drive-feedback.mjs';
import {DriveVfx} from '../games/arcade/web/nightshift9-drive-vfx.mjs';
const state=()=>({tick:10,race_id:1,specials:0,ability_ticks:0,near_misses:0,charge:299,speed:1800,steer_v:0,side_v:0,drifting:0,stun:0,over:0,bodies:[]});

test('charge cues require a real new usable tier; spending charge is silent',()=>{
 const a=state();assert.deepEqual(driveFeedback(a,{...a,tick:11,charge:300}),[{type:'ready',tier:1,strength:.45}]);
 for(const [from,to]of [[300,599],[900,900],[900,600],[600,0]])assert.deepEqual(driveFeedback({...a,charge:from},{...a,tick:11,charge:to}),[]);
 assert.equal(driveFeedback({...a,charge:899},{...a,tick:11,charge:900})[0].tier,3);
});
test('boost cues follow real activation and release, not rendering frames',()=>{
 const a=state(),b={...a,tick:11,specials:1,ability_ticks:89};assert.equal(driveFeedback(a,b)[0].type,'boost');
 assert.deepEqual(driveFeedback(b,{...b,tick:12,ability_ticks:88}),[]);
 assert.equal(driveFeedback(b,{...b,tick:12,ability_ticks:0})[0].type,'boostEnd');
 for(const next of [a,{...b,tick:9},{...b,race_id:2}])assert.deepEqual(driveFeedback(a,next),[]);
});
test('close passes are directional, bounded and do not mutate signed state',()=>{
 const a={...state(),bodies:[{tag:1,x:1900,y:835},{tag:1,x:0,y:100}] ,drift_x:1000},b={...a,tick:11,near_misses:1,speed:3000};const before=JSON.stringify([a,b]),cue=driveFeedback(a,b)[0];assert.equal(cue.type,'pass');assert.equal(cue.pan,.8);assert.equal(cue.strength,1);assert.equal(JSON.stringify([a,b]),before);
});
test('grip release excludes wreck and stun, and mixing responds to actual load and slip',()=>{
 const a={...state(),drifting:1,steer_v:80},b={...a,tick:11,drifting:0};assert.equal(driveFeedback(a,b)[0].type,'grip');assert.deepEqual(driveFeedback(a,{...b,stun:1}),[]);assert.deepEqual(driveFeedback(a,{...b,over:1}),[]);
 const fast=driveMix({...b,speed:2500,ability_ticks:60},a),slow=driveMix({...b,speed:0},a);assert.equal(fast.speed,1);assert.equal(fast.boost,1);assert.ok(fast.load>slow.load);assert.equal(slow.slip,0);assert.equal(driveMix({...a,stun:1,ability_ticks:60}).boost,0);
});
test('render-rate updates cannot manufacture engine acceleration',()=>{
 const a=state();assert.equal(driveMix(a,a).load,.4);assert.equal(driveMix({...a,tick:200,speed:2500},a).load,.4);
});
test('tyre smoke and thrust stay bounded, fade out and respect reduced motion without rule writes',()=>{
 const scene=new T.Scene(),vfx=new DriveVfx(scene),camera=new T.PerspectiveCamera(),car=new T.Object3D(),g={...state(),drifting:1,steer_v:80,ability_ticks:60};vfx.loaded=true;camera.position.set(0,5,10);
 const options={running:true,reduced:false,low:false,car,rig:{contacts:[{x:-1,at:0,y:0,rear:true},{x:1,at:0,y:0,rear:true}],exhaust:[{x:-.4,y:.5,z:0},{x:.4,y:.5,z:0}]}};
 const before=JSON.stringify(g);for(let n=0;n<300;n++)vfx.draw(g,n,1/60,camera,()=>0,options);
 assert.equal(JSON.stringify(g),before);assert.ok(vfx.particles.length<=48);assert.ok(vfx.marks.length<=256);assert.equal(vfx.smoke.count,48);assert.equal(vfx.plumes.count,2);assert.ok(vfx.thrust>.99);assert.ok(vfx.particles.every(p=>p.life<=.59));
 g.ability_ticks=0;for(let n=0;n<60;n++)vfx.draw(g,n+300,1/60,camera,()=>0,options);assert.equal(vfx.plumes.visible,false);
 vfx.draw(g,360,1/60,camera,()=>0,{...options,reduced:true});assert.equal(vfx.thrust,0);assert.equal(vfx.smoke.visible,false);assert.equal(vfx.ribbons.visible,false);assert.equal(vfx.particles.length,0);
});
