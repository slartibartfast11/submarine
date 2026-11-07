/** SVG path data for curved sprite masks rendered through Canvas Path2D. */
export type CurvedEtch={readonly width:number;readonly height:number;readonly ink:readonly string[];readonly clear:readonly string[]};
export const CURVED_ETCHES: Record<string,CurvedEtch>={
 player:{width:76,height:30,ink:[
 // Pressure hull: stern at left, bow at right.
 'M8 19 C10 15 17 13 26 13 L56 13 C65 13 71 16 75 19 C72 22 66 24 57 24 L26 24 C17 24 11 22 8 19 Z',
 // Sail and periscope.
 'M32 14 L33 9 Q35 6 39 6 L46 6 Q49 6 50 10 L50 14 Z',
 'M40 6 L40 3 L42 3 L42 6 Z',
 // Stern control surfaces.
 'M9 17 L5 15 L5 12 L7 12 L12 17 Z',
 'M9 21 L6 25 L6 26 L8 26 L13 22 Z',
 // Propeller shaft and screw.
 'M8 18 L3 18 L3 20 L8 20 Z',
 'M3 19 C0 16 1 14 3 15 C5 17 5 21 3 23 C1 24 0 22 3 19 Z',
 ],
 clear:[
 'M36 10 Q39 8.5 43 9 L45 10.5 L36 11 Z',
 'M20 17 A1.5 1.5 0 1 0 20 20 A1.5 1.5 0 1 0 20 17 Z',
 'M30 17 A1.5 1.5 0 1 0 30 20 A1.5 1.5 0 1 0 30 17 Z',
 'M40 17 A1.5 1.5 0 1 0 40 20 A1.5 1.5 0 1 0 40 17 Z',
 'M50 17 A1.5 1.5 0 1 0 50 20 A1.5 1.5 0 1 0 50 17 Z',
 ]},
 enemySub:{width:72,height:24,ink:[
 'M4 15 Q8 10 17 10 H56 Q67 10 71 15 Q65 20 53 21 H15 Q7 20 4 15 Z',
 'M19 11 L22 7 Q23 5 27 5 H35 Q38 5 39 10 Z',
 'M28 5 V2 H30 V5 Z','M5 15 H1 V18 H7 Z','M5 12 L2 9 L2 7 L11 12 Z','M5 20 L2 23 H8 L11 19 Z'],
 clear:['M24 9 H34 V10 H24 Z','M17 14 A1.5 1.5 0 1 0 17 17 A1.5 1.5 0 1 0 17 14 Z',
 'M29 14 A1.5 1.5 0 1 0 29 17 A1.5 1.5 0 1 0 29 14 Z',
 'M41 14 A1.5 1.5 0 1 0 41 17 A1.5 1.5 0 1 0 41 14 Z',
 'M53 14 A1.5 1.5 0 1 0 53 17 A1.5 1.5 0 1 0 53 14 Z']},
 sweeper:{width:72,height:22,ink:[
 // Surface escort hull.
 'M2 13 L12 12 L59 12 L70 13 L67 17 L61 21 L18 21 L9 19 Z',
 // Forecastle and quarterdeck.
 'M42 12 L42 10 L58 10 L61 12 Z',
 'M14 12 L14 10 L23 10 L23 12 Z',
 // Bridge, mast and funnel.
 'M22 12 L22 8 L28 8 L29 4 L43 4 L47 8 L47 12 Z',
 'M31 4 L31 0 L32.5 0 L32.5 4 Z',
 'M39 4 L39 1 L42 1 L42 4 Z',
 'M49 12 L49 7 L53 7 L55 12 Z',
 // Bow gun and stern depth-charge rack.
 'M59 12 L59 9 L66 9 L66 10 L61 11 L61 12 Z',
 'M8 12 L8 9 L12 9 L12 12 Z',
 ],
 clear:[
 'M26 8 L29 8 L29 10 L26 10 Z',
 'M32 7 L35 7 L35 10 L32 10 Z',
 'M38 7 L41 7 L41 10 L38 10 Z',
 'M16 17 L57 17 L54 18 L19 18 Z',
 ]},
 bomb:{width:12,height:12,ink:['M6 1 C9 1 11 4 11 7 C11 10 9 12 6 12 C3 12 1 10 1 7 C1 4 3 1 6 1 Z','M5 0 H7 V2 H5 Z'],clear:[]}
};
