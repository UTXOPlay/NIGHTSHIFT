"""Prepare six credited models with coherent PBR materials, wheel pivots and two LODs.
Run: blender -b --factory-startup -t 4 -P tools/prepare-vehicle-v11.py
"""
import bpy,json,math,re
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'artifacts/vehicle-v11-sources';OUT=ROOT/'games/arcade/web/art/nightshift/fleet-v11';OUT.mkdir(parents=True,exist_ok=True)
# Source +Y front except the Porsche, whose lights establish -Y as its nose.
SPECS=[('bmw-320i',-1),('nissan-s14',-1),('audi-a5',-1),('porsche-911-gt3',-1),('audi-tt',-1),('dodge-challenger',1)]

def mat(name,color,metal,rough,emission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if name=='Paint':p.inputs['Coat Weight'].default_value=.65;p.inputs['Coat Roughness'].default_value=.19
 if name=='Glass':p.inputs['IOR'].default_value=1.46;p.inputs['Coat Weight'].default_value=.1
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m

def palette():return{n:mat(n,c,m,r,e)for n,c,m,r,e in [('Paint',(.7,.73,.77),.65,.24,0),('Glass',(.004,.009,.016),.06,.09,0),('Rubber',(.012,.014,.018),0,.88,0),('Metal',(.34,.39,.45),.82,.22,0),('Trim',(.018,.023,.028),.05,.65,0),('Interior',(.035,.04,.045),0,.8,0),('Headlamp',(.72,.85,.88),.2,.18,.6),('Taillamp',(.5,.015,.01),.1,.23,.6)]}

def category(name,src,paint):
 name=name.lower()
 if src.name in paint:return 'Paint'
 if any(k in name for k in ['glass','window','windscreen','steklo','vidro','louvre']):return 'Glass'
 if any(k in name for k in ['rubber','tyre','tire','pneu']):return 'Rubber'
 if any(k in name for k in ['tail','rear_light','back_light','breaklight','light_red','brake_light']):return 'Taillamp'
 if any(k in name for k in ['headlight','front_light','head_l','head_r']):return 'Headlamp'
 if any(k in name for k in ['chrome','metal','alumin','rim','disc','silver']):return 'Metal'
 if any(k in name for k in ['seat','interior','carpet','leather','salon']):return 'Interior'
 if any(k in name for k in ['paint','body','carros','kuzov','ext_body']):return 'Paint'
 bsdf=src.node_tree.nodes.get('Principled BSDF')if src.use_nodes else None
 c=bsdf.inputs['Base Color'].default_value if bsdf else src.diffuse_color
 return 'Trim'if max(c[:3])<.12 else 'Paint'if max(c[:3])-min(c[:3])>.09 else 'Metal'

def make(spec,front,lod):
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(SOURCE/(spec+'.glb')));bpy.context.view_layer.update();pal=palette()
 credit=next(c for c in json.loads((SOURCE/'sources.json').read_text())if c['id']==spec);paint=(credit.get('paint')or{}).get('materials',[])
 meshes=[o for o in bpy.data.objects if o.type=='MESH'];transforms={o.name:o.matrix_world.copy()for o in meshes}
 for o in list(bpy.data.objects):
  if o.type!='MESH':continue
  if any(k in o.name.lower()for k in ['logo','emblem','badge','text']):bpy.data.objects.remove(o,do_unlink=True);continue
  o.parent=None;o.matrix_world=Matrix.Identity(4);xf=Matrix.Rotation(0 if front>0 else math.pi,4,'Z')@transforms[o.name];o.data.transform(xf)
  if xf.determinant()<0:o.data.flip_normals()
  # Separate source material slots before assigning a clear physical role.
  if len(o.data.materials)>1:
   bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.mesh.separate(type='MATERIAL')
 bpy.context.view_layer.update();meshes=[o for o in bpy.data.objects if o.type=='MESH'];coords=[o.matrix_world@Vector(v)for o in meshes for v in o.bound_box]
 lo=Vector(tuple(min(p[n]for p in coords)for n in range(3)));hi=Vector(tuple(max(p[n]for p in coords)for n in range(3)));scale=min(4.28/(hi.y-lo.y),2.08/(hi.x-lo.x));offset=Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-lo.z))
 total=sum(sum(len(p.vertices)-2 for p in o.data.polygons)for o in meshes);ratio=min(1,(4800 if lod else 24000)/max(1,total))
 for o in meshes:
  for v in o.data.vertices:v.co=(v.co+offset)*scale
  o.data.update();src=o.data.materials[0]if o.data.materials else None;cat=category(o.name+' '+(src.name if src else ''),src,paint)if src else 'Trim';source=src.copy()if src else None
  if source and cat not in ['Paint','Glass']:
   source.name=cat;chosen=source
  else:chosen=pal[cat]
  o.data.materials.clear();o.data.materials.append(chosen);o['surface']=cat
  o.data.calc_loop_triangles()
  tris=len(o.data.loop_triangles);budget=max(18,int(tris*ratio))
  if tris>budget:
   dec=o.modifiers.new('Bounded mesh LOD','DECIMATE');dec.ratio=budget/tris;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=dec.name)
  # Source normals and hard panel edges are retained; no blanket smooth shading.
 bpy.context.view_layer.update()
 # Split disconnected original tyre/rim islands so their actual geometry can rotate.
 for o in list(bpy.data.objects):
  if o.type!='MESH' or o.get('surface')not in ['Rubber','Metal','Trim']:continue
  pts=[o.matrix_world@Vector(v)for v in o.bound_box]
  if max(p.z for p in pts)>.95:continue
  if max(p.y for p in pts)-min(p.y for p in pts)<1.3:continue
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.mesh.separate(type='LOOSE')
 meshes=[o for o in bpy.data.objects if o.type=='MESH']
 # Cluster small rubber/metal geometry at four wheel sites. Retain original wheel detail.
 bpy.context.view_layer.update();centres=[]
 for o in meshes:
  if o.name not in bpy.data.objects:continue
  pts=[o.matrix_world@Vector(v)for v in o.bound_box];mn=Vector(tuple(min(v[n]for v in pts)for n in range(3)));mx=Vector(tuple(max(v[n]for v in pts)for n in range(3)));c=(mn+mx)/2
  if o.get('surface')in ['Rubber','Trim'] and abs(c.x)>.55 and c.z<.7 and (mx-mn).y<1.3:centres.append(c)
 # Meshes spanning multiple tyres are kept in the body. These anchors use actual tyre clusters when available.
 wheelY=sorted([c.y for c in centres]);frontY=wheelY[-1]if wheelY else 1.32;rearY=wheelY[0]if wheelY else -1.27
 groups={}
 for o in list(bpy.data.objects):
  if o.type!='MESH':continue
  pts=[o.matrix_world@Vector(v)for v in o.bound_box];mn=Vector(tuple(min(v[n]for v in pts)for n in range(3)));mx=Vector(tuple(max(v[n]for v in pts)for n in range(3)));c=(mn+mx)/2
  wheel=None
  if not lod and o.get('surface')in ['Rubber','Metal','Trim']and abs(c.x)>.42 and c.z<.72 and (mx-mn).y<1.3 and min(abs(c.y-frontY),abs(c.y-rearY))<.55:wheel=('F'if abs(c.y-frontY)<abs(c.y-rearY)else'R')+('L'if c.x<0 else'R')
  key=(wheel,o.data.materials[0].name);groups.setdefault(key,[]).append(o)
 for (wheel,cat),parts in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=cat
  if wheel:
   pivot=bpy.data.objects.get('Wheel_'+wheel)
   if not pivot:
    pivot=bpy.data.objects.new('Wheel_'+wheel,None);bpy.context.collection.objects.link(pivot);pivot.location=(.83*(-1 if wheel.endswith('L')else 1),frontY if wheel.startswith('F')else rearY,.32)
   world=o.matrix_world.copy();o.parent=pivot;bpy.context.view_layer.update();o.matrix_world=world
 if not lod:
  for name in ['FL','FR','RL','RR']:
   if not bpy.data.objects.get('Wheel_'+name):raise RuntimeError('Missing original wheel geometry: '+spec+' '+name)
 for o in list(bpy.data.objects):
  if o.type not in ['MESH','EMPTY']:bpy.data.objects.remove(o,do_unlink=True)
 path=OUT/(spec+('-race'if lod else'-hero')+'.glb');bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_animations=False,export_cameras=False,export_lights=False,export_extras=False)
 return{'id':spec,'lod':lod,'bytes':path.stat().st_size,'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons)for o in bpy.data.objects if o.type=='MESH')}
reports=[make(name,front,lod)for name,front in SPECS for lod in [False,True]];(SOURCE/'prepared.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports),flush=True)
