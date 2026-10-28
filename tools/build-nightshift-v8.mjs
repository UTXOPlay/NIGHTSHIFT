import {build} from 'esbuild';
import {cpSync,mkdirSync,readFileSync,readdirSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import {brotliCompressSync,gzipSync} from 'node:zlib';

const root=path.resolve('dist/nightshift');
rmSync(root,{recursive:true,force:true});mkdirSync(root,{recursive:true});
cpSync('games/nightshift-v8/web',root,{recursive:true});
cpSync('games/arcade/web',path.join(root,'_arcade'),{recursive:true,filter:p=>!path.basename(p).startsWith('nightshift7')});
cpSync('public',path.join(root,'_shared'),{recursive:true});
await build({entryPoints:['games/arcade/web/nightshift8-renderer.mjs'],bundle:true,format:'esm',minify:true,target:'es2022',outfile:path.join(root,'_arcade/nightshift8-renderer.bundle.mjs')});
function rewrite(dir){for(const item of readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,item.name);if(item.isDirectory()){rewrite(file);continue;}
 if(!/\.(?:js|mjs|css|html|json|webmanifest)$/.test(file))continue;
 let s=readFileSync(file,'utf8').replaceAll('/arcade/','/games/nightshift/_arcade/');
 for(const pre of ['/assets/','/brand/','/game-shell.','/game-loader.','/game-overlay.','/widescreen.','/fonts.','/brand.','/favicon','/apple-touch-icon.','/site.webmanifest'])s=s.replaceAll(pre,(match,offset,source)=>offset===0||/["'`(=\s]/.test(source[offset-1])?'/games/nightshift/_shared'+match:match);
 s=s.replaceAll("'/api/me'","'/games/nightshift/api/me'").replaceAll("'/api/guest'","'/games/nightshift/api/guest'");
 writeFileSync(file,s);writeFileSync(file+'.br',brotliCompressSync(s));writeFileSync(file+'.gz',gzipSync(s));
}}
rewrite(root);
const review=process.env.DRIFT_BUILD_ROOT||'artifacts/nightshift-v8/site';
if(path.resolve(review)!==root){mkdirSync(review,{recursive:true});cpSync(root,review,{recursive:true});}
console.log('Built NIGHTSHIFT into dist/nightshift and the local review directory.');
