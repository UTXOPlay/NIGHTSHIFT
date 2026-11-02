"""Ship the complete host import graph without replacing the accepted Store."""
import hashlib,json,os,pathlib,subprocess,sys,tarfile
root=pathlib.Path(sys.argv[2]).resolve()
source=(root/'release-controller.py').read_text()
marker=source.rfind('\n{"stage": stage,');assert marker>0
ns={'__name__':'host_completion'};exec(compile(source[:marker],str(root/'release-controller.py'),'exec'),ns)
inspect,run,clone,create,healthy,private=[ns[k] for k in ['inspect','run','clone_spec','create','healthy','private']]
game='myelin-nightshift-v8';stage='nerveshift-16-0-2-host-stage'
base='sha256:d0c19fabf74fc4f61b31bfa18fe632333cdbee5c4135774c62b524dc737aee9d'
def prepare():
 assert inspect(game)['Image']==base,'Concurrent game release'
 directory=root/'host-complete';assert not directory.exists();directory.mkdir()
 with tarfile.open(root/'host-patch.tgz') as archive:
  for item in archive.getmembers():assert not item.name.startswith('/') and '..' not in pathlib.PurePosixPath(item.name).parts and not item.issym() and not item.islnk()
  archive.extractall(directory,filter='data')
 run(['docker','tag',base,'utxoplay/nerveshift-host-base:16.0.2'])
 (directory/'Dockerfile').write_text('FROM utxoplay/nerveshift-host-base:16.0.2\nCOPY host/ /app/host/\nCOPY docs/ /app/docs/\nLABEL org.opencontainers.image.title="NerveShift"\n')
 with (root/'host-build.log').open('w') as log:subprocess.run(['docker','build','-t','utxoplay/game:nerveshift-host-complete-16.0.2',str(directory)],stdout=log,stderr=subprocess.STDOUT,check=True)
 image=inspect('utxoplay/game:nerveshift-host-complete-16.0.2')['Id']
 original=inspect(game);private('host-patch-before.private.json',original)
 spec=clone(original,image,stage=True);spec['HostConfig']['PortBindings']={}
 isolated=set()
 def isolate(src,dest):
  assert dest=='/app/data' or dest in ['/app/data-v'+str(v) for v in range(9,17)]
  d=root/'host-check'/dest.rsplit('/',1)[-1];d.mkdir(parents=True,exist_ok=True);os.chown(d,1000,1000);isolated.add(dest);return str(d)
 spec['HostConfig']['Binds']=[':'.join([isolate(parts[0],parts[1]),*parts[1:]]) for bind in spec['HostConfig'].get('Binds') or [] for parts in [bind.split(':')]]
 for mount in spec['HostConfig'].get('Mounts') or []:mount['Source']=isolate(mount['Source'],mount['Target'])
 assert len(isolated)==9
 create(stage,spec);healthy(stage)
 fixture="""import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {step} from '/app/dist/nightshift/_arcade/nightshift16-rules.mjs';import {packInput} from '/app/dist/nightshift/_arcade/nightshift12-input.mjs';
const m=JSON.parse(fs.readFileSync('/app/docs/release-integrity.json'));for(const[p,h]of Object.entries(m.presentationHostFiles))assert.equal(crypto.createHash('sha256').update(fs.readFileSync('/app/'+p)).digest('hex'),h,p);for(const[v,h]of Object.entries(m.nativeBinaries))assert.equal(crypto.createHash('sha256').update(fs.readFileSync('/app/target/release/myelin-nightshift-v'+v)).digest('hex'),h,v);
const headers={'X-Runtime-Token':process.env.RUNTIME_TOKEN,'X-UTXOPlay-Account':crypto.randomBytes(32).toString('hex'),'Content-Type':'application/json'},origin='http://127.0.0.1:8080';async function req(path,body){const r=await fetch(origin+path,{headers,method:body===undefined?'GET':'POST',body:body===undefined?undefined:JSON.stringify(body)});assert.equal(r.status,200,await r.clone().text());return r.json();}
const before=await req('/games/nerveshift/api/state');assert.deepEqual(await req('/games/nightshift/api/state'),before);assert.deepEqual(await req('/games/drift-run/api/state'),before);const redirect=await fetch(origin+'/',{redirect:'manual'});assert.equal(redirect.headers.get('location'),'/games/nerveshift/');const html=await fetch(origin+'/games/nerveshift/',{headers});assert.equal(html.status,200);assert.match(await html.text(),/<title>NerveShift/);const inputs=Array(10).fill(packInput(0,0,0,100)),expected=structuredClone(before.game);for(const i of inputs)step(expected,i);const after=await req('/games/nerveshift/api/action',{client_profile:m.profile,session_id:before.session.id,expected_block:before.session.block_hash,action:{type:'ticks',inputs}});assert.deepEqual(after.game,expected);assert.equal((await req('/games/nerveshift/api/replay',{})).verified,true);console.log(JSON.stringify({directCanonicalRoot:true,allThreeApiAliases:true,nativeBrowserExact:true,signedReplay:true,hostFiles:Object.keys(m.presentationHostFiles).length,nativeExecutables:Object.keys(m.nativeBinaries).length,profile:m.profile}));"""
 p=subprocess.run(['docker','exec','-i',stage,'node','--input-type=module','-'],input=fixture,text=True,capture_output=True);assert p.returncode==0,p.stderr
 report={'image':image,**json.loads(p.stdout)};(root/'host-check.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
def cutover():
 check=json.loads((root/'host-check.json').read_text());assert check['signedReplay'] and check['allThreeApiAliases'];old=inspect(game);assert old['Image']==base
 private('game-before-host-completion.private.json',old);backup=game+'-before-nerveshift-host-complete-16-0-2'
 run(['docker','stop','-t','15',game]);run(['docker','rename',game,backup])
 try:
  spec=clone(old,check['image']);spec['Labels']['io.utxoplay.nightshift.release']=str(root);spec['Labels']['io.utxoplay.nightshift.role']='production';create(game,spec);healthy(game)
 except Exception:
  p=subprocess.run(['docker','inspect',game],capture_output=True,text=True)
  if p.returncode==0:
   assert json.loads(p.stdout)[0]['Config']['Labels'].get('io.utxoplay.nightshift.release')==str(root);run(['docker','rm','-f',game])
  run(['docker','rename',backup,game]);run(['docker','start',game]);raise
 report=json.loads((root/'deployment.json').read_text());report['gameImage']=check['image'];report['completeHostImportGraph']=True;report['storeNotReplacedForHostCompletion']=True;(root/'deployment.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
{'prepare':prepare,'cutover':cutover}[sys.argv[1]]()
