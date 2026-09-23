// Hardware APIs for mobile web gym experience

let wakeLockSentinel: any = null;

export const requestWakeLock = async (): Promise<boolean> => {
  try {
    if ('wakeLock' in navigator) {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    }
  } catch (err) {
    console.warn('Wake Lock request error:', err);
  }
  return false;
};

export const releaseWakeLock = async (): Promise<void> => {
  try {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  } catch (err) {
    console.warn('Wake Lock release error:', err);
  }
};

export const triggerVibration = (pattern: number | number[] = 200): boolean => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      return navigator.vibrate(pattern);
    }
  } catch (err) {
    // Vibration not supported or blocked
  }
  return false;
};
