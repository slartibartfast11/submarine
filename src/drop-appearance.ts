import type { ClassicBombFlight } from './classic-grid.ts';

// Visual classification only; neither path nor collision box changes.
export type DroppedBombAppearance = {
  texture: 'bomb' | 'angledBomb';
  angle: number;
};

export function droppedBombAppearance(
  flight: ClassicBombFlight | null,
  lateralDirection: number,
): DroppedBombAppearance {
  // Modern falling bombs have a small random horizontal drift. Only a
  // noticeable drift uses the directional mask.
  const angled = flight === null
    ? Math.abs(lateralDirection) > 6
    : flight !== 'straight';
  return angled
    ? { texture: 'angledBomb', angle: lateralDirection < 0 ? 120 : 60 }
    : { texture: 'bomb', angle: 0 };
}
