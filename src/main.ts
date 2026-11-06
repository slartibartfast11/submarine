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
  render: { pixelArt: true, antialias: false },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MenuScene, BattleScene],
});
