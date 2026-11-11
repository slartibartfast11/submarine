# Submarine — gameplay and implementation manifest

This document records the implemented gameplay rules and technical constraints for contributors.

For player instructions, see [How to play](gameplay-rules.md). For artwork and rendering, see [Visual design](visual-design.md). Check the code and tests when documentation disagrees with the game.

## Core game contract

- **Scope:** offline, single-player gameplay with no telemetry, ads, accounts, subscriptions, in-app purchases or server-side scores. An Android build is planned, without unnecessary permissions. F-Droid packaging is not yet implemented.
- **Modes:** Classic uses internal mode `classic`; Modern uses `dynamic`. Both have the same controls, six columns, two depths, stage objectives, scoring and lives. Modern smooths enemy movement, but the player remains on the same grid.
- **Input:** keyboard and touch controls use the same scene action handler. Touch buttons sit outside the canvas; holding left/right repeats movement, while weapons fire once per press. Mode selection and pause controls work with either input method. Menu options are also tappable on the canvas. The `G` debug warp uses the keyboard. Movement and firing are ignored during entry and after Game Over.
- **Player movement:** left/right selects one of six columns and changes the facing direction; up/down switches between two depths. The player cannot leave the grid or enter a cell occupied by an enemy submarine. A blocked horizontal move still turns the player. The same restrictions apply to human and demo controls.
- **Weapons:** `Space` launches a strictly vertical missile; `X` launches a horizontal torpedo. One of each may exist simultaneously, but a second of the same kind cannot launch until its previous shot is destroyed or leaves play. Torpedoes are available only in stage **3** of each cycle. Stage 2-1 and 2-2 lock them again.
- **Targets:** player missiles can destroy aircraft and surface escorts, not enemy submarines. Player torpedoes can destroy enemy submarines, not aircraft or surface escorts.
- **Defence:** missiles can intercept falling bombs and depth charges. Friendly and enemy torpedoes can intercept each other at the same underwater depth. Enemy projectiles are not automatically destroyed when their launcher is removed.
- **Enemy projectiles:** aircraft release bombs, surface escorts release depth charges, and enemy submarines fire horizontal torpedoes. The player's submarine is damaged by enemy projectiles; projectile hits and enemy kills use the collision rules below.
- **Stage progression:** a stage advances only when enough enemies of its designated kind are destroyed. Other kills still score points. Survival time alone never advances a stage.
- **Lives:** a run starts with three submarines. Each loss marks an X. If lives remain, another submarine enters at the lower depth and restarts the current stage's kill count while keeping the score. On the final loss, the playfield freezes. After 15 seconds, attract mode starts unless the menu is open. Gameplay keys cannot restart a finished run.
- **High score:** `localStorage` keeps separate Classic and Modern records, each with score, cycle and stage. Only higher scores replace saved records. No permission prompt is needed. If storage is blocked, full or contains invalid data, the game falls back to page memory. Demos never change high scores.
- **Sound:** procedural effects use Gufobyte SFX Lab-compatible JSON presets rendered by the game's own synthesizer. Sound can be toggled from the title screen, with `M`, or from the pause menu; the mute setting is saved locally and applies to both game modes. The FM title fanfare (`public/audio/menu-fanfare.mp3`) plays when the menu appears if sound is on and the browser permits autoplay. `P` or **PLAY INTRO** replays it. The quieter sonar entry is the only effect that bypasses loudness normalisation; its timing is listed below. A restored life triggers a reward sound, and GAME OVER sounds after the player's final explosion. Surface escorts sound when they appear. Alternate missile and torpedo presets are not used.
- **Aircraft audio:** a plane's appearance or start of a climb plays the fly-in sound; the start of a descent plays the noise-whoosh sound. Level flight is silent. These cues trigger on changes in vertical motion rather than every frame or grid step. All planes share one voice: a new cue interrupts the previous one. If appearance and a change in motion occur together, appearance takes priority. An older plane leaving cannot stop a newer plane's sound. Bomb whistles use a separate voice. Pause, player death, battlefield reset and scene shutdown stop aircraft audio.
- **Level-clear audio:** completing a stage plays the last five notes of the menu fanfare (`public/audio/level-clear.mp3`) after a 300 ms delay. This also plays when stage 3 rolls over to stage 1 of the next cycle. Stage progression and spawn timing are unaffected. The sound does not play on debug warps or player death. It uses one non-overlapping voice, respects mute, pauses with the scene, and stops on reset, death or return to the menu.
- **Falling-bomb audio:** aircraft bombs share one interruptible whistle in both modes. Each new bomb restarts it. Only the bomb currently producing the whistle can stop it when intercepted, on impact or when leaving the screen. Pause, player death and scene shutdown stop the whistle. Depth charges and enemy submarine torpedoes use the shorter weapon-drop sound.
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
- **Aircraft entry continuity:** when an aircraft leaves the screen, its exit edge is remembered briefly. A plane spawning during that window enters from the opposite edge, so it does not appear to reverse direction. This record resets with the stage/spawn state.
- **Aircraft:** horizontal flight never reverses. On each movement step, the plane attempts to change altitude by −1, 0 or +1 row, within the three sky rows. Its pose follows the resulting row change: a climb or dive blocked by the top or bottom boundary displays as level flight. Textures: `plane`, `planeBankRight`, `planeBankLeft`, `planeClimb`.
- **Bomb appearance:** straight drops use the round `bomb` texture. `shallow`, `medium` and `steep` drops use the filled torpedo-shaped `angledBomb` texture, rotated toward the drift direction. Modern uses the angled texture for aircraft bombs drifting more than 6 px/s horizontally. Depth charges and horizontal submarine torpedoes keep their own textures. Texture selection does not change movement, collision, damage, timing or interception.
- **Bombs:** reconnaissance flights do not fire (spawn chance **30%**). Other aircraft can have **up to two** active bombs. Each bomb receives a fixed `straight`, `shallow`, `medium` or `steep` path at launch. Non-straight drops drift one quarter-column every four, three or two half-row ticks respectively, beginning on the first tick. There is no sudden turn at the waterline. Bombs are not homing.
- **Short bomb warning:** some aircraft bombs allow only two Classic ticks between release and impact. The short warning is deliberate anti-camping gameplay; changing it would change the intended difficulty.
- **Surface escorts:** move more slowly than aircraft and allow only one active depth charge per escort.
- **Enemy submarines:** at most one is visible at once. Each appearance uses a `decoy`, `single`, `dive` or `double` pattern. Decoys do not fire; other patterns fire and/or change depth on their tick schedules. A double attack can launch its second torpedo while the first is still in flight. A submarine leaving the screen does not count as a kill, and its fired torpedoes remain active. If an enemy sub enters at the player's edge column, it uses the unoccupied depth. In Classic, an enemy depth change waits until the destination cell is clear; in Modern, its smooth depth movement pauses before entering an occupied lane. Hull contact does not damage the player.
- **Player missile:** launches vertically from the fore or aft half of the submarine's cell according to its last horizontal facing. It has no lateral steering or homing.
- **Player torpedo:** automatically selects the horizontal direction of a visible enemy submarine. When no enemy sub is visible (or the target is in the same column), it uses the player's last horizontal facing.
- **Classic hit tests:** a shot hits a full-cell target from either half of its cell. Missile/bomb interception uses quarter-column positions and crossing checks; a bomb in any quarter of the missile's whole cell can be intercepted. Missile/charge interception allows the same or an adjacent half-column. Opposing torpedoes can meet or cross at the same depth.
- **Adjacent-bomb interception exception:** an upward missile can intercept a diagonal bomb launched from a neighbouring column if that bomb's existing path threatens the player's current depth. This is checked at launch using a local forecast of up to three ticks, without steering the missile. Other missile collisions keep their normal hitboxes.

