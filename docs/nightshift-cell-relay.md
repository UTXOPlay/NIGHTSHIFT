# NIGHTSHIFT — Cell Relay

Release 5.0.0. Twelve 3–7 minute stages use the new `myelin-nightshift-v5` application profile. V4 rules and saved sessions remain bound to the original V4 executable. No old save is reinterpreted.

## World and story

Every 13.5–17.5 km stage visits four districts in a different order. Successful stages take at least three minutes at the maximum possible speed and must finish before the seven-minute limit. Each quarter of the existing signed distance belongs to a district. The next district is visible ahead and advances at road speed; the player crosses an open bridge apron and overhead wayfinding gate at each boundary. Ambient color, rain and the mountain backdrop blend near the boundary. No random state is added to the game.

- **Cell Docks:** layered cargo containers, gantry cranes, water and amber wayfinding.
- **Nervos Commons:** recessed cell facades, structural frames, skybridges and mint lighting.
- **Relay Ridge:** textured basalt cliffs, conifers, antenna towers and an open coastal mountain sky.
- **CKB Underpass:** a continuous vaulted tunnel, structural ribs, service panels and green guide lights.

The player is a night courier carrying cell cargo through a fictional Nervos-inspired city. Each event has a short briefing, district radio captions and a result line. The linked-square emblem is original artwork, not an official Nervos logo. These are story references; collecting a pickup or finishing a route does not make a blockchain transaction. Myelin still provides off-chain host replay, not CKB settlement.

## Research and references

The [official CKB Cell Model documentation](https://docs.nervos.org/docs/ckb-fundamentals/cell-model) describes cells as the generalized UTXO state model. This informed the modular architecture and courier vocabulary, rather than introducing financial mechanics. The [Nervos CKB repository](https://github.com/nervosnetwork/ckb) provides the project context.

Earlier racing research remains in `nightshift-research-and-design.md`: official Need for Speed material, [pmndrs/racing-game](https://github.com/pmndrs/racing-game) for a browser racing reference, and [jakesgordon/javascript-racer](https://github.com/jakesgordon/javascript-racer) for segmented road/scenery design. No EA art, music, logos or code was copied. The new world meshes, route presentation and sign artwork are original.

## Stage rules and intermissions

The 12 stages are Cell Express, Cold Signal, Green Line, Night Intercept, Dockside Run, Ghost Frequency, Ridge Slide, Dead Drop, Open Commons, Last Transmission, Circuit Breaker and Dawn Relay. They combine sprint, pursuit, drift-score and rival-intercept objectives. Style targets rise from 6,000 to 10,000; rival targets rise from 12 to 24. Each stage has its own route order, distance and briefing.

All stages start with 12,600 ticks (seven active minutes) at 30 Hz. Distances are at least 135,000 signed units; the maximum advance is 25 units per tick, so a successful stage cannot finish before 5,400 ticks (three minutes). Checkpoints never extend the seven-minute limit. Three district checkpoints replenish one shield and one EMP, capped at two, plus 300 nitro charge. Traffic cadence and pursuit pressure are retuned for the longer runs. Shield depletion remains immediately fatal on the next collision, including under nitro; a checkpoint cannot revive a wreck.

Stage select, vehicle select, results and pause are separate screen states inside the game. A result displays its score/time/best and Retry / Stage Select / Next Stage actions. The next-stage action selects the following stage and shows its briefing; starting remains an explicit player action. Mobile stage selection uses a 3×4 grid, while shorter displays can scroll inside the game-owned picker. Gameplay HUD elements are hidden during intermissions.

## Assets and runtime cost

Two original images were generated using the built-in imagegen tool: a four-material atlas and a coastal mountain panorama. Exact prompts, source paths and encoding parameters are in `nightshift-relay-art.json`; both final WebP assets live under `games/arcade/web/art/nightshift/`.

Scenery uses cached templates, shared geometry and instanced batches. Only visible forward segments are populated; no scenery is allocated per frame. The new backdrop blends in one draw call. No real-time shadows, reflections, extra render targets or postprocessing were introduced. The existing 3,686,400-pixel backing cap and low-power/reduced-motion behavior remain. Existing car and pickup rendering is preserved. The V5-only frame scheduler caches unchanged HUD attributes, adapts quality from smoothed frame times and retains active elapsed time through ordinary slow frames. Hidden-tab time is discarded. These presentation changes do not modify signed rules.

## Earlier requirements retained

English interface; translucent in-scene controls; mobile thumb joystick with simultaneous EMP/nitro; landscape rotation gate that clears input and pauses; four vehicles; twelve stages across four event types; readable pickups; EMP, drifting, cross traffic, pursuit, boost strips and marked rivals; fatal unshielded crashes, including while boosting. V4, V3 and Coast profiles and save directories remain separate.

Validation and deployment evidence are recorded in the parent repository's `docs/deployment-nightshift-v5.md` and this repository's `artifacts/nightshift-v5/` directory.
