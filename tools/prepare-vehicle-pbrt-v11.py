"""Adapt licensed Car Concept / PBRT Sportscar sources for NIGHTSHIFT.
Run with Blender, never on gameplay/native data. See docs/vehicle-assets.md.
"""
import bpy,json,math,re,sys
from pathlib import Path
from mathutils import Matrix,Vector
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'artifacts/vehicle-assets'
OUT=ROOT/'games/arcade/web/art/nightshift/fleet-v11';OUT.mkdir(parents=True,exist_ok=True)

def material(name,color,metal=.1,rough=.5,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if name=='Paint':p.inputs['Coat Weight'].default_value=1;p.inputs['Coat Roughness'].default_value=.14
 if emit:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emit
 return m

def palette():return {'Paint':material('Paint',(.62,.68,.72),.7,.26),'Trim':material('Trim',(.023,.031,.04),.45,.5),'Carbon':material('Carbon',(.012,.018,.023),.35,.55),'Glass':material('Glass',(.026,.05,.068),.45,.15),'Metal':material('Metal',(.48,.55,.60),.85,.25),'Rubber':material('Rubber',(.011,.014,.017),0,.9),'Interior':material('Interior',(.035,.045,.052),0,.85),'Headlamp':material('Headlamp',(.63,.83,.9),.3,.2,.8),'Taillamp':material('Taillamp',(.7,.025,.017),.2,.24,.8),'Signal':material('Signal',(.9,.3,.04),.2,.3,.3)}

def car_transforms():
 text=re.sub(r'#.*','',(SOURCE/'sportscar-geometry.pbrt').read_text());stack=[];matrix=Matrix.Identity(4);mat='Trim';out={}
 tokens=re.finditer(r'AttributeBegin|AttributeEnd|(?:ConcatTransform|Transform)\s*\[[^\]]+\]|NamedMaterial\s*"[^"]+"|Shape\s*"plymesh"\s*"string filename"\s*\[\s*"[^"]+"\s*\]',text)
 for match in tokens:
  token=match.group()
  if token=='AttributeBegin':stack.append((matrix.copy(),mat))
  elif token=='AttributeEnd':matrix,mat=stack.pop()
  elif token.startswith(('Transform','ConcatTransform')):
   vals=[float(v) for v in re.search(r'\[([^\]]+)\]',token)[1].split()];local=Matrix([vals[n:n+4] for n in range(0,16,4)]).transposed();matrix=matrix@local if token.startswith('Concat') else local
  elif token.startswith('NamedMaterial'):mat=re.search(r'"([^"]+)"',token)[1]
  else:
   file=re.findall(r'"([^"]+)"',token)[-1].split('/')[-1]
   if file.startswith('OSD_'):out[file]=(matrix.copy(),mat)
 return out

def merge_material_parts(objects):
 groups={}
 for o in objects:groups.setdefault(o.data.materials[0].name,[]).append(o)
 result=[]
 for name,parts in groups.items():
  bpy.ops.object.select_all(action='DESELECT')
  for o in parts:o.select_set(True)
  bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=name;result.append(o)
 return result

def add_wheels(pal,scale,kind,lod,offset):
 ys=[-1.49,1.314] if kind=='concept' else [-1.188,1.706]
 radius=(.387 if kind=='concept' else .35)*scale
 for side in [-1,1]:
  for index,y in enumerate(ys):
   center=(Vector((side*.98,-y,radius/scale))+offset)*scale;root=bpy.data.objects.new(('Wheel_FL' if side<0 else 'Wheel_FR') if index==0 else ('Wheel_RL' if side<0 else 'Wheel_RR'),None);bpy.context.collection.objects.link(root);root.location=center
   pieces=[]
   bpy.ops.mesh.primitive_cylinder_add(vertices=12 if lod else 24,radius=radius,depth=.27*scale,rotation=(0,math.pi/2,0),location=center)
   tire=bpy.context.object;tire.data.materials.append(pal['Rubber']);pieces.append(tire)
   if not lod:
    bevel=tire.modifiers.new('Tire shoulder','BEVEL');bevel.width=.035*scale;bevel.segments=2;bpy.context.view_layer.objects.active=tire;bpy.ops.object.modifier_apply(modifier=bevel.name)
   outer=center+Vector((side*.145*scale,0,0))
   bpy.ops.mesh.primitive_torus_add(major_segments=12 if lod else 24,minor_segments=4 if lod else 6,major_radius=radius*.69,minor_radius=radius*.055,rotation=(0,math.pi/2,0),location=outer)
   rim=bpy.context.object;rim.data.materials.append(pal['Metal']);pieces.append(rim)
   bpy.ops.mesh.primitive_cylinder_add(vertices=12 if lod else 20,radius=radius*.59,depth=.022*scale,rotation=(0,math.pi/2,0),location=center+Vector((side*.12*scale,0,0)))
   disc=bpy.context.object;disc.data.materials.append(pal['Carbon']);pieces.append(disc)
   bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=radius*.14,depth=.04*scale,rotation=(0,math.pi/2,0),location=outer)
   hub=bpy.context.object;hub.data.materials.append(pal['Metal']);pieces.append(hub)
   for n in range(5):
    a=n*math.pi*2/5;bpy.ops.mesh.primitive_cube_add(size=1,location=outer+Vector((0,math.sin(a)*radius*.37,math.cos(a)*radius*.37)));o=bpy.context.object;o.scale=(.025*scale,.052*scale,radius*.62);o.rotation_euler.x=-a;o.data.materials.append(pal['Metal']);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);pieces.append(o)
   for o in pieces:
    for p in o.data.polygons:p.use_smooth=True
   if not lod:
    bpy.context.view_layer.update()
    for o in merge_material_parts(pieces):
     world=o.matrix_world.copy();o.parent=root;o.matrix_parent_inverse=root.matrix_world.inverted();o.matrix_world=world

