struct Dimensions {
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
}