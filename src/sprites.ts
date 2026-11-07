import Phaser from 'phaser';
import { COLOURS } from './config';
import { SPRITE_MASKS } from './sprite-masks';
import { LCD_SEGMENTS, type SegmentPolygon } from './lcd-segments';

// Supersample curves and diagonal edges once at texture creation, then
// display at their original logical LCD size. This avoids stair-stepping on
// non-integer FIT scales, without changing collision geometry.
export const LCD_ETCH_SUPERSAMPLE = 3;

export function createEtchedImage(
  scene: Phaser.Scene, x: number, y: number, name: string,
): Phaser.GameObjects.Image {
  const design = LCD_SEGMENTS[name];
  const image = scene.add.image(x, y, name);
  if (design) image.setDisplaySize(design.width, design.height);
  return image;
}

/** Fill a closed polygon on a generated, transparent LCD sprite texture. */
function fillPolygon(ctx: CanvasRenderingContext2D, points: SegmentPolygon): void {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Static silhouettes mimic independently etched physical LCD masks.
 * There are no bitmap squares in these six sprites, and we never copy any
 * original game's artwork. Apertures are genuinely transparent, not painted
 * with the scene background colour.
 */
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

  for (const [name, etch] of Object.entries(LCD_SEGMENTS)) {
    if (scene.textures.exists(name)) continue;
    const texture = scene.textures.createCanvas(
      name, etch.width * LCD_ETCH_SUPERSAMPLE, etch.height * LCD_ETCH_SUPERSAMPLE,
    );
    if (!texture) throw new Error(`Unable to create LCD segment texture: ${name}`);
    const ctx = texture.getContext();
    ctx.scale(LCD_ETCH_SUPERSAMPLE, LCD_ETCH_SUPERSAMPLE);
    ctx.fillStyle = `#${COLOURS.dark.toString(16).padStart(6, '0')}`;
    for (const polygon of etch.ink) fillPolygon(ctx, polygon);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000000';
    for (const aperture of etch.clear) fillPolygon(ctx, aperture);
    ctx.globalCompositeOperation = 'source-over';
    texture.refresh();
  }
}
