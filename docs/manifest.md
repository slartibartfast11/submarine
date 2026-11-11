# Submarine — gameplay and implementation manifest

This document records the implemented gameplay rules and technical constraints for contributors.

For the player-facing rules, see [How to play](gameplay-rules.md). For rendering and sprite specifications, see [Visual design](visual-design.md). Where this document and the executable code disagree, inspect the code and tests before changing either; do not assume an undocumented difference is a defect.

## Core game contract

- **Two modes, one ruleset:** UI **Classic** corresponds to internal mode `classic`; UI **Modern** corresponds to internal mode `dynamic`. Both use the same player controls, six horizontal positions, two underwater depths, stage objectives, scoring and lives. Modern does **not** grant free two-dimensional player movement.
- **Input:** keyboard and touchscreen buttons use the same scene action handler. On touch devices, direction, fire, menu and mode-selection commands are exposed as DOM buttons outside the game canvas. Touch left/right repeats after a short hold; weapon actions fire once per press. Keyboard input, including the debug warp sequence, remains supported. Menu choices are also tappable in the canvas. Gameplay actions are ignored during entry and after game over. The pause/menu control remains available.
- **Player movement:** left/right selects one of six columns and updates the last horizontal facing direction; up/down selects one of two depths. The submarine cannot move beyond these positions or enter an enemy submarine's occupied column at the same depth. Blocked horizontal movement still turns the player in place. This applies to keyboard, touch and attract-mode controls.
- **Weapons:** `Space` launches a strictly vertical missile; `X` launches a horizontal torpedo. One of each may exist simultaneously, but a second of the same kind cannot launch until its previous shot is destroyed or leaves play. Torpedoes are available only in stage **3** of each cycle. Stage 2-1 and 2-2 lock them again.
- **Targets:** player missiles can destroy aircraft and surface escorts, not enemy submarines. Player torpedoes can destroy enemy submarines, not aircraft or surface escorts.
- **Defence:** missiles can intercept falling bombs and depth charges. Friendly and enemy torpedoes can intercept each other at the same underwater depth. Enemy projectiles are not automatically destroyed when their launcher is removed.
- **Enemy projectiles:** aircraft release bombs, surface escorts release depth charges, and enemy submarines fire horizontal torpedoes. The player's submarine is damaged by enemy projectiles; projectile hits and enemy kills use the collision rules below.
- **Stage progression:** a stage advances only when enough enemies of its designated kind are destroyed. Other kills still score points. Survival time alone never advances a stage.
- **Lives:** a run starts with three submarines. Each loss records another X. A surviving replacement re-enters at the lower depth and resets the current stage's kill count, preserving score and remaining lives. The final loss freezes gameplay. After 15 seconds without a paused menu, attract mode begins; `Esc` still opens the pause/menu overlay, and gameplay keys do not restart a finished run.
- **High score:** kept for this browser page's lifetime in module memory, not persisted to browser storage.
- **Sound:** procedural effects use an independent renderer with Gufobyte SFX Lab-compatible JSON presets. Sound can be muted from the title screen, with `M`, or from the pause overlay. The explicitly chosen sound-off preference is stored locally and is independent of the game mode. The original entry chirps are replaced with the approved five-note stalking cue. Its first and second short BOO beats coincide with the player submarine's two movements. A restored life plays a reward sound after the scoring event, and the GAME OVER tone begins only after the final player explosion. Surface escorts sound once when they appear. The established aircraft fly-in sound also plays when a plane starts climbing; the approved descending noise-whoosh preset plays when a plane starts descending. Alternate missile/torpedo presets remain inactive.
- **Aircraft audio:** a plane's appearance triggers the existing fly-in preset; entering a climb plays the same preset, and entering a dive plays the approved descending noise-whoosh preset. Level flight is silent. Cue changes are driven by actual vertical-motion transitions, not repeated on every animation frame or Classic grid step. All planes share one self-interrupting voice: any new entry, climb or dive replaces the previous aircraft sound. If arrival and a motion change occur on the same simulation step, entry takes priority. Old planes leaving cannot silence the newest plane's audio. Bomb-drop whistles remain on their separate voice. Stop aircraft audio on pause, player death, battlefield reset and scene shutdown.
- **Level-clear audio:** every earned stage transition, including 1-3 → 2-1, plays the same approved five-note melody-only excerpt of the menu fanfare (`public/audio/level-clear.mp3`), after a brief 300 ms delay to let the final enemy destruction effect decay. Stage progression and enemy spawn timings are unchanged. The melody never fires on manual stage warps or player death, and can play into the new stage. It is one non-overlapping playback voice, honours the saved sound-off preference, pauses/resumes with the scene, and stops on reset, death or return to menu. No special cycle-clear variation yet.
- **Falling-bomb audio:** aircraft bomb drops share one interruptible whistle in Classic and Modern. A new drop replaces the previous whistle. Only the bomb owning the current voice can stop it when it is intercepted, hits or leaves play. Pause, player death and scene shutdown stop the voice. Surface depth charges and enemy submarine torpedoes retain the shorter weapon-drop effect.
- **Scoring and replacements:** intercepted bombs, depth charges and enemy torpedoes are worth **10 points**; aircraft **100**, surface escorts **150**, enemy submarines **200**. Every crossed 10,000-point threshold restores one lost submarine up to the starting maximum of three. Threshold awards are consumed even if the player already has three lives; they do not carry over.

