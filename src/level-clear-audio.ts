/** The approved melody-only five-note phrase from the menu fanfare. */
export const LEVEL_CLEAR_AUDIO_URL = './audio/level-clear.mp3';
// Let the target's destruction noise decay before the melody begins.
export const LEVEL_CLEAR_DELAY_MS = 300;

type AudioPlayer = Pick<HTMLAudioElement, 'play' | 'pause' | 'paused' | 'muted' | 'currentTime'>;

/** One short musical voice; independent of procedural effects and game simulation. */
export class LevelClearAudio {
  private resumeAfterPause = false;
  private readonly player: AudioPlayer;

  constructor(player: AudioPlayer) {
    this.player = player;
  }

  play(): void {
    if (this.player.muted) return;
    this.stop();
    void this.player.play().catch(() => { /* Audio playback may be restricted. */ });
  }

  setMuted(muted: boolean): void {
    this.player.muted = muted;
    if (muted) this.stop();
  }

  pause(): void {
    this.resumeAfterPause = !this.player.paused && !this.player.muted;
    this.player.pause();
  }

  resume(): void {
    if (this.resumeAfterPause && !this.player.muted) {
      void this.player.play().catch(() => {});
    }
    this.resumeAfterPause = false;
  }

  stop(): void {
    this.resumeAfterPause = false;
    this.player.pause();
    try { this.player.currentTime = 0; } catch { /* Not seekable before decoding. */ }
  }
}
