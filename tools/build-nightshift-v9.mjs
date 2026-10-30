import {build} from 'esbuild';
import {cpSync,mkdirSync,readFileSync,readdirSync,writeFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import {brotliCompressSync,gzipSync} from 'node:zlib';

const version=JSON.parse(readFileSync('package.json','utf8')).version;
const root=path.resolve('dist/nightshift');
rmSync(root,{recursive:true,force:true});mkdirSync(root,{recursive:true});
cpSync('games/nightshift-v9/web',root,{recursive:true});
cpSync('games/arcade/web',path.join(root,'_arcade'),{recursive:true,filter:p=>!path.basename(p).startsWith('nightshift7')});
cpSync('public',path.join(root,'_shared'),{recursive:true});
await build({entryPoints:['games/arcade/web/nightshift9-renderer.mjs'],bundle:true,format:'esm',minify:true,target:'es2022',outfile:path.join(root,'_arcade/nightshift9-renderer.bundle.mjs')});
// Collapse the rules/UI module waterfall while keeping the large renderer reusable.
await build({entryPoints:['games/nightshift-v9/web/app.js'],bundle:true,format:'esm',minify:true,target:'es2022',outfile:path.join(root,'app.js'),plugins:[{name:'arcade-imports',setup(build){build.onResolve({filter:/^\.\/_arcade\//},args=>args.path.endsWith('nightshift9-renderer.bundle.mjs')?{path:args.path+'?v='+version,external:true}:{path:path.resolve('games/arcade/web',args.path.slice('./_arcade/'.length))});}}]});
function rewrite(dir){for(const item of readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,item.name);if(item.isDirectory()){rewrite(file);continue;}
 if(/\.glb$/.test(file)){const data=readFileSync(file);writeFileSync(file+'.br',brotliCompressSync(data,{params:{1:5}}));writeFileSync(file+'.gz',gzipSync(data));continue;}
 if(!/\.(?:js|mjs|css|html|json|webmanifest)$/.test(file))continue;
 let s=readFileSync(file,'utf8').replace('href="./_arcade/nightshift9-renderer.bundle.mjs"','href="./_arcade/nightshift9-renderer.bundle.mjs?v='+version+'"').replaceAll('/arcade/','/games/nightshift/_arcade/');
 for(const pre of ['/assets/','/brand/','/game-shell.','/game-loader.','/game-overlay.','/widescreen.','/fonts.','/brand.','/favicon','/apple-touch-icon.','/site.webmanifest'])s=s.replaceAll(pre,(match,offset,source)=>offset===0||/["'`(=\s]/.test(source[offset-1])?'/games/nightshift/_shared'+match:match);
 s=s.replaceAll("'/api/me'","'/games/nightshift/api/me'").replaceAll("'/api/guest'","'/games/nightshift/api/guest'");
 writeFileSync(file,s);writeFileSync(file+'.br',brotliCompressSync(s));writeFileSync(file+'.gz',gzipSync(s));
}}
rewrite(root);
const review=process.env.DRIFT_BUILD_ROOT||'artifacts/nightshift-v9/site';
if(path.resolve(review)!==root){mkdirSync(review,{recursive:true});cpSync(root,review,{recursive:true});}
console.log('Built NIGHTSHIFT into dist/nightshift and the local review directory.');
