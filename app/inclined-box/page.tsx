'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  RefObject,
  Dispatch,
  SetStateAction,
} from 'react';

import getGpu from './getGpu';
import DimensionedCanvas from './DimensionedCanvas';

import shaderWgsl from './shaders/basic.wgsl';

function setupGpu(
  gpuDevice: GPUDevice,
  canvasRef: RefObject<HTMLCanvasElement>,
  timeStartBuf: GPUBuffer,
  setTimeStartCallback: Dispatch<SetStateAction<number>>,
  parameterBuffers: Iterable<GPUBuffer>
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

  const layoutEntries = (() => {
    const entries = [
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
    ];

    let i = 0;
    for (const _ of parameterBuffers) {
      i = i + 2;
      entries.push({
        binding: i,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: 'uniform',
        },
      });
    }
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

  const utilBuffer = gpuDevice.createBuffer({
    size: 12,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
  });

  setTimeStartCallback(Date.now());
  function frame() {
    if (!canvas || !context || !gpuDevice) return;

    gpuDevice.queue.writeBuffer(
      utilBuffer,
      0,
      new Float32Array([Date.now(), canvas.width, canvas.height])
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

    const entryList = (() => {
      const entries = [
        {
          binding: 0,
          resource: { buffer: utilBuffer },
        } as GPUBindGroupEntry,
        {
          binding: 1,
          resource: { buffer: timeStartBuf },
        } as GPUBindGroupEntry,
      ];
      const paramBufList = Array.from(parameterBuffers).map((buf, i) => {
        return {
          binding: i + 2,
          resource: { buffer: buf },
        } as GPUBindGroupEntry;
      });

      entries.push(...paramBufList);
      return entries;
    })() as Iterable<GPUBindGroupEntry>;

    const bindGroup = gpuDevice.createBindGroup({
      layout: bindGroupLayout,
      entries: entryList,
    });

    const commandEncoder = gpuDevice.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    passEncoder.setPipeline(renderPipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.draw(24);
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

  // Should only go from 5 to 85 degrees
  const [incline, setIncline] = useState(45.0);
  const [timeStart, setTimeStart] = useState(0.0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inclineBufRef = useRef<GPUBuffer | null>(null);
  const timeStartBufRef = useRef<GPUBuffer | null>(null);

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
    timeStartBufRef.current = gpuDevice.createBuffer({
      size: 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    inclineBufRef.current = gpuDevice.createBuffer({
      size: 4,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });
    return setupGpu(
      gpuDevice,
      canvasRef,
      timeStartBufRef.current,
      setTimeStart,
      [inclineBufRef.current]
    );
  }, [gpuDevice, canvasRef]);
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
    if (!gpuDevice || !timeStartBufRef.current) return;
    gpuDevice.queue.writeBuffer(
      timeStartBufRef.current,
      0,
      new Float32Array([timeStart])
    );
  }, [timeStart, gpuDevice]);

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
            setTimeStart(Date.now());
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
