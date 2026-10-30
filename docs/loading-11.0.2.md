# NIGHTSHIFT 11.0.2 — loading and asset transport

The previous audit found a 25.13 MB initial transfer and a 61.1-second desktop cold visit. This change preserves signed V7–V11 profiles and native executables while reducing the initial resource set and fixing the platform asset boundary.

- The platform relays encoded HTTP asset streams, including representation headers, Vary, ETag/Last-Modified, HEAD and range validators. It no longer silently decompresses GLB responses or injects no-cache into conditional upstream requests. The application factory leaves the asset transport default to the gateway; injected test transports remain supported. Paid/private cache restrictions, cookie/runtime-credential boundaries and origin confinement are retained.
- Content fingerprints in artwork/model/audio URLs receive immutable caching only after the game host verifies the exact source digest. A stale or fabricated digest returns 404. Ordinary mutable paths keep their existing cache policy.
- Generic fleet geometry/material attributes are baked once using the same former browser cook function. Nine round trips preserve position, normal, color and surface arrays exactly, along with wheel transforms. Five race-body payloads total approximately 0.63 MB with Brotli versus 1.38 MB previously.
- The authored car retains its source geometry and PBR setup. Fourteen embedded textures are repacked as lossless WebP and checked for identical decoded RGBA pixels. Vehicle detail loads when selected; race launch waits for its player/rival detail and combat resources before starting the countdown. Browser and native race rules do not change.
- Six garage thumbnails are reused from the unchanged production renderer. Startup does not render/read back six cars or wait for unused hero models and combat sequences. Session progress is acknowledged when its API response arrives; the loading percentage remains monotonic.

## Live results

11.0.2 is deployed at https://store.utxoplay.io/games/nightshift/. [Machine-readable evidence](loading-11.0.2-results.json) includes both slow and fast samples, source/archive bindings and validation details.

| Metric | 11.0.1 audit | 11.0.2 observation |
| --- | ---: | ---: |
| Initial resource transfer | 25.13 MB | 10.33 MB, approximately 59% less |
| Desktop repeat entry | 38.51 s in that clock-skewed run | 2.52 s / 6.5 KB |
| Emulated phone, cold, 4 Mbps / 120 ms / 4× CPU | 60.56 s | 45.70 s and 32.04 s |
| Emulated phone, repeat | 54.89 s in that clock-skewed run | 3.32 s / 6.5 KB |
| Desktop cold | 61.14 s | **77.56 s and 17.82 s**; substantial network variance |
| Fresh desktop navigation through first race | Not measured separately | 44.01 s total; includes 25.16 s after the menu for deferred resources/countdown |

The first race is deliberately measured as well as menu readiness. Deferred assets are not free: the recorded visit completed another approximately 10.98 MB of requests before driving, including audio. Music range-request aborts/reissues are retained separately, with the audio snapshot at race start. No broad cold-start target or device-wide speed guarantee is established by these samples. The late asset notifications, followed rapidly by ready, identify downloading as the remaining dominant delay in the slow samples. Per-district texture splitting and critical visual-resource budgets remain further work.

The first public test run was interrupted when the deployment SSH control connection failed. Fresh server inspection confirmed that cutover had already completed: both production services were healthy and the catalog was 11.0.2. Completed slow measurements from that run are retained; no rollback or repeated cutover was performed. The HTTP preview travelled through a separate SSH/HTTP1 path and its timings are not presented as public HTTPS speedups.

Runtime sampling on Intel Iris Xe at 1920×1080, default Auto, gave median/p10 **60/60 FPS**, CPU median 2.20 ms and GPU median 10.52 ms over 20.03 s. Simulation advanced 20.03 s. It used verified cached resource bytes with live native API, separately from the true-network loading tests. Earlier contention-affected failures remain in the audit; this one scene is not an all-map or physical-phone certification.

## Validation and compatibility

- 123 game/host tests pass. The deployed-source platform transport suite passes 12 checks; its public-baseline equivalent passes 8. Four unrelated catalog/publisher UI expectations fail identically on unmodified public main and are documented in the evidence.
- Both game runtime CI jobs pass for commit `3ceb9f30159de2503e04b1ed671298b602fb7088`: [CI run](https://github.com/UTXOPlay/NIGHTSHIFT/actions/runs/41004626868).
- All 160 real public served files match the manifest. Real TLS delivery preserves the exact Brotli file (sample 89,138 B); conditional validation returns 304 with no body, and a fabricated content fingerprint returns 404.
- Five required landscape/large layouts, the portrait rotation gate, input inversion/resolution cap, menu focus/scroll, all cars/events, native purchases, a 226-second earned race and replay verification pass.
- A delayed-resource test rotates the device while preparing a race: completion does not start simulation behind the gate. Resume then works. Blur/pause also invalidate the asynchronous start. Both shadow shader variants are still prepared before countdown to preserve quality-switch behavior.
- Geometry and wheel transforms match the deployed fleet; the generic cache's nine attribute round trips have zero error. Fourteen authored textures decode to identical RGBA pixels. Existing visual source/licensing information remains included.
- Environment, mounts, security/resources and networks match the production snapshots; all four native binary pins and V7–V11 rule profiles are retained. A pre-cutover career retained its complete saved state after cutover, advanced from tick 3 to 6 and passed replay, then its QA session was logged out.
- The latest store image/catalog was rebased at cutover, preserving other games and its newer platform features. The game/store Git checkout and real indexes retain unrelated drafts; source is published through [NIGHTSHIFT PR #3](https://github.com/UTXOPlay/NIGHTSHIFT/pull/3) and [platform PR #1](https://github.com/UTXOPlay/UTXOPlay/pull/1).

Sources and full evidence remain archived on the release host. This release does not change native race rules or introduce multiplayer/CKB settlement.

The two staging containers and five isolated data directories were removed after verification. Production and rollback data remain intact.
