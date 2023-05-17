'use client';

import { useEffect, useRef } from 'react';
import shaderWgsl from './shaders/shader.wgsl';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const gpuInit = async () => {
      if (!navigator.gpu) {
        return;
      }

      const gpuAdapter = await navigator.gpu.requestAdapter();
      if (!gpuAdapter) {
        return;
      }

      const gpuDevice = await gpuAdapter.requestDevice();

      const shaderModule = gpuDevice.createShaderModule({
        code: shaderWgsl,
      });

      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('webgpu');
      if (!context) return;

      context.configure({
        device: gpuDevice,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: 'premultiplied',
      });

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
        ] as Iterable<GPUBindGroupLayoutEntry>,
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

      const startTime = Date.now();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
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
          entries: [
            {
              binding: 0,
              resource: { buffer: dimBuffer },
            },
            {
              binding: 1,
              resource: { buffer: fragBuffer },
            },
          ],
        });

        gpuDevice.queue.writeBuffer(dimBuffer, 0, dims);
        gpuDevice.queue.writeBuffer(
          fragBuffer,
          0,
          new Float32Array([
            (Date.now() - startTime) / 1000,
            canvasWidth,
            canvasHeight,
          ])
        );

        const commandEncoder = gpuDevice.createCommandEncoder();
        const passEncoder =
          commandEncoder.beginRenderPass(renderPassDescriptor);

        passEncoder.setPipeline(renderPipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(canvasWidth * canvasHeight);
        passEncoder.end();

        gpuDevice.queue.submit([commandEncoder.finish()]);

        // requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    };

    gpuInit();
  }, []);

  return (
    <>
      <canvas
        style={{ margin: 10 }}
        ref={canvasRef}
        width={400}
        height={400}
      ></canvas>
    </>
  );
}
