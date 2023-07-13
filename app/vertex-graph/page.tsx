'use client';

import { useState, useRef, useCallback, useEffect, RefObject } from 'react';

import getGpu from './getGpu';
import DimensionedCanvas from './DimensionedCanvas';

import shaderWgsl from './shaders/basic.wgsl';

function setupGpu(
  gpuDevice: GPUDevice,
  canvasRef: RefObject<HTMLCanvasElement>,
  lineBuf: GPUBuffer,
  widthBuf: GPUBuffer
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

  const layoutEntries = [
    {
      binding: 0,
      visibility: GPUShaderStage.VERTEX,
      buffer: {
        type: 'uniform',
      },
    },
    {
      binding: 1,
      visibility: GPUShaderStage.VERTEX,
      buffer: {
        type: 'uniform',
      },
    },
    {
      binding: 2,
      visibility: GPUShaderStage.VERTEX,
      buffer: {
        type: 'uniform',
      },
    },
  ];

  const bindGroupLayout = gpuDevice.createBindGroupLayout({
    entries: layoutEntries as Iterable<GPUBindGroupLayoutEntry>,
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

  const utilBuffer = gpuDevice.createBuffer({
    size: 12,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
  });

  const startTime = Date.now();
  var frameTime = startTime;
  function frame() {
    if (!canvas || !context || !gpuDevice) return;

    frameTime = Date.now();

    gpuDevice.queue.writeBuffer(
      utilBuffer,
      0,
      new Float32Array([
        (frameTime - startTime) / 1000,
        canvas.width,
        canvas.height,
      ])
    );

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

    const entryList = [
      {
        binding: 0,
        resource: { buffer: utilBuffer },
      },
      {
        binding: 1,
        resource: { buffer: lineBuf },
      },
      {
        binding: 2,
        resource: { buffer: widthBuf },
      },
    ] as Iterable<GPUBindGroupEntry>;
    const bindGroup = gpuDevice.createBindGroup({
      layout: bindGroupLayout,
      entries: entryList,
    });

    const commandEncoder = gpuDevice.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    passEncoder.setPipeline(renderPipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.draw(6);
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
  const [thick, setThick] = useState(1.0);
  const [length, setLength] = useState(1.0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lineBufRef = useRef<GPUBuffer | null>(null);
  const widthBufRef = useRef<GPUBuffer | null>(null);

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
    lineBufRef.current = gpuDevice.createBuffer({
      size: 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    widthBufRef.current = gpuDevice.createBuffer({
      size: 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    return setupGpu(
      gpuDevice,
      canvasRef,
      lineBufRef.current,
      widthBufRef.current
    );
  }, [gpuDevice, canvasRef]);
  useEffect(() => {
    setupGpuCallback();
  }, [setupGpuCallback]);

  useEffect(() => {
    if (!gpuDevice || !lineBufRef.current) return;
    gpuDevice.queue.writeBuffer(
      lineBufRef.current,
      0,
      new Float32Array([thick])
    );
  }, [thick, gpuDevice]);

  useEffect(() => {
    if (!gpuDevice || !widthBufRef.current) return;
    gpuDevice.queue.writeBuffer(
      widthBufRef.current,
      0,
      new Float32Array([length])
    );
  }, [length, gpuDevice]);

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
        <button
          onClick={(e) => {
            e.preventDefault();
            setThick(thick + 1.0);
          }}
        >
          Thicken by 1.0
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!(thick < 2.0)) {
              setThick(thick - 1.0);
            }
          }}
        >
          Narrow by 1.0
        </button>
        <br />
        <button
          onClick={(e) => {
            e.preventDefault();
            setLength(length + 1.0);
          }}
        >
          Lengthen by 1.0
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!(length < 2.0)) {
              setLength(length - 1.0);
            }
          }}
        >
          Shorten by 1.0
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
