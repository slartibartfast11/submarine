import Phaser from 'phaser';
import { COLOURS } from './config';

/** Small, ORIGINAL 1-bit sprite masks. No graphics are traced from a real game. */
const MASKS: Record<string, string[]> = {
  player: [
    '..................XX..................',
    '..................XX..................',
    '..............XXXXXXXX................',
    '..............X.XXXX.X................',
    '..............XXXXXXXX................',
    '.............XXXXXXXXXX...............',
    '.....XXXXXXXXXXXXXXXXXXXXXXXXXXXXX....',
    '..XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...',
    '.XX...XX...XX...XX...XX...XX...XXXXX..',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.',
    '..XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX..',
    '.....XXXXXXXXXXXXXXXXXXXXXXXXXXXX.....',
  ],
  plane: [
    '.................................X....',
    '.............................XXXXXXXX.',
    '............XXXXXXXXXXXXXXX.XXXXXXXXX.',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    '..XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX......',
    '............XXXXXXX...................',
    '...............XXXXXXXXXXXXX..........',
    '....................XXXXXXXXXXX.......',
    '.........................XXXXX........',
  ],
  planeBank: [
    '..............................XX......',
    '..........................XXXXXXX.....',
    '.............XXXXXXXXXXXXXXXXXXXXX....',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX..',
    '..XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX......',
    '..........XXXXXXX.....................',
    '.......XXXXXXXXX......................',
    '.......XXXXX..........................',
  ],
  sweeper: [
    '..................XX...........',
    '..................XX...........',
    '.............XXXXXXXXX.........',
    '.............XXXXXXXXXXXXX.....',
    '....XXXXXXXXXXXXXXXXXXXXXXXX...',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXXXXXXXXXXXXXXXX.',
    '....XXXXXXXXXXXXXXXXXXXXXXX...',
  ],
  enemySub: [
    '............XXX...............',
    '............XXX...............',
    '.........XXXXXXXXX............',
    '..XXXXXXXXXXXXXXXXXXXXXXXXXX..',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXXXXXXXXXXXXXXXX.',
    '....XXXXXXXXXXXXXXXXXXXXXX....',
  ],
  missile: [
    '..XX..',
    '.XXXX.',
    '.XXXX.',
    '..XX..',
    '..XX..',
    '..XX..',
    '..XX..',
    '..XX..',
  ],
  // Slender torpedo, not a symmetric lozenge: fins at the tail (left),
  // hollow cylindrical body, rounded nose at the right.
  torpedo: [
    '...XX......................',
    '..XXXXXXXXXXXXXXXXXXXXXXX..',
    'XX.X.....................XX',
    '..XXXXXXXXXXXXXXXXXXXXXXX..',
    '...XX......................',
  ],
  bomb: [
    '..XX..',
    '.XXXX.',
    'XXXXXX',
    'XXXXXX',
    '.XXXX.',
    '..XX..',
  ],
  star: [
    '.....XX.....',
    '.....XX.....',
    'XX...XX...XX',
    '.XXX.XX.XXX.',
    '...XXXXXX...',
    'XXXXXXXXXXXX',
    '...XXXXXX...',
    '.XXX.XX.XXX.',
    'XX...XX...XX',
    '.....XX.....',
    '.....XX.....',
  ],
};

export function installSprites(scene: Phaser.Scene): void {
  for (const [name, mask] of Object.entries(MASKS)) {
    if (scene.textures.exists(name)) continue;
    const pixel = 2;
    const width = Math.max(...mask.map((s) => s.length)) * pixel;
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
