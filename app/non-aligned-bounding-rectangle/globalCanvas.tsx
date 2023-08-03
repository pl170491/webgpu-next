'use client';

import { useRef, useMemo } from 'react';

export function GlobalCanvas({ gpuDevice }: { gpuDevice: GPUDevice }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const canvasDimensions = useMemo(() => {
    return {
      x: 300,
      y: 300,
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={canvasDimensions.x}
        height={canvasDimensions.y}
        style={{ border: 'solid', margin: '10px' }}
      ></canvas>
    </>
  );
}
