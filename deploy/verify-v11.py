"""Verify the guarded V11 cutover without printing private container configuration."""
import json,pathlib,subprocess,sys
root=pathlib.Path(sys.argv[1]);manifest=json.loads((root/'payload/docs/release-integrity.json').read_text())
def run(args):return subprocess.check_output(args).decode().strip()
def inspect(name):return json.loads(run(['docker','inspect',name]))[0]
checks={}
for name,before in [('myelin-nightshift-v8','game-before.private.json'),('utxoplay-store','store-before.private.json')]:
 old=json.loads((root/before).read_text());new=inspect(name);game=name=='myelin-nightshift-v8'
 assert new['State']['Health']['Status']=='healthy'
 env=dict(e.split('=',1)for e in old['Config']['Env'])
 if game:env.update(DATA_DIR='/app/data-v11',RUNTIME_BINARY='/app/target/release/myelin-nightshift-v11',ROADBLOCK_DATA_DIR='/app/data-v10',ROADBLOCK_BINARY='/app/target/release/myelin-nightshift-v10',PREVIOUS_DATA_DIR='/app/data-v9',PREVIOUS_BINARY='/app/target/release/myelin-nightshift-v9')
 assert env==dict(e.split('=',1)for e in new['Config']['Env'])
 for field in ['User','WorkingDir','Entrypoint','Cmd','Healthcheck','ExposedPorts']:assert old['Config'].get(field)==new['Config'].get(field),(name,field)
 for field in ['ReadonlyRootfs','SecurityOpt','CapDrop','CapAdd','Memory','NanoCpus','PidsLimit','RestartPolicy','PortBindings','Mounts']:assert old['HostConfig'].get(field)==new['HostConfig'].get(field),(name,field)
 binds=old['HostConfig'].get('Binds')or[]
 if game:binds=binds+['/data/utxoplay/shared/nightshift-v11:/app/data-v11:rw']
 assert binds==(new['HostConfig'].get('Binds')or[])
 mounts=lambda d:sorted((m['Type'],m['Source'],m['Destination'],m['RW'])for m in d['Mounts'])
 expected=mounts(old)+([('bind','/data/utxoplay/shared/nightshift-v11','/app/data-v11',True)]if game else[])
 assert sorted(expected)==mounts(new)
 assert set(old['NetworkSettings']['Networks'])==set(new['NetworkSettings']['Networks'])
 checks[name]={'healthy':True,'configurationPreservedExceptV11RuntimeAndData':True,'securityAndResourcesPreserved':True,'image':new['Image']}
for version,expected in manifest['nativeBinaries'].items():assert run(['docker','exec','myelin-nightshift-v8','sha256sum','/app/target/release/myelin-nightshift-v'+version]).split()[0]==expected,'Native binary '+version
catalog=json.loads(run(['docker','exec','utxoplay-store','cat','/app/server/catalog.json']));before=json.loads((root/'catalog-cutover-before.json').read_text())
assert[g for g in catalog if g['id']!='drift-run']==[g for g in before if g['id']!='drift-run']
entry=next(g for g in catalog if g['id']=='drift-run');assert entry['version']==manifest['version'];assert entry['cover']=='/assets/nightshift-circuit-v11.webp'
report={'version':manifest['version'],'checks':checks,'fourNativeBinariesVerified':True,'otherCatalogEntriesPreserved':True,'freshCover':True};(root/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
