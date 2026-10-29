# NIGHTSHIFT driving feedback — 10.0.1

Presentation release for the user request to improve driving satisfaction. Rebased onto the exact live 10.0.0 source/build snapshot after the concurrent roadblock release. Preserves its roadblock behaviour, all native programs, profile routing and legacy replay. Includes the approved chase-camera improvements. The earlier 9.6.2 staging candidate was never deployed.

- Replaced the shared synthetic driving bed with credited, edited engine, tyre and impact recordings (355,066 bytes total). Six vehicle mix profiles alter filtering, pitch and gain; they are not six independently recorded engines. The electric vehicle has an additional quiet motor layer.
- Engine load follows completed native ticks; repeated render frames cannot invent acceleration or gear changes. Wind follows actual speed and drafting. Boost pressure has an attack/release envelope; close passes have directional audio; drift release and impacts have separate material sounds.
- Boost no longer triggers a pickup ping or pickup visual. Charge pips briefly brighten only when actual charge crosses a usable tier. Muting fades the master bus; pausing fades the driving bed and current race sounds. Finish cues can complete.
- Tightened smoke/spray emission, size and lifetime around rear tyre contact anchors. Boost exhaust uses existing art with a short thrust envelope and speed-dependent length. Existing 48-smoke, 2-exhaust and 256-ribbon pools remain bounded. Reduced motion suppresses transient driving visuals.
- Audio unlock happens synchronously on start/resume gestures, before network awaits. Recording fetch/decode failures are retryable; one-shot sounds have a 12-voice limit. Credits are accessible in the game settings.

Validation: 107 Node/host tests passed, including six new rule-observation and VFX tests; seven existing chase-camera tests retained. Actual Chromium WebAudio decoded all three recordings, measured nonzero cruise output and zero paused output, verified mute and stressed the one-shot pool. Synthetic rendering checked four courses, boost/drift art, six required sizes, inverse pointer mapping, the backing-resolution cap and reduced motion. Ordinary keyboard driving, touch-emulated orientation handling and exact native signed replay were checked separately on the staged release. These are browser/emulation checks, not a physical-device benchmark or a listening-panel study.

Native source hashes, V8/V9/V10 binaries and V10 profile `0b9501d47ecdec91a485f5dfc7dcca5fc391128cee449f72fc06c782ba292561` are unchanged. No race physics, car performance, charge awards, career rules or on-chain settlement were added.

Release directory: `/data/utxoplay/releases/20261030-nightshift-feel-10.0.1/`. Immutable build-source archive: `source.tgz` (hash appended after upload). Browser manifest and test evidence are in `docs/feel-10.0.1/`. Production cutover/verification details are appended after completion.
