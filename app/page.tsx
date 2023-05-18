'use client';

import { useEffect, useState, useRef } from 'react';
import shaderWgsl from './shaders/basic.wgsl';

function Canvas({ gpuDevice }: { gpuDevice: GPUDevice }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('webgpu');
    if (!context) return;

    context.configure({
      device: gpuDevice,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'premultiplied',
    });

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
        topology: 'point-list',
      },
      layout: pipelineLayout,
    } as GPURenderPipelineDescriptor;
    const renderPipeline = gpuDevice.createRenderPipeline(pipelineDescriptor);

    function frame() {
      const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };
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
      passEncoder.draw(1);
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
      width={400}
      height={400}
    ></canvas>
  );
}

export default function Home() {
  // undefined means that it is in the process of getting a GPU
  // null means that it failed to get a GPU
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
    return (
      <>
        <Canvas gpuDevice={gpuDevice}></Canvas>
        <Canvas gpuDevice={gpuDevice}></Canvas>
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
