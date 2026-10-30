import * as T from 'three';
import {assetURL} from './nightshift-asset-url.mjs';
const names=['sunset','daylight','night','tunnel'];
export async function loadPreparedProbe(index){
 const response=await fetch(assetURL('/arcade/art/nightshift/pbr/probes-v131/'+names[index]+'.pmrem'));
 if(!response.ok)throw Error('Lighting probe unavailable');const bytes=await response.arrayBuffer(),header=new DataView(bytes);
 if(bytes.byteLength<16||String.fromCharCode(...new Uint8Array(bytes,0,4))!=='NSP1')throw Error('Invalid lighting probe');
 const width=header.getUint32(4,true),height=header.getUint32(8,true);if(width<16||height<16||width>1024||height>1024||bytes.byteLength!==16+width*height*8)throw Error('Invalid lighting probe dimensions');
 const texture=new T.DataTexture(new Uint16Array(bytes,16),width,height,T.RGBAFormat,T.HalfFloatType);
 texture.mapping=T.CubeUVReflectionMapping;texture.colorSpace=T.LinearSRGBColorSpace;texture.minFilter=texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
 return{texture,dispose:()=>texture.dispose(),width,height};
}
