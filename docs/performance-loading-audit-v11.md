# NIGHTSHIFT 11.0.1 — performance and loading audit

The first-load path is too heavy. A live desktop cold visit took **61.1 seconds** until the loading surface disappeared and the game was usable, transferring **25.13 MB across 74 requests**. A 4 Mbps / 120 ms / 4× CPU emulated landscape-phone visit took **60.6 seconds**. The largest confirmed causes are decompression at the platform gateway, broken conditional validation through that gateway, and mandatory loading/preparation of the entire fleet and effect set before showing the interactive menu.

This is an audit of deployed runtime commit `64d9da0a730b78f142679242f0b63b040edbeb27`, version **11.0.1**. Menu navigation and the UTXOPlay return entry are deployed. The performance findings below remain open; no loading-speed fix or speedup is claimed by this report. Machine-readable results are in [performance-loading-results.json](performance-loading-results.json).

## Measurements and limits

Loading measurements use real origin resources through the client's configured HTTPS proxy, with no local asset routing. A fresh browser context starts with a fresh, unfunded QA wallet already authenticated; wallet login time is excluded. A second page in the same context measures repeat entry. Each row is one sample, not a median or geographic service-level result. Limits applied by CDP are additional to the existing network path. These are desktop hardware measurements with emulated touch/network/CPU, not a physical-phone benchmark.

| Visit | Until usable | Observed transfer | Requests | Main-thread long-task total | Longest task |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop cold, 1920×1080 | 61.14 s | 25.13 MB | 74 | 8.50 s | 5.09 s |
| Desktop repeat | 38.51 s | 25.13 MB | 74 | 2.52 s | 1.45 s |
| Landscape phone emulation, cold, 844×390, 4 Mbps / 120 ms / 4× CPU | 60.56 s | 25.13 MB | 74 | 9.02 s | 4.52 s |
| Same phone emulation, repeat | 54.89 s | 25.13 MB | 74 | 3.04 s | 1.84 s |

**Clock caveat:** the test client is approximately eight hours ahead of the server. That makes one-hour image freshness unrepresentative of a correctly synchronized user's clock. Repeat-entry figures must not be generalized to ordinary clients. A separate cache probe retained the first browser tab while opening the next, so closing the last tab does not explain all observed retransfers. More decisively, an explicit server-side ETag request returned HTTP 200 with the full model through the gateway, while the same conditional request directly to the game returned 304. That defect is independent of client clock freshness.

The loading surface's first paint is not game readiness. On the desktop cold visit, the last asset progress notification arrived at 44.00 s and `ready()` at 60.02 s: a further 16.03 s. This interval includes CPU/GPU preparation and scheduling; it is not a decode-only measurement. The renderer reported 188 shader programs, 82 geometries and 37 uploaded textures after startup. Measured JS heap use ranged from approximately 19–53 MB across visits. GPU VRAM was not measured.

## P1 — platform gateway removes model transport compression

The exact same `concept-authored.glb` was requested through the public TLS gateway and directly from the game container:

| Path | Response body | Encoding | Vary |
| --- | ---: | --- | --- |
| Direct game, request Brotli | 4,971,685 B | `br` | `Accept-Encoding` |
| Direct game, request gzip | 5,194,710 B | `gzip` | `Accept-Encoding` |
| Public gateway, request Brotli | 6,047,532 B | absent | absent |

`server/game-gateway.mjs` uses the default Node Fetch client, which transparently decompresses the upstream body. It then streams that decoded body and copies a subset of headers, omitting `Content-Encoding` and upstream `Vary`. The outer nginx compresses some text types again, but this GLB is sent uncompressed. Thus generating `.br`/`.gz` files in the game build does not guarantee compressed public delivery. The ETag copied from the compressed representation also no longer describes the body representation actually forwarded.

Fix at the asset gateway: relay the negotiated encoded bytes with matching representation headers, validators and `Vary`; retain existing access checks, path confinement, range behavior and private-preview rules. A raw HTTP stream or a deliberately equivalent encoded transport can do this. Keep authenticated API responses outside this static-asset policy. Verify complete public bytes after decompression, compressed byte counts, ranges and conditional responses, not just HTTP 200. A blanket immutable cache policy on today's mutable filenames would be incorrect; first introduce content-addressed asset URLs. [MDN's Vary guidance](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary) explains representation selection, and its [HTTP caching guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching) explains validation and versioned resources.

## P1 — conditional static requests become full HTTP 200 responses

The public gateway returned **200 / 6,047,532 B** after receiving `If-None-Match` with the exact ETag it had just issued. Direct upstream tests returned:

| Upstream request | Status | Body |
| --- | ---: | ---: |
| Conditional gzip request | 304 | 0 B |
| Same, with `Cache-Control: no-cache` | 200 | 5,194,710 B |
| Same, with `Cache-Control: max-age=0` | 304 | 0 B |