Implementation: [`src/scenes.ts`](../src/scenes.ts), [`src/config.ts`](../src/config.ts), [`src/lcd.ts`](../src/lcd.ts).

## Stages and scoring

| Stage | Enemies present | Required target | Cycle 1 goal |
| --- | --- | --- | ---: |
| 1 | Aircraft | Aircraft | 8 |
| 2 | Aircraft and surface escorts | Surface escort | 4 |
| 3 | Aircraft, surface escorts and enemy submarines | Enemy submarine | 4 |

- A cycle contains stages 1, 2 and 3. Completing stage 3 starts stage 1 of the next cycle.
- For cycle `c` (starting at 1), stage 1 requires `8 + 2 × (c - 1)` kills; stages 2 and 3 require `4 + (c - 1)`.
- Kill scores: aircraft **100**, surface escort **150**, enemy submarine **200**.
- Difficulty accelerates through `speedScale(c) = min(2.5, 1 + 0.14 × (c - 1))`.

Implementation: `stageTarget`, `stageGoal`, `stageAfter`, `speedScale` in [`src/config.ts`](../src/config.ts); `removeEnemy` and `stepSimulation` in [`src/scenes.ts`](../src/scenes.ts).

## Classic: fixed-grid simulation

- **Geometry:** six whole columns × six rows, comprising three aircraft rows, one surface row and two submarine-depth rows. Projectiles use twelve half-columns × twelve half-rows. Sprite drawing positions are separate from this collision grid.
- **Clock:** one shared simulation clock. Base interval **145 ms** divided by the cycle speed scale. Aircraft move to the next column every **four** ticks; surface escorts every **eight** ticks; torpedoes move one half-column every **two** ticks. Missiles and downward projectiles step through half-rows. A transition resets the tick accumulator; no residual ticks from the old stage are processed.
- **Aircraft entry continuity:** an aircraft departing an edge records that exit for a short window. Subsequent plane spawns during the window enter from the **opposite** edge, preventing a departure immediately resembling a reversal. The exit record is reset with the stage/spawn state.
- **Aircraft:** horizontal travel never reverses. Each aircraft step selects an attempted altitude change of −1, 0 or +1 row, clamped to the three sky rows. Choose the image pose from the **actual** row change, so a move blocked by the top or bottom row is displayed level. The four textures are `plane`, `planeBankRight`, `planeBankLeft` and `planeClimb`.
- **Bomb appearance:** the existing round `bomb` texture marks straight drops. `shallow`, `medium` and `steep` drops use the filled `angledBomb` torpedo-shaped mask, oriented down-left or down-right according to their assigned drift direction. In Modern, the directional mask is used for aircraft bombs with absolute horizontal drift greater than 6 px/s. Surface depth charges and horizontal submarine torpedoes retain their existing textures. This classification changes **only appearance**, never movement, collision boxes, damage, timing or interception.
- **Bombs:** reconnaissance flights do not fire (spawn chance **30%**). Other aircraft can have **up to two** active bombs. Each bomb receives a fixed `straight`, `shallow`, `medium` or `steep` path at launch. Non-straight drops drift one quarter-column every four, three or two half-row ticks respectively, beginning on the first tick. There is no sudden turn at the waterline. Bombs are not homing.
- **Surface escorts:** move more slowly than aircraft and allow only one active depth charge per escort.
- **Enemy submarines:** at most one is visible at once. An appearance is assigned a `decoy`, `single`, `dive` or `double` pattern. A decoy does not fire; other patterns can fire, change depth or fire again according to the pattern's tick schedule. A double attack is **not** blocked by the first torpedo remaining in flight. Vanishing is not counted as a kill, and torpedoes already fired continue. If a sub spawns in the player's edge column, it starts at the free depth. A Classic depth change waits until the destination cell is free; a Modern sub pauses its smooth depth transition before contacting the occupied lane. No direct hull damage is introduced.
- **Player missile:** launches vertically from the fore or aft half of the submarine's cell according to its last horizontal facing. It has no lateral steering or homing.
- **Player torpedo:** automatically selects the horizontal direction of a visible enemy submarine. When no enemy sub is visible (or the target is in the same column), it uses the player's last horizontal facing.
- **Classic hit tests:** a shot hits a full-cell target if it occupies either half of the target cell. Missile/bomb interception uses quarter-column geometry with crossing checks, preserving adjacent-cell forgiveness; every bomb quarter within the missile's whole cell is interceptable. Missile/charge interception permits the same or an immediately adjacent half-column. Opposing torpedoes can meet or cross at the same depth.
- **Adjacent-bomb interception exception:** an upward missile can destroy a diagonal bomb originating from a neighbouring whole column when the bomb's **already determined path** threatens the submarine's current depth. Eligibility is evaluated at launch using a local forecast (up to three ticks), not a global search or a homing trajectory. This is a distinct defensive rule; it must not widen ordinary missile hitboxes.

