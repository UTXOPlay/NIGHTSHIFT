import{readFileSync,existsSync}from'node:fs';import path from'node:path';import{createHash}from'node:crypto';
// Optional split test: real staged native APIs with byte-verified local static files.
// This is not a network/loading benchmark. Public acceptance runs without this option.
export async function installStageAssets(context,origin){
 if(process.env.DRIFT_LOCAL_ASSETS!=='1')return;
 if(origin!=='http://127.0.0.1:18944')throw Error('Local QA assets require the isolated staging origin');
 const root=path.resolve('dist/nightshift'),expected=JSON.parse(readFileSync('docs/release-integrity.json')).browserFiles;
 for(const[file,sha]of Object.entries(expected)){const actual=createHash('sha256').update(readFileSync(path.join(root,file))).digest('hex');if(actual!==sha)throw Error('QA asset mismatch '+file);}
 await context.route('**/games/nightshift/**',async route=>{const url=new URL(route.request().url()),relative=decodeURIComponent(url.pathname.slice('/games/nightshift/'.length));if(!relative||relative==='index.html'||relative.startsWith('api/'))return route.continue();const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||!existsSync(file))return route.continue();return route.fulfill({path:file});});
}
