import{createGame,applyAction,step}from'../games/arcade/web/nightshift12-rules.mjs';
import{driveInput}from'../tests/helpers/nightshift12-driver.mjs';
import{mkdirSync,writeFileSync}from'node:fs';
const g=createGame(),setup={type:'race',mode:0,vehicle:0,gadget:0,difficulty:0,spec:1},inputs=[],driver={};applyAction(g,setup);while(!g.over){const i=driveInput(g,driver);inputs.push(i);step(g,i);}if(!g.won)throw Error('No valid historical stock PB');mkdirSync('artifacts/career-v13',{recursive:true});writeFileSync('artifacts/career-v13/v12-stock-tape.json',JSON.stringify({setup,inputs,expectedTicks:g.tick}));console.log({ticks:g.tick,seconds:g.tick/30});
