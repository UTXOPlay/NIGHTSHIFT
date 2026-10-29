# Release verification

The active release is [NIGHTSHIFT 9.3.0 — Districts and continuous scenery](nightshift-v93.md). The exact V9 native profile remains `e9b142142792975f9e44ce5cd196d6593d0099eb13280787967816e59b7a1def`. `release-integrity.json` binds twelve native inputs and 92 browser files. Frozen V8/V7 source, executable hashes, career rules and save namespaces are preserved.

The canonical route is [`/games/nightshift/`](https://store.utxoplay.io/games/nightshift/). Catalog/account identity remains `drift-run`. `/play` and the old game slug retain their permanent redirects.

## 9.3 verification — 29 October 2026

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
