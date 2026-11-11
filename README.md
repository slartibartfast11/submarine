# Submarine

A browser game inspired by Casio's *Submarine Battle*. Defend your submarine against aircraft, surface ships and enemy submarines. Intercept their weapons before they reach you.

**[Play Submarine](https://slartibartfast11.github.io/submarine/)**

Hi Score is remembered on this device; no accounts or tracking.

Two ways to play: **Classic** has the stepped movement and fixed silhouettes of an LCD handheld; **Modern** gives enemies smoother movement. Both have the same rules and controls.

## Controls

| Key | Action |
| --- | --- |
| `1` / `2` | Start Classic / Modern |
| Arrow keys / `W A S D` | Move left, right or between the two depths |
| `Space` | Fire a missile |
| `X` | Fire a torpedo (submarine stages only) |
| `M` | Sound on / off |
| `Esc` | Pause / menu |

On phones and tablets, use the on-screen controls. Landscape orientation gives more room to play.

Missiles destroy aircraft and surface ships; torpedoes destroy enemy submarines. You can fire one of each at a time, and both can intercept enemy weapons.

Each cycle has three stages: **Air Attack**, **Surface Sweepers**, and **Enemy Submarines**. Clear each stage by destroying its required targets. You start with three submarines and earn a replacement life every 10,000 points.

For more detail, see [How to play](docs/gameplay-rules.md).

## Development

Built with Phaser 3, TypeScript and Vite.

```sh
npm install
npm run dev
```

Run tests and build:

```sh
npm test
npm run build
```

For development reference, see the [gameplay manifest](docs/manifest.md) and [visual design notes](docs/visual-design.md).

## Credits

Inspired by Casio's *Submarine Battle*. This is an independent project, not affiliated with or endorsed by Casio.

Sound presets made with [Gufobyte SFX Lab](https://gufobyte.itch.io/sfx-lab). Submarine uses its own synthesizer to play them.

## Licence

MIT. See [LICENSE](LICENSE).