Implementation: [`src/classic-grid.ts`](../src/classic-grid.ts), `planePoseForMotion` in [`src/config.ts`](../src/config.ts), `BattleScene` in [`src/scenes.ts`](../src/scenes.ts).

## Modern: continuous enemy simulation

- The player uses the same six columns and two depths as Classic. Enemies and shots move continuously between frames; frame delta is capped before simulation.
- Aircraft advance horizontally with variable speed and change altitude smoothly, selecting level, bank/dive or climb silhouettes from the vertical-motion phase.
- Surface escorts travel continuously; aircraft bombs and escort charges fall with a small horizontal drift.
- Enemy submarines appear at the screen edges, hold one of the two depth rows, and may transition smoothly to the other row on the applicable attack pattern. Only one enemy submarine is visible at once.
- Player torpedoes travel in the **last facing direction**, even when an enemy submarine is visible.
- Moving rectangular hitboxes are checked over their travelled paths (`sweptBoxesOverlap`), not by testing pixels or only the endpoints.
- A rising missile gets extra horizontal reach against falling bombs and depth charges to account for the submarine's fixed firing positions. The projectiles must still overlap vertically at the time of interception.

Implementation: `BattleScene.updateEnemies`, `BattleScene.updateShots` and `BattleScene.intersects` in [`src/scenes.ts`](../src/scenes.ts), and [`src/collision.ts`](../src/collision.ts).

