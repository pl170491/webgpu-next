import { useState, useCallback } from 'react';

export default function useIntegrate<S, D>(
  init: S,
  integrator: (curr: S, diff: D) => S,
  maxBufferLength: number = Infinity
): [S, (delta: D) => void, () => void] {
  const [_deltas, setDeltas] = useState<{ prev: S; delta: D }[]>([]);
  const [sumDeltas, setIntegral] = useState(init);

  const integrate = useCallback(
    (delta: D) => {
      setIntegral((i) => {
        return integrator(i, delta);
      });
    },
    [integrator]
  );

  const addDelta = useCallback(
    (delta: D) => {
      integrate(delta);
      setDeltas((deltas) => {
        const newDelta = { prev: sumDeltas, delta: delta };
        const newDeltas =
          deltas.length < maxBufferLength
            ? [...deltas, newDelta]
            : [...deltas.slice(1), newDelta];
        return newDeltas;
      });
    },
    [integrate, sumDeltas, maxBufferLength]
  );

  const removeDelta = useCallback(() => {
    setDeltas((deltas) => {
      if (deltas.length > 0) {
        const lastDelta = deltas[deltas.length - 1];
        setIntegral(lastDelta.prev);
        return deltas.slice(0, -1);
      } else {
        return deltas;
      }
    });
  }, []);

  return [sumDeltas, addDelta, removeDelta];
}
