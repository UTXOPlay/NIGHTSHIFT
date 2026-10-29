# NIGHTSHIFT 9.3 — Districts and continuous scenery

This presentation release replaces repeated tower corridors with mixed street compositions, refreshes building surfaces, varies lighting fixtures and fixes the visible background and roadside seams. Signed V9 physics, obstacles, economy and native/browser profile binding are unchanged.

## Reference study

| Primary reference | What informed this release | Application |
| --- | --- | --- |
| [Bruno Simon's driving portfolio](https://bruno-simon.com/) and [world area source](https://github.com/brunosimon/folio-2025/tree/main/sources/Game/World/Areas) | Distinct areas, readable landmarks and street objects organized into places. | Mix low/mid/high buildings, courtyards and setbacks; separate foreground detail, middle-distance architecture and distant backplates. No portfolio code or assets redistributed. |
| [Quaternius Downtown City MegaKit](https://quaternius.com/packs/downtowncitymegakit.html) | Modular street pieces, shared texture sets, facade detail and weathering. | Eight shared facade families, small roof/entry modules, per-building tint/window variation and coherent block compositions. No paid kit or shader copied. |
| [Three.js Littlest Tokyo example, pinned r180](https://github.com/mrdoob/three.js/blob/r180/examples/webgl_animation_keyframes.html) | Environment illumination with bounded assets and a readable detailed environment. | Retain shared environment probes and instancing; keep two dynamic nearby point lights rather than adding a shadow map per lamp. The example model is not included. |

The implementation reuses the installed Three.js renderer and the existing licensed components. New architectural meshes are project-authored; the facade atlas was generated with the built-in image tool. Existing vehicle/Three/drei notices remain available in settings. [Generation prompt, dimensions and saved asset](nightshift-v93-art.json).

## Street composition and lighting

Each district now has 24 composition slots with deterministic selection that never picks the same slot on adjacent chunks. Urban, alpine, forest, garden, desert and canyon recipes combine different silhouettes and placements; engineered bridge/tunnel modules retain structural repetition with intermittent lookouts, equipment and service bays. This is not a claim that all 24 recipes in every district are unique models.

Brick apartments, limestone residences, blue glass offices, labs, loading depots, shopfronts, timber chalets and utility buildings share a 1774x887 WebP atlas, approximately 334 KiB. Texture coordinates retain building-metre density and gutters. Window occupancy varies by building and floor; daylight emission is reduced. Roof caps, podiums, awnings, benches, planters, shelters, service units, cranes and antenna towers add scale without per-object draw calls.

Glacier Pass uses openings, varied tree groups, chalets and lower distant outcrops instead of continuous roadside pillars. Canal buildings are lower and set back outside the waterway. Courtyards and podiums give the city alternating open and built sections. Decorative buildings remain outside the signed road collision space.

Four fixture families — swan-neck, slim LED, lantern and tunnel — vary by district and block. Warm/cool cards and soft ground gradients share instanced buffers. Only two nearby physical point lights remain; low quality disables them. There are no per-fixture shadow maps or full-screen bloom passes. The original shader prewarm, adaptive quality, backing-pixel cap and resource cleanup remain active.

## Seam correction

The visible vertical stripe in Glacier Pass came from applying `fract` to finite backplate imagery. Those pictures are not seamless 360-degree panoramas. The renderer now pans a bounded source window with continuous periodic heading response and a safe atlas margin; it does not wrap an image edge into the view. It still uses finite backplates, not a freely navigable 360-degree sky environment.

Roadside terrain is generated from the exact same course stations as the road. Snow, pavement, water and exterior ground use continuous double-sided route bands instead of tangent rectangular tiles that separate on curves. Shared band edges match exactly on curved, banked and graded routes. Gentle outer terrain relief and lowered building foundations improve the foreground transition. Continuous water/ground geometry does not change vehicle collision rules.

## Roadblock readability

Green chevrons indicate an opening calculated from the existing combined vehicle/barrier collision width. When stopped close to a roadblock, a one-time contextual hint displays the current reverse binding or the mobile gesture. Active boost also prompts braking first. The guide does not invent a gap when the whole width is blocked, remove obstacles, teleport the car or alter replay state.

## Verification

See [streets-results.json](streets-results.json) and [release verification](verification.md) for final measurements and deployment evidence. Tests cover deterministic variety, bounded recipes, collision-aware openings, finite background sampling across complete turns and exact terrain-band joins. Browser scenery fixtures capture all twelve maps at two distances; full acceptance retains all required screen sizes, inverse input, landscape gating, mobile controls and signed purchases/reload.

Benchmarks use desktop Chromium; mobile viewports are emulated. Remote acceptance can use manifest-verified local asset bytes while navigation, identity, native inputs and saves still use the real origin. Actual served files are hashed independently through the public TLS hostname. Such cached tests are not player-network startup benchmarks.
