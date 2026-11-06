# Submarine

An original, free, non-commercial arcade game inspired by the monochrome LCD handhelds of the late 1980s. A tiny submarine, two weapons, and an increasingly crowded sea and sky.

## Play

**[Play Submarine in your browser](https://slartibartfast11.github.io/submarine/)**

No installation or account required. Use a keyboard to play.

| Key | Action |
| --- | --- |
| `1` or `2` | Choose **Classic** or **Dynamic** at the title screen |
| Arrow keys or `W` `A` `S` `D` | Move between six horizontal positions and two depths |
| `Space` | Launch a missile straight upward |
| `X` | Fire a torpedo left or right (unlocks at stage 1-3) |
| `Esc` | Return to the menu (including after game over) |

Your submarine can have **one missile and one torpedo in flight at once**, but cannot fire another of the same type until the previous shot resolves. Missiles can also intercept falling bombs and depth charges.

## Game modes

**Classic** — A 6×6 LCD field (three sky rows, one surface row and two submarine depths). Planes and boats hold their position for four clock ticks before stepping to the next column; projectiles use a finer half-cell grid, with fore/aft hits. Enemy submarines appear briefly to attack, and Classic torpedoes automatically choose their side.

**Dynamic** — The same monochrome world, brought to life with fluid movement, variable speeds and enemies that respond imperfectly to your position.

The stages cycle from overhead aircraft (**1-1**), to aircraft and surface sweepers (**1-2**), then enemy submarines and torpedoes (**1-3**). **Destroy the stage's target enemies to advance**; simply surviving never advances the stage. Each new cycle increases the pace.

You have three submarines, displayed as LCD Xs. When one is lost, the replacement enters from the right and restarts the same stage. On the final loss, the battlefield freezes and the etched GAME OVER lettering lights up; use **Esc** to return to the menu. The LCD banner also shows a high score for this open page (not stored permanently).

This is version 0.2.2, an early, playable work in progress. Gameplay, balance and artwork are still evolving.

## About

Submarine is an affectionate nod to the *design language* of classic electronic handheld games, not a reproduction of Casio Submarine Battle. The sprites, interface and gameplay implementation are original. No original game artwork or audio is included.

## Development

Built with [Phaser 3](https://phaser.io/), TypeScript and Vite. Requires Node.js 20.19+ or 22.12+ to develop locally.

```sh
npm install
npm run dev
```

For tests and a production build:

```sh
npm test
npm run build
npm run preview
```

The public site is automatically built and published to GitHub Pages when changes land on `main`.

### Design documentation

- [Visual design](docs/visual-design.md)
- [Gameplay rules and behaviour](docs/gameplay-rules.md)

## Licence

MIT for the code and project artwork. See [LICENSE](LICENSE).
