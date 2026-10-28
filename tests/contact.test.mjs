import test from 'node:test';import assert from 'node:assert/strict';
import {sweepContact,contactImpulse,resolveContacts} from '../games/arcade/web/nightshift9-contact.mjs';
test('continuous collision detects a fast crossing and rejects a separating gap',()=>{
 const h=sweepContact(0,9000,0,-9000,2080,4280);assert.equal(h.nz,-1);assert.ok(h.time>0&&h.time<65536);assert.ok(h.depth>9000);
 assert.equal(sweepContact(4000,9000,4000,-9000,2080,4280),null);
 assert.equal(contactImpulse(-1,0,-120,900,1450,1700).normal,0);
});
test('normal impulse depends on relative velocity and mass; side friction preserves forward momentum',()=>{
 const side=contactImpulse(-1,0,180,1100,1450,1700),front=contactImpulse(0,-1,180,1100,1450,1700);
 assert.ok(side.normal<front.normal);assert.ok(Math.abs(side.tz)<side.normal);assert.ok(contactImpulse(0,-1,0,1100,1840,1180).normal<contactImpulse(0,-1,0,1100,1180,1840).normal);
 assert.ok(contactImpulse(-1,0,180,1100,1450,1700,true).normal>side.normal);
});
test('side contact exchanges momentum without deleting traffic or consuming armor',()=>{
 const b={x:1500,y:830,vx:0,vy:16,tag:1,contact_cd:0},g={vehicle:0,rivals:[],bodies:[b],drift_x:1050,distance:1000,steer_v:70,side_v:0,yaw:0,yaw_v:0,speed:1660,contact_seq:0};let crashes=0;const events=[];
 resolveContacts(g,{x:980,distance:984,rivals:[],bodies:new Map([[b,{x:1500,distance:1000}]])},(...e)=>events.push(e),()=>crashes++);
 assert.equal(crashes,0);assert.equal(b.tag,1);assert.ok(g.side_v<0);assert.ok(b.vx>0);assert.equal(events[0][0],'scrape');
});
