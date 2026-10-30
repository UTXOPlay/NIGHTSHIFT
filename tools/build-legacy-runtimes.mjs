import {spawnSync} from 'node:child_process';
// Historical executables are independent entry points, not just link libraries.
for(let version=8;version<=13;version++){
 const result=spawnSync('cargo',['build','--release','--locked','--manifest-path',`games/nightshift-v${version}/native/Cargo.toml`,'--target-dir','target'],{stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
}
