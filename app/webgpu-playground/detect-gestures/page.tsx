'use client';
import {
  useMemo,
  useCallback,
  useEffect,
  useRef,
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
interface CanvasView {
  pointers: Pointer[];
  viewOffset: { x: number; y: number };
  viewAngle: number;
  viewZoom: number;
}
enum CanvasEventType {
  down = 'pointerdown',
  move = 'pointermove',
  up = 'pointerup',
  leave = 'pointerleave',
  wheelscroll = 'wheelscroll',
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
    x: -(eventCoord.x - centerCoord.x) * zoomDelta,
    y: -(eventCoord.y - centerCoord.y) * zoomDelta,
  };
}

function keepButton(newPointer: Pointer, oldPointer: Pointer): Pointer {
  return {
    ...newPointer,
    button: oldPointer.button,
  };
}

function newView(
  curr: CanvasView,
  eventPointer: Pointer,
  eventPointerType: CanvasEventType
): CanvasView {
  const viewDiff: CanvasView = (() => {
    switch (eventPointerType) {
      case CanvasEventType.move: {
        for (var i = 0; i < curr.pointers.length; i++) {
          const pointer = curr.pointers[i];
          const pointerId = pointer.pointerId;
          const pointerButton = pointer.button;
          const pointerInit = pointer.init;

          if (pointerId !== eventPointer.pointerId) {
            continue;
          }
          const newEventPointer = keepButton(eventPointer, pointer);

          const doubleTouchResponse = (otherPointer: Pointer) => {
            const pointerAvg = scaleCoord(
              addCoord(pointer.curr, otherPointer.curr),
              0.5
            );
            const eventPointerAvg = scaleCoord(
              addCoord(eventPointer.curr, otherPointer.curr),
              0.5
            );
            const diffAverage = diffCoord(pointerAvg, eventPointerAvg);

            const zoomDiff =
              (distanceCoord(eventPointer.curr, otherPointer.curr) -
                distanceCoord(pointer.curr, otherPointer.curr)) /
              2;

            const pointerInitAvg = scaleCoord(
              addCoord(pointerInit, otherPointer.init),
              0.5
            );

            const zoomOffset = offsetFromZoom(
              zoomDiff,
              curr.viewOffset,
              pointerInitAvg
            );

            const angleDiff =
              angleCoord(diffCoord(eventPointer.curr, otherPointer.curr)) -
              angleCoord(diffCoord(pointer.curr, otherPointer.curr));

            return {
              viewOffset: addCoord(diffAverage, zoomOffset),
              viewAngle: angleDiff,
              viewZoom: zoomDiff,
            };
          };

          if (
            eventPointer.button != -1 &&
            eventPointer.button != 0 &&
            eventPointer.button != 1
          ) {
            return {
              pointers: [],
              viewOffset: { x: 0, y: 0 },
              viewAngle: 0,
              viewZoom: 0,
            };
          }
          if (i == 0 && curr.pointers.length == 1) {
            if (pointerButton === 0) {
              return {
                pointers: [newEventPointer],
                viewOffset: diffCoord(pointer.curr, newEventPointer.curr),
                viewAngle: 0,
                viewZoom: 0,
              };
            } else if (pointerButton === 1) {
              return {
                pointers: [newEventPointer],
                viewOffset: { x: 0, y: 0 },
                viewAngle: (pointer.curr.x - newEventPointer.curr.x) * Math.PI,
                viewZoom: 0,
              };
            }
          } else if (i == 0 && curr.pointers.length == 2) {
            const otherPointer = curr.pointers[1];
            const viewDiffs = doubleTouchResponse(otherPointer);
            return {
              ...viewDiffs,
              pointers: [newEventPointer, ...curr.pointers.slice(1)],
            };
          } else if (i == 1) {
            const otherPointer = curr.pointers[0];
            const viewDiffs = doubleTouchResponse(otherPointer);
            return {
              ...viewDiffs,
              pointers: [
                curr.pointers[0],
                newEventPointer,
                ...curr.pointers.slice(2),
              ],
            };
          }
        }

        return {
          pointers: [...curr.pointers],
          viewOffset: { x: 0, y: 0 },
          viewAngle: 0,
          viewZoom: 0,
        };
      }
      case CanvasEventType.down: {
        const currentPointers = curr.pointers.map((pointer) => {
          return {
            ...pointer,
            init: pointer.curr,
          };
        });
        return {
          pointers: [...currentPointers, eventPointer],
          viewOffset: { x: 0, y: 0 },
          viewAngle: 0,
          viewZoom: 0,
        };
      }
      case CanvasEventType.leave:
      case CanvasEventType.up: {
        return {
          pointers: curr.pointers.filter((pointer) => {
            return pointer.pointerId != eventPointer.pointerId;
          }),
          viewOffset: { x: 0, y: 0 },
          viewAngle: 0,
          viewZoom: 0,
        };
      }
      case CanvasEventType.wheelscroll: {
        // Creative use of the pointer class :p
        const zoomDelta = eventPointer.pointerId;
        const offset = offsetFromZoom(
          zoomDelta,
          curr.viewOffset,
          eventPointer.curr
        );

        return {
          pointers: [...curr.pointers],
          viewOffset: offset,
          viewAngle: 0,
          viewZoom: zoomDelta,
        };
      }
      default: {
        return {
          pointers: [...curr.pointers],
          viewOffset: { x: 0, y: 0 },
          viewAngle: 0,
          viewZoom: 0,
        };
      }
    }
  })();

  return {
    pointers: [...viewDiff.pointers],
    viewOffset: addCoord(curr.viewOffset, viewDiff.viewOffset),
    viewAngle: curr.viewAngle + viewDiff.viewAngle,
    viewZoom: curr.viewZoom * (1 + viewDiff.viewZoom),
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

  const viewIntegrator = useCallback(
    (
      curr: CanvasView,
      delta: { pointer: Pointer; pointerType: CanvasEventType }
    ) => {
      return newView(curr, delta.pointer, delta.pointerType);
    },
    []
  );
  const initView = {
    pointers: [],
    viewOffset: { x: 0, y: 0 },
    viewAngle: 0,
    viewZoom: 1,
  };
  const [view, deltaView, _, getViewDeltas] = useIntegrate(
    initView,
    viewIntegrator
  );

  const pointerHandler: PointerEventHandler<HTMLCanvasElement> = (event) => {
    event.preventDefault();

    const eventPointerType = event.type as CanvasEventType;
    const eventButtons = event.buttons;
    const eventButton = event.button;
    if (eventPointerType == CanvasEventType.move && eventButtons == 0) return;

    console.log(event);
    const eventPointerId = event.nativeEvent.pointerId;
    const eventLocation = normCoord(
      {
        x: event.nativeEvent.offsetX,
        y: event.nativeEvent.offsetY,
      },
      canvasDim
    );
    const eventPointer = {
      pointerId: eventPointerId,
      button: eventButton,
      init: eventLocation,
      curr: eventLocation,
    };

    deltaView({ pointer: eventPointer, pointerType: eventPointerType });
  };

  const wheelEventHandler = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const eventType = CanvasEventType.wheelscroll;
      const eventCoord = normCoord({ x: e.offsetX, y: e.offsetY }, canvasDim);
      const zoomDelta = -e.deltaY / 1000;

      const wheelPointer = {
        pointerId: zoomDelta,
        button: 1,
        init: eventCoord,
        curr: eventCoord,
      };

      deltaView({ pointer: wheelPointer, pointerType: eventType });
    },
    [canvasDim, deltaView]
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
      return rotateCoord(coord, view.viewAngle);
    });

    rectCoords = rectCoords.map((coord) => {
      return scaleCoord(coord, view.viewZoom);
    });

    rectCoords = rectCoords.map((coord) => {
      return addCoord(coord, view.viewOffset);
    });

    rectCoords = rectCoords.map((coord) => {
      return canvasCoord(coord, canvasDim);
    });

    context.lineWidth = view.viewZoom;
    context.beginPath();
    context.moveTo(rectCoords[0].x, rectCoords[0].y);
    for (var i = 0; i < rectCoords.length; i++) {
      const index = (i + 1) % rectCoords.length;
      context.lineTo(rectCoords[index].x, rectCoords[index].y);
    }

    context.stroke();
  }, [canvasDim, view]);

  useEffect(() => {
    console.log(getViewDeltas());
  }, [view, getViewDeltas]);

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={pointerHandler}
        onPointerUp={pointerHandler}
        onPointerMove={pointerHandler}
        onPointerLeave={pointerHandler}
        width={canvasDim.x}
        height={canvasDim.y}
        style={{ border: 'solid', margin: '10px', touchAction: 'none' }}
      ></canvas>
    </>
  );
}
