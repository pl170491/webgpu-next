import { useState, useCallback, useEffect } from 'react';

export function gpuContext(
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

// Does not support read-write storage buffers yet
export function setupGpu(
  gpuDevice: GPUDevice,
  buffers: Iterable<GPUBuffer>,
  shaderWgsl: string
): { bindGroupLayout: GPUBindGroupLayout; pipeline: GPURenderPipeline } {
  const shaderModule = gpuDevice.createShaderModule({
    code: shaderWgsl,
  });

  const layoutEntries = (() => {
    const entries = [];

    const paramBufList = Array.from(buffers).map((buf, i) => {
      const bufUsage = Array.from(
        buf.usage.toString(2).padStart(16, '0')
      ).reverse();

      const bindGroupEntry = {
        binding: i,
        visibility: GPUShaderStage.VERTEX,
        buffer: {
          type: 'uniform',
        },
      };

      if (bufUsage[7] == '1') {
        bindGroupEntry.buffer.type = 'read-only-storage';
      } else if (bufUsage[6] == '1') {
        bindGroupEntry.buffer.type = 'uniform';
      } else {
        bindGroupEntry.buffer.type = 'uniform';
      }

      return bindGroupEntry;
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

export function gpuDraw(
  gpuDevice: GPUDevice,
  context: GPUCanvasContext,
  buffers: Iterable<GPUBuffer>,
  bindGroupLayout: GPUBindGroupLayout,
  pipeline: GPURenderPipeline,
  numVertices: number
) {
  const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 0.0 };
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

  const entryList = (() => {
    const entries = [];
    const paramBufList = Array.from(buffers).map((buf, i) => {
      return {
        binding: i,
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

  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.draw(numVertices);
  passEncoder.end();

  gpuDevice.queue.submit([commandEncoder.finish()]);
}

export function getGpu(setGpuDevice: Function) {
  if (!navigator.gpu) {
    setGpuDevice(null);
    return () => {
      return;
    };
  }

  const getGpuFail = () => {
    setGpuDevice(null);
    return null;
  };

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
}

export function useGpuDevice() {
  // Undefined means that it is in the process of getting a GPU.
  // Null means that it failed to get a GPU
  const [gpuDevice, setGpuDevice] = useState<GPUDevice | null | undefined>(
    undefined
  );

  // Get GPU Device
  const getGpuCallback = useCallback(() => {
    return getGpu(setGpuDevice);
  }, []);
  useEffect(() => {
    return getGpuCallback();
  }, [getGpuCallback]);

  return gpuDevice;
}
