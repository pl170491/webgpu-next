struct Canvas {
  width: u32,
  height: u32
}
@group(0) @binding(0) var<uniform> canvas: Canvas;

struct LineData {
  x0: f32,
  y0: f32,
  x1: f32,
  y1: f32
}
struct LinesBuffer {
  lines: array<LineData>
}
@group(0) @binding(1) var<storage, read> lines: LinesBuffer;

@group(0) @binding(2) var<uniform> num_lines: u32;

struct Bounds {
  left: f32,
  right: f32,
  bottom: f32,
  top: f32
}
@group(0) @binding(3) var<uniform> bounds: Bounds;

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
    rot * vec2<f32>(0.0, 0.5 * thick) + start,
    rot * vec2<f32>(0.0, -0.5 * thick) + start,
    rot * vec2<f32>(length, -0.5 * thick) + start,
    rot * vec2<f32>(length, 0.5 * thick) + start,
    rot * vec2<f32>(length, -0.5 * thick) + start,
    rot * vec2<f32>(0.0, 0.5 * thick)+ start
  );

  return pos;
}

fn unit_vector(theta: f32) -> vec2<f32> {
  return vec2<f32>(cos(theta), sin(theta));
}

fn theta(vector: vec2<f32>) -> f32 {
  return atan(vector.y / vector.x);
}

@vertex
fn vertex_main(@builtin(vertex_index) v_i: u32) -> @builtin(position) vec4<f32> {
  let canvas_height = f32(canvas.height);
  let canvas_width = f32(canvas.width);

  let bound_center = vec2<f32>((bounds.right + bounds.left) / 2.0, (bounds.top + bounds.bottom) / 2.0);
  let bound_lengths = vec2<f32>((bounds.right - bounds.left) / 2.0, (bounds.top - bounds.bottom) / 2.0);

  let line_data = lines.lines[v_i / 6];
  let p0 = vec2<f32>(line_data.x0, line_data.y0);
  let p1 = vec2<f32>(line_data.x1, line_data.y1);
  let v = p1 - p0;

  let line = line(
    length(v),
    2.0 * min(bound_lengths.x, bound_lengths.y),
    theta(v),
    p0
  );

  var canvas_scale: mat2x2<f32>;
  if (canvas_height > canvas_width) {
    canvas_scale = mat2x2<f32>(
      vec2<f32>(1.0, 0.0),
      vec2<f32>(0.0, canvas_width / canvas_height)
    );
  } else {
    canvas_scale = mat2x2<f32>(
      vec2<f32>(canvas_height / canvas_width, 0.0),
      vec2<f32>(0.0, 1.0)
    );
  }  

  let view_scale = mat2x2<f32>(
    vec2<f32>( 1.0 / bound_lengths.x, 0.0, ),
    vec2<f32>( 0.0, 1.0 / bound_lengths.y, ),
  );
  
  return vec4<f32>(
    canvas_scale * view_scale * (line[v_i - (v_i / 6) * 6] + bound_center),
    0.0,
    1.0
  );
}

@fragment
fn fragment_main() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}