# NIGHTSHIFT 4.0 — quickfire events and clear consequences

This release responds to the shield/death bug, hard-to-read pickups, long routes, weak feedback, repetitive events, opaque controls and the mobile joystick request. All game copy and generated icon labels are English.

## Driving contract

Version 3 combined three lives, 54 ticks of collision grace and complete nitro collision immunity. Version 4 has one life. A shield absorbs one collision and is consumed; the next unshielded collision immediately ends the run, even during nitro and even while the previous impact animation is still playing. Each collided body is removed once. An impact animation is not an invulnerability window. Fatal collision stops processing later pickups, so a shield pickup cannot revive a wreck within the same tick. The HUD explicitly says `NO SHIELD` and `UNPROTECTED · ONE HIT`; the result says `WRECKED` and explains the rule.

Vanta, Kite and Vela start with one shield; Atlas starts with two. Shield pickups cap at two. Nitro is acceleration only. The former repair pickup becomes EMP because extra health no longer exists.

## Four short events

| Event | Route | Objective |
| --- | --- | --- |
| Quick Sprint | 650 m | Reach the finish through traffic and boost strips. |
| Heat Escape | 850 m | Escape pursuit; roadblocks announce a safe gap. |
| Drift Attack | 600 m | Finish with at least 600 style. Purple zones double drift score. |
| Intercept | 800 m | Disable at least three marked rivals using EMP or a shielded nitro ram. |

These replace 1.8–2.4 km events. Checkpoints add three seconds, rather than ten. Routes cycle through slipstream, moving cross traffic, a drift zone and boost-strip sections. Three-charge trails create an optional line to follow. The HUD shows meters remaining rather than only distance already traveled.

EMP uses E / the touch EMP button, spends one charge, and affects cars/marked rivals within a bounded forward/lateral range. Holding the key cannot repeatedly consume it. EMP does not remove roadblocks. Intercept starts with two charges and has additional EMP pickups. Nitro plus a shield can take down a marked rival on contact, consuming the shield; an unshielded ram is fatal.

## Presentation and touch

Pickups have distinct English icons, labels, silhouettes, colors, road rings and vertical beacons. Their labels scale within a cap as they approach. Charge trails use larger luminous rings; boost strips have road chevrons. Marked rivals have a `TARGET` badge.

Feedback includes pooled impact shards, pickup particles, expanding EMP rings, tire marks, larger tire smoke, boost speed streaks, exhaust flames, restrained camera roll, a lower nitro camera with wider FOV, and light at the screen edges. The final impact stays on screen briefly before results. Reduced motion removes the nonessential particles, roll, shockwaves, speed streaks, weather and edge effects. Existing original texture assets are reused; no new texture downloads are required. No new fullscreen postprocessing or realtime shadow pass is introduced.

On touch devices, the directional arrows and separate brake button are replaced by a thumb joystick. Horizontal deflection controls steering velocity; pulling down while steering engages the brake/drift input. The right thumb has only two translucent circular controls, EMP and boost. Joystick input and action buttons work simultaneously. Releasing/cancelling a pointer, opening a menu, losing focus or rotating to portrait clears held input. The landscape gate pauses this local solo game. Road dragging continues to use the inverse camera transform; the joystick uses its own screen-space geometry.

Opaque HUD fills are reduced and inherited backdrop blur is explicitly disabled on driving controls. Large displays retain HUD scaling and a bounded 3,686,400-pixel WebGL buffer. Geometry, effects and pickup pools are bounded. Physics remain at integer 30 Hz; analog joystick intent is converted into ordinary signed steering/brake inputs without altering replay semantics.

## Version and validation

The application is `myelin-nightshift-v4` with native sources in `games/nightshift-v4/native`, browser sources in `games/nightshift-v4/web` and `nightshift4-*` presentation modules. The public handle remains `drift-run`. The dedicated host keeps web 8898 / runtime 8798; the combined host uses private runtime 8799. Version 4 has a new save directory and application profile. V3 sources, binary and data remain preserved, and the two versions reject each other's exports. Myelin is off-chain host replay, not CKB settlement.

Automated checks cover immediate unshielded death, nitro collisions, sequential impacts, pickup-after-death ordering, EMP range/latching, all four finish contracts, moving traffic, drift zones, genesis-only choices and input clearing. The conformance sweep compares 96 native/browser tapes (115,200 supplied inputs; 42,843 active simulation ticks), with all event wins, pickups, encounters, fatal collisions and EMP takedowns reached from genesis.

Browser tests use actual keys and touch events, never state injection. Full-event drivers completed Sprint, Heat, Drift and Intercept. The fatal-collision driver consumed one shield and then reached WRECKED at tick 157. The six-size suite checks 1920×1080, 2560×1080, 2560×1440, 3840×2160, 844×390 and the 390×844 rotation gate, including simultaneous joystick/drift/EMP and rotation clearing. Mobile is browser emulation, not physical-device thermal testing.

Uninterrupted local OpenGL/Chromium samples for all four events, including the 4K viewport sprint, reported median/p10 60/60 FPS. The final transparent-HUD Intercept check also reported 60/60 with at most 100 draw calls. An earlier screenshot-heavy visual run recorded lower FPS; it is retained as visual evidence, not a performance baseline. Performance figures apply to the measured machine, not every GPU or phone. Detailed logs, screenshots, exports and deployment records are in `artifacts/nightshift-v4`.

The original NFS/GitHub research and original generated art provenance remain in [the V3 design record](nightshift-research-and-design.md) and [art prompts](nightshift-art.json). This release adds code-native effects and icons, not third-party game assets.

The final scoped Nightshift/shared-host suite passes 9/9; Rust passes 11/11; the parent store passes 77/77; Clippy and formatting pass. The broad arcade suite currently has seven failures, all in concurrently modified `tests/starfall.test.mjs`. Those sources and that runtime are outside this release and were left untouched.

The public suite passed the same 15 checks, and the public fatal-collision run reached WRECKED at tick 157 with one shield absorbed. A public Intercept completed in 438 ticks with six takedowns, median/p10 60/60 FPS and at most 100 draw calls. The last presentation-only revision reserves 20 charge-ring slots (the maximum slow-speed trail overlap is below this bound) and six slots per other pickup type. It keeps the total pickup pool at 56 and preserves the native profile and existing V4 saves.
