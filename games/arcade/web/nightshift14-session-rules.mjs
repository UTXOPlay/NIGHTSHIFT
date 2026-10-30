// Exact saved-session dispatch. Unknown profiles never receive optimistic inputs.
import * as v8 from './nightshift8-rules.mjs';
import * as v9 from './nightshift9-rules.mjs';
import * as v10 from './nightshift10-rules.mjs';
import * as v11 from './nightshift11-rules.mjs';
import * as v12 from './nightshift12-rules.mjs';
import * as v13 from './nightshift13-rules.mjs';
import * as v14 from './nightshift14-rules.mjs';
export const SAVED_PROFILES={"8":"dc78757f7fd0b708a46d9549e6843986a668a334ad10f65a5ee7a43934b4ee53","9":"e9b142142792975f9e44ce5cd196d6593d0099eb13280787967816e59b7a1def","10":"0b9501d47ecdec91a485f5dfc7dcca5fc391128cee449f72fc06c782ba292561","11":"f51f714c84fa8422d007ea13ed3dc5adb56ce670ae9b09325748318c5e822455","12":"2f1035f5f209c34a1ed0a07a16bf65a2378f1669ee14634c4bb2571c0ee5e224","13":"2d5a6bfbfbbe403287337fbd06a33a2de435137678f1dd03b0d691968b3256b5","14":"fc3a5ca4a1687a36f0fc2d786e4fc205e1038629058ebd4f6466fb36e6b9aabe"};
const versions={8:v8,9:v9,10:v10,11:v11,12:v12,13:v13,14:v14};
export function sessionRules(state){
 const version=state.game?.physics_version||8,rules=versions[version];
 if(state.game?.kind!=='drift-run'||!rules||state.session?.profile!==SAVED_PROFILES[version])throw Error('Saved race rules do not match this build. Reload NIGHTSHIFT; your saved race is safe.');
 return {version,rules,legacy:version===8};
}
