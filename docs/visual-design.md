# Visual design — imaginary LCD submarine game

## Vision

An original browser game that looks like a lovingly designed imaginary 1985–1990 monochrome LCD handheld, **not** a reproduction of any particular model. Classic and Dynamic must be visually recognisable as the same game.

## Screen

- One fixed-aspect-ratio rectangular playfield.
- Warm, desaturated pale sage-green display; nearly black olive pixels and optionally one lighter muted olive tone.
- Crisp original low-resolution pixel sprites, minimal decoration, no gradients, glows, damage overlays, heavy scanlines or modern visual effects.
- Sky: planes crossing horizontally with original level-flight and banking sprites; very understated clouds and mountains.
- Waterline: strong, slightly jagged separator near mid-screen.
- Underwater: submarine on one of **eight** horizontal positions and **two** depth lanes; unobtrusive seabed stones and plants.
- HUD: top-left `1-1`, top-right score and minimal game state, monochrome pixel/monospace type.

## Sprites / motion

- Aircraft are chunky original side-view silhouettes; distinct level and banking poses.
- Player submarine is compact, slightly whimsical with tower/periscope/portholes.
- Missiles launch **vertically upward**, fixed X at launch. Never diagonal or homing, including Dynamic mode.
- Torpedoes move **horizontally** toward side-of-screen submarines.
- Enemy bombs originate at aircraft; sweeper charges originate at sweepers; they fall visibly.
- Hit effects occur **only upon real collision**, use two or three jagged pixel starburst poses.
- Classic: stepped motion and sparse animation; simulation may still update more frequently for accurate collisions.
- Dynamic: same assets, but velocity, altitude and timing may vary fluidly. No graphical overhaul.

## Authenticity and originality

Draw our own ships, planes, submarine, HUD, environment and sounds. Do not import/copy original game textures, screen bezel, startup melody or branding. The project is a non-commercial homage to a *genre* of LCD handheld game, not a source-accurate remake.

## First playable prototype limitations

The current prototype uses code-generated 1-bit masks; their design is a starting point. No music or sampled sound yet. Camera shake, particles, and rich animation are deliberately excluded.
