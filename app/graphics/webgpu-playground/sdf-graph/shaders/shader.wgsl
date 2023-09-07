struct Dimensions {
  x: u32,
  y: u32
}

@group(0) @binding(0) var<uniform> dims: Dimensions;

@vertex
fn vertex_main(@builtin(vertex_index) vert_i: u32) -> @builtin(position) vec4<f32> {
  // Get coordinates with the point (0,0) at bottom left
  let y_coord = vert_i / dims.x;
  let x_coord = vert_i - y_coord * dims.x;

  // Transform coordinates such that the point (0,0) is in the middle
  let x_signed = i32(2 * x_coord) - i32(dims.x);
  let y_signed = i32(2 * y_coord) - i32(dims.y);

  // Normalize such that ranges are [-1.0, 1.0) and each coordinate is centered within each pixel
  let x_norm = (f32(x_signed) + 0.5) / f32(dims.x);
  let y_norm = (f32(y_signed) + 0.5) / f32(dims.y);

  // Make (-1.0, -1.0) correspond with top left corner to match fragment shader
  return vec4<f32>(x_norm, -y_norm, 0.0, 1.0);
}

// fragment shader

struct Uniform {
  time: f32,
  width: f32,
  height: f32
}

struct SegmentData {
  vector: vec2<f32>,
  position: vec2<f32>,
  color: vec3<f32>,
  mem_pad: f32
}
struct SegmentsBuffer {
  segments: array<SegmentData>
}

struct Config {
  num_points: u32
}

@group(0) @binding(1) var<uniform> uniforms: Uniform;
@group(0) @binding(2) var<storage, read_write> segments_buffer: SegmentsBuffer;
@group(0) @binding(3) var<uniform> config: Config;

// Make bottom-left be (0, 0)
fn fragCoord(vertex_coord: vec2<f32>, u_resolution: vec2<f32>) -> vec2<f32> {
  return vec2<f32>(vertex_coord.x, (u_resolution.y - vertex_coord.y));
}

fn plot(st: vec2<f32>, f_x: f32) -> f32 {
  return 1.0 - smoothstep(0.0, 0.01, abs(st.y - f_x));
}

fn sdBox(p: vec2<f32>, b: vec2<f32>) -> f32 {
  let d = abs(p) - b;
  return length(max(d, vec2<f32>(0.0, 0.0))) + min(max(d.x, d.y), 0.0);
}

fn sdOrientedBox(p: vec2<f32>, b: vec2<f32>) -> f32 {
  let d = abs(p) - b;
  return length(max(d, vec2<f32>(0.0, 0.0))) + min(max(d.x, d.y), 0.0);
}

fn sdCircle(p: vec2<f32>, r: f32) -> f32 {
  return length(p) - r;
}

fn udSegment(p: vec2<f32>, v: vec2<f32>) -> f32 {
  let h = clamp( dot(p, v) / dot(v, v), 0.0, 1.0 );
  return length( p - h*v );
}

@fragment
fn fragment_main(@builtin(position) vertex_coord: vec4<f32>) -> @location(0) vec4<f32> {
  let u_time = uniforms.time;
  let u_resolution = vec2<f32>(uniforms.width, uniforms.height);
  // let frag_coord = fragCoord(vertex_coord.xy, u_resolution);
  let frag_coord = vertex_coord.xy;

  // p is distance from center of canvas with range of [0, 1.0], normalized to the y-axis resolution
  let p  = frag_coord / u_resolution.y;
  // let animation = vec2<f32>(0.1 * cos(u_time), 0.1 * sin(u_time));

  var col = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  for (var i: u32 = 0; i < config.num_points; i++) {
    let segment = segments_buffer.segments[i];
    let d = udSegment(p - (segment.position), segment.vector) - 0.01;
    // if (d < 0.0) {
    //   col = vec4<f32>(segment.color, 1.0);
    // }
    col = vec4<f32>(segment.color, 1.0) * step(0.0, -d) + col * step(0.0, d);
  }

  return col;
  // return vec4<f32>(p, 0.0, 1.0);
}