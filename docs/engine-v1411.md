# NIGHTSHIFT 14.1.1 — sustained quality and graphics startup

This presentation delivery retains the published V14 application profile, all seven native executables, contact rules, rewards and signed career interpretation. The complete single-player objective remains open. Multiplayer implementation is excluded.

## Sustained quality

The previous governor counted a successful observation at the quality ceiling as a change. After eight such observations it latched its fallback and could not upgrade again in the same run. A direct reproduction used 70 seconds of smooth frames, 10 seconds of pressure and 60 seconds of renewed headroom; the old module remained at tier 2 and scale 0.75.

Only actual tier/scale changes are counted now. Repeated overload at the floor cannot add changes. Six actual direction reversals suppress upgrades to limit oscillation, while 24 consecutive stable seconds release that fallback. Ordinary upgrades still require four successful observation groups. Frame windows, optional-work-first degradation, explicit quality settings and simulation timing are retained. Read-only render telemetry records tier, latch and actual change count once per second.

## Graphics startup

The renderer previously compiled screen-output programs with shadows and without shadows, but the first high-quality frame used a linear HDR render target. Three r180 includes the target's output color space and tone mapping in its shader program key. The initial frame therefore compiled another set synchronously. The player car also compiled a separate screen variant before the scene warmup.

Warmup now prepares the actual HDR scene, highlight blur, display transform and direct low-quality fallback. The first race includes the car in that warmup. Medium keeps the same HDR scene program with the highlight passes disabled, avoiding a third scene variant during automatic quality changes. The caller's render target and shadow setting are restored even if warmup fails. Devices without float render-target support retain direct rendering.

Stage measurements are exposed through the existing read-only review snapshot. Fleet fetch/decode and geometry restoration are recorded independently. The loading review now captures CPU metrics and long tasks through first driving; older reports captured those only at the first menu and could not explain later stalls.

In one local 4 Mbps / 120 ms / CPU 4x comparison, first driving including countdown changed from 31.51 to 28.97 seconds. Shader programs changed from 156 to 116; the first frame changed from 3524 to 1262 ms. Generic fleet restoration was 5–8 ms per body, so rewriting its quantized geometry handling was not supported by this measurement. These are individual local samples, not public-origin, physical-device or worldwide percentile results.

## Harbour foundations

The new Harbour material now uses the existing building foundation inset. Its wall base extends 0.4 m below the road-relative ground while the roof height stays fixed. This closes the small ground gap without changing a collision boundary or adding geometry.

## Verification and remaining scope

Governor regression checks cover long smooth sessions, pressure followed by recovery, floor no-ops and real oscillations. Render-path checks cover HDR/Medium agreement, direct fallback and failure cleanup. The complete Node suite passes 167 checks. Frozen V7–V14 inputs and all 303 browser files match their manifest. All required viewport/input layouts pass on the staged image. Its 303 browser files, seven executables and 16 host files match their expected bytes, and the real pre-cutover V14 career continues with replay verified. Shared fullscreen exit/reentry retains the same iframe, JS realm, canvas, WebGL context and paused race. The actual shared helper separately passes its opaque-frame and fallback fixtures.

All-route scenery/lighting continuity, route choices, traffic wheel detail, vehicle audio identity, tactical variety, loading, physical devices and human difficulty/economy evidence remain in the single-player completion contract. This engine correction does not complete those requirements.

The first complete candidate event wins in 279.67 simulation seconds with verified native replay, but fails the unchanged performance gates at 25 median / 12 p10 FPS under concurrent system load. An exact published V14.1 frontend comparison also fails at 20 median / 10 p10 FPS. Both failed attempts are retained; they do not establish that the candidate is regression-free. A quieter repeat then passes in 280.33 simulation / 280.39 wall seconds, with 60 median / 60 p10 FPS, scale 1 and tier 0 throughout. This is one Iris Xe desktop course; it is not all-route or physical-mobile performance evidence.

Version 14.1.1 is deployed from payload source `0ab52acdaebed647042e639ecb62fecb69330392` (runtime source `f8a9a21e37a6df0853016b496f49c0821c6aa3d1`). All 303 public files match the manifest. The latest public-origin samples take 18.61 seconds to first driving on desktop and 28.71 seconds under 4 Mbps / 120 ms / CPU 4x emulation, including countdown and the test network proxy. These are individual samples and loading remains required work. Full release evidence and retained failures are in engine-v1411-results.json.
