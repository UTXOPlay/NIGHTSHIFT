# NIGHTSHIFT V7 combat design audit

Audited 28 October 2026 against release `9a472c46e7c82256014a730f2e36896c1f50662a`. This is a gameplay audit; it does not change V7 rules, assets, saves or the deployed game.

**Verdict:** combat has functioning inputs and replay, but does not yet sustain interesting racing decisions. Shockwave can settle an Intercept objective in the opening pack, whereas mines struggle to achieve the same objective. Once a driver pulls away, combat largely disappears. Several contradictory hit and recovery rules make visual feedback hard to trust. More spectacle alone cannot resolve these problems.

## Evidence and limitations

Run `node tools/audit-combat-design.mjs`. It writes `artifacts/combat-design-audit/report.json` and checks:

- Eleven synthetic edge-case probes, clearly marked as edited-state scenarios. These establish what the rules do, not how often a player encounters each case.
- 144 complete races: all twelve maps, four firing policies, race IDs 1–3, stock Vanta, easy difficulty. Counters, driving, pickups and boosts remain available with the no-fire policy.
- Full-state agreement for 48 ordinary-input races against `target/release/myelin-nightshift-v7`, covering every map and firing policy; 960,576 active browser simulation ticks across the matrix.

This is one existing automated driver, not a human playtest or an optimal-policy comparison. Its Intercept steering favors forward EMP alignment and brakes when targets fall behind, so it is not a neutral specialist mine driver. Average completion times that include failed races must not be treated as track records. Art quality, network latency, advanced upgrades and hard difficulty were not measured here.

The [compact results](combat-design-results.json) retain the scenario outputs and group totals. The reproducible full report includes each race.

## Findings, in priority order

### P1 — Disabled rivals still attack; successful defense can help them recover

