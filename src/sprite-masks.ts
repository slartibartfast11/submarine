/** Monochrome impact-starburst mask. */
const RAW_MASKS: Record<string,string[]>={
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
export const SPRITE_MASKS: Record<string,string[]> = Object.fromEntries(
 Object.entries(RAW_MASKS).map(([name,rows])=>{
  const width=Math.max(...rows.map(row=>row.length));
  return [name,rows.map(row=>row.padEnd(width,'.'))];
 }),
);
