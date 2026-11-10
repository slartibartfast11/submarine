/**
 * Small, original retro-effects synthesizer.
 * Preset field names follow the Gufobyte SFX Lab JSON format; this renderer
 * is our own implementation and does not include its synthesizer code.
 */
export type SfxPreset = {
  wave: number; freq: number; slide: number; dslide: number; minFreq: number;
  vibDepth: number; vibRate: number; arpMult: number; arpTime: number;
  duty: number; dutySweep: number; attack: number; sustain: number;
  punch: number; decay: number; repeat: number;
  lpf: number; lpfSweep: number; lpfRes: number; hpf: number; hpfSweep: number;
  phaserMs: number; phaserSweep: number; crushBits: number; crushHold: number;
  gain: number; seed: number;
};

const RATE = 44100;
const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value));

/** Render a preset into normalized mono PCM, with no browser or audio-device dependency. */
export function renderSfx(p: SfxPreset, sampleRate = RATE): Float32Array {
  const attack = Math.max(0, p.attack);
  const sustain = Math.max(0, p.sustain);
  const decay = Math.max(0, p.decay);
  const duration = Math.max(0.001, attack + sustain + decay);
  const samples = new Float32Array(Math.ceil(duration * sampleRate));
  const step = 1 / sampleRate;
  const phaseDelay = new Float32Array(4096);
  let phase = 0, noiseClock = 0, noise = 0, metal = 0x4001;
  let low = 0, band = 0, previousHighInput = 0, previousHighOutput = 0;
  let delayHead = 0, held = 0, holdCounter = 0;
  let randomState = (p.seed >>> 0) || 1;
  const random = (): number => {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    return ((randomState >>> 0) / 0xffffffff) * 2 - 1;
  };
  noise = random();

  let written = 0;
  for (let i = 0; i < samples.length; i++) {
    const time = i * step;
    const pitchTime = p.repeat > 0 ? time % p.repeat : time;
    const octaves = p.slide * pitchTime + p.dslide * pitchTime * pitchTime / 2;
    let frequency = p.freq * 2 ** octaves;
    if (pitchTime >= p.arpTime) frequency *= p.arpMult;
    if (p.vibDepth > 0) {
      frequency *= 2 ** ((p.vibDepth * Math.sin(2 * Math.PI * p.vibRate * time)) / 12);
    }
    if (frequency < p.minFreq) break;
    frequency = clamp(frequency, 0, sampleRate * 0.45);
    phase = (phase + frequency * step) % 1;

    let sample: number;
    switch (p.wave | 0) {
      case 0: {
        const width = clamp(p.duty + p.dutySweep * time, 0.05, 0.5);
        sample = phase < width ? 1 : -1;
        break;
      }
      case 1: sample = phase * 2 - 1; break;
      case 2: sample = 1 - 4 * Math.abs(phase - 0.5); break;
      case 3: sample = Math.sin(2 * Math.PI * phase); break;
      default: {
        noiseClock += frequency * 8 * step;
        while (noiseClock >= 1) {
          noiseClock -= 1;
          if (p.wave === 5) {
            const bit = (metal ^ (metal >>> 6)) & 1;
            metal = (metal >>> 1) | (bit << 14);
            noise = metal & 1 ? 1 : -1;
          } else {
            noise = random();
          }
        }
        sample = noise;
      }
    }

    if (p.lpf < 20000) {
      const cutoff = clamp(p.lpf * 2 ** (p.lpfSweep * time), 30, sampleRate * 0.16);
      const coefficient = 2 * Math.sin(Math.PI * cutoff * step);
      const damping = 1 - 0.9 * clamp(p.lpfRes, 0, 1);
      const high = sample - low - damping * band;
      band += coefficient * high;
      low += coefficient * band;
      sample = low;
    }
    if (p.hpf > 0) {
      const cutoff = clamp(p.hpf * 2 ** (p.hpfSweep * time), 10, sampleRate * 0.45);
      const rc = 1 / (2 * Math.PI * cutoff);
      const a = rc / (rc + step);
      const next = a * (previousHighOutput + sample - previousHighInput);
      previousHighInput = sample;
      previousHighOutput = next;
      sample = next;
    }
    if (p.phaserMs > 0) {
      const delaySamples = clamp(Math.round(
        (p.phaserMs + time * p.phaserSweep) * sampleRate / 1000,
      ), 1, 4000);
      const delayed = phaseDelay[(delayHead - delaySamples + 4096) % 4096];
      phaseDelay[delayHead] = sample;
      delayHead = (delayHead + 1) % 4096;
      sample = (sample + delayed) * 0.5;
    }

    let envelope: number;
    if (time < attack) envelope = attack > 0 ? time / attack : 1;
    else if (time < attack + sustain) {
      envelope = 1 + p.punch * (1 - (time - attack) / Math.max(sustain, step));
    } else {
      const remain = Math.max(0, 1 - (time - attack - sustain) / Math.max(decay, step));
      envelope = remain * remain;
    }
    sample *= envelope * p.gain;
    if (p.crushHold > 1) {
      if (holdCounter === 0) held = sample;
      sample = held;
      holdCounter = (holdCounter + 1) % Math.floor(p.crushHold);
    }
    if (p.crushBits > 1) {
      const levels = 2 ** (Math.floor(p.crushBits) - 1);
      sample = Math.round(sample * levels) / levels;
    }
    samples[i] = Number.isFinite(sample) ? sample : 0;
    written++;
  }

  const output = samples.subarray(0, Math.max(1, written));
  let mean = 0, peak = 0, power = 0;
  for (const value of output) mean += value;
  mean /= output.length;
  for (let i = 0; i < output.length; i++) {
    output[i] -= mean;
    peak = Math.max(peak, Math.abs(output[i]));
    power += output[i] * output[i];
  }
  const rms = Math.sqrt(power / output.length);
  const level = peak > 0 && rms > 0 ? Math.min(0.89 / peak, 0.16 / rms) : 1;
  const fadeLength = Math.min(output.length, Math.round(sampleRate * 0.004));
  for (let i = 0; i < output.length; i++) {
    const endFade = i >= output.length - fadeLength
      ? (output.length - 1 - i) / Math.max(1, fadeLength - 1) : 1;
    output[i] *= level * endFade;
  }
  return output;
}
