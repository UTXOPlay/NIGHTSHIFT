import test from 'node:test';import assert from 'node:assert/strict';
import {keyboardConfig,keyboardPreset,bindKey,keyboardAction,eventKey} from '../games/arcade/web/nightshift-keyboard.mjs';
test('Colemak uses typed labels, not QWERTY code names, and keeps arrow fallback',()=>{
 const c=keyboardPreset('colemak');
 for(const [key,code,action]of[['s','KeyD','right'],['r','KeyS','drift'],['f','KeyE','fire'],['p','KeyR','pause']])assert.equal(keyboardAction(c,{key,code})[0],action);
 assert.equal(keyboardAction(c,{key:'e',code:'KeyK'}),null);
 assert.equal(keyboardAction(c,{key:'ArrowLeft'})[0],'left');assert.equal(eventKey({key:' '}),'Space');
 assert.equal(keyboardAction(c,{key:'f',ctrlKey:true}),null);
});
test('custom bindings persist, reject conflicts and never bind navigation/modifier keys',()=>{
 const c=bindKey(keyboardPreset('colemak'),'fire','j');assert.deepEqual(keyboardConfig(JSON.stringify(c)),c);
 assert.equal(keyboardAction(c,{key:'J',code:'KeyY'})[2],32);assert.throws(()=>bindKey(c,'counter','j'),/Already bound/);
 for(const key of ['Escape','Enter','Tab','Shift','<script>','ArrowLeft'])assert.throws(()=>bindKey(c,'fire',key));
 const corrupt=keyboardConfig('{"preset":"colemak","custom":true,"bindings":{"fire":"<script>"}}');assert.equal(corrupt.bindings.fire,'f');
});
