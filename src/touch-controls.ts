import { dispatchControl, subscribeControlScreen, subscribePauseOpen, type GameControl } from './controls';

const REPEAT_DELAY_MS = 300;
const REPEAT_INTERVAL_MS = 140;
const REPEATABLE = new Set<GameControl>(['left', 'right']);

type HeldPress = {
  button: HTMLButtonElement;
  timeout: number | null;
  interval: number | null;
};

export function installTouchControls(root: HTMLElement, onUserGesture: () => void): () => void {
  const held = new Map<number, HeldPress>();

  function release(pointerId: number): void {
    const press = held.get(pointerId);
    if (!press) return;
    if (press.timeout !== null) window.clearTimeout(press.timeout);
    if (press.interval !== null) window.clearInterval(press.interval);
    press.button.classList.remove('is-held');
    held.delete(pointerId);
  }

  function releaseAll(): void {
    for (const pointerId of held.keys()) release(pointerId);
  }

  const overlay = root.querySelector<HTMLElement>('.pause-overlay');
  const resumeButton = root.querySelector<HTMLButtonElement>('.pause-continue');
  const stopPauseSubscription = subscribePauseOpen(open => {
    releaseAll();
    root.dataset.paused = String(open);
    if (overlay) overlay.hidden = !open;
    if (open) resumeButton?.focus();
  });

  const stopScreenSubscription = subscribeControlScreen(screen => {
    releaseAll();
    root.dataset.screen = screen;
  });

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-control]');
    if (!button || !root.contains(button)) return;
    const control = button.dataset.control as GameControl | undefined;
    if (!control) return;
    if (root.dataset.paused === 'true' && control !== 'resume' && control !== 'quit') return;

    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    const press: HeldPress = { button, timeout: null, interval: null };
    held.set(event.pointerId, press);
    button.classList.add('is-held');

    if (REPEATABLE.has(control)) {
      press.timeout = window.setTimeout(() => {
        if (!held.has(event.pointerId)) return;
        dispatchControl(control, true);
        press.interval = window.setInterval(() => {
          if (held.has(event.pointerId)) dispatchControl(control, true);
        }, REPEAT_INTERVAL_MS);
      }, REPEAT_DELAY_MS);
    }

    // WebAudio requires a user gesture on mobile; the controls sit outside the canvas.
    onUserGesture();
    dispatchControl(control);
  }

  const onPointerEnd = (event: PointerEvent): void => release(event.pointerId);
  const onContextMenu = (event: Event): void => event.preventDefault();
  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointerup', onPointerEnd);
  root.addEventListener('pointercancel', onPointerEnd);
  root.addEventListener('lostpointercapture', onPointerEnd);
  root.addEventListener('contextmenu', onContextMenu);
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', releaseAll);

  return () => {
    releaseAll();
    stopScreenSubscription();
    stopPauseSubscription();
    root.removeEventListener('pointerdown', onPointerDown);
    root.removeEventListener('pointerup', onPointerEnd);
    root.removeEventListener('pointercancel', onPointerEnd);
    root.removeEventListener('lostpointercapture', onPointerEnd);
    root.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('blur', releaseAll);
    document.removeEventListener('visibilitychange', releaseAll);
  };
}
