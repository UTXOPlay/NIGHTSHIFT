"""Run on the host after presentation cutover; report no private configuration."""
import json,pathlib,subprocess,sys
root=pathlib.Path(sys.argv[1]);manifest=json.loads((root/'payload/docs/release-integrity.json').read_text())
def run(args):return subprocess.check_output(args).decode().strip()
def inspect(name):return json.loads(run(['docker','inspect',name]))[0]
checks={}
for name,before in [('myelin-nightshift-v8','game-before.private.json'),('utxoplay-store','store-before.private.json')]:
 old=json.loads((root/before).read_text());new=inspect(name)
 assert new['State']['Health']['Status']=='healthy'
 assert dict(e.split('=',1)for e in old['Config']['Env'])==dict(e.split('=',1)for e in new['Config']['Env'])
 for field in ['User','WorkingDir','Entrypoint','Cmd','Healthcheck','ExposedPorts']:
  assert old['Config'].get(field)==new['Config'].get(field),(name,field)
 for field in ['ReadonlyRootfs','SecurityOpt','CapDrop','CapAdd','Memory','NanoCpus','PidsLimit','RestartPolicy','PortBindings','Binds','Mounts']:
  assert old['HostConfig'].get(field)==new['HostConfig'].get(field),(name,field)
 mounts=lambda d:sorted((m['Type'],m['Source'],m['Destination'],m['RW'])for m in d['Mounts'])
 assert mounts(old)==mounts(new)
 assert set(old['NetworkSettings']['Networks'])==set(new['NetworkSettings']['Networks'])
 checks[name]={'healthy':True,'environmentPreserved':True,'mountsPreserved':True,'securityAndResourcesPreserved':True,'networksPreserved':True,'image':new['Image']}
for version,expected in manifest['nativeBinaries'].items():
 actual=run(['docker','exec','myelin-nightshift-v8','sha256sum','/app/target/release/myelin-nightshift-v'+version]).split()[0]
 assert actual==expected,'native binary '+version
catalog=json.loads(run(['docker','exec','utxoplay-store','cat','/app/server/catalog.json']))
before=json.loads((root/'catalog-cutover-before.json').read_text())
assert [g for g in catalog if g['id']!='drift-run']==[g for g in before if g['id']!='drift-run']
assert next(g for g in catalog if g['id']=='drift-run')['version']==manifest['version']
report={'version':manifest['version'],'checks':checks,'nativeBinariesUnchanged':True,'otherCatalogEntriesPreserved':True}
(root/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
