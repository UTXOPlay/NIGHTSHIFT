# NIGHTSHIFT 14.2 — low-detail vehicle motion

This candidate adds visible wheel motion and brake response to traffic, pursuit and low-detail rivals while preserving V14 driving/contact rules. The complete single-player objective remains open. Multiplayer implementation is excluded.

## Assets and rendering

The five source bodies now carry four verified tire centers in a compact vertex field. Only unpainted wheel triangles inside the actual tire envelopes receive a pivot. Lamp and painted-panel vertices stay fixed. Travel distance drives tire rotation; front wheels also steer. The chassis, original triangles and authored texture image streams are retained.

The six selectable builds share five bodies. Their coarse rendering remains one main draw per car. Across all five coarse files, storage changes from 772,752 to 788,804 bytes, an additional 16,052 bytes. Source hero assets are unchanged. The generated provenance records bounds, four wheel vertex counts, source centers and texture-byte identity.

The color, directional-depth and point-distance shaders use the same wheel transform. Their materials share each actor's motion uniforms and are included in scene teardown. The geometry culling sphere includes a small steering margin. Held brakes and deceleration update both a hero and its coarse fallback. Traffic uses its own absolute road station and speed. A 32-slot pool covers the complete V14 population and retains each signed actor ID through body reordering, removal and menu views. Off-camera traffic does not draw; all 38 player/traffic/rival contact-shadow slots share one instanced draw. Historical V8 actors without IDs use bounded motion matching without changing saved state. Native game objects are only read.

## Verification

The original audit reproduced 22 authoritative cars with a 16-model renderer; an omitted actor reached the player's longitudinal position. The same ordinary-input sequence passes the new slot regression without omissions or changing surviving slots. Native V14 rules and the signed profile are unchanged.

Standalone GPU checks cover all six coarse builds. Pixel comparisons verify four moving tire regions and a stationary chassis, and rear-lens pixels brighten under a held brake. Directional and point shadow paths render without GL errors. Every coarse car uses one main draw. Unit checks cover frame-independent travel uniforms, braking on cars without a chassis rig, far-LOD agreement and shadow-material disposal.

The read-only review snapshot exposes actor/slot bindings and wheel/brake uniforms. The complete stress event now runs for 370.27 simulation seconds, reaches 26 concurrent traffic cars, checks 2,803 visible actor samples and 44 near actors that exceeded the old display limit, and verifies native replay. All five coarse rivals and 35 successive traffic actors show distance-driven wheel motion. The deliberate 75-second stop results in a lost podium, as expected; this is separate from the normal winning-event performance gate.

Two earlier attempts are retained as failed acceptance: one used a virtual driver without compensating the real 0.18 axial deadzone and ended early; the other observed correct dense traffic but did not complete inside its wall-clock deadline. The corrected harness validates all 201 steering demands, uses a monotonic stopwatch and bounds each browser observation. The complete Node suite passes 174 checks. Six coarse GPU cases, 34 fleet renders and all required viewport/input/portrait checks pass. The assembled staged image matches all 311 browser files, seven native executables and nine bound host files. Both native and browser-source CI pass for the runtime commit; the payload adds only a test-harness timing/input correction.

A normal stock Harbour event wins in 282.67 simulation / 282.65 wall seconds at 60 median / 60 p10 FPS, scale 1. The exact payload source passes native and browser-source CI. Staged and public fullscreen exit/reentry preserve the same iframe, JavaScript realm, canvas, WebGL context and paused race. A real pre-cutover career preserves its complete state and signed head, then continues from tick 3 to 6 with its inactive purchased part and allocation intact and native replay verified.

Version 14.2.0 is deployed from payload source e92162f. All 311 public files match their manifest; all seven native executables, 16 host files, original data mounts and resource/security settings remain unchanged. The parent catalog records 14.2.0 with a one-line change. Rollback containers and private backups are retained.

The first public 120-second performance attempt fails at 20 median / 6 p10 FPS and 76.1 simulation seconds. Concurrent compilation was observed afterward; that observation alone does not isolate a cause. The failed attempt is retained. A repeat with continuous environment/GPU records, after the original batch ended and observed load dropped, reaches 60 / 60 FPS, 120.13 simulation seconds, scale 1 and no errors on Iris Xe. Both attempts use the unchanged gates.

First driving remains required work: latest public samples take 31.57 seconds on desktop and 51.55 seconds under 4 Mbps / 120 ms / CPU 4x emulation, including countdown and the configured HTTPS proxy. The mobile renderer-module transfer alone takes 17.91 seconds for about 179 KB; measured module import is 17.97 seconds, while shader warmup is 4.69 seconds. Investigate request ordering/priority before changing texture fidelity. Wider scenery, route choices, distinctive audio, tactical variety, physical devices and human difficulty/economy acceptance remain in the full completion contract.

## Reproduction

Install root dependencies and the pinned offline packages under `tools/asset-tools`. Run `node tools/prepare-fleet-v142.mjs` and `node tools/nightshift142-coarse-review.mjs`. Assets are reconstructed from the credited local sources, and their albedo streams are copied byte-for-byte from the published V14.1 fleet. No replacement texture or new gameplay rule is introduced.