## Attract mode

- After 15 seconds idle at the title, or 15 seconds after a real player's GAME OVER freeze, start a live demo. The GAME OVER scene continues to show its final frame until the timer expires. Opening the Escape menu pauses that timer.
- Each demo starts in Classic or Modern at a randomly selected stage (1-1, 1-2 or 1-3). It runs the real battle simulation, including collisions, lives and stage changes, with the same movement and weapon controls as a human player.
- The demo controller uses visible enemies and projectiles to predict near-term danger (Classic half/quarter-cell steps or Modern velocities and swept paths). It avoids an obviously unsafe adjacent cell when staying put is safe, respects enemy-submarine occupancy, and sometimes dodges incoming fire.
- The demo fires when an enemy is plausibly in the missile lane or a projectile can be intercepted, rather than shooting into an empty playfield. Its reactions are delayed and imperfect. It cannot see future spawns, steer shots or change collision rules.
- The demo HUD shows `DEMO`, stage and `PRESS 1 CLASSIC / PRESS 2 MODERN`, without score or high score. Demo kills advance stage objectives but earn no points or extra lives. Demos do not change high scores or saved preferences.
- The demo is silent without changing the saved sound preference. `1` or `2` immediately starts a new human run, while `Esc` returns to the title. Touch mode selection is available during demos. Demo deaths show the frozen explosion briefly before another demo; a surviving demo rotates after 60 seconds.
- Each demo run uses seeded random decisions and seeded enemy/spawn behaviour. The browser console prints its seed; `?demoSeed=12345` repeats the same demo selection and random streams for fault reproduction. Continuous-mode timing can still vary with frame rate.

Implementation: [`src/demo-controller.ts`](../src/demo-controller.ts), [`src/scenes.ts`](../src/scenes.ts), [`src/lcd.ts`](../src/lcd.ts).

## Entry sequence, warps and terminal states

- **Entry:** the submarine moves along the lower depth through zero-based columns 4 → 3 → 2. Six identical 416 ms sonar pings play in groups of 1 / 2 / 3, starting at 0, 0.766, 1.357, 2.123, 2.629 and 3.135 seconds. The first ping of each group moves the submarine (at 0, 0.766 and 2.123 seconds). Controls unlock at **3.551 seconds**, when the last ping ends. Entry uses the pausable scene clock, stops any interrupted sound, and does not change gameplay tick timing.
- Each player hit enters an explosion state. With remaining lives, the current stage restarts at the same cycle/stage with a fresh target count; with no lives, the scene becomes `gameOver` and the playfield stops updating, remaining frozen for 15 seconds before the demo transition (unless the Escape menu is open).
- **Debug warps:** type `G` followed by a single-digit cycle and stage (1–3), such as `G13`, `G23`, `G31`. From the title screen, a warp starts Classic; during a run, it keeps the score and lives but clears enemies, projectiles and stage progress. Warps are unavailable during explosions or after Game Over.
- `Esc` opens the menu overlay rather than returning straight to the title. After a human GAME OVER, **PLAY AGAIN** starts a fresh run in the same mode, while **MAIN MENU** returns to the title. Movement and firing keys cannot restart a finished run.

