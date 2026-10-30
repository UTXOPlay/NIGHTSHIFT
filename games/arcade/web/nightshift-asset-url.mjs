const hashes=typeof __NIGHTSHIFT_ASSET_HASHES__==='undefined'?{}:__NIGHTSHIFT_ASSET_HASHES__;
export function assetURL(url){if(!url.startsWith('/arcade/'))return url;const pathname=url.split('?')[0],hash=hashes[pathname];return hash?pathname+'?h='+hash:url;}
