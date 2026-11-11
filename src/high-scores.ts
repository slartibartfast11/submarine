import { chooseBest, type BestRun, type GameMode } from './config.ts';

type ScoreStorage = Pick<Storage, 'getItem' | 'setItem'>;
const emptyBest = (): BestRun => ({ score: 0, cycle: 1, stage: 1 });
const storageKey = (mode: GameMode): string =>
  `submarine.highscores.${mode === 'classic' ? 'classic' : 'modern'}`;

function browserStorage(): ScoreStorage | null {
  try { return window.localStorage; } catch { return null; }
}

function readBest(storage: ScoreStorage | null, mode: GameMode): BestRun {
  try {
    const value: unknown = JSON.parse(storage?.getItem(storageKey(mode)) ?? 'null');
    if (typeof value !== 'object' || value === null) return emptyBest();
    const best = value as BestRun;
    if (!Number.isSafeInteger(best.score) || best.score < 0 ||
        !Number.isSafeInteger(best.cycle) || best.cycle < 1 ||
        ![1, 2, 3].includes(best.stage)) return emptyBest();
    return { score: best.score, cycle: best.cycle, stage: best.stage };
  } catch { return emptyBest(); }
}

/** Local records only; unavailable storage falls back to this page's memory. */
export class HighScores {
  private readonly best: Record<GameMode, BestRun>;

  private readonly storage: ScoreStorage | null;

  constructor(storage: ScoreStorage | null = browserStorage()) {
    this.storage = storage;
    this.best = { classic: readBest(storage, 'classic'), dynamic: readBest(storage, 'dynamic') };
  }

  get(mode: GameMode): BestRun { return { ...this.best[mode] }; }

  record(mode: GameMode, candidate: BestRun): void {
    const previous = this.best[mode];
    const next = chooseBest(previous, candidate);
    if (next === previous) return;
    this.best[mode] = next;
    try { this.storage?.setItem(storageKey(mode), JSON.stringify(next)); } catch {
      // Blocked or full storage must never interrupt the game.
    }
  }
}