Implementation: [`src/classic-grid.ts`](../src/classic-grid.ts), `planePoseForMotion` in [`src/config.ts`](../src/config.ts), `BattleScene` in [`src/scenes.ts`](../src/scenes.ts).

## Modern: continuous enemy simulation

- The player still occupies the **same six columns and two depths** as Classic. Enemies and shots update continuously between frames; elapsed frame delta is capped before simulation.
- Aircraft advance horizontally with variable speed and change altitude smoothly, selecting level, bank/dive or climb silhouettes from the vertical-motion phase.
- Surface escorts travel continuously; aircraft bombs and escort charges fall with a small horizontal drift.
- Enemy submarines appear at the screen edges, hold one of the two depth rows, and may transition smoothly to the other row on the applicable attack pattern. Only one enemy submarine is visible at once.
- Player torpedoes travel in the **last facing direction**, even when an enemy submarine is visible.
- Moving rectangular hitboxes are checked over their travelled paths (`sweptBoxesOverlap`), not by testing pixels or only the endpoints.
- A rising missile gets extra horizontal reach against falling bombs and depth charges to account for the submarine's fixed firing positions. The projectiles must still overlap vertically at the time of interception.

Implementation: `BattleScene.updateEnemies`, `BattleScene.updateShots` and `BattleScene.intersects` in [`src/scenes.ts`](../src/scenes.ts), and [`src/collision.ts`](../src/collision.ts).

## Attract mode

- After 15 seconds idle at the title, or 15 seconds after a real player's GAME OVER freeze, start a live demo. The GAME OVER scene continues to show its final frame until the timer expires. Opening the Escape menu pauses that timer.
- Each demo chooses Classic or Modern and starts at a randomly chosen stage 1-1, 1-2 or 1-3. It runs the actual battle simulation, including normal collisions, lives, and stage changes. The virtual player uses the same movement and weapon controls as a human. It makes short predictions from visible enemy motion and projectile trajectories (Classic half/quarter-cell steps, Modern shot velocities) when choosing an adjacent grid position: it avoids moving into a known danger lane when staying still is safe, and sometimes dodges an incoming shot. It fires freely when an enemy is plausibly in its missile lane or an incoming shot could be intercepted, but not into an empty playfield. Decisions remain delayed and fallible; the controller does not see future spawns, change collision rules, steer projectiles, or replay footage.
- The demo HUD shows `DEMO`, current stage and `PRESS 1 CLASSIC / PRESS 2 MODERN`, not score or high score. Demo kills count toward stage objectives but award no points, bonus lives or session records. Demos cannot write persistent preferences or ask permission.
- The demo is silent without changing the saved sound preference. `1` or `2` immediately starts a new human run, while `Esc` returns to the title. Touch mode selection is available during demos. Demo deaths show the frozen explosion briefly before another demo; a surviving demo rotates after 60 seconds.
- Each demo run uses seeded random decisions and seeded enemy/spawn behaviour. The browser console prints its seed; `?demoSeed=12345` repeats the same demo selection and random streams for fault reproduction. Continuous-mode timing can still vary with frame rate.

Implementation: [`src/demo-controller.ts`](../src/demo-controller.ts), [`src/scenes.ts`](../src/scenes.ts), [`src/lcd.ts`](../src/lcd.ts).

## Entry sequence, warps and terminal states

- Entry is a non-interactive sequence at the lower depth: **zero-based columns 4 → 3 → 2**. The approved **BAAAAA–BOO / BAAAAA–BOO / BAAAA** cue begins at 0, 2.1 and 4.2 seconds. The two short BOO notes occur **1.17 and 3.27 seconds** after entry begins, exactly as the submarine moves to the next position. The scene becomes playable at **6.3 seconds**; the soundtrack does not affect gameplay tick timing. All cue timers use the pausable scene clock, and interrupted entry audio is stopped.
- Each player hit enters an explosion state. With remaining lives, the current stage restarts at the same cycle/stage with a fresh target count; with no lives, the scene becomes `gameOver` and the playfield stops updating, remaining frozen for 15 seconds before the demo transition (unless the Escape menu is open).
- Stage warp syntax: `G` + single-digit cycle + single-digit stage (1–3), e.g. `G13`, `G23`, `G31`. At the menu, warps start Classic directly; during a run, they preserve score and lives, clear projectiles and enemies, and reset stage progress. Warps are not available while exploding or after game over.
- Escape returns to the menu from a run, including after game over.

