'use client';
import { useState, useCallback } from 'react';

import useIntegrate from './useIntegrate';

export default function Index() {
  const [multiplier, setMultiplier] = useState(0);

  const integratorCallback = useCallback(
    (curr: number, diff: number) => {
      return curr + multiplier * diff;
    },
    [multiplier]
  );
  const [sumDeltas, addDelta, removeDelta] = useIntegrate(
    1,
    integratorCallback
  );

  return (
    <>
      <div>{sumDeltas}</div>
      <br />
      <button
        onClick={() => {
          addDelta(1);
        }}
      >
        Add
      </button>
      <button
        onClick={() => {
          removeDelta();
        }}
      >
        Remove
      </button>
      <br />
      <button
        onClick={() => {
          setMultiplier(multiplier + 1);
        }}
      >
        Increment Multiplier
      </button>
    </>
  );
}
