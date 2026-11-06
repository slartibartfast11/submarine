/** Original one-bit fixed segments retained from the existing LCD game. */
const RAW_MASKS: Record<string, string[]> = {
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

/** Original player and explosion sprites stay on the same fixed-size mask grid. */
export const SPRITE_MASKS: Record<string, string[]> = Object.fromEntries(
  Object.entries(RAW_MASKS).map(([name, rows]) => {
    const width = Math.max(...rows.map(row => row.length));
    return [name, rows.map(row => row.padEnd(width, '.'))];
  }),
);
