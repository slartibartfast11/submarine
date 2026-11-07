import Phaser from 'phaser';
import { BattleScene, MenuScene } from './scenes';
import { COLOURS, SCREEN } from './config';
import './style.css';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: SCREEN.width,
  height: SCREEN.height,
  backgroundColor: COLOURS.background,
  // LCD silhouettes and lettering are smooth native geometry, not a
  // low-resolution framebuffer. Nearest-neighbour filtering caused shimmer
  // when the FIT-scaled canvas occupied fractional CSS pixels.
  render: { pixelArt: false, antialias: true, antialiasGL: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MenuScene, BattleScene],
});
