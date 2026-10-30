import {button} from './nightshift8-icons.mjs';
import {focusTarget} from './nightshift-gamepad.mjs';

// Presentation state only: no race actions, currency awards or save migration.
export function createMenuSystem({root,sections,read,write,quality,busy,loaded,leave}){
 const $=s=>root.querySelector(s);let settingsTab=0,pendingFocus=null;const viewMemory=new Map();
 function storeButton(){const b=button('close','Return to UTXOPlay',leave,'store-return');b.dataset.uiLabel='UTXOPLAY';b.dataset.menuKey='return:utxoplay';b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 5-7 7 7 7M5 12h15"/></svg><img src="/brand/utxoplay-logo-dark-192.webp" alt="" width="24" height="24">';return b;}
 const brand=document.createElement('div');brand.className='game-brand';const wordmark=$('.wordmark'),storeReturn=storeButton();wordmark.before(brand);brand.append(storeReturn,wordmark);
 const drawer=$('#keybinds'),tabs=document.createElement('div');tabs.id='settings-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Settings categories');
 const panels=['controls','display','records'].map((name,n)=>{const p=document.createElement('section');p.id='settings-'+name;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby','settings-tab-'+name);p.hidden=n!==0;return p;});
 const label=drawer.querySelector('label[for="key-preset"]');
 for(const e of [label,$('#key-preset'),$('#key-preset-note'),$('#key-rows'),$('#key-message'),$('#driving-guide'),$('#gamepad-guide')])if(e)panels[0].append(e);
 const archive=$('#help-actions'),qualityButton=archive.querySelector('button');
 const practice=archive.querySelector('[aria-label="Practice steering, braking and boost in a race"]');if(practice){const row=document.createElement('div');row.className='practice-action';row.append(practice);panels[0].append(row);}
 const qualityRow=document.createElement('div');qualityRow.className='preference-row';qualityRow.innerHTML='<div><b>Rendering quality</b><small>Auto, low or high</small></div>';qualityRow.append(qualityButton);panels[1].append(qualityRow);for(const row of drawer.querySelectorAll('.audio-setting')){row.classList.add('preference-row');panels[1].append(row);}
 const densityRow=document.createElement('div');densityRow.className='preference-row';densityRow.innerHTML='<div><b>Focused HUD</b><small>Keep the map, race data and warnings. Hide standings and engineer tips.</small></div>';
 let focused=read('nightshift:hud-detail','full')==='focused';
 const density=button('map','Use focused HUD',()=>{focused=!focused;write('nightshift:hud-detail',focused?'focused':'full');refreshPreferences();});densityRow.append(density);panels[1].append(densityRow);
 const recordsTitle=document.createElement('h3');recordsTitle.textContent='Career archive';const recordsText=document.createElement('p');recordsText.textContent='Verify or export your saved career.';panels[2].append(recordsTitle,recordsText,archive,$('#game-credits'));
 const names=['Controls','Display','Records'],symbols=['keyboard','quality','verify'];
 const tabButtons=names.map((name,n)=>{const b=button(symbols[n],name+' settings',()=>selectTab(n,true));b.id='settings-tab-'+['controls','display','records'][n];b.setAttribute('role','tab');b.setAttribute('aria-controls',panels[n].id);b.dataset.uiLabel=name.toUpperCase();b.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();selectTab((n+(e.key==='ArrowRight'?1:2))%3,true);tabButtons[settingsTab].focus();}};tabs.append(b);return b;});
 drawer.querySelector('.key-heading').after(tabs);drawer.append(...panels);
 function selectTab(n,focus=false){settingsTab=n;drawer.querySelector('#key-title').textContent=['Controls','Display & audio','Career archive'][n];const reset=drawer.querySelector('[aria-label="Reset selected keyboard preset"]');if(reset)reset.hidden=n!==0;tabButtons.forEach((b,i)=>{b.setAttribute('aria-selected',String(i===n));b.tabIndex=i===n?0:-1;panels[i].hidden=i!==n;});if(focus)drawer.scrollTop=0;refreshPreferences();}
 function refreshPreferences(){root.dataset.hudDetail=focused?'focused':'full';density.setAttribute('aria-pressed',String(focused));density.setAttribute('aria-label',focused?'Use full HUD':'Use focused HUD');let value=qualityButton.querySelector('small');if(!value){value=document.createElement('small');qualityButton.append(value);}value.textContent=quality().toUpperCase();qualityButton.title='Rendering quality: '+quality()+'. Select to cycle.';}
 addEventListener('utxoplay:quality',refreshPreferences);selectTab(0);
 for(const [view,b] of Object.entries(sections)){b.dataset.uiLabel={career:'EVENTS',garage:'GARAGE',profile:'DRIVER'}[view];b.dataset.menuKey='nav:'+view;}
 $('#nav').setAttribute('aria-label','Game sections and settings');
 function syncNav(view){brand.hidden=view==='race'||view==='pause';storeReturn.disabled=busy();for(const [name,b] of Object.entries(sections)){b.hidden=view==='race';b.disabled=busy()||!loaded();if(name===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}}
 function capture(){const el=document.activeElement,owned=el?.closest('#menu'),state={view:root.dataset.view,focus:owned?(el.dataset.menuKey||el.getAttribute('aria-label')):null,scroll:Object.fromEntries(['cards','workshop','progression'].map(id=>[id,[$('#'+id).scrollLeft,$('#'+id).scrollTop]]))};if(state.view!=='race')viewMemory.set(state.view,state);return state;}
 function restore(state){
  const view=root.dataset.view;if(pendingFocus&&pendingFocus.view!==view)pendingFocus=null;const actions=$('#menu-actions'),copy=$('.menu-copy');
  if(view==='garage')$('#menu').append(actions);else copy.append(actions);
  if(view==='pause'){const b=storeButton();b.disabled=busy();actions.append(b);}
  for(const b of $('#menu').querySelectorAll('button')){
   if(!b.dataset.menuKey)b.dataset.menuKey=b.getAttribute('aria-label')||b.id;
   if(!b.dataset.uiLabel&&b.classList.contains('icon-button'))b.dataset.uiLabel=b.getAttribute('aria-label');
  }
  const remembered=state.view===view?state:viewMemory.get(view);if(remembered){for(const [id,scroll]of Object.entries(remembered.scroll)){const el=$('#'+id);el.scrollLeft=scroll[0];el.scrollTop=scroll[1];}}
  const focusKey=state.focus||(pendingFocus?.view===view?pendingFocus.key:null);
  if(focusKey){const buttons=[...$('#menu').querySelectorAll('button')],match=state.view===view?buttons.find(b=>b.dataset.menuKey===focusKey||b.getAttribute('aria-label')===focusKey):null;
   const fallback=view==='garage'?$('#cards [aria-pressed="true"]'):$('#menu-actions .primary');
   const target=match&&!match.disabled&&match.getClientRects().length?match:fallback;
   if(target&&!target.disabled){target.focus({preventScroll:true});pendingFocus=null;}else pendingFocus={key:focusKey,view};
  }
  syncNav(view);
 }
 root.addEventListener('keydown',e=>{
  const direction={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];
  if(!direction||e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||root.dataset.view==='race'||e.target.matches('input,select,textarea')||$('#key-rows [aria-pressed=true]'))return;
  const modal=[$('#keybinds'),$('#race-plan')].find(el=>!el.hidden),scope=modal||root;
  const items=[...scope.querySelectorAll('button,select,summary,a[href]')].filter(el=>!el.disabled&&!el.closest('[hidden]')&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
  const next=focusTarget(items.map(el=>el.getBoundingClientRect()),items.indexOf(document.activeElement),direction);if(next<0)return;
  e.preventDefault();items[next].focus({preventScroll:true});items[next].scrollIntoView({block:'nearest',inline:'nearest'});
 });
 $('#cards').addEventListener('focusin',e=>{if(e.target.matches('.stage-card,.car-card'))e.target.scrollIntoView({block:'nearest',inline:'nearest'});});
 return{syncNav,capture,restore,openSettings(){drawer.scrollTop=0;selectTab(settingsTab);(settingsTab===0?$('#key-preset'):tabButtons[settingsTab]).focus();},snapshot(){return{settingsTab:['controls','display','records'][settingsTab],focusedHUD:focused};}};
}
