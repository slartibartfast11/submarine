import { renderSfx } from './sfx-renderer';
import { SFX_PRESETS, type SoundId } from './sfx-presets';

/** Sounds are generated once per AudioContext and replayed without network requests. */
class SoundBank {
  muted = false;
  private caches = new WeakMap<AudioContext, Map<SoundId, AudioBuffer>>();

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  play(context: AudioContext | undefined, name: SoundId): void {
    if (this.muted || !context || context.state !== 'running') return;
    let cache = this.caches.get(context);
    if (!cache) {
      cache = new Map();
      this.caches.set(context, cache);
    }
    let buffer = cache.get(name);
    if (!buffer) {
      const pcm = renderSfx(SFX_PRESETS[name], context.sampleRate);
      buffer = context.createBuffer(1, pcm.length, context.sampleRate);
      buffer.getChannelData(0).set(pcm);
      cache.set(name, buffer);
    }
    const source = context.createBufferSource();
    const volume = context.createGain();
    const gains: Partial<Record<SoundId, number>> = {
      enemyDestroyed: 0.18, playerDestroyed: 0.24, torpedoLaunch: 0.12,
      missileLaunch: 0.11, missileLaunchAlternate: 0.11,
      missileIntercept: 0.13, enemySubAppear: 0.12, enemyWeaponDrop: 0.075,
    };
    volume.gain.value = gains[name] ?? 0.1;
    source.buffer = buffer;
    source.connect(volume).connect(context.destination);
    source.onended = () => { source.disconnect(); volume.disconnect(); };
    source.start();
  }
}

export const soundBank = new SoundBank();
