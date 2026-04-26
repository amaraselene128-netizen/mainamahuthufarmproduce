import { useEffect, useState } from "react";

/**
 * Returns a value that changes every `intervalMs` (default 1 hour).
 * Use as a `shuffleSeed` to trigger reshuffle/refresh on a fixed cadence.
 */
export function useHourlySeed(intervalMs: number = 60 * 60 * 1000) {
  const [seed, setSeed] = useState(() => Math.floor(Date.now() / intervalMs));

  useEffect(() => {
    const tick = () => setSeed(Math.floor(Date.now() / intervalMs));
    // align next tick to the interval boundary
    const msUntilNext = intervalMs - (Date.now() % intervalMs);
    const timeout = setTimeout(() => {
      tick();
      const interval = setInterval(tick, intervalMs);
      // store on closure for cleanup
      (timeout as any)._interval = interval;
    }, msUntilNext + 50);

    return () => {
      clearTimeout(timeout);
      const interval = (timeout as any)._interval;
      if (interval) clearInterval(interval);
    };
  }, [intervalMs]);

  return seed;
}
