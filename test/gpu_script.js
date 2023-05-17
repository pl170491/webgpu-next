const shaderWgsl = `struct Dimensions {
  x: u32,
  y: u32
}

@group(0) @binding(0) var<uniform> dims: Dimensions;

@vertex
fn vertex_main(@builtin(vertex_index) vert_i: u32) -> @builtin(position) vec4<f32> {
  // Get coordinates with (0,0) at top left
  let y_coord = vert_i / dims.x;
  let x_coord = vert_i - y_coord * dims.x;

  // Transform coordinates such that (0,0) is in the middle
  let x_signed = i32(2 * (x_coord + 1)) - i32(dims.x); // don't ask me why the '+1' fixes this
  let y_signed = i32(2 * y_coord) - i32(dims.y);

  // Normalize such that ranges are [-1.0, 1.0]
  let x_norm = f32(x_signed) / f32(dims.x); 
  let y_norm = f32(y_signed) / f32(dims.y);

  return vec4<f32>(x_norm, y_norm, 0.0, 1.0);
}

// fragment shader

struct Uniform {
  time: f32,
  width: f32,
  height: f32
}

@group(0) @binding(1) var<uniform> uniforms: Uniform;

fn get_st(coord_xy: vec2<f32>, u_resolution: vec2<f32>) -> vec2<f32> {
  return vec2<f32>(coord_xy.x / u_resolution.x, (u_resolution.y - coord_xy.y ) / u_resolution.y);
}

fn plot(st: vec2<f32>, f_x: f32) -> f32 {
  return 1.0 - smoothstep(0.0, 0.01, abs(st.y - f_x));
}

@fragment
fn fragment_main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
  let u_time = uniforms.time;
  let u_resolution = vec2<f32>(uniforms.width, uniforms.height);

  let st = get_st(coord.xy, u_resolution);
  let f_x = smoothstep(0.1, 0.9, st.x);

  let pct = plot(st, f_x);
  return vec4<f32>(pct * vec3<f32>(0.0, 1.0, 0.0),  1.0);
}`;

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

  const canvas = document.querySelector("#gpuCanvas");
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
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: {
          type: "uniform",
        },
      },
    ],
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
  };
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
  function frame() {
    const clearColor = { r: 0.0, g: 0.0, b: 0.0, a: 1.0 };
    const renderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: clearColor,
          loadOp: "clear",
          storeOp: "store",
          view: context.getCurrentTexture().createView(),
        },
      ],
    };

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

    // requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

gpuInit();
