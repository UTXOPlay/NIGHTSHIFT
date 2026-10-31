# NIGHTSHIFT 14.1 presentation pass

Rules remain V14, with the exact published application profile and all seven executables/data namespaces preserved. This pass does not implement multiplayer or change contact envelopes, track topology, rewards or saved input interpretation.

## Vehicles

The old CPU color bake sampled texture rows with a flipped V coordinate and then removed UVs. The BMW source front/rear inspection showed intact lamp and grille detail while the baked runtime had white rear lamp patches. The new batches preserve the authored UVs, use one masked albedo sampler, and keep untextured paint/trim independent. Source images are capped at 1024 px and encoded as WebP quality 94. Rims and badges do not inherit lamp emission. Explicit lamp roles distinguish front/rear lenses and support stationary pedal-driven brake lights.

Some source `Wheel_*` nodes contained headlights or body trim, while real tires remained static in the chassis. The offline preparation now locates four actual tire meshes, rebuilds axle pivots from their bounds, and moves only wheel-sized geometry inside each tire envelope. Every original triangle remains. Bounds move by less than 0.04 mm during quantization. A rendered check rejects rotating lamp geometry, remote body pieces, implausible axle positions and wheel sizes, and verifies actual rotation and increased rear-lens brightness with the brake held at zero speed. The coarse traffic/rival LOD still batches its wheels into its body; its near-wheel animation remains required future work.

VANTA keeps the authored materials and exact referenced image streams. Removing unused intermediate accessors and re-encoding the existing geometry reduces its race GLB from 1,757,172 to 952,200 bytes, and its showroom GLB from 3,301,716 to 1,986,660 bytes. Triangle counts, named hierarchy and bounds remain unchanged. No texture is downsampled or re-encoded in this VANTA step. An unreferenced showroom image can be removed; every material/extension-referenced image is byte-identical.

## Nervos Harbour

Eight generated logistics elevations replace the shared generic warehouse front on the Harbour course. They include freight depots, cold storage, workshops and dispatch offices. A 2048 x 1024 WebP atlas feeds one instanced material. Roof silhouette and upper-window response vary independently. The old general architecture atlas stays deferred until a different course needs it; the Harbour does not download both. No additional dynamic lights or shadow passes are introduced. The course preview and six car thumbnails are actual new runtime renders.

The generator prompt, original output location, runtime output and preparation are retained in [presentation-v141-art.json](presentation-v141-art.json). Other eleven districts still need the broader near-scenery/lighting pass.

## Delivery

The HUD target and WebGL badges now use the same fingerprinted marker URL, avoiding the old marker atlas request and the distinct unversioned/versioned cache keys. The initial music request is unchanged and remains part of the first-drive loading work. Local emulation shows that reducing transfer bytes alone does not yet solve the roughly 32-second restricted-mobile first drive. Public results must be recorded independently; local desktop timings are not comparable to the public-origin baseline.

`deploy/Dockerfile.presentation` overlays an immutable published image. Historical native executables and environment defaults are inherited rather than rebuilt. A changed-file payload is valid only after the base manifest is checked and the assembled image matches the complete current manifest.

## Reproduction

Install root dependencies with `npm ci`, then install the separate pinned offline asset tools with `npm ci --prefix tools/asset-tools`. These packages are not production runtime dependencies. `ASSET_TOOLS_PACKAGE` can explicitly select another absolute package.json location.

- `node tools/prepare-fleet-v141.mjs`
- `node tools/prepare-vanta-v141.mjs`
- `node tools/bake-nightshift141-previews.mjs`
- `node tools/bake-nightshift141-previews.mjs --map`
- `npm run test:fleet`
- `node tools/freeze-nightshift14.mjs`
- `npm run check:release`
- `DRIFT_ORIGIN=<review origin> npm run test:browser`
- `DRIFT_ORIGIN=<review origin> npm run test:full-race`

The full-race review uses the existing V14 driver through standard virtual Gamepad inputs, waits for a natural result, checks its native replay and records sustained frame statistics. It does not establish human fun, all-route balance or physical-device performance. The complete single-player objective remains open.
