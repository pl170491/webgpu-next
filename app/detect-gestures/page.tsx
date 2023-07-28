'use client';

import {
  useRef,
  PointerEventHandler,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

function normalizeLocation(location: CanvasCoord, canvasDim: CanvasCoord) {
  let newX = (2 * location.x) / canvasDim.x - 1;
  let newY = 1 - (2 * location.y) / canvasDim.y;
  return {
    x: newX,
    y: newY,
  };
}

function locationDifference(l0: CanvasCoord, l1: CanvasCoord) {
  let newX = l1.x - l0.x;
  let newY = l1.y - l0.y;
  return {
    x: newX,
    y: newY,
  };
}

function distance(l0: CanvasCoord, l1: CanvasCoord) {
  const diff = locationDifference(l0, l1);
  return Math.abs(Math.sqrt(Math.pow(diff.x, 2) + Math.pow(diff.y, 2)));
}

function viewFromZoom(
  zoom: number,
  zoomDelta: number,
  centerCoord: CanvasCoord,
  eventCoord: CanvasCoord
) {
  const newZoom = zoom * (1 + zoomDelta);
  const newCenter = {
    x: centerCoord.x - (eventCoord.x - centerCoord.x) * zoomDelta,
    y: centerCoord.y - (eventCoord.y - centerCoord.y) * zoomDelta,
  };

  return { zoom: newZoom, center: newCenter };
}

interface CanvasCoord {
  x: number;
  y: number;
}
interface Pointer {
  pointerId: number;
  current: CanvasCoord;
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

  const [zoom, setZoom] = useState(1.0);
  const [center, setCenter] = useState({
    x: 0.0,
    y: 0.0,
  });
  const [rotation, setRotation] = useState(0);

  const [pointers, setPointers] = useState<Pointer[]>([]);

  const pointerMoveHandler: PointerEventHandler<HTMLCanvasElement> = (e) => {
    e.preventDefault();

    const eventPointerId = e.nativeEvent.pointerId;
    const eventLocation = normalizeLocation(
      {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      },
      canvasDim
    );
    const eventPointer = {
      pointerId: eventPointerId,
      current: {
        x: eventLocation.x,
        y: eventLocation.y,
      },
    };
    setPointers((pointers) => {
      return pointers.map((pointer, i) => {
        const pointerId = pointer.pointerId;
        if (pointerId === eventPointerId) {
          if (i == 0 && pointers.length == 1) {
            setCenter({
              x: center.x + (eventPointer.current.x - pointer.current.x),
              y: center.y + (eventPointer.current.y - pointer.current.y),
            });
          } else if (i == 0 && pointers.length == 2) {
            const otherPointer = pointers[1];
            const zoomDiff =
              distance(eventPointer.current, otherPointer.current) -
              distance(pointer.current, otherPointer.current);
            const prevAverage = {
              x: (pointer.current.x + otherPointer.current.x) / 2,
              y: (pointer.current.y + otherPointer.current.y) / 2,
            };
            const currentAverage = {
              x: (eventPointer.current.x + otherPointer.current.x) / 2,
              y: (eventPointer.current.y + otherPointer.current.y) / 2,
            };
            const diffAverage = locationDifference(prevAverage, currentAverage);

            setZoom((zoom) => zoom * (1 + zoomDiff / 2));
            setCenter((center) => {
              return {
                x: center.x + diffAverage.x / 2,
                y: center.y + diffAverage.y / 2,
              };
            });
          } else if (i == 1) {
            const otherPointer = pointers[0];
            const zoomDiff =
              distance(eventPointer.current, otherPointer.current) -
              distance(pointer.current, otherPointer.current);
            const prevAverage = {
              x: (pointer.current.x + otherPointer.current.x) / 2,
              y: (pointer.current.y + otherPointer.current.y) / 2,
            };
            const currentAverage = {
              x: (eventPointer.current.x + otherPointer.current.x) / 2,
              y: (eventPointer.current.y + otherPointer.current.y) / 2,
            };
            const diffAverage = locationDifference(prevAverage, currentAverage);

            setZoom((zoom) => zoom * (1 + zoomDiff / 2));
            setCenter((center) => {
              return {
                x: center.x + diffAverage.x / 2,
                y: center.y + diffAverage.y / 2,
              };
            });
          }
          return eventPointer;
        } else {
          return pointer;
        }
      });
    });
  };

  const pointerDownHandler: PointerEventHandler<HTMLCanvasElement> = (e) => {
    e.preventDefault();

    const pointerId = e.nativeEvent.pointerId;
    const eventLocation = normalizeLocation(
      {
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      },
      canvasDim
    );

    var newPointers = [];
    for (const pointer of pointers) {
      newPointers.push({
        pointerId: pointer.pointerId,
        current: {
          x: pointer.current.x,
          y: pointer.current.y,
        },
      });
    }
    newPointers.push({
      pointerId: pointerId,
      current: {
        x: eventLocation.x,
        y: eventLocation.y,
      },
    });

    setPointers(newPointers);
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

  const wheelEventHandler = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = -e.deltaY / 1000;
      const eventCoord = normalizeLocation(
        { x: e.offsetX, y: e.offsetY },
        canvasDim
      );
      const newView = viewFromZoom(zoom, zoomDelta, center, eventCoord);

      setZoom(newView.zoom);
      setCenter(newView.center);
    },
    [zoom, center, canvasDim]
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
    console.log('draw');
    const context = contextRef.current;
    if (!context) return;

    // context.transform(
    //   Math.cos(rotation),
    //   Math.sin(rotation),
    //   -Math.sin(rotation),
    //   Math.cos(rotation),
    //   ((1 - Math.cos(rotation) + Math.sin(rotation)) * canvasDim.x) / 2,
    //   ((1 - Math.sin(rotation) - Math.cos(rotation)) * canvasDim.y) / 2
    // );

    // @ts-ignore https://github.com/microsoft/TypeScript/issues/55162
    context.reset();

    context.strokeRect(0, canvasDim.y / 2 - 1, canvasDim.x, 2);
    console.log(center);

    const direction = {
      x: Math.cos(rotation),
      y: -Math.sin(rotation),
    };
    // console.log(center);
    const radius = distance({ x: 0, y: 0 }, center);
    console.log(radius);

    context.transform(
      1,
      0,
      0,
      1,
      ((1 + center.x) * canvasDim.x) / 2,
      ((1 - center.y) * canvasDim.y) / 2
    );
    context.transform(
      zoom,
      0,
      0,
      zoom,
      (-zoom * canvasDim.x) / 2,
      (-zoom * canvasDim.y) / 2
    );

    // context.transform(1, 0, 0, 1, (radius * canvasDim.x) / 2, 0);

    context.transform(
      Math.cos(rotation),
      Math.sin(rotation),
      -Math.sin(rotation),
      Math.cos(rotation),
      ((1 - Math.cos(rotation) + Math.sin(rotation)) * canvasDim.x) / 2,
      ((1 - Math.sin(rotation) - Math.cos(rotation)) * canvasDim.y) / 2
    );

    context.strokeRect(canvasDim.x / 2 - 1, canvasDim.y / 2 - 1, 2, 2);
    context.strokeRect(0, canvasDim.y / 2 - 1, canvasDim.x, 2);
    context.strokeRect(
      canvasDim.x / 3,
      canvasDim.y / 3,
      canvasDim.x / 3,
      canvasDim.y / 3
    );
  }, [zoom, center, rotation, canvasDim]);

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={pointerDownHandler}
        onPointerUp={pointerUpHandler}
        onPointerMove={pointerMoveHandler}
        width={canvasDim.x}
        height={canvasDim.y}
        style={{ border: 'solid', margin: '10px', touchAction: 'none' }}
      ></canvas>
      <br />
      <button
        onClick={(e) => {
          e.preventDefault();
          setRotation(rotation + Math.PI / 8);
        }}
      >
        Rotate Clockwise
      </button>
    </>
  );
}
