/** Original, hand-authored fixed-segment-style LCD masks. No traced game art. */
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
  // Side-view patrol aircraft, with cut-out wing/engine detail.
  plane: [
    '...................XXX................',
    '..................XXXXX...............',
    '.................XXXXXXX.......XX.....',
    '...XXX..........XXXXXXXXX.....XXXX....',
    '.XXXXXX......XXXXXXXXXXXXXX...XXXXX...',
    'XXXXXXXXXXXXXXXXXXXXX..XXXXXXXXXXXXXX',
    '..XXXXXXXXXXXXXXX..XX..XXXXXXXXXXXXXX',
    '......XXXXXXXXXXXXXX..XXXXXXXXXXXXXX.',
    '.................XXXXXXXXXX....XXX...',
    '...................XXXXXXX...........',
    '....................XXXXX............',
    '.....................XXX.............',
  ],
  // Banked pose uses a visibly different lower-wing silhouette.
  planeBank: [
    '..............................XX......',
    '.................XXXX.......XXXXX.....',
    '.............XXXXXXXXX....XXXXXXXX....',
    '...XXX......XXXXXXXXXXXXXXXXXXXXXXXX..',
    'XXXXXXXX..XXXXXXXXXXXXXXXXXXXXXXXXXXX.',
    '.XXXXXXXXXXXXX..XX..XXXXXXXXXXXXXXXX..',
    '.....XXXXXXXXXXX..XXXXXXXXXXXXXXXXXX..',
    '.........XXXXXXXXXXXXXXXXXXX..XXXX....',
    '............XXXXXXXXXXX...............',
    '..........XXXXXXXXX...................',
    '.......XXXXXXX........................',
    '.....XXXX.............................',
  ],
  // Distinct surface escort: bridge/windows, mast and aft charge rack.
  sweeper: [
    '..................XX................',
    '..................XX................',
    '............XXXXXXXXX...............',
    '............X.X.X.XXX.......XX......',
    '...........XXXXXXXXXXXX...XXXX......',
    '....XXX...XXXXXXXXXXXXXXXXXXXXXX....',
    '...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.',
    '.XX....XX..XX.......XX...XX....XXX..',
    '..XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...',
    '.....XXXXXXXXXXXXXXXXXXXXXXXXX......',
  ],
  // Enemy hull has an offset conning tower and a different prow/stern
  // profile from the player's original submarine, which is left unchanged.
  enemySub: [
    '............XX......................',
    '............XX......................',
    '.........XXXXXXXXXX.................',
    '.........X..XX..XX..................',
    '........XXXXXXXXXXXX................',
    '......XXXXXXXXXXXXXXXXXXX...........',
    '..XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX....',
    '.XX..XX..XX..XX..XX..XX..XX.....XXX.',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.',
    '...XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...',
    '......XXXXXXXXXXXXXX.XXXXXXXX.......',
  ],
  // Tiny upward missile with an etched nose, hollow shaft and tail fins.
  missile: [
    '...XX...',
    '..XXXX..',
    '..XXXX..',
    '..X..X..',
    '..X..X..',
    '..X..X..',
    '.XX..XX.',
    'XX....XX',
    '.X....X.',
  ],
  // Approximately half the old torpedo's length; narrow open body,
  // visible tail fins at left and a rounded bow at right.
  torpedo: [
    '...X...........',
    '..XXXXXXXXXXX..',
    'XX...........XX',
    '..XXXXXXXXXXX..',
    '...X...........',
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

/** Normalize fixed-width artwork at load time; dots remain transparent. */
export const SPRITE_MASKS: Record<string, string[]> = Object.fromEntries(
  Object.entries(RAW_MASKS).map(([name, rows]) => {
    const width = Math.max(...rows.map(row => row.length));
    return [name, rows.map(row => row.padEnd(width, '.'))];
  }),
);