def prepare(kind,lod):
 bpy.ops.wm.open_mainfile(filepath=str(SOURCE/(kind+'-source.blend')))
 for item in bpy.data.objects:item.animation_data_clear()
 bpy.context.view_layer.update();world_matrices={o.name:o.matrix_world.copy() for o in bpy.data.objects}
 pal=palette();keep=[];transforms=car_transforms() if kind=='sportscar' else None
 for o in list(bpy.data.objects):
  if o.type!='MESH':
   if o.type in {'CAMERA','LIGHT'}:bpy.data.objects.remove(o,do_unlink=True)
   continue
  name=o.name;materials=' '.join(m.name for m in o.data.materials if m);category='Trim';target=80
  if kind=='concept':
   if any(s in name for s in ['Wheel','Mesh_8','Mesh_9','Pedal','Wipers','HoodInterior','SteeringEmblem']) or 'Tireside' in materials or 'Tiretread' in materials:bpy.data.objects.remove(o,do_unlink=True);continue
   if 'Paint 1' in materials:category='Paint';target=1300 if 'Hood' in name or 'RearPanels' in name else 400
   elif 'Paint 2' in materials:category='Carbon';target=850 if 'Panels' in name else 180
   elif 'Glass' in materials:category='Glass';target=220
   elif 'Headlight' in materials:category='Headlamp';target=180
   elif 'Brakelight' in materials:category='Taillamp';target=180
   elif 'Signal' in materials:category='Signal';target=80
   elif 'Interior' in name:category='Interior';target=70
   elif 'Mirror' in materials:category='Metal';target=100
   world=world_matrices[o.name]
  else:
   file=o.data.name.split('.')[0]+'.ply'
   # PLY mesh datablocks keep the source stem even after object renaming.
   if file not in transforms:
    candidates=[f for f in transforms if Path(f).stem in o.data.name]
    if not candidates:raise RuntimeError('No PBRT transform for '+o.data.name)
    file=candidates[0]
   world,materials=transforms[file];name=materials
   if any(s in name.lower() for s in ['tire','wheel','brake','bolt','suspen','engine','pedal','camcover','goldmat']):bpy.data.objects.remove(o,do_unlink=True);continue
   if name=='BodyMat_phong_SG':category='Paint';target=7600
   elif 'BodyMat_BK' in name:category='Paint';target=850
   elif 'BodyGloss' in name or 'Carbon' in name:category='Carbon';target=950
   elif 'WindowGlass' in name:category='Glass';target=650
   elif 'GlassMat' in name or 'Lens' in name:category='Glass';target=180
   elif 'StopLightRed' in name:category='Taillamp';target=220
   elif 'HeadLight_LED' in name:category='Headlamp';target=170
   elif 'Winker' in name:category='Signal';target=120
   elif 'Interior' in name or 'Seat' in name:category='Interior';target=100
   elif 'Silver' in name or 'Mirror' in name:category='Metal';target=160
   elif 'Light' in name:category='Trim';target=160
   elif 'Chassis' in name:category='Carbon';target=300
   else:target=220
  # Bake world transforms, rotate the source's -Y nose to Blender +Y, and
  # export to glTF -Z. Material replacement excludes source logos/textures.
  o.parent=None;o.matrix_world=Matrix.Identity(4);xf=Matrix.Rotation(math.pi,4,'Z')@world;o.data.transform(xf)
  if xf.determinant()<0:o.data.flip_normals()
  # Weld the imported PLY corners before simplification so panel normals stay continuous.
  import bmesh
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=.00001);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(o.data);bm.free()
  o.data.materials.clear();o.data.materials.append(pal[category]);o.name=category
  bpy.context.view_layer.objects.active=o;o.select_set(True)
  tri=sum(len(p.vertices)-2 for p in o.data.polygons);budget=max(24,int(target*(.25 if lod else 3)))
  if tri>budget:
   dec=o.modifiers.new('NIGHTSHIFT_LOD','DECIMATE');dec.ratio=budget/tri;bpy.ops.object.modifier_apply(modifier=dec.name)
  for face in o.data.polygons:face.use_smooth=True
  keep.append(o)
 bpy.context.view_layer.update()
 coords=[o.matrix_world@Vector(b) for o in keep for b in o.bound_box];lo=Vector(tuple(min(p[n] for p in coords) for n in range(3)));hi=Vector(tuple(max(p[n] for p in coords) for n in range(3)));scale=min(4.45/(hi.y-lo.y),2.12/(hi.x-lo.x));offset=Vector((-(lo.x+hi.x)/2,-(lo.y+hi.y)/2,-min(0,lo.z)))
 for o in keep:
  for v in o.data.vertices:v.co=(v.co+offset)*scale
 # Remove emptied source hierarchy before creating clean wheel pivots.
 for o in list(bpy.data.objects):
  if o.type=='EMPTY':bpy.data.objects.remove(o,do_unlink=True)
 merge_material_parts(keep);add_wheels(pal,scale,kind,lod,offset)
 if lod:merge_material_parts([o for o in bpy.data.objects if o.type=='MESH'])
 bpy.ops.object.select_all(action='SELECT')
 path=OUT/((kind+'-v11-race' if lod else kind+'-v11-hero')+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_animations=False,export_cameras=False,export_lights=False,export_extras=False,export_materials='EXPORT',use_selection=True)
 report={'kind':kind,'lod':lod,'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in bpy.data.objects if o.type=='MESH'),'bytes':path.stat().st_size,'scale':scale}
 print(json.dumps(report),flush=True);return report

reports=[]
for kind in (['concept'] if '--concept-only' in sys.argv else ['concept','sportscar']):
 for lod in [False,True]:reports.append(prepare(kind,lod))
(SOURCE/'prepared.json').write_text(json.dumps(reports,indent=2))
