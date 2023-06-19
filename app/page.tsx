'use client';

import { useEffect, useState, useRef } from 'react';
import shaderWgsl from './shaders/shader.wgsl';

function Canvas({
  gpuCanvasConfiguration,
}: {
  gpuCanvasConfiguration: GPUCanvasConfiguration;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('webgpu');
    if (!context) return;

    context.configure(gpuCanvasConfiguration);
    const gpuDevice = gpuCanvasConfiguration.device;

    const bindGroupLayout = gpuDevice.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: 'uniform',
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'uniform',
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'storage',
          },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'uniform',
          },
        },
      ] as Iterable<GPUBindGroupLayoutEntry>,
    });

    const shaderModule = gpuDevice.createShaderModule({
      code: shaderWgsl,
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
        topology: 'point-list',
      },
      layout: pipelineLayout,
    } as GPURenderPipelineDescriptor;
    const renderPipeline = gpuDevice.createRenderPipeline(pipelineDescriptor);

    const dims = new Uint32Array([canvas.width, canvas.height]);
    const dimBuffer = gpuDevice.createBuffer({
      size: dims.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    const fragBuffer = gpuDevice.createBuffer({
      size: 12,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
    });

    const configBuffer = gpuDevice.createBuffer({
      size: Uint32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const circleDataStride = 8;
    const maxCircles = 2;
    const circlesBufferSizeInBytes =
      Float32Array.BYTES_PER_ELEMENT * circleDataStride * maxCircles;
    const circlesBuffer = gpuDevice.createBuffer({
      size: circlesBufferSizeInBytes,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const startTime = Date.now();
    function frame() {
      if (!canvas || !context) return;

      const clearColor = { r: 1.0, g: 0.0, b: 1.0, a: 1.0 };
      const renderPassDescriptor = {
        colorAttachments: [
          {
            clearValue: clearColor,
            loadOp: 'clear',
            storeOp: 'store',
            view: context.getCurrentTexture().createView(),
          },
        ],
      } as GPURenderPassDescriptor;

      const bindGroup = gpuDevice.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: dimBuffer },
          },
          {
            binding: 1,
            resource: { buffer: fragBuffer },
          },
          {
            binding: 2,
            resource: { buffer: circlesBuffer },
          },
          {
            binding: 3,
            resource: { buffer: configBuffer },
          },
        ],
      });

      gpuDevice.queue.writeBuffer(
        circlesBuffer,
        0,
        new Float32Array([
          0.65, 0.85, 1.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.9, 0.6, 0.3, 0.1, 0.5,
          -0.5, 0.0, 0.0,
        ])
      );
      gpuDevice.queue.writeBuffer(configBuffer, 0, new Uint32Array([2]));
      gpuDevice.queue.writeBuffer(dimBuffer, 0, dims);
      gpuDevice.queue.writeBuffer(
        fragBuffer,
        0,
        new Float32Array([
          (Date.now() - startTime) / 1000,
          canvas.width,
          canvas.height,
        ])
      );

      const commandEncoder = gpuDevice.createCommandEncoder();
      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

      passEncoder.setPipeline(renderPipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.draw(canvas.width * canvas.height);
      passEncoder.end();

      gpuDevice.queue.submit([commandEncoder.finish()]);

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  });

  return (
    <canvas
      ref={canvasRef}
      style={{ margin: 10 }}
      width={640}
      height={360}
    ></canvas>
  );
}

function Gpu() {
  // Undefined means that it is in the process of getting a GPU.
  // Null means that it failed to get a GPU
  const [gpuDevice, setGpuDevice] = useState<GPUDevice | null | undefined>(
    undefined
  );

  useEffect(() => {
    // Side effect for when getGpu() fails
    const getGpuFail = () => {
      setGpuDevice(null);
      return null;
    };

    // getGpu() returns a promise of a gpu device if successful,
    // and also sets the gpuDevice state accordingly.
    // If unsuccessful it will return null
    const getGpu = () => {
      if (!navigator.gpu) {
        return getGpuFail();
      }

      const gpuDevicePromise = navigator.gpu
        .requestAdapter()
        .then((value) => {
          if (!value) {
            return getGpuFail();
          }
          const gpuAdapter = value;
          return gpuAdapter.requestDevice();
        })
        .then((value) => {
          if (!value) {
            return getGpuFail();
          }
          const gpuDevice = value;
          setGpuDevice(gpuDevice);
          return gpuDevice;
        })
        .catch((reason) => {
          console.log("Couldn't create gpu device: " + reason);
          return getGpuFail();
        });
      return gpuDevicePromise;
    };
    const gpuDevicePromise = getGpu();

    // Destructor for gpuDevice. It uses the gpuDevicePromise as a
    // unique reference to a gpu device
    return () => {
      const currentGpuDevice = gpuDevicePromise;
      const destroyGpuDevice = async () => {
        const gpuDevice = await currentGpuDevice;
        if (!gpuDevice) {
          return;
        }
        gpuDevice.destroy();
      };
      destroyGpuDevice();
      setGpuDevice(undefined); // assumes we are retrying
    };
  }, []);

  if (gpuDevice === undefined) {
    // loading
    return <></>;
  } else if (gpuDevice) {
    // getGpu succeeded

    const canvasConfig = {
      device: gpuDevice,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'premultiplied',
    } as GPUCanvasConfiguration;

    return (
      <>
        <Canvas gpuCanvasConfiguration={canvasConfig}></Canvas>
        <Canvas gpuCanvasConfiguration={canvasConfig}></Canvas>
      </>
    );
  } else {
    // getGpu failed
    return (
      <h1>
        Couldn&apos;t create a WebGPU device. If refreshing the page does not
        work, then please use a browser that supports WebGPU.
      </h1>
    );
  }
}

export default function Home() {
  const [numCircles, setNumCircles] = useState(0);
  const maxCircles = 2;

  return (
    <>
      <form action=''>
        <input
          type='range'
          min={0}
          max={maxCircles}
          value={numCircles}
          onChange={(e) => {
            e.preventDefault();
            setNumCircles(parseInt(e.currentTarget.value));
          }}
          id='myRange'
        ></input>
      </form>
      <Gpu></Gpu>
    </>
  );
}
