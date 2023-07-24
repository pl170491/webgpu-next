struct Canvas {
  width: f32,
  height: f32
}
@group(0) @binding(0) var<uniform> canvas: Canvas;

struct Time {
  t: u32
}
@group(0) @binding(1) var<uniform> time: Time;

struct Incline {
  angle: f32
}
@group(0) @binding(2) var<uniform> incline: Incline;

fn line(length: f32, thickness: u32, theta: f32, start: vec2<f32>) -> array<vec2<f32>, 6> {
  var thick_scaling: f32;

  if (canvas.width > canvas.height) {
    thick_scaling = 2.0 / canvas.height;
  } else {
    thick_scaling = 2.0 / canvas.width;
  }

  let thick = f32(thickness) * thick_scaling;

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

fn box(half_length: f32, half_height: f32, theta: f32, offset: vec2<f32>) -> array<vec2<f32>, 6> {
  let rot = mat2x2<f32>(
    vec2<f32>(cos(theta), sin(theta)),
    vec2<f32>(-sin(theta), cos(theta))
  );

  let pos = array<vec2<f32>, 6>(
    rot * vec2<f32>(-half_length, -half_height) + offset,
    rot * vec2<f32>(-half_length, half_height) + offset,
    rot * vec2<f32>(half_length, -half_height) + offset,
    rot * vec2<f32>(half_length, half_height) + offset,
    rot * vec2<f32>(half_length, -half_height) + offset,
    rot * vec2<f32>(-half_length, half_height) + offset
  );

  return pos;
}

fn unit_vector(theta: f32) -> vec2<f32> {
  return vec2<f32>(cos(theta), sin(theta));
}

@vertex
fn vertex_main(@builtin(vertex_index) VertexIndex: u32) -> @builtin(position) vec4<f32> {
  let canvas_width = canvas.width;
  let canvas_height = canvas.height;
  let t = f32(time.t) / 1000.0;
  // let t = f32(0) / 1000.0;

  let theta = incline.angle;

  var line_theta: f32;
  var line_length: f32;
  var line_offset: vec2<f32>;

  if(theta > 45.0) {
    line_length = 0.9 / sin(radians(theta));
    line_theta = -radians(theta);
    line_offset = vec2<f32>(0.0, 0.9);
  } else {
    line_theta = radians(180.0 - theta);
    line_length = 0.9 / cos(radians(theta));
    line_offset = vec2<f32>(0.9, 0.0);
  }
  
  var pos: array<vec2<f32>, 24>;
  let line_0 = line(line_length, 2, line_theta, line_offset);
  for (var i = 0; i < 6; i++) {
    pos[i] = line_0[i];
  }

  let line_1 = line(1.0, 2, radians(90.0), vec2<f32>(0.0, 0.0));
  for (var i = 0; i < 6; i++) {
    pos[i + 6] = line_1[i];
  }

  let line_2 = line(1.0, 2, 0.0, vec2<f32>(0.0, 0.0));
  for (var i = 0; i < 6; i++) {
    pos[i + 12] = line_2[i];
  }

  let position = min((0.5 * 9.81 * sin(radians(theta)) * t * t), line_length);

  let box_0 = box(
    0.075,
    0.05,
    -radians(theta),
    vec2<f32>(0.0, min(0.9, 0.9 / tan(radians(90 - theta)))) + 0.05 * unit_vector(radians(90.0 - theta)) + position * unit_vector(radians(-theta))
  );
  for (var i = 0; i < 6; i++) {
    pos[i + 18] = box_0[i];
  }

  // (
  //   line(width, 2, -theta, vec2<f32>(0.0, 0.5)),
  //   line(1.0, 2, 90.0, vec2<f32>(0.0, 0.0)),
  //   line(1.0, 2, 0.0, vec2<f32>(0.0, 0.0))
  // );

  var scale: mat2x2<f32>;
  if (canvas.height > canvas.width) {
    scale = mat2x2<f32>(
      vec2<f32>(1.0, 0.0),
      vec2<f32>(0.0, canvas.width / canvas.height)
    );
  } else {
    scale = mat2x2<f32>(
      vec2<f32>(canvas.height / canvas.width, 0.0),
      vec2<f32>(0.0, 1.0)
    );
  }
  
  return vec4<f32>(
    scale * (1.5 * (pos[VertexIndex] - vec2<f32>(0.5, 0.5))),
    0.0,
    1.0
  );
}

@fragment
fn fragment_main() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}