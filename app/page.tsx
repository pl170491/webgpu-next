// import Image from 'next/image';
// import { Inter } from 'next/font/google';

// const inter = Inter({ subsets: ['latin'] });

"use client";

import { useEffect, useRef, useState } from "react";
import shaderWgsl from "./shaders/shader.wgsl";

export default function Home() {
  const gpuRef = useRef<GPUDevice | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [backgroundColor, setBackgroundColor] = useState({
    r: 1.0,
    g: 0.0,
    b: 1.0,
    a: 1.0,
  });

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

      const vertices = new Float32Array([-1.0, -1.0, 1.0, 1.0]);

      const vertexBuffer = gpuDevice.createBuffer({
        size: vertices.byteLength, // make it big enough to store vertices in
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });

      gpuDevice.queue.writeBuffer(
        vertexBuffer,
        0,
        vertices,
        0,
        vertices.length
      );

      const vertexBuffers: Iterable<GPUVertexBufferLayout> = [
        {
          attributes: [
            {
              shaderLocation: 0, // position
              offset: 0,
              format: "float32x2",
            },
            // {
            //   shaderLocation: 1, // color
            //   offset: 16,
            //   format: "float32x4",
            // },
          ],
          arrayStride: 8,
        },
      ];

      const pipelineDescriptor: GPURenderPipelineDescriptor = {
        vertex: {
          module: shaderModule,
          entryPoint: "vertex_main",
          buffers: vertexBuffers,
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
          topology: "line-strip",
        },
        layout: "auto",
      };

      const renderPipeline = gpuDevice.createRenderPipeline(pipelineDescriptor);
      const commandEncoder = gpuDevice.createCommandEncoder();

      const clearColor = backgroundColor;

      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            clearValue: clearColor,
            loadOp: "clear",
            storeOp: "store",
            view: context?.getCurrentTexture().createView(),
          },
        ] as Iterable<GPURenderPassColorAttachment>,
      };

      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

      passEncoder.setPipeline(renderPipeline);
      passEncoder.setVertexBuffer(0, vertexBuffer);
      passEncoder.draw(0);
      passEncoder.end();

      gpuDevice.queue.submit([commandEncoder.finish()]);
    };
    gpuInit();
  }, [backgroundColor]);

  function handleClick() {
    const newColor = { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
    setBackgroundColor(newColor);
  }

  return (
    <>
      <canvas ref={canvasRef} width={800} height={600}></canvas>
      <button onClick={handleClick}>Click me</button>
    </>
  );
}
