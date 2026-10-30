# Release verification

The current control update is [10.0.2 — Controller input and observed driving practice](controls-and-research-v10.md). Its 116 public resources match the tested manifest; it retains the exact V10 native profile and all three executable hashes. Controller and physical-phone validation limits are recorded separately from automated acceptance.

The active roadblock rules are [NIGHTSHIFT V10 — Readable roadblocks and physical recovery](nightshift-v10.md). Their exact native profile is `0b9501d47ecdec91a485f5dfc7dcca5fc391128cee449f72fc06c782ba292561`, binding eighteen native inputs. The observed 10.0.1 camera/audio follow-up preserves that profile, all three native executables and the roadblock/reverse modules. Its 112 browser files have been verified separately. Frozen V9/V8/V7 source bindings remain retained.

The canonical route is [`/games/nightshift/`](https://store.utxoplay.io/games/nightshift/). Catalog/account identity remains `drift-run`. `/play` and the old game slug retain their permanent redirects.

Product completeness is evaluated separately in the [current 9.4 completion audit](completion-audit-v94.md). The checks below verify implemented behavior and release identity; the audit records remaining gameplay and NFS-alignment gaps.

## V10 roadblock verification — 30 October 2026

Roadblock runtime source: `89def39144e8072065b4c01b03a5707d6a8cb7f1`. [Both CI jobs pass](https://github.com/UTXOPlay/NIGHTSHIFT/actions/runs/40966006177), including the retained V9 matrix and V10 native/browser conformance. The [initial parent catalog commit](https://github.com/UTXOPlay/UTXOPlay/commit/1474224b97b7b0a8f2daf1defc98d2f19ed830f0) changes only NIGHTSHIFT's version; the unrelated parent index and HEAD remain untouched.

All 94 isolated Node/host tests pass. V10 conformance compares 39 tapes, 445,490 active ticks and an earned 1,105-frame career, with an ordinary-input success on every map. Native contact and migration tests cover recovering actors, traffic, trailing rivals, verified V9 origins and an origin already carried from V8. Signed purchase/restart/tamper/stale-input/cross-profile checks pass against the portable executable. A separate 27-trial pursuit audit covers three maps, three difficulty settings and three race IDs: 343 closures, at least 300 m of lead for the player/leading rival, both one- and two-lane closures and zero observed rival-centre crossings through intact concrete. Nine full audit races also match native execution. This is one automated controller, not a human win-rate study or a count of every possible mesh contact.

Final staging passes thirteen full application checks, four engine checks, five store checks and the keyboard/touch roadblock review. The exact V10 release initially serves 107 matching public browser files and twelve matching host/config/package files. Its three native executables retain their declared hashes, writable data for V10 is isolated, and both old native volumes remain mounted.

An actual career saved before cutover keeps its complete V9 game, block and profile, then advances from tick 3 to tick 6 under the frozen V9 executor. An unsupported cached client receives HTTP 426 before any mutation. An explicit new race verifies the complete old signed export as a V10 origin; the 650-credit balance and complete career remain identical. Three new inputs match the V10 browser state and the combined native replay verifies.

A concurrent 10.0.1 camera/audio release is preserved. All eighteen native source bindings, all three executable hashes, the ten host/config files and the three roadblock/reverse modules match the roadblock release. Its 112 files fetched through the actual public TLS endpoint match its manifest; both current services are healthy with zero restarts and all three native data mounts are preserved. The current game/store images are `sha256:6ab15d46a7db8a18a90bf3cf7ccdb3d936387dd589e935ce465a73b7fd7a35ff` and `sha256:61fa0e5eae10d6ec478ba35332dce39790ef87c9ded41a57b52053e1e9358740`.

The public application reviews are repeated against that exact 10.0.1 asset snapshot: thirteen acceptance checks, four engine lifecycle checks, five store launcher checks and four roadblock checks across Colemak and trusted touch paths. Both roadblock runs see the closure around 305 m ahead, stop 5.9 m from it, reverse/steer out and continue beyond it without losing armor; their native replays verify. Two attack pictograms are also checked against the actual roadblock glyph bounds. The mobile run rotates while reverse is held and verifies paused simulation and cleared input. Context recovery reloads the identical signed career, and 96.2% of sampled street frames skip instance uploads. All six required display sizes, bounded backing resolution, inverse input and reduced motion remain covered. The CI link binds the roadblock source; the later graphics bundle is verified by these public checks and served-file hashes.

Final 10.0.1 public-origin driving samples on the shared desktop Intel Iris Xe / Chromium OpenGL setup, including a Glacier Pass roadblock approach:

| Quality / viewport | Wall / simulation seconds | Median / p10 FPS | Median CPU work | Sampled GPU time |
| --- | --- | --- | --- | --- |
| High, 1920×1080 | 20.198 / 20.200 | 60 / 59 | 2.28 ms | 6.35 ms |
| Low, 844×390 emulated touch | 20.105 / 20.067 | 60 / 60 | 1.56 ms | 4.32 ms |

Both retain render scale 1 with no browser errors and advance the simulation at normal cadence. An earlier 10.0.0 emulated-touch sample measured 53 median / 15 p10 FPS; that sample remains recorded. Host load changed and a concurrent graphics cutover followed, so the later numbers do not establish a controlled speedup or prove a sole cause for the earlier stutter. These are short desktop/emulated-touch measurements, not physical-phone thermal or long-session guarantees.

The first public roadblock review intersects the concurrent cutover and receives HTTP 502; another attempt loses its SSH verification connection. These interrupted attempts are excluded. Earlier transport setup and QA assertion corrections remain in the machine-readable diagnostics. The final browser reviews cache exact manifest-verified asset bytes while navigation, authentication, native actions and saves use the real TLS origin through SSH CONNECT. The separate server-side HTTPS sweep checks actual resource delivery; this does not establish player-network startup time.

The roadblock source archive SHA-256 is `a38730975f1819ec9b04e3c2bfd00b51b6a86e29c9eb69484807971bdd207f79`; the exact observed 10.0.1 browser snapshot SHA-256 is `aafc7c3a536e9d41265c8d385a4cdeebe56d2679b35539bc61815ffaa9b233ae`. Private configurations, original stopped containers, a consistent platform backup and a native archive taken after stopping the original writers remain available. Rollback handling preserves the separate V10 volume. Only this task's two staging containers are removed; other projects and the later graphics release remain intact.

[Roadblock design and captures](nightshift-v10.md) · [Measured evidence](roadblocks-results.json).

## 9.6 verification — 30 October 2026

Runtime source: `fa259cb29d8fe411d94c43c13096390c7e8132cf`. [Both runtime CI jobs pass](https://github.com/UTXOPlay/NIGHTSHIFT/actions/runs/40955173297), including native/browser conformance and signed replay. The [isolated parent catalog commit](https://github.com/UTXOPlay/UTXOPlay/commit/4fe14585484675746242c1f382a0f0ce1acbe3d6) changes only NIGHTSHIFT's version. Later evidence-only commits do not change the deployed browser or native bytes.

All 86 Node/host tests pass. Render-only fixtures cover twelve maps and eighteen high/low/high resize/input cases at all six required sizes. They check geometry validity, quality transitions, the driving corridor and absolute road anchoring without changing game state. The world stays within 38 shared instance pools. Optional facade/container fittings use a bounded near range and are removed at low quality; structural silhouettes remain.

Final staged application acceptance passes thirteen checks, including a 233.4-second native-signed victory, purchases and reload, all required display sizes, mobile joystick/counter, portrait gating, cleared inputs and reduced motion. Four engine lifecycle checks pass, including context-loss recovery of the identical signed career; 89.2% of sampled street frames skip instance uploads. Five staged and five public store launcher checks pass.

All 105 files fetched from the actual public HTTPS endpoint match the release manifest. V9 and V8 native binary hashes remain pinned. The pre-cutover career retained its complete game state, block, profile and 650 credits. Three ordinary inputs advanced it to tick 3 and its native replay verified. A QA assertion initially addressed credits at the wrong property after sending those inputs; the resumed check compared the complete three-tick game with the original saved state, without sending a second batch or creating a replacement career. Production environments, mounts and every other catalog entry were preserved. Both replacement services report healthy with zero restarts.

Final public-origin samples on desktop Intel Iris Xe / Chromium OpenGL:

| Quality / viewport | Wall / simulation seconds | Median / p10 FPS | Median CPU work | Sampled GPU time |
| --- | --- | --- | --- | --- |
| High, 1920×1080 | 20.100 / 20.100 | 60 / 52 | 3.49 ms | 13.01 ms |
| Low, 844×390 emulated touch | 20.018 / 20.000 | 60 / 58 | 4.20 ms | 5.72 ms |

Both retained render scale 1 with no browser errors. The first high-quality public sample failed at 18 median FPS and 14.73 simulated seconds over 20.19 wall seconds. Concurrent software rendering and tests were observed; contention is a hypothesis, not proof of the sole cause. The separate final high sample passed, but the failed sample remains in the evidence and the variance rules out claims of consistently stable 60 FPS or a controlled speedup. Earlier local samples precede the final ground-anchoring correction and are labeled accordingly.

These are short, shared-desktop samples, not physical-phone or sustained-session benchmarks. Browser reviews cache manifest-verified local assets while navigation, authentication, native actions and saves use the deployed TLS origin through SSH CONNECT. The separate 105-file sweep verifies actual resource delivery; no network-startup performance is claimed. An SSH interruption before the successful cutover left 9.5 running; failed setup attempts made before reconnection are excluded from acceptance results.

The game image is `sha256:648e6f6c90dffd6372fd93f5fd3ebb055441a898a282f0a726b4fa81fad8a3ed`; the store cutover image is `sha256:20e931c8dec6c1e3831683076d7d276c264e7bd2a4f1b3661f9ac1330e4b079e`. The store was derived from the latest live store immediately before cutover, preserving independent other-game changes. Staging uses separate native data, a consistent private platform backup and no public `VIRTUAL_*` registration. The two owned staging containers were removed; the public HTML/catalog and both healthy, zero-restart production services were checked again afterward. Original stopped containers, private configurations and backups remain available for rollback. The immutable runtime archive SHA-256 is `fab418417b9fac6a3c0d735f6f4927247f4080b512ff23b2d7ddbf647ca21488`.

[Measured evidence](district-results.json) · [Controlled scene comparisons and scope](nightshift-v96.md).

## 9.5 verification — 30 October 2026

Runtime source: `0f49817ec57c6c7391459b4a291471802189f6ca`. [Both runtime CI jobs pass](https://github.com/UTXOPlay/NIGHTSHIFT/actions/runs/40945084140), including native/browser conformance and signed replay checks. The [isolated parent catalog commit](https://github.com/UTXOPlay/UTXOPlay/commit/b8dd5f30692bb701d4c0525ffbe26b64fb156133) changes only NIGHTSHIFT's version. The unrelated dirty parent checkout and its index were preserved; only the working catalog's NIGHTSHIFT version was aligned.

All 81 Node/host tests pass. Render-only fixtures cover twelve maps and eighteen high/low/high resize/input cases across all six required sizes. Final staged application acceptance passes thirteen checks, including a 233.4-second native-signed victory, purchases and reload, all large displays, mobile joystick/counter input, landscape gating, cleared inputs and reduced motion. Four engine lifecycle checks pass, including context-loss recovery of the identical signed career; 96.2% of sampled street frames skip instance uploads. Five staged and five public store launcher checks pass. Fixture screenshots explicitly disable garage rendering and do not establish human playability or a physical-device frame rate.

All 104 files fetched from the actual public HTTPS endpoint match the release manifest. V9 and V8 native binary hashes remain pinned. A career created before cutover kept its exact game state, block, profile and 650 credits, advanced from tick 0 to 3 through ordinary inputs, then verified its native replay. Production environment values, mounts and every other catalog entry were preserved. Both replacement services report healthy with zero restarts.

Two final public-origin samples on desktop Intel Iris Xe / Chromium OpenGL:

| Quality / viewport | Wall / simulation seconds | Median / p10 FPS | Median CPU work | Sampled GPU time |
| --- | --- | --- | --- | --- |
| High, 1920×1080 | 20.199 / 20.167 | 60 / 60 | 2.32 ms | 7.47 ms |
| Low, 844×390 emulated touch | 20.043 / 20.000 | 60 / 60 | 1.55 ms | 4.16 ms |

Both kept render scale 1 and had no browser errors. These are short, shared-desktop samples. They cache manifest-verified local assets while navigation, authentication, native actions and saves use the deployed TLS origin through SSH CONNECT; the separate 104-file sweep verifies actual delivery. They are not network-startup or physical-phone thermal/memory benchmarks, and no controlled speedup over 9.4 is claimed. Initial contended candidate/baseline failures remain documented in [the lighting notes](nightshift-v95.md).

The game image is `sha256:0054d84fe1039736f90dcdc129ce1ee9f3618a5ac3e711c0e27638af14aa9205`; our store cutover image is `sha256:8e3cf8288ade82e36b350443ae6d5cbff94a4750644cf0cb8d9e9284e2c455d0`. The store image was derived from the latest live store immediately before cutover, preserving its independent fullscreen and other-game changes. Staging uses separate native data, a consistent private platform backup and no public `VIRTUAL_*` registration. The two owned staging containers were removed after verification; production domain pins remain unchanged. Original containers, private configurations, a consistent platform backup and native evidence remain available for rollback. The runtime source archive SHA-256 is `53dbba78f45bdab05e658b1d37b1e9d65fcd0575ceccad82f77dca2f98925a90`.

[Measured evidence](lighting-results.json) · [Asset provenance](lighting-assets-v95.json) · [Controlled visual comparison and remaining limitations](nightshift-v95.md).

## 9.4 verification — 30 October 2026

See [career and garage design](nightshift-v94.md) and [current verification evidence](career-results.json). This release includes the scenery work below, which was developed as a 9.3 checkpoint before the user expanded the scope. Native profiles and economy rules are unchanged.

Runtime source: `fa64befa5256c9e6902e07cb56e0ccaba47751ba`. [Both runtime CI jobs pass](https://github.com/UTXOPlay/NIGHTSHIFT/actions/runs/40922904837). The [parent catalog commit](https://github.com/UTXOPlay/UTXOPlay/commit/16cddd894b9e0028e170351e78c05a1ab0e93c5f) changes only NIGHTSHIFT's version. Later evidence-only commits do not change the deployed browser or native bytes.

All 81 Node/host tests, 38 native/browser tapes / 426,742 active ticks / 1,184 career frames and signed purchase/restart/tamper/stale-block/profile checks pass. V8 migration checks preserve the unfinished original run and its career, verify legacy ticks and migrate only on an explicit new event. No V9 handling or economy rule changed.

The final UI passes thirteen public acceptance checks, six progression checks, four tactics checks, four engine lifecycle checks, five garage checks, five store checks and an ordinary-input roadblock recovery. These cover all required large displays, 844×390 landscape controls and 390×844 portrait gating. A 233.4-second native-signed victory, earned car purchase/reload, exact upgrade debit, six-driver classification, separate mobile results, four event filters, route scouting and no-cost owned-loadout selection all pass. The scenery fixture covers 24 views across twelve maps without browser/shader errors.

All 94 files served by the actual public TLS endpoint match the manifest. Both deployed native executable hashes retain their pins. A pre-cutover V9 career kept its complete state, block, profile and 650 credits, then advanced from tick 9 to 12 and verified its replay. The native data volumes and unrelated catalog entries were preserved.

Two final public-origin samples on the same desktop Intel Iris Xe / Chromium OpenGL setup:

| Quality / viewport | Wall / simulation seconds | Median / p10 FPS | Median CPU work | Sampled GPU time |
| --- | --- | --- | --- | --- |
| High, 1920×1080 | 20.119 / 19.567 | 59 / 45 | 3.54 ms | 14.36 ms |
| Low, 844×390 emulated touch | 20.158 / 20.167 | 60 / 59 | 2.27 ms | 5.27 ms |

Both samples kept render scale 1 with no browser errors. The desktop sample had 65–101 main-scene draw calls and 152,445 peak triangles. These short shared-desktop samples do not establish a frame-rate improvement over 9.2 or physical-phone performance. The earlier interrupted/contended samples remain diagnostic evidence. Browser reviews cache manifest-verified local asset bytes while navigation, authentication, native inputs and saves use the deployed TLS origin via SSH CONNECT. Separate server-side hashing checks actual delivery. These are not network-startup benchmarks.

After the UI reviews, an independently created Eight Ball stage inherited the production `VIRTUAL_HOST`; a subsequent benchmark's authentication request failed with 403 before any driving sample. Its public registration was removed while preserving its image, mounts, networks and private review port. The failed setup is retained separately. The 94-file TLS sweep, native pins, correct public Origin and both authenticated driving samples were then verified again. A separate deployment recreated the stage, so the gateway now has [persistent explicit production-domain pins](../deploy/production-routing.md). All other domain configuration hashes are unchanged. The three generated upstreams survive Docker regeneration; a subsequent independent store release preserved NIGHTSHIFT 9.4. After the pins, authentication, an exact native upgrade debit, four ordinary driving ticks, signed replay and all five store checks pass. NIGHTSHIFT staging never advertised the production hostname, and its two temporary containers have been removed.

The deployed game image is `sha256:133839c7c26eaea89f2d95387d52f301e2a29c7ea131815ddc6f9cb3e9cdb078`; our store cutover image is `sha256:aa9172182915a29c2e105051f7492d9e4c3cab1af2f84e19c3a65360973f93ab`. The subsequently observed shared-store image is `sha256:35935f73d82cfae58c51a6b6de149f301a61a938e6dfee667373815773a2ca23`. Both services are healthy with zero restarts. Private rollback configurations, a consistent platform backup, native evidence and a hash-verified runtime source archive remain on the server. The runtime archive SHA-256 is `60c37e784ac00e340396f7e9db4a7a9bda8cb43e2b6a41af2892857e680ef4cd`. Recovery preserves current data volumes.

[Driver file](screenshots/career-v94.webp) · [Route scout and loadout](screenshots/strategy-v94.webp) · [Mobile results](screenshots/results-mobile-v94.webp) · [Generated facade prompt and provenance](nightshift-v93-art.json).

## Scenery development checkpoint — 29–30 October 2026

See [district and seam correction notes](nightshift-v93.md), [generated asset provenance](nightshift-v93-art.json) and [current machine-readable evidence](streets-results.json). Native V9 and retained V8/V7 identities remain unchanged.

## 9.2 verification — 29 October 2026

Engine comparison, implementation and license decisions are documented in [nightshift-v92.md](nightshift-v92.md); current verification is recorded in [engine-results.json](engine-results.json). For slow cross-region links, `tools/cached-browser-review.mjs` can cache manifest-verified local assets while keeping navigation, authentication and native APIs on the real origin. Server-side TLS hashing verifies actual served assets separately. Cached review runs are labeled explicitly and are not startup/network benchmarks. The retained 9.1 evidence below provides the previous release baseline.

Runtime source: `fd26835e9c0e21e4e0b60d05622a210bb6607051`. [Both CI jobs pass](https://github.com/UTXOPlay/NIGHTSHIFT/actions/runs/40884444994). The [parent catalog update](https://github.com/UTXOPlay/UTXOPlay/commit/d22a9781d6c52bb99c2ac4c4262468e473d4a0c6) changes only NIGHTSHIFT's version.

All 67 Node/host tests, 38 native/browser tapes / 426,742 active ticks and signed export/restart/tamper/profile checks pass. The final bundle passes thirteen local, staging and public acceptance checks, four engine recovery checks and five staging/public store checks. All twelve maps and Colemak remapping remain covered. The real-model fixture passes 90 poses / 360 contacts with maximum measured clearance about 0.0000021 m.

The actual public TLS endpoint serves all 88 manifest files exactly, and both deployed native executables retain their pins. A pre-upgrade V9 career retained its complete state, block hash, profile and 650 credits, then advanced from tick 9 to 12 and verified its replay. Other catalog entries and native data volumes are preserved.

The final 20-second public-origin driving sample on desktop Chromium measured 60 median / 60 p10 FPS, 1.76 ms median CPU draw work, render scale 1 and no errors, advancing 20.13 simulated seconds in 20.16 wall seconds. A separate 30-second high-quality renderer sample measured 1.79 ms CPU work and 8.90 ms GPU time. Remote browser runs cache verified asset bytes; native APIs and navigation remain remote, while server-side hashing checks real asset delivery separately. These are not network-startup or physical-phone benchmarks.

The production game image is `sha256:6cc1d95c00640f28368409491355ee2172225faaa4050ab487928632662e3182`; the store cutover image is `sha256:334b14494ad759d3a450ef4a5b7a18f89f52a9e4efa996bf08ae42e09df6842b`. Both services report healthy with zero restarts. Private rollback configurations, a consistent platform backup, native evidence and the hash-verified runtime source archive remain on the server. Rollbacks preserve live data volumes.


## 9.1 verification — 29 October 2026

Runtime source: `a4509958c0e8be13f2358b56391184f17ba740d3`. [Both CI jobs passed](https://github.com/UTXOPlay/NIGHTSHIFT/actions/runs/40871493807). The [isolated parent catalog commit](https://github.com/UTXOPlay/UTXOPlay/commit/ec793e76609c8d50ddf14180d9fca3297644f5fc) changes only NIGHTSHIFT's version. Full machine-readable results are in [motion-presentation-results.json](motion-presentation-results.json).

All 59 JavaScript/host tests pass. New checks cover cadence-independent damping/ribbons, body weight-transfer direction, banked/graded tire contact, cached road geometry, eight-frame impact progression, bounded crash motion at 30/60/120 Hz, world-position HUD projection and barrier face/winding normals. The isolated real-model browser fixture covers 90 poses / 360 tire contacts; maximum measured absolute clearance is about 0.0000021 m in that fixture. This is not a claim about every live crash.

Native/browser conformance passes 38 tapes and 426,742 active ticks, including an earned economy. Signed export/restart/tamper/profile rejection checks pass against the unchanged executable. All twelve map previews/minimap views and seven combat/reduced-motion scenarios pass without browser/shader errors.

Thirteen complete staging and public TLS browser checks pass: a 233.4-second signed victory, earned KITE purchase and reload, next briefing, the four required large displays, 844x390 landscape controls and the 390x844 portrait gate, inverse input, safe result layout, English icon controls and reduced motion. Five final public store checks pass for authenticated iframe identity, canonical/legacy links, chess, vendor fallback and home links. Subsequent targeted HUD/barrier corrections are covered by the added tests, CI and final served-file verification.

A V9 career created before cutover retained its complete state, block hash, profile and 650 credits after the presentation upgrade. It advanced from tick 9 to 12 with ordinary inputs and its signed replay verified. No save was reinterpreted with new rules.

Measured on the same desktop Chromium/OpenGL setup:

| Sample | Median / p10 FPS | Median CPU draw work | Sampled GPU time |
| --- | --- | --- | --- |
| V9.0 Neon Ward, 1920x1080, 30 s | 60 / 60 | 2.28 ms | Unavailable |
| First 9.1 iteration, 1920x1080, 30 s | 60 / 60 | 3.42 ms | 9.38 ms |
| Final 9.1, 1920x1080, 30 s | 60 / 60 | 2.48 ms | 7.99 ms |
| 9.1 low quality, 844x390 emulated touch, 20 s | 60 / 60 | 1.66 ms | 5.19 ms |

These are sampled runs on a shared desktop, not physical-phone guarantees or matched baseline GPU comparisons. Render scale remained 1. The final sample reports 54–90 main-scene draw calls and no browser errors. Road station caching removes repeated strip/elevation work while retaining the richer vehicles and effects. A short screenshot-only run overlapping another browser's scene compilation failed performance gates; it is excluded from benchmarks. The later isolated 30-second runs passed. Back-buffer limits, pools, vehicle LOD and reduced motion remain enforced.

All 85 final public files match the manifest through the real TLS hostname; both deployed native executable hashes match their retained pins. That hash sweep ran on the server with the public hostname resolved to local TLS. Separately, full browser acceptance used actual public-host requests through an SSH CONNECT tunnel because this workstation's cross-region asset transport is slow. Startup timing from that tunnel is not a player-network benchmark. Map thumbnails now have low fetch priority so they do not compete as aggressively with race assets.

The game image is `sha256:98a91f0ac9d12737c74de9873be76d0aa21bf81b097eadd513069e67ea714338`. The final observed store image is `sha256:aa6357873a47874e783348dc69184efb48ac82c056b8905fc8364b05ba45cc01`, retaining a concurrent store release. Our initial catalog overlay `sha256:ca4e89329761ff5606beac8785f8f3108e252917055a1d3978c7b90bc9a90de0` preserved every other catalog entry from its then-current base; later independent catalog changes were preserved. A concurrent store recreation interrupted one public hash request; final verification was repeated successfully. Staging was excluded from public domain discovery throughout this release.

The private server release directory retains immutable source/payload/evidence archives, prior image/configuration references, a consistent platform backup and native evidence backup. Roll back presentation images while retaining current native volumes; do not replace live careers with older backups. Owned staging containers, local review hosts and verification tunnels are removed/stopped after verification.

## Preserved 9.0 verification

The original Circuit handling release bound the same native profile and 78 browser files. Its original evidence follows.

## V9 local verification — 28 October 2026

All 50 JavaScript/host tests and 13 native test cases passed. The native tests verify swept contact outcomes, braking/boost cancellation, reverse, authenticated career origins, cross-profile rejection and restart persistence. Complete browser/native conformance covers 38 tapes, 426,742 active ticks and 1,184 economy frames; every map has a successful ordinary-input replay and the career earns all six cars. Successful events remain between three and seven active minutes.

The signed HTTP career test completed a 233.4-second win after one failed race, bought KITE with earned credits, rejected stale/tampered commands, verified its export and recovered the same state after restart. The real V8/V9 host bridge test retained an unfinished V8 race and its ticks, then verified/imported the original career only when an explicit new race was chosen. The original V8 state remained intact.

Browser acceptance passed 1920×1080, 2560×1080, 2560×1440, 3840×2160 and 844×390, backing-resolution limits, inverse input, purchases/reload, separate result panels, next-stage navigation, thumb-stick plus counter, portrait pause/input clearing and reduced motion. Six licensed vehicle builds remain upright with four grounded tire contacts. All twelve environments compile without browser/shader errors. Seven combat scenarios verify effects and native replay; fatal motion freezes the simulation and rests the vehicle above the local road surface. Colemak detection, physical-key events, HUD labels, conflict rejection, custom persistence and settings pause/release were checked in Chromium.

Final local measurements (not physical phone measurements):

| Scene / viewport | Wall / simulation seconds | Median / p10 FPS | Median CPU draw work | Draw calls |
| --- | --- | --- | --- | --- |
| Harbor, 1920×1080 | 30.13 / 30.10 | 60 / 60 | 2.58 ms | 44–78 |
| Neon Ward, 1920×1080 | 30.20 / 30.17 | 60 / 60 | 2.60 ms | 45–76 |
| Commons Gardens, 844×390 touch simulation | 20.11 / 20.10 | 60 / 60 | 2.40 ms | 46–81 |

The garden measurement includes the final research buildings replacing the reflective domes. All samples kept render scale 1 and reported no browser errors. The V9 portable binary SHA-256 is `bd67f1479d573ca42b3cfc2bcfd2d481636aaabfceb282a188dc0b6841278f89`; the retained exact V8 binary is `1127061eccb05a2a671c03330a16b1c1ad1d37a3a79ebb10ed9a6e9855ae9598`.

## V9 production verification — 28 October 2026

Runtime/deployment source: `cc1b5d37249f69ddd925507d5bd8f5b049f779f5`. [Both CI jobs passed](https://github.com/UTXOPlay/NIGHTSHIFT/actions/runs/40703060614). The [isolated store patch](https://github.com/UTXOPlay/UTXOPlay/commit/a2365484980a61aedf9480ee3fd40763e320da6a) passed its source build and nine selected route/gateway tests. It was layered onto the latest live store image, preserving concurrent wallet artwork and item-store retirement changes, all other catalog entries and the current CSS.

Production serves V9 with the exact profile and both binary hashes recorded above. All 78 served browser files match the release manifest. Thirteen full browser acceptance checks and five store launch/routing checks passed against the public TLS hostname: a signed 233.4-second victory, earned KITE purchase, reload persistence, next briefing, large displays, mobile joystick/portrait gate, English icon controls and native replay. The store document and authenticated iframe both end at `/games/nightshift/`; chess and vendor fallbacks also pass. V8 rejects V9 exports and V9 rejects V8 exports.

A career created before cutover retained its complete unfinished V8 state at tick 30, accepted its original V8 inputs to tick 33, and migrated only when a new event was explicitly requested. Its 650 credits and GRIP tier 1 remained exact; original and migrated signed exports both verified with their corresponding executable. Original V8 storage is retained, with V9 storage on a separate volume. Prior images, private database backups, immutable source archives and sanitized verification reports remain in the server release directory.

The game image is `sha256:72311081b631167aae63256ea320a79b0f592297890db40a729b8dbbea715b65`. The store overlay is `sha256:ceea3972914d045aecad9d2cb8bf7c37f5b550f873f61535796463248611dbb6`, based on `sha256:3dafb1039ab17521c31812c697a226e80bb8b123a047e6e313832dcbace5f8ec`. Both services are healthy.

A staging configuration initially inherited `VIRTUAL_HOST`, briefly directing public login requests to the staging origin. Its domain advertisement was removed, staging was stopped, the reverse proxy regenerated, and production authentication/launch acceptance was rerun successfully. Staging on a shared proxy must strip public domain advertisement variables. Public-host verification used the temporary SSH CONNECT tunnel because direct cross-region transport from this workstation was unreliable; TLS and the public hostname were retained. Owned staging containers and local review services are removed/stopped after verification.

## V8.1 presentation verification — 28 October 2026

Runtime source: `c3e2f5571168cb0b3900e097016126ab464d9155`. [Both CI jobs passed](https://github.com/UTXOPlay/NIGHTSHIFT/actions/runs/40656033430). The native binary SHA-256 remains `1127061eccb05a2a671c03330a16b1c1ad1d37a3a79ebb10ed9a6e9855ae9598`; all three V8 native sources and the browser rules module retain their previous hashes. The release manifest binds 63 browser files, including four licensed vehicle models and five new generated atlases.

Local browser checks passed for all twelve environments, showroom/tuning at every required landscape resolution, six upright grounded vehicle builds, real pointer rotation/reset, purchase shortfalls, upgrade debit and persistence, permanent E/Q hints, thirteen full game acceptance checks, seven combat scenarios and reduced motion. The full acceptance race still completed in 221.67 seconds and its native replay verified. A dedicated projection assertion catches the camera-up inversion; all four tire contacts are checked against the showroom floor for every vehicle.

Final local Chromium samples, with the external vehicle models and final effect pools:

| Scene / viewport | Wall / simulated seconds | Median / p10 FPS | Median CPU draw work |
|---|---|---|---|
| Harbor, 1920×1080 | 30.05 / 30.07 | 60 / 60 | 1.56 ms |
| Neon Ward, 1920×1080 | 30.10 / 30.10 | 60 / 60 | 1.74 ms |
| Neon Ward, 844×390 touch simulation | 20.03 / 20.03 | 60 / 60 | 1.41 ms |

All samples retained render scale 1 and reported no browser errors. These measurements describe the local browser and touch simulation, not physical phone hardware. The high-detail external player bodies use about 14,500–19,000 triangles; the opponent bodies use about 4,400–5,800. Material batching reduced the measured peak game draw-call count to 77 in these samples.

The public route now serves 8.1.0 and all 63 browser file hashes match this release. Five workshop groups, thirteen acceptance checks and seven combat scenarios passed against the deployed service, including signed native replay and rejection by the V7 verifier. The existing Season 8 data directory and exact native binary were retained. The temporary V8.1 staging container and owned local review server were stopped after acceptance; source, database backup and verification evidence remain in the private server release directory.

A final deployed Neon Ward sample at 1920×1080 advanced 30.07 simulation seconds in 30.04 wall seconds: median / p10 60 / 60 FPS, 2.02 ms median CPU draw work, render scale 1, 45–76 draw calls and no browser errors. This was desktop Chromium through the verification tunnel, not a physical phone measurement.

The test machine's direct cross-region downloads stalled over both HTTP/1.1 and HTTP/2; a server-local HTTPS request returned the same 746,082-byte asset successfully in 0.023 seconds. The public browser suites therefore used an SSH CONNECT tunnel to the same public hostname and TLS endpoint. They test the deployed application, but their startup timing does not describe an ordinary player's network. Browser tools accept an optional `DRIFT_PROXY` for reproducing this transport setup and a 90-second navigation allowance for cold network loads. No game, store or global proxy configuration was changed for this workaround.

[Public workshop screenshot](screenshots/workshop-v81.webp) · [Generated asset prompts](nightshift-environment-art.json) · [External model sources and adaptations](vehicle-assets.md).

## V8 production verification — 28 October 2026

Source commit: `9377ff36bdcd8b1b8a5a26d906f768be69ac3607`. The deployed Debian-compatible native binary SHA-256 is `1127061eccb05a2a671c03330a16b1c1ad1d37a3a79ebb10ed9a6e9855ae9598`. Both GitHub Actions jobs passed at [run 40637907926](https://github.com/UTXOPlay/NIGHTSHIFT/actions/runs/40637907926).

The public [NIGHTSHIFT route](https://store.utxoplay.io/games/drift-run/) serves V8. All 50 browser files match the release manifest. A fresh test career purchased an upgrade, submitted normal driving inputs, exported its signed state and verified through the native V8 binary; the V7 verifier rejected it. The application profile matches the release manifest exactly.

All thirteen public browser acceptance checks passed with no browser errors. They cover every required viewport, capped render resolution, inverse pointer mapping, a 221.67-second completed race, earned purchases across reload, the next-event transition, separated mobile results, English icon controls, simultaneous joystick/counter input, the portrait gate and reduced motion.

A separate 30.08-second public-route Chromium run at 1920×1080 advanced 30.10 simulation seconds. It measured 60 median / 60 p10 FPS, 1.52 ms median CPU draw work, render scale 1, 50–99 draw calls and 109,524 peak triangles, with no browser errors. This is a desktop browser measurement; physical Android/iOS hardware was not tested.

Deployment uses a separate V8 data directory. V7 data, image, verifier and compose configuration remain available; the old V7 and temporary staging containers were stopped after public acceptance. The store update was layered over the then-current store image, preserving unrelated catalog entries, services and shared platform data. The private server release directory retains the prior deployment manifest, database backups, source archive, evidence archive and archive hashes. For rollback, restart the retained V7 service and change only the NIGHTSHIFT upstream on the current store; do not overwrite unrelated later store releases or reinterpret V8 exports with V7.

## Preserved V7 release

The extracted game is NIGHTSHIFT 7.0 World Circuit, deployed to UTXOPlay on 2026-10-27. The repository packaging work is dated 2026-10-28.

Its native application profile is `1123347a8d1e2ef1226bd922221dc0727286486890b2b9997c82e22505b6cd97`. The original deployed native binary SHA-256 is `92ba7769c907a82ca8f2fd15940034544e900f39c03909f2ca6883a1773eb7ba`. A rebuild on a different machine can have a different binary hash; the application profile and replay result must agree.

`release-integrity-v7.json` records the hashes of the three native profile-bound source files and 31 audited browser files. `npm run check:release` verifies them after building. Changing packaging or documentation does not change the racing rules. Native V6 and V7 reject each other's signed exports; older careers must stay with their matching verifier and data namespace.

## Recorded deployed-release checks

- 15 JavaScript/host/scheduler tests and two Rust tests, with Clippy warnings denied.
- 38 native/browser tapes, 297,805 active ticks and 1,116 career frames, including successful runs for all twelve events and an earned career that buys all six cars.
- Signed purchases, race rewards, export verification, restart recovery, stale-action rejection and tampered-purchase rejection.
- Thirteen staging and public browser acceptance checks covering 1920×1080, 2560×1080, 2560×1440, 3840×2160, 844×390 and the 390×844 rotation gate. Inverse pointer mapping, capped backing resolution, simultaneous joystick/defense input, separated results, earned purchases and next-stage flow are included.
- Seven local and public combat checks covering collisions, incoming hits, successful defense, outgoing hits, rival disable, fatal rollover and reduced motion. The death tick stays frozen while the car animates and results appear. Each scenario replays through the native host.
- Twelve map previews and thumbnails, six minimap actors, follow/full-course toggling and mobile HUD overlap checks.
- The final 30-second public 1920×1080 Chromium sample measured 60 median FPS / 59 p10, 2.94 ms median CPU draw work, render scale 1 and no browser errors. It advanced 30.03 simulated seconds in 30.03 wall seconds. These are desktop measurements, not a promise of equivalent performance on every device.
- A separate public startup sample measured 12.88 seconds cold and 1.52 seconds warm. Another network-sensitive cold run took 32.17 seconds. Physical Android/iOS hardware was not tested.

Local verification commands and GitHub Actions reproduce the code-level checks. Browser tools create fresh test careers; they do not use production player identities or stored private keys. Large original deployment evidence and runtime data are intentionally not committed.

## Scope

This is a solo game with AI opponents. Live multiplayer requires authoritative match timing, actor admission, ordered inputs, reconciliation, disconnect handling and exactly-once match rewards. Myelin verifies off-chain host replay; the game does not settle races or currency on CKB.
