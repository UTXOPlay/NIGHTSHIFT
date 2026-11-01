# Vehicle identity — 15.0.1

The pursuit renderer previously created an extra solid car once heat exceeded 35%. Its lateral offset was computed from the player's lane, its longitudinal gap from heat, and its animation speed copied the player. It had no native actor, collision body or attack identity. This created an unshakable tailing car that could be confused with a rival or ghost.

The extra car and its beacon/material construction are removed. Visible solid racers map to signed rival IDs; visible traffic maps to signed traffic bodies with unique IDs. Real rivals still race, follow, pass and attack according to the unchanged V15 rules. Pursuit remains the existing heat mechanic and roadblock event.

The translucent personal-best reference remains exclusive to stock time attack. Its existing HUD now says `PB GHOST` when a local reference is available. A normal career event never renders it. The reference is non-colliding and does not participate in rewards.

This is a presentation release: the exact V15 profile, all 54 bound native inputs, all eight published executable hashes, eleven host inputs and persistent data namespaces remain unchanged. Existing races use the same rules and continue after reloading. No new asset downloads or gameplay buttons are added.

Acceptance covers ordinary keyboard driving into the previously triggering heat range, native replay, unique traffic/rival identities, and mobile time attack using a completed stock-event reference independently checked against the native simulator. Seeding a device-local reference is an isolated UI fixture; player game states are never injected. Physical-device testing remains outstanding.

Deployed at [UTXOPlay](https://store.utxoplay.io/games/nightshift/). Public checks pass both rendered scenarios, signed replay, exact changed-file hashes and mobile fullscreen exit/re-entry without replacing the game instance. A production canary retains its complete pre-release state, purchased career, session and proof, then continues with exact browser/native input results. Both production containers are healthy with zero restarts. See [acceptance evidence](vehicle-identity-v1501-results.json).
