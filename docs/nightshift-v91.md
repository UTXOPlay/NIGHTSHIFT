# NIGHTSHIFT 9.1 — Motion and street presentation

The motion audit found visible disagreement between the vehicle rig, tire contacts, particle emitters, camera and street lighting. This release rebuilds those connections while preserving the exact V9 rules profile, both native executables, career economy and signed saves.

## Vehicle motion and camera

The six builds now separate the sprung body from four independently positioned tires. Damped acceleration pitch and lateral roll affect the body; wheel contact follows the actual graded/banked circuit. Wheel spin uses measured model radius. Tire and exhaust anchors come from the posed rig. Close opponents use separate animated wheels; their merged distant models remain available through LOD. Road traffic and pursuit cars now use the licensed fleet geometry instead of the procedural placeholder bodies. Traffic interpolation uses V9 body IDs, including through velocity changes.

A damped chase camera provides closer vehicle framing, speed-dependent field of view/look-ahead, launch approach and direction-aware impact impulses. Reduced motion removes camera impulses and body motion. Garage/map/race camera changes blend over a short interval. View transitions do not alter pointer mapping, layout geometry or native time.

## Driving, combat and finishing

Distance-sampled contact ribbons replace render-frame skid rectangles. Smoke and wet-road spray follow rear contacts; boost plumes follow actual exhaust anchors and vehicle orientation. Rendering cadence does not determine ribbon density. All particle/ribbon pools remain bounded.

An image-generated atlas contains separate eight-frame metal-impact and electric-interception sequences. Impact position uses the native contact lever arm; normal and closing speed direct debris and scale feedback. Debris integrates gravity and bounces at the road. Crash presentation integrates damped visual velocity/angular motion rather than the old fixed 1.45-second path. The existing road clearance safeguard remains. Opponent disables use decaying chassis/yaw response instead of a prescribed jump and large spin.

The native simulation stops at its exact final tick. A short presentation continuation coasts a finishing vehicle and extrapolates surrounding racers before results; fatal impacts retain the crash interval. No reward, contact or race-duration rule changes. Countdown has timed cues and a visible GO beat. Results enter with a short stagger; all motion honors reduced-motion preferences. Layered synthesized wind, engine load/shift dip and directional contact noise share existing game events.

## Street rendering and budgets

Cached street-colored environment probes replace the generic room environment. Brake lamps respond to braking. Road normals include elevation and bank. Wet sections can use a 512x256 scene reflection, refreshed every fourth render, only when the visible surface is sufficiently coplanar. Low quality disables that pass. There is no global mirror across nonplanar hills. Repeating decorative reflection cards are removed.

The distant panorama follows heading. Near-road rain splashes and tire spray add local interaction. Twelve variants and hashed placement replace the six-template fixed sequence; selected city sections include a separate distant-building layer and less frequent overhead crossings. This improves depth and repetition without introducing a new scene graph per frame.

Road strips share a cached station/frame table instead of resampling elevation and trigonometry for every strip edge. Back-buffer limits, static batches, pools, close/far vehicle detail and adaptive resolution remain. Optional asynchronous GPU queries report unavailable/disjoint readings as null. GPU time includes the reflection pass and main scene; CPU draw timing remains a separate measurement.

## Verification

The focused suite passes 57 tests, including cadence-independent damping/ribbons and banked-road contact. A browser fixture measures 90 real-model poses across six builds, five environments and three course positions: 360 contacts, maximum absolute clearance approximately 0.0000021 m in that fixture. This is a geometric presentation measurement, not a claim about every live crash.

Native/browser conformance passes 38 tapes and 426,742 active ticks, including the earned economy. Signed export/restart/tamper/profile checks pass against the unchanged native verifier. Browser acceptance covers the required large displays, mobile landscape, portrait input release, inverse pointer mapping, economy/reload, separated results, English icon controls and reduced motion. Combat review covers collision, hit, guard, rival hit, disable, fatal crash and reduced motion.

Detailed performance and deployment evidence are recorded in verification.md after final cutover. Measurements describe the tested desktop; emulated touch does not establish physical-phone performance.

## References and art provenance

- [Bruno Simon's visual vehicle](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/World/VisualVehicle.js): independent wheel/suspension and world-space attachment design.
- [Endurance Racing](https://andersonmancini.dev/projects/endurance-racing): vehicle framing, speed presentation and light consistency.
- [Threejs-Punk wet-road notes](https://andersonmancini.dev/blog/wet-ground-without-ssr): selective scene reflections and wet-material consistency.
- [PolyTrack](https://kodub.itch.io/polytrack): coherent style and readable driving.
- [Generated asset prompt and hash](nightshift-v91-art.json). Existing licensed vehicle sources and attribution remain unchanged. No competitor code or assets were copied.
