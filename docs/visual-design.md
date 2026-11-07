# Visual design — imaginary LCD submarine game

## Vision

An original browser game that looks like a lovingly designed imaginary 1985–1990 monochrome LCD handheld, **not** a reproduction of any particular model. Classic and Dynamic must be visually recognisable as the same game.

## Screen

- One fixed-aspect-ratio rectangular playfield.
- Warm, desaturated pale sage-green display; nearly black olive pixels and optionally one lighter muted olive tone.
- Static, individually designed dark LCD etch silhouettes on a pale panel — **not** an animated low-resolution bitmap display. No gradients, glows, damage overlays, heavy scanlines or modern visual effects.
- Sky: planes crossing horizontally with original level-flight and banking sprites; very understated clouds and mountains.
- Waterline: strong, slightly jagged separator near mid-screen.
- Underwater: submarine on one of **six** horizontal positions and **two** depth lanes; unobtrusive seabed stones and plants.
- HUD: top-left `1-1`, top-right score and minimal game state, monochrome pixel/monospace type.

## Sprites / motion

- Aircraft use four original etched LCD fighter-bomber masks: **profile level flight**, **right bank/dive**, an independently drawn **left bank/dive**, and an oblique underside **high-G climb**. All have narrow pointed noses, swept fighter wings and restrained hints of underwing stores. They are interpreted from the design-study references, not pixel-traced from generated images or the original game.
- Player submarine retains its existing compact, slightly whimsical silhouette with tower/periscope/portholes. Enemy submarine has an offset conning tower and distinct hull profile. The surface escort has a visible bridge, mast and deck detail.
- Six geometric etched silhouettes are drawn from deliberately shaped polygons with transparent apertures. The narrow upward dart is 12×18 px; the hollow finned torpedo is 26×8 px. No square-pixel raster texture construction for those six elements. Missiles launch **vertically upward**, fixed X at launch. Never diagonal or homing, including Dynamic mode.
- Torpedoes move **horizontally** toward side-of-screen submarines.
- Enemy bombs originate at aircraft; sweeper charges originate at sweepers; they fall visibly.
- Hit effects occur **only upon real collision**, use two or three jagged pixel starburst poses.
- Classic: stepped motion and one fixed pose per logical altitude change: same altitude = profile, descending = banking/dive attitude based on direction, ascending = underside climb. On a clamped altitude step, use the *actual* row change rather than the attempted delta. Simulation may still update more frequently for accurate collisions.
- Dynamic: the same four authored attitudes chosen by climb/descent phase, while position and altitude vary fluidly. This can be enhanced with intermediate animation later.

## Authenticity and originality

Draw our own ships, planes, submarine, HUD, environment and sounds. Do not import/copy original game textures, screen bezel, startup melody or branding. The project is a non-commercial homage to a *genre* of LCD handheld game, not a source-accurate remake.

## First playable prototype limitations

The player submarine, bomb and starburst retain their existing 1-bit masks. Aircraft, ships and weapons use flat filled polygons and transparent apertures composited into static Phaser textures, for a physical fixed-segment-LCD effect. An original three-chirp WebAudio entry signal replaces the sustained electronic tone. No sampled sounds or background music yet. Camera shake, particles, and rich animation are deliberately excluded.
