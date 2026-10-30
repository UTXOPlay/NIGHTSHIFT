import {keyboardConfig as legacyConfig} from './nightshift-keyboard.mjs';
export const KEY_ACTIONS=Object.freeze([
 ['left','STEER LEFT',1],['right','STEER RIGHT',2],['throttle','ACCELERATE',128],['brake','BRAKE',256],['drift','HANDBRAKE',8],
 ['reverse','REVERSE',4],['fire','FIRE',32],['counter','COUNTER',64],['boost','BOOST',16],['pause','PAUSE',0]
]);
const presets={
 qwerty:{left:'a',right:'d',throttle:'w',brake:'s',drift:'x',reverse:'z',fire:'e',counter:'q',boost:'Space',pause:'p'},
 colemak:{left:'a',right:'s',throttle:'w',brake:'r',drift:'x',reverse:'z',fire:'f',counter:'q',boost:'Space',pause:'p'},
 arrows:{left:'ArrowLeft',right:'ArrowRight',throttle:'ArrowUp',brake:'ArrowDown',drift:'x',reverse:'z',fire:'e',counter:'q',boost:'Space',pause:'p'}
};
const valid=k=>typeof k==='string'&&(/^[a-z0-9]$/.test(k)||['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k));
export const eventKey=e=>e.key===' '?'Space':e.key?.length===1?e.key.toLowerCase():e.key;
export const keyLabel=key=>({ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',Space:'SPACE'})[key]||key.toUpperCase();
export function keyboardConfig(saved,legacy){
 let value;try{value=JSON.parse(saved);}catch{}
 if(!value && legacy){
  const old=legacyConfig(legacy);
  if(old.custom){const bindings={...old.bindings,brake:old.bindings.drift};delete bindings.drift;
   for(const [action,choices] of [['throttle',['w','ArrowUp','i','u','7']],['drift',['x','c','v','b','8']]])bindings[action]=choices.find(key=>!Object.values(bindings).includes(key));
   value={...old,bindings};}
  else value={preset:old.preset};
 }
 const preset=Object.hasOwn(presets,value?.preset)?value.preset:'qwerty';
 const bindings={...presets[preset]};
 if(value?.custom){const entries=KEY_ACTIONS.map(([id])=>[id,value.bindings?.[id]]);if(entries.every(([,k])=>valid(k))&&new Set(entries.map(([,k])=>k)).size===entries.length)Object.assign(bindings,Object.fromEntries(entries));}
 return{preset,custom:!!value?.custom,bindings};
}
export function keyboardPreset(preset){return keyboardConfig(JSON.stringify({preset}));}
export function bindKey(config,action,key){
 if(!KEY_ACTIONS.some(([id])=>id===action)||!valid(key))throw Error('Choose a letter, number, arrow or Space.');
 const conflict=KEY_ACTIONS.find(([id])=>id!==action&&config.bindings[id]===key);
 if(conflict)throw Error('Already bound to '+conflict[1]+'.');
 const reserved={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'brake',ArrowUp:'throttle'};
 if(reserved[key]&&reserved[key]!==action)throw Error('That arrow is reserved for driving.');
 return{...config,custom:true,bindings:{...config.bindings,[action]:key}};
}
export function keyboardAction(config,e){
 if(e.ctrlKey||e.altKey||e.metaKey||e.isComposing)return null;
 const key=eventKey(e),direct=KEY_ACTIONS.find(([id])=>config.bindings[id]===key);
 return direct||KEY_ACTIONS.find(([id])=>id===({ArrowLeft:'left',ArrowRight:'right',ArrowDown:'brake',ArrowUp:'throttle'})[key])||null;
}
