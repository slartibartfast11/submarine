# Gameplay — v0.2.1

## Fundamental rules

- Five discrete horizontal positions, numbered 1–5 from left to right, and two depth lanes.
- One active missile and one active torpedo independently. Both may be in flight together; missed shots must expire before re-firing that weapon.
- One live projectile per enemy combatant. Previously fired shots can remain after the attacker is destroyed.
- Missile goes straight upward, torpedo moves horizontally in the last left/right movement direction.
- Missiles intercept falling bombs or charges. Both modes use logical sprite rectangles rather than opaque-pixel collisions. Only Dynamic mode uses swept collision between frames.
- Classic advances aircraft, sweepers, submarines, bombs, missiles and torpedoes on a **shared discrete LCD clock**, not smoothly animated sprites. Dynamic retains the continuous-motion simulation with the same artwork.
- Classic planes always move horizontally by one aircraft-grid step on each tick, left-to-right or right-to-left without reversing. They may simultaneously hold altitude, climb or descend by one sky row, chosen with limited randomness. **No vertical-only plane movements.**
- The aircraft grid (40 px steps) is independent of the five-position player grid. Sweepers and enemy subs also update only on clock ticks, at their own integer tick multiples.
- Classic projectiles advance once per clock tick, and collision checks use occupied sprite rectangles on each state. Dynamic checks swept rectangular collision paths between smooth simulation frames.
- As cycles advance, Classic speeds up by shortening the *global tick interval*, not by multiplying movement jumps. Dynamic retains continuous speed scaling.


## Stages — kill objectives, not a clock

| Stage | Enemies present | Target required to advance | Initial target |
| --- | --- | --- | --- |
| 1-1 | Aircraft | Aircraft | 8 |
| 1-2 | Aircraft + surface sweepers | Sweepers | 4 |
| 1-3 | Above + submarines at screen edges | Enemy subs | 4 |
| 2-1 onward | Repeat these three stages faster | Stage-specific target | Increases each cycle |

Off-target kills still earn points, but do **not** advance the current objective. The clock is never used to advance stages. Reaching a quota clears enemies/projectiles and begins the next stage; losing a submarine returns to the beginning of the **same** stage, with the quota reset but total score preserved.

The stage quotas, scoring values, speeds and hitboxes are prototype tuning values, not documented original-hardware rules.

## Lives, entry and game over

- Three submarines total. Show three large fixed LCD X segments, active or faintly ghosted.
- At game start and after each non-final death, the fresh submarine **slowly creeps** in at upper depth: column **5 → 4 → 3**, holding each pose about **900 ms** and then starting gameplay after 2.7 seconds. A sustained original electronic ready beep accompanies entry. Player cannot shoot or be hit during entry.
- A hit explodes and removes the submarine, freezes combat, consumes one X and resets the current stage once the entry sequence starts. The score and remaining Xs persist.
- The third hit explodes; **all actors freeze in place**; the permanently etched, normally ghosted **GAME OVER** lettering in the top LCD strip lights up. No respawn and no automatic scene change.
- Only **Esc** returns to the title menu. Fire, R, and other gameplay keys never restart.

## LCD and scoring

- Numeric stage/frame, score and session high-score stage/score use custom seven-segment-style LCD numerals.
- Fixed labels and three Xs are drawn as permanent LCD elements. GAME OVER is a static graphic in the HUD, faint when inactive and dark when enabled.
- Score for aircraft +100, sweeper +150, submarine +200 (tunable).
- **HI SCORE** remembers the highest score and the stage on which that score was first reached. It lasts across new games in the same open page, but is not stored locally or remotely; refreshing the page resets it.

## Originality

This is a non-commercial original homage to a style of LCD games, not a pixel-accurate reproduction. All generated artwork and sound are original. No source assets or original startup melody.
