# Submarine

A browser game inspired by *Submarine Battle* by Casio.

Defend your submarine against aircraft, surface ships and enemy submarines. Use missiles against targets above the water and torpedoes against enemies below.

**[Play Submarine](https://slartibartfast11.github.io/submarine/)** in your browser. No installation required.

The title screen uses the project's original *Submarine Battle Beneath the Waves* cover illustration. All imagery is bundled locally; the game requires no network assets beyond the initial page load.

## Controls

| Key | Action |
| --- | --- |
| `1` / `2` | Start **Classic** / **Modern** |
| Arrow keys / `W A S D` | Move between six positions and two depths |
| `Space` | Fire a missile |
| `X` | Fire a torpedo (stage 3 of each cycle) |
| `Esc` | Main menu |

On phones and tablets, use the on-screen direction pad and weapon buttons; tap **Classic** or **Modern** to start. Hold left or right to move through multiple columns. Landscape orientation gives the largest playfield. Keyboard controls remain available on devices with a keyboard.

One missile and one torpedo can be in flight simultaneously. Each weapon has a separate lockout until its previous shot resolves.

**Classic** uses fixed grid positions, discrete movement ticks and fixed aircraft attitudes. **Modern** uses continuous enemy movement and smooth altitude changes. Both modes use the same controls and stage progression.

Stages progress from aircraft (1-1), to surface ships (1-2), then enemy submarines (1-3). Destroy the designated targets to advance. You start with three submarines.

**Testing:** type `G13`, `G23` or `G33` at the menu or during gameplay to jump to a submarine stage. `G21` and `G31` select later aircraft stages. Warps are disabled after game over.

Read [how to play](docs/gameplay-rules.md) for the rules, [the gameplay manifest](docs/manifest.md) for implementation constraints, and [visual design](docs/visual-design.md) for rendering specifications.

## Development

Built with Phaser 3, TypeScript and Vite.

```sh
npm install
npm run dev
```

To run tests and create a production build:

```sh
npm test
npm run build
```

Changes to `main` are built and deployed to GitHub Pages by GitHub Actions.

## Credits and provenance

**This is an AI-coded game.** The human designer supplied the game ideas, gameplay rules and logic, and art direction, and reviewed the iterations. AI generated the game code and in-game digital artwork under that direction.

### How it was built

The designer specified the rules, gameplay behaviour and art direction, using screenshots and footage of Casio's *Submarine Battle* as references. AI produced code and artwork for each revision; the designer played the game, compared its behaviour and appearance with the reference, and directed corrections. Automated tests and builds checked the implementation alongside that hands-on playtesting.

This is an independent, non-commercial project inspired by *Submarine Battle* by Casio. It is not affiliated with or endorsed by Casio. No original Casio game artwork or audio is included.

## Licence

MIT for the project code and artwork. See [LICENSE](LICENSE).
