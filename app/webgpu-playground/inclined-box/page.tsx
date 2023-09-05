'use client';

import { useState, useRef, useCallback, useEffect, RefObject } from 'react';

import getGpu from './getGpu';
import DimensionedCanvas from './DimensionedCanvas';

import shaderWgsl from './shaders/basic.wgsl';

function gpuContext(
  gpuDevice: GPUDevice,
  canvas: HTMLCanvasElement
): GPUCanvasContext | null {
  const context = canvas.getContext('webgpu');
  if (!context) return null;

  const gpuCanvasConfiguration = {
    device: gpuDevice,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied',
  } as GPUCanvasConfiguration;

  context.configure(gpuCanvasConfiguration);

  return context;
}

function setupGpu(
  gpuDevice: GPUDevice,
  buffers: Iterable<GPUBuffer>
): { bindGroupLayout: GPUBindGroupLayout; pipeline: GPURenderPipeline } {
  const shaderModule = gpuDevice.createShaderModule({
    code: shaderWgsl,
  });

  const layoutEntries = (() => {
    const entries = [];

    const paramBufList = Array.from(buffers).map((_, i) => {
      return {
        binding: i,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: 'uniform',
        },
      };
    });
    entries.push(...paramBufList);
    return entries;
  })();

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
  return { bindGroupLayout: bindGroupLayout, pipeline: renderPipeline };
}

type GpuParams = {
  gpuDevice: GPUDevice;
  context: GPUCanvasContext;
  buffers: Iterable<GPUBuffer>;
  bindGroupLayout: GPUBindGroupLayout;
  pipeline: GPURenderPipeline;
};

function gpuDraw(params: GpuParams) {
  const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };
  const renderPassDescriptor = {
    colorAttachments: [
      {
        clearValue: clearColor,
        loadOp: 'clear',
        storeOp: 'store',
        view: params.context.getCurrentTexture().createView(),
      },
    ],
  } as GPURenderPassDescriptor;

  const entryList = (() => {
    const entries = [];
    const paramBufList = Array.from(params.buffers).map((buf, i) => {
      return {
        binding: i,
        resource: { buffer: buf },
      } as GPUBindGroupEntry;
    });

    entries.push(...paramBufList);
    return entries;
  })() as Iterable<GPUBindGroupEntry>;

  const bindGroup = params.gpuDevice.createBindGroup({
    layout: params.bindGroupLayout,
    entries: entryList,
  });

  const commandEncoder = params.gpuDevice.createCommandEncoder();
  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

  passEncoder.setPipeline(params.pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.draw(24);
  passEncoder.end();

  params.gpuDevice.queue.submit([commandEncoder.finish()]);
}

function getFrame(
  fn: Function,
  params: GpuParams,
  updateTimeRef: RefObject<(timeStamp: DOMHighResTimeStamp) => void | null>
): FrameRequestCallback {
  const frame = (timeStamp: DOMHighResTimeStamp) => {
    fn(params);
    if (updateTimeRef.current) updateTimeRef.current(timeStamp);
    requestAnimationFrame(frame);
  };

  return frame;
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

  // Should only go from 5 to 85 degrees
  const [incline, setIncline] = useState(45.0);

  const [reset, setReset] = useState(false);
  const [pause, setPause] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inclineBufRef = useRef<GPUBuffer | null>(null);
  const canvasBufRef = useRef<GPUBuffer | null>(null);
  const timeBufRef = useRef<GPUBuffer | null>(null);
  const updateTimeRef = useRef<((timeStamp: number) => void) | null>(null);

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
      size: 8,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    inclineBufRef.current = gpuDevice.createBuffer({
      size: 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    timeBufRef.current = gpuDevice.createBuffer({
      size: 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    const buffers = [
      canvasBufRef.current,
      timeBufRef.current,
      inclineBufRef.current,
    ];
    const gpu = setupGpu(gpuDevice, buffers);

    updateTimeRef.current = (() => {
      const timeStart = performance.now();
      return (timeStamp: number) => {
        if (!timeBufRef.current) return;
        gpuDevice.queue.writeBuffer(
          timeBufRef.current,
          0,
          new Uint32Array([Math.floor(timeStamp) - Math.floor(timeStart)])
        );
      };
    })();

    const frame = getFrame(
      gpuDraw,
      {
        gpuDevice: gpuDevice,
        context: context,
        buffers: buffers,
        bindGroupLayout: gpu.bindGroupLayout,
        pipeline: gpu.pipeline,
      },
      updateTimeRef
    );

    requestAnimationFrame(frame);
  }, [gpuDevice]);
  useEffect(() => {
    setupGpuCallback();
  }, [setupGpuCallback]);

  useEffect(() => {
    if (!gpuDevice || !inclineBufRef.current) return;
    gpuDevice.queue.writeBuffer(
      inclineBufRef.current,
      0,
      new Float32Array([incline])
    );
  }, [incline, gpuDevice]);

  useEffect(() => {
    if (!gpuDevice || !canvasBufRef.current) return;
    gpuDevice.queue.writeBuffer(
      canvasBufRef.current,
      0,
      new Float32Array([canvasDimensions.x, canvasDimensions.y])
    );
  }, [canvasDimensions.x, canvasDimensions.y, gpuDevice]);

  useEffect(() => {
    if (!gpuDevice) {
      return;
    }

    // (async () => {
    //   const timeBuf = timeBufRef.current;
    //   if (!timeBuf) return;

    //   await timeBuf.mapAsync(
    //     GPUMapMode.READ,
    //     0, // Offset
    //     4 // Length
    //   );

    //   const copyArrayBuffer = timeBuf.getMappedRange(0, 4);
    //   const data = copyArrayBuffer.slice(0, 4);
    //   timeBuf.unmap();
    //   console.log(new Uint32Array(data));
    // })();

    if (reset) {
      setReset(false);
      updateTimeRef.current = (() => {
        const timeStart = performance.now();
        return (timeStamp: number) => {
          if (!timeBufRef.current) return;
          gpuDevice.queue.writeBuffer(
            timeBufRef.current,
            0,
            new Uint32Array([Math.floor(timeStamp) - Math.floor(timeStart)])
          );
        };
      })();
    }
  }, [gpuDevice, reset, pause]);

  if (gpuDevice === undefined) {
    // loading
    return <></>;
  } else if (gpuDevice) {
    // getGpu succeeded
    return (
      <>
        <button
          onClick={(e) => {
            e.preventDefault();
            setReset(true);
          }}
        >
          Reset
        </button>
        <br />
        <DimensionedCanvas
          canvasDimensions={canvasDimensions}
          setCanvasDimensions={setCanvasDimensions}
          canvasRef={canvasRef}
        ></DimensionedCanvas>
        <br />
        <button
          onClick={(e) => {
            e.preventDefault();
            setIncline(Math.min(85.0, incline + 5.0));
          }}
        >
          Steepen by 5 degrees
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            setIncline(Math.max(5.0, incline - 5.0));
          }}
        >
          Shallow by 5 degrees
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
