"""Verify the V13 cutover without printing credentials or private container state."""
import hashlib,json,pathlib,subprocess,sys
root=pathlib.Path(sys.argv[1]);manifest=json.loads((root/'payload/docs/release-integrity.json').read_text())
def run(args):return subprocess.check_output(args).decode().strip()
def inspect(name):return json.loads(run(['docker','inspect',name]))[0]
checks={}
for name,before in [('myelin-nightshift-v8','game-before.private.json'),('utxoplay-store','store-before.private.json')]:
 old=json.loads((root/before).read_text());new=inspect(name);game=name=='myelin-nightshift-v8'
 assert new['State']['Health']['Status']=='healthy'
 old_env=dict(e.split('=',1)for e in old['Config']['Env']);new_env=dict(e.split('=',1)for e in new['Config']['Env'])
 delta={'DATA_DIR','RUNTIME_BINARY','PEDAL_DATA_DIR','PEDAL_BINARY'} if game else set()
 assert {k:v for k,v in old_env.items() if k not in delta}=={k:v for k,v in new_env.items()if k not in delta}
 if game:
  assert new_env['DATA_DIR']=='/app/data-v13';assert new_env['PEDAL_DATA_DIR']=='/app/data-v12';assert new_env['PEDAL_BINARY']=='/app/target/release/myelin-nightshift-v12';assert new_env['RUNTIME_BINARY']=='/app/target/release/myelin-nightshift-v13'
 for field in ['User','WorkingDir','Entrypoint','Healthcheck','ExposedPorts']:
  assert old['Config'].get(field)==new['Config'].get(field),(name,field)
 assert new['Config']['Cmd']==(['node','host/nightshift13.mjs']if game else old['Config']['Cmd'])
 for field in ['ReadonlyRootfs','SecurityOpt','CapDrop','CapAdd','NanoCpus','PidsLimit','RestartPolicy','PortBindings','Mounts']:
  assert old['HostConfig'].get(field)==new['HostConfig'].get(field),(name,field)
 if game:
  assert new['HostConfig']['Memory']==new['HostConfig']['MemorySwap']==2048*1024*1024
 else:
  assert old['HostConfig']['Memory']==new['HostConfig']['Memory']
 mounts=lambda d:sorted((m['Type'],m['Source'],m['Destination'],m['RW'])for m in d['Mounts'])
 expected=mounts(old)+([('bind','/data/utxoplay/shared/nightshift-v13','/app/data-v13',True)]if game else[])
 assert sorted(expected)==mounts(new),(name,'mounts')
 assert set(old['NetworkSettings']['Networks'])==set(new['NetworkSettings']['Networks'])
 checks[name]={'healthy':True,'secretsPreserved':True,'legacyMountsPreserved':True,'securityAndNetworksPreserved':True,'image':new['Image']}
for version,expected in manifest['nativeBinaries'].items():
 actual=run(['docker','exec','myelin-nightshift-v8','sha256sum','/app/target/release/myelin-nightshift-v'+version]).split()[0];assert actual==expected,'native binary '+version
for file,expected in manifest.get('presentationHostFiles',{}).items():
 actual=run(['docker','exec','myelin-nightshift-v8','sha256sum','/app/'+file]).split()[0];assert actual==expected,file
catalog=json.loads(run(['docker','exec','utxoplay-store','cat','/app/server/catalog.json']));before=json.loads((root/'catalog-cutover-before.json').read_text())
assert [g for g in catalog if g['id']!='drift-run']==[g for g in before if g['id']!='drift-run']
assert next(g for g in catalog if g['id']=='drift-run')['version']==manifest['version']
report={'version':manifest['version'],'checks':checks,'fiveLegacyBinariesUnchanged':True,'newBinaryMatchesBookwormBuild':True,'otherCatalogEntriesPreserved':True,'newDataIsolated':True,'memoryLimitBytes':2048*1024*1024}
(root/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
