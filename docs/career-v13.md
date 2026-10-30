# Staged career and build choices — NIGHTSHIFT 13.0.0

The solo career now connects results, reputation, the garage and the next event. New drivers can choose any of four opening disciplines. Three distinct medals open the next chapter, across twelve routes. First district medals pay 250 credits once, three-medal chapters pay 750 once, and quarter-route contracts pay 75 credits plus 10 reputation each at the finish. Reputation licenses cars and higher part tiers. Stock time attack does not grant campaign medals.

Purchased parts are permanent. Each car can activate six of its nine possible tiers, with free allocation between events. The garage distinguishes active tiers, owned tiers, purchase costs and reputation requirements; performance statistics use the active allocation. Native commands enforce ownership, costs, licenses and the six-point budget. Currency conservation and one-time rewards are replayed, not awarded by the UI.

Interception targets activate across 8%–88% of the route and must be followed by a podium finish. Drift events retain four sector quotas and require a linked drift followed by a clean exit after 90%. Optional sector contracts provide intermediate goals and persistent sector records. The tested successful runs last 272.4–403.0 seconds. In the deterministic bot's successful target events, the final objective remained relevant until 3.9–32.0 seconds before the finish, replacing the previously measured 60–185 second gaps. This is a pacing measurement, not human difficulty validation.

The result screen itemizes the exact credited total, including first-clear, chapter, sector and difficulty bonuses. V12 reward receipts now work too. Custom keyboard migration searches the entire supported key pool when its preferred choices are occupied, preserving the old bindings.

## Versioning and deployment

V13 has a separate native executor, database and application profile. V8–V12 native sources and executables remain frozen. An unfinished old race stays on its original executor until the next explicit event. Proven currency, purchases and medals carry forward; existing customers retain all previously selectable routes. Over-budget legacy cars keep their purchased parts and receive a free editable allocation. Historical stock PBs are retained with the source save generation and original proof, while the current-rule PB starts at zero. The source save generation does not necessarily identify the original generation of a previously carried PB.

The Debian Bookworm build must report profile `2d5a6bfbfbbe403287337fbd06a33a2de435137678f1dd03b0d691968b3256b5`. The published binary SHA-256 is `c43239d0b6d97f864f25e7d1130ed68c31f5a369b018fe0055cb3cc8059c7643`. The production game has a 2 GiB ceiling with swap disabled; six-generation cache validation reached 1,621,524,480 bytes. This is a migration/cache budget check, not a multiplayer or sustained concurrency benchmark.

The release clones the latest Store image and updates only the NIGHTSHIFT catalog entry. All five legacy binaries, credentials, volumes, networks and security controls are retained. V13 has a separate writable volume. The previous game and Store containers and their data backups remain available for rollback.

## Evidence and remaining scope

See [machine-readable results](career-v13-results.json) and the [full single-player completion contract](single-player-completion.md). Verification includes 136 Node checks, 15 Bookworm Rust test executions, 229 exact native/browser comparisons across 686,855 active ticks, 80 races, all twelve winnable routes, earned purchases of all six cars and every part, and both mutually exclusive six-point builds. Staging verifies five migration generations, a real 8,402-tick historical PB, unchanged signed origins, exact asset/host/binary hashes, controller practice and touch input. Browser layouts cover the five required landscape/large sizes plus the portrait gate.

The goal remains active. Rival tactics, environmental materials/lighting, route decisions, audio identity, startup latency and longer/device-specific validation still require their completion passes. Multiplayer implementation is explicitly excluded. No loading or physical-device claim follows from a short local desktop FPS sample.

## Public acceptance

Real-domain checks passed without local asset substitution: all five display layouts, locked route previews, a legally earned chapter license and its exact reward receipt, a UI car purchase, free part allocation, native signed replay, independent pedals after resizing and the portrait gate. Store mobile entry, fullscreen exit and reentry preserve the same game iframe and instance. The accelerated career test respects the production action rate limit; no gateway limit was weakened.

One public 1920×1080 Auto sample measured 60 median / 59 p10 FPS, 2.63 ms median CPU and 8.80 ms median GPU over 20.08 seconds, with 20.07 seconds of simulation and no browser errors. First menu readiness was 18.47 seconds in this sample. Network and cache conditions differ from the older 31.4-second sample, so this does not establish a loading optimization. Startup latency remains unfinished.
