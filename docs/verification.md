# Release verification

The active release is [NIGHTSHIFT 8.1 — Street Racing](nightshift-v8.md). This presentation and workshop update preserves the Season 8 rules, native binary and career directory. Its application profile is `dc78757f7fd0b708a46d9549e6843986a668a334ad10f65a5ee7a43934b4ee53`. The current source and browser hashes are in `release-integrity.json`; the preserved V7 manifest is `release-integrity-v7.json`.

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
