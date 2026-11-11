import Phaser from 'phaser';
import { SCREEN } from './config';
import { paintPrintedBackdrop } from './backdrop-art';

/** Cache the shared, fixed printed backing at twice the game resolution. */
export function drawLcdBackdrop(scene: Phaser.Scene): void {
  const key = 'lcd-printed-backdrop-v1';
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, SCREEN.width * 2, SCREEN.height * 2);
    if (!texture) throw new Error('LCD backdrop unavailable');
    const context = texture.getContext();
    context.scale(2, 2);
    paintPrintedBackdrop(context);
    texture.refresh();
  }
  scene.add
    .image(SCREEN.width / 2, SCREEN.height / 2, key)
    .setDisplaySize(SCREEN.width, SCREEN.height)
    .setDepth(-10);
}
