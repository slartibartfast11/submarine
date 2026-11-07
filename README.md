# Submarine

A browser game inspired by *Submarine Battle* by Casio.

Defend your submarine against aircraft, surface ships and enemy submarines. Use missiles against targets above the water and torpedoes against enemies below.

Play **[Submarine](https://slartibartfast11.github.io/submarine/)** in your browser. No installation required.

## Controls

| Key | Action |
| --- | --- |
| `1` / `2` | Start **Classic** / **Modern** |
| Arrow keys / `W A S D` | Move between six positions and two depths |
| `Space` | Fire missile |
| `X` | Fire torpedo (unlocks at stage 1-3) |
| `Esc` | Main menu |

You can have one missile and one torpedo in flight at the same time. You cannot launch another of the same type until the previous shot is gone.

**Classic** uses fixed LCD positions and discrete flight attitudes. **Modern** uses smoother movement and more varied enemy behaviour.

Stages progress from aircraft (1-1), to surface ships (1-2), then enemy submarines (1-3). Destroy the stage's targets to advance. You have three submarines.

For testing, type `G13`, `G23` or `G33` to jump to a submarine stage. The code also works during gameplay. `G21` and `G31` select aircraft stages.

## Development

Built with Phaser 3, TypeScript and Vite.

```sh
npm install
npm run dev
```

Run `npm test` and `npm run build` before publishing. The `main` branch is deployed automatically to GitHub Pages.

See [visual design](docs/visual-design.md) and [gameplay rules](docs/gameplay-rules.md) for implementation notes.

## About

An independent, non-commercial tribute with original artwork and code. Not affiliated with or endorsed by Casio.

## Licence

MIT for the code and project artwork. See [LICENSE](LICENSE).
