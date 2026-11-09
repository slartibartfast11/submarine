export const INTERCEPT_POINTS = 10;
export const EXTRA_LIFE_INTERVAL = 10000;

export function extraLivesEarned(previousScore: number, nextScore: number): number {
  return Math.floor(nextScore / EXTRA_LIFE_INTERVAL) -
    Math.floor(previousScore / EXTRA_LIFE_INTERVAL);
}

export function applyScore(
  score: number, lives: number, points: number, maxLives: number,
): { score: number; lives: number } {
  const nextScore = score + points;
  return {
    score: nextScore,
    lives: Math.min(maxLives, lives + extraLivesEarned(score, nextScore)),
  };
}
