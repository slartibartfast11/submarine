/** Original high-resolution curved LCD silhouettes; Path2D data, not pixel art. */
export type CurvedEtch={readonly width:number;readonly height:number;readonly ink:readonly string[];readonly clear:readonly string[]};
export const CURVED_ETCHES: Record<string,CurvedEtch>={
 player:{width:76,height:30,ink:[
 'M7 18 C9 14 17 12 27 12 H58 C65 12 71 15 75 18 C72 22 66 25 58 26 H25 C15 26 9 23 7 18 Z',
 'M31 12 L33 8 Q35 6 39 6 H46 Q49 6 50 9 L51 13 Z',
 'M40 6 V2 H42 V6 Z',
 'M6 17 L2 11 L3 10 L11 16 Z','M6 20 L2 27 L3 28 L12 22 Z',
 'M7 18 H1 V20 H7 Z','M25 25 Q31 29 43 29 H50 L47 25 Z'],
 clear:['M35 9 Q39 8 42 9 V11 H35 Z',
 'M17 17 A1.65 1.65 0 1 0 17 20.3 A1.65 1.65 0 1 0 17 17 Z',
 'M28 17 A1.65 1.65 0 1 0 28 20.3 A1.65 1.65 0 1 0 28 17 Z',
 'M39 17 A1.65 1.65 0 1 0 39 20.3 A1.65 1.65 0 1 0 39 17 Z',
 'M50 17 A1.65 1.65 0 1 0 50 20.3 A1.65 1.65 0 1 0 50 17 Z']},
 enemySub:{width:72,height:24,ink:[
 'M4 15 Q8 10 17 10 H56 Q67 10 71 15 Q65 20 53 21 H15 Q7 20 4 15 Z',
 'M19 11 L22 7 Q23 5 27 5 H35 Q38 5 39 10 Z',
 'M28 5 V2 H30 V5 Z','M5 15 H1 V18 H7 Z','M5 12 L2 9 L2 7 L11 12 Z','M5 20 L2 23 H8 L11 19 Z'],
 clear:['M24 9 H34 V10 H24 Z','M17 14 A1.5 1.5 0 1 0 17 17 A1.5 1.5 0 1 0 17 14 Z',
 'M29 14 A1.5 1.5 0 1 0 29 17 A1.5 1.5 0 1 0 29 14 Z',
 'M41 14 A1.5 1.5 0 1 0 41 17 A1.5 1.5 0 1 0 41 14 Z',
 'M53 14 A1.5 1.5 0 1 0 53 17 A1.5 1.5 0 1 0 53 14 Z']},
 sweeper:{width:72,height:22,ink:[
 'M2 13 Q8 12 15 12 H67 L71 14 Q64 21 51 21 H17 Q7 20 2 13 Z',
 'M18 12 V7 H25 V5 H42 L48 11 V13 Z','M29 5 V1 H30 V5 Z',
 'M50 12 V8 H55 V12 Z','M14 12 V10 H16 V12 Z','M61 12 V10 H64 V12 Z'],
 clear:['M24 8 H27 V10 H24 Z','M30 8 H33 V10 H30 Z','M36 8 H39 V10 H36 Z',
 'M9 15 Q24 16 42 16 H65 L62 17 H15 Z']},
 bomb:{width:12,height:12,ink:['M6 1 C9 1 11 4 11 7 C11 10 9 12 6 12 C3 12 1 10 1 7 C1 4 3 1 6 1 Z','M5 0 H7 V2 H5 Z'],clear:[]}
};