Implementation: `beginEntry`, `warpTo`, `hitPlayer` in [`src/scenes.ts`](../src/scenes.ts), `advanceWarpCode` in [`src/config.ts`](../src/config.ts).

## Tunables versus invariants

**Gameplay invariants** include the stage target kinds, weapon compatibility and independent lockouts, submarine position grid, projectile direction constraints, collision exceptions, stage completion by kills, and the rule that a ship's fired shots remain active after its destruction.

**Tunable values** include spawn timing, enemy speed and counts, reconnaissance and attack-pattern probabilities, clock interval, points, stage goals, projectile speeds, collision dimensions and attack delays. Source code is authoritative for these values; update tests and player-facing rules when they change.

## Pause and menu

- On touchscreen devices, **PAUSE / MENU** sits in its own toolbar above the playfield, apart from movement and weapon controls.
- The button (or **Escape**) opens the overlay. During an active run it offers **CONTINUE**, **SOUND** and **MAIN MENU**. **CONTINUE** or `Esc` resumes; **MAIN MENU** abandons the run. After GAME OVER the overlay offers **PLAY AGAIN**, **SOUND** and **MAIN MENU**, with no **CONTINUE** option.
- Pausing suspends the Phaser battle scene, so simulation updates, delayed entry/life callbacks and scene tweens do not advance. The DOM overlay remains interactive while the scene is paused.
- While paused, movement and weapon input are ignored. `Esc` closes the overlay without restarting a finished run. MAIN MENU resumes the scene before returning to the title so shutdown can clean up normally.
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
| Procedural sound rendering, presets and entry timing | `src/sfx-renderer.ts`, `src/sfx-presets.ts`, `src/sound-bank.ts`, `src/entry-cues.ts` | `tests/sfx.test.mjs`, `tests/exclusive-sound.test.mjs` |
| Title fanfare, stage-clear melody and aircraft audio | `src/scenes.ts`, `src/sound-bank.ts` | `tests/menu-audio.test.mjs`, `tests/level-clear-audio.test.mjs`, `tests/aircraft-audio.test.mjs` |
| Persistent per-mode high scores | `src/high-scores.ts`, `src/scenes.ts` | `tests/high-scores.test.mjs` |
| Attract-mode decision-making and occupied cells | `src/demo-controller.ts`, `src/submarine-occupancy.ts`, `src/scenes.ts` | `tests/demo-controller.test.mjs`, `tests/submarine-occupancy.test.mjs` |
| Pause and touch controls | `src/controls.ts`, `src/touch-controls.ts` | `tests/controls.test.mjs` |
| Backdrop and destruction glyph timing | `src/backdrop-art.ts`, `src/lcd-background.ts`, `src/debris-art.ts`, `src/debris-timing.ts` | `tests/debris-timing.test.mjs`; visual playtest for artwork |

## Maintenance contract

1. **Protect behaviour:** check the implementation and tests before changing a rule. Intentional mechanics should not be altered accidentally.
2. **Keep documentation in the right place:** `docs/gameplay-rules.md` explains the game to players, this manifest records its rules and implementation, and `docs/visual-design.md` covers artwork and rendering.
3. **Keep documentation current:** when gameplay changes, update affected tests and documentation. Remove outdated descriptions rather than leaving conflicting versions.
4. **Verify changes:** run `npm test` and `npm run build`. Playtest visual and audio changes in a browser.
