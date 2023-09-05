'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

import DimensionedCanvas from './DimensionedCanvas';
import { gpuContext, gpuDraw, setupGpu, getGpu } from './gpuUtils';

import shaderWgsl from './shaders/basic.wgsl';

export default function Index() {
  // Undefined means that it is in the process of getting a GPU.
  // Null means that it failed to get a GPU
  const [gpuDevice, setGpuDevice] = useState<GPUDevice | null | undefined>(
    undefined
  );
  const [canvasDimensions, setCanvasDimensions] = useState({
    x: 256,
    y: 256,
  });
  const [bounds, setBounds] = useState({
    left: -1.0,
    right: 1.0,
    bottom: -1.0,
    top: 1.0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasBufRef = useRef<GPUBuffer | null>(null);
  const lineBufRef = useRef<GPUBuffer | null>(null);
  const numLinesBufRef = useRef<GPUBuffer | null>(null);
  const boundsBufRef = useRef<GPUBuffer | null>(null);

  // Get GPU Device
  const getGpuCallback = useCallback(() => {
    return getGpu(setGpuDevice);
  }, []);
  useEffect(() => {
    return getGpuCallback();
  }, [getGpuCallback]);

  // Set up the GPU
  const setupGpuCallback = useCallback(() => {
    if (!gpuDevice || !canvasRef.current) return;

    const context = gpuContext(gpuDevice, canvasRef.current);
    if (!context) return;

    canvasBufRef.current = gpuDevice.createBuffer({
      size: Uint32Array.BYTES_PER_ELEMENT * 2,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    const numPoints = 1000;
    const numLines = numPoints - 1;
    const lineDataStride = Float32Array.BYTES_PER_ELEMENT * 4;

    lineBufRef.current = gpuDevice.createBuffer({
      size: numLines * lineDataStride,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
    });

    numLinesBufRef.current = gpuDevice.createBuffer({
      size: Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    boundsBufRef.current = gpuDevice.createBuffer({
      size: Float32Array.BYTES_PER_ELEMENT * 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    const buffers: GPUBuffer[] = [
      canvasBufRef.current,
      lineBufRef.current,
      numLinesBufRef.current,
      boundsBufRef.current,
    ];
    const gpu = setupGpu(gpuDevice, buffers, shaderWgsl);

    // To be done on GPU next
    const lines = (() => {
      let pointArr: { x: number; y: number }[] = [];
      let xMin = -1.0;
      let xMax = 1.0;
      let f = (x: number) => {
        return x * x * x;
      };
      for (let i = 0; i < numPoints; i++) {
        let x = xMin + (i * (xMax - xMin)) / (numPoints - 1);
        pointArr.push({ x: x, y: f(x) });
      }
      return pointArr.slice(0, -1).map((_, i) => {
        return {
          x0: pointArr[i].x,
          y0: pointArr[i].y,
          x1: pointArr[i + 1].x,
          y1: pointArr[i + 1].y,
        };
      });
    })();

    const lineData = (() => {
      var data: number[] = [];
      for (const l of lines) {
        data.push(l.x0, l.y0, l.x1, l.y1);
      }
      return data;
    })();

    gpuDevice.queue.writeBuffer(
      lineBufRef.current,
      0,
      new Float32Array(lineData)
    );

    gpuDevice.queue.writeBuffer(
      numLinesBufRef.current,
      0,
      new Uint32Array([numLines])
    );

    const frame = () => {
      gpuDraw(
        gpuDevice,
        context,
        buffers,
        gpu.bindGroupLayout,
        gpu.pipeline,
        numLines * 6
      );
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [gpuDevice]);
  useEffect(() => {
    setupGpuCallback();
  }, [setupGpuCallback]);

  useEffect(() => {
    if (!gpuDevice || !canvasBufRef.current) return;
    gpuDevice.queue.writeBuffer(
      canvasBufRef.current,
      0,
      new Uint32Array([canvasDimensions.x, canvasDimensions.y])
    );
  }, [canvasDimensions.x, canvasDimensions.y, gpuDevice]);

  useEffect(() => {
    if (!gpuDevice || !boundsBufRef.current) return;
    gpuDevice.queue.writeBuffer(
      boundsBufRef.current,
      0,
      new Float32Array([bounds.left, bounds.right, bounds.bottom, bounds.top])
    );
  }, [bounds.left, bounds.right, bounds.bottom, bounds.top, gpuDevice]);

  if (gpuDevice === undefined) {
    // loading
    return <></>;
  } else if (gpuDevice) {
    // getGpu succeeded
    return (
      <>
        <DimensionedCanvas
          canvasDimensions={canvasDimensions}
          setCanvasDimensions={setCanvasDimensions}
          canvasRef={canvasRef}
        ></DimensionedCanvas>
        <br />
        <br />
        <button
          onClick={(e) => {
            e.preventDefault();
            const centerX = (bounds.right + bounds.left) / 2;
            const centerY = (bounds.bottom + bounds.top) / 2;
            const halfX = Math.abs(bounds.right - bounds.left) / 2;
            const halfY = Math.abs(bounds.top - bounds.bottom) / 2;
            const zoomStrength = 2.0;
            setBounds({
              left: centerX - zoomStrength * halfX,
              right: centerX + zoomStrength * halfX,
              bottom: centerY - zoomStrength * halfY,
              top: centerY + zoomStrength * halfY,
            });
          }}
        >
          Zoom Out
        </button>
        <br />
        <br />
        <button
          onClick={(e) => {
            e.preventDefault();
            const centerX = (bounds.right + bounds.left) / 2;
            const centerY = (bounds.bottom + bounds.top) / 2;
            const halfX = Math.abs(bounds.right - bounds.left) / 2;
            const halfY = Math.abs(bounds.top - bounds.bottom) / 2;
            const zoomStrength = 0.5;
            setBounds({
              left: centerX - zoomStrength * halfX,
              right: centerX + zoomStrength * halfX,
              bottom: centerY - zoomStrength * halfY,
              top: centerY + zoomStrength * halfY,
            });
          }}
        >
          Zoom In
        </button>
        <br />
        <br />
        <button
          onClick={(e) => {
            e.preventDefault();
            const moveStrength = 0.25;
            setBounds({
              left:
                bounds.left +
                moveStrength * Math.abs(bounds.right - bounds.left),
              right:
                bounds.right +
                moveStrength * Math.abs(bounds.right - bounds.left),
              bottom: bounds.bottom,
              top: bounds.top,
            });
          }}
        >
          Translate Left
        </button>
        <br />
        <br />
        <button
          onClick={(e) => {
            e.preventDefault();
            const moveStrength = 0.25;
            setBounds({
              left:
                bounds.left -
                moveStrength * Math.abs(bounds.right - bounds.left),
              right:
                bounds.right -
                moveStrength * Math.abs(bounds.right - bounds.left),
              bottom: bounds.bottom,
              top: bounds.top,
            });
          }}
        >
          Translate Right
        </button>
        <br />
        <br />
        <button
          onClick={(e) => {
            e.preventDefault();
            const moveStrength = 0.25;
            setBounds({
              left: bounds.left,
              right: bounds.right,
              bottom:
                bounds.bottom +
                moveStrength * Math.abs(bounds.right - bounds.left),
              top:
                bounds.top +
                moveStrength * Math.abs(bounds.right - bounds.left),
            });
          }}
        >
          Translate Low
        </button>
        <br />
        <br />
        <button
          onClick={(e) => {
            e.preventDefault();
            const moveStrength = 0.25;
            setBounds({
              left: bounds.left,
              right: bounds.right,
              bottom:
                bounds.bottom -
                moveStrength * Math.abs(bounds.right - bounds.left),
              top:
                bounds.top -
                moveStrength * Math.abs(bounds.right - bounds.left),
            });
          }}
        >
          Translate High
        </button>
      </>
    );
  } else {
    // getGpu failed
    return (
      <p>
        Couldn&apos;t create a WebGPU device. If refreshing the page does not
        work, then please use a browser that supports WebGPU.
      </p>
    );
  }
}
