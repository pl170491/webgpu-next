struct Util {
  time: f32,
  width: f32,
  height: f32
}
@group(0) @binding(0) var<uniform> utils: Util;

struct Line {
  width: f32
}
@group(0) @binding(1) var<uniform> line: Line;

struct LineLength {
  length: f32
}
@group(0) @binding(2) var<uniform> line_length: LineLength;

@vertex
fn vertex_main(@builtin(vertex_index) VertexIndex: u32) -> @builtin(position) vec4<f32> {
  let time = utils.time;

  let theta = time;
  let rot = mat2x2<f32>(
    vec2<f32>(cos(theta), sin(theta)),
    vec2<f32>(-sin(theta), cos(theta))
  );

  let scale = mat2x2<f32>(
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, utils.width / utils.height)
  );

  let width = line_length.length * 0.1;
  let height = line.width * 2.0 / utils.width;
  
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(0.0, height),
    vec2<f32>(width, 0.0),
    vec2<f32>(width, height),
    vec2<f32>(width, 0.0),
    vec2<f32>(0.0, height)
  );
  return vec4<f32>(
    scale * rot * (pos[VertexIndex] - vec2<f32>(0.5 * width, 0.5 * height)),
    0.0,
    1.0
  );
}

@fragment
fn fragment_main() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}