# Independent pedals — NIGHTSHIFT 12.0.0

V11 accelerated without a pedal and lowered the target speed automatically in bends. V12 starts the player and rivals from rest and separates acceleration, foot braking, handbrake and nitrous. Lifting the accelerator coasts; braking cannot change direction. Reverse first brakes through zero. Releasing nitrous no longer snaps the car back to its ordinary top speed. Six power and brake curves distinguish launches and stops. Engine load follows the pedal. Fractional integer force is retained between 30 Hz steps.

The control baseline follows the separate accelerator, brake/reverse, handbrake and nitrous controls in the [official Hot Pursuit Remastered manual](https://eaassets-a.akamaihd.net/eahelp/manuals/nfs-hp-remastered-switch-en.pdf). This is an arcade handling improvement; the road-relative simulation is still not a free-roaming rigid-body vehicle engine.

Keyboard: W accelerates, S brakes, A/D steer, X handbrakes, Z reverses, Space boosts. Colemak uses S to steer right, R to brake and F to fire. Arrow Up/Down are pedals. Existing custom bindings are carried into a separate V12 preference; existing races keep their original keyboard configuration. Gamepad: RT accelerator, LT brake/reverse, LS steer, B handbrake, A nitrous, X weapon, Y counter. Touch: push the thumb stick up for gas, sideways for steering, down for braking; straight down reverses after stopping. Holding gas through the countdown launches at GO. Practice now observes four real simulation effects.

Rivals have a shorter stationary starting grid and comparable launch limits. A stunned rival coasts down instead of accelerating toward the old fixed stun speed. Obstacle sweeps, counterplay, sector objectives, actual credit debits and the 3–7 minute event requirement remain active.

## Compatibility and evidence

V12 inputs have a mandatory bit-30 version marker, explicit steering, brake and throttle percentages, and a reserved bit. V8–V11 tapes are rejected by V12. The new native application profile binds the new sources and all predecessor source bytes. Five native executors and five data directories remain separate. An active old race stays on its original executor; only an explicit next race verifies and carries its signed career proof into V12. Forged origins and stale client profiles are rejected.

See [machine-readable results](driving-v12-results.json). Final conformance covers 37 race tapes, 545,755 native/browser ticks, all 12 winnable courses, all six cars and a real earned-credit purchase/upgrade career. Native tests cover signed replay, restart, malformed proofs and V8–V11 migration. Browser checks exercise all required display sizes, backing resolution limits, virtual Gamepad API controls, Colemak takeover, disconnect pause, touch gestures and the portrait rotation gate. Physical phone and controller validation is still outstanding.

The V11 loading optimizations and immutable asset hashes remain in place. This release is progress toward the eight-dimension racing goal; career unlocks, route choices, broader environmental variety and long-running/device coverage remain unfinished.

## Migration memory budget

The first isolated server run caught two packaging/runtime issues before cutover: the workstation binary needed newer system libraries, and the inherited 384 MiB cap could not hold old/new signed-session databases during a multi-version migration burst. The release binary is rebuilt and tested on Rust 1.97.1 / Debian Bookworm and must report the identical application profile. The migration host now checks active-file receipts and skips absent intermediate stores; new customers allocate only a V12 store. Native executors retain at most six accounts each. The game container has an explicit 1,536 MiB memory ceiling with swapping disabled, leaving space for all five bounded caches. Staging capacity and migration checks are release gates; production data and prior images remain recoverable.

## Presentation follow-up — 12.0.1

A final review caught a V11-only boot-notice condition that mislabeled a fresh V12 event as a legacy save. The corrected condition and power-upgrade wording ship with fresh browser cache keys. The native profile, all five executables and every saved race remain unchanged. Career `spec_best` still carries historical PBs across rule generations; profile-local ghosts remain separate. A future career schema should preserve legacy PB provenance and separately record current-rule server bests.

## Public acceptance

12.0.1 is live at the canonical Store URL. Real-domain acceptance ran without local asset substitution: desktop/touch controller practice, keyboard takeover, disconnect pause, native replay, actual joystick gestures, portrait pause and shared fullscreen entry/exit/reentry all passed. The iframe and navigation count confirm that fullscreen reentry preserves the same game instance. All 169 container-served files and host fingerprints match the release manifest; all five native binaries remain identical across the presentation patch. Other games, secrets, mounts and security settings are preserved.

One 1920×1080 Auto run measured 60 median FPS, 59 p10 FPS, 6.14 ms median CPU and 12.27 ms median GPU, with 20.23 seconds of simulation in 20.23 seconds wall time. First menu readiness was 31.4 seconds in that sample. This is a single unthrottled desktop observation, not a universal frame-rate or loading guarantee; first-load latency and physical device coverage remain open work.
