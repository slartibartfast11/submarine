import { PLAYER_DEPTHS, SCREEN } from './config';

/** Colours for the printed illustration behind the dark LCD segments. */
export const BACKDROP_COLOURS = {
  skyTop: '#9dcfe1',
  skyHorizon: '#bee1e8',
  oceanSurface: '#78bcb8',
  oceanDeep: '#68a9a8',
  sand: '#ddc892',
  sandHighlight: '#ecd7a3',
  shoreline: '#77988c',
} as const;

/** Paint once per texture, never as part of the gameplay update loop. */
export function paintPrintedBackdrop(c: CanvasRenderingContext2D): void {
  const { width, height, waterline, seafloor } = SCREEN;

  // The soft blocks of colour are the printed backing, not moving LCD pixels.
  const sky = c.createLinearGradient(0, 0, 0, waterline);
  sky.addColorStop(0, BACKDROP_COLOURS.skyTop);
  sky.addColorStop(1, BACKDROP_COLOURS.skyHorizon);
  c.fillStyle = sky;
  c.fillRect(0, 0, width, waterline);

  const sea = c.createLinearGradient(0, waterline, 0, seafloor);
  sea.addColorStop(0, BACKDROP_COLOURS.oceanSurface);
  sea.addColorStop(1, BACKDROP_COLOURS.oceanDeep);
  c.fillStyle = sea;
  c.fillRect(0, waterline, width, height - waterline);

  // Flat, rounded cloud silhouettes resemble faded ink on a printed insert.
  function cloud(x: number, y: number, w: number): void {
    const h = w * 0.19;
    c.beginPath();
    c.moveTo(x, y + h * 0.75);
    c.bezierCurveTo(x + w * 0.05, y + h * 0.37, x + w * 0.16, y + h * 0.45, x + w * 0.22, y + h * 0.49);
    c.bezierCurveTo(x + w * 0.25, y - h * 0.15, x + w * 0.43, y - h * 0.21, x + w * 0.51, y + h * 0.31);
    c.bezierCurveTo(x + w * 0.58, y - h * 0.03, x + w * 0.7, y + h * 0.1, x + w * 0.74, y + h * 0.51);
    c.bezierCurveTo(x + w * 0.88, y + h * 0.34, x + w * 0.96, y + h * 0.55, x + w, y + h * 0.75);
    c.closePath();
    c.fill();
  }
  c.save();
  c.fillStyle = '#f7f3e5';
  c.globalAlpha = 0.42;
  cloud(55, 134, 174);
  cloud(372, 191, 182);
  cloud(752, 132, 158);
  c.globalAlpha = 0.18;
  cloud(625, 222, 98);
  c.restore();

  // Continuous double-stroked waterline: static art, never animated waves.
  function wave(y: number): void {
    c.beginPath();
    c.moveTo(0, y);
    for (let x = 0; x < width; x += 48) {
      c.quadraticCurveTo(x + 12, y - 3, x + 24, y);
      c.quadraticCurveTo(x + 36, y + 3, x + 48, y);
    }
    c.stroke();
  }
  c.save();
  c.strokeStyle = '#e1eddf';
  c.lineWidth = 5;
  c.globalAlpha = 0.48;
  wave(waterline - 3);
  c.strokeStyle = '#457d88';
  c.lineWidth = 2.25;
  c.globalAlpha = 0.87;
  wave(waterline);
  c.restore();

  // Depth rules are only faint backing guides; submarines remain the focus.
  c.save();
  c.strokeStyle = '#376c71';
  c.lineWidth = 0.9;
  c.globalAlpha = 0.12;
  for (const y of PLAYER_DEPTHS) {
    c.beginPath();
    c.moveTo(22, y + 22);
    c.lineTo(width - 22, y + 22);
    c.stroke();
  }
  c.restore();

  // An irregular strip of sandy seabed, entirely below the submarine rows.
  c.beginPath();
  c.moveTo(0, seafloor);
  c.bezierCurveTo(62, seafloor + 5, 106, seafloor - 4, 170, seafloor);
  c.bezierCurveTo(207, seafloor - 2, 219, seafloor - 15, 246, seafloor - 14);
  c.bezierCurveTo(277, seafloor - 13, 281, seafloor + 4, 344, seafloor);
  c.bezierCurveTo(442, seafloor + 5, 472, seafloor - 8, 553, seafloor);
  c.bezierCurveTo(626, seafloor + 4, 668, seafloor - 17, 707, seafloor - 15);
  c.bezierCurveTo(743, seafloor - 13, 750, seafloor + 6, 819, seafloor);
  c.bezierCurveTo(872, seafloor - 5, 928, seafloor + 4, width, seafloor - 2);
  c.lineTo(width, height);
  c.lineTo(0, height);
  c.closePath();
  const sand = c.createLinearGradient(0, seafloor - 15, 0, height);
  sand.addColorStop(0, BACKDROP_COLOURS.sandHighlight);
  sand.addColorStop(1, BACKDROP_COLOURS.sand);
  c.fillStyle = sand;
  c.fill();
  c.save();
  c.lineWidth = 2.4;
  c.strokeStyle = BACKDROP_COLOURS.shoreline;
  c.globalAlpha = 0.72;
  c.stroke();
  c.restore();

  // Washed-out boulders and sand markings, rather than active LCD elements.
  function rock(x: number, y: number, w: number, h: number): void {
    c.beginPath();
    c.moveTo(x - w / 2, y);
    c.lineTo(x - w * 0.32, y - h * 0.75);
    c.lineTo(x - w * 0.08, y - h);
    c.lineTo(x + w * 0.28, y - h * 0.85);
    c.lineTo(x + w / 2, y);
    c.closePath();
    c.fillStyle = '#879b85';
    c.globalAlpha = 0.65;
    c.fill();
    c.strokeStyle = '#667d75';
    c.lineWidth = 1.1;
    c.stroke();
    c.beginPath();
    c.moveTo(x - w * 0.08, y - h * 0.8);
    c.lineTo(x + w * 0.09, y - h * 0.28);
    c.stroke();
  }
  c.save();
  rock(238, 491, 29, 13);
  rock(283, 502, 21, 9);
  rock(685, 495, 38, 16);
  rock(732, 507, 20, 8);
  rock(131, 524, 18, 7);
  rock(851, 522, 23, 9);
  c.restore();

  // Sparse seaweed is part of the print, kept low to avoid obscuring boats.
  function weed(x: number, base: number, height: number): void {
    c.beginPath();
    c.moveTo(x, base);
    c.bezierCurveTo(x - 11, base - height * 0.33, x + 10, base - height * 0.6, x, base - height);
    c.stroke();
  }
  c.save();
  c.strokeStyle = '#4c8984';
  c.globalAlpha = 0.58;
  c.lineWidth = 3.4;
  c.lineCap = 'round';
  for (const [x, y, h] of [
    [96, 493, 26], [107, 493, 37], [118, 493, 23],
    [456, 496, 21], [468, 496, 27],
    [888, 490, 22], [900, 490, 37], [913, 490, 28],
  ]) weed(x, y, h);
  c.restore();

  c.save();
  c.fillStyle = '#718e80';
  c.globalAlpha = 0.43;
  for (let i = 0; i < 62; i++) {
    const x = (i * 137 + 43) % width;
    const y = seafloor + 10 + (i * 19) % Math.max(1, height - seafloor - 12);
    c.fillRect(x, y, 2 + i % 3, 1.4);
  }
  c.restore();
}
