import { renderSfx } from './sfx-renderer';
import { SFX_PRESETS, type SoundId } from './sfx-presets';
import { browserPreferenceStorage, readSoundMuted, writeSoundMuted } from './sound-preference';

/** Sounds are generated once per AudioContext and replayed without network requests. */
class SoundBank {
  muted = readSoundMuted(browserPreferenceStorage());
  private muteListeners = new Set<(muted: boolean) => void>();
  private caches = new WeakMap<AudioContext, Map<SoundId, AudioBuffer>>();
  private outputNodes = new WeakMap<AudioContext, GainNode>();
  private allOutputs = new Set<GainNode>();

  toggleMute(): boolean {
    this.muted = !this.muted;
    writeSoundMuted(browserPreferenceStorage(), this.muted);
    for (const output of this.allOutputs) {
      output.gain.setTargetAtTime(this.muted ? 0 : 1, output.context.currentTime, 0.01);
    }
    for (const listener of this.muteListeners) listener(this.muted);
    return this.muted;
  }

  subscribeMute(listener: (muted: boolean) => void): () => void {
    this.muteListeners.add(listener);
    return () => { this.muteListeners.delete(listener); };
  }

  play(context: AudioContext | undefined, name: SoundId): AudioBufferSourceNode | null {
    if (this.muted || !context || context.state !== 'running') return null;
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
    let output = this.outputNodes.get(context);
    if (!output) {
      output = context.createGain();
      output.gain.value = this.muted ? 0 : 1;
      output.connect(context.destination);
      this.outputNodes.set(context, output);
      this.allOutputs.add(output);
    }
    const source = context.createBufferSource();
    const volume = context.createGain();
    const gains: Partial<Record<SoundId, number>> = {
      enemyDestroyed: 0.18, playerDestroyed: 0.24, torpedoLaunch: 0.12,
      missileLaunch: 0.11, missileLaunchAlternate: 0.11,
      missileIntercept: 0.13, enemySubAppear: 0.12, enemyWeaponDrop: 0.075,
      extraLife: 0.13, boatAppear: 0.09, gameOver: 0.16,
      entryBaaaa: 0.11, entryBoo: 0.095, entryBooSecond: 0.095, entryFinal: 0.13,
    };
    volume.gain.value = gains[name] ?? 0.1;
    source.buffer = buffer;
    source.connect(volume).connect(output);
    source.onended = () => { source.disconnect(); volume.disconnect(); };
    source.start();
    return source;
  }
}

export const soundBank = new SoundBank();
