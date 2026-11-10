// Only a local playback preference is stored; no account, tracking or network call.
export const SOUND_MUTED_KEY = 'submarine.sound-muted';

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function readSoundMuted(storage: PreferenceStorage | null | undefined): boolean {
  try { return storage?.getItem(SOUND_MUTED_KEY) === '1'; }
  catch { return false; }
}

export function writeSoundMuted(storage: PreferenceStorage | null | undefined, muted: boolean): void {
  try { storage?.setItem(SOUND_MUTED_KEY, muted ? '1' : '0'); }
  catch { /* The game still works if storage is unavailable or disabled. */ }
}

export function browserPreferenceStorage(): PreferenceStorage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; }
  catch { return null; }
}
