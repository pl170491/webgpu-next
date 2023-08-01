'use client';

import { RefObject, useMemo, useRef, PointerEventHandler } from 'react';
import { Vec2 } from './vec';

enum PointerEvent {
  over = 'pointerover',
  enter = 'pointerenter',
  down = 'pointerdown',
  move = 'pointermove',
  up = 'pointerup',
  cancel = 'pointercancel',
  out = 'pointerout',
  leave = 'pointerleave',
}

function PointerCanvas({
  canvasDimensions,
  canvasRef,
  pointerSense,
}: {
  canvasDimensions: Vec2;
  canvasRef: RefObject<HTMLCanvasElement>;
  pointerSense: PointerEvent[];
}) {
  const pointerEventHandler: PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (pointerSense.includes(e.type as PointerEvent)) {
      console.log(e.type as PointerEvent);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasDimensions.x}
      height={canvasDimensions.y}
      onPointerCancel={pointerEventHandler}
      onPointerDown={pointerEventHandler}
      onPointerEnter={pointerEventHandler}
      onPointerLeave={pointerEventHandler}
      onPointerMove={pointerEventHandler}
      onPointerOut={pointerEventHandler}
      onPointerOver={pointerEventHandler}
      onPointerUp={pointerEventHandler}
      style={{ border: 'solid', margin: '10px', touchAction: 'none' }}
    ></canvas>
  );
}

export default function Index() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasDim = useMemo(() => {
    return { x: 300, y: 300 } as Vec2;
  }, []);

  return (
    <>
      <PointerCanvas
        canvasDimensions={canvasDim}
        canvasRef={canvasRef}
        pointerSense={[PointerEvent.enter, PointerEvent.leave]}
      ></PointerCanvas>
    </>
  );
}
