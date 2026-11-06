# Gameplay — v0.2.6

## Classic: original LCD geometry and time

- **6 × 6 shared logical field**: six columns; three aircraft rows, one surface-vessel row, and two underwater submarine rows. Aircraft, surface vessels and submarines use the same horizontal columns.
- Aircraft and surface boats hold each displayed position for **four shared clock ticks** before advancing one horizontal cell. Aircraft can also vary their altitude by one row when stepping, but never hover or reverse. The clock starts around 145 ms/tick and accelerates on later cycles.
- Missiles, bombs, charges and torpedoes move on the same clock, but occupy a **12 × 12 half-cell projectile lattice**. They advance one half-cell on each tick.
- Classic aircraft have distinct sorties: some are **reconnaissance-only** and never release bombs. Attack aircraft can have **up to two bombs in flight simultaneously**; released bombs persist if the aircraft leaves or is destroyed. These probabilities and caps are gameplay tuning values, not confirmed original ROM limits.
- A released bomb takes one of three discrete trajectories: straight down; intermittent diagonal half-cell steps; or straight through the sky then a lateral step every other tick **after entering the surface/water row**. Bomb paths are fixed when released, not homing.
- Whole-cell sprites are hit by projectiles in **either half of that cell**, including fore/aft halves relative to aircraft travel. An upward missile and falling bomb/charge intercept if they are in the **same half-column or one immediately adjacent half-column** (e.g. missile at 7 hits bombs at 6, 7 or 8) when their vertical positions overlap. They also intercept if they **cross between adjacent vertical tick states**, avoiding parity-based misses. Missiles never travel or fire between the half-cell positions.
- **Classic defensive exception:** if an angled bomb in one immediately neighbouring column is on course to hit the submarine at its current depth in the next few ticks, firing an available upward missile also destroys that incoming bomb on the following tick. This is a deliberately limited LCD-gameplay concession, not a wider missile hitbox: no assist for straight drops, bombs moving away, or distant bombs. Standard single-missile lockout still applies.
- One enemy submarine is visible at a time in Classic. It appears at either edge, fires, may change to the other depth and fire again once its earlier torpedo is gone, and disappears. Its launched torpedoes persist after it vanishes. Each appearance has a finite lifetime; disappearing is not a player kill.
- Both friendly and enemy torpedoes are rendered as thin, **hollow lozenges** rather than solid rectangular segments.
- Classic player torpedoes automatically launch toward the side of the currently visible enemy submarine. When no submarine is visible, X does nothing rather than wasting a torpedo. The submarine still needs to be at the appropriate depth to score a hit.

## Dynamic

- Identical artwork, player controls, stages and scores, with **continuous** movement rather than the Classic clock.
- Planes vary speed and altitude smoothly, bombs may drift, and enemy submarines move vertically at the edges.
- Player torpedoes fire in the submarine's **last horizontal facing direction**, not automatically.
- Collision uses moving, swept sprite rectangles between frames.

## Stage-warp cheat code

- At the menu, or during Classic/Dynamic gameplay (including submarine entry), type `G` followed by a one-digit **cycle** and one-digit **stage**, e.g. `G13`, `G23`, `G33`.
- The submarine stages are **1-3, 2-3, 3-3**. `G21` and `G31` work too, but those are the aircraft stages of cycles 2 and 3.
- Menu warps launch **Classic** directly into the requested stage, skipping the entry animation. In-game warps retain score and lives, reset the target quota, clear the battlefield, and place the player at the bottom-centre starting position. Warping is disabled while exploding and after GAME OVER.

## Gameplay and progression

- Six horizontal player positions, two underwater depths, arrows/WASD to move.
- Space fires one upward missile at a time. X fires one horizontal torpedo at a time starting from stage 1-3. Both weapons have independent projectile slots.
- Every enemy also has one active projectile limit. Shots can outlive their shooter.
- Missiles can intercept falling bombs or depth charges.
- Stage progression is **kill-based**, never time-based:

| Stage | Threats | Target kills to progress in cycle 1 |
| --- | --- | --- |
| 1-1 | Aircraft | 8 aircraft |
| 1-2 | Aircraft + surface sweepers | 4 sweepers |
| 1-3 | All three enemy types | 4 enemy submarines |

Targets increase slightly in later cycles, with faster movement. Other enemies still give points but do not count towards the stage objective.

## Submarine entry, lives and game over

- Three submarines total, with **three initially ghosted fixed X segments**. Each lost submarine lights the next X from left to right. The third illuminated X accompanies GAME OVER.
- New submarine enters at lower depth **column 5 → 4 → 3**, with roughly **2.1 seconds per pose**, plus an original sustained beep. Controls and threats stay inactive during entry.
- On death, explosion freezes the battlefield; a replacement submarine restarts the same stage's kill quota, keeping score and remaining lives.
- Final loss freezes the scene and illuminates the etched GAME OVER field in the top LCD strip. **Esc** returns to the menu; gameplay buttons never restart.

## Score

- Current stage, score and session high score/stage use seven-segment-style digits.
- The high score lasts across games in the same page lifetime but is not persisted.
- Current prototype scores: aircraft 100, surface vessel 150, enemy submarine 200 points.

## Originality

Original non-commercial LCD-inspired game, not a reproduction of the Casio assets or sounds. The cadence and numerical tuning values remain provisional and should be playtested.
