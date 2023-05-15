@vertex
fn vertex_main(@location(0) pos: vec4<f32>) -> @builtin(position) vec4<f32> {
    return vec4<f32>(pos[0], pos[1], 0.0, 2.0);
}

// fragment shader

@fragment
fn fragment_main() -> @location(0) vec4<f32> {
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}