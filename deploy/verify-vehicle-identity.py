"""Read-only acceptance of a V15 image and the inherited deployment settings."""
import hashlib,json,pathlib,subprocess,sys
root=pathlib.Path(sys.argv[2]);phase=sys.argv[1]
def inspect(name):return json.loads(subprocess.check_output(['docker','inspect',name]))[0]
game=inspect('nightshift-15-0-1-stage' if phase=='stage' else 'myelin-nightshift-v8')
store=inspect('nightshift-15-0-1-store-stage' if phase=='stage' else 'utxoplay-store')
old=json.loads((root/'game-before.private.json').read_text())
for key in ['User','WorkingDir','Entrypoint','Healthcheck','Cmd']:assert game['Config'].get(key)==old['Config'].get(key),key
for key in ['ReadonlyRootfs','SecurityOpt','CapDrop','CapAdd','Memory','MemorySwap','PidsLimit','NanoCpus','Privileged']:
 assert game['HostConfig'].get(key)==old['HostConfig'].get(key),key
assert game['Config']['Cmd']==['node','host/nightshift15.mjs']
env=dict(e.split('=',1) for e in game['Config']['Env']);oldenv=dict(e.split('=',1) for e in old['Config']['Env'])
allowed=set()
if phase=='stage':allowed.add('GAME_ORIGIN')
for key,value in oldenv.items():
 if key not in allowed and not(phase=='stage' and key.startswith('VIRTUAL_')):assert env[key]==value,key
assert env['DATA_DIR']=='/app/data-v15' and env['RIVALS_DATA_DIR']=='/app/data-v14'
mounts={m['Destination']:m['Source'] for m in game['Mounts']};original={m['Destination']:m['Source'] for m in old['Mounts']}
assert set(mounts)==set(original)
for key,source in original.items():assert (mounts[key]!=source if phase=='stage' else mounts[key]==source),key
if phase=='stage':
 assert not any(k.startswith('VIRTUAL_') for k in env)
 assert all(v.startswith(str(root)+'/') for v in mounts.values())
check="""const fs=require('fs'),c=require('crypto'),m=JSON.parse(fs.readFileSync('/app/docs/release-integrity.json'));function sha(p){return c.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}for(const[p,h]of Object.entries(m.browserFiles))if(sha('/app/dist/nightshift/'+p)!==h)throw Error(p);for(const[p,h]of Object.entries(m.presentationHostFiles))if(sha('/app/'+p)!==h)throw Error(p);for(const[v,h]of Object.entries(m.nativeBinaries))if(sha('/app/target/release/myelin-nightshift-v'+v)!==h)throw Error(v);console.log(JSON.stringify({browserFiles:Object.keys(m.browserFiles).length,hostFiles:Object.keys(m.presentationHostFiles).length,nativeExecutables:Object.keys(m.nativeBinaries).length,profile:m.profile}));"""
integrity=json.loads(subprocess.check_output(['docker','exec',game['Id'],'node','-e',check]))
catalog=json.loads(subprocess.check_output(['docker','exec',store['Id'],'cat','/app/server/catalog.json']))
base=json.loads((root/('catalog-stage-before.json' if phase=='stage' else 'catalog-cutover-before.json')).read_text())
expected=json.loads(json.dumps(base));next(x for x in expected if x['id']=='drift-run')['version']='15.0.1';assert expected==catalog
for container in [game,store]:assert container['State']['Health']['Status']=='healthy' and container['RestartCount']==0
report={'phase':phase,'version':'15.0.1','gameImage':game['Image'],'storeImage':store['Image'],**integrity,'securityAndResourcesPreserved':True,'allHistoricalMountsPreserved':phase!='stage','allStageDataIsolated':phase=='stage','onlyCatalogVersionChanged':True,'healthyWithoutRestarts':True}
(root/(phase+'-acceptance.json')).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
