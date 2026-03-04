import { useEffect, useState } from 'react';

export function useVerificationCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return {
    secondsLeft,
    isActive: secondsLeft > 0,
    start: () => setSecondsLeft(initialSeconds),
    reset: () => setSecondsLeft(0),
  };
}
