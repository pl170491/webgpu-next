'use client';

import { useState } from 'react';

export default function App() {
  const [canvasDimensions, setCanvasDimensions] = useState({ x: 0, y: 0 });
  const [canvasInputDimensions, setCanvasInputDimensions] = useState({
    x: '0',
    y: '0',
  });

  const canvasCornerDimensions = { xMin: 0, xMax: 8096, yMin: 0, yMax: 8096 };
  return (
    <>
      <form
        action=''
        onSubmit={(e) => {
          e.preventDefault();
          const x = parseInt(canvasInputDimensions.x);
          const y = parseInt(canvasInputDimensions.y);

          if (Number.isNaN(x) || Number.isNaN(y)) {
          }
        }}
      >
        <label htmlFor='canvas-x'>Canvas Width</label>
        <input
          type='number'
          name='canvas-x'
          id='canvas-x'
          min={canvasCornerDimensions.xMin}
          max={canvasCornerDimensions.xMax}
          value={canvasInputDimensions.x}
          onChange={(e) => {
            e.preventDefault();
            console.log('canvas-x');
            setCanvasInputDimensions({
              x: e.currentTarget.value,
              y: canvasInputDimensions.y,
            });
          }}
        />
        <label htmlFor='canvas-y'>Canvas Height</label>
        <input
          type='number'
          name='canvas-y'
          id='canvas-y'
          min={canvasCornerDimensions.yMin}
          max={canvasCornerDimensions.yMax}
          value={canvasInputDimensions.y}
          onChange={(e) => {
            e.preventDefault();
            console.log('canvas-y');
            setCanvasInputDimensions({
              x: canvasInputDimensions.x,
              y: e.currentTarget.value,
            });
          }}
        />
        <input type='submit' value='Submit' />
      </form>
      <p>{canvasDimensions.x}</p>
      <p>{canvasDimensions.y}</p>
    </>
  );
}
