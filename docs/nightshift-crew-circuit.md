# NIGHTSHIFT 6.0 — Crew Circuit

The previous release had a long route but little competition: opponents were short-lived traffic objects and EMP removed nearby objects immediately. Crew Circuit adds a complete solo career loop: choose a contract, choose a car and weapon, race five persistent opponents, earn credits and reputation, improve the car, then take the next contract. Twelve events retain the 3–7 minute successful-run constraint and four changing Nervos City districts.

## Race design

Five named rivals have stable IDs, independent distance/speed, finishing times, lane targets, defensive states and cooldowns. They evaluate traffic, nearby racers, the inside line and the player's position at staggered decision intervals. Rook favors defensive positioning; faster crews have different speed and boost cadences. Racers overtake and slow for hazards. Their positions never reset to keep them near the player. Street, Pro and Elite raise the field's pace and reward multiplier. Sprint contracts require a top-three finish; pursuit, drift and intercept emphasize different skills.

Signed corner curvature produces outward slip at speed. Grip upgrades reduce it. Drift chains, close passes and slipstreaming refill nitrous, so moving through the field matters. Low-relative-speed racer contact scrubs speed and separates the cars; high-speed contacts and traffic collisions consume shields. A hard unshielded collision remains fatal, including during nitro. A weapon hit briefly disrupts a racer, while a disable costs seven seconds of pace. Neither removes the rival from the event.

Three selectable weapons have distinct positioning requirements:

- Lock EMP: keep a forward rival aligned for 0.6 seconds, then fire. Two unblocked hits disable it. A visible rival defense can absorb a shot.
- Shockwave: no lock, but a short 36 m radius. It can hit several close opponents.
- Rear mine: a physical, visible trap at the drop location, consumed by one rival crossing it.

Rival attacks show a red lane for 1.4 seconds. Moving clear avoids the attack; a timed jammer also disrupts the attacker. Successful defense awards nitrous charge. Weapons have ammunition, cooldowns and slow recharge. Relay checkpoints replenish equipment. The player must decide whether to preserve racing pace, hold a targeting line, brake to re-engage, or defend.

## Career economy

Relay Credits are fictional earned currency, with no real-money purchase or cash value. New careers start with 1,200 credits and Vanta. Kite, Atlas, Vela, Ion and Onyx cost 1,800–4,200 credits. Power, grip and capacitor each have three paid tiers per car; later tiers cost more. Finished races pay for placement, contract completion, style and disables. Partial runs receive a small capped reward. Difficulty raises payouts. All twelve routes are accessible; medals and reputation record progress without blocking routes behind a grind.

The native executor validates ownership, balances, upgrade caps and the complete action schema. Rewards are computed by simulation once per ended race. Purchases are allowed between runs. Starting or abandoning a race preserves the career. Expected block hashes reject stale or duplicate purchases. The browser renders a prediction; it cannot assign balances, rewards, owned cars or race results.

## Presentation and performance

Every control is an icon with an accessible English name and tooltip. Stage cards use numbers and event symbols; car cards use cached renders of the actual six vehicle models. Descriptive text remains outside action controls so players can understand equipment and rewards. Garage, career, race and results have separate layouts. Mobile has a thumb joystick, simultaneous ability input, safe-area placement and a landscape gate that releases input and pauses solo simulation.

Built-in imagegen produced an original transparent VFX atlas and workshop backdrop, totaling roughly 776 KiB in WebP. Exact prompts and paths are in `nightshift-crew-art.json`. The atlas feeds a fixed pool of eight effect quads; no full-screen bloom passes, shadow maps or reflection render targets are added. Scenery remains instanced, backing pixels are bounded, garage thumbnails are rendered once, HUD updates are throttled to 10 Hz, and repeated transform groups/colors are cached. Reduced motion suppresses transient effects.

## Versioning and multiplayer expansion

V6 has a separate executable, application profile and data namespace. V5 archives remain bound to V5. Career continuity now lives in the signed application state rather than device storage. A race command carries mode, vehicle, gadget and difficulty; input tapes carry seven documented bits at 30 Hz. Rival IDs and integer actor state are stable. Rendering consumes snapshots and never mutates rules. Signed exports omit redundant recovery snapshots while retaining blocks, proofs and replayable inputs.

This release is a solo career, not live multiplayer. Expansion requires a server-owned match clock, authenticated human actor slots replacing AI decisions, per-actor ordered input streams, authoritative match snapshots, interpolation/reconciliation and disconnect policy. Career payouts must be committed from a final verified match result exactly once. Lobby, transport, matchmaking, race admission, shared-match recovery, anti-speedup timing and multi-actor replay are still future work; the existing solo endpoint must not be presented as multiplayer. Myelin provides off-chain host replay, not CKB settlement.

## References

[EA's official Unbound feature overview](https://www.ea.com/games/need-for-speed/need-for-speed-unbound/features) informed the connection between skillful driving, rival pressure and vehicle progression. The implementation uses earned race payouts rather than copying its betting systems. [pmndrs/racing-game](https://github.com/pmndrs/racing-game) is a browser 3D racing reference, and [jakesgordon/javascript-racer](https://github.com/jakesgordon/javascript-racer) is a segmented-road reference. No EA art or source code was copied. Nervos references remain fictional world building informed by the [CKB Cell Model](https://docs.nervos.org/docs/ckb-fundamentals/cell-model).
