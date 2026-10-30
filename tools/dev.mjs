import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
mkdirSync('data',{recursive:true});
const tokenFile='data/development-token';
if(!process.env.RUNTIME_TOKEN){
 if(!existsSync(tokenFile))writeFileSync(tokenFile,randomBytes(32).toString('hex'),{mode:0o600});
 process.env.RUNTIME_TOKEN=readFileSync(tokenFile,'utf8').trim();
}
const {startNightshift14}=await import('../host/nightshift14.mjs');startNightshift14();
