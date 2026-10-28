# NIGHTSHIFT — research and implementation

NIGHTSHIFT replaces Coast Club's presentation and driving rules as a separate versioned project, `myelin-nightshift`. The public game handle remains `drift-run` to keep existing links and store records valid. The game name, native application identity, source directory, save namespace, art, HUD and event structure change together.

## Need for Speed research

Reviewed official material on 2026-10-27; no EA game assets, music, logos or vehicle trademarks are copied.

| Primary source | Design lesson | NIGHTSHIFT implementation |
| --- | --- | --- |
| [Unbound features](https://www.ea.com/games/need-for-speed/need-for-speed-unbound/features) | Driving actions, audiovisual expression and burst nitrous reinforce one another. | Drift, drafting and close passes fill a three-tier charge meter. Boost has a distinct speed, camera, exhaust and engine response. |
| [Unbound Vol. 7: Drift & Drag](https://www.ea.com/games/need-for-speed/need-for-speed-unbound/news/vol7-drift-and-drag-update), May 21, 2024 | A distinct handling model and different event goals give driving skills room to develop. | Continuous steering, momentum, countersteer and brake steering replace discrete lane targets. Three event contracts reward different skills. |
| [Heat official overview](https://www.ea.com/games/need-for-speed/need-for-speed-heat) | Pressure and risk/reward give night driving a purpose. | Heat Run has an escalating pursuit meter, warned roadblocks and a visible pursuer. High speed, nitrous and close passes help escape. |
| [Hot Pursuit Remastered official manual](https://eaassets-a.akamaihd.net/eahelp/manuals/nfs-hp-remastered-xbox-one-en.pdf), nitrous and HUD sections | Dangerous driving can replenish nitrous; event information, condition and equipment need clear visual priority. | Recharge actions are explicit. Timer, route, condition, style multiplier and equipment stay in the scene without covering the player's car. |
| [The Run official PC manual](https://eaassets-a.akamaihd.net/eahelp/manuals/need-for-speed-the-run-manuals_PC.pdf), driver abilities | The route and skill actions can provide an ongoing cadence. | Docklands, Old Quarter and the Underpass lead to checkpoints, time rewards, and an actual finish. |

The original implementation also retains the camera-feedback and road-depth lessons documented for [pmndrs/racing-game](https://github.com/pmndrs/racing-game) and [javascript-racer](https://github.com/jakesgordon/javascript-racer). NIGHTSHIFT remains a compact browser arcade racer; it does not claim NFS physics parity or an open-world campaign.

## Art and performance

The previous block-shaped imported vehicles are replaced with original curved mesh bodies, detailed wheels, glass, mirrors, exhausts, splitters, wings and emissive lamps. Four paints/handling identities are Vanta RS, Kite RX, Atlas GT and Vela R. Paint uses clearcoat and a cached environment reflection. Wheel rotation, chassis yaw, roll and camera lag are cosmetic; collision uses the signed lateral coordinate.

The original generated material atlas supplies asphalt, concrete, office windows and corrugated steel. The separate skyline supplies distant clouds and port depth. Full prompts, source paths and output paths are in [nightshift-art.json](nightshift-art.json). PNG-to-WebP conversion changes encoding only. The two files total approximately 888 KiB. Atlas tiles are sampled in the material shader, with mipmaps and capped anisotropy; no remote runtime asset dependency is added.

Buildings, road segments, guardrails, lamps, containers and tunnel pieces are instanced. Car prototypes and paint maps are shared. The environment map is prepared once. Street-light reflections are inexpensive pooled additive geometry, not live mirror renders. Rain, tyre smoke, sparks and exhaust flames use bounded pools. No full-screen bloom, motion blur, screen-space reflections, realtime shadow maps or texture downloads occur during driving. The WebGL backing buffer remains capped at 3,686,400 pixels. Low power hides road glows and reduces rain; reduced motion removes weather particles, boost FOV, roll, shake, flames and police-light alternation.

## Driving and event contracts

Simulation runs at 30 Hz using integers. Hold A/D or arrows to steer; S/Down plus steering initiates a drift when fast enough. Dragging uses the inverse of the rendering camera, relative to the car's position at pointer-down. Space spends a nitro bottle first, otherwise the current whole charge tiers. Holding Space cannot repeatedly consume charge. Brake reduces speed; scraping a road edge slows the car and breaks its style chain.

- **Midnight Sprint:** finish 1.8 km before time expires. Checkpoints add ten seconds and charge.
- **Heat Run:** finish 2.4 km without losing the car or reaching maximum pursuit pressure. Roadblocks announce the safe lane before arrival. The displayed pursuer visualizes pressure; the signed pressure and barrier rules determine the outcome.
- **Style Session:** finish 1.8 km with at least 1,500 style points. Chained drifts and close passes build multipliers.

Each event has separate device bests and a derived bronze/silver/gold completion rating. Five existing road power-ups remain: shield, magnet, nitro, repair and double score. All cars and events are available without a purchase.

Vehicle and event choices are signed genesis-only actions. The native profile binds the new input/state schema, Rust game/session sources and Cargo.lock. Coast Club v2 and the original arcade use their original binaries and save directories; exports cannot cross profile boundaries. Myelin is off-chain host replay, not CKB settlement.

## Building and validation

`node tools/build-nightshift.mjs` creates the isolated browser package at `artifacts/nightshift/site`. The main web builder also honors the Drift entry's `sourceRoot`/`buildId`. `host/nightshift.mjs` and `games/nightshift/host.json` support a standalone local service; the parent store's `hostEntry` points there. The combined host uses a private Nightshift child on port 8799, while the dedicated host uses 8798, so both development entry points can coexist. The standalone Dockerfile builds and includes the new executable. Build the native executable with `cargo build --release --locked --manifest-path games/nightshift/native/Cargo.toml --target-dir target`.

Tests include 96 native/browser tapes / 345,600 ticks across all four cars and all three modes, with all power-ups, drift, drafting, roadblocks and wins covered from genesis. Native tests, signed export/recovery tests, browser viewport/input tests, and full-event browser drives are recorded under `artifacts/nightshift`. Browser mobile checks are emulation, not physical device thermal testing.

The first broad workspace test run also encountered five failures in concurrently modified `tests/starfall.test.mjs`, whose expected hull/boss values differ from that game's current rules. NIGHTSHIFT does not modify those files or deploy that runtime. Its scoped tests and the shared host tests passed; this broad-suite limitation is retained in the logs.

## Final performance and test evidence

Full Sprint (1.8 km) and Heat Run (2.4 km) were driven with actual browser keyboard input. Both finished and their signed replays verified. On the local hardware Chromium/OpenGL test, 1080p Sprint/Heat samples had a median and 10th-percentile reported FPS of 60, with at most 80/89 draw calls. A separate 3840×2160 Sprint also finished: 30 approximately one-second samples, median/p10 60 FPS, at most 81 draw calls / 46,416 triangles, backing buffer bounded to 3,686,400 pixels. This is one machine's browser evidence, not a promise of 60 FPS on every phone or GPU. No measurable regression is inferred beyond these measurements.

Two earlier 4K runs that synchronously exported ~8 MB screenshots at checkpoints hit the controller's two-second pending-input safety pause. The separate uninterrupted 4K run passed; its 38 action requests had 4 ms median / 46 ms maximum response latency. Screenshot capture and uninterrupted FPS sampling are kept separate in the final evidence. The connection guard remains enabled.

The six-size staged browser acceptance passed 14 checks with zero page errors. The parent store suite passed all 77 tests after updating its expected dedicated Nightshift port to 8898. Nightshift plus shared host tests passed 7/7, native tests 10/10, and the final conformance/signed replay runs passed. Source changes in other arcade games remain outside this release.

The public release also passed all 14 browser checks and a complete Heat Run (2.4 km, 1,552 ticks, 44 samples, median/p10 60/60 FPS, maximum 86 draw calls), with native replay verification and five matching online resource hashes.
