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
  if (!angled) return { texture: 'bomb', angle: 0 };
  // Shallower paths point more downward; Modern keeps its existing 60° mask.
  const angle = flight === 'shallow' ? 70 : flight === 'medium' ? 65 :
    flight === 'steep' ? 55 : 60;
  return { texture: 'angledBomb', angle: lateralDirection < 0 ? 180 - angle : angle };
}
