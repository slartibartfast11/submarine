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
  // Smooth sampling for vector-style sprites and text when the canvas scales.
  render: { pixelArt: false, antialias: true, antialiasGL: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MenuScene, BattleScene],
});
