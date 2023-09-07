'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import shaderWgsl from './shader.wgsl';

import { gpuContext, gpuDraw, setupGpu, useBuffer } from './gpuUtils';

enum WGSLPrimitive {
  f32,
  i32,
  u32,
}

interface CanvasDimensions {
  width: number;
  height: number;
}

interface Bounds {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

function verticesFromBounds(
  bounds: Bounds,
  thickness: number,
  canvasDimensions: CanvasDimensions
) {
  const canvasWidth = canvasDimensions.width;
  const canvasHeight = canvasDimensions.height;
  const thickScaling =
    canvasWidth > canvasHeight ? 2.0 / canvasHeight : 2.0 / canvasWidth;
  const thick = thickness * thickScaling;
}

export function GlobalCanvas({ gpuDevice }: { gpuDevice: GPUDevice }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasDimensions = useMemo<CanvasDimensions>(() => {
    return {
      width: 300,
      height: 300,
    };
  }, []);

  // console.log(gpuDevice.limits.maxTextureDimension2D);

  const [bounds, setBounds] = useState<Bounds>({
    left: -0.25,
    right: 0.25,
    bottom: -0.25,
    top: 0.25,
  });

  const [canvasBuffer, writeCanvasBuffer] = useBuffer(gpuDevice, {
    size: Uint32Array.BYTES_PER_ELEMENT * 2,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
  });

  const numVertices = 6;
  const vertexStride = Float32Array.BYTES_PER_ELEMENT * 8; // [x, y, z, w, r, g, b, alpha] per vertex
  const [vertexBuffer, writeVertexBuffer] = useBuffer(gpuDevice, {
    size: numVertices * vertexStride,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
  });

  const buffers: GPUBuffer[] = useMemo(() => {
    return [canvasBuffer, vertexBuffer];
  }, [canvasBuffer, vertexBuffer]);

  // prettier-ignore
  const redBox = [
    -0.5 , -0.5 , 0.0 , 0.0 , 1.0 , 0.0 , 0.0 , 1.0 ,
    -0.5 ,  0.5 , 0.0 , 0.0 , 1.0 , 0.0 , 0.0 , 1.0 ,
     0.5 , -0.5 , 0.0 , 0.0 , 1.0 , 0.0 , 0.0 , 1.0 ,
    -0.5 ,  0.5 , 0.0 , 0.0 , 1.0 , 0.0 , 0.0 , 1.0 ,
     0.5 ,  0.5 , 0.0 , 0.0 , 1.0 , 0.0 , 0.0 , 1.0 ,
     0.5 , -0.5 , 0.0 , 0.0 , 1.0 , 0.0 , 0.0 , 1.0 ,
  ]

  // Buffer initialization
  writeCanvasBuffer([
    new Uint32Array([canvasDimensions.width, canvasDimensions.height]),
  ]);
  writeVertexBuffer([new Float32Array(redBox)]);

  useEffect(() => {
    const context = gpuContext(gpuDevice, canvasRef.current);
    const gpu = setupGpu(gpuDevice, buffers, shaderWgsl);
    const frame = () => {
      gpuDraw(
        gpuDevice,
        context,
        buffers,
        gpu.bindGroupLayout,
        gpu.pipeline,
        numVertices
      );
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [gpuDevice, buffers]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        style={{ border: 'solid', margin: '10px' }}
      ></canvas>
    </>
  );
}
