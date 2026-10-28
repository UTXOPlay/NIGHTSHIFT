# UTXOPlay game UI contract

All current and future games must support wide and large displays, including 1920×1080, 2560×1080, 2560×1440 and 3840×2160. Also check 390×844 portrait and 844×390 landscape.

The game scene occupies the entire viewport. Put every gameplay button, item hotbar, perk selection, store and menu inside the game picture. Do not add control bars or nested application frames outside it. Chess/grid geometry must retain its aspect ratio; extend the environment rather than stretching pieces. Pointer input must use exactly the inverse rendering transform. Scale HUD legibility for large monitors and keep controls reachable with safe-area insets.

Bound canvas/WebGL backing resolution, cache static scenery, respect reduced motion and preserve game rules during presentation changes. Verify both resize and input mapping. New gameplay rules require matching native/browser replay and exact application profile binding; never reinterpret old signed saves with changed rules. Myelin here provides off-chain host replay, not CKB settlement.

On touch/mobile devices, games whose playfield and controls suit landscape must require landscape. Use a game-owned rotation gate in portrait and request orientation lock only through supported browser APIs; keep a manual-rotation fallback. Clear held inputs when rotation blocks play, pause local solo simulation where supported, and disclose that server-driven matches continue. Preserve portrait for chess, square-grid puzzles, and portrait-friendly games. Never rotate the canvas with CSS or change its input transform merely to force landscape.
