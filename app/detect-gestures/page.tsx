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
  init: CanvasCoord;
  curr: CanvasCoord;
}

function scaleCoord(l: CanvasCoord, zoom: number): CanvasCoord {
  return {
    x: l.x * zoom,
    y: l.y * zoom,
  };
}

function rotateCoord(l: CanvasCoord, theta: number): CanvasCoord {
  return {
    x: l.x * Math.cos(theta) - l.y * Math.sin(theta),
    y: l.x * Math.sin(theta) + l.y * Math.cos(theta),
  };
}

function diffCoord(l0: CanvasCoord, l1: CanvasCoord): CanvasCoord {
  return { x: l1.x - l0.x, y: l1.y - l0.y };
}

function addCoord(l0: CanvasCoord, l1: CanvasCoord): CanvasCoord {
  return { x: l0.x + l1.x, y: l0.y + l1.y };
}

function distanceCoord(l0: CanvasCoord, l1: CanvasCoord) {
  const diff = diffCoord(l0, l1);
  return Math.abs(Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2)));
}

function angleCoord(location: CanvasCoord) {
  return Math.atan(location.y / location.x);
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
): CanvasCoord {
  return {
    x: ((1 + location.x) * canvasDim.x) / 2,
    y: ((1 - location.y) * canvasDim.y) / 2,
  };
}

function offsetFromZoom(
  zoomDelta: number,
  centerCoord: CanvasCoord,
  eventCoord: CanvasCoord
): CanvasCoord {
  return {
    x: -(eventCoord.x - centerCoord.x) * zoomDelta * 2,
    y: -(eventCoord.y - centerCoord.y) * zoomDelta * 2,
  };
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

  const [_, setPointers] = useState<Pointer[]>([]);

  const viewOffsetIntegrator = useCallback(
    (curr: CanvasCoord, diff: CanvasCoord) => {
      return addCoord(curr, scaleCoord(diff, 0.5));
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

  const viewZoomIntegrator = useCallback((curr: number, diff: number) => {
    return curr * (1 + diff);
  }, []);
  const [viewZoom, deltaViewZoom] = useIntegrate(1, viewZoomIntegrator);

  const pointerMoveHandler: PointerEventHandler<HTMLCanvasElement> = (e) => {
    e.preventDefault();
    console.log(e);

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
      curr: eventLocation,
    };

    setPointers((pointers) => {
      return pointers.map((pointer, i) => {
        const pointerId = pointer.pointerId;
        const pointerButton = pointer.button;
        const pointerInit = pointer.init;

        const doubleTouchResponse = (otherPointer: Pointer) => {
          const zoomDiff =
            distanceCoord(eventPointer.curr, otherPointer.curr) -
            distanceCoord(pointer.curr, otherPointer.curr);
          deltaViewZoom(zoomDiff / 2);

          const pointerAvg = scaleCoord(
            addCoord(pointer.curr, otherPointer.curr),
            0.5
          );
          const eventPointerAvg = scaleCoord(
            addCoord(eventPointer.curr, otherPointer.curr),
            0.5
          );
          const diffAverage = diffCoord(pointerAvg, eventPointerAvg);
          deltaViewOffset(diffAverage);

          const angleDiff =
            angleCoord(diffCoord(eventPointer.curr, otherPointer.curr)) -
            angleCoord(diffCoord(pointer.curr, otherPointer.curr));
          deltaViewTheta(-angleDiff / 2);
        };

        if (pointerId === eventPointerId) {
          if (i == 0 && pointers.length == 1) {
            if (pointerButton === 0) {
              deltaViewOffset(diffCoord(pointer.curr, eventPointer.curr));
            } else if (pointerButton === 1) {
              deltaViewTheta(
                ((eventPointer.curr.x - pointer.curr.x) * Math.PI) / 2
              );
              // deltaViewPhi((eventPointer.coord.y - pointer.coord.y) * Math.PI);
            }
          } else if (i == 0 && pointers.length == 2) {
            const otherPointer = pointers[1];
            doubleTouchResponse(otherPointer);
          } else if (i == 1) {
            const otherPointer = pointers[0];
            doubleTouchResponse(otherPointer);
          }
          if (eventPointer.button === -1) {
            return {
              ...eventPointer,
              init: pointerInit,
              button: pointerButton,
            };
          } else {
            return { ...eventPointer, init: pointerInit };
          }
        } else {
          return pointer;
        }
      });
    });
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
      init: eventLocation,
      curr: eventLocation,
    };

    setPointers((pointers) => [...pointers, eventPointer]);
  };

  const pointerUpHandler: PointerEventHandler<HTMLCanvasElement> = (e) => {
    e.preventDefault();

    const pointerId = e.nativeEvent.pointerId;
    setPointers((pointers) => {
      return pointers.filter((pointer) => {
        return pointer.pointerId != pointerId;
      });
    });
  };

  const wheelEventHandler = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = -e.deltaY / 1000;
      const eventCoord = normCoord({ x: e.offsetX, y: e.offsetY }, canvasDim);
      const offset = offsetFromZoom(zoomDelta, viewOffset, eventCoord);

      deltaViewZoom(zoomDelta);
      deltaViewOffset(offset);
    },
    [canvasDim, viewOffset, deltaViewOffset, deltaViewZoom]
  );

  useEffect(() => {
    if (!canvasRef.current) return () => {};

    const htmlCanvas = canvasRef.current;
    const context = htmlCanvas.getContext('2d');
    contextRef.current = context;

    const listenerOptions: AddEventListenerOptions = { passive: false };
    htmlCanvas.addEventListener('wheel', wheelEventHandler, listenerOptions);

    return () => {
      // @ts-ignore https://github.com/microsoft/TypeScript/issues/55162
      context?.reset();

      htmlCanvas.removeEventListener(
        'wheel',
        wheelEventHandler,
        listenerOptions
      );
    };
  }, [canvasRef, wheelEventHandler]);

  useEffect(() => {
    const context = contextRef.current;
    if (!context) return;

    // @ts-ignore https://github.com/microsoft/TypeScript/issues/55162
    context.reset();

    var rectCoords: CanvasCoord[] = [
      { x: -0.5, y: -0.5 },
      { x: -0.5, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.5, y: -0.5 },
    ];

    rectCoords = rectCoords.map((coord) => {
      return rotateCoord(coord, viewTheta);
    });

    rectCoords = rectCoords.map((coord) => {
      return scaleCoord(coord, viewZoom);
    });

    rectCoords = rectCoords.map((coord) => {
      return addCoord(coord, viewOffset);
    });

    rectCoords = rectCoords.map((coord) => {
      return canvasCoord(coord, canvasDim);
    });

    context.lineWidth = viewZoom;
    context.beginPath();
    context.moveTo(rectCoords[0].x, rectCoords[0].y);
    for (var i = 0; i < rectCoords.length; i++) {
      const index = (i + 1) % rectCoords.length;
      context.lineTo(rectCoords[index].x, rectCoords[index].y);
    }

    context.stroke();
  }, [canvasDim, viewOffset, viewTheta, viewZoom]);

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