Implementation: `beginEntry`, `warpTo`, `hitPlayer` in [`src/scenes.ts`](../src/scenes.ts), `advanceWarpCode` in [`src/config.ts`](../src/config.ts).

## Tunables versus invariants

**Gameplay invariants** include the stage target kinds, weapon compatibility and independent lockouts, submarine position grid, projectile direction constraints, collision exceptions, stage completion by kills, and the rule that a ship's fired shots remain active after its destruction.

**Tunable values** include spawn timing, enemy speeds and maximum simultaneous enemy counts, reconnaissance and attack-pattern probabilities, base clock interval, score awards, goals per cycle, missile/torpedo speeds, collision dimensions, and individual attack delays. Their **current values** live in source code, not in this manifest as an alternate configuration file. When changing a tunable, check whether tests or user-facing rules need updating.

## Pause and menu

- On touchscreen devices, **PAUSE / MENU** occupies its own toolbar above the playfield, separate from the directional and weapon controls. It is not beside TORPEDO.
- The button (or the **Escape** key) opens the pause overlay. The user must choose **CONTINUE** to resume or **MAIN MENU** to abandon the run; no single tap leaves gameplay.
- Pausing suspends the Phaser battle scene, so simulation updates, delayed entry/life callbacks and scene tweens do not advance. The DOM overlay remains interactive while the scene is paused.
- While paused, ordinary movement and weapon input is ignored. Escape again resumes. Explicit MAIN MENU first resumes the suspended scene, then switches to the title scene. Shutdown resets the overlay state.
- The overlay is visible for keyboard as well as touch users. Its buttons are managed independently of the scene input clock.

## Touch layout and lifecycle

- `src/controls.ts` maps keyboard codes to semantic actions and sends touchscreen actions to the currently active scene. Scene listeners are removed on scene shutdown.
- `src/touch-controls.ts` handles pointer presses, independent multi-touch pointers, repeat timers for horizontal movement, and cleanup on cancellation, lost capture, visibility change and scene switch.
- `index.html` and `src/style.css` provide buttons outside the scaled Phaser canvas. In portrait, controls sit below the playfield; in landscape, they sit beside it. CSS only shows touch controls on coarse-pointer devices; physical keyboard play remains available.
- A touch press attempts to resume the WebAudio context inside the user's gesture, as HTML controls do not automatically trigger Phaser canvas input.
- Mobile controls must not introduce new weapon availability, extra projectile slots, altered collision semantics or different player movement rules.

## Source and test map

| Concern | Source | Tests |
| --- | --- | --- |
| Stages, weapon unlocks, aircraft pose selection, warps | `src/config.ts` | `tests/rules.test.mjs` |
| Classic grid, shot movement, attack patterns, interception exceptions | `src/classic-grid.ts` | `tests/rules.test.mjs` |
| Swept collision and logical boxes | `src/collision.ts` | `tests/collision.test.mjs` |
| Sprites and texture geometry | `src/curved-art.ts`, `src/lcd-segments.ts`, `src/sprites.ts` | `tests/sprites.test.mjs` |
| Bomb silhouette selection | `src/drop-appearance.ts`, `src/scenes.ts` | `tests/drop-appearance.test.mjs` |
| Scene transitions, spawns, scoring, HUD and keyboard input | `src/scenes.ts`, `src/lcd.ts` | Primarily integration behaviour; not all paths have automated tests |
| Procedural sound rendering and presets | `src/sfx-renderer.ts`, `src/sfx-presets.ts`, `src/sound-bank.ts` | `tests/sfx.test.mjs` |

## Maintenance contract

1. **Protect behaviour:** before changing a rule, identify the existing implementation and tests. Avoid silently replacing a deliberate rule with one that merely seems more realistic.
2. **Keep documentation audience-specific:** `docs/gameplay-rules.md` describes what players do and observe; this manifest documents technical behaviour and decisions; `docs/visual-design.md` documents artwork and rendering.
3. **Keep specs current:** when behaviour changes intentionally, update the affected tests, this manifest and the player guide where relevant. Do not leave stale versioned descriptions or historical design discussions in code comments.
4. **Check the build:** run `npm test` and `npm run build`. Successful tests do not substitute for a browser playtest of the visual result.
