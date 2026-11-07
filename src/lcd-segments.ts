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
  // Level-flight fighter-bomber, compact profile: pointed nose to the right,
  // canopy, angular swept tail, two underwing pylons. No airliner proportions.
  plane: {
    width: 76, height: 38,
    ink: [
      [[3,20],[12,18],[21,17],[30,16],[39,15],[51,15],[62,18],[73,20],[75,21],[69,23],[58,24],[36,24],[24,23],[14,24],[5,23]],
      [[10,19],[7,8],[12,7],[23,18]],
      [[17,21],[14,28],[20,28],[28,23]],
      [[39,16],[44,11],[52,10],[59,17]],
      [[32,23],[33,28],[44,29],[48,24]],
      [[33,28],[31,31],[34,32],[45,32],[47,29]],
    ],
    clear: [
      [[45,14],[51,12],[55,13],[59,17],[44,17]],
      [[15,20],[32,19],[32,20],[15,21]],
    ],
  },
  // Right-bank dive: oblique underside, near wing dominates. The small
  // transparent notch at its rear is the etched aileron cue.
  planeBankRight: {
    width: 76, height: 38,
    ink: [
      [[7,4],[15,3],[25,8],[38,16],[53,24],[67,32],[73,36],[71,38],[63,35],[49,29],[33,22],[17,13],[8,10]],
      [[29,14],[34,1],[40,0],[49,22]],
      [[34,20],[7,34],[14,38],[24,36],[49,26]],
      [[13,8],[5,2],[9,1],[24,13]],
      [[21,13],[8,18],[13,23],[29,18]],
      [[26,27],[24,31],[28,33],[36,28]],
      [[42,24],[40,28],[44,30],[49,27]],
    ],
    clear: [
      [[52,25],[60,28],[66,33],[62,32],[53,29]],
      [[14,33],[29,27],[34,27],[18,35]],
      [[35,6],[37,5],[42,16],[39,16]],
    ],
  },
  // Left-bank dive: independently composed, not a mirror of the right-bank
  // attitude. Different relative wing and stores placement.
  planeBankLeft: {
    width: 76, height: 38,
    ink: [
      [[3,34],[10,27],[22,20],[37,13],[53,7],[67,3],[72,5],[70,9],[59,15],[45,21],[28,27],[14,35],[8,38]],
      [[31,16],[36,1],[43,0],[47,10]],
      [[32,23],[43,37],[59,38],[52,30],[44,23]],
      [[53,8],[63,0],[68,2],[61,13]],
      [[24,22],[10,23],[9,27],[22,29],[36,25]],
      [[38,29],[40,33],[45,34],[46,31]],
      [[24,25],[20,29],[25,30],[29,28]],
    ],
    clear: [
      [[9,30],[18,25],[23,23],[19,29],[12,33]],
      [[37,3],[40,3],[42,10],[39,12]],
      [[47,32],[54,36],[46,35]],
    ],
  },
  // High-G pull-up: broad underside and swept wings. The nose climbs
  // steeply, but the silhouette is slightly oblique rather than vertical.
  planeClimb: {
    width: 76, height: 38,
    ink: [
      [[45,2],[50,0],[54,4],[52,11],[47,23],[42,33],[36,38],[31,35],[35,26],[39,12]],
      [[43,15],[7,30],[7,34],[25,33],[44,24]],
      [[48,15],[69,23],[71,27],[55,26],[44,23]],
      [[36,29],[19,35],[22,38],[40,34]],
      [[44,29],[59,35],[62,38],[42,35]],
      [[21,28],[17,28],[13,35],[17,36],[24,31]],
      [[59,22],[63,20],[67,26],[64,29]],
    ],
    clear: [
      [[45,7],[49,5],[48,12],[43,17],[42,13]],
      [[35,23],[39,19],[37,29],[33,32]],
      [[52,21],[61,24],[61,25],[49,23]],
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
