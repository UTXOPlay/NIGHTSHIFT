import bpy
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root/'artifacts/vehicle-assets/concept-original.glb'))
report=[]
for obj in bpy.data.objects:
 if obj.type!='MESH':continue
 obj.data.calc_loop_triangles();count=len(obj.data.loop_triangles)
 if count>350:
  mod=obj.modifiers.new('Presentation LOD','DECIMATE');mod.ratio=max(180,count*.27)/count;bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=mod.name)
 report.append((obj.name,sum(len(f.vertices)-2 for f in obj.data.polygons)))
path=root/'games/arcade/web/art/nightshift/fleet-v11/concept-authored.glb'
bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_animations=False,export_cameras=False,export_lights=False)
print('triangles',sum(n for _,n in report),'bytes',path.stat().st_size,flush=True)
