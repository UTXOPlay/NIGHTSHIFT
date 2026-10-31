# NIGHTSHIFT 14.2 — low-detail vehicle motion

This candidate adds visible wheel motion and brake response to traffic, pursuit and low-detail rivals while preserving V14 driving/contact rules. The complete single-player objective remains open. Multiplayer implementation is excluded.

## Assets and rendering

The five source bodies now carry four verified tire centers in a compact vertex field. Only unpainted wheel triangles inside the actual tire envelopes receive a pivot. Lamp and painted-panel vertices stay fixed. Travel distance drives tire rotation; front wheels also steer. The chassis, original triangles and authored texture image streams are retained.

The six selectable builds share five bodies. Their coarse rendering remains one main draw per car. Across all five coarse files, storage changes from 772,752 to 788,804 bytes, an additional 16,052 bytes. Source hero assets are unchanged. The generated provenance records bounds, four wheel vertex counts, source centers and texture-byte identity.

The color, directional-depth and point-distance shaders use the same wheel transform. Their materials share each actor's motion uniforms and are included in scene teardown. The geometry culling sphere includes a small steering margin. Held brakes and deceleration update both a hero and its coarse fallback. Traffic uses its own absolute road station and speed. A 32-slot pool covers the complete V14 population and retains each signed actor ID through body reordering, removal and menu views. Off-camera traffic does not draw; all 38 player/traffic/rival contact-shadow slots share one instanced draw. Historical V8 actors without IDs use bounded motion matching without changing saved state. Native game objects are only read.

## Verification

The original audit reproduced 22 authoritative cars with a 16-model renderer; an omitted actor reached the player's longitudinal position. The same ordinary-input sequence passes the new slot regression without omissions or changing surviving slots. Native V14 rules and the signed profile are unchanged.

Standalone GPU checks cover all six coarse builds. Pixel comparisons verify four moving tire regions and a stationary chassis, and rear-lens pixels brighten under a held brake. Directional and point shadow paths render without GL errors. Every coarse car uses one main draw. Unit checks cover frame-independent travel uniforms, braking on cars without a chassis rig, far-LOD agreement and shadow-material disposal.

The read-only review snapshot also exposes actor/slot bindings and wheel/brake uniforms. A first real-event attempt confirms moving traffic and all five coarse rivals but ends before the overflow case; it is retained as a failed acceptance attempt. Its virtual driver sent steering without compensating the real 0.18 gamepad deadzone. The corrected harness verifies all 201 steering demands through the actual deadzone transform before rerunning.

These checks do not establish completed integrated race behavior, loading or sustained performance. Required follow-up includes actual traffic/rival actor sampling, the complete fleet and viewport checks, frozen source/build integrity, sustained races, image acceptance and public delivery. The wider scenery, route choices, audio identity, tactical variety and human difficulty/economy work remain in the completion contract.

## Reproduction

Install root dependencies and the pinned offline packages under `tools/asset-tools`. Run `node tools/prepare-fleet-v142.mjs` and `node tools/nightshift142-coarse-review.mjs`. Assets are reconstructed from the credited local sources, and their albedo streams are copied byte-for-byte from the published V14.1 fleet. No replacement texture or new gameplay rule is introduced.
