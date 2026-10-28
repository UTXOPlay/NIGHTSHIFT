# NIGHTSHIFT 8.0 — Combat Season

## 8.1 presentation and workshop update

Version 8.1 retains the exact Season 8 native profile and signed career storage. It changes rendering, assets, keyboard guidance and the garage interface. The product subtitle now explicitly says Street Racing.

Five original imagegen atlases provide four architectural facade families, industrial construction surfaces, street-light optics, eight combat effects, and animated smoke/nitrous frames. The [asset manifest](nightshift-environment-art.json) records every prompt, source output, destination and conversion. Facades retain floor scale, window emission and roughness variation. Buildings gain podiums, setbacks, roof hardware and textured skybridges; harbor gantries gain braces, cabins and machinery. Steel, concrete, reactor walls and outlying relay buildings share the new construction atlas. Thin Cell light sculptures replace filled city sign blocks.

Street lamps use tapered poles, curved arms, detailed housings and a generated diffuser. Twenty-two instanced fixtures share light cards and road pools; two nearby point lights illuminate cars. One bounded 1024² directional shadow map updates on alternate display frames. Low quality and reduced render scale disable physical lights/shadows while preserving the light cards and contact shadows. No full-screen bloom pass is added.

Combat effects follow the existing authoritative event IDs. A textured EMP ribbon connects the actual shot target; Shockwave expands along the road. Sparks, smoke, shield contact and break effects replace old duplicated generic overlays. Drift smoke and nitrous exhaust use bounded flipbook pools. Electrical disable uses a system-hit effect; fatal collision retains the rollover timeline. Reduced motion suppresses transient effects.

The six playable race builds use two [licensed external vehicle bodies](vehicle-assets.md), each prepared at player/opponent detail levels. Material batching retains paint, glass, metal, rubber and light properties. The in-game guide includes the source credits and licenses.

The workshop has a continuous 3D floor receiving the vehicle shadow and four individual tire contact shadows. The preview camera preserves its world-up orientation when switching sides. The workshop provides a large rotatable 3D preview, real vehicle thumbnails, a six-car comparison shelf, readable speed/handling/tier information, exact prices and credit shortfalls. Upgrade cards show the benefit, tier and next cost. Purchase progress, success, failures and race-time restrictions are visible. Short landscape screens switch between showroom and tuning views. Weapon loadout selection stays with the build; purchases remain native-authorized actions with the existing costs and rules.

Desktop controls keep **E / FIRE** and **Q / COUNTER** separate from ammunition and cooldown readings. A compact keyboard legend and weapon-state reason explain locking, range, recharge and insufficient ammo. Touch controls retain their icon layout.

This release fixes the [V7 combat audit](combat-design-audit.md) with a new deterministic native/browser rules profile. Game text, code and documentation remain English. Existing V7 careers keep their original verifier and storage; V8 starts a separate season. No signed V7 state is reinterpreted as V8.

## Outcomes players can trust

- Damage cancels an attack that is still charging. Disabled racers cannot fire, take repeat damage or have their disable shortened by another hit or counter.
- A disable lasts 2.5 seconds, followed by 1.5 seconds of recovery protection. Integrity remains visibly depleted until recovery. Energy attacks disrupt systems; collision armor protects against physical crashes.
- One contact cluster spends one armor, with a 1.2-second collision recovery window. A subsequent separate crash without armor is still fatal. A faster AI rear-ending a slow player causes a bump rather than charging the player for the AI's impact. Deliberate high-speed contacts and boost rams retain their armor cost.
- Player energy damage has a one-second protection window, preventing simultaneous attackers from instantly stacking two hits. At most one rival can charge an attack on the player in Street/Pro, or two in Elite.
- Mines and direct weapons consume the same guard on a blocked hit. Firing at empty space gives no pursuit relief. Only a confirmed player hit reduces heat.

Every outcome produces a bounded, ordered event with tick, actor, target and weapon IDs. The UI uses these events for hit, block, disable, counter and recovery feedback. It no longer infers a disable from a visual stun threshold. This supports future multiplayer work but does not implement multiplayer.

