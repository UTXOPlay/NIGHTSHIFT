import {DrivingCoach} from './nightshift12-driving-coach.mjs';
import {packInput as legacyPack} from './nightshift11-input.mjs';
import {packInput} from './nightshift12-input.mjs';
import {GamepadInput,gamepadBits,GAMEPAD_KEYS,DRIVE_GAMEPAD_KEYS,focusTarget} from './nightshift12-gamepad.mjs';
import {DrivingCoach as LegacyCoach} from './nightshift-driving-coach.mjs';
import {keyLabel} from './nightshift-keyboard.mjs';
import {icon,button} from './nightshift8-icons.mjs';

export function createControls(ctx){
 const pad=new GamepadInput();let sample={active:false},source='keyboard',lastHint='',actionBusy=false;
 const current=()=>ctx.getGame().physics_version>=12;
 const readCoach=(key,Type)=>{let saved;try{saved=JSON.parse(ctx.read(key,'null'));}catch{}return new Type(saved);};
 const coaches=[readCoach('nightshift:practice',LegacyCoach),readCoach('nightshift:practice:v12',DrivingCoach)];
 const practice=()=>coaches[current()?1:0],persist=()=>ctx.write(current()?'nightshift:practice:v12':'nightshift:practice',JSON.stringify(practice().snapshot()));
 const coachEl=document.createElement('aside');coachEl.id='drive-coach';coachEl.hidden=true;coachEl.setAttribute('aria-label','Driving practice');
 const artwork=document.createElement('span'),caption=document.createElement('div'),pips=document.createElement('span');pips.className='coach-pips';
 const dismiss=button('close','Dismiss driving practice',()=>{practice().dismiss();persist();coachEl.hidden=true;});
 coachEl.append(artwork,caption,pips,dismiss);ctx.root.append(coachEl);
 const settings=document.createElement('details');settings.id='gamepad-guide';settings.innerHTML='<summary>Controller</summary><p class="controller-status">Press a button after centering the sticks to connect a standard controller.</p><dl><div><dt>LS</dt><dd>Steer</dd></div><div><dt>RT</dt><dd>Accelerate</dd></div><div><dt>LT</dt><dd>Brake</dd></div><div><dt>B</dt><dd>Handbrake</dd></div><div><dt>LB</dt><dd>Reverse</dd></div><div><dt>A</dt><dd>Boost</dd></div><div><dt>X</dt><dd>Equipped weapon</dd></div><div><dt>Y</dt><dd>Counter jammer</dd></div><div><dt>MENU</dt><dd>Pause / resume</dd></div><div><dt>D-PAD / A / B</dt><dd>Navigate / select / back</dd></div></dl><p>Independent throttle in new events. Existing V8–V11 races retain their original automatic throttle and RT boost until the next event. Keyboard and touch remain available. Recenter and release buttons after a pause or input change. Controller audio may require a keyboard press or tap on the sound icon first.</p>';
 document.querySelector('#help-actions').before(settings);
 document.querySelector('#help-actions').append(button('help','Practice steering, braking and boost in a race',()=>{practice().reset();persist();ctx.closeKeys();void(ctx.getGame().tick&&!ctx.getGame().over?ctx.resume():ctx.start());}));
 function refresh(){
  for(const b of ctx.buttons){const bit=+b.dataset.input,action=ctx.keyActions().find(([, ,n])=>n===bit);if(!action)continue;b.querySelector('.ability-key').textContent=source==='gamepad'?(current()?DRIVE_GAMEPAD_KEYS:GAMEPAD_KEYS)[bit]:keyLabel(ctx.keys().bindings[action[0]]);}
  ctx.root.dataset.input=source;
 }
 function setSource(next){if(source!==next){source=next;lastHint='';refresh();}}
 addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;if(source==='gamepad')ctx.clear();else pad.suspend();setSource('keyboard');},true);
 addEventListener('pointerdown',e=>{if(source==='gamepad')ctx.clear();else pad.suspend();setSource(e.pointerType==='touch'?'touch':'keyboard');},true);
 const getPads=()=>{try{return navigator.getGamepads?.()||[];}catch{return[];}};
 function focusables(){const modal=['#keybinds','#race-plan'].map(s=>document.querySelector(s)).find(e=>e&&!e.hidden);return[...(modal||ctx.root).querySelectorAll('button,select,input[type=range],summary,a[href]')].filter(e=>!e.disabled&&!e.closest('[hidden]')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');}
 function navigate(direction){
  const els=focusables(),active=document.activeElement;
  if(active?.tagName==='INPUT'&&active.type==='range'&&(direction==='left'||direction==='right')){const step=Number(active.step)||.05;active.value=String(Math.max(Number(active.min)||0,Math.min(Number(active.max)||1,Number(active.value)+(direction==='right'?step:-step))));active.dispatchEvent(new Event('input',{bubbles:true}));return;}
  if(active?.tagName==='SELECT'&&(direction==='left'||direction==='right')){active.selectedIndex=Math.max(0,Math.min(active.options.length-1,active.selectedIndex+(direction==='right'?1:-1)));active.dispatchEvent(new Event('change',{bubbles:true}));return;}
  const n=focusTarget(els.map(e=>e.getBoundingClientRect()),els.indexOf(active),direction);els[n]?.focus({preventScroll:true});els[n]?.scrollIntoView({block:'nearest',inline:'nearest'});
 }
 async function act(fn){if(actionBusy)return;actionBusy=true;try{await fn();}catch(error){ctx.toast(error.message);}finally{actionBusy=false;}}
 function poll(now){
  const enabled=ctx.loaded()&&!ctx.busy()&&!document.hidden&&document.documentElement.dataset.orientationBlocked!=='true'&&!ctx.humanHeld();
  if(!enabled)pad.suspend();sample=pad.poll(getPads(),{enabled,now});
  const status=settings.querySelector('.controller-status'),label=sample.active?'STANDARD CONTROLLER / ACTIVE':sample.connected?'STANDARD CONTROLLER / CENTER AND RELEASE TO ARM':'Press a button after centering the sticks to connect a standard controller.';
  if(status.textContent!==label)status.textContent=label;
  if(sample.lost&&(ctx.running()||ctx.countdown())){void ctx.pause();ctx.toast('CONTROLLER DISCONNECTED / RACE PAUSED');}
  if(sample.active){
   setSource('gamepad');
   if(sample.pause)void act(()=>ctx.running()||ctx.countdown()?ctx.pause():ctx.getView()==='pause'?ctx.resume():Promise.resolve());
   else if(!ctx.running()&&!ctx.countdown()){
    if(sample.back){if(!document.querySelector('#keybinds').hidden)ctx.closeKeys();else if(!document.querySelector('#race-plan').hidden)ctx.closePlan();else if(ctx.getView()==='pause')void act(ctx.resume);else if(ctx.getView()!=='career')ctx.career();}
    else if(sample.direction)navigate(sample.direction);
    else if(sample.confirm){const els=focusables(),active=document.activeElement;if(els.includes(active))active.click();else{const first=document.querySelector('#menu-actions .primary')||els[0];first?.focus({preventScroll:true});first?.click();}}
   }
  }
  if(source==='gamepad'&&ctx.getView()==='race')ctx.stick.hidden=true;
  renderCoach();
 }
 function renderCoach(){
  const g=ctx.getGame(),blocked=!ctx.running()||g.tick<60||g.over||practice().dismissed||practice().stage>=(current()?4:3)||!document.querySelector('#roadblock-guide').hidden||!document.querySelector('#telegraph').hidden;
  coachEl.hidden=blocked;if(blocked)return;
  const h=practice().hint(g),bindings=ctx.keys().bindings;
  const key=source==='gamepad'?(h.action==='steer'?'LS':h.action==='throttle'?'RT':h.action==='brake'?'LT':h.action==='drift'?'B':current()?'A':'RT'):source==='touch'?(h.action==='steer'?'↔':h.action==='throttle'?'↑':h.action==='brake'?'↓':h.action==='drift'?'↙':'ϟ'):h.action==='steer'?keyLabel(bindings.left)+' / '+keyLabel(bindings.right):keyLabel(bindings[h.action]);
  const signature=practice().stage+':'+key+':'+h.label;
  if(signature!==lastHint){lastHint=signature;artwork.innerHTML=icon(h.icon);caption.replaceChildren();const label=document.createElement('b'),kbd=document.createElement('kbd');label.textContent=h.label;kbd.textContent=key;caption.append(label,kbd);pips.innerHTML=Array.from({length:current()?4:3},(_,n)=>n).map(n=>'<i class="'+(n<practice().stage?'done':n===practice().stage?'current':'')+'"></i>').join('');coachEl.setAttribute('aria-label','Driving practice '+(practice().stage+1)+' of '+(current()?4:3)+': '+h.label+', '+key);}
 }
 return{poll,refresh,clear(){pad.suspend();sample={active:false};},bits(){if(!sample.active)return null;const g=ctx.getGame(),bits=gamepadBits(sample,g,ctx.turn());if(g.physics_version>=12){let flags=bits&~24;if(sample.drift)flags|=8;if(sample.nitro)flags|=16;
 let throttle=Math.round(sample.throttle*100),brake=Math.round(sample.brake*100);
 // LT changes from a brake into reverse only after the car stops. RT requests forward again.
 if(sample.reverse||sample.brake>.6&&g.speed<=0&&sample.throttle<.1){flags|=4;throttle=sample.reverse?100:Math.max(throttle,brake);brake=0;}else flags&=~4;
 return packInput(flags,Math.round(sample.x*100),brake,throttle);}
 return g.physics_version>=11?legacyPack(bits,Math.round(sample.x*100),Math.round(Math.max(sample.brake,sample.drift?1:0)*100)):bits;},observe(before,after,bits){if(practice().observe(before,after,bits))persist();},snapshot(){return{source,active:sample.active,index:sample.index,practice:practice().snapshot()};}};
}
