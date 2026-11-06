import Phaser from 'phaser';
import { COLOURS, LIVES, SCREEN, type BestRun, type GameMode, type StageNumber } from './config';

// Hand-drawn seven-segment numerals. Even inactive segments are faintly
// visible, as if this were a real fixed-segment monochrome LCD.
const DIGITS: Record<string, string> = {
  '0': 'abcedf', '1': 'bc', '2': 'abged', '3': 'abgcd',
  '4': 'fgbc', '5': 'afgcd', '6': 'afgecd', '7': 'abc',
  '8': 'abcdefg', '9': 'abfgcd', '-': 'g',
};
const OFF = 0xaebaa9;

function staticLabel(scene: Phaser.Scene, x: number, y: number, value: string, fontSize: number, color = '#52634e'): Phaser.GameObjects.Text {
  return scene.add.text(x, y, value, {
    fontFamily: 'monospace',
    fontSize: `${fontSize}px`,
    fontStyle: 'bold',
    color,
  }).setDepth(22).setResolution(2);
}
function segment(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  g.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
}
function lcdDigit(g: Phaser.GameObjects.Graphics, char: string, x: number, y: number, scale: number): void {
  const segments = DIGITS[char] ?? '';
  const thick = 3 * scale;
  const horiz = 12 * scale;
  const height = 12 * scale;
  const specs: Record<string, [number, number, number, number]> = {
    a: [3, 0, horiz, thick],
    g: [3, height, horiz, thick],
    d: [3, height * 2, horiz, thick],
    f: [0, thick, thick, height - thick],
    b: [horiz + 3, thick, thick, height - thick],
    e: [0, height + thick, thick, height - thick],
    c: [horiz + 3, height + thick, thick, height - thick],
  };
  for (const [key, [dx, dy, w, h]] of Object.entries(specs)) {
    g.fillStyle(segments.includes(key) ? COLOURS.dark : OFF,
      segments.includes(key) ? 1 : 0.35);
    segment(g, x + dx * scale, y + dy * scale, w * scale, h * scale);
  }
}
function lcdString(g: Phaser.GameObjects.Graphics, value: string, x: number, y: number, scale = 1): void {
  for (const char of value) {
    lcdDigit(g, char, x, y, scale);
    x += 22 * scale;
  }
}
function lifeX(g: Phaser.GameObjects.Graphics, x: number, y: number, active: boolean): void {
  g.lineStyle(7, active ? COLOURS.dark : OFF, active ? 1 : 0.55);
  g.lineBetween(x, y, x + 20, y + 20);
  g.lineBetween(x + 20, y, x, y + 20);
}

/** Permanent physical-looking HUD: digits change; etched text only lights up. */
export class LcdHud {
  private readonly pixels: Phaser.GameObjects.Graphics;
  private readonly gameOverField: Phaser.GameObjects.Text;
  private lastState = '';

  constructor(scene: Phaser.Scene, mode: GameMode) {
    const panel = scene.add.graphics().setDepth(20);
    panel.fillStyle(COLOURS.background).fillRect(0, 0, SCREEN.width, SCREEN.hudHeight);
    panel.lineStyle(2, COLOURS.dark, 0.75).lineBetween(0, SCREEN.hudHeight, SCREEN.width, SCREEN.hudHeight);
    staticLabel(scene, 116, 16, 'SCORE', 17);
    staticLabel(scene, 18, 54, 'HI SCORE', 16);
    staticLabel(scene, 804, 59, mode.toUpperCase(), 13, '#6b7d69');
    this.gameOverField = staticLabel(scene, 710, 14, 'GAME OVER', 25, '#acb9a8');
    this.pixels = scene.add.graphics().setDepth(21);
  }

  render(cycle: number, stage: StageNumber, score: number, lives: number, best: BestRun, gameOver: boolean): void {
    const state = [cycle, stage, score, lives, best.cycle, best.stage, best.score, gameOver].join(':');
    if (state === this.lastState) return;
    this.lastState = state;
    this.pixels.clear();
    lcdString(this.pixels, `${cycle}-${stage}`, 16, 12, 0.9);
    lcdString(this.pixels, String(score).padStart(5, '0'), 206, 12, 0.9);
    // These Xs record lost submarines, not remaining submarines.
    // Start with three ghosted outlines; illuminate them left-to-right on losses.
    for (let i = 0; i < LIVES; i++) lifeX(this.pixels, 476 + 39 * i, 17, i < LIVES - lives);
    lcdString(this.pixels, `${best.cycle}-${best.stage}`, 166, 54, 0.64);
    lcdString(this.pixels, String(best.score).padStart(5, '0'), 259, 54, 0.64);
    this.gameOverField.setColor(gameOver ? '#26372d' : '#acb9a8');
  }
}
