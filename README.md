# NIGHTSHIFT — World Circuit

A browser racing game from UTXOPlay: twelve distinct roads, six cars, five rival drivers, vehicle upgrades and a signed solo career.

[Play on UTXOPlay](https://store.utxoplay.io/games/nightshift/) · [Game design](docs/nightshift-world-circuit.md) · [Verification and versioning](docs/verification.md) · [Roadblocks and recovery V10](docs/nightshift-v10.md) · [District structure 9.6](docs/nightshift-v96.md) · [Materials and lighting 9.5](docs/nightshift-v95.md) · [Career and garage 9.4](docs/nightshift-v94.md) · [Districts and continuous scenery 9.3](docs/nightshift-v93.md) · [Engine and interface 9.2](docs/nightshift-v92.md) · [Motion presentation 9.1](docs/nightshift-v91.md) · [Circuit handling V9](docs/nightshift-v9.md) · [Combat Season 8](docs/nightshift-v8.md) · [V7 audit](docs/combat-design-audit.md)

Current product status: **playable solo arcade racer under active completion**. See the [single-player completion contract](docs/single-player-completion.md) for the full scope, implemented mechanics, evidence and remaining work. Multiplayer implementation is outside this delivery goal.

![NIGHTSHIFT roadblock approach](docs/screenshots/roadblock-approach-v10.webp)

## Race the circuit

- Twelve environments, from Nervos Harbour and Glacier Pass to the Reactor Loop and Dawn Skyway, each with its own course, scenery, preview thumbnail and HUD minimap.
- Sprint podiums, pursuit escape, drift challenges and interception contracts. Successful races last 3–7 active minutes.
- Three campaign chapters, reputation-based car/part licenses, first-clear and chapter rewards. Six cars with permanent purchased parts and free six-point build allocation.
- Persistent opponents, slipstreaming, nitrous, lock-on EMP, shockwave, rear mines and a timed defensive jammer.
- Generated transparent markers and effects for collisions, attacks, shields, counters, disabled rivals and fatal rollovers.
- Keyboard, pointer drag and mobile thumb-stick controls. Landscape play, safe-area controls, reduced motion, bounded rendering resolution and layouts through 3840×2160.

Version 14 gives rivals the shared pedal/steering model, continuous passing lines, hazard braking and resource-funded nitrous. Forward EMP requires a clear path, and interception couriers stage at fixed relay gates before launching. The V14 browser resumes V8–V13 races with their exact original profiles; starting another event explicitly migrates the verified career. A two-worker native pool bounds historical executor residency. See [V14 integration and evidence](docs/nightshift-v14.md).

The public version is [14.2.0](https://github.com/UTXOPlay/NIGHTSHIFT/tree/v14.2.0). It renders the complete 32-car authoritative traffic budget with stable actor identities, and adds distance-driven wheel motion and brake response to coarse traffic/rivals, pursuit and ghosts. Five coarse bodies retain their original triangles and texture streams, adding only 16,052 bytes of tire-pivot data. V14 rules, the seven native executables and signed saves are unchanged. See [fleet changes](docs/fleet-v142.md) and [release evidence and limits](docs/fleet-v142-results.json).

A complete local stock event passes at 60 median / 60 p10 FPS in 282.67 simulation seconds. The instrumented public 120-second repeat also reaches 60 / 60 FPS at scale 1; an earlier 20 / 6 FPS failure remains retained alongside the observed background load. Latest public first-driving samples still take 31.57 seconds on desktop and 51.55 seconds under restricted-mobile emulation, including countdown and the configured HTTPS proxy. These are individual samples, not worldwide or physical-device guarantees. Loading, broader performance and the complete single-player objective remain open. The retained [14.1.1 engine evidence](docs/engine-v1411-results.json) covers the earlier quality-recovery and HDR warmup fixes.

Version 13 adds chapter licenses, optional sector contracts, a closing interception battle with podium requirement, final drift exits, itemized payouts, PB provenance and purchased-part/build tradeoffs. Existing V8–V12 races and signed proofs retain their original executors.

Version 13.1 defers the 3D engine until the garage or a race is opened, uses actual course and fleet captures, adds varied facade and lighting assets, retains the hero car's authored materials, and prepares compressed lighting probes offline. See [presentation evidence and remaining limitations](docs/presentation-v13.1.md). Native rules and signed saves are unchanged.

Version 10 adds fixed, readable roadblock encounters, shared static contacts for traffic/rivals, lane/minimap guidance and latched touch reverse. Unfinished V9/V8 events keep their original executor until finished or explicitly replaced; verified careers carry forward into new V10 events.

Version 9 introduced continuous winding roads, elevation and banking, swept contacts, mass-weighted impulses, braking/reverse and Colemak/custom controls. Verified V8 careers carry forward as a signed origin. An unfinished V8 event retains its original executor until finished or explicitly replaced.

This release is a **solo racing career**. Live multiplayer is future work. The fictional Nervos relay setting and Relay Credits are off-chain game content; Myelin provides deterministic host replay, not CKB settlement.

## Run locally

Use Node.js 22 or later and Rust. The native RocksDB dependencies require Clang/libclang, pkg-config and protoc. On Debian/Ubuntu:

```sh
sudo apt-get install clang libclang-dev pkg-config protobuf-compiler
npm ci
npm run build:native
npm run build:native:history
npm run dev
```

Open **http://127.0.0.1:8898/games/nightshift/**. `npm run dev` builds the browser and creates a local development token in ignored `data/development-token`. Keep this file and the data directory between restarts if you want to retain your local career. The current native service listens only on loopback port 8800. Historical executors start lazily when an unfinished saved event needs them.

For a production process, build once and supply a stable server-only token:

```sh
npm run build
export RUNTIME_TOKEN="$(openssl rand -hex 32)"
export GAME_ORIGIN="http://127.0.0.1:8898"
npm start
```

Persist the token in your deployment's secret storage and reuse it across restarts. Keep native ports private. `WEB_PORT`, `RUNTIME_PORT`, `BIND`, `DATA_DIR`, `RUNTIME_BINARY` and `RUNTIME_URL` can be configured through the environment. `RUNTIME_URL` uses an already-running private native service.

## Controls

| Action | QWERTY | Colemak / DH | Touch |
| --- | --- | --- | --- |
| Steer | A / D | A / S | Thumb stick |
| Accelerate | W / Arrow Up | W / Arrow Up | Push stick up |
| Foot brake | S / Arrow Down | R / Arrow Down | Pull stick down |
| Handbrake | X | X | Handbrake icon |
| Reverse | Z | Z | Pull straight down after stopping |
| Nitrous | Space | Space | Lightning icon |
| Equipped weapon | E | F | Weapon icon |
| Defensive jammer | Q | Q | Shield icon |
| Pause | P / Escape | P / Escape | Pause icon |

The keyboard icon selects a preset or rebinds every action. HUD labels follow the saved bindings. All four arrow keys remain driving fallbacks. Standard gamepads use LS to steer, RT to accelerate, LT to brake/reverse, B for handbrake, A for nitrous, X for the weapon and Y for the jammer. Layout detection is used where the browser supports it; the manual preset works everywhere.

![Mobile map selection](docs/screenshots/mobile.png)

## Verify

```sh
npm test
npm run build
npm run check:release
npm run test:native
npm run test:conformance
npm run build:native:legacy
npm run test:replay
```

`test:conformance` compares JavaScript and Rust across all twelve tracks and a career that earns and buys all six cars. `test:replay` checks signed rewards, purchases, restart recovery and rejection by the retained V12 verifier. It requires both V14 and V13 native binaries. V8–V13 predecessor sources remain frozen for original-rule replay and career carry.

Browser checks use a separate local review server and a fresh data directory:

```sh
npx playwright install chromium
node tools/nightshift13-server.mjs
# In another terminal, while the review server is running:
npm run test:browser
npm run test:maps
npm run test:combat
npm run test:performance
node tools/nightshift13-connection-review.mjs
```

The review server runs at `http://127.0.0.1:18940`; reports go under ignored `artifacts/`. The purchase acceptance test expects a new career, so use a fresh review data directory when repeating it. `DRIFT_ORIGIN`, `DRIFT_OUT`, `DRIFT_BIN` and `DRIFT_BUILD_ROOT` override test locations. Presentation acceptance also supports `DRIFT_TIMEOUT` in milliseconds for slow private preview transports; this changes functional-test waiting only, not loading measurements or acceptance assertions. Public UTXOPlay review is opt-in with `DRIFT_AUTH=1`; it uses a fresh unfunded QA wallet in memory and sends no transaction.

GitHub Actions runs browser-source checks, native tests, conformance and signed replay. Physical Android/iOS testing is separate from the included Chromium touch emulation.

## Docker

```sh
export RUNTIME_TOKEN="$(openssl rand -hex 32)"
export GAME_ORIGIN="http://localhost:8898"
docker compose -f deploy/compose.yml up --build -d
```

The Compose service binds the web port to local loopback and persists V8–V13 state in separate named volumes. Put your HTTPS reverse proxy in front of it and set `GAME_ORIGIN` to the public origin. UTXOPlay gateways authenticate through `X-Runtime-Token` and `X-UTXOPlay-Account`; browser guests have separate identities. The canonical public game path is `/games/nightshift/`.

## Source and artwork

The current release was extracted from the shared [UTXOPlay/myelin-arcade](https://github.com/UTXOPlay/myelin-arcade) workspace. Native profile-bound files and the 31 audited browser release files are preserved; portable tooling and standalone packaging were added here. Future rule changes must use a new application profile and must not reinterpret old signed careers.

- `games/nightshift-v14/native/`: current deterministic Rust simulation and Myelin sessions.
- `games/nightshift-v8/native/` through `games/nightshift-v13/native/`: frozen predecessor replay and origin adapters.
- `games/nightshift-v9/web/`: browser application and mobile orientation gate.
- `games/arcade/web/nightshift9-*`: renderer, mirrored rules, controls and audio.
- `games/arcade/web/art/nightshift/`: generated artwork and actual map thumbnails.
- `host/`: authenticated standalone host and UTXOPlay gateway integration.
- `games/nightshift-v8/native/`: retained V8 verifier and career origin adapter. V7 and V6 sources are also preserved.

Built-in imagegen prompt records: [combat/UI](docs/nightshift-combat-art.json), [world textures and scenery](docs/nightshift-world-art.json), [career art](docs/nightshift-crew-art.json), [relay materials](docs/nightshift-relay-art.json), and [original city assets](docs/nightshift-art.json). Source PNG names are provenance references; all runtime assets are checked in as WebP. Generated renderer bundles, build artifacts, private keys, runtime databases and local credentials are excluded.

![Rollover and generated effects](docs/screenshots/combat.png)

MIT-licensed source; see [LICENSE](LICENSE) and [NOTICE](NOTICE.md) for retained attribution. Racing research and GitHub references are linked in the [career design](docs/nightshift-crew-circuit.md).
