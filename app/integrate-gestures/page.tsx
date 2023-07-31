'use client';
import {
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
  PointerEventHandler,
} from 'react';
import useIntegrate from './useIntegrate';

interface CanvasCoord {
  x: number;
  y: number;
}
interface Pointer {
  pointerId: number;
  button: number;
  coord: CanvasCoord;
}

function diffCoord(l0: CanvasCoord, l1: CanvasCoord): CanvasCoord {
  return { x: l1.x - l0.x, y: l1.y - l0.y };
}

function addCoord(l0: CanvasCoord, l1: CanvasCoord): CanvasCoord {
  return { x: l0.x + l1.x, y: l0.y + l1.y };
}

function normCoord(location: CanvasCoord, canvasDim: CanvasCoord): CanvasCoord {
  const newX = (2 * location.x) / canvasDim.x - 1;
  const newY = 1 - (2 * location.y) / canvasDim.y;
  return {
    x: newX,
    y: newY,
  };
}

function canvasCoord(
  location: CanvasCoord,
  canvasDim: CanvasCoord
): [number, number] {
  return [
    ((1 + location.x) * canvasDim.x) / 2,
    ((1 - location.y) * canvasDim.y) / 2,
  ];
}

export default function Index() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const canvasDim = useMemo(() => {
    return {
      x: 300,
      y: 300,
    };
  }, []);

  const [pointers, setPointers] = useState<Pointer[]>([]);

  const viewOffsetIntegrator = useCallback(
    (curr: CanvasCoord, diff: CanvasCoord) => {
      return addCoord(curr, diff);
    },
    []
  );
  const [viewOffset, deltaViewOffset] = useIntegrate(
    { x: 0, y: 0 } as CanvasCoord,
    viewOffsetIntegrator
  );

  const viewAngleIntegrator = useCallback((curr: number, diff: number) => {
    return curr - diff;
  }, []);
  const [viewTheta, deltaViewTheta] = useIntegrate(0, viewAngleIntegrator);
  // const [viewPhi, deltaViewPhi] = useIntegrate(0, viewAngleIntegrator);

  const pointerMoveHandler: PointerEventHandler<HTMLCanvasElement> = (e) => {
    e.preventDefault();

    const eventPointerId = e.nativeEvent.pointerId;
    const eventLocation = normCoord(
      {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      },
      canvasDim
    );
    const eventPointer = {
      pointerId: eventPointerId,
      button: e.button,
      coord: {
        x: eventLocation.x,
        y: eventLocation.y,
      },
    };

    setPointers(
      pointers.map((pointer, i) => {
        const pointerId = pointer.pointerId;
        const pointerButton = pointer.button;
        if (pointerId === eventPointerId) {
          if (i == 0 && pointers.length == 1) {
            if (pointerButton === 0) {
              deltaViewOffset(diffCoord(pointer.coord, eventPointer.coord));
            } else if (pointerButton === 1) {
              deltaViewTheta(
                (eventPointer.coord.x - pointer.coord.x) * Math.PI
              );
              // deltaViewPhi((eventPointer.coord.y - pointer.coord.y) * Math.PI);
            }
          }
          if (eventPointer.button === -1) {
            return { ...eventPointer, button: pointerButton };
          } else {
            return eventPointer;
          }
        } else {
          return pointer;
        }
      })
    );
  };

  const pointerDownHandler: PointerEventHandler<HTMLCanvasElement> = (e) => {
    e.preventDefault();

    const eventPointerId = e.nativeEvent.pointerId;
    const eventLocation = normCoord(
      {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      },
      canvasDim
    );
    const eventPointer = {
      pointerId: eventPointerId,
      button: e.button,
      coord: {
        x: eventLocation.x,
        y: eventLocation.y,
      },
    };

    setPointers([...pointers, eventPointer]);
  };

  const pointerUpHandler: PointerEventHandler<HTMLCanvasElement> = (e) => {
    e.preventDefault();

    const pointerId = e.nativeEvent.pointerId;
    setPointers(
      pointers.filter((pointer) => {
        return pointer.pointerId != pointerId;
      })
    );
  };

  useEffect(() => {
    if (!canvasRef.current) return () => {};

    const htmlCanvas = canvasRef.current;
    const context = htmlCanvas.getContext('2d');
    contextRef.current = context;

    return () => {
      // @ts-ignore https://github.com/microsoft/TypeScript/issues/55162
      context?.reset();
    };
  }, [canvasRef]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;

    // @ts-ignore https://github.com/microsoft/TypeScript/issues/55162
    context.reset();

    var rectCoords = {
      p0: { x: -0.5, y: -0.5 },
      p1: { x: 0.5, y: 0.5 },
    };

    rectCoords = {
      p0: addCoord(rectCoords.p0, viewOffset),
      p1: addCoord(rectCoords.p1, viewOffset),
    };

    const rectCanvasCoords = [
      ...canvasCoord(rectCoords.p0, canvasDim),
      ...canvasCoord(rectCoords.p1, canvasDim),
    ];

    context.strokeRect(
      rectCanvasCoords[0],
      rectCanvasCoords[1],
      rectCanvasCoords[2] - rectCanvasCoords[0],
      rectCanvasCoords[3] - rectCanvasCoords[1]
    );
  }, [canvasDim, viewOffset]);

  // useEffect(() => {
  //   console.log(viewOffset);
  // }, [viewOffset]);

  // useEffect(() => {
  //   console.log(viewTheta);
  // }, [viewTheta]);

  // useEffect(() => {
  //   console.log(viewPhi);
  // }, [viewPhi]);

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={pointerDownHandler}
        onPointerUp={pointerUpHandler}
        onPointerMove={pointerMoveHandler}
        onPointerLeave={pointerUpHandler}
        width={canvasDim.x}
        height={canvasDim.y}
        style={{ border: 'solid', margin: '10px', touchAction: 'none' }}
      ></canvas>
    </>
  );
}
