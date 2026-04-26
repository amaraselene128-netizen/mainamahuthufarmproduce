import { useEffect, useState } from "react";

/**
 * Returns a value that changes every `intervalMs` (default 1 hour).
 * Use as a `shuffleSeed` to trigger reshuffle/refresh on a fixed cadence.
 */
export function useHourlySeed(intervalMs: number = 60 * 60 * 1000) {
  const [seed, setSeed] = useState(() => Math.floor(Date.now() / intervalMs));

  useEffect(() => {
    const tick = () => setSeed(Math.floor(Date.now() / intervalMs));
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const msUntilNext = intervalMs - (Date.now() % intervalMs);
    const timeoutId = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, intervalMs);
    }, msUntilNext + 50);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalMs]);

  return seed;
}
