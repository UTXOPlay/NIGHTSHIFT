import {packInput} from './nightshift11-input.mjs';
import {GamepadInput,gamepadBits,GAMEPAD_KEYS,focusTarget} from './nightshift-gamepad.mjs';
import {DrivingCoach} from './nightshift-driving-coach.mjs';
import {KEY_ACTIONS,keyLabel} from './nightshift-keyboard.mjs';
import {icon,button} from './nightshift8-icons.mjs';

export function createControls(ctx){
 const pad=new GamepadInput();let sample={active:false},source='keyboard',lastHint='',actionBusy=false;
 let saved;try{saved=JSON.parse(ctx.read('nightshift:practice','null'));}catch{}
 const coach=new DrivingCoach(saved),persist=()=>ctx.write('nightshift:practice',JSON.stringify(coach.snapshot()));
 const coachEl=document.createElement('aside');coachEl.id='drive-coach';coachEl.hidden=true;coachEl.setAttribute('aria-label','Driving practice');
 const artwork=document.createElement('span'),caption=document.createElement('div'),pips=document.createElement('span');pips.className='coach-pips';
 const dismiss=button('close','Dismiss driving practice',()=>{coach.dismiss();persist();coachEl.hidden=true;});
 coachEl.append(artwork,caption,pips,dismiss);ctx.root.append(coachEl);
 const settings=document.createElement('details');settings.id='gamepad-guide';settings.innerHTML='<summary>Controller</summary><p class="controller-status">Press a button after centering the sticks to connect a standard controller.</p><dl><div><dt>LS</dt><dd>Steer</dd></div><div><dt>LT / B</dt><dd>Brake / drift</dd></div><div><dt>LB</dt><dd>Reverse</dd></div><div><dt>RT</dt><dd>Boost</dd></div><div><dt>X</dt><dd>Equipped weapon</dd></div><div><dt>Y</dt><dd>Counter jammer</dd></div><div><dt>MENU</dt><dd>Pause / resume</dd></div><div><dt>D-PAD / A / B</dt><dd>Navigate / select / back</dd></div></dl><p>Automatic throttle in the current race rules. Keyboard and touch remain available. Recenter and release buttons after a pause or input change. Controller audio may require a keyboard press or tap on the sound icon first.</p>';
 document.querySelector('#help-actions').before(settings);
 document.querySelector('#help-actions').append(button('help','Practice steering, braking and boost in a race',()=>{coach.reset();persist();ctx.closeKeys();void(ctx.getGame().tick&&!ctx.getGame().over?ctx.resume():ctx.start());}));
 function refresh(){
  for(const b of ctx.buttons){const bit=+b.dataset.input,action=KEY_ACTIONS.find(([, ,n])=>n===bit);if(!action)continue;b.querySelector('.ability-key').textContent=source==='gamepad'?GAMEPAD_KEYS[bit]:keyLabel(ctx.keys().bindings[action[0]]);}
  ctx.root.dataset.input=source;
 }
 function setSource(next){if(source!==next){source=next;lastHint='';refresh();}}
 addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;if(source==='gamepad')ctx.clear();else pad.suspend();setSource('keyboard');},true);
 addEventListener('pointerdown',e=>{if(source==='gamepad')ctx.clear();else pad.suspend();setSource(e.pointerType==='touch'?'touch':'keyboard');},true);
 const getPads=()=>{try{return navigator.getGamepads?.()||[];}catch{return[];}};
 function focusables(){const modal=['#keybinds','#race-plan'].map(s=>document.querySelector(s)).find(e=>e&&!e.hidden);return[...(modal||ctx.root).querySelectorAll('button,select,summary,a[href]')].filter(e=>!e.disabled&&!e.closest('[hidden]')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');}
 function navigate(direction){
  const els=focusables(),active=document.activeElement;
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
  const g=ctx.getGame(),blocked=!ctx.running()||g.tick<60||g.over||coach.dismissed||coach.stage>=3||!document.querySelector('#roadblock-guide').hidden||!document.querySelector('#telegraph').hidden;
  coachEl.hidden=blocked;if(blocked)return;
  const h=coach.hint(g),bindings=ctx.keys().bindings;
  const key=source==='gamepad'?(h.action==='steer'?'LS':h.action==='drift'?'LT':'RT'):source==='touch'?(h.action==='steer'?'↔':h.action==='drift'?'↓':'ϟ'):h.action==='steer'?keyLabel(bindings.left)+' / '+keyLabel(bindings.right):keyLabel(bindings[h.action]);
  const signature=coach.stage+':'+key+':'+h.label;
  if(signature!==lastHint){lastHint=signature;artwork.innerHTML=icon(h.icon);caption.replaceChildren();const label=document.createElement('b'),kbd=document.createElement('kbd');label.textContent=h.label;kbd.textContent=key;caption.append(label,kbd);pips.innerHTML=[0,1,2].map(n=>'<i class="'+(n<coach.stage?'done':n===coach.stage?'current':'')+'"></i>').join('');coachEl.setAttribute('aria-label','Driving practice '+(coach.stage+1)+' of 3: '+h.label+', '+key);}
 }
 return{poll,refresh,clear(){pad.suspend();sample={active:false};},bits(){if(!sample.active)return null;const g=ctx.getGame(),bits=gamepadBits(sample,g,ctx.turn());return g.physics_version>=11?packInput(bits,Math.round(sample.x*100),Math.round(Math.max(sample.brake,sample.drift?1:0)*100)):bits;},observe(before,after,bits){if(coach.observe(before,after,bits))persist();},snapshot(){return{source,active:sample.active,index:sample.index,practice:coach.snapshot()};}};
}
