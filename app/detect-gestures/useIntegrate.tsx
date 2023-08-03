import { useState, useCallback, useRef } from 'react';

interface MetaDelta<S, D> {
  prevIntegral: S;
  delta: D;
}

export default function useIntegrate<S, D>(
  init: S,
  integrator: (integral: S, delta: D) => S,
  maxBufferLength: number = Infinity
): [S, (delta: D) => void, () => void, () => MetaDelta<S, D>[]] {
  const deltas = useRef<MetaDelta<S, D>[]>([]);
  const [integral, setIntegral] = useState(init);

  const integrate = useCallback(
    (delta: D) => {
      setIntegral((integral) => {
        return integrator(integral, delta);
      });
    },
    [integrator]
  );

  const addDelta = useCallback(
    (delta: D) => {
      integrate(delta);
      deltas.current = (() => {
        const newDelta = { prevIntegral: integral, delta: delta };
        const newDeltas =
          deltas.current.length < maxBufferLength
            ? [...deltas.current, newDelta]
            : [...deltas.current.slice(1), newDelta];
        return newDeltas;
      })();
    },
    [integrate, integral, maxBufferLength]
  );

  const removeDelta = useCallback(() => {
    deltas.current = (() => {
      if (deltas.current.length > 0) {
        const lastDelta = deltas.current[deltas.current.length - 1];
        setIntegral(lastDelta.prevIntegral);
        return deltas.current.slice(0, -1);
      } else {
        return deltas.current;
      }
    })();
  }, []);

  const getDeltas = useCallback(() => {
    return [...deltas.current];
  }, []);

  return [integral, addDelta, removeDelta, getDeltas];
}
