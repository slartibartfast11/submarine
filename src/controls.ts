export type GameControl =
  | 'left' | 'right' | 'up' | 'down'
  | 'missile' | 'torpedo' | 'menu' | 'classic' | 'modern';

export type ControlScreen = 'menu' | 'battle';

type ControlListener = (control: GameControl, repeated: boolean) => void;
type ScreenListener = (screen: ControlScreen) => void;

const controlListeners = new Set<ControlListener>();
const screenListeners = new Set<ScreenListener>();
let activeScreen: ControlScreen = 'menu';

export function keyToControl(code: string): GameControl | null {
  switch (code) {
    case 'ArrowLeft': case 'KeyA': return 'left';
    case 'ArrowRight': case 'KeyD': return 'right';
    case 'ArrowUp': case 'KeyW': return 'up';
    case 'ArrowDown': case 'KeyS': return 'down';
    case 'Space': return 'missile';
    case 'KeyX': return 'torpedo';
    case 'Escape': return 'menu';
    case 'Digit1': case 'Numpad1': return 'classic';
    case 'Digit2': case 'Numpad2': return 'modern';
    default: return null;
  }
}

export function dispatchControl(control: GameControl, repeated = false): void {
  for (const listener of [...controlListeners]) listener(control, repeated);
}

export function subscribeControls(listener: ControlListener): () => void {
  controlListeners.add(listener);
  return () => { controlListeners.delete(listener); };
}

export function setControlScreen(screen: ControlScreen): void {
  activeScreen = screen;
  for (const listener of [...screenListeners]) listener(screen);
}

export function subscribeControlScreen(listener: ScreenListener): () => void {
  screenListeners.add(listener);
  listener(activeScreen);
  return () => { screenListeners.delete(listener); };
}
