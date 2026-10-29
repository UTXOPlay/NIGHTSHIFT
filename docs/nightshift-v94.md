# NIGHTSHIFT 9.4 — Career, classification and garage

This release includes the [district, lighting and seam corrections](nightshift-v93.md), then connects live classification, signed rewards, reputation, district medals, car collecting and upgrades into one career flow. The native V9 economy and handling remain authoritative and unchanged. Driver ranks and milestones summarize verified career fields; they do not award extra credits, gate cars or introduce new gameplay unlocks.

## Reference study and design decisions

| Reference | Useful principle | Implementation |
| --- | --- | --- |
| [Gran Turismo 7 tuning manual](https://www.gran-turismo.com/us/gt7/manual/tuningshop/01) | Relate purchases to actual vehicle performance. | Show selected/equipped speed and steering differences, full-charge boost duration, recharge interval and exact next-tier values. No invented aggregate performance rating. |
| [Gran Turismo 7 dashboard manual](https://www.gran-turismo.com/hk/gt7/manual/option/01) | Make collection and circuit progress visible together. | Driver file combines reputation progress, eight career milestones, twelve district medal records and six-car collection progress. |
| [NFS Unbound: Show Up and Show Off](https://forums.ea.com/discussions/need-for-speed-unbound-discussion-en/under-the-hood-show-up-and-show-off/9398276) | Give garage investment an understandable progression path. | A player-selected savings target links actual credits to the next car, while tuning shows price and benefit before purchase. Proprietary art, code, pricing and progression gates are not copied. |

These are design applications of the references, not claims that NIGHTSHIFT has those games' online services or progression systems. Current classification is a solo race against five AI crews. No fabricated global leaderboard or unsaved personal-best times are shown.

## Classification and receipts

The six-driver board inserts the player at the native `position`, orders completed rivals by their finish tick and shows signed distance gaps for the others. Finished and temporarily disabled rivals have distinct states. The final classification separates position from contract completion: a completed style/intercept objective is not automatically a first-place finish.

The result receipt displays the recorded credit total. For V9, finish purse, position, contract, style, combat and difficulty components are shown only if their sum exactly matches the recorded reward. Legacy or unmatched profiles fall back to the recorded total. Reputation gain, next rank and next car goal follow the confirmed career. A mobile result layout keeps classification, receipt, progression and actions separated.

The event briefing now quotes a finish purse range derived from selected difficulty, with additional bonuses identified separately. It no longer promises a fixed 1,000–2,000 reward for every outcome. Unfinished runs retain the native distance-salvage rule.

## Growth and purchase choices

Six reputation ranks span the existing earned reputation: Rookie, Runner, Crew Leader, Night Legend, Relay Icon and City Champion. Rank badges are presentation. Eight milestones track recorded runs, contracts, reputation, collection, district medals and a complete nine-upgrade build. They are recomputed from the signed career, so reload does not lose or invent progress.

The driver file exposes total earned and invested credits. District records show the actual best medal; absence of a medal is labeled as such rather than claiming an event was never attempted. Each record opens the correct briefing. A savings target is a device preference; owning its car automatically makes the next unowned target available. It changes no economic state.

Garage comparison uses exact native parameters: power adds 7.56 km/h of base cruise speed per tier, grip adds three steering-response units, and capacitor adds 0.20 seconds of full-charge boost plus faster recharge. The stock/full-charge conditions are identified. Distinct vehicle traits are stated with their limits: KITE charges drift faster, ATLAS/ONYX start with two armor on Pro/Elite, VELA has longer boost, and ION accelerates faster outside boost/braking.

Purchases still go through the native executor with the expected signed block. Insufficient funds and purchases during a saved active race remain disabled. Browsing an unowned car does not bind a career race to it. A purchase does not grant fabricated reputation.

## Play choices and race engineering

The twelve existing native events can now be browsed as Street Circuit, Signal Runner, Slide Sessions and Bounty Grid. Each discipline exposes three different districts with distinct objective types. These filters do not claim to introduce new native race modes. All twelve events remain directly available.

The route scout uses the actual signed bend table to summarize each quarter of the selected course. It shows the four local sector names, distance ranges, bend character and event goal. The three weapons can be equipped here without a garage detour. An optional setup suggestion picks only an owned vehicle and an event-appropriate weapon; applying it makes no purchase, changes no signed state and does not override a manually chosen setup unless clicked.

An optional race engineer makes existing opportunities visible: held drift chains and double-style zones, slipstream charging, straight-exit boost, approaching tight bends, two-rival Shockwave windows, trailing-line mine opportunities, guarded EMP targets, target activation gates, heat and urgent defense. It derives information from the same native state and does not steer, fire, modify opponent pace or award resources. Its single compact readout can be disabled in settings and remains disabled after reload. The result debrief explains the actual missed objective or offers a relevant next-run tactic.

Additional primary references:

| Reference | Design application |
| --- | --- |
| [NFS Unbound Vol. 7](https://www.ea.com/games/need-for-speed/need-for-speed-unbound/features/volume-7) | Make the discipline and its intended driving style legible before entering a race. Native drag/manual-shift mechanics are not added or claimed. |
| [NFS The Run manual](https://eaassets-a.akamaihd.net/eahelp/manuals/need-for-speed-the-run-manuals_Sony%20Playstation%203.pdf) | Present drafting, charge generation and boost spending as a connected racing choice. All displayed conditions use NIGHTSHIFT's own native rules. |
| [Mario Kart Tour item guidance](https://faq.mariokarttour.com/hc/en-us/articles/4409411636889-How-do-items-work) | Explain weapon context, costs and timing rather than making every item seem interchangeable. Item probability/rubber-banding rules are not copied. |

The harbor identity is **Nervos Harbour** throughout the current district name, HUD, road signs and scene-captured preview. The older frozen releases retain their historical assets and rules.

## Delivery and performance

Renderer imports and HTML preloads share the release version, so returning players fetch the updated scenery. Paused road and terrain buffers are cached until their actual inputs change. The driver file uses a lightweight map preview rather than an unnecessary wet-road reflection pass. The recorded race score is separate from finish position and credit income.

## Verification and scope

[career-results.json](career-results.json) records browser, native, asset identity, continuity and performance evidence. New tests verify rank/goal derivation without writes, real tuning increments, native player placement and receipt reconciliation against ordinarily stepped races. Existing V8 migration checks remain intact; the new UI review is a separate tool.

The full scene, canvas backing cap, landscape gate, safe-area controls, Colemak bindings, reduced motion and shader/resource lifecycle remain supported. Pointer projection now uses the current CSS canvas rectangle and its inverse removes road banking, including a resize before the next rendered frame. UI controls use the established SVG/icon and vehicle-image system. New facade imagery and its exact prompt are recorded in [nightshift-v93-art.json](nightshift-v93-art.json), with the saved [runtime atlas](../games/arcade/web/art/nightshift/architecture-v93.webp).

Real multiplayer admission, authoritative timing, shared standings and matchmaking remain separate future work. Myelin here verifies off-chain host replay; races, reputation and Relay Credits are not settled on CKB.
