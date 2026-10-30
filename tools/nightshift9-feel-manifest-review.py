"""Compare served, uncompressed response bytes with the tested release manifest."""
import concurrent.futures,hashlib,json,os,urllib.request
from pathlib import Path
origin=os.environ.get('DRIFT_ORIGIN','http://127.0.0.1:18923').rstrip('/')
manifest=json.loads(Path('docs/release-integrity.json').read_text())
def check(item):
    name,expected=item
    req=urllib.request.Request(origin+'/games/nightshift/'+name,headers={'Accept-Encoding':'identity'})
    with urllib.request.urlopen(req,timeout=45)as r:body=r.read()
    assert hashlib.sha256(body).hexdigest()==expected,name
    return name
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:files=list(pool.map(check,manifest['browserFiles'].items()))
report={'version':manifest['version'],'origin':origin,'browserFiles':len(files),'allResponseBytesMatch':True}
print(json.dumps(report))
Path(os.environ.get('DRIFT_OUT','artifacts/feel-v1001/stage-manifest.json')).write_text(json.dumps(report,indent=2)+'\n')
