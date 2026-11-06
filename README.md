# Submarine

An original, non-commercial browser arcade game celebrating the design language of late-1980s monochrome LCD handhelds. **Not a recreation of Casio Submarine Battle.** All game artwork and sound will be original.

## Play locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the address printed by Vite (normally `http://localhost:5173/`).

**Controls:** `1` Classic / `2` Dynamic at title screen. During play: arrows or WASD move the submarine across **eight columns and two depth lanes**; `Space` fires a vertical missile; `X` fires a torpedo (available from stage 1-3); `Esc` returns to menu; `R` restarts after game over.

## First playable slice

- Endless `1-1` planes → `1-2` add sweepers → `1-3` add enemy submarines, then `2-1` faster, and so on.
- Original 1-bit art, sage LCD palette, fixed waterline, sparse scenery.
- Classic: stepped movement, fixed enemy paths with somewhat random release timing.
- Dynamic: same sprites, smoother motion, moderate speed/altitude variation and imperfect aim.
- Player fires **one active missile and one active torpedo independently**. Each individual enemy can have **one active projectile**.
- Missiles always launch *vertically*, torpedoes *horizontally*; collision is calculated in the game world, not by comparing rendered sprite frames.
- Eight horizontal positions are deliberate, not a historic hardware constraint.

This is an **early playable tuning prototype**, not a faithful historical ruleset. Stage lengths, firing frequencies, hitboxes and torpedo targeting require playtesting. No borrowed sound effects or music.

## Build

```sh
npm run typecheck
npm run build
npm run preview
```

## GitHub Pages

1. Use the [`slartibartfast11/submarine`](https://github.com/slartibartfast11/submarine) repository.
2. Keep game changes on the default `main` branch or merge them via pull requests.
3. GitHub repo Settings → Pages → Build and deployment → Source: **GitHub Actions**, not **Deploy from a branch**.
4. Push to `main`; the included workflow builds and publishes `dist`.

The Vite configuration uses a relative base, so a project site under `/<repo>/` works. **If Pages displays source HTML rather than the game, change the Pages source to GitHub Actions and re-run the failed deploy workflow.**

## Specs

- [Visual design brief](docs/visual-design.md)
- [Gameplay and behavioural rules](docs/gameplay-rules.md)

## Licence

MIT for code (see `LICENSE`). Original generated sprites are provided under the same terms; third-party source art/audio is not included.
