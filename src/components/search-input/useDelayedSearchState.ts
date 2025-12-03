import { useEffect, useState } from 'react';

export function useDelayedSearchState(value: boolean, delayMs: number): boolean {
  const [delayedValue, setDelayedValue] = useState(value);

  useEffect(() => {
    if (value) {
      setDelayedValue(true);
      return;
    }

    const timer = setTimeout(() => {
      setDelayedValue(false);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return delayedValue;
}
