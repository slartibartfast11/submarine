# Visual design and rendering

For gameplay invariants and implementation ownership, see [the gameplay manifest](manifest.md).

## Display

- Logical resolution: **960 × 540** (see `SCREEN` in `src/config.ts`), scaled to fit the browser viewport.
- Background: pale sage (`#d5dac8`); active LCD shapes: dark olive (`#26372d`).
- Renderer: Phaser with pixel-art filtering disabled and antialiasing enabled.
- Fixed backdrop: 2×-resolution canvas texture in `src/lcd-background.ts`, with faint curved clouds, a continuous waterline, depth guides and seabed contours.
- HUD: seven-segment-style score digits with faint inactive segments, proportional text labels and three X indicators for lost submarines.

## Sprite assets

- `src/curved-art.ts`: player submarine, enemy submarine, surface escort and bombs. Each sprite defines filled and transparent `Path2D` shapes with Bézier curves.
- `src/lcd-segments.ts`: polygon-defined aircraft, missile, torpedo and filled directional-drop masks. Aircraft textures are `plane` (level profile), `planeBankRight`, `planeBankLeft` and `planeClimb` (oblique underside).
- `src/sprite-masks.ts`: the one remaining square-pixel mask, used for the impact starburst.
- `src/sprites.ts`: rasterises curved paths and polygons at **3×** logical sprite resolution. The resulting textures are displayed at their logical widths and heights.
- The four aircraft poses are independently authored fixed silhouettes, with no frame-by-frame pixel animation.
- Falling bombs with lateral trajectories use a solid torpedo-shaped `angledBomb` mask, rotated toward their left or right drift. Straight-falling bombs and surface-vessel depth charges use the round bomb mask. Sprite choice does not affect projectile physics or hitboxes.

## Motion and interaction

- **Classic:** six horizontal columns shared by three sky rows, one surface row and two underwater rows. Aircraft advance once every four shared clock ticks and surface escorts once every eight ticks. Aircraft altitude changes select a fixed silhouette; a blocked altitude change uses the actual resulting row.
- **Modern:** sprites retain the same artwork while enemies move continuously. Aircraft use fixed level, climb and bank textures during smooth vertical movement.
- Missiles travel vertically and torpedoes horizontally. Projectile collisions use logical hitboxes rather than opaque-pixel sampling; see `src/collision.ts` and `src/classic-grid.ts`.
- Entry sound: three short WebAudio oscillator chirps, one per submarine entry position.

## Credits and sources

The game is inspired by Casio's *Submarine Battle*. The human designer supplied the gameplay and visual direction; the code and custom in-game graphics were generated with AI under the designer's review. No original Casio graphics or sound assets are used.
