"use client";

import { useEffect, useState, useRef } from "react";
import shaderWgsl from "./shaders/shader.wgsl";

function Canvas({
  gpuDevice,
  numPoints,
}: {
  gpuDevice: GPUDevice;
  numPoints: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configBufferRef = useRef<GPUBuffer | null>(null);

  // write configBuffer effect
  useEffect(() => {
    if (!configBufferRef.current) {
      return;
    }
    gpuDevice.queue.writeBuffer(
      configBufferRef.current,
      0,
      new Uint32Array([numPoints])
    );
  }, [gpuDevice, numPoints]);

  // setup Canvas effect
  useEffect(() => {
    console.log("canvas useEffect called");
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("webgpu");
    if (!context) return;

    const gpuCanvasConfiguration = {
      device: gpuDevice,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: "premultiplied",
    } as GPUCanvasConfiguration;

    context.configure(gpuCanvasConfiguration);
    // const gpuDevice = gpuCanvasConfiguration.device;

    const bindGroupLayout = gpuDevice.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "storage",
          },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
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
        entryPoint: "vertex_main",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fragment_main",
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat(),
          },
        ],
      },
      primitive: {
        topology: "point-list",
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
    configBufferRef.current = configBuffer;

    const circleDataStride = 8;
    const maxCircles = 1024;
    const circlesBufferSizeInBytes =
      Float32Array.BYTES_PER_ELEMENT * circleDataStride * maxCircles;
    const circlesBuffer = gpuDevice.createBuffer({
      size: circlesBufferSizeInBytes,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    var pointsArr = [];
    for (let i = 0; i < maxCircles - 1; i++) {
      const x = i / maxCircles;
      const xp = (i + 1) / maxCircles;

      const y = x * x;
      const yp = xp * xp;

      pointsArr.push(xp - x, yp - y, x, y, 0.65, 0.85, 1.0, 0.0);
    }

    gpuDevice.queue.writeBuffer(circlesBuffer, 0, new Float32Array(pointsArr));
    gpuDevice.queue.writeBuffer(configBuffer, 0, new Uint32Array([0]));
    gpuDevice.queue.writeBuffer(dimBuffer, 0, dims);

    const startTime = Date.now();
    function frame() {
      if (!canvas || !context) return;

      const clearColor = { r: 1.0, g: 0.0, b: 1.0, a: 1.0 };
      const renderPassDescriptor = {
        colorAttachments: [
          {
            clearValue: clearColor,
            loadOp: "clear",
            storeOp: "store",
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
  }, [gpuDevice]);

  return (
    <canvas
      ref={canvasRef}
      style={{ margin: 10 }}
      width={512}
      height={512}
    ></canvas>
  );
}

export default function App() {
  // Undefined means that it is in the process of getting a GPU.
  // Null means that it failed to get a GPU
  const [gpuDevice, setGpuDevice] = useState<GPUDevice | null | undefined>(
    undefined
  );
  const [numPoints, setNumPoints] = useState(0);
  const minPoints = 0;
  const maxPoints = 1023;

  useEffect(() => {
    // Side effect for when getGpu() fails
    console.log("gpu useEffect called");
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
        <form action="">
          <input
            type="range"
            min={minPoints}
            max={maxPoints}
            value={numPoints}
            onChange={(e) => {
              e.preventDefault();
              setNumPoints(parseInt(e.currentTarget.value));
            }}
            id="myRange"
          ></input>
        </form>
        <Canvas gpuDevice={gpuDevice} numPoints={numPoints}></Canvas>
        {/* <Canvas gpuDevice={gpuDevice} numPoints={numPoints}></Canvas> */}
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