A local Node Fetch reproduction independently showed that its default mode adds `Cache-Control: no-cache` and `Pragma: no-cache` when a conditional header is present. Explicit `cache: 'no-cache'` emitted `max-age=0` instead. The gateway currently forwards validators through default Fetch; Express's freshness calculation then declines the 304 path. This accounts for the reproducible validator failure. Correcting request cache semantics is part of the transport fix, rather than weakening game authentication or caching account state.

Accept the fix only after unchanged assets validate with 304 or a legitimate fresh browser cache hit, modified assets return the new representation, and identity/gzip/Brotli variants retain correct validators. Recheck repeat entry on a synchronized clock.

## P1 — the interactive menu waits for the entire fleet

`loadFleet()` first awaits the 6.05 MB authored car before starting the rest of the body loads. It then requests both hero and race variants for the whole six-entry fleet, even though the opening page shows a single district and the player can only drive one car. The fleet has five unique generic body names: Porsche appears twice. FileLoader can coalesce bytes, but the surrounding calls still parse/cook that body repeatedly and overwrite its cached geometry. The generic concept hero is also prepared even though the detailed concept path uses the separate authored model.

`Renderer.loadAssets()` joins the fleet with all environment atlases, road PBR, lighting probes and combat sequences in one mandatory `Promise.all`. `boot()` then waits for `prepareRace()` and synchronous six-car thumbnail generation before setting `loaded`. None of the menu destinations is interactive until all that work finishes.

Split the critical path: load the current district and selected race car first; load showroom detail only when selected; deduplicate fleet work by unique body/detail; bake stable geometry/material transforms offline; ship pre-rendered small garage thumbnails instead of six GPU readbacks at startup. Schedule optional assets after the menu is usable, and make race launch explicitly await only its required dependencies. Preserve authoritative gameplay and exact signed replay profiles. Compression extensions such as meshopt/KTX2 are options to evaluate with visual and decode tests, not automatic wins. [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) documents their support, and [glTF Transform dedup](https://gltf-transform.dev/modules/functions/functions/dedup) documents asset deduplication.

## P2 — shader preparation and progress reporting

`prepareRace()` draws a full scene and compiles it twice, with shadows enabled and disabled. `makeThumbnails()` renders and reads back all six cars synchronously before menu entry. The 188 startup shader programs and multi-second long tasks justify profiling those paths separately. Prewarm only the current presentation/quality variants, defer the rest, and split non-GPU work into bounded tasks or offline preprocessing. [Chrome/web.dev's long-task guidance](https://web.dev/articles/optimize-long-tasks) explains why large main-thread tasks delay input and painting.

The API state request is launched in parallel, but `UTXOPlayLoader.session()` is only called after all asset/shader/thumbnail work. Consequently the loading page can describe this preparation interval as connecting to a session even when the native response already arrived. Count-based asset progress also weights a tiny texture and a 6 MB model equally. Instrument separate session, critical download, decode/preparation and first-interaction milestones; keep progress monotonic and show the active phase accurately.

## Runtime rendering

These are 20-second driving samples using verified cached asset bytes and live native APIs, separately from the real-network loading tests. The hardware renderer was **Intel Iris Xe / ANGLE**, not the software renderer. The computer also ran unrelated browser/SwiftShader and Rust compiler work; a load average above 24 on 20 logical CPUs was observed. Those jobs were not stopped. Runtime figures are therefore contention-affected samples, not a controlled game regression comparison.

| Case | Median / p10 FPS | GPU median | Simulation / elapsed | Result |
| --- | ---: | ---: | ---: | --- |
| Harbour, 1920×1080, forced high | 27 / 22 | 36.26 ms | 17.23 / 20.21 s | Frame-rate and cadence gates failed |
| Glacier, 2560×1440, forced high | 18 / 13 | 53.32 ms | 14.90 / 20.12 s | Frame-rate and cadence gates failed |
| Harbour, 844×390, touch emulation, auto | 60 / 60 | 14.17 ms | 20.07 / 20.09 s | Passed |

An earlier pre-return-menu V11 Harbour sample reached 60 / 60 FPS, GPU 9.01 ms. That variance prevents a claim that the game consistently delivers 60 FPS, and also prevents assigning the full regression to the return/menu patch. Cache-backed samples do not measure download performance. Fixed high quality keeps full rendering scale under overload; test automatic scaling and feature tiers on a quiet host and physical target hardware before setting default-quality or frame-rate promises. The existing backing-pixel cap is respected, but a cap alone does not guarantee a frame budget.

## Fix order and acceptance

1. Repair gateway compression and conditional validation together; cover public/paid/private assets, ranges and representation headers with real integration tests.
2. Reduce the mandatory initial resource set and remove repeated fleet cooking/thumbnail readbacks. Record actual cold and repeat critical bytes and usability time after the change.
3. Profile shader variants and preparation on a quiet host, then test auto quality and physical mobile GPUs. Retain failed cadence samples instead of counting only renderer FPS.
4. Make loading phases truthful. Verify that game input, rotation gating, purchases, saved-race return and replay still work after progressive loading.

No single sample establishes a p95 load-time promise, broad NFS parity, physical-device readiness or a measured optimization gain.
