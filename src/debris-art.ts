/**
 * Fixed, monochrome "destroyed vessel" LCD etches.
 *
 * Based on the approved Debris B concepts: an aircraft reduced mostly to
 * scattered splinters, a surface escort in recognizable broken sections,
 * an enemy submarine burst into rounded endcaps and particulate debris,
 * and a player submarine with detached sail and separated hull sections.
 *
 * These are single static glyphs, not animated particle effects. Path2D
 * renders them using the same dark LCD ink and 3x supersampling as the
 * intact vessels. All coordinates are local to each transparent texture.
 */
export type DebrisEtch = {
  readonly width: number;
  readonly height: number;
  readonly ink: readonly string[];
  readonly clear: readonly string[];
};

export const DEBRIS_ETCHES: Record<string, DebrisEtch> = {
  planeDebris: {
    width: 88, height: 48,
    ink: [
      // Only a little aircraft survives: jagged nose and a tail fin.
      'M3 27 L12 23 L20 24 L17 29 L10 33 L4 32 Z',
      'M68 11 L80 4 L77 13 L85 18 L82 22 L69 19 L65 16 Z',
      // Shards thrown irregularly out of the central rupture.
      'M39 2 L43 3 L44 11 L41 13 L38 9 Z',
      'M50 4 L54 3 L53 10 L49 11 Z',
      'M25 7 L28 5 L32 11 L29 14 Z',
      'M61 5 L64 7 L62 12 L59 10 Z',
      'M17 13 L21 12 L23 18 L18 19 Z',
      'M33 14 L37 12 L40 17 L36 21 L32 18 Z',
      'M48 14 L53 12 L55 17 L51 20 L47 18 Z',
      'M59 16 L64 17 L61 22 L57 21 Z',
      'M23 23 L28 21 L31 25 L27 28 L22 27 Z',
      'M39 23 L43 20 L47 23 L45 28 L40 29 L37 27 Z',
      'M54 24 L59 22 L62 26 L58 29 L53 28 Z',
      'M69 27 L74 26 L76 30 L70 31 Z',
      'M15 38 L20 35 L23 38 L20 42 Z',
      'M29 33 L33 31 L36 34 L33 38 L28 37 Z',
      'M42 34 L46 32 L48 37 L43 40 Z',
      'M54 34 L59 33 L61 38 L56 40 L53 37 Z',
      'M65 39 L70 36 L73 39 L69 43 Z',
      // Small particulate chips, still visible at actual game size.
      'M7 17 H11 V20 H7 Z',
      'M12 8 L15 7 L16 11 L13 12 Z',
      'M27 1 H30 V4 H27 Z',
      'M34 5 H37 V8 H34 Z',
      'M44 8 H47 V11 H44 Z',
      'M72 2 H75 V5 H72 Z',
      'M80 27 H84 V30 H80 Z',
      'M7 41 H11 V44 H7 Z',
      'M24 43 H28 V46 H24 Z',
      'M37 42 H40 V46 H37 Z',
      'M49 42 H52 V46 H49 Z',
      'M77 38 L81 37 L82 41 L78 42 Z',
    ],
    clear: [],
  },
  sweeperDebris: {
    width: 90, height: 42,
    ink: [
      // Fore section with gun, cleanly separated from the bridge.
      'M2 27 H31 L35 31 L29 37 H10 L5 34 Z',
      'M13 27 L13 23 L19 20 H27 L29 23 L26 26 L20 26 L19 27 Z',
      'M13 23 H5 V21 H16 Z',
      // Bridge torn loose and kicked up above the deck.
      'M38 11 L43 5 L54 7 L60 15 L56 27 L45 24 L36 17 Z',
      // Mast is a separate fragment, as in Debris B.
      'M63 5 L65 2 L68 4 L65 12 L73 10 L75 13 L65 16 L62 14 Z',
      // Aft hull, with the original depth-charge rack still identifiable.
      'M68 30 L73 24 H89 L86 35 L76 38 L67 37 L64 34 Z',
      'M75 24 V19 H79 V24 Z',
      'M81 24 V19 H85 V24 Z',
      'M85 24 V20 H89 V25 Z',
      'M52 34 L59 32 L61 37 L55 40 L51 38 Z',
    ],
    clear: [
      'M43 11 L47 12 L47 16 L42 15 Z',
      'M50 12 L54 13 L54 17 L49 16 Z',
      'M11 32 H27 L25 33 H13 Z',
    ],
  },
  enemySubDebris: {
    width: 90, height: 44,
    ink: [
      // Only rounded nose/stern endcaps remain: a dead-centre hull burst.
      'M2 26 Q2 20 11 18 L22 18 L29 22 L25 28 L18 32 L8 31 Q2 30 2 26 Z',
      'M65 23 L73 20 L82 20 Q89 21 89 26 Q89 31 80 33 L70 32 L64 28 Z',
      // The sail, pressure hull and fittings are reduced to fragments.
      'M38 3 L43 1 L45 9 L41 12 L37 9 Z',
      'M52 5 L57 6 L55 12 L50 10 Z',
      'M25 7 L29 6 L31 12 L27 14 Z',
      'M63 8 L67 10 L64 14 L60 12 Z',
      'M33 14 L38 13 L40 18 L35 21 L31 18 Z',
      'M47 15 L52 13 L55 17 L51 21 L46 19 Z',
      'M59 18 L64 17 L66 22 L61 24 Z',
      'M30 25 L35 23 L38 27 L34 31 L29 29 Z',
      'M41 25 L45 22 L49 25 L47 30 L42 31 L39 28 Z',
      'M53 27 L58 25 L61 29 L57 33 L52 31 Z',
      'M34 35 L38 33 L41 37 L38 41 L34 40 Z',
      'M47 34 L51 32 L54 36 L50 40 L46 38 Z',
      'M61 36 L65 34 L69 37 L65 42 Z',
      'M18 10 H22 V13 H18 Z',
      'M9 15 H13 V18 H9 Z',
      'M72 11 H76 V15 H72 Z',
      'M80 15 H84 V18 H80 Z',
      'M24 39 H28 V42 H24 Z',
      'M43 42 H46 V44 H43 Z',
      'M75 39 H79 V42 H75 Z',
    ],
    clear: [
      'M11 25 C11 23 15 23 15 25 C15 27 11 27 11 25 Z',
    ],
  },
  playerDebris: {
    width: 96, height: 48,
    ink: [
      // Substantial bow section, separated jaggedly at the centre.
      'M3 27 Q3 19 13 17 L33 15 L41 21 L39 29 L32 35 L13 35 Q3 33 3 27 Z',
      // Aft pressure hull and screw remain recognizable.
      'M63 24 L70 18 L85 17 L91 23 L88 30 L77 34 L65 33 L59 29 Z',
      'M88 25 H94 V28 H88 Z',
      'M94 26 C92 22 92 20 94 21 C96 23 96 29 94 31 C92 31 92 29 94 26 Z',
      'M82 18 L84 12 L88 12 L90 19 Z',
      'M83 33 L85 39 L90 37 L88 30 Z',
      // Sail thrown above the middle of the rupture.
      'M42 7 L46 3 L56 4 L61 10 L57 19 L45 17 L41 13 Z',
      'M50 4 L50 0 H53 V4 Z',
      // Chunky interior debris; deliberately less particulate than enemy sub.
      'M39 24 L44 21 L48 25 L45 29 L40 29 Z',
      'M51 26 L56 23 L60 27 L57 32 L52 31 Z',
      'M44 35 L50 33 L53 37 L48 42 L43 40 Z',
      'M57 40 L62 37 L66 41 L62 45 L58 44 Z',
      'M31 41 L37 38 L40 42 L36 46 L32 45 Z',
      'M23 8 L28 6 L30 11 L27 14 Z',
      'M64 9 L69 7 L71 11 L67 15 Z',
    ],
    clear: [
      'M12 25 C12 23 16 23 16 25 C16 27 12 27 12 25 Z',
      'M21 24 C21 22 25 22 25 24 C25 26 21 26 21 24 Z',
      'M30 23 C30 21 34 21 34 23 C34 25 30 25 30 23 Z',
    ],
  },
};
