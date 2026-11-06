# Gameplay rules — provisional source of truth

## Design pillars

1. Short arcade rounds, quick recognition, constant timing decisions.
2. One active projectile per **weapon**, not rapid fire.
3. Early levels allow stationary defensive play; increasing speed, density and accuracy eventually reward thoughtful dodging. Never punish standing still by fiat.
4. Classic is pattern-based with limited randomness; Dynamic is an imperfectly reactive version of the exact same game.
5. Readability and fair escape routes take priority over simulated military realism.

## Player

- Eight horizontal columns (a *deliberate expansion* beyond the source game), two depth lanes.
- Left/right shift one column, up/down select depth lane. In the first prototype, the last horizontal direction also selects the firing direction for torpedoes (to be playtested).
- `Space`: missile vertically upward at the current X.
- `X`: torpedo horizontally left or right from the current lane. Available from 1-3.
- Player may simultaneously have one missile **and** one torpedo in flight. The missile doesn't lock the torpedo or vice versa.
- A missile/torpedo slot becomes free after its projectile collides, exits the field, or otherwise expires.

## Stages

| Stage | Threats | Player weapon |
| --- | --- | --- |
| 1-1 | Overhead aircraft dropping mostly random bombs | Missile |
| 1-2 | Aircraft plus surface sweepers dropping charges | Missile |
| 1-3 | Above plus enemy submarines at left and right edges | Missile and torpedo |
| 2-1 onward | Repeat 1–3 with faster/more demanding attacks | Same |

Enemy submarines travel **up and down at the edges**, never horizontally approach the player. Their danger is firing while the player is occupied elsewhere.

## Weapon lockout / collision

- Every enemy combatant has one active projectile slot. An enemy cannot fire again until its projectile hits/exits/expires.
- Fired projectiles continue even if the shooter is destroyed.
- Player missiles intercept bombs and depth charges when their sprite boxes overlap; both projectiles resolve with a small explosion.
- Projectiles must actually intersect targets. A missile must not explode early, and a bomb must originate at a visible enemy.
- Classic projectiles follow fixed directions; modern projectiles may have limited drift, but **player missiles remain straight up and player torpedoes horizontal**.
- **Gridular collision:** use whole rectangular sprite hitboxes, not opaque-pixel masks or pixel-perfect art collisions. In Classic mode, a missile and bomb that occupy overlapping character boxes are a hit, even if drawn pixels would narrowly miss.
- Check swept box paths between ticks so fast opposing projectiles cannot pass through one another without registering a hit. Render quantisation does not change collision results.

## Mode details

**Classic:** Enemies follow fixed lines/lanes, with stepped rendering and limited random bomb timings. No tracking or homing shots. Difficulty mostly speed/density. Standing still can work at the start.

**Dynamic:** Same world and same constrained player. Planes can accelerate/decelerate and vary altitude, surface boats vary speed, submarines transition fluidly between depths but remain on side edges. Bomb accuracy is probabilistic and can respond to the *last revealed firing column*, which decays; enemies do not continuously know your location. No perfectly targeted volleys or unavoidable projectile walls.

## Prototyping choices (not verified from original hardware)

- Three hull lives.
- Each stage lasts 35 seconds before cycling.
- Hit scores: plane +100, sweeper +150, submarine +200.
- Torpedo launches in the last horizontal movement direction.
- Enemy firing rates/speeds, hitboxes and invulnerability are placeholder tuning values.
- Sprite-box collisions and swept movement checks prevent missed hits between simulation ticks. Fine-tune hitbox dimensions and collision priority through playtesting.

These details should change after playtesting rather than be mistaken for authoritative Casio behaviour.
