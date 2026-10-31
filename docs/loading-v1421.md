# NIGHTSHIFT 14.2.1 — race startup scheduling

This presentation candidate preserves the published V14 simulation, all seven native executables, signed careers and the complete asset set. The complete single-player objective remains open. Multiplayer implementation remains excluded.

## Critical requests

An accepted start, stock time attack or resume gesture now requests the exact versioned renderer module before audio unlock and native command/save waits. A high-priority module preload shares the URL and credentials mode with the existing dynamic import. It does not construct WebGL, start scenery downloads or execute the renderer at the initial menu. Audio unlock stays inside the actual gesture.

The baseline dynamic import already has High request priority. This change advances its request order; it does not repair a previously Low-priority import. A controlled browser review verifies the deferred initial menu, one module transfer, matching URLs and a renderer request ahead of audio and the native race command.

Race effect atlases no longer wait for the initial coarse car. Their independent requests start alongside the environment; fleet installation explicitly awaits its own shared initialization. Streetlight imagery likewise starts alongside the structural atlas. Both textures are complete before the same materials are applied. Every required race resource still finishes before shader warmup and driving. No texture, geometry, sound, effect or quality tier is removed.

A network dependency review delays the actual coarse car and structure atlas by 1.2 seconds. It confirms that the published baseline serializes the unrelated requests and that the candidate overlaps them, with each renderer resource transferred once, all assets ready and no graphics errors. The HUD also uses the marker atlas through CSS; the review retains that separate initiator because request routing disables the HTTP cache. Its first attempt incorrectly treated that CSS use as a duplicate renderer load and is retained as a harness failure.

## Loading evidence

All figures below are individual local-origin samples using fresh browser caches, the same existing loading review and actual driving including countdown. Mobile emulation uses 844 × 390, 4 Mbps down, 1 Mbps up, 120 ms latency and CPU 4x. GPU/OS shader caches are not reset between runs. Host load varies; these are not physical-device or worldwide percentiles.

| Sample | Restricted mobile first driving | Desktop first driving |
| --- | ---: | ---: |
| Published baseline, first pass | 29.844 s | 4.878 s |
| Module preload only | 26.598 s | 4.966 s |
| Preload plus independent requests | 25.327 s | 4.657 s |
| Published baseline, reverse repeat | 27.566 s | 4.838 s |
| Final candidate, repeat | 25.723 s | 4.558 s |

The first pass has different shader warmup durations and cannot isolate the scheduling improvement. In the final pair, mobile warmup is 4.451 versus 4.406 seconds, first frame 1.077 versus 1.027 seconds and first driving 27.566 versus 25.723 seconds. The candidate's renderer import is 1.113 seconds versus 1.300 seconds; independent race preparation is 13.248 seconds versus the baseline's 13.892 seconds after its approximately one-second fleet wait. OS load/free-memory samples are retained for both repeat runs. Known wire bytes remain about 8.8 MB; this is a scheduling change, not a payload-size reduction.

Raw evidence is under `artifacts/loading-v1421`. Prior public 14.2.0 measurements remain 31.57 seconds desktop and 51.55 seconds restricted mobile through the configured HTTPS proxy. They are not directly comparable with localhost. Public candidate acceptance is still required before publishing a delivery claim.

## Integrity and remaining work

All 311 browser paths are retained. Native V7–V14 inputs/profiles, all seven published executable hashes and bound host files remain frozen. Packaging includes the explicit 14.2.0 base manifest and selected release documents while retaining the same-file-set and native/host equality guards.

First-drive loading remains required work. Route design, all-route scenery and lighting, vehicle/audio identity, tactical depth, personal ghost integration, human handling/economy evaluation and physical-device acceptance remain in `single-player-completion.md`. No local timing or automated pass completes that contract.
