import Phaser from 'phaser';

export function addLabel(
  scene: Phaser.Scene, x: number, y: number, contents: string, size: number, colour = '#26372d',
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, contents, {
    fontFamily: 'Arial, Helvetica, sans-serif', fontStyle: '600',
    fontSize: `${size}px`, color: colour,
  }).setResolution(3);
}
