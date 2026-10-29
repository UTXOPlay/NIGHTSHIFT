# NIGHTSHIFT 9.2 — Engine and interface

This release reduces presentation overhead and removes repeated controls without changing the signed racing rules, economy or native profile. The game remains solo racing with AI crews. Myelin provides off-chain replay verification, not CKB settlement.

## Engine comparison and reuse

| Reference | What was evaluated | Shipped decision |
| --- | --- | --- |
| [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) | Repeated buildings share geometry/material; instance buffers need uploading only after a change. | Keep instancing, store street parts in absolute course coordinates, move one parent origin per frame, and refresh buffers at 18 m chunk boundaries or map/profile/gate changes. |
| [Three.js BatchedMesh](https://threejs.org/docs/pages/BatchedMesh.html) | Official multi-draw batching with mixed geometries and object culling, tested with the supported hardware extension. | Rejected: the experimental scene did not pass the throughput gates on this shared host. The production world uses stationary instancing. |
| [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) | Asynchronous shader compilation, GPU accounting and lifecycle. | Prewarm race and shadow variants before the countdown, collect loading errors, clear warmup timer queries, and dispose shared resources, instances, queries and render targets. |
| [drei PerformanceMonitor](https://github.com/pmndrs/drei/blob/bf6f4addf47467d3885de272d94ca5127f6ef68f/src/core/PerformanceMonitor.tsx) | Windowed samples, thresholds, hysteresis and limiting quality oscillation. | Adapted for this vanilla runtime without adding React. GPU time also participates. Optional reflections/rain/shadow cadence shed load before lowering resolution. MIT notice ships in `licenses/drei.txt`. |
| [Bruno Simon's InstancedGroup](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/InstancedGroup.js) | Dirty instance updates and cached transforms in a polished browser driving world. | Applied the engineering approach. No site code, game assets or models copied from that project. |
| [Babylon optimization guidance](https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene/) | Static transforms, instancing and avoiding unnecessary scene work. | Applied those principles inside the existing engine. A framework rewrite would not fix repeated uploads or expensive contact calculations. |
| [Rapier determinism](https://rapier.rs/docs/user_guides/javascript/determinism/) | Rigid-body/vehicle simulation as a possible future physics foundation. | Not inserted into the existing signed V9 profile. A future physics migration needs a new application profile and matching native/browser replay; WASM determinism does not establish compatibility with our Rust rules. |

Three.js remains pinned to 0.180.0. Installed APIs were checked against that version. Engine reuse follows licenses; existing vehicle/image attribution remains available in the settings drawer.

## Runtime changes

- Static street geometry retains its original material UVs, scales, route positions and upright architecture. Transform-equivalence tests cover curved courses at multiple distances; all twelve maps retain their own scenery.
- Tire contact caches unique mesh positions once and projects them against the local road plane using affine coefficients. Chassis/suspension animation and exact rendered tire grounding remain intact. This is a presentation calculation, not new collision rules.
- The loading manager tracks real assets, including combat animation frames. Empty placeholders replace procedural cars that were immediately discarded after the external fleet loaded.
- Quality uses eight short measurement windows and slow recovery to avoid visible oscillation. GPU queries run every eleven frames, covering all four reflection phases. Cold shader preparation and paused/menu frames do not drive automatic degradation.
- Context loss pauses and releases held inputs. Recovery waits for signed input flushing and reloads the confirmed career. Teardown frees inactive map sign textures and detached vehicle resources as well as visible geometry. Hidden rain splashes skip matrix uploads.
- The 3,686,400-pixel backing cap, landscape rotation gate, exact inverse pointer transform, reduced motion, Colemak/custom bindings and 30 Hz native/browser simulation remain enforced.

## Interface

One keyboard/settings icon opens key remapping, quality, replay/export and expandable guidance/credits. The separate help icon and duplicate garage/map footer navigation are removed. The race HUD no longer repeats an entire keyboard instruction line, four ability captions or a permanent weapon-status sentence. Desktop ability keycaps, ammo/cooldown counts, accessible names and contextual failure feedback remain available; touch controls retain the joystick and icon actions.

## Verification

Machine-readable measurements are in [engine-results.json](engine-results.json). They include the frozen 9.1 baseline, the rejected batching experiment, the final high-quality run, mobile viewport emulation and context recovery. The final 30-second 1080p high-quality sample measured 60 median / 60 p10 FPS, 1.79 ms CPU draw work and 8.90 ms sampled GPU time. It advanced 30 simulated seconds in 30.01 wall seconds. The frozen 9.1 paired sample measured 2.86 ms CPU work; an earlier baseline measured 2.53 ms. A low-quality 844x390 touch emulation measured 60 / 60 FPS and 1.32 ms CPU work over 20 seconds. About 90% of sampled race frames skipped street-buffer uploads.

The real-vehicle fixture passes 90 poses / 360 contacts with maximum measured clearance around 0.0000021 m. All 67 Node/host tests and 38 native/browser tapes / 426,742 active ticks pass.

Benchmarks are sampled on a shared desktop Chromium/OpenGL setup; they are not physical Android/iOS guarantees. An unrelated concurrent SwiftShader test used roughly twelve CPU cores during a failed performance run; that run is retained diagnostically. GPU/FPS differences between samples cannot all be attributed to this patch.

Node/host tests cover quality thresholds and recovery, resource disposal, transform equivalence, dirty instance uploads, GPU query phases, timer reset and active/hidden-tab scheduling. Existing road/wheel/body/crash tests remain in force. Native/browser conformance uses the unchanged executable; signed exports, restart recovery, economy, stale/tampered actions and cross-profile rejection are checked separately.

Browser acceptance covers all required viewports, inverse input, purchases/reloads, results and next-stage transitions, joystick plus defense, rotation pausing, reduced motion, all map previews/minimaps and Colemak rebinding. The additional engine browser review checks shader preparation, skipped street uploads and complete signed state equality across context recovery.
