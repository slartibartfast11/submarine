export type GameControl =
  | 'left' | 'right' | 'up' | 'down'
  | 'missile' | 'torpedo' | 'menu' | 'resume' | 'retry' | 'quit' | 'classic' | 'modern' | 'sound';

export type ControlScreen = 'menu' | 'battle';

type ControlListener = (control: GameControl, repeated: boolean) => void;
type ScreenListener = (screen: ControlScreen) => void;
type PauseListener = (paused: boolean, gameOver: boolean) => void;

const controlListeners = new Set<ControlListener>();
const screenListeners = new Set<ScreenListener>();
const pauseListeners = new Set<PauseListener>();
let activeScreen: ControlScreen = 'menu';
let pauseOpen = false;
let pauseGameOver = false;

export function keyToControl(code: string): GameControl | null {
  switch (code) {
    case 'ArrowLeft': case 'KeyA': return 'left';
    case 'ArrowRight': case 'KeyD': return 'right';
    case 'ArrowUp': case 'KeyW': return 'up';
    case 'ArrowDown': case 'KeyS': return 'down';
    case 'Space': return 'missile';
    case 'KeyX': return 'torpedo';
    case 'Escape': return 'menu';
    case 'KeyM': return 'sound';
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

export function setPauseOpen(open: boolean, gameOver = false): void {
  const nextGameOver = open && gameOver;
  if (pauseOpen === open && pauseGameOver === nextGameOver) return;
  pauseOpen = open;
  pauseGameOver = nextGameOver;
  for (const listener of [...pauseListeners]) listener(open, nextGameOver);
}

export function subscribePauseOpen(listener: PauseListener): () => void {
  pauseListeners.add(listener);
  listener(pauseOpen, pauseGameOver);
  return () => { pauseListeners.delete(listener); };
}

export function subscribeControlScreen(listener: ScreenListener): () => void {
  screenListeners.add(listener);
  listener(activeScreen);
  return () => { screenListeners.delete(listener); };
}
