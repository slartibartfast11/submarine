import Phaser from 'phaser';
import { COLOURS } from './config';
import { SPRITE_MASKS } from './sprite-masks';

/** Render original monochrome LCD segment masks into Phaser textures. */
export function installSprites(scene: Phaser.Scene): void {
  for (const [name, mask] of Object.entries(SPRITE_MASKS)) {
    if (scene.textures.exists(name)) continue;
    const pixel = 2;
    const width = mask[0].length * pixel;
    const height = mask.length * pixel;
    const pixels = scene.add.graphics();
    pixels.fillStyle(COLOURS.dark);
    mask.forEach((row, y) => [...row].forEach((char, x) => {
      if (char === 'X') pixels.fillRect(x * pixel, y * pixel, pixel, pixel);
    }));
    pixels.generateTexture(name, width, height);
    pixels.destroy();
  }
}
