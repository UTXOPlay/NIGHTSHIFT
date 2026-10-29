# NIGHTSHIFT 10 — Readable roadblocks and physical recovery

Roadblocks previously appeared after a timer, with only a late opening marker. Their fixed placement could be hard to read around a bend. Rivals could cross the same intact barrier that stopped the player, and touch reverse disengaged as soon as the stick moved sideways. This release addresses the encounter, collision, guidance and recovery together.

## Encounter design

- A physical closure is committed at least 300 m ahead of the leading active actor. Its course position stays fixed through braking, reversing and player rebasing. Subsequent closures are spaced at least 1.1 km apart; failed placement searches postpone a closure instead of forcing it into a bad bend.
- Placement checks 160 m of approach curvature and sampled elevation. Sharp approaches and sampled hill crests are rejected. These are conservative integer course checks, not a claim that every camera view is unoccluded. Distance, lane and minimap warnings remain available around a bend.
- The opening alternates rather than repeatedly forcing the same side. Every third closure blocks one lane, leaving a breather between two-lane closures. Collision-safe gaps account for the player's full static-contact envelope. The final 100 m is kept clear of newly planned closures.
- New traffic spawns are suppressed near a closure. Power-up and boost-strip spawns are suppressed around its approach so a reward cue does not invite acceleration directly into the barrier. Existing traffic steers toward an actual open lane and brakes when necessary.

## Fair contact and escape

Rivals plan around barriers from up to 280 m away and brake according to distance. Rivals and traffic also use the same swept static-contact envelope and impulse kernel as the player. Contact still resolves during recovery/cooldown; damage protection cannot make a vehicle pass through concrete. A second bounded pass handles a player shunting an actor toward the barrier. Barrier rows remain physical until trailing active rivals clear them, rather than disappearing solely because the player has passed.

This change shares static-roadblock consequences. It does not claim that every AI-versus-moving-car interaction now has a complete rigid-body solver. Collision armor, energy integrity, racer recovery and terminal player wrecks retain their existing roles.

Touch reverse now latches after a straight-down pull near a stop. Keep pulling down while steering to back toward the selected opening. Releasing the stick, pausing, losing focus or entering the portrait gate clears the latch. The touch steering target is reversed in vehicle coordinates while backing up, so chase-view left/right remains direct. Keyboard reverse and Colemak/custom bindings remain available.

## Guidance and presentation

A transparent three-lane pictogram identifies blocked lanes and the opening, with distance and time to arrival. It changes to braking, queued-gap or reverse guidance when the actual state calls for it. It is artwork inside the game scene, not an opaque panel or a new button. The minimap marks the exact closure. Three escalating audio cues are bounded per encounter and follow the existing sound preference.

Road chevrons guide the approach toward the opening. Near a blocked stop they mark only the opening, avoiding a false path through the barrier. An occupied gap uses amber instead of an unconditional green safety cue. Chevrons remain one instanced draw with twelve bounded instances; the endpoint stays within the modeled road's near view. Barrier meshes gain feet, reflective stripes, a top reflector and elevated amber lamps without adding dynamic lights or raster downloads. Reduced-motion presentation has no new flashing or camera interruption.

## Save and replay contract

These are **new gameplay rules**, so V10 has its own native executor, exact application profile and data directory. Frozen V9, V8 and V7 source bindings remain checked. The new program binds eighteen native inputs, including the original V9/V8 verifier sources and course data.

An unfinished V9/V8 event continues through its original executor. Starting a new event explicitly replaces that run: the old signed career export is verified as a bound origin, earned credits/owned cars/upgrades/medals carry forward, and the new event uses V10. No old signed session is reinterpreted. The production upgrade retains the existing data mounts and adds a separate V10 volume. The setting and Relay Credits remain off-chain; Myelin supplies host replay, not CKB settlement.

## Verification

The local/portable conformance matrix covers 39 tapes, 445,490 active ticks and a 1,105-frame earned career, including successful ordinary-input runs on all twelve maps. It compares complete native/browser states, rather than just finish flags. Native tests cover physical contacts and verified V9 origins, including an origin already carried from V8. Signed replay checks cover restart, stale inputs, tampered purchases, earned purchases and cross-profile rejection.

The actual browser recovery review uses ordinary API input tapes, trusted touch events and keyboard input without editing game state. Both desktop Colemak and touch tests see the closure about 300 m ahead, stop 5.9 m before it, reverse/steer around it and continue beyond it with unchanged armor. Their native replays verify. The touch run rotates while reverse is held and checks that play pauses and the latch clears. Full application acceptance also covers all six required display sizes, inverse input, bounded backing resolution, purchases, a 229.6-second signed win and reduced motion. These automated runs are not human usability trials or physical-phone thermal tests.

Final staged/public results and release identity are recorded in [roadblocks-results.json](roadblocks-results.json) and [release verification](verification.md).

## References

The [official NFS Heat manual](https://www.ea.com/able/resources/need-for-speed/need-for-speed-heat/pc/text-manual) connects pursuit awareness with the map/minimap and describes pinning, dodging and maneuvering out of a chase. The [official Payback pursuit article](https://www.ea.com/ea-studios/motive/news/nfs-payback-high-stakes-cops) frames roadblocks as rerouting and slowing tools. Our early lane cue, physical gap, spacing and recovery design are an implementation choice informed by those principles, rather than a claim to reproduce EA's internal algorithms. No EA code or artwork is included.
