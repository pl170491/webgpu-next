'use client';

import { useState, ReactNode, ChangeEventHandler, RefObject } from 'react';

export default function DimensionedCanvas({
  canvasDimensions,
  setCanvasDimensions,
  canvasRef,
}: {
  canvasDimensions: { x: number; y: number };
  setCanvasDimensions: Function;
  canvasRef: RefObject<HTMLCanvasElement>;
}) {
  const canvasElem = (
    <canvas
      onScroll={(event) => {
        console.log('event');
      }}
      ref={canvasRef}
      width={canvasDimensions.x}
      height={canvasDimensions.y}
      style={{ border: 'solid', margin: '10px' }}
    ></canvas>
  );

  function CanvasDimensionsForm({
    canvasDimensions,
    setDimensionsCallback,
  }: {
    canvasDimensions: { x: number; y: number };
    setDimensionsCallback: Function;
  }) {
    const [canvasInputDimensions, setCanvasInputDimensions] = useState({
      x: canvasDimensions.x.toString(),
      y: canvasDimensions.y.toString(),
    });

    return (
      <form
        action=''
        onSubmit={(e) => {
          e.preventDefault();
          const xParsed = parseInt(canvasInputDimensions.x);
          const yParsed = parseInt(canvasInputDimensions.y);
          const dims = { x: canvasDimensions.x, y: canvasDimensions.y };

          if (!Number.isNaN(xParsed)) {
            dims.x = xParsed;
          }
          if (!Number.isNaN(yParsed)) {
            dims.y = yParsed;
          }

          setCanvasInputDimensions({
            x: dims.x.toString(),
            y: dims.y.toString(),
          });
          setDimensionsCallback(dims);
        }}
      >
        <CanvasDimensionInput
          min={0}
          max={8096}
          inputName={'canvas-x'}
          inputString={canvasInputDimensions.x}
          onChange={(e) => {
            e.preventDefault();
            setCanvasInputDimensions({
              x: e.currentTarget.value,
              y: canvasInputDimensions.y,
            });
          }}
        >
          Canvas Width
        </CanvasDimensionInput>
        <CanvasDimensionInput
          min={0}
          max={8096}
          inputName={'canvas-y'}
          inputString={canvasInputDimensions.y}
          onChange={(e) => {
            e.preventDefault();
            setCanvasInputDimensions({
              x: canvasInputDimensions.x,
              y: e.currentTarget.value,
            });
          }}
        >
          Canvas Height
        </CanvasDimensionInput>
        <input type='submit' value='Submit' />
      </form>
    );
  }

  function CanvasDimensionInput({
    children,
    min,
    max,
    inputName,
    inputString,
    onChange,
  }: {
    children: ReactNode;
    min: number;
    max: number;
    inputName: string;
    inputString: string;
    onChange: ChangeEventHandler<HTMLInputElement>;
  }) {
    return (
      <>
        <label htmlFor={inputName}>{children}</label>
        <input
          type='number'
          id={inputName}
          min={min}
          max={max}
          value={inputString}
          onChange={onChange}
        />
      </>
    );
  }

  return (
    <>
      <CanvasDimensionsForm
        canvasDimensions={canvasDimensions}
        setDimensionsCallback={setCanvasDimensions}
      ></CanvasDimensionsForm>
      {canvasDimensions.x && canvasDimensions.y ? canvasElem : <></>}
    </>
  );
}
