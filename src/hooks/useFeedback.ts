import { useState, useCallback } from 'react';

export const useFeedback = () => {
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const playChime = useCallback((success: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (success) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // Slide up to A6
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioCtx.currentTime); 
        gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.log("Audio not supported", e);
    }
  }, []);

  const triggerVibrate = useCallback((pattern: number | number[]) => {
    if (hapticsEnabled && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, [hapticsEnabled]);

  return {
    hapticsEnabled,
    setHapticsEnabled,
    playChime,
    triggerVibrate,
  };
};
