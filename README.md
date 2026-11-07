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
| `X` | Fire a torpedo left or right (unlocks at stage 1-3 and stays unlocked) |
| `Esc` | Return to the menu (including after game over) |

**Stage warp for testing:** type `G13` at the menu or during a run to jump directly to the first enemy-submarine stage. `G23` and `G33` test later submarine stages; `G21` and `G31` jump to the corresponding aircraft stages. Stage warps don't reset the score or remaining submarines during a run, and cannot be used after game over.

Your submarine can have **one missile and one torpedo in flight at once**, but cannot fire another of the same type until the previous shot resolves. Missiles can also intercept falling bombs and depth charges.

## Game modes

**Classic** — A 6×6 LCD field (three sky rows, one surface row and two submarine depths). Planes hold their pose for four clock ticks and slower surface vessels for eight ticks before stepping to the next column; projectiles use a finer half-cell grid, with fore/aft hits and adjacent half-column missile/bomb interceptions. Enemy submarines may appear as silent decoys or attack once/twice, and Classic torpedoes aim towards a visible target (or follow your last facing direction if there isn't one). Some aircraft merely reconnoitre; others can release multiple independently travelling bombs, including diagonal and waterline-turning drops. A precisely timed vertical missile can also intercept a diagonal bomb threatening the submarine from an immediately adjacent cell.

**Dynamic** — The same monochrome world, brought to life with fluid movement, variable speeds and enemies that respond imperfectly to your position. Enemy submarines now settle on the two exact depth rows instead of hovering between them. Both modes have slower, compact hollow torpedoes that can intercept one another.

The stages cycle from overhead aircraft (**1-1**), to aircraft and surface sweepers (**1-2**), then enemy submarines and torpedoes (**1-3**). **Destroy the stage's target enemies to advance**; simply surviving never advances the stage. Each new cycle increases the pace.

You have three submarines; each loss lights another ghosted LCD X. When one is lost, the replacement enters on the lower row from the right and restarts the same stage. On the final loss, the battlefield freezes and the etched GAME OVER lettering lights up; use **Esc** to return to the menu. The LCD banner also shows a high score for this open page (not stored permanently).

The original one-bit sprite artwork has been refined with a patrol aircraft, banked aircraft, deckhouse-and-mast surface vessel, and a compact enemy submarine. The player submarine is unchanged. On arrival, three short original electronic chirps accompany the three submarine positions instead of a sustained tone.

Version 0.2.9 redraws the aircraft, surface escort, enemy submarine, upward missile and torpedo as original **fixed, polygon-etched LCD segments** rather than low-resolution square-pixel sprites. The player submarine, explosions and other gameplay behaviour remain unchanged.

Version 0.3.0 gives aircraft four original fixed LCD etched attitudes: compact profile level flight, independently drawn right and left bank/dive views, and an oblique underside high-G climb. Classic selects the pose from actual discrete altitude changes; Dynamic changes these attitudes during continuous altitude movement. The rest of the game art, physics, sound and score rules remain as they were.

Version 0.3.1 removes the old forced pixel-art rendering mode, enables smooth antialiasing for responsive LCD scaling, renders geometric etch textures at 3× their displayed size, and raises the internal text texture resolution. Artwork, flight logic, sound, and hitbox dimensions remain unchanged.

This is version 0.3.1, an early, playable work in progress. Gameplay, balance and artwork are still evolving.

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
