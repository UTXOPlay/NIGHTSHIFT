# Next completion pass

The full single-player objective remains active. Preserve all requirements in single-player-completion.md; do not treat V13 career delivery as completion of the whole goal.

1. Finish the remaining presentation compatibility detail: the current interception HUD appends TOP 3 even for an unfinished V12 event, whose original rules only require its targets. Make that suffix conditional on physics_version >= 13. The recovery toast should likewise refer to the V12+ foot brake binding. Ship presentation fixes with fresh cache/version keys; never edit the deployed V13 native sources.
2. Replace the historical map/combat browser command entries that still drive V10 inputs without a gas pedal. Browser, performance and balance entry points already exercise V13. Keep meaningful current-rule animation and moving-map checks instead of stationary/frame-rate-only assertions.
3. Rival planning still evaluates three lane centers and derives pace from the player average. Finish fair overtaking, distinct racing/defensive tactics, attack intent, recovery behavior and bounded human-readable counterplay. New native rules require an independent V14 profile, mirrored JS and a frozen V13 origin/executor.
4. Complete the near-scenery/material/lighting and audio passes, then route decisions/landmarks and event-transition polish. Do not repeat one asset over a whole map. Use new raster generation only where it adds usable assets; preserve licensing and bounded draw/texture costs.
5. Audit startup dependencies and sustained/mobile performance. Public V13 first menu was 18.47 seconds in one sample; this is still too slow to call the loading work complete. Preserve bounded backing resolution, landscape/input clearing, reduced motion and Store fullscreen reentry.
6. Finish the final requirement-by-requirement completion audit, including human-readable difficulty evidence. Exact bot replay proves rule conformance and reachability, not human fun. Multiplayer implementation is excluded.

Deployment: V13.0.0 game image 74bb75aeeafd25c7e69152d3af400b67dea341e5605ed04abf471b4e282e855c; source commit 188df362d1bdd01fc98f87704d65e7dbf9a4be17; PR #5. The separate worktree is /tmp/nightshift-career-v13. The shared main checkout contains unrelated unfinished work and must not be reset or staged broadly.
