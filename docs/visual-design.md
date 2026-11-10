# Visual design and rendering

For gameplay invariants and implementation ownership, see [the gameplay manifest](manifest.md).

## Title screen

- Display `public/cover.webp` uncropped at its original aspect ratio.
- Centre **Classic** and **Modern** mode buttons beneath it; both are tappable.
- Keep the title art separate from the monochrome gameplay canvas.

## Display

- Logical resolution: **960 × 540** (see `SCREEN` in `src/config.ts`), scaled to fit the browser viewport.
- Background: pale sage (`#d5dac8`); active LCD shapes: dark olive (`#26372d`).
- Renderer: Phaser with pixel-art filtering disabled and antialiasing enabled.
- Fixed backdrop: 2×-resolution canvas texture in `src/lcd-background.ts`, with faint curved clouds, a continuous waterline, depth guides and seabed contours.
- HUD: seven-segment-style score digits with faint inactive segments, proportional text labels and three X indicators for lost submarines.

## Sprite assets

- `src/curved-art.ts`: player submarine, enemy submarine, surface escort and bombs. Each sprite defines filled and transparent `Path2D` shapes with Bézier curves.
- `src/lcd-segments.ts`: polygon-defined aircraft, missile, torpedo and filled directional-drop masks. Aircraft textures are `plane` (level profile), `planeBankRight`, `planeBankLeft` and `planeClimb` (oblique underside).
- `src/debris-art.ts`: destruction etches for the aircraft, surface escort, enemy submarine and player submarine.
- `src/sprite-masks.ts`: the one remaining square-pixel mask, reserved for projectile-interception starbursts.
- `src/sprites.ts`: rasterises curved paths and polygons at **3×** logical sprite resolution. The resulting textures are displayed at their logical widths and heights.
- Each aircraft pose is a fixed silhouette, not a frame-by-frame animation.
- Falling bombs with lateral trajectories use a solid torpedo-shaped `angledBomb` mask, rotated toward their left or right drift. Straight-falling bombs and surface-vessel depth charges use the round bomb mask. Sprite choice does not affect projectile physics or hitboxes.

## Destroyed-vessel glyphs

- Aircraft destroyed: nearly all recognizable airframe disappears into a ragged cloud of distinct small fragments, with only tiny nose/tail remnants.
- Surface escort destroyed: detached bow/gun, displaced bridge/mast and separated aft section; no generic burst.
- Enemy submarine destroyed: central hull rupture with only two rounded endcaps and a broad scatter of smaller fragments.
- Player submarine lost: split bow and stern sections, detached sail and several jagged chunks, preserving the original porthole and propeller cues.
- Enemy debris holds for **230 ms** and fades over **140 ms**. Player submarine debris holds for **690 ms** and fades over **420 ms**; respawn or GAME OVER follows after the glyph clears. Only projectile-to-projectile interceptions use the original starburst.

## Motion and interaction

- **Classic:** six horizontal columns shared by three sky rows, one surface row and two underwater rows. Aircraft advance once every four shared clock ticks and surface escorts once every eight ticks. Aircraft altitude changes select a fixed silhouette; a blocked altitude change uses the actual resulting row.
- **Modern:** sprites retain the same artwork while enemies move continuously. Aircraft use fixed level, climb and bank textures during smooth vertical movement.
- Missiles travel vertically and torpedoes horizontally. Projectile collisions use logical hitboxes rather than opaque-pixel sampling; see `src/collision.ts` and `src/classic-grid.ts`.
- Entry sound: three short WebAudio oscillator chirps, one per submarine entry position.
- Procedural effects for launch, interception, enemy destruction, incoming weapons and player loss come from editable sound presets. A surface escort sounds once when it appears; a restored life triggers a reward after the kill; GAME OVER sounds after the final player explosion. Alternate missile/torpedo launches and aircraft approach/dive effects remain inactive drafts.

