# Licensed vehicle assets

NIGHTSHIFT 8.1 uses two external source bodies for six fictional race builds. These are adaptations with aero kits and different finishes, not six separately authored source cars. Player cars use detailed geometry with animated wheels; opponents use simplified geometry and a batched material. Native handling, collision rules, purchase prices, vehicle IDs and Season 8 career data are unchanged.

| Source | Author / license | Use |
|---|---|---|
| [Sportscar](https://github.com/mmp/pbrt-v4-scenes/tree/master/sportscar) | Yasutoshi Mori (@MirageYM), [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) | VANTA street GT, KITE drift clubsport and ATLAS pursuit GT |
| [Car Concept](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept) | Eric Chadwick, © 2024 Darmstadt Graphics Group GmbH, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); based on Unity Fan's CC0 model | VELA aero coupe, ION electric GT and ONYX track special |

Source materials and textures, including source logo surfaces, were replaced. Geometry was reduced, source transforms baked, wheels rebuilt and aligned, and custom aero kits added. Per-vertex surface data preserves distinct paint, glass, metal, rubber and emissive light properties while batching each opponent into one body mesh plus its aero kit. The source authors do not endorse the game. A separate source candidate was rejected after visual inspection and is not shipped.

The four distributable GLBs are in `games/arcade/web/art/nightshift/cars/`. Together they are approximately 1.7 MB before transfer compression. Sportscar has approximately 19,000 triangles in the player model and 5,800 in the opponent model; Car Concept has approximately 14,500 and 4,400 respectively. Models are normalized uniformly and retain a grounded visual envelope. Their original licenses remain attached through [the distributable credits](../games/arcade/web/licenses/vehicles.txt) and an in-game guide link.

## Rebuilding

`tools/prepare-vehicle-assets.py` runs inside Blender 5.2. It expects the original inspected sources under `artifacts/vehicle-assets/`, deliberately excluded from Git. Import Car Concept into `concept-source.blend`; import the PBRT Sportscar PLY parts into `sportscar-source.blend` with their source mesh names, and keep `sportscar-geometry.pbrt` for the original transforms and materials. The tool applies the PBRT transform hierarchy, clears source animation data, snapshots source transforms before editing, removes unseen parts and source wheels, reduces geometry, installs the game materials and new wheel pivots, then exports both detail levels.

```sh
blender -b --factory-startup -t 4 -P tools/prepare-vehicle-assets.py
```

The release integrity manifest records the exact shipped hashes. Blender export ordering may differ across versions; inspect wheel alignment, vehicle bounds, material grouping and source orientation before accepting a rebuild.