## Three weapon roles

| Weapon | Ammo | Base cooldown | Role |
|---|---:|---:|---|
| Lock EMP | 2 | 4 s | Forward interception within 90 m; 0.6-second lock and an unguarded hit disable the target. Wait out the visible rival guard. |
| Shockwave | 2 | 7 s | Near-field disruption within 18 m and one lane laterally; at most two targets, one damage each. |
| Rear mine | 1 | 6 s | Defend the trailing line; arms after 0.3 seconds, persists at its world position for 12 seconds, and disables on an unblocked hit. |

Ammunition caps at four; passive recharge is 12 seconds before capacitor upgrades. Cooldowns, charges and target opportunities are visible. The EMP meter and fire condition use the same 18-tick threshold. Threat icons distinguish attacks ahead and behind; the jammer cooldown has its own ring and countdown.

## Interception and racing

Contracts assign distinct rivals, highlighted amber on the minimap. Targets activate at route milestones at 0%, 20%, 40% and 60% as applicable. Repeatedly disabling one rival cannot satisfy another target or repeatedly earn disable rewards. EMP and Shockwave are recommended for interception; mines are intended primarily for defensive racing.

Rivals have finite ammunition and guard resources, choose targets among the whole field and fight each other. Their pace uses a smoothed reference with a bounded ±90 speed adjustment, plus vehicle/difficulty offsets, corner penalties and finite boost windows. Distance always advances through normal simulation; there is no teleporting or position reassignment. This keeps Street races competitive while retaining overtaking opportunities. The starter car can still pass three rivals without nitrous, weapons or upgrades in the regression test.

## Verification

- 39 JavaScript/host tests; five Rust tests; Clippy with warnings denied.
- 38 full-state native/browser conformance tapes, 290,654 active ticks, all twelve maps completed and an earned career buying all six cars.
- A separate 144-race balance sample checks 48 complete tapes against the deployable Linux binary. It covers 834,830 active ticks. Results are in [the compact balance report](combat-season-results.json).
- Signed race rewards and purchases verify after restart. Both V7→V8 and V8→V7 exports are rejected by the wrong verifier. A Debian-built binary verifies the same V8 export as the development build.
- Browser acceptance covers 1920×1080, 2560×1080, 2560×1440, 3840×2160, 844×390 and the 390×844 landscape gate, inverse pointer mapping, joystick/counter input, earned purchases and separate results.
- Combat browser checks cover collision, incoming hit, successful jammer, outgoing hit, disable, fatal rollover and reduced motion. Twelve map previews, thumbnails and mobile HUD geometry are checked.
- Local 1920×1080 Chromium: 30.07 simulated seconds over 30.07 wall seconds, 60 median / 60 p10 FPS, 1.36 ms median CPU draw work, 50–99 draw calls and 109,524 peak triangles. These are local desktop measurements, not physical mobile measurements.

The same stock-car bot that won every V7 standard race without firing now finishes/wins six of nine with no firing, versus nine of nine with EMP or Shockwave. Armed standard-race samples spend roughly 59–80% of their time within 90 m of a rival, compared with 7–12% in V7. This is an automated sample with one controller, not a human win-rate estimate or a claim of perfect balance. Interception remains harder, and rear mines are less suitable for forward pursuit.

## Reproduce

```sh
npm ci
npm test
npm run test:native
npm run build:native
npm run build:native:legacy
npm run test:conformance
npm run test:replay
npm run test:balance
npm run build
npm run check:release
```

For browser checks, start `node tools/nightshift8-server.mjs`, then run `npm run test:browser`, `npm run test:combat`, `npm run test:maps` and `npm run test:performance` sequentially. The browser driver is intercepted only inside the test client; no test driver is served in the release and CSP is unchanged.

`docs/release-integrity.json` binds the V8 source and deployable browser hashes. `docs/release-integrity-v7.json` retains the old release manifest. Keep V7 data and binary for legacy replay and rollback, and route V8 to its own data directory.
