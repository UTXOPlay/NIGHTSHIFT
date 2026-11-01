import assert from 'node:assert/strict';
import {createGame,applyAction,step} from '../../games/arcade/web/nightshift15-rules.mjs';
import {packInput} from '../../games/arcade/web/nightshift12-input.mjs';
import {driveInput} from './nightshift14-driver.mjs';

// A real V15 input sequence: drive to a fixed row, collide, reverse, then resume.
// No seeded currency, vehicles or body positions. Retain this counterexample.
export function recoveryTape(){
 const action={type:'race',mode:1,vehicle:0,gadget:0,difficulty:0},game=createGame(),inputs=[],frames=[];
 applyAction(game,action);const memory={};let collisionTick=0;
 for(let n=0;n<6000&&!game.over;n++){
  const blocks=game.bodies.filter(b=>b.tag===8&&b.y<860).sort((a,b)=>b.y-a.y);let input=driveInput(game,memory);
  if(blocks.length&&blocks[0].y> -1000){const target=blocks.reduce((a,b)=>Math.abs(b.x-game.drift_x)<Math.abs(a.x-game.drift_x)?b:a).x,steering=Math.max(-100,Math.min(100,Math.round((target-game.drift_x-game.lateral_v*4)*.32)));input=packInput(0,steering,0,100);}
  const shield=game.shield;step(game,input);inputs.push(input);
  if(game.shield<shield&&game.bodies.some(b=>b.tag===8&&Math.abs(830-b.y)<=26&&Math.abs(b.x-game.drift_x)<740)){collisionTick=game.tick;frames.push({label:'collision',game:structuredClone(game)});break;}
 }
 assert.ok(collisionTick&&!game.over,'The tape must reach a genuine barrier collision');
 for(let n=0;n<240&&!game.over;n++){const steering=n<70?0:Math.max(-100,Math.min(100,Math.round((game.drift_x-2000+game.lateral_v*4)*.32))),input=packInput(4,steering,0,100);step(game,input);inputs.push(input);if([119,179,239].includes(n))frames.push({label:'reverse-'+n,game:structuredClone(game)});}
 const driver={};for(let n=0;n<2400&&!game.over;n++){const input=driveInput(game,driver);step(game,input);inputs.push(input);if(game.pursuit<350&&game.speed>1100){frames.push({label:'normal-cleared',game:structuredClone(game)});break;}}
 assert.ok(frames.find(f=>f.label==='reverse-239').game.speed>0,'Historical traffic reproduces forward pushing despite reverse input');
 assert.ok(frames.some(f=>f.label==='normal-cleared'));
 return{action,collisionTick,inputs,frames};
}
