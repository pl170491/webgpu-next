// import Image from 'next/image';
// import { Inter } from 'next/font/google';

// const inter = Inter({ subsets: ['latin'] });

"use client";

import { useEffect, useRef, useState } from "react";
import shaderWgsl from "./shaders/shader.wgsl";

export default function Home() {
  const gpuRef = useRef<GPUDevice | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasDim, setCanvasDim] = useState({ x: 400, y: 300 });

  useEffect(() => {
    const gpuInit = async () => {
      if (!navigator.gpu) {
        gpuRef.current = null;
        return;
      }

      const gpuAdapter = await navigator.gpu.requestAdapter();
      if (!gpuAdapter) {
        gpuRef.current = null;
        return;
      }

      const gpuDevice = await gpuAdapter.requestDevice();
      gpuRef.current = gpuDevice;

      const shaderModule = gpuDevice.createShaderModule({
        code: shaderWgsl,
      });

      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("webgpu");
      if (!context) return;

      context.configure({
        device: gpuDevice,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: "premultiplied",
      });

      const bindGroupLayout = gpuDevice.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
              type: "uniform",
            },
          },
        ],
      });

      const pipelineLayout = gpuDevice.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      });
      const pipelineDescriptor: GPURenderPipelineDescriptor = {
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
      };
      const renderPipeline = gpuDevice.createRenderPipeline(pipelineDescriptor);

      const dims = new Uint32Array([canvasDim.x, canvasDim.y]);
      const dimBuffer = gpuDevice.createBuffer({
        size: dims.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      });

      const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };
      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            clearValue: clearColor,
            loadOp: "clear",
            storeOp: "store",
            view: undefined,
          },
        ] as Iterable<GPURenderPassColorAttachment>,
      };

      function frame() {
        const bindGroup = gpuDevice.createBindGroup({
          layout: bindGroupLayout,
          entries: [
            {
              binding: 0,
              resource: { buffer: dimBuffer },
            },
          ],
        });

        renderPassDescriptor.colorAttachments[0].view = context
          ?.getCurrentTexture()
          .createView();

        gpuDevice.queue.writeBuffer(dimBuffer, 0, dims);
        const commandEncoder = gpuDevice.createCommandEncoder();
        const passEncoder =
          commandEncoder.beginRenderPass(renderPassDescriptor);

        passEncoder.setPipeline(renderPipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(canvasDim.x * canvasDim.y);
        passEncoder.end();

        gpuDevice.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    };
    gpuInit();
  }, [canvasDim]);

  return (
    <>
      <canvas
        style={{ margin: 20 }}
        ref={canvasRef}
        width={canvasDim.x}
        height={canvasDim.y}
      ></canvas>
    </>
  );
}
