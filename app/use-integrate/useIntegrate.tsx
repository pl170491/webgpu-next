import { useState, useCallback } from 'react';

export default function useIntegrate<T>(
  init: T,
  integrator: (curr: T, diff: T) => T,
  maxBufferLength: number = Infinity
): [T, (delta: T) => void, () => T | null] {
  const [deltas, setDeltas] = useState<{ prev: T; delta: T }[]>([]);
  const [sumDeltas, setIntegral] = useState(init);

  const integrate = useCallback(
    (delta: T) => {
      setIntegral((i) => {
        return integrator(i, delta);
      });
    },
    [integrator]
  );

  const addDelta = useCallback(
    (delta: T) => {
      const newDelta = { prev: sumDeltas, delta: delta };
      const newDeltas =
        deltas.length < maxBufferLength
          ? [...deltas, newDelta]
          : [...deltas.slice(1), newDelta];
      setDeltas(newDeltas);
      integrate(delta);
    },
    [deltas, integrate, sumDeltas, maxBufferLength]
  );

  const removeDelta = useCallback(() => {
    if (deltas.length > 0) {
      const lastDelta = deltas[deltas.length - 1];
      setIntegral(lastDelta.prev);
      setDeltas(deltas.slice(0, -1));
      return lastDelta.delta;
    } else {
      return null;
    }
  }, [deltas]);

  return [sumDeltas, addDelta, removeDelta];
}
