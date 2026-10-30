import {assetURL} from './nightshift-asset-url.mjs';
export function routeArt(mode,width=384){return assetURL('/arcade/art/nightshift/maps-v131/map-'+String(Math.max(0,Math.min(11,mode))+1).padStart(2,'0')+'-'+width+'.webp');}
export function routeArtSet(mode,max=1280){return[384,768,1280,2560].filter(w=>w<=max).map(w=>routeArt(mode,w)+' '+w+'w').join(', ');}
