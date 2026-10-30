# NIGHTSHIFT 9.6.1 — predictive follow camera

This is a camera-only presentation update based on the shipping 9.6 source.
Unfinished V10 handling work in the shared checkout is excluded from the release.
The racing rules, V9 application profile, native binaries and career data remain
unchanged. The tested camera source is also retained in the working checkout.

The chase view follows a point on the actual road behind the car. It samples
near and farther road positions to anticipate bends, smooths its eye and aim
independently, and bounds lateral anticipation to keep the car readable. Height
increases gently with speed; a bounded crest check lifts the eye when terrain
would obscure the approaching road. The horizon stays upright through road
banking and vehicle body roll.

Speed and boost affect an independent filtered FOV state, avoiding the old
recursive blend during menu transitions. The narrower FOV range and modest
camera distance change reduce boost pumping. Repeated scrapes no longer restart
an oscillating shake; directional impact movement settles with critical damping.
New races and large restored-position jumps clear old spring velocity.

Garage, course selection and race transitions retain their existing viewpoints
with a smooth blend. Reduced motion uses fixed FOV 59, removes impact kicks and
view-transition animation, and retains the road following needed for visibility.
No postprocessing pass, draw object or control panel is added.

Validation includes 93 Node/host tests, seven dedicated camera checks, all twelve
courses, 30/60/120 Hz responses, switching bends, boost and impact recovery,
all six required screen sizes and exact inverse pointer mapping. Four rendered
course fixtures plus six actual resize/backing/input cases pass without browser
errors. Synthetic fixtures are presentation evidence; native signed driving is
checked separately on the isolated release candidate and public deployment.

Only the motion module, its renderer bundle, entry bundle and preload cache key
change among the 105 release-manifest browser files. Native profile:
e9b142142792975f9e44ce5cd196d6593d0099eb13280787967816e59b7a1def.
Myelin supplies off-chain host replay, without CKB settlement.

## Production verification

Published 2026-10-30 at https://store.utxoplay.io/games/nightshift/.
Candidate and public checks each recorded 64 ordinary-driving samples, all six
resize/input cases, reduced-motion resume, touch-emulated landscape input and
portrait pause. Both native signed replays verified with the unchanged profile,
without browser exceptions. All 105 public browser files match the isolated
release manifest exactly. This is Chromium/touch-emulation evidence, rather
than physical-phone or comparative FPS measurements.

Game image: `sha256:a682aba99cf5950cdcc08273d50110a027f2d5686ce2a5fbab8dc632ca4bd5db`.
Store image: `sha256:c3afa8564b515dae7b92ce2cfe54d21689dc1c6cd4d9a6fa3ca7ebb0ccb23535`.
Both V9 and legacy V8 native binaries retain their previous SHA-256 values.
Environment, data mounts, network membership, health checks, security/resource
settings and unrelated Store catalog entries were compared and preserved.
Nginx configuration passed and received a graceful reload. Both live services
are healthy; this release's staging containers and isolated data were removed.

Evidence: [camera-9.6.1](camera-9.6.1/). Operator snapshots remain at
`/data/utxoplay/releases/20261030-nightshift-camera-9.6.1/`.
The stopped `myelin-nightshift-v8-before-nightshift-9-6-1` and
`utxoplay-store-before-nightshift-9-6-1` containers are retained for rollback.
Rollback must reuse current data and preserve subsequent unrelated Store
deployments. No live RocksDB file copy is presented as a consistent backup.
