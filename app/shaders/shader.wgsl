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

@fragment
fn fragment_main(@builtin(position) pos: vec4<f32>) ->  @location(0) vec4<f32> {
    return vec4<f32>(1.0, 0.0, 1.0, 1.0);
}