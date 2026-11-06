/**
 * Original custom-shaped LCD etch designs.
 *
 * Each sprite is a fixed collection of ink polygons and transparent apertures,
 * not an image that is updated pixel-by-pixel. One unchanging mask is placed at
 * the positions supported by the game, as in a physical LCD handheld.
 *
 * The original player's sprite stays in sprite-masks.ts by design.
 */
export type SegmentPoint = readonly [number, number];
export type SegmentPolygon = readonly SegmentPoint[];
export type SegmentEtch = {
  readonly width: number;
  readonly height: number;
  readonly ink: readonly SegmentPolygon[];
  readonly clear: readonly SegmentPolygon[];
};

export const LCD_SEGMENTS: Record<string, SegmentEtch> = {
  // Aircraft with recognisable slender fuselage, tail and swept wing.
  plane: {
    width: 76, height: 24,
    ink: [
      [[2,11],[10,9],[23,9],[26,8],[54,8],[65,10],[73,11],[75,12],[72,13],[65,14],[22,14],[13,16],[3,14]],
      [[9,10],[14,2],[18,2],[18,10]],
      [[30,10],[36,1],[44,1],[49,10]],
      [[31,13],[37,23],[44,23],[48,13]],
    ],
    clear: [
      [[56,9],[60,9],[61,11],[55,11]],
      [[38,4],[41,4],[42,7],[37,7]],
    ],
  },
  // Alternate mask for a bank: upper wing visibly sweeps aft.
  planeBank: {
    width: 76, height: 24,
    ink: [
      [[2,11],[11,9],[25,9],[35,8],[60,8],[73,10],[75,12],[71,14],[55,15],[20,14],[9,16]],
      [[9,10],[13,3],[17,2],[17,10]],
      [[24,11],[44,1],[54,1],[45,11]],
      [[30,13],[38,22],[43,23],[47,13]],
    ],
    clear: [
      [[58,10],[63,10],[61,12],[56,12]],
      [[43,4],[46,4],[44,6],[40,6]],
    ],
  },
  // Slow escort vessel; sharp lower hull with simple fixed bridge/windows.
  sweeper: {
    width: 72, height: 22,
    ink: [
      [[1,13],[9,12],[65,12],[70,14],[66,19],[59,20],[13,20],[5,18]],
      [[18,12],[19,7],[22,6],[44,6],[48,12]],
      [[26,6],[27,2],[29,2],[29,6]],
      [[53,11],[53,8],[58,8],[60,12]],
    ],
    clear: [
      [[23,8],[26,8],[26,10],[23,10]],
      [[29,8],[32,8],[32,10],[29,10]],
      [[35,8],[38,8],[38,10],[35,10]],
    ],
  },
  // Enemy sub is more angular and low-slung than the existing player sub.
  enemySub: {
    width: 72, height: 24,
    ink: [
      [[1,13],[8,10],[15,9],[57,9],[66,11],[71,13],[71,16],[62,19],[12,19],[4,17]],
      [[19,10],[22,6],[35,6],[38,10]],
      [[26,6],[27,2],[29,2],[29,6]],
      [[17,19],[25,21],[56,21],[59,19]],
    ],
    clear: [
      [[24,8],[27,8],[27,10],[24,10]],
      [[30,8],[33,8],[33,10],[30,10]],
      [[19,13],[22,13],[22,15],[19,15]],
      [[30,13],[33,13],[33,15],[30,15]],
      [[41,13],[44,13],[44,15],[41,15]],
    ],
  },
  // A simple upward etched dart, with a single thin shaft and small base.
  missile: {
    width: 12, height: 18,
    ink: [
      [[6,0],[9,4],[8,7],[8,13],[11,16],[11,18],[7,16],[5,16],[1,18],[1,16],[4,13],[4,7],[3,4]],
    ],
    clear: [
      [[5,7],[6,7],[6,13],[5,13]],
    ],
  },
  // Short hollow torpedo with distinct rear fins and a modest pointed nose.
  torpedo: {
    width: 26, height: 8,
    ink: [
      [[4,2],[19,2],[22,3],[25,4],[22,5],[19,6],[4,6]],
      [[4,3],[1,1],[1,2],[3,4],[1,6],[1,7],[5,5]],
    ],
    clear: [
      [[7,3],[19,3],[19,5],[7,5]],
    ],
  },
};
