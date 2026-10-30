# NIGHTSHIFT 11 — driving, events and visual review

The exact V11 application profile adds integer analogue steering and braking, lateral grip and measurable slip, clean-corner rewards, four-sector solo drift objectives, and a fixed-stock personal time attack. Keyboard, Colemak/custom layouts, pointer steering, touch and standard controllers feed the same native/browser tape. Upgrades keep their existing costs; stock time attack ignores installed upgrades. A personal device-local ghost replays a verified input tape independently and cannot collide, award rewards or claim a public leaderboard position.

Active V8, V9 and V10 races remain on their original executors. Starting a new race explicitly verifies and carries the original career into V11; recursive original proofs remain attached. Myelin is off-chain host replay, not CKB settlement.

## Visual audit and references

The rejected artwork combined a shiny vehicle with a photographic garage and weak ground contact. Close-ups also exposed lost texture detail and unreliable imported wheel geometry. The replacement uses the actual game renderer and shipped scene for the storefront cover, cards and hero. The garage uses a continuous rendered floor, consistent lighting and ground contact. The main car preserves the authored Khronos Car Concept shape, original wheels, paint textures, normal maps and tinted glass in a roughly 62,000-triangle presentation model. Detailed geometry has a bounded simpler counterpart for lower quality and distance.

Rendering references: [Three.js car materials](https://threejs.org/examples/webgl_materials_car.html) and [Forza's official photography guide](https://forza.net/news/forza-photo-guide). We use their principles of distinct PBR surfaces, coherent light, framing and exposure. Their vehicle assets and screenshots are not included.

Six handling builds use five source bodies. The two track coupes share a body and have different native handling profiles and finishes. Credits for the Khronos Car Concept and four additional source bodies ship inside the game. Several imported candidates, including incomplete wheel meshes and an explicitly game-ripped Audi asset, failed review and are excluded. This release does not claim AAA asset parity.

Audio adds a second licensed ICE recording, an EV motor voice, authored synth music by Bogart VGM, and independent music/effects controls. Recording variations are not advertised as separate original recordings. Pause, mute and orientation blocking fade actual buses.

## Verification

Native/browser conformance covers all twelve events and mixed analogue tapes. Signed race replay, restart recovery, earned purchases, V8/V9/V10 migration, stale-client rejection and the stock personal ghost are verified separately. Browser review checks six required viewport sizes, inverse input mapping, resolution bounds, touch rotation gating, reduced motion, keyboard layouts, virtual standard controller arming/disconnection and actual WebAudio decoding/output. Performance figures describe the tested desktop browser; touch emulation does not establish physical-phone performance.
