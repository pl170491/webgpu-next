'use client';

import { useState, useRef, useCallback, useEffect, RefObject } from 'react';

import getGpu from './getGpu';
import DimensionedCanvas from './DimensionedCanvas';

import shaderWgsl from './shaders/basic.wgsl';

function setupGpu(
  gpuDevice: GPUDevice,
  canvasRef: RefObject<HTMLCanvasElement>
) {
  if (!gpuDevice) return;

  const canvas = canvasRef.current;
  if (!canvas) return;

  const context = canvas.getContext('webgpu');
  if (!context) return;

  const gpuCanvasConfiguration = {
    device: gpuDevice,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied',
  } as GPUCanvasConfiguration;

  context.configure(gpuCanvasConfiguration);

  const shaderModule = gpuDevice.createShaderModule({
    code: shaderWgsl,
  });

  const bindGroupLayout = gpuDevice.createBindGroupLayout({
    entries: [] as Iterable<GPUBindGroupLayoutEntry>,
  });

  const pipelineLayout = gpuDevice.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });
  const pipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: 'vertex_main',
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragment_main',
      targets: [
        {
          format: navigator.gpu.getPreferredCanvasFormat(),
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
    },
    layout: pipelineLayout,
  } as GPURenderPipelineDescriptor;
  const renderPipeline = gpuDevice.createRenderPipeline(pipelineDescriptor);

  function frame() {
    if (!canvas || !context || !gpuDevice) return;

    const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };
    const renderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: clearColor,
          loadOp: 'clear',
          storeOp: 'store',
          view: context?.getCurrentTexture().createView(),
        },
      ],
    } as GPURenderPassDescriptor;

    const bindGroup = gpuDevice.createBindGroup({
      layout: bindGroupLayout,
      entries: [],
    });

    const commandEncoder = gpuDevice.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    passEncoder.setPipeline(renderPipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.draw(3);
    passEncoder.end();

    gpuDevice.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

export default function App() {
  // Undefined means that it is in the process of getting a GPU.
  // Null means that it failed to get a GPU
  const [gpuDevice, setGpuDevice] = useState<GPUDevice | null | undefined>(
    undefined
  );
  const [canvasDimensions, setCanvasDimensions] = useState({
    x: 256,
    y: 256,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get GPU Device
  const getGpuCallback = useCallback(() => {
    return getGpu(setGpuDevice);
  }, []);
  useEffect(() => {
    return getGpuCallback();
  }, [getGpuCallback]);

  // Set up the GPU
  const setupGpuCallback = useCallback(() => {
    if (!gpuDevice) return;
    return setupGpu(gpuDevice, canvasRef);
  }, [gpuDevice, canvasRef]);
  useEffect(() => {
    setupGpuCallback();
  }, [setupGpuCallback]);

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
