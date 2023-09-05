struct Canvas {
  width: u32,
  height: u32
}
@group(0) @binding(0) var<uniform> canvas: Canvas;

struct Point {
  x: f32,
  y: f32,
  z: f32,
  w: f32,
  r: f32,
  g: f32,
  b: f32,
  alpha: f32
}
@group(0) @binding(1) var<uniform> points: array<Point, 6>;

fn line(length: f32, thickness: f32, theta: f32, start: vec2<f32>) -> array<vec2<f32>, 6> {
  var thick_scaling: f32;
  let canvas_height = f32(canvas.height);
  let canvas_width = f32(canvas.width);

  if (canvas_width > canvas_height) {
    thick_scaling = 2.0 / canvas_height;
  } else {
    thick_scaling = 2.0 / canvas_width;
  }

  let thick = thickness * thick_scaling;

  let rot = mat2x2<f32>(
    vec2<f32>(cos(theta), sin(theta)),
    vec2<f32>(-sin(theta), cos(theta))
  );

  let pos = array<vec2<f32>, 6>(
    rot * vec2<f32>(0.0,     0.5 * thick) + start,
    rot * vec2<f32>(0.0,    -0.5 * thick) + start,
    rot * vec2<f32>(length, -0.5 * thick) + start,
    rot * vec2<f32>(length,  0.5 * thick) + start,
    rot * vec2<f32>(length, -0.5 * thick) + start,
    rot * vec2<f32>(0.0,     0.5 * thick) + start,
  );

  return pos;
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>
}

@vertex
fn vertex_main(@builtin(vertex_index) v_i: u32) -> VertexOutput {
  let canvas_height = f32(canvas.height);
  let canvas_width = f32(canvas.width);

  var output: VertexOutput;
  output.position = vec4<f32>(
    points[v_i].x,
    points[v_i].y,
    0.0,
    1.0
  );
  output.color = vec4<f32>(
    points[v_i].r,
    points[v_i].g,
    points[v_i].b,
    points[v_i].alpha,
  );

  return output;
}

@fragment
fn fragment_main(input: VertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}