[Browser attack resolution](../games/arcade/web/nightshift7-rules.mjs#L185) resolve an existing attack windup without checking whether its owner has been disabled. The synthetic probe starts an attacker with 210 stun ticks and one windup tick remaining: its attack still gives the player 45 stun ticks. This is native behavior too, not a renderer-only artifact; see [native attack resolution](../games/nightshift-v7/native/src/game.rs#L653).

Countering that attack assigns `r.stun = 60`, replacing the longer disable. The counter probe changes 210 ticks to 60. A mine also assigns 90 stun ticks directly: hitting a rival with 200 ticks remaining reduces that to 90. A player can therefore land another hit or defend successfully and inadvertently accelerate an opponent's recovery.

**Design consequence:** the visible meaning of “disabled,” “hit” and “countered” is inconsistent. An animation system cannot reliably explain contradictory outcomes.

**Next-profile fix:** define explicit active, attacking, staggered, disabled and recovering states. Cancel uncommitted attacks when their owner enters disable. For a projectile already released, represent it independently so its continued flight is visible and intentional. Damage cannot shorten an existing disable. Emit authoritative hit, block, cancel, disable and recovery events with actor and target IDs.

### P1 — One collision cluster can remove every shield and end the race

[`crash()`](../games/arcade/web/nightshift7-rules.mjs#L225) sets a visual damage timer but never uses it as a hit-recovery gate. Body and rival collision paths can call it repeatedly within one simulation tick. Three overlapping traffic colliders take two shields and kill the player in the same tick in the synthetic probe. This confirms the collision rule, not the frequency of that exact three-car configuration in ordinary races.

The last-shield rule itself works: the shield absorbs one crash; the next crash is fatal. The problem is that there may be no perceivable or controllable interval between those crashes. Boost ramming also deals rival damage and invokes the player's crash cost, spending a shield; it is not a free armored attack.

**Next-profile fix:** resolve contacts into one damage event per crash episode, separate persistent contact from a new impact, and add a short recovery window. Make the cost of a ram legible before contact. Keep the actual death condition, UI shield count and rollover event synchronized.

### P1 — Intercept rewards disable counts, not an ongoing pursuit

The briefing describes marked racers, but [the finish predicate](../games/arcade/web/nightshift7-rules.mjs#L222) only checks total `takedowns`. There is no distinct target roster or unique-target requirement. A disabled opponent's HP immediately resets to two, and Shockwave/mines can damage it again before recovery. The synthetic repeat-disable probe increases the count on an already-disabled rival. Eleven ordinary-input runs recorded repeated targets, including four successful Intercept runs. In map 12, EMP race ID 1 met its four-disable objective using only two rivals: one disable on rival 3 and three on rival 4. The results retain per-rival counts.

Shockwave checks only longitudinal distance, not lateral separation, and one shot can damage all five rivals. Its two-shot opening has much more objective value than two single-target EMP shots. The seven-second rival disable also quickly separates cars from the pack, often ending the interaction instead of creating a close overtaking contest.

**Next-profile fix:** give Intercept explicit target IDs and route objectives. Count each designated target once, or clearly describe a repeatable disruption objective instead. Spread interception opportunities through the route, preserve a recoverable pursuit after a hit, and test whether the objective is resolved far before the finish. Do not place every objective target in one opening Shockwave radius.

### P1 — Combat does not sustain a race-long contest

In the nine standard-race runs per policy, the no-fire driver won all nine in first place, as did every armed policy. With no firing it spent about 11% of race time within 90 m of any unfinished rival, and faced only 0.33 attack windups per race on average. Shockwave reduced proximity to about 7%. These easy-mode results do not prove all difficulties are trivial; they do show that an introductory race can last four minutes with very little sustained rivalry.

AI attacks are started by a proximity and cooldown condition; all are aimed at the human. Rivals do not attack one another, choose their own weapons, consume ammunition, or weigh attacking against defending a position. Their lane planner has traffic avoidance and one blocking personality, but combat decisions lack comparable depth. See [rival update](../games/arcade/web/nightshift7-rules.mjs#L182).

**Next-profile design:** decide whether each event is a podium race, a pursuit or a combat objective, then tune it accordingly. Build rival intentions around overtaking, defending, drafting and recovering. Give rivals a reason to attack other rivals and shared resource constraints. Keep encounters alive with believable pace, route choices and recovery—not visible teleporting. Measure proximity over the full race and by sector, not only whether some seed can win.

### P2 — Weapon roles and costs are not balanced

Intercept results below contain nine runs per policy: three Intercept maps × three race IDs.

| Policy | Wins | Finished | Mean shots | Mean disables | Mean time within 90 m of a rival |
|---|---:|---:|---:|---:|---:|
| No firing | 0/9 | 6/9 | 0 | 0 | 99% |
| EMP | 7/9 | 8/9 | 7.89 | 2.44 | 47% |
| Shockwave | 9/9 | 9/9 | 2.56 | 3.67 | 10% |
| Mine | 0/9 | 6/9 | 11.78 | 0.33 | 95% |

Hit totals include incidental rams, so they are not weapon accuracy statistics. Shockwave was not universally superior: it won only four of nine Drift events, versus seven for EMP. The conclusion is unequal objective utility, not that Shockwave is optimal in every mode.

All weapons spend one shared ammunition unit and use the same base five-second cooldown. EMP needs a forward target within 90 m, lateral alignment and a 0.6-second lock. Shockwave has no lock, no lateral constraint and can affect every rival within 36 m ahead or behind. Mines require a trailing driver to cross their location, but disappear when they scroll 147 m behind the owner: measured life was about 2.9 seconds at stock cruising speed and 6.7 seconds while braking. This gives mines an undocumented, owner-speed-dependent lifetime.

**Next-profile design:** EMP should be a precise overtaking tool; Shockwave a costly, short-range escape or displacement tool; mines a readable defense of a trailing line. Give mines an explicit world lifetime and visible armed state. Evaluate hit effect, ammunition, opportunity cost and objective value together. Use several controllers and human sessions before assigning final damage or cooldown numbers.

### P2 — Defensive and resource rules are inconsistent

A rival's defense absorbs an EMP or Shockwave and is cleared immediately, while a mine disappears against the same defense without clearing it. AI hits cost player speed/charge but no shield; traffic consumes shield and may kill. The player's counter interrupts incoming rival attacks but does not absorb traffic damage. These can be legitimate distinctions, but the shared shield/impact imagery must explain them.

Every weapon activation also removes 80 pursuit points even if it hits nothing; an empty Shockwave probe changes pursuit from 160 to 80. If this is a deliberate heat-dump mechanic, it needs its own fiction, cue and cost. Otherwise heat relief should follow a confirmed pursuit interaction.

**Next-profile fix:** specify a small damage matrix for car impact, energy attack, trap and counter. Ensure every attacker follows it. Drive block and hit effects from the resolved outcome, not from inferred changes to cooldown or HP. Avoid describing all defense resources as interchangeable armor.

### P2 — HUD and effect triggers obscure the rules

[HUD code](../games/nightshift-v7/web/app.js#L80) marks EMP ready at 18 lock ticks but fills its meter over 30 ticks: the weapon is ready at 60% of the visible bar. Only the first nearby attack warning gets a name, even if several rivals are winding up. The counter shows ammunition but no countdown for its seven-second cooldown. Shockwave and mine readiness says nothing about whether a useful target is nearby.

[Effect inference](../games/nightshift-v7/web/app.js#L90) recognizes a disable by crossing a stun threshold. A repeat disable while already above that threshold can increment the objective without a corresponding new rival-disable effect. Mine blocks also do not follow the same pulse-based cue as direct shots.

**Presentation fix:** use one readiness threshold for the meter, reticle and input. Show directional threat icons, readable recovery rings and distinct blocked/hit/disabled outcomes. Icon-first UI still needs accessible names and an optional compact legend. Generated art should illustrate confirmed events and target states; it should not decide whether an attack landed.

## Proposed implementation order

1. **Make outcomes trustworthy.** Fix attack cancellation, monotonic stun, collision episodes and the defense matrix in a new native/browser profile. Add ordinary-input replay cases for simultaneous contacts, canceled attacks, multiple attackers and mine defense. Preserve V7 verification and saves.
2. **Build a complete racing encounter.** Prototype one 3–5 minute circuit with rivals that race each other, two meaningful combat opportunities per sector, distinct target objectives, and recoverable exchanges. Validate pursuit duration, position changes after hits, and player control time before adding more weapons or cars. These are proposed targets, not measured V7 outcomes.
3. **Tune the three existing weapons.** Compare stock and upgraded cars at all difficulties, with specialist controllers and human keyboard/touch playtests. Track target opportunities, landed hits, blocked shots, time lost, position changes and objective progress. A high win rate alone is insufficient.
4. **Reconnect progression and multiplayer requirements.** Keep purchased power bounded so upgrades do not determine competitive outcomes before a race. Reward race results and distinct objective work; cap repeat-disable farming. Introduce stable combat event IDs, explicit target ownership and versioned input timing before multiplayer. The existing deterministic host replay is a useful base; it is not yet a multiplayer combat authority or CKB settlement.
5. **Produce the final feedback assets.** Once those event contracts are stable, align attack trails, shield breaks, controlled impacts, disable recovery and rollover art with the authoritative event timeline. Verify full-viewport layout, icon readability, input mapping, landscape touch play and bounded GPU work at the required resolutions.

No V7 rule changes or combat deployment were made as part of this audit.
