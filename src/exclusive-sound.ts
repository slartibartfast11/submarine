/** One voice shared by a set of projectiles. Only the newest owner can silence it. */
export type StoppableSound = { stop(): void };

export class ExclusiveSoundChannel {
  private active: { owner: object; sound: StoppableSound } | null = null;

  play(owner: object, start: () => StoppableSound | null): void {
    this.stop();
    const sound = start();
    if (sound) this.active = { owner, sound };
  }

  /** Without an owner, stop the channel unconditionally (pause/scene shutdown). */
  stop(owner?: object): void {
    if (!this.active || (owner && this.active.owner !== owner)) return;
    const { sound } = this.active;
    this.active = null;
    sound.stop();
  }
}
