"""Repack embedded textures as lossless WebP; preserve geometry and decoded RGBA."""
from pathlib import Path
import io,json,struct
from PIL import Image
source=Path('games/arcade/web/art/nightshift/fleet-v11/concept-authored.glb')
b=source.read_bytes();n=struct.unpack_from('<I',b,12)[0];doc=json.loads(b[20:20+n]);binary=b[28+n:];replacements={}
for image in doc['images']:
 view=doc['bufferViews'][image['bufferView']];start=view.get('byteOffset',0)
 with Image.open(io.BytesIO(binary[start:start+view['byteLength']]))as im:
  rgba=im.convert('RGBA');out=io.BytesIO();rgba.save(out,format='WEBP',lossless=True,method=6,exact=True);data=out.getvalue()
  with Image.open(io.BytesIO(data))as check:assert check.convert('RGBA').tobytes()==rgba.tobytes()
 replacements[image['bufferView']]=data;image['mimeType']='image/webp'
chunks=bytearray()
for index,view in enumerate(doc['bufferViews']):
 while len(chunks)%4:chunks.append(0)
 start=view.get('byteOffset',0);data=replacements.get(index,binary[start:start+view['byteLength']]);view['byteOffset']=len(chunks);view['byteLength']=len(data);chunks.extend(data)
while len(chunks)%4:chunks.append(0)
doc['buffers'][0]['byteLength']=len(chunks)
for texture in doc['textures']:texture.setdefault('extensions',{})['EXT_texture_webp']={'source':texture.pop('source')}
for key in ['extensionsUsed','extensionsRequired']:
 doc.setdefault(key,[])
 if 'EXT_texture_webp'not in doc[key]:doc[key].append('EXT_texture_webp')
raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);body=struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(chunks),0x004e4942)+chunks
result=struct.pack('<III',0x46546c67,2,12+len(body))+body;Path('games/arcade/web/art/nightshift/fleet-ready-v11/concept-authored.glb').write_bytes(result)
print(json.dumps({'sourceBytes':len(b),'preparedBytes':len(result),'images':len(replacements),'allDecodedRgbaBytesIdentical':True}))